import { requestHandler } from "../server/index.mjs";

export default function handler(req, res) {
  const incoming = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const route = incoming.searchParams.get("route") || "";
  incoming.searchParams.delete("route");
  const query = incoming.searchParams.toString();
  req.url = `/api/${route}${query ? `?${query}` : ""}`;
  return requestHandler(req, res);
}
