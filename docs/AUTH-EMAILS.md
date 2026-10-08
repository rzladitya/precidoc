# Branded authentication emails

Neon Auth generates and verifies authentication codes and tokens. Its `send.otp` and `send.magic_link` webhooks deliver them through `/api/webhooks/neon-auth`, which verifies detached Ed25519 signatures against the production branch's JWKS before sending through Resend. Other Neon Auth events are not subscribed.

The HTML and plain-text templates are in `lib/auth/email-template.ts`. They cover email verification, sign-in and password reset. The logo is the existing Precidoc mark, exported as `public/precidoc-logo.png` for email clients. Email content is English, matching the previous authentication emails; the website language switch does not currently change email language. Expiration copy comes from the event's issue and expiration times.

The Worker requires its existing `NEON_AUTH_BASE_URL` binding plus a real `RESEND_API_KEY` secret. A Codex proxy credential placeholder cannot be used as a production Worker secret. Keep secrets out of source, generated previews and logs. The sender remains `Precidoc <noreply@rainc.web.id>`.

Deploy and verify the endpoint and public logo before enabling the webhook in Neon. Configure only `send.otp` and `send.magic_link`, URL `https://precidoc.rainc.web.id/api/webhooks/neon-auth`, timeout 10 seconds. Subscribing replaces Neon's default delivery for these events. Resend errors return 503 so Neon can retry within its 15-second budget. Each event uses a stable Resend idempotency key, preventing duplicate email delivery on retries within the provider's idempotency window.

If delivery fails, disable the webhook (`enabled: false`) in Neon to restore the saved SMTP provider. Do not alter email verification requirements or invalidate existing users or sessions to change email appearance.

Run `node tests/verify-auth-emails.cjs` for signature, payload, expiry, delivery failure, retry key, template and unsafe-link checks. This harness uses generated local signing keys and a simulated Resend response; it does not prove inbox delivery. A real Neon event and a provider receipt are required for live delivery evidence.

Official references: [Customize emails](https://neon.com/docs/auth/guides/customize-emails), [Webhooks](https://neon.com/docs/auth/guides/webhooks).
