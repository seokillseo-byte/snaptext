import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertCircle, ArrowRight, CheckCircle2, FileImage, Files, LoaderCircle, ScanText, ShieldCheck, Sparkles, UploadCloud, X } from "lucide-react";
import "./styles.css";

type AcceptedImage = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  status: "UPLOADED";
};

type RejectedImage = {
  filename: string;
  code: string;
  message: string;
};

type UploadResult = {
  accepted: AcceptedImage[];
  rejected: RejectedImage[];
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readJson(response: Response): Promise<Record<string, any>> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Request failed (${response.status}).`);
  }
  return payload;
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [workspaceName, setWorkspaceName] = useState("My workspace");
  const [batchName, setBatchName] = useState("Image batch");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "verify" | "reset-request" | "reset-confirm">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.data?.user ?? null;
      })
      .then((user) => setAuthUser(user))
      .catch(() => setAuthUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError("");
    setAuthNotice("");
    try {
      if (authMode === "verify") {
        await readJson(await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: verificationToken.trim() })
        }));
        setAuthMode("login");
        setAuthPassword("");
        setVerificationToken("");
        setAuthNotice("Email verified. You can now sign in.");
      } else if (authMode === "register") {
        await readJson(await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword, workspaceName })
        }));
        setAuthMode("verify");
        setAuthPassword("");
        setAuthNotice("Registration started. Check your email for the one-time verification token.");
      } else if (authMode === "reset-request") {
        await readJson(await fetch("/api/auth/password-reset/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail })
        }));
        setAuthMode("reset-confirm");
        setAuthNotice("If the account exists, reset instructions will be sent. Enter the token from your email when it arrives.");
      } else if (authMode === "reset-confirm") {
        await readJson(await fetch("/api/auth/password-reset/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken.trim(), password: authPassword })
        }));
        setAuthMode("login");
        setAuthPassword("");
        setResetToken("");
        setAuthNotice("Password updated. Sign in with your new password.");
      } else {
        const payload = await readJson(await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        }));
        setAuthUser(payload.data.user as { id: string; email: string });
        setAuthPassword("");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "The request could not be completed.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAuthUser(null);
      setResult(null);
      setStatusMessage("");
      setErrorMessage("");
    }
  }

  if (!authChecked) {
    return <main className="app-shell auth-shell"><section className="auth-panel"><div className="brand"><span className="brand-mark"><ScanText size={21} /></span><span>SnapText</span></div><p className="auth-muted">Checking your session…</p></section></main>;
  }

  if (!authUser) {
    return (
      <main className="app-shell auth-shell">
        <header className="topbar">
          <a className="brand" href="/" aria-label="SnapText home"><span className="brand-mark"><ScanText size={21} /></span><span>SnapText</span></a>
          <span className="topbar-note">Customer workspace</span>
        </header>
        <section className="auth-panel">
          <div className="eyebrow"><ShieldCheck size={15} /> PRIVATE CUSTOMER WORKSPACE</div>
          <h1>{authMode === "register" ? "Create your account." : authMode === "verify" ? "Verify your email." : authMode === "reset-request" ? "Reset your password." : authMode === "reset-confirm" ? "Choose a new password." : "Welcome back."}</h1>
          <p className="auth-muted">{authMode === "register" ? "Create a SnapText account and your own isolated workspace." : authMode === "verify" ? "Enter the one-time token sent to your email address." : authMode === "reset-request" ? "Request a one-time password reset token." : authMode === "reset-confirm" ? "Enter the token from your email and choose a new password." : "Sign in to manage image batches and extracted data."}</p>
          <form className="auth-form" onSubmit={submitAuth}>
            {["login", "register", "reset-request"].includes(authMode) && <label>Email address<input type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required maxLength={320} disabled={authBusy} /></label>}
            {["login", "register", "reset-confirm"].includes(authMode) && <label>{authMode === "reset-confirm" ? "New password" : "Password"}<input type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} required minLength={12} maxLength={128} disabled={authBusy} /><small>Use 12–128 characters.</small></label>}
            {authMode === "register" && <label>Workspace name<input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} required minLength={1} maxLength={160} disabled={authBusy} /></label>}
            {authMode === "verify" && <label>Verification token<input value={verificationToken} onChange={(event) => setVerificationToken(event.target.value)} required minLength={20} maxLength={200} autoComplete="one-time-code" disabled={authBusy} /></label>}
            {authMode === "reset-confirm" && <label>Password reset token<input value={resetToken} onChange={(event) => setResetToken(event.target.value)} required minLength={20} maxLength={200} autoComplete="one-time-code" disabled={authBusy} /></label>}
            <button className="primary-action auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "register" ? "Create account" : authMode === "verify" ? "Verify email" : authMode === "reset-request" ? "Send reset instructions" : authMode === "reset-confirm" ? "Update password" : "Sign in"} <ArrowRight size={16} /></button>
          </form>
          {authNotice && <p className="status-message" role="status">{authNotice}</p>}
          {authError && <p className="error-message" role="alert">{authError}</p>}
          <div className="auth-links">
            {authMode === "login" && <button type="button" onClick={() => { setAuthMode("register"); setAuthError(""); setAuthNotice(""); }}>Create an account</button>}
            {authMode === "register" && <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); setAuthNotice(""); }}>Already have an account? Sign in</button>}
            {authMode === "login" && <button type="button" onClick={() => { setAuthMode("reset-request"); setAuthError(""); setAuthNotice(""); }}>Forgot password?</button>}
            {authMode !== "verify" && authMode !== "reset-confirm" && authMode !== "reset-request" && <button type="button" onClick={() => { setAuthMode("verify"); setAuthError(""); setAuthNotice(""); }}>Verify email with a token</button>}
            {authMode === "reset-confirm" && <button type="button" onClick={() => { setAuthMode("reset-request"); setAuthError(""); setAuthNotice(""); }}>Request another reset token</button>}
            {authMode === "reset-request" && <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); setAuthNotice(""); }}>Back to sign in</button>}
            {authMode === "verify" && <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); setAuthNotice(""); }}>Back to sign in</button>}
          </div>
          <p className="auth-footnote">Your workspace is private to your account. Email delivery must be configured by the service operator before registration can complete.</p>
        </section>
      </main>
    );
  }

  function chooseFiles(nextFiles: FileList | null) {
    if (!nextFiles) return;
    setFiles((current) => {
      const combined = [...current];
      for (const file of Array.from(nextFiles)) {
        if (!combined.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) {
          combined.push(file);
        }
      }
      return combined.slice(0, 20);
    });
    setErrorMessage("");
    setResult(null);
    setStatusMessage("");
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setResult(null);
    setStatusMessage("");
  }

  async function uploadBatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0 || isUploading) return;
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setErrorMessage("Each image must be 10 MB or smaller.");
      return;
    }
    if (totalBytes > 100 * 1024 * 1024) {
      setErrorMessage("The combined upload must not exceed 100 MB. Remove some images and upload another batch.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setStatusMessage("Creating workspace and batch…");
    setResult(null);

    try {
      const workspacePayload = await readJson(await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName })
      }));
      const workspaceId = workspacePayload.data.id as string;

      const batchPayload = await readJson(await fetch(`/api/workspaces/${workspaceId}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: batchName })
      }));
      const batchId = batchPayload.data.id as string;

      setStatusMessage(`Uploading ${files.length} image(s)…`);
      const formData = new FormData();
      for (const file of files) formData.append("images", file, file.name);

      const uploadPayload = await readJson(await fetch(
        `/api/workspaces/${workspaceId}/batches/${batchId}/images`,
        { method: "POST", body: formData }
      ));
      const uploadResult = uploadPayload.data as UploadResult;
      setResult(uploadResult);
      setStatusMessage(
        `Batch created. ${uploadResult.accepted.length} image(s) saved; ${uploadResult.rejected.length} need attention.`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setStatusMessage("");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="SnapText home">
          <span className="brand-mark"><ScanText size={21} /></span>
          <span>SnapText</span>
        </a>
        <div className="topbar-note"><span className="status-dot" /> {authUser.email} <button className="signout-button" type="button" onClick={signOut}>Sign out</button></div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={15} /> IMAGE TO STRUCTURED DATA</div>
        <h1>Turn piles of images<br /><span>into usable data.</span></h1>
        <p className="hero-copy">Upload a batch, extract the fields you need, review uncertain values, and export everything in one clean file.</p>
        <div className="hero-actions">
          <a className="primary-action" href="#workspace">Start a batch <ArrowRight size={17} /></a>
          <span className="privacy-note"><ShieldCheck size={15} /> Review before export</span>
        </div>
      </section>

      <section className="workspace" id="workspace">
        <div className="section-heading">
          <div>
            <p className="section-kicker">YOUR WORKSPACE</p>
            <h2>Start with a batch</h2>
            <p className="section-copy">Upload multiple images together. Each accepted file is stored privately and tracked individually.</p>
          </div>
          <span className="draft-badge">Upload foundation</span>
        </div>

        <div className="workspace-grid">
          <form className="upload-panel" onSubmit={uploadBatch}>
            <div className="upload-icon"><UploadCloud size={25} /></div>
            <h3>Upload your images</h3>
            <p>Bring receipts, forms, screenshots, tables, or other image-based records into one batch.</p>

            <div className="form-fields">
              <label>
                Workspace name
                <input value={workspaceName} maxLength={160} required onChange={(event) => setWorkspaceName(event.target.value)} disabled={isUploading} />
              </label>
              <label>
                Batch name
                <input value={batchName} maxLength={200} required onChange={(event) => setBatchName(event.target.value)} disabled={isUploading} />
              </label>
            </div>

            <input
              ref={inputRef}
              className="file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/tiff,image/bmp"
              multiple
              onChange={(event) => {
                chooseFiles(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
              disabled={isUploading}
              aria-label="Choose image files"
            />
            <button
              className="dropzone"
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              aria-label="Choose image files to upload"
            >
              <FileImage size={23} />
              <strong>Choose images from your computer</strong>
              <span>PNG · JPG · WEBP · GIF · TIFF · BMP</span>
              <span>Up to 20 files, 10 MB each, 100 MB total</span>
            </button>

            {files.length > 0 && (
              <div className="selected-files">
                <div className="selected-heading">
                  <strong>{files.length} selected</strong>
                  <span>{formatBytes(totalBytes)}</span>
                </div>
                <ul>
                  {files.map((file, index) => (
                    <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                      <FileImage size={15} />
                      <span className="selected-filename">{file.name}</span>
                      <span className="file-size">{formatBytes(file.size)}</span>
                      <button type="button" className="remove-file" aria-label={`Remove ${file.name}`} onClick={() => removeFile(index)} disabled={isUploading}><X size={14} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button className="primary-action upload-submit" type="submit" disabled={isUploading || files.length === 0 || !workspaceName.trim() || !batchName.trim()}>
              {isUploading ? <><LoaderCircle className="spin" size={16} /> Uploading…</> : <>Create batch and upload <ArrowRight size={16} /></>}
            </button>
            <p className="helper-text">Files are checked by content signature on the server. OCR and extraction are not active yet.</p>

            {statusMessage && <p className="status-message" role="status"><CheckCircle2 size={16} />{statusMessage}</p>}
            {errorMessage && <p className="error-message" role="alert"><AlertCircle size={16} />{errorMessage}</p>}
            {result && (
              <div className="upload-results" aria-live="polite">
                {result.accepted.length > 0 && (
                  <>
                    <h4>Saved images ({result.accepted.length})</h4>
                    <ul>{result.accepted.map((image) => <li key={image.id}><CheckCircle2 size={14} /><span>{image.filename}</span><small>{image.status}</small></li>)}</ul>
                  </>
                )}
                {result.rejected.length > 0 && (
                  <>
                    <h4>Needs attention ({result.rejected.length})</h4>
                    <ul>{result.rejected.map((image, index) => <li className="rejected-item" key={`${image.filename}-${image.code}-${index}`}><AlertCircle size={14} /><span><strong>{image.filename}</strong><small>{image.message}</small></span></li>)}</ul>
                  </>
                )}
              </div>
            )}
          </form>

          <aside className="flow-panel">
            <div className="panel-heading"><Files size={18} /><h3>How SnapText works</h3></div>
            <ol className="steps">
              <li><span className="step-number">01</span><div><strong>Upload a batch</strong><p>Keep all source images together and track each file.</p></div></li>
              <li><span className="step-number">02</span><div><strong>Extract locally first</strong><p>OCR runs before any optional AI fallback. This stage is not active yet.</p></div></li>
              <li><span className="step-number">03</span><div><strong>Review exceptions</strong><p>Missing values and possible conflicts stay visible.</p></div></li>
              <li><span className="step-number">04</span><div><strong>Export one dataset</strong><p>Combine reviewed records into CSV or XLSX.</p></div></li>
            </ol>
            <div className="trust-note"><CheckCircle2 size={17} /><span>Unsupported and duplicate image files are flagged rather than silently merged.</span></div>
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
