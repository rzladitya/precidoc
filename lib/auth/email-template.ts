export type AuthEmailPurpose = 'email-verification' | 'sign-in' | 'forget-password';
export type AuthEmail = {
  purpose: AuthEmailPurpose;
  expiresAt: string;
  issuedAt: string;
} & ({ kind: 'otp'; code: string } | { kind: 'link'; url: string });

const website = 'https://precidoc.rainc.web.id';
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

export function renderAuthEmail(message: AuthEmail) {
  const minutes = Math.max(1, Math.ceil((Date.parse(message.expiresAt) - Date.parse(message.issuedAt)) / 60000));
  const validity = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  const copy = {
    'email-verification': {
      subject: 'Verify your email | Precidoc',
      label: 'ACCOUNT VERIFICATION',
      heading: 'Verify your email',
      intro: message.kind === 'otp' ? 'Enter the code below in Precidoc to verify your email and finish setting up your account.' : 'Confirm your email address to finish setting up your Precidoc account.',
      action: 'Verify email',
      context: 'You received this email because someone registered a Precidoc account with this email address.',
    },
    'sign-in': {
      subject: 'Your sign-in request | Precidoc',
      label: 'ACCOUNT ACCESS',
      heading: 'Sign in to Precidoc',
      intro: message.kind === 'otp' ? 'Enter the code below in Precidoc to complete your sign-in.' : 'Use the link below to sign in to your Precidoc workspace.',
      action: 'Sign in',
      context: 'You received this email because a sign-in was requested for your Precidoc account.',
    },
    'forget-password': {
      subject: 'Reset your password | Precidoc',
      label: 'PASSWORD RESET',
      heading: 'Reset your password',
      intro: message.kind === 'otp' ? 'Enter the code below in Precidoc to continue resetting your password.' : 'Use the link below to choose a new password for your Precidoc account.',
      action: 'Reset password',
      context: 'You received this email because a password reset was requested for your Precidoc account.',
    },
  }[message.purpose];
  const expiry = `This ${message.kind === 'otp' ? 'code' : 'link'} expires in ${validity}.`;
  const safety = message.kind === 'otp' ? 'Keep this code private. Precidoc will never ask you to share it.' : 'Keep this link private. Precidoc will never ask you to forward it.';
  const ignore = message.purpose === 'forget-password' ? 'If you did not request this, ignore this email. Your password will stay the same.' : 'If you did not request this, you can safely ignore this email.';
  const action = message.kind === 'otp'
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" bgcolor="#eef3ff" style="border:1px solid #d8e3ff;border-radius:10px;padding:23px 12px"><p style="margin:0 0 8px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:1.3px;color:#526174">VERIFICATION CODE</p><p style="margin:0;font-family:Consolas,'Courier New',monospace;font-size:36px;line-height:46px;font-weight:700;letter-spacing:7px;color:#172638">${escapeHtml(message.code)}</p></td></tr></table>`
    : `<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#2457f5" style="border-radius:8px"><a href="${escapeHtml(message.url)}" style="display:inline-block;padding:15px 24px;color:#ffffff;font-size:15px;line-height:20px;font-weight:600;text-decoration:none">${copy.action}</a></td></tr></table>`;
  const fallback = message.kind === 'link' ? `<p style="margin:20px 0 0;font-size:12px;line-height:20px;color:#526174">If the button does not work, copy and paste this link into your browser:<br/><a href="${escapeHtml(message.url)}" style="color:#2457f5;word-break:break-all">${escapeHtml(message.url)}</a></p>` : '';
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><title>${copy.subject}</title></head>
<body style="margin:0;padding:0;background-color:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#172638">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${copy.heading}. ${expiry}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f4f6fa"><tr><td align="center" style="padding:32px 16px">
<!--[if mso]><table role="presentation" width="560" cellspacing="0" cellpadding="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width:560px;border:1px solid #dfe5ee;border-radius:12px;overflow:hidden">
<tr><td height="4" bgcolor="#2457f5" style="height:4px;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:28px 28px 24px;border-bottom:1px solid #edf0f5"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td width="44" valign="middle"><a href="${website}" style="text-decoration:none"><img src="${website}/precidoc-logo.png" alt="Precidoc logo" width="44" height="44" style="display:block;border:0;width:44px;height:44px"/></a></td><td valign="middle" style="padding-left:12px"><p style="margin:0;font-size:22px;line-height:26px;font-weight:700;color:#172638">Precidoc</p><p style="margin:3px 0 0;font-size:12px;line-height:16px;color:#526174">by Rainc</p></td></tr></table></td></tr>
<tr><td style="padding:28px"><p style="margin:0 0 12px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:1.3px;color:#2457f5">${copy.label}</p><h1 style="margin:0 0 16px;font-size:28px;line-height:36px;font-weight:700;letter-spacing:-.5px;color:#172638">${copy.heading}</h1><p style="margin:0 0 24px;font-size:15px;line-height:25px;color:#526174">${copy.intro}</p>
${action}<p style="margin:16px 0 0;font-size:13px;line-height:21px;color:#526174">${expiry}<br/>${safety}</p>${fallback}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px"><tr><td style="border-top:1px solid #edf0f5;padding-top:20px"><p style="margin:0;font-size:12px;line-height:20px;color:#526174">${copy.context} ${ignore}</p><p style="margin:12px 0 0;font-size:12px;line-height:20px;color:#526174">Need help? <a href="mailto:admin@rainc.web.id" style="color:#2457f5;text-decoration:underline">Contact the Precidoc team</a>.</p></td></tr></table>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
<p style="margin:20px 0 0;font-size:12px;line-height:20px;color:#526174">Precidoc by Rainc · <a href="${website}" style="color:#526174;text-decoration:none">precidoc.rainc.web.id</a></p>
</td></tr></table></body></html>`;
  const text = [`Precidoc by Rainc`, '', copy.heading, '', copy.intro, '', message.kind === 'otp' ? `Verification code: ${message.code}` : `${copy.action}: ${message.url}`, '', expiry, safety, '', copy.context, ignore, '', 'Need help? admin@rainc.web.id', website].join('\n');
  return { subject: copy.subject, html, text };
}
