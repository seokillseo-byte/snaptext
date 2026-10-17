import test from "node:test";
import assert from "node:assert/strict";
import { compareReports } from "./compare-reports.mjs";
test("compares metrics and preserves an explicit comparability warning",()=>{
 const r=compareReports({summary:{fixtureCount:10,meanCer:.1,meanWer:.2,meanFieldAccuracy:.8,medianLatencyMs:100,p95LatencyMs:150,failureRate:0}},{summary:{fixtureCount:10,meanCer:.08,meanWer:.15,meanFieldAccuracy:.9,medianLatencyMs:120,p95LatencyMs:170,failureRate:.1}});
 assert.ok(Math.abs(r.differences.meanCer-(-.02))<1e-10);
 assert.equal(r.differences.medianLatencyMs,20);
 assert.match(r.warning,/same fixture set/u);
});
