export const runtime = 'nodejs';
export const maxDuration = 60;

const BASE_URL = 'https://servicios.pami.org.ar/vademecum';
const LIST_URL = `${BASE_URL}/views/consultaPublica/listado.zul`;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract the ZK AU (asynchronous update) endpoint URL from the page HTML.
 * ZK embeds it as:  uu:'\x2Fvademecum\x2Fzkau\x3Bjsessionid\x3DXXX'
 */
function extractZkauUrl(html) {
  const m = html.match(/uu\s*:\s*'((?:[^'\\]|\\.)*)'/);
  if (!m) return null;
  // Decode \xNN JS hex escapes
  const path = m[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16))
  );
  return 'https://servicios.pami.org.ar' + path;
}

/** Extract the ZK desktop ID from the page HTML. */
function extractDtid(html) {
  const m = html.match(/dt\s*:\s*'([^']+)'/);
  return m ? m[1] : null;
}

/** Extract JSESSIONID cookie value. */
function extractSession(response) {
  const raw = response.headers.get('set-cookie') ?? '';
  const m = raw.match(/JSESSIONID=([^;]+)/);
  return m ? m[1] : null;
}

/** Build a URL-encoded ZK AU POST body. */
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
 * Parse the ZK response text (which mixes JSON with JS literal syntax)
 * using regex to extract all Label values grouped into rows.
 *
 * ZK serialises each grid row as:
 *   'zul.grid.Row','zk_comp_NNN',{...},[<cells>]
 * and each label inside as:
 *   'zul.wgt.Label','zk_comp_NNN',{...,value:'TEXT',...},[]
 *
 * Labels appear in document order: 7 per row
 *   [registro, laboratorio, nombreComercial, forma, presentacion, codigoBarras, droga]
 */
function parseResults(zkText) {
  const rows = [];

  // Check for "no results" message
  if (zkText.includes('búsqueda no ha devuelto resultados') || zkText.includes('no ha devuelto')) {
    return [];
  }

  // Extract all label values in order
  const labelRe = /'zul\.wgt\.Label','[^']+',\{[^}]*value:'((?:[^'\\]|\\.)*)'/g;
  const labels = [];
  let m;
  while ((m = labelRe.exec(zkText)) !== null) {
    // Decode escape sequences in value
    const val = m[1]
      .replace(/\\'/g, "'")
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ')
      .trim();
    labels.push(val);
  }

  if (labels.length === 0) return null; // No data found at all (need debug)

  // Group labels into rows – each row has 7 cells:
  // registro(0), laboratorio(1), nombreComercial(2), forma(3),
  // presentacion(4), codigoBarras(5), droga(6)
  // Skip image cells (no label) — count non-image labels per row
  const COLS = 7;
  for (let i = 0; i + COLS - 1 < labels.length; i += COLS) {
    rows.push({
      registro:        labels[i] ?? '',
      laboratorio:     labels[i + 1] ?? '',
      nombreComercial: labels[i + 2] ?? '',
      forma:           labels[i + 3] ?? '',
      presentacion:    labels[i + 4] ?? '',
      codigoBarras:    labels[i + 5] ?? '',
      droga:           labels[i + 6] ?? '',
    });
  }

  return rows;
}

// ─── handler ─────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { medicamento = '' } = await request.json();

    if (!medicamento.trim()) {
      return Response.json(
        { error: 'Ingresá el nombre comercial del medicamento.' },
        { status: 400 }
      );
    }

    const term = medicamento.trim();

    // 1. GET the page – obtain session and ZK metadata
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
        { error: 'No se pudo obtener la sesión del vademecum PAMI. Intentá de nuevo.', debug: { dtid, zkauUrl, htmlSnippet: pageHtml.slice(0, 1000) } },
        { status: 502 }
      );
    }

    const headers = {
      'User-Agent':      UA,
      'Content-Type':    'application/x-www-form-urlencoded',
      Accept:            'text/javascript, */*; q=0.01',
      'Accept-Language': 'es-AR,es;q=0.9',
      'X-Requested-With':'XMLHttpRequest',
      Referer:           LIST_URL,
      Cookie:            jsession ? `JSESSIONID=${jsession}` : '',
    };

    // 2. Simulate typing in the search box (onChange)
    const changeBody = buildAuBody(dtid, [
      { cmd: 'onChanging', uuid: 'zk_comp_34', data: { start: 0, end: term.length, value: term } },
      { cmd: 'onChange',   uuid: 'zk_comp_34', data: { value: term } },
    ]);
    await fetch(zkauUrl, { method: 'POST', headers, body: changeBody });

    await new Promise((r) => setTimeout(r, 600));

    // 3. Click the search button
    const clickBody = buildAuBody(dtid, [
      {
        cmd: 'onClick',
        uuid: 'zk_comp_80',
        data: { x: 0, y: 0, pageX: 0, pageY: 0, which: 1,
                ctrlKey: false, shiftKey: false, altKey: false, metaKey: false },
      },
    ]);
    const clickRes  = await fetch(zkauUrl, { method: 'POST', headers, body: clickBody });
    const clickText = await clickRes.text();

    // 4. Parse results from ZK response
    const results = parseResults(clickText);

    if (results === null) {
      // Return debug info so we can adjust the parser
      return Response.json({
        results: [],
        total: 0,
        debug: { dtid, zkRaw: clickText.slice(0, 4000) },
      });
    }

    return Response.json({ results, total: results.length });

  } catch (err) {
    console.error('Vademecum error:', err);
    return Response.json(
      { error: `Error al consultar el vademecum: ${err.message}` },
      { status: 500 }
    );
  }
}
