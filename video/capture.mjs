import { mkdir, readFile, writeFile } from "node:fs/promises";

const cdp = "http://codex-browser:9223";
const frames = new URL("./frames/", import.meta.url);
await mkdir(frames, { recursive: true });

const target = await (await fetch(`${cdp}/json/new?about%3Ablank`, { method: "PUT" })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let id = 0;
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const current = ++id;
  socket.send(JSON.stringify({ id: current, method, params }));
  const listener = (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== current) return;
    socket.removeEventListener("message", listener);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  };
  socket.addEventListener("message", listener);
});
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

async function navigate(url) {
  await call("Page.navigate", { url });
  await pause(2300);
}

async function evaluate(expression) {
  return call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
}

async function screenshot(name) {
  const result = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(new URL(`${name}.png`, frames), Buffer.from(result.data, "base64"));
  console.log(name);
}

await navigate("https://ilovebuns.github.io/consentdocs/");
await screenshot("01-complete");
await evaluate(`document.querySelector('[data-document="missing"]').click()`);
await pause(400);
await screenshot("02-missing");
await evaluate(`document.querySelector('[data-document="conflict"]').click()`);
await pause(400);
await screenshot("03-conflict");

await navigate("https://github.com/ILoveBuns/consentdocs/blob/main/evidence/RUN_002.md");
await screenshot("04-evidence");

await navigate("http://fnos-lark-coding-agent-bridge:4173/");
const fixtureBase64 = (await readFile(new URL("../fixtures/missing-withdrawal.pdf", import.meta.url))).toString("base64");
await evaluate(`(()=>{const bytes=Uint8Array.from(atob('${fixtureBase64}'),c=>c.charCodeAt(0));const transfer=new DataTransfer();transfer.items.add(new File([bytes],'missing-withdrawal.pdf',{type:'application/pdf'}));const input=document.querySelector('#pdf-upload');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
await pause(8500);
await screenshot("05-real-upload");
await evaluate(`document.querySelector('#rationale').value='Verified alternate withdrawal instructions against source evidence'; document.querySelector('#approve-button').click()`);
await pause(1200);
await evaluate(`document.querySelector('#action-message').scrollIntoView({ block: 'center' })`);
await pause(300);
await screenshot("06-audit-approved");

await navigate("https://ilovebuns.github.io/consentdocs/");
await screenshot("07-close");
socket.close();
