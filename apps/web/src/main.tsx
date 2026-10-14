import React from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, CheckCircle2, FileImage, Files, ScanText, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import "./styles.css";

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="SnapText home">
          <span className="brand-mark"><ScanText size={21} /></span>
          <span>SnapText</span>
        </a>
        <span className="topbar-note"><span className="status-dot" /> Workspace preview</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={15} /> IMAGE TO STRUCTURED DATA</div>
        <h1>Turn piles of images<br /><span>into usable data.</span></h1>
        <p className="hero-copy">Upload a batch, extract the fields you need, review uncertain values, and export everything in one clean file.</p>
        <div className="hero-actions">
          <a className="primary-action" href="#workspace">Explore workspace <ArrowRight size={17} /></a>
          <span className="privacy-note"><ShieldCheck size={15} /> Review before export</span>
        </div>
      </section>

      <section className="workspace" id="workspace">
        <div className="section-heading">
          <div>
            <p className="section-kicker">YOUR WORKSPACE</p>
            <h2>Start with a batch</h2>
            <p className="section-copy">The first release will process multiple images as one reviewable dataset.</p>
          </div>
          <span className="draft-badge">Foundation preview</span>
        </div>

        <div className="workspace-grid">
          <div className="upload-panel">
            <div className="upload-icon"><UploadCloud size={25} /></div>
            <h3>Upload your images</h3>
            <p>Bring receipts, forms, screenshots, tables, or other image-based records into one batch.</p>
            <div className="dropzone" aria-label="Upload is not connected yet">
              <FileImage size={23} />
              <strong>Batch upload is coming in the next phase</strong>
              <span>PNG · JPG · JPEG · WEBP</span>
            </div>
            <button className="disabled-button" type="button" disabled>Upload images <ArrowRight size={16} /></button>
            <p className="helper-text">Upload is intentionally disabled until validation and private storage are implemented.</p>
          </div>

          <aside className="flow-panel">
            <div className="panel-heading"><Files size={18} /><h3>How SnapText works</h3></div>
            <ol className="steps">
              <li><span className="step-number">01</span><div><strong>Upload a batch</strong><p>Keep all source images together.</p></div></li>
              <li><span className="step-number">02</span><div><strong>Extract locally first</strong><p>OCR runs before any optional AI fallback.</p></div></li>
              <li><span className="step-number">03</span><div><strong>Review exceptions</strong><p>Missing values and possible conflicts stay visible.</p></div></li>
              <li><span className="step-number">04</span><div><strong>Export one dataset</strong><p>Combine reviewed records into CSV or XLSX.</p></div></li>
            </ol>
            <div className="trust-note"><CheckCircle2 size={17} /><span>Uncertain values are flagged, not silently guessed.</span></div>
          </aside>
        </div>
      </section>

      <footer className="footer"><span>SnapText</span><span>Built for traceable extraction, human review, and predictable costs.</span></footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
