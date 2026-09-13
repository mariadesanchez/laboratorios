const fs = require('fs');

async function run() {
  const term = "lotrial";
  const LIST_URL = 'https://servicios.pami.org.ar/vademecum/views/consultaPublica/listado.zul';
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  
  const pageRes = await fetch(LIST_URL, { headers: { 'User-Agent': UA } });
  const pageHtml = await pageRes.text();
  const mZkau = pageHtml.match(/uu\s*:\s*'((?:[^'\\]|\\.)*)'/);
  const zkauUrl = 'https://servicios.pami.org.ar' + mZkau[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  const dtid = pageHtml.match(/dt\s*:\s*'([^']+)'/)[1];
  const raw = pageRes.headers.get('set-cookie') ?? '';
  const jsession = (raw.match(/JSESSIONID=([^;]+)/) || [])[1];
  
  const headers = {
    'User-Agent': UA,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': jsession ? `JSESSIONID=${jsession}` : ''
  };

  let p = new URLSearchParams();
  p.set('dtid', dtid);
  p.set('cmd_0', 'onChanging');
  p.set('uuid_0', 'zk_comp_34');
  p.set('data_0', JSON.stringify({ start: 0, end: term.length, value: term }));
  p.set('cmd_1', 'onChange');
  p.set('uuid_1', 'zk_comp_34');
  p.set('data_1', JSON.stringify({ value: term }));
  await fetch(zkauUrl, { method: 'POST', headers, body: p.toString() });
  await new Promise((r) => setTimeout(r, 600));
  
  p = new URLSearchParams();
  p.set('dtid', dtid);
  p.set('cmd_0', 'onClick');
  p.set('uuid_0', 'zk_comp_80');
  p.set('data_0', JSON.stringify({ x: 0, y: 0, pageX: 0, pageY: 0, which: 1, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }));
  const clickRes = await fetch(zkauUrl, { method: 'POST', headers, body: p.toString() });
  const clickText = await clickRes.text();
  
  // Find all "Ver Detalles" button uuids
  const btnRe = /'zul\.wgt\.A','(zk_comp_\d+)',\{[^}]*tooltiptext:'Ver Detalles'/g;
  const uuids = [];
  let m;
  while ((m = btnRe.exec(clickText)) !== null) {
    uuids.push(m[1]);
  }
  console.log("Found buttons:", uuids);
  
  const getHeaders = { 'User-Agent': UA, 'Cookie': jsession ? `JSESSIONID=${jsession}` : '' };
  
  for (let i = 0; i < 2; i++) {
    const btnUuid = uuids[i];
    console.log("Clicking", btnUuid);
    p = new URLSearchParams();
    p.set('dtid', dtid);
    p.set('cmd_0', 'onClick');
    p.set('uuid_0', btnUuid);
    p.set('data_0', JSON.stringify({ x: 0, y: 0, pageX: 0, pageY: 0, which: 1, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }));
    const r1 = await fetch(zkauUrl, { method: 'POST', headers, body: p.toString() });
    console.log("redirect response:", await r1.text());
    
    const r2 = await fetch('https://servicios.pami.org.ar/vademecum/views/consultaPublica/presentacion.zul', { headers: getHeaders });
    const h2 = await r2.text();
    console.log("Contains isologo1.jpg?", h2.includes('isologo1.jpg'));
    
    // Do we need to go back? Let's just try to click the next button!
  }
}
run();
