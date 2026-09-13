export const runtime = 'nodejs';
export const maxDuration = 60;

const BASE_URL = 'https://servicios.pami.org.ar/vademecum';
const LIST_URL = `${BASE_URL}/views/consultaPublica/listado.zul`;
const PAMI_ORIGIN = 'https://servicios.pami.org.ar';

// The PAMI logo placeholder GIF served by ZK when there is no product image.
// It is a 201x168 GIF, exactly 4502 bytes.
const PLACEHOLDER_SIZE = 4502;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── helpers ──────────────────────────────────────────────────────────────────

function extractZkauUrl(html) {
  const m = html.match(/uu\s*:\s*'((?:[^'\\]|\\.)*)'/);
  if (!m) return null;
  const path = m[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16))
  );
  return PAMI_ORIGIN + path;
}

function extractDtid(html) {
  const m = html.match(/dt\s*:\s*'([^']+)'/);
  return m ? m[1] : null;
}

function extractSession(response) {
  const raw = response.headers.get('set-cookie') ?? '';
  const m = raw.match(/JSESSIONID=([^;]+)/);
  return m ? m[1] : null;
}

function buildAuBody(dtid, commands) {
  const p = new URLSearchParams();
  p.set('dtid', dtid);
  commands.forEach((cmd, i) => {
    p.set(`cmd_${i}`, cmd.cmd);
    p.set(`uuid_${i}`, cmd.uuid);
    p.set(`data_${i}`, JSON.stringify(cmd.data ?? {}));
  });
  return p.toString();
}

/**
 * Parse the ZK mixed-JS/JSON response.
 *
 * Returns an array of objects with fields:
 *   registro, laboratorio, nombreComercial, forma, presentacion, codigoBarras, droga, imageSrc
 *
 * Labels appear in document order, 7 per row:
 *   [registro, laboratorio, nombreComercial, forma, presentacion, codigoBarras, droga]
 *
 * Images appear in the same order as rows (1 per row).
 */
