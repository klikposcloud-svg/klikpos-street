const https = require('https');
const TOKEN = '8699572842:AAHyw4tBMMC6YdqeGexrOqhQzNf2NdnH--M';
const CHAT_ID = '8681182877';

function send(text) {
  const data = JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'Markdown' });
  const req = https.request(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('Message delivered to Telegram:', res.statusCode));
  });
  req.on('error', e => console.error('Error:', e.message));
  req.write(data);
  req.end();
}

const message = process.argv.slice(2).join(' ');
if (message) {
  send(message);
} else {
  console.log('No message provided');
}
