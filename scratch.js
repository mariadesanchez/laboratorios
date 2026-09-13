const term = "lotrial";
async function run() {
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

  const p1 = new URLSearchParams();
  p1.set('dtid', dtid);
  p1.set('cmd_0', 'onChanging');
  p1.set('uuid_0', 'zk_comp_34');
  p1.set('data_0', JSON.stringify({ start: 0, end: term.length, value: term }));
  p1.set('cmd_1', 'onChange');
  p1.set('uuid_1', 'zk_comp_34');
  p1.set('data_1', JSON.stringify({ value: term }));
  
  await fetch(zkauUrl, { method: 'POST', headers, body: p1.toString() });
  await new Promise((r) => setTimeout(r, 1000));
  
  const p2 = new URLSearchParams();
  p2.set('dtid', dtid);
  p2.set('cmd_0', 'onClick');
  p2.set('uuid_0', 'zk_comp_80');
  p2.set('data_0', JSON.stringify({ x: 0, y: 0, pageX: 0, pageY: 0, which: 1, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }));
  
  const clickRes = await fetch(zkauUrl, { method: 'POST', headers, body: p2.toString() });
  const clickText = await clickRes.text();
  
  const fs = require('fs');
  fs.writeFileSync('zkRaw.txt', clickText);
  console.log('Saved to zkRaw.txt');
}
run();
