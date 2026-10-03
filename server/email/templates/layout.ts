export interface EmailTemplate { subject: string; html: string; text: string }
export interface EmailContent {
  subject: string;
  title: string;
  paragraphs: string[];
  details?: Array<[string, string]>;
  items?: Array<{ name: string; quantity: number; subtotal: number }>;
  cta?: { label: string; url: string };
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!);
}
export function safeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}
export function money(value: number): string {
  if (!Number.isFinite(value) || value < 0) throw new Error('Invalid amount');
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
}
export function renderLayout(content: EmailContent): EmailTemplate {
  const e = escapeHtml;
  const url = safeUrl(content.cta?.url);
  const details = (content.details || []).map(([label, value]) =>
    `<p style="margin:0 0 12px"><span style="color:#72685e;font-size:12px;text-transform:uppercase;letter-spacing:1px">${e(label)}</span><br><strong>${e(value)}</strong></p>`).join('');
  const items = content.items?.map((item) =>
    `<tr><td style="padding:12px 0;border-bottom:1px solid #e8e0d5;overflow-wrap:anywhere">${e(item.name)}<br><span style="color:#72685e;font-size:14px">Quantity: ${e(String(item.quantity))}</span></td><td style="padding:12px 0 12px 12px;border-bottom:1px solid #e8e0d5;text-align:right">${e(money(item.subtotal))}</td></tr>`).join('');
  const footer = 'Thoughtfully chosen. Carefully prepared.\nGood Things Co.\nQuestions? Reply to this email and our team will help.';
  return {
    subject: content.subject.replace(/[\r\n]/g, ' ').slice(0, 200),
    text: [content.title, ...content.paragraphs,
      ...(content.items || []).map(i => `${i.name} × ${i.quantity} — ${money(i.subtotal)}`),
      ...(content.details || []).map(([label, value]) => `${label}: ${value}`),
      ...(url ? [`${content.cta!.label}: ${url}`] : []), footer].join('\n\n'),
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(content.subject)}</title></head>
<body style="margin:0;background:#FAF8F5;color:#302b25;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffdf9;border-top:3px solid #9b8057"><tr><td style="padding:28px 24px;overflow-wrap:anywhere">
<p style="margin:0 0 28px;font-size:13px;font-weight:bold;letter-spacing:3px">GOOD THINGS CO.</p>
<h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.25;font-weight:normal;margin:0 0 20px">${e(content.title)}</h1>
${content.paragraphs.map(p => `<p style="margin:0 0 16px">${e(p).replace(/\n/g, '<br>')}</p>`).join('')}
${items ? `<table aria-label="Order items" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">${items}</table>` : ''}
${details ? `<div style="padding:20px;background:#f3eee6;margin:24px 0">${details}</div>` : ''}
${url ? `<p style="margin:24px 0"><a href="${e(url)}" style="display:inline-block;padding:14px 24px;background:#302b25;color:#ffffff;text-decoration:none;border-radius:3px">${e(content.cta!.label)}</a></p>` : ''}
<p style="margin:32px 0 0;padding-top:20px;border-top:1px solid #e8e0d5;color:#72685e;font-size:13px">${e(footer).replace(/\n/g, '<br>')}</p>
</td></tr></table></td></tr></table></body></html>`,
  };
}
