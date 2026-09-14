// Алхам 5 — локал тест сервер (гуравдагч сан шаардахгүй, зөвхөн Node-ийн built-in http)
// Ажиллуулах: node server/server.js   →  http://127.0.0.1:3000
//
//   GET /fast  — шууд хариулна (сервер талын ажил ~0 ms)
//   GET /slow  — 100 ms санаатай саатуулаад хариулна
const http = require('http');

const PORT = 3000;
const DELAY_MS = 100;

const send = (res, body) => {
    const data = JSON.stringify(body);
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
    });
    res.end(data);
};

const server = http.createServer((req, res) => {
    if (req.url === '/fast') {
        send(res, { endpoint: 'fast', delay_ms: 0 });
    } else if (req.url === '/slow') {
        setTimeout(() => send(res, { endpoint: 'slow', delay_ms: DELAY_MS }), DELAY_MS);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('not found');
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`listening on http://127.0.0.1:${PORT}  (/fast, /slow ${DELAY_MS}ms)`);
});
