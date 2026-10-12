import type { NextConfig } from "next";
const dev=process.env.NODE_ENV==='development';
const csp=["default-src 'self'",`script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev?" 'unsafe-eval'":''}`,"style-src 'self' 'unsafe-inline'","img-src 'self' data: blob:","font-src 'self'",`connect-src 'self' blob:${dev?' ws:':''}`,"worker-src 'self' blob:","object-src 'none'","frame-src 'none'","frame-ancestors 'none'","base-uri 'self'","form-action 'self'"].join('; ');
const nextConfig: NextConfig = {
  experimental: { cpus: 2 },
  async redirects(){return [{
    source:'/:path*',
    has:[{type:'host',value:'precidoc\\.rainc\\.web\\.id'}],
    destination:'https://precidoc.rainc.tech/:path*',
    permanent:true,
  }];},
  async headers(){return [{source:'/:path*',headers:[
    {key:'Content-Security-Policy',value:csp},
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'Referrer-Policy',value:'no-referrer'},
    {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
  ]}];},
};
export default nextConfig;
