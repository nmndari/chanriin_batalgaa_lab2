// Алхам 5 — локал сервер рүү хийх тест
// Сервер: node server/server.js  (http://127.0.0.1:3000)
//
//   k6 run -e EP=/fast local-test.js | tee results/run-local-fast.txt
//   k6 run -e EP=/slow local-test.js | tee results/run-local-slow.txt
//
// sleep() ЗОРИУДААР байхгүй: локал серверийн бодит багтаамжийг (throughput)
// хэмжихийн тулд VU-г хүлээлгэхгүй, тасралтгүй хүсэлт илгээнэ.
import http from 'k6/http';
import { check } from 'k6';

const EP = __ENV.EP || '/fast';

export const options = {
    vus: 30,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<150'], // локал сүлжээнд RTT ~0 тул хатуу босго
        http_req_failed: ['rate<0.01'],
    },
};

export default function () {
    const res = http.get(`http://127.0.0.1:3000${EP}`);
    check(res, { 'status 200 байна': (r) => r.status === 200 });
}
