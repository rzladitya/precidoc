import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Use the supported Webpack build to keep the Worker upload compact.
const config = { ...defineCloudflareConfig({}), buildCommand: 'pnpm exec next build --webpack' };

export default config;
