import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webDir = dirname(fileURLToPath(import.meta.url));
// Explicit public files: source art, documentation and filesystem paths are never served.
const PUBLIC_FILES = new Map([
  ["/assets/archive-writing-desk.webp", ["assets/archive-writing-desk.webp", "image/webp"]],
  ["/assets/archive-portrait-frame.webp", ["assets/archive-portrait-frame.webp", "image/webp"]],
  ["/gear.css", ["gear.css", "text/css; charset=utf-8"]],
  ["/skills.css", ["skills.css", "text/css; charset=utf-8"]],
  ["/assets/archive-binding.webp", ["assets/archive-binding.webp", "image/webp"]],
  ["/assets/card-side-black-rose.webp", ["assets/card-side-black-rose.webp", "image/webp"]],
  ["/assets/card-side-books.webp", ["assets/card-side-books.webp", "image/webp"]],
  ["/assets/card-side-documents.webp", ["assets/card-side-documents.webp", "image/webp"]],
  ["/assets/card-side-flowers.webp", ["assets/card-side-flowers.webp", "image/webp"]],
  ["/card-actions.js", ["card-actions.js", "text/javascript; charset=utf-8"]],
  ["/investigator-list.css", ["investigator-list.css", "text/css; charset=utf-8"]],
  ["/investigator-list-client.js", ["investigator-list-client.js", "text/javascript; charset=utf-8"]],
  ["/assets/archive-paper-frame.webp", ["assets/archive-paper-frame.webp", "image/webp"]],
  ["/assets/archive-botanical-edge.webp", ["assets/archive-botanical-edge.webp", "image/webp"]],
  ["/assets/archive-wax-seal.webp", ["assets/archive-wax-seal.webp", "image/webp"]],
  ["/login.css", ["login.css", "text/css; charset=utf-8"]],
  ["/assets/login-study.webp", ["assets/login-study.webp", "image/webp"]],
  ["/assets/archive-emblem.png", ["assets/archive-emblem.png", "image/png"]],
  ["/assets/brass-corner.svg", ["assets/brass-corner.svg", "image/svg+xml"]],
  ["/assets/archive-divider.svg", ["assets/archive-divider.svg", "image/svg+xml"]],
  ["/assets/paper-texture.svg", ["assets/paper-texture.svg", "image/svg+xml"]],
  ["/assets/archive-login.woff2", ["assets/archive-login.woff2", "font/woff2"]],
  ["/ui/asset-review", ["asset-review.html", "text/html; charset=utf-8"]],
  ["/ui/asset-review.css", ["asset-review.css", "text/css; charset=utf-8"]],
]);

export function serveStaticAsset(request, response, pathname) {
  const entry = PUBLIC_FILES.get(pathname);
  if (!entry && !pathname.startsWith("/assets/") && !pathname.startsWith("/ui/") && pathname !== "/login.css") return false;
  if (!entry) {
    response.statusCode = 404;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("没有这个素材");
    return true;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.statusCode = 405;
    response.setHeader("Allow", "GET, HEAD");
    response.end("方法不允许");
    return true;
  }
  const body = readFileSync(join(webDir, entry[0]));
  response.statusCode = 200;
  response.setHeader("Content-Type", entry[1]);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Content-Length", body.length);
  response.end(request.method === "HEAD" ? undefined : body);
  return true;
}
