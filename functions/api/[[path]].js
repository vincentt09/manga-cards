const RENDER_API = "https://manga-cards-vincentt09.onrender.com";

export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const target = new URL(`${incoming.pathname}${incoming.search}`, RENDER_API);
  const headers = new Headers(context.request.headers);
  headers.set("X-Forwarded-Host", incoming.host);

  const proxyRequest = new Request(target.toString(), {
    method: context.request.method,
    headers,
    body: ["GET", "HEAD"].includes(context.request.method) ? undefined : context.request.body,
    redirect: "manual",
  });

  return fetch(proxyRequest);
}
