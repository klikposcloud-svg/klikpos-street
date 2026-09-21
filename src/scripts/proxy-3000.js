const http = require('http');

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 3002,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxying to port 3002 error: ' + err.message);
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Proxy listening on port 3000 -> forwarding to 3002');
});
