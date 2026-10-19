// check-board.mjs —— 看板端到端自检（建一张验证卡，读回来）
//
// 用法：
//   node check-board.mjs <baseUrl> <token>
// 例：
//   node check-board.mjs http://127.0.0.1:3080 3f9a...（终端里 `dsh web` 打印的那串）
//
// 依赖：Node ≥ 18（内置 fetch）。零 npm 依赖。
// 副作用：会在看板里建一张标题为「装配手册验证卡」的 todo 卡。看完可以在 GUI 里删掉。
//
// 两条实测口径（写错了会一直被拒）：
//   ① 必须带同源头 `sec-fetch-site: same-origin`，否则 403 {"ok":false,"error":"forbidden"}
//   ② token 是一次性的：拿它换 cookie 之后再复用会 401，但不影响后续 API（同源栅栏不查 cookie）

const base = process.argv[2] ?? 'http://127.0.0.1:3080';
const token = process.argv[3];

async function main() {
if (!token) {
  console.error('用法: node check-board.mjs <baseUrl> <token>');
  return 2;
}

const jar = [];
const cookieHeader = () => jar.map(([k, v]) => `${k}=${v}`).join('; ');

async function req(path, init = {}) {
  const res = await fetch(new URL(path, base), {
    ...init,
    headers: {
      'sec-fetch-site': 'same-origin',
      ...(jar.length ? { cookie: cookieHeader() } : {}),
      ...(init.headers ?? {}),
    },
  });
  for (const sc of res.headers.getSetCookie?.() ?? []) {
    const [pair] = sc.split(';');
    const i = pair.indexOf('=');
    if (i > 0) jar.push([pair.slice(0, i), pair.slice(i + 1)]);
  }
  return { status: res.status, text: await res.text() };
}

const html = await req(`/?token=${encodeURIComponent(token)}`);
console.log(`GET /?token        => ${html.status} (${html.text.length} bytes, cookies=${jar.length})`);

const s1 = await req('/api/task-board/state');
const st1 = JSON.parse(s1.text);
console.log(`GET /state         => ${s1.status} cards=${st1.tasks.length}`);

const id = `card-${Date.now()}`;
const payload = {
  requestId: `req-${Date.now()}`,
  action: {
    kind: 'create',
    id,
    input: {
      title: '装配手册验证卡',
      description: '由 check-board.mjs 创建，仅用于确认看板可建卡。',
      prompt: '这是验证卡，不需要执行。',
    },
  },
};
const c = await req('/api/task-board/action', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});
console.log(`POST /action       => ${c.status} ${c.text.slice(0, 120)}`);

const s2 = await req('/api/task-board/state');
const st2 = JSON.parse(s2.text);
console.log(`GET /state         => ${s2.status} cards=${st2.tasks.length}`);
for (const t of st2.tasks.slice(-3)) console.log(`  · ${t.id} | ${t.status} | ${t.title}`);

return st2.tasks.length > st1.tasks.length ? 0 : 1;
}

process.exitCode = await main();
