// Алхам 2 / Алхам 3 — түвшин тус бүрийг ТУСАД НЬ ажиллуулах скрипт
// stages ЗААВАЛ байхгүй: stages байвал vus/duration чимээгүй үл тоогдоно.
//   k6 run --vus 5   --duration 1m script.js | tee results/run-05vu.txt
//   k6 run --vus 30  --duration 1m script.js | tee results/run-30vu.txt
//   k6 run --vus 100 --duration 1m script.js | tee results/run-100vu.txt
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = { vus: 5, duration: '1m' };

export default function () {
    const res = http.get('https://test.k6.io');
    check(res, { 'status 200 байна': (r) => r.status === 200 });
    sleep(1);
}