# 02 · 配置样例（每个文件都能直接复制）

> 这里的文件来自 **2026-10-19 隔离环境实测**（全新 `DSH_HOME`，装完「看板 + 记忆 + 会话工具 + 面板 + 归档」）。
> 复制前先看下面的对应关系——**只有第一个是"必须抄"的，其余按需。**

| 文件 | 用在哪 | 你什么时候需要它 |
|---|---|---|
| `profile-package.json` | `$DSH_HOME/profiles/web/package.json` | 想让装了什么"有据可查"、或换机后照着重装时。**不要直接覆盖**——里面版本号会随时间变，抄结构、抄行 |
| `cordis.patch.yml` | `$DSH_HOME/profiles/web/cordis.patch.yml` | 装了一个"只声明 `dsh.client`、没有 `dsh.bundle`"的包（装的时候会警告 `declares no dsh.bundle`）才需要写 |
| `check-board.mjs` | 任意目录 | 起服务后想用命令行确认「看板真的能建卡」（不需要浏览器） |

---

## 1. `profile-package.json`

**这是 `dsh plugin add` 自动生成的，不是手写的。** 列在这里的作用是让你知道"装完之后它应该长什么样"。

三条读法：

1. `dependencies` 里是**装进来的一切**（含 CLI 工具）；
2. `dsh.profile.bundles` 里**只放带 `dsh.bundle` 的包**——放进一个没有 `dsh.bundle` 的包，启动会崩（`declares no dsh.bundle in its package.json`）；
3. `@deepseek-ai/dsh-base` 与 `@deepseek-ai/dsh-web-app` 是官方两件，**永远在最前**，别删。

> ⚠️ 文件必须是 **UTF-8 无 BOM** 的合法 JSON。PowerShell 5.1 的 `Set-Content -Encoding UTF8` 会写 BOM，JS 解析会失败。

## 2. `cordis.patch.yml`

三种写法都在文件注释里。核心两条：

- `insert` 的 `name` 写 **npm 包名**；
- `id` 是条目 id，**profile 内唯一**。

实测的"必须手写"场景：`@kira905/dsh-butler-archive`（只有 `dsh.client`）。
实测的"不用手写"场景：`@kira905/dsh-task-board-local` / `dsh-memory` / `@kira905/dsh-ecosystem-panel`（都有 `dsh.bundle`，`add` 完自动进 `bundles`）。

**改完不重启就能验结构**：

```powershell
dsh --profile web --dump-config | Select-String "dsh-butler-archive"
```

## 3. `check-board.mjs`

```powershell
node check-board.mjs http://127.0.0.1:3080 "<dsh web 打印的 token>"
```

实测输出（第二次跑，已有 1 张卡）：

```
GET /?token        => 401 (68 bytes, cookies=0)
GET /state         => 200 cards=1
POST /action       => 200 {"schemaVersion":2,"revision":2,...}
GET /state         => 200 cards=2
  · card-1792423841972 | todo | 装配手册验证卡
  · card-1792424072002 | todo | 装配手册验证卡
```

- `GET /?token` 的 401 是**正常**的：token 一次性，换到 cookie 后就失效，而后续 API 的同源栅栏**不查 cookie**。
- 退出码：卡片数增加 ⇒ `0`；没增加 ⇒ `1`（可以用来接 CI）。
- 它建的是**验证卡**，看完在 GUI 里删掉即可。

## 4. 不需要写配置的清单（省得你到处找）

| 你可能想改 | 其实不用改 | 为什么 |
|---|---|---|
| 看板端口 / 路径 | 不用 | 跟宿主同一个服务、同一个 `DSH_HOME` |
| 记忆库路径 | 不用 | 插件默认 `dshHomePath('memory/memory.db')` |
| 会话工具的连接地址 | **要改（环境变量）** | `$env:DSH_WEB_URL`，默认 `http://127.0.0.1:3080` |
| 模型凭据 | **要填** | `$DSH_HOME/.credentials.yaml` 或 GUI「设置 → 模型」 |
