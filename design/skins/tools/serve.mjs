// Serves design/skins on http://localhost:8790 for looking at the skin previews.
// index.html is written without a document skeleton (it is published as an artifact), so one is added here.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, normalize, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".js": "text/javascript", ".css": "text/css" };
const head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/") path = "/index.html";
  if (path.startsWith("/cardart/")) path = "/_cardart/" + path.slice(9); // card pictures live in _cardart (kept out of git and the zip)
  const file = normalize(join(root, path));
  if (!file.startsWith(root) || file.includes(`${join(root, "tools")}`)) { res.writeHead(403).end(); return; }
  try {
    let body = await readFile(file);
    if (path === "/index.html") body = Buffer.from(head + body.toString("utf8") + "</body></html>");
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(body);
  } catch { res.writeHead(404).end("not found"); }
}).listen(8790, "127.0.0.1", () => console.log("skin previews on http://localhost:8790"));
