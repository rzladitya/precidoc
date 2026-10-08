# Product update subscriptions

The landing form records explicit consent, email and interface language in `precidoc_newsletter` on Neon. It uses single opt-in; it does not send a confirmation email or verify email ownership. Duplicate subscriptions reuse the existing unsubscribe token. Submitting the form again after unsubscribing records new consent. JSON requests are limited to 2 KiB, require the same origin, and are limited to five valid attempts per client IP per ten-minute window. The rate table keeps hashed client keys.

Run the existing `pnpm db:migrate` after setting the production database URL. It creates the newsletter tables without changing existing account records. Existing Cloudflare database bindings are sufficient for collection; the form does not need a Resend key in the Worker.

Prepare an update file with `url` pointing to the Precidoc site and `en`/`id` objects containing `subject` and `intro`. Preview the audience in the configured Node environment:

```sh
NODE_USE_ENV_PROXY=1 node --env-file-if-exists=.env.local scripts/send-product-update.mjs --message-file=/path/to/update.json
```

This prints counts and sends nothing. After the owner explicitly requests sending that update, add `--send`. The script uses the configured Resend API key and the verified `Precidoc <noreply@rainc.web.id>` sender. Provider quotas still apply; API acceptance does not establish inbox delivery. Sending is manual, not triggered by every deployment or blog edit. Keep subscriber data and unsubscribe tokens out of logs and Git.

Each update includes an unsubscribe link. Opening it shows a confirmation page; only pressing its button changes the subscription, so email link scanners do not unsubscribe someone. The endpoint is idempotent and does not affect the user's SaaS account.
