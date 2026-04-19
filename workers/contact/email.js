export function renderContactEmail({ name, email, subject, message, sentAt, siteUrl, siteName }) {
  const firstName = (name || "").trim().split(/\s+/)[0] || name || "";
  const siteHost = hostFromUrl(siteUrl);
  const when = formatTimestamp(sentAt);
  const replyHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Re: " + subject)}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(siteName)} · Portfolio inquiry</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f5f5f4;line-height:1px;">New message from ${esc(name)} — ${esc(subject)}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f5f4;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 1px 2px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#001815;padding:32px 32px 28px 32px;">
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#38e1d5;margin:0 0 12px 0;">New message</div>
            <div style="font-size:22px;line-height:1.3;color:#ffffff;font-weight:600;margin:0;">${esc(siteName)} · Portfolio inquiry</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#78716c;margin:0 0 8px 0;">From</div>
            <div style="font-size:18px;line-height:1.4;color:#1c1917;font-weight:600;margin:0 0 4px 0;">${esc(name)}</div>
            <div style="font-size:14px;line-height:1.4;margin:0 0 28px 0;"><a href="mailto:${esc(email)}" style="color:#0f766e;text-decoration:none;">${esc(email)}</a></div>

            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#78716c;margin:0 0 8px 0;">Subject</div>
            <div style="font-size:16px;line-height:1.4;color:#1c1917;margin:0 0 28px 0;">${esc(subject)}</div>

            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#78716c;margin:0 0 10px 0;">Message</div>
            <div style="background:#f5f5f4;border-left:3px solid #38e1d5;border-radius:6px;padding:20px;font-size:15px;line-height:1.65;color:#1c1917;white-space:pre-wrap;word-break:break-word;">${esc(message)}</div>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
              <tr>
                <td style="border-radius:8px;background:#0f766e;">
                  <a href="${replyHref}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Reply to ${esc(firstName)} →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e7e5e4;background:#fafaf9;">
            <div style="font-size:12px;line-height:1.5;color:#78716c;">
              Delivered via <a href="${esc(siteUrl)}" style="color:#0f766e;text-decoration:none;">${esc(siteHost)}</a>
              &nbsp;·&nbsp;
              ${esc(when)}
            </div>
          </td>
        </tr>
      </table>
      <div style="max-width:600px;margin-top:14px;font-size:11px;line-height:1.5;color:#a8a29e;text-align:center;">
        You're receiving this because someone submitted the contact form on ${esc(siteHost)}.
      </div>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    `NEW MESSAGE — ${siteName}`,
    "",
    `From:    ${name} <${email}>`,
    `Subject: ${subject}`,
    "",
    message,
    "",
    "—",
    `Reply:   ${email}`,
    `Source:  ${siteUrl}`,
    `Sent:    ${when}`,
  ].join("\n");

  return {
    subject: `Portfolio · ${subject}`,
    html,
    text,
  };
}

function hostFromUrl(url) {
  try {
    return new URL(url).host;
  } catch {
    return String(url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function formatTimestamp(date) {
  const d = date instanceof Date ? date : new Date(date);
  const iso = d.toISOString();
  return `${iso.slice(0, 10)} · ${iso.slice(11, 16)} UTC`;
}

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
