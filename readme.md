# Лабораторийн ажил №2 — k6 гүйцэтгэлийн хэмжүүр

## Оюутны мэдээлэл
- **Оюутны код:** B232270037
- **Оюутны нэр:** Б. Намуундарь

## Ашигласан хэрэгсэл
- **k6 version:** `k6 v2.2.0 (commit/devel, go1.26.5, darwin/arm64)`
- **Үйлдлийн систем:** macOS
- **Target:** `https://test.k6.io` (302-оор `quickpizza.grafana.com` руу чиглэдэг)

Бүх тест зөвхөн зөвшөөрөгдсөн дадлагын сайт `test.k6.io` рүү хийгдсэн.

---

## Алхам 2 — Үндсэн тест (baseline)

`k6 run --vus 5 --duration 1m script.js | tee results/run-05vu.txt`

Гаралт: [results/run-05vu.txt](results/run-05vu.txt)

Summary-гээс уншсан үзүүлэлтүүд:

| Үзүүлэлт | k6 метрик | Утга |
|---|---|---|
| Дундаж хариу хугацаа | `http_req_duration` avg | 142.49 ms |
| **p90 latency** | `http_req_duration` p(90) | **229.04 ms** |
| **p95 latency** | `http_req_duration` p(95) | **230.98 ms** |
| Хамгийн хурдан / удаан | min / max | 54.09 ms / 245.03 ms |
| **Throughput** | `http_reqs` | **460 хүсэлт, 7.62 req/s** |
| **Error rate (POFOD)** | `http_req_failed` | **0.00% (0 / 460)** |
| Check амжилт | `checks_succeeded` | 100.00% (230 / 230) |

Зааврын 30 секундийн оронд 1 минут хэмжиж, Алхам 3-ын гурван түвшинтэй ижил нөхцөлөөр харьцуулсан. test.k6.io redirect хийдэг тул 1 http.get = 2 HTTP хүсэлт буюу 230 iteration = 460 хүсэлт.

**BASELINE p95 = 230.98 ms** → SLO: 230.98 × 1.5 ≈ 346 → **p(95) < 350**

---

## Алхам 3 — Ачааллыг шатлан өсгөх

Түвшин тус бүрийг **stages-гүй**, 1 минутаар тусад нь ажиллуулав:

```
k6 run --vus 5   --duration 1m script.js | tee results/run-05vu.txt
k6 run --vus 30  --duration 1m script.js | tee results/run-30vu.txt
k6 run --vus 100 --duration 1m script.js | tee results/run-100vu.txt
```

| VU | p90 | **p95** | med | max | http_reqs | **Throughput** | VU тутмын throughput | **Error rate** |
|---|---|---|---|---|---|---|---|---|
| 5 | 229.04 ms | **230.98 ms** | 151.08 ms | 245.03 ms | 460 | **7.62 req/s** | 1.52 req/s | **0.00%** |
| 30 | 232.39 ms | **236.17 ms** | 163.19 ms | 271.63 ms | 2 760 | **45.50 req/s** | 1.52 req/s | **0.00%** |
| 100 | 236.24 ms | **243.88 ms** | 178.91 ms | 445.23 ms | 9 220 | **150.65 req/s** | 1.51 req/s | **0.00%** |

Гаралтууд: [run-05vu.txt](results/run-05vu.txt) · [run-30vu.txt](results/run-30vu.txt) · [run-100vu.txt](results/run-100vu.txt)

**Throughput.** VU 20 дахин өсөхөд throughput 7.62 → 150.65 req/s болж, 19.8 дахин өссөн. Нэг VU-ийн бүтээмж ердөө 1.1% буурч, алдаа бүх түвшинд 0.00% байв.

**Хаана муудаж эхэлсэн бэ?** p95 нь 230.98 → 243.88 ms (+5.6%) буюу бага өөрчлөгдсөн. Харин max latency 245 → 445 ms (+82%) өссөн тул 30 VU-аас хойш сүүл хэсгийн latency муудаж эхэлсэн гэж үзэж болно.

Лекцийн "10 хэрэглэгчтэй 2с, 100 хэрэглэгчтэй 4с" зөрчил давтагдаагүй. `test.k6.io` бол CDN-ийн ард байрлах дадлагын сайт тул 100 VU ханатал ачаалахад хүрэлцэхгүй, мөн хугацааны нэлээд хэсэг нь тогтмол RTT (min 53 ms).

### stages хувилбар
5 → 30 → 100 VU stages туршилтаар p95 233.81 ms, max 305.02 ms, throughput 47 req/s, алдаа 0.00% гарсан. Нийт p95 бага VU-ийн үеүүдэд “живдэг” тул VU бүрийн тусдаа туршилтын үр дүнг хүснэгтэд ашиглав.

---

## Алхам 4 — Threshold (SLO) кодоор шалгуулах

Baseline p95 = 230.98 ms тул 1.5 дахин нөөц авч p(95) < 350 ms гэж SLO тогтоов. Энэ утга нь 100 VU дээр хэмжигдсэн p95 (243.88 ms)-аас дээш нөөцтэй ч хэт хол биш тул бодит доройтол үүсвэл threshold шууд унана. Алдааны SLO нь rate < 0.01 (1%). Зааврын p(95)<300-г хуулаагүй.

script-slo.js-г 30 VU, 1 минутын нөхцөлөөр ажиллуулав.

| | Команда | Threshold | Үр дүн | exit code |
|---|---|---|---|---|
| **PASS** | `k6 run script-slo.js` | `p(95)<350` | ✓ p(95) = 231.87 ms | **0** |
| **FAIL** | `k6 run -e P95=50 script-slo.js` | `p(95)<50` | ✗ p(95) = 232.12 ms | **99** |

Гаралт: [run-slo-pass.txt](results/run-slo-pass.txt) · [run-slo-fail.txt](results/run-slo-fail.txt)

Хоёр туршилтад алдаа 0.00% байсан. FAIL нь зөвхөн latency threshold хангаагүйгээс үүссэн бөгөөд exit code 99-өөр CI quality gate ажиллаж build-ийг зогсоох боломжтой.

### Скриптийн бүтэц
- [script.js](script.js) — Алхам 2/3, `vus/duration`, stages **байхгүй**
- [stages.js](stages.js) — Алхам 3-ын stages цикл (5→30→100→0)
- [script-slo.js](script-slo.js) — Алхам 4, thresholds

stages болон `vus/duration`-г нэг файлд хольвол stages давамгайлж `vus/duration` үл тоогдоно.
