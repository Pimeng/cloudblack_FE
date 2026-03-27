// Cloudflare Pages Worker for SPA routing
// This ensures all routes serve index.html while static assets are served correctly

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if the request is for a static asset
    const isStaticAsset = 
      pathname.startsWith('/assets/') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.json') ||
      pathname.endsWith('.woff') ||
      pathname.endsWith('.woff2') ||
      pathname.endsWith('.ttf') ||
      pathname.endsWith('.eot') ||
      pathname.endsWith('.otf');

    // If it's a static asset, serve it directly
    if (isStaticAsset) {
      return env.ASSETS.fetch(request);
    }

    // For all other routes, serve index.html (SPA routing)
    const indexRequest = new Request(`${url.origin}/index.html`, request);
    return env.ASSETS.fetch(indexRequest);
  }
};
