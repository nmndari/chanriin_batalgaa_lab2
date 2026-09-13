import http from 'k6/http';
import { sleep, check } from 'k6';


export const options = {
    stages: [
        { duration: '30s', target: 5 }, // халаалт
        { duration: '1m', target: 30 }, // өсгөлт
        { duration: '30s', target: 100 }, // оргил
        { duration: '30s', target: 0 }, // буулт
    ],

};

export default function () {
    const res = http.get('https://test.k6.io');
    check(res, { 'status 200 байна': (r) => r.status === 200 });
    sleep(1);
}