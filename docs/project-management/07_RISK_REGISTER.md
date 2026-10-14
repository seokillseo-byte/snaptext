# SnapText — Risk Register

| Risk | Impact | Mitigation | Status |
|---|---|---|---|
| OCR varies by image quality/layout/language | Incorrect records | Representative benchmark, uncertainty, human review | Open |
| AI fallback cost grows unexpectedly | Cost overrun | Budgets, bounded retries, usage logs, mocked CI | Open |
| Duplicate matching merges unrelated records | Data loss | Candidate-only matching and explicit review | Open |
| Uploads expose private data or enable abuse | Security incident | Private storage, file validation, access and resource limits | Open |
| Large batches exhaust resources | Outage/slow processing | Streaming, bounded concurrency, queue if needed | Open |
| Spreadsheet formula injection | Unsafe export | Sanitize dangerous leading characters and test | Open |
| Provider outage blocks a batch | Partial failure | Timeouts, isolated statuses, bounded retry | Open |
| Unvalidated stack creates rework | Delay | Keep choices provisional and benchmark | Open |
| CI is mistaken for production proof | False confidence | Separate unit, integration, staging, and release evidence | Open |
