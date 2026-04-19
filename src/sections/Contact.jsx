import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import Turnstile from "../components/Turnstile.jsx";
import { useNotify } from "../components/notify.js";
import { submitContact } from "../utils/formSubmit.js";
import { checkHoneypot, checkMinTime, checkRateLimit, recordSubmission } from "../utils/ddos.js";
import { useConfig } from "../config/ConfigContext.jsx";

const ICON_MAP = { email: "mail", map: "map", github: "github", phone: "phone" };

export default function Contact() {
  const { contact, profile } = useConfig();
  const { notify } = useNotify();
  const mountedAt = useRef(Date.now());
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [honey, setHoney] = useState({});
  const [errs, setErrs] = useState({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const handleToken = useCallback((token) => setTurnstileToken(token), []);
  const handleExpire = useCallback(() => setTurnstileToken(""), []);

  if (!contact?.enabled) return null;

  const h = contact.heading || {};
  const honeypotField = contact.form?.ddos?.honeypotField || "website";
  const minSubmitMs = contact.form?.ddos?.minSubmitMs ?? 1500;
  const rateCfg = contact.form?.ddos?.rateLimit;
  const submissionType = contact.form?.submission?.type;
  const turnstileSiteKey =
    submissionType === "turnstile" ? contact.form?.submission?.turnstile?.siteKey : "";
  const turnstileRequired = submissionType === "turnstile" && Boolean(turnstileSiteKey);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please add your name";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "That email doesn't look right";
    if (!form.subject.trim()) e.subject = "Give it a subject";
    if (!form.message.trim()) e.message = "Add a short message";
    else if (form.message.trim().length < 10) e.message = "A bit more detail, please";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (submitting) return;

    const fieldErrs = validate();
    setErrs(fieldErrs);
    if (Object.keys(fieldErrs).length > 0) {
      notify({ type: "warning", title: "Check the form", message: "A few fields need attention." });
      return;
    }

    if (!checkHoneypot(honey, honeypotField)) {
      notify({ type: "error", title: "Submission blocked", message: "Looks like an automated request." });
      return;
    }
    if (!checkMinTime(mountedAt.current, minSubmitMs)) {
      notify({ type: "error", title: "Slow down", message: "Please take a moment to review, then submit again." });
      return;
    }
    const rate = checkRateLimit(rateCfg);
    if (!rate.allowed) {
      const mins = Math.ceil(rate.retryAfterSec / 60);
      notify({
        type: "error",
        title: "Too many attempts",
        message: `Try again in ~${mins} minute${mins > 1 ? "s" : ""}.`,
      });
      return;
    }

    if (turnstileRequired && !turnstileToken) {
      notify({
        type: "warning",
        title: "Verification pending",
        message: "Please complete the challenge above before sending.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = turnstileRequired ? { ...form, token: turnstileToken } : form;
      await submitContact(payload, contact.form.submission);
      recordSubmission();
      setSent(true);
      setTurnstileToken("");
      notify({ type: "success", title: "Message sent", message: `I'll reply to ${form.email} within a day.` });
    } catch (err) {
      setTurnstileToken("");
      if (window.turnstile) {
        try { window.turnstile.reset(); } catch { /* noop */ }
      }
      notify({
        type: "error",
        title: "Couldn't send message",
        message: err?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact">
      <div className="container">
        <div className="contact-wrap">
          <div className="contact-info">
            <div
              className="tag"
              style={{
                fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.06em",
                textTransform: "uppercase", color: "var(--accent)", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ width: 20, height: 1, background: "var(--accent)" }} /> {contact.eyebrow}
            </div>
            <h2>{h.before}<span className="serif">{h.serif}</span>{h.after}</h2>
            <p>{contact.lead}</p>

            <div className="links">
              {contact.links.map((l, i) => (
                <a key={i} href={l.href || "#"}>
                  <div className="icon"><Icon name={ICON_MAP[l.type] || "mail"} /></div>
                  <div>
                    <div className="lbl">{l.lbl}</div>
                    <div className="val">{l.val}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {sent ? (
            <div className="contact-form">
              <div className="form-success">
                <div className="check"><Icon name="check" cls="i xl" /></div>
                <h3>Message received</h3>
                <p>
                  Thanks, {form.name.split(" ")[0] || "there"} — {profile.name.split(" ")[0]} will get back to you at{" "}
                  <strong style={{ color: "var(--accent)" }}>{form.email}</strong> within a day.
                </p>
                <button
                  className="btn ghost small"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    setSent(false);
                    setForm({ name: "", email: "", subject: "", message: "" });
                    setHoney({});
                    setErrs({});
                    setTurnstileToken("");
                    mountedAt.current = Date.now();
                  }}
                >
                  Send another
                </button>
              </div>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit} noValidate>
              {/* honeypot — hidden from humans, tempting for bots */}
              <div className="honeypot" aria-hidden="true">
                <label htmlFor={honeypotField}>Do not fill</label>
                <input
                  id={honeypotField}
                  name={honeypotField}
                  type="text"
                  tabIndex="-1"
                  autoComplete="off"
                  value={honey[honeypotField] || ""}
                  onChange={(e) => setHoney({ ...honey, [honeypotField]: e.target.value })}
                />
              </div>

              <div className="row2">
                <div className={`field ${errs.name ? "invalid" : ""}`}>
                  <label>Your name</label>
                  <input
                    className="input" value={form.name} placeholder="Ada Lovelace"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {errs.name && <div className="err">{errs.name}</div>}
                </div>
                <div className={`field ${errs.email ? "invalid" : ""}`}>
                  <label>Email</label>
                  <input
                    className="input" type="email" value={form.email} placeholder="ada@analytical.co"
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errs.email && <div className="err">{errs.email}</div>}
                </div>
              </div>
              <div className={`field ${errs.subject ? "invalid" : ""}`}>
                <label>Subject</label>
                <input
                  className="input" value={form.subject} placeholder="A new platform build"
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
                {errs.subject && <div className="err">{errs.subject}</div>}
              </div>
              <div className={`field ${errs.message ? "invalid" : ""}`}>
                <label>Message</label>
                <textarea
                  className="textarea" value={form.message}
                  placeholder="Tell me about the project, the team, and the timeline…"
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                {errs.message && <div className="err">{errs.message}</div>}
              </div>

              {turnstileRequired && (
                <div className="field">
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onToken={handleToken}
                    onExpire={handleExpire}
                  />
                </div>
              )}

              <div className="form-footer">
                <span className="consent">{contact.consent}</span>
                <button
                  className="btn primary"
                  type="submit"
                  disabled={submitting || (turnstileRequired && !turnstileToken)}
                >
                  <Icon name="send" /> {submitting ? "Sending…" : "Send message"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
