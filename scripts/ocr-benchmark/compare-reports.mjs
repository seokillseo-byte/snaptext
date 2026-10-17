#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
function summarize(report) {
 const s=report.summary??{};
 return Object.fromEntries(["fixtureCount","failureRate","meanCer","meanWer","meanFieldAccuracy","medianLatencyMs","p95LatencyMs"].map(k=>[k,s[k]??null]));
}
export function compareReports(tesseract,paddleocr) {
 const left=summarize(tesseract), right=summarize(paddleocr);
 const metrics=["meanCer","meanWer","meanFieldAccuracy","medianLatencyMs","p95LatencyMs","failureRate"];
 return {schemaVersion:1,warning:"Compare only reports generated from the same fixture set, rasterization, language configuration, and comparable hardware. Synthetic fixtures are a smoke test, not production evidence.",engines:{tesseract:left,paddleocr:right},differences:Object.fromEntries(metrics.map(k=>[k,left[k]==null||right[k]==null?null:right[k]-left[k]])),byLanguage:{tesseract:tesseract.byLanguage??{},paddleocr:paddleocr.byLanguage??{}},byScenario:{tesseract:tesseract.byScenario??{},paddleocr:paddleocr.byScenario??{}}};
}
async function main(){
 const a=process.argv.slice(2),v=n=>{const i=a.indexOf(n);return i<0?undefined:a[i+1]};
 const t=v("--tesseract"),p=v("--paddleocr"),o=v("--output");
 if(!t||!p||!o){console.error("Usage: node scripts/ocr-benchmark/compare-reports.mjs --tesseract <score.json> --paddleocr <score.json> --output <comparison.json>");process.exitCode=2;return;}
 const [tr,pr]=await Promise.all([readFile(t,"utf8").then(JSON.parse),readFile(p,"utf8").then(JSON.parse)]);
 const result=compareReports(tr,pr),target=path.resolve(o);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,JSON.stringify(result,null,2)+"\n","utf8");console.log(JSON.stringify({output:target,engines:result.engines},null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e instanceof Error?e.message:"Comparison failed.");process.exitCode=1;});
