// The managed proxy CA is trusted by Node, but not by Chromium's separate store.
// Relay actual HTTPS responses with TLS verification enabled. No response mocks,
// authentication bypass, relaxed certificate checks, or cookie persistence.
export async function attachHttpsRelay(context, origin) {
  const allowed = new URL(origin).origin;
  const failures = [];
  await context.route(`${allowed}/**`, async route => {
    try {
      const request = route.request();
      const headers = await request.allHeaders();
      delete headers.host;
      const response = await fetch(request.url(), {
        method: request.method(), headers,
        body: ['GET', 'HEAD'].includes(request.method()) ? undefined : request.postDataBuffer(),
        redirect: 'manual', signal: AbortSignal.timeout(45000),
      });
      const forwarded = Object.fromEntries(response.headers);
      // Fetch decompresses the bytes; forwarding compression headers is incorrect.
      delete forwarded['content-encoding'];delete forwarded['content-length'];delete forwarded['transfer-encoding'];
      const cookies = response.headers.getSetCookie();
      if (cookies.length) forwarded['set-cookie'] = cookies.join('\n');
      await route.fulfill({ status: response.status, headers: forwarded, body: Buffer.from(await response.arrayBuffer()) });
    } catch (error) {
      failures.push({ path: new URL(route.request().url()).pathname, error: error.name });
      await route.abort('failed');
    }
  });
  return failures;
}
