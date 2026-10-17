import test from "node:test";
import assert from "node:assert/strict";
import { renderReport } from "./render-report.mjs";
test("renders escaped fixture content and summary metrics",()=>{
 const html=renderReport({summary:{fixtureCount:1,failureRate:0,meanCer:0,meanWer:0,meanFieldAccuracy:1,medianLatencyMs:5,p95LatencyMs:5},scores:[{id:"<img src=x>",language:"vi",scenario:["clean"],cer:0,wer:0,fieldAccuracy:1,latencyMs:5,failed:false}]});
 assert.match(html,/&lt;img src=x&gt;/u);
 assert.match(html,/Field accuracy/u);
 assert.match(html,/synthetic fixtures are a smoke test/iu);
 assert.doesNotMatch(html,/<img src=x>/u);
});
