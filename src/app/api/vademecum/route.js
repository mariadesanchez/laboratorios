import { chromium } from 'playwright';

export const runtime = 'nodejs';
export const maxDuration = 60; // seconds

export async function POST(request) {
  let browser = null;
  try {
    const { medicamento = '' } = await request.json();

    if (!medicamento.trim()) {
      return Response.json(
        { error: 'Ingresá el nombre comercial del medicamento.' },
        { status: 400 }
      );
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    // Navigate to PAMI vademecum
    await page.goto('https://servicios.pami.org.ar/vademecum/views/consultaPublica/listado.zul', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for the main search input: <input id="zk_comp_34" ...>
    await page.waitForSelector('#zk_comp_34', { timeout: 15000 });

    // Focus, type the commercial name, and dispatch change event for ZK framework
    await page.click('#zk_comp_34');
    await page.fill('#zk_comp_34', medicamento.trim());
    await page.evaluate(() => {
      const input = document.querySelector('#zk_comp_34');
      if (input) {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    });
    await page.waitForTimeout(400);

    // Wait for the search button: <button id="zk_comp_80" ...>
    await page.waitForSelector('#zk_comp_80', { timeout: 10000 });
    await page.click('#zk_comp_80');

    // Wait for results grid or empty response
    await page.waitForSelector('#zk_comp_109 .z-row, .z-messagebox', {
      timeout: 20000,
    }).catch(() => null);

    // Wait a bit more for rendering
    await page.waitForTimeout(1500);

    // Wait a bit more for all rows to render
    await page.waitForTimeout(1500);

    // Extract results from the table
    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('#zk_comp_109 .z-row');
      const data = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll('.z-label');
        if (cells.length < 6) return;

        // The columns are:
        // [image] [registro] [laboratorio] [nombreComercial] [forma] [presentacion] [barcode(hidden)] [droga]
        const allCells = row.querySelectorAll('td');
        const labels = [];
        allCells.forEach((td) => {
          const label = td.querySelector('.z-label');
          if (label) labels.push(label.textContent.trim());
        });

        if (labels.length >= 6) {
          data.push({
            registro: labels[0] || '',
            laboratorio: labels[1] || '',
            nombreComercial: labels[2] || '',
            forma: labels[3] || '',
            presentacion: labels[4] || '',
            droga: labels[5] || '',
          });
        }
      });

      return data;
    });

    await browser.close();
    browser = null;

    return Response.json({ results, total: results.length });
  } catch (err) {
    console.error('Vademecum scraping error:', err);
    return Response.json(
      { error: `Error al consultar el vademecum: ${err.message}` },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => null);
    }
  }
}