function parseResults(zkText) {
  if (
    zkText.includes('búsqueda no ha devuelto resultados') ||
    zkText.includes('no ha devuelto')
  ) {
    return { rows: [] };
  }

  // ZK list uses zul.grid.Row
  const rowChunks = zkText.split(/(?='zul\.grid\.Row')/);
  
  if (rowChunks.length <= 1) {
    return null;
  }

  const rows = [];
  for (let i = 1; i < rowChunks.length; i++) {
    const chunk = rowChunks[i];
    
    // Extract labels for this specific row
    const labelRe = /'zul\.wgt\.Label','[^']+',\{[^}]*value:'((?:[^'\\]|\\.)*)'/g;
    const labels = [];
    let m;
    while ((m = labelRe.exec(chunk)) !== null) {
      labels.push(m[1].replace(/\\'/g, "'").replace(/\\[nt]/g, ' ').trim());
    }
    
    if (labels.length < 7) continue;

    // Extract the "Ver Detalles" button UUID
    const detailBtnMatch = chunk.match(/'zul\.wgt\.A','(zk_comp_\d+)',\{[^}]*tooltiptext:'Ver Detalles'/);
    const detailBtnUuid = detailBtnMatch ? detailBtnMatch[1] : null;

    rows.push({
      registro:        labels[0] ?? '',
      laboratorio:     labels[1] ?? '',
      nombreComercial: labels[2] ?? '',
      forma:           labels[3] ?? '',
      presentacion:    labels[4] ?? '',
      codigoBarras:    labels[5] ?? '',
      droga:           labels[6] ?? '',
      isAptoCeliaco:   false,
      detailBtnUuid:   detailBtnUuid
    });
  }
  
  if (rows.length === 0) return null;
  return { rows };
}

/**
 * For each row, sequentially click "Ver Detalles" to load the detail page and check for the celiac isologo.
 * Then clicks "Volver a la consulta" to return to listado.zul for the next row.
 */
async function checkDetailsSequentially(rows, dtid, zkauUrl, jsession) {
  const getHeaders = {
    'User-Agent': UA,
    'Cookie': jsession ? `JSESSIONID=${jsession}` : '',
    'Referer': LIST_URL
  };
  
  const postHeaders = {
    'User-Agent': UA,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': jsession ? `JSESSIONID=${jsession}` : '',
    'Referer': LIST_URL
  };

  const enrichedRows = [];
  
  for (const row of rows) {
    let isAptoCeliaco = false;
    
    if (row.detailBtnUuid) {
      try {
        // 1. Click "Ver Detalles"
        const p = new URLSearchParams();
        p.set('dtid', dtid);
        p.set('cmd_0', 'onClick');
        p.set('uuid_0', row.detailBtnUuid);
        p.set('data_0', JSON.stringify({ x: 0, y: 0, pageX: 0, pageY: 0, which: 1, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }));
        
        await fetch(zkauUrl, { method: 'POST', headers: postHeaders, body: p.toString() });
        
        // 2. Fetch presentacion.zul
        const detailRes = await fetch('https://servicios.pami.org.ar/vademecum/views/consultaPublica/presentacion.zul', { 
          method: 'GET',
          headers: getHeaders 
        });
        
        const detailHtml = await detailRes.text();
        if (detailHtml.includes('isologo1.jpg')) {
          isAptoCeliaco = true;
        }

        // 3. Return to list: Click "Volver a la consulta"
        const backBtnMatch = detailHtml.match(/'zul\.wgt\.Button','(zk_comp_\d+)',\{[^}]*label:'Volver a la consulta'/);
        const presDtid = extractDtid(detailHtml);
        const presZkau = extractZkauUrl(detailHtml);

        if (backBtnMatch && presDtid && presZkau) {
          const backBody = buildAuBody(presDtid, [
            {
              cmd: 'onClick',
              uuid: backBtnMatch[1],
              data: { x: 0, y: 0, pageX: 0, pageY: 0, which: 1, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }
            }
          ]);
          await fetch(presZkau, {
            method: 'POST',
            headers: {
              'User-Agent': UA,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Cookie': jsession ? `JSESSIONID=${jsession}` : '',
              'Referer': 'https://servicios.pami.org.ar/vademecum/views/consultaPublica/presentacion.zul'
            },
            body: backBody
          });

          await fetch('https://servicios.pami.org.ar/vademecum/views/consultaPublica/listado.zul?volver', {
            headers: {
              'User-Agent': UA,
              'Cookie': jsession ? `JSESSIONID=${jsession}` : '',
              'Referer': 'https://servicios.pami.org.ar/vademecum/views/consultaPublica/presentacion.zul'
            }
          });
        }
      } catch (err) {
        console.error('Error fetching details for row', row.registro, err);
      }
    }
    
    // Strip internal fields we don't need to send to the client
    const { detailBtnUuid, ...rest } = row;
    enrichedRows.push({ ...rest, isAptoCeliaco });
  }
  
  return enrichedRows;
}

// ─── handler ─────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const {
      medicamento = '',
      codigo_barras = '',
      codigoBarras = '',
    } = await request.json();

    const medTerm = medicamento ? medicamento.trim() : '';
    const barcodeTerm = (codigo_barras || codigoBarras)
      ? (codigo_barras || codigoBarras).trim()
      : '';

    if (!medTerm && !barcodeTerm) {
      return Response.json(
        { error: 'Ingresá el nombre comercial o código de barras para buscar.' },
        { status: 400 }
      );
    }

    // 1. GET page – session + ZK metadata
    const pageRes = await fetch(LIST_URL, {
      method: 'GET',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      redirect: 'follow',
    });

    const jsession = extractSession(pageRes);
    const pageHtml = await pageRes.text();
    const zkauUrl  = extractZkauUrl(pageHtml);
    const dtid     = extractDtid(pageHtml);

    if (!dtid || !zkauUrl) {
      return Response.json(
        {
          error: 'No se pudo obtener la sesión del vademecum PAMI. Intentá de nuevo.',
          debug: { dtid, zkauUrl, htmlSnippet: pageHtml.slice(0, 1000) },
        },
        { status: 502 }
      );
    }

    const headers = {
      'User-Agent':       UA,
      'Content-Type':     'application/x-www-form-urlencoded',
      Accept:             'text/javascript, */*; q=0.01',
      'Accept-Language':  'es-AR,es;q=0.9',
      'X-Requested-With': 'XMLHttpRequest',
      Referer:            LIST_URL,
      Cookie:             jsession ? `JSESSIONID=${jsession}` : '',
    };

    // 2. onChange – set input values for name and/or barcode
    const commands = [];
    if (medTerm) {
      commands.push({
        cmd: 'onChanging',
        uuid: 'zk_comp_34',
        data: { start: 0, end: medTerm.length, value: medTerm },
      });
      commands.push({
        cmd: 'onChange',
        uuid: 'zk_comp_34',
        data: { value: medTerm },
      });
    }
    if (barcodeTerm) {
      commands.push({
        cmd: 'onChanging',
        uuid: 'zk_comp_73',
        data: { start: 0, end: barcodeTerm.length, value: barcodeTerm },
      });
      commands.push({
        cmd: 'onChange',
        uuid: 'zk_comp_73',
        data: { value: barcodeTerm },
      });
    }

    const changeBody = buildAuBody(dtid, commands);
    await fetch(zkauUrl, { method: 'POST', headers, body: changeBody });

    await new Promise((r) => setTimeout(r, 600));

    // 3. onClick – click Search button
    const clickBody = buildAuBody(dtid, [
      {
        cmd: 'onClick',
        uuid: 'zk_comp_80',
        data: {
          x: 0, y: 0, pageX: 0, pageY: 0, which: 1,
          ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
        },
      },
    ]);
    const clickRes  = await fetch(zkauUrl, { method: 'POST', headers, body: clickBody });
    const clickText = await clickRes.text();

    // 4. Parse
    const parsed = parseResults(clickText);

    if (parsed === null) {
      return Response.json({
        results: [],
        total: 0,
        debug: { dtid, zkRaw: clickText.slice(0, 4000) },
      });
    }

    const { rows } = parsed;

    // 5. Check celiac status by fetching detail view sequentially
    const results = await checkDetailsSequentially(rows, dtid, zkauUrl, jsession);

    return Response.json({ results, total: results.length });
  } catch (err) {
    console.error('Vademecum error:', err);
    return Response.json(
      { error: `Error al consultar el vademecum: ${err.message}` },
      { status: 500 }
    );
  }
}
