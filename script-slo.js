// Алхам 4 — SLO-г threshold болгон кодоор шалгуулах
//
// SLO нь Алхам 2-ын ӨӨРИЙН baseline-аас гарсан: p95 = 230.98 ms, × 1.5 ≈ 346 → 350 ms
// P95 хувьсагчаар босгыг солино (PASS / FAIL хоёуланг нэг файлаар үзүүлэх):
//   PASS: k6 run script-slo.js                | tee results/run-slo-pass.txt
//   FAIL: k6 run -e P95=50 script-slo.js      | tee results/run-slo-fail.txt
import http from 'k6/http';
import { sleep, check } from 'k6';

const P95 = __ENV.P95 || '350'; // анхдагч = baseline p95 × 1.5

export const options = {
    vus: 30,
    duration: '1m',
    // stages ЭНД БАЙХГҮЙ — байвал vus/duration-г дарж орхино
    thresholds: {
        http_req_duration: [`p(95)<${P95}`], // latency SLO
        http_req_failed: ['rate<0.01'],      // error rate (POFOD) SLO: 1%-иас бага
    },
};

export default function () {
    const res = http.get('https://test.k6.io');
    check(res, { 'status 200 байна': (r) => r.status === 200 });
    sleep(1);
}
