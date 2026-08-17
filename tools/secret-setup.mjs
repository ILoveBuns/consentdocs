import { chmod, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";

const host = "0.0.0.0";
const port = 8787;
const secretDirectory = "/root/.config/consentdocs";
const secretPath = `${secretDirectory}/nutrient-api-key`;

const page = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>ConsentDocs 安全配置</title><style>
body{font-family:system-ui,sans-serif;max-width:680px;margin:64px auto;padding:0 24px;background:#f4f7fb;color:#17213a}
main{background:white;padding:32px;border-radius:18px;box-shadow:0 18px 50px #18315318}
label{display:block;font-weight:700;margin:20px 0 8px}input{width:100%;box-sizing:border-box;padding:14px;border:1px solid #aab7ca;border-radius:10px}
button{margin-top:18px;padding:13px 20px;border:0;border-radius:10px;background:#3957ff;color:white;font-weight:700}code{background:#edf1f7;padding:2px 6px;border-radius:5px}
</style></head><body><main><h1>ConsentDocs 安全配置</h1>
<p>密钥仅提交到当前容器，写入权限为 <code>0600</code> 的私有文件；页面不会显示、记录或回传密钥。</p>
<form method="post" action="/save"><label for="key">Nutrient Data Extraction API Key</label>
<input id="key" name="key" type="password" autocomplete="off" required minlength="20">
<button type="submit">安全保存并关闭此步骤</button></form></main></body></html>`;

createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    response.end(page);
    return;
  }
  if (request.method === "POST" && request.url === "/save") {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const key = new URLSearchParams(Buffer.concat(chunks).toString("utf8")).get("key")?.trim();
    if (!key || key.length < 20 || key.includes("\n")) {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      response.end("密钥格式无效，未保存。请返回重试。");
      return;
    }
    await mkdir(secretDirectory, { recursive: true, mode: 0o700 });
    await chmod(secretDirectory, 0o700);
    await writeFile(secretPath, key, { mode: 0o600 });
    await chmod(secretPath, 0o600);
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    response.end("<meta charset='utf-8'><h1>已安全保存</h1><p>请回到飞书回复：已保存。</p>");
    return;
  }
  response.writeHead(404).end();
}).listen(port, host, () => console.log(`secret setup listening on ${host}:${port}`));
