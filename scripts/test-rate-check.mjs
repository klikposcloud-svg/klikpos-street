import https from 'https';

async function test() {
  console.log('Testing APIs...');
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    const json = await res.json();
    console.log('DolarAPI:', JSON.stringify(json));
  } catch(e) { console.log('DolarAPI err:', e.message); }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const json = await res.json();
    console.log('open.er-api VES:', json.rates?.VES);
  } catch(e) { console.log('open.er-api err:', e.message); }

  try {
    const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/page?page=bcv');
    const json = await res.json();
    console.log('pydolarvenezuela:', JSON.stringify(json));
  } catch(e) { console.log('pydolarvenezuela err:', e.message); }

  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const req = https.request('https://www.bcv.org.ve', { agent, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 10000 }, (res) => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        console.log('BCV HTML length:', html.length);
        const dolarRegex = /id=["']dolar["'][\s\S]*?<strong[^>]*>\s*([0-9.,]+)\s*<\/strong>/i;
        const match = html.match(dolarRegex);
        console.log('BCV match:', match ? match[1] : 'null');
      });
    });
    req.on('error', e => console.log('BCV req error:', e.message));
    req.end();
  } catch(e) { console.log('BCV err:', e.message); }
}

test();
