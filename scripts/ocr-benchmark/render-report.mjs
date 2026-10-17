#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const esc = (value) => String(value ?? "").replace(/[&<>"']/gu, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const fmt = (value, suffix = "") => Number.isFinite(value) ? `${(value * (suffix === "%" ? 100 : 1)).toFixed(2)}${suffix}` : "N/A";
export function renderReport(report, title = "SnapText OCR Benchmark") {
 const s = report.summary ?? {};
 const rows = [
  ["Fixtures", s.fixtureCount ?? 0], ["Failure rate", fmt(s.failureRate, "%")],
  ["Mean CER (lower is better)", fmt(s.meanCer)], ["Mean WER (lower is better)", fmt(s.meanWer)],
  ["Field accuracy (higher is better)", fmt(s.meanFieldAccuracy, "%")],
  ["Median latency", fmt(s.medianLatencyMs, " ms")], ["P95 latency", fmt(s.p95LatencyMs, " ms")]
 ];
 const details = (report.scores ?? []).map(item => `<tr><td>${esc(item.id)}</td><td>${esc(item.language)}</td><td>${esc((item.scenario ?? []).join(", "))}</td><td>${fmt(item.cer)}</td><td>${fmt(item.wer)}</td><td>${fmt(item.fieldAccuracy, "%")}</td><td>${fmt(item.latencyMs, " ms")}</td><td>${item.failed ? "FAILED" : "OK"}</td></tr>`).join("");
 return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
:root{color-scheme:light dark;font:16px/1.5 system-ui,sans-serif}body{max-width:1100px;margin:0 auto;padding:24px}h1{font-size:1.8rem}p{color:gray}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.metric{border:1px solid #8886;border-radius:12px;padding:16px}.metric small{display:block;color:gray}.metric strong{font-size:1.5rem;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{text-align:left;padding:10px;border-bottom:1px solid #8886}th{position:sticky;top:0;background:Canvas}section{overflow:auto}footer{margin-top:28px;color:gray;font-size:.9rem}
</style></head><body><h1>${esc(title)}</h1><p>Generated from benchmark score JSON. Synthetic fixtures are a smoke test, not production accuracy evidence.</p>
<div class="grid">${rows.map(([label,value])=>`<div class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join("")}</div>
<h2>Fixture details</h2><section><table><thead><tr><th>Fixture</th><th>Language</th><th>Scenario</th><th>CER</th><th>WER</th><th>Field accuracy</th><th>Latency</th><th>Status</th></tr></thead><tbody>${details || "<tr><td colspan=\"8\">No fixture scores found.</td></tr>"}</tbody></table></section>
<footer>SnapText · OCR benchmark report · This report does not select a winner automatically.</footer></body></html>`;
}
async function main(){
 const args=process.argv.slice(2), value=n=>{const i=args.indexOf(n);return i<0?undefined:args[i+1]};
 const input=value("--input"),output=value("--output"),title=value("--title")??"SnapText OCR Benchmark";
 if(!input||!output){console.error("Usage: node scripts/ocr-benchmark/render-report.mjs --input <score.json> --output <report.html> [--title <title>]");process.exitCode=2;return;}
 const report=JSON.parse(await readFile(input,"utf8")),target=path.resolve(output);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,renderReport(report,title),"utf8");console.log(`Wrote ${target}`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e instanceof Error?e.message:"Report generation failed.");process.exitCode=1;});
