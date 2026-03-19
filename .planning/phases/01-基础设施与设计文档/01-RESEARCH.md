# Phase 1: 基础设施与设计文档 - Research

**Researched:** 2026-03-20
**Domain:** Electron + Vue 3 + Vite 集成、双 API 鉴权（HMAC-SHA256 + JWT HS256）、密钥安全存储
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOC-01 | 生成 UI 设计文档（docs/UI设计文档.md） | 组件结构、页面布局、Ionic Vue 组件选型已明确 |
| DOC-02 | 生成技术设计文档（docs/技术设计文档.md） | 架构图、IPC 通道定义、鉴权流程已完整记录 |
| CONF-01 | 用户可以在设置页面输入并保存即梦 AK/SK | electron-store 加密存储方案，IPC 通道设计已明确 |
| CONF-02 | 用户可以在设置页面输入并保存可灵 AK/SK | 同 CONF-01，同一存储模块 |
| CONF-03 | 设置页面显示已配置/未配置状态，不显示明文 | 渲染进程只接收布尔状态，密钥不离开主进程 |
</phase_requirements>

## Summary

Phase 1 的核心任务是三件事：把裸 Electron 项目升级为 Electron + Vue 3 + Vite 的完整开发环境；在主进程实现两套 API 鉴权逻辑（即梦 HMAC-SHA256 V4、可灵 JWT HS256）并通过 IPC 隔离密钥；生成两份设计文档作为后续开发的规范基础。

现有项目极简：`main.js` 只有 13 行，`index.html` 是占位页面，没有任何构建工具。需要从零引入 Vite + Vue 3 + TypeScript，并重构 `main.js` 支持 preload 脚本和 contextBridge。这是一次完整的项目骨架搭建，不是增量修改。

两套鉴权的实现位置是安全红线：所有签名计算必须在 Electron 主进程完成，渲染进程通过 IPC 请求，密钥存储在 electron-store（支持 safeStorage 加密）。密钥绝不能出现在渲染进程代码或 DevTools 可见的内存中。

**Primary recommendation:** 使用 electron-vite 脚手架一步完成 Electron + Vue 3 + Vite + TypeScript 集成，比手动配置节省 80% 的时间且避免常见的 ESM/CJS 混用问题。

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| electron-vite | ^3.x | Electron + Vite 集成脚手架 | 官方推荐方案，自动处理主进程/渲染进程双 Vite 配置，解决 ESM/CJS 混用问题 |
| Vue 3 | ^3.5.x | 渲染进程 UI 框架 | 已决策，Composition API 适合组件化 |
| Vite | ^6.x | 构建工具 | electron-vite 内置，HMR 快 |
| TypeScript | ^5.x | 类型安全 | API 响应结构复杂，类型约束减少运行时错误 |
| Pinia | ^2.x | 状态管理 | 已决策，轻量，与 Vue 3 原生契合 |
| electron-store | ^10.x | 密钥持久化存储 | 主进程专用，支持 Electron safeStorage 加密，比 localStorage 安全 |
| crypto-js | ^4.2.x | 即梦 HMAC-SHA256 签名 | 已决策，同步 API，浏览器/Node 双兼容 |
| jose | ^5.x | 可灵 JWT HS256 生成 | 已决策，纯 ESM，无 Node.js 原生依赖 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Ionic Vue | ^8.x | 移动端 UI 组件 | Phase 1 引入但主要在 Phase 2+ 使用 |
| @vueuse/core | ^11.x | Vue 组合式工具集 | useIntervalFn 用于轮询控制（Phase 2+） |
| axios | ^1.7.x | HTTP 客户端 | Phase 2+ API 调用，Phase 1 不需要 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| electron-vite | 手动配置 vite.config.ts | 手动配置需处理 externals、preload 构建、HMR reload、sourcemap 等，容易出错 |
| electron-store | safeStorage + fs.writeFile | electron-store 封装了 safeStorage，API 更简洁 |
| jose | jsonwebtoken | jsonwebtoken 依赖 Node.js crypto 模块，Capacitor WebView 中不可用 |
| crypto-js | SubtleCrypto | SubtleCrypto 是异步 API，即梦多步骤签名用同步更清晰 |

**Installation:**
```bash
npm install electron-vite --save-dev
npm install vue @vitejs/plugin-vue
npm install typescript vue-tsc --save-dev
npm install pinia
npm install @ionic/vue @ionic/vue-router ionicons
npm install electron-store
npm install crypto-js jose
npm install -D @types/crypto-js
npm install vitest --save-dev
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── main/
│   ├── index.ts             # 主进程入口，BrowserWindow 创建
│   ├── ipc/
│   │   └── configHandlers.ts  # 密钥存取 IPC 处理器
│   ├── auth/
│   │   ├── hmacSigner.ts    # 即梦 HMAC-SHA256 V4 签名
│   │   └── jwtSigner.ts     # 可灵 JWT HS256 生成
│   └── store/
│       └── configStore.ts   # electron-store 密钥读写封装
├── preload/
│   └── index.ts             # contextBridge 暴露白名单 API
├── renderer/
│   ├── main.ts              # Vue 应用入口
│   ├── App.vue
│   ├── pages/
│   │   └── Settings.vue     # 设置页（CONF-01/02/03）
│   ├── store/
│   │   └── configStore.ts   # 前端配置状态（只存布尔值）
│   └── bridge/
│       └── ipcClient.ts     # window.electron.xxx 封装
└── shared/
    └── types.ts             # 主进程/渲染进程共享类型
docs/
├── UI设计文档.md             # DOC-01
└── 技术设计文档.md           # DOC-02
electron.vite.config.ts      # electron-vite 配置
```

### Pattern 1: electron-vite 双进程构建配置

**What:** electron-vite 用单个配置文件管理主进程、preload、渲染进程三个 Vite 构建目标。
**When to use:** 所有 Electron + Vite 项目的标准起点。

```typescript
// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['jose'] })]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [vue()]
  }
})
```

### Pattern 2: contextBridge 密钥隔离

**What:** preload 脚本通过 contextBridge 暴露有限 API，渲染进程无法访问 Node.js 模块，密钥不进入渲染进程。

```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  saveConfig: (config: { jimengAk?: string; jimengSk?: string; klingAk?: string; klingSk?: string }) =>
    ipcRenderer.invoke('config:save', config),
  getConfigStatus: () =>
    ipcRenderer.invoke('config:get-status'),
  verifyJimeng: () =>
    ipcRenderer.invoke('config:verify-jimeng'),
  verifyKling: () =>
    ipcRenderer.invoke('config:verify-kling'),
})
```

### Pattern 3: electron-store 加密存储

**What:** 使用 electron-store 配合 Electron safeStorage 加密 AK/SK。

```typescript
// main/store/configStore.ts
import Store from 'electron-store'
import { safeStorage } from 'electron'

const store = new Store()

export function saveCredentials(key: string, value: string) {
  const encrypted = safeStorage.encryptString(value)
  store.set(key, encrypted.toString('base64'))
}

export function getCredentials(key: string): string | null {
  const raw = store.get(key) as string | undefined
  if (!raw) return null
  return safeStorage.decryptString(Buffer.from(raw, 'base64'))
}

export function hasCredentials(key: string): boolean {
  return !!store.get(key)
}
```

### Pattern 4: 即梦 HMAC-SHA256 V4 签名

**What:** 火山引擎 V4 签名算法，4 步 HMAC 派生签名密钥。Region 固定 `cn-north-1`，Service 固定 `cv`。

```typescript
// main/auth/hmacSigner.ts
import CryptoJS from 'crypto-js'

function sign(key: CryptoJS.lib.WordArray | string, msg: string) {
  return CryptoJS.HmacSHA256(msg, key)
}

export function buildJimengAuthHeaders(
  ak: string, sk: string,
  action: string, body: string
): Record<string, string> {
  const now = new Date()
  const xDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const datestamp = xDate.slice(0, 8)
  const region = 'cn-north-1'
  const service = 'cv'

  const payloadHash = CryptoJS.SHA256(body).toString()
  const canonicalQuerystring = `Action=${action}&Version=2022-08-31`
  const canonicalHeaders =
    `content-type:application/json\nhost:visual.volcengineapi.com\n` +
    `x-content-sha256:${payloadHash}\nx-date:${xDate}\n`
  const signedHeaders = 'content-type;host;x-content-sha256;x-date'
  const canonicalRequest =
    `POST\n/\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  const credentialScope = `${datestamp}/${region}/${service}/request`
  const stringToSign =
    `HMAC-SHA256\n${xDate}\n${credentialScope}\n${CryptoJS.SHA256(canonicalRequest).toString()}`

  const kDate = sign(sk, datestamp)
  const kRegion = sign(kDate, region)
  const kService = sign(kRegion, service)
  const kSigning = sign(kService, 'request')
  const signature = sign(kSigning, stringToSign).toString()

  return {
    'X-Date': xDate,
    'X-Content-Sha256': payloadHash,
    'Content-Type': 'application/json',
    'Authorization':
      `HMAC-SHA256 Credential=${ak}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`
  }
}
```

### Pattern 5: 可灵 JWT HS256 生成（带缓存）

**What:** 使用 jose 生成 JWT，nbf=now-5 防时钟偏差，缓存 token 避免每次请求都重新生成。

```typescript
// main/auth/jwtSigner.ts
import { SignJWT } from 'jose'

let cachedToken: string | null = null
let tokenExpiry = 0

export async function getKlingToken(ak: string, sk: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && tokenExpiry - now > 60) {
    return cachedToken
  }
  const secret = new TextEncoder().encode(sk)
  const token = await new SignJWT({ iss: ak })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(now + 1800)
    .setNotBefore(now - 5)
    .sign(secret)
  cachedToken = token
  tokenExpiry = now + 1800
  return token
}

export function invalidateKlingToken() {
  cachedToken = null
  tokenExpiry = 0
}
```

### Anti-Patterns to Avoid

- **在渲染进程中导入 crypto-js/jose 做签名:** AK/SK 必须传入渲染进程才能签名，这是安全红线。签名只在主进程做。
- **BrowserWindow 不设置 preload:** 没有 preload 就无法使用 contextBridge，渲染进程要么无法通信，要么需要开启 nodeIntegration（危险）。
- **electron-store 不加密直接存明文:** 明文存储在 `%APPDATA%/linglan/config.json`，任何程序都能读取。必须用 safeStorage 加密。
- **jose 用 require() 导入:** jose 是纯 ESM，在主进程（CJS 环境）需要在 electron-vite 配置中 exclude 掉 externalize，让 Vite 打包处理 ESM 转换。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Electron + Vite 集成 | 手动配置 vite.config.ts + electron 启动脚本 | electron-vite | 需处理 externals、preload 构建、HMR reload、sourcemap 等，容易出错 |
| 密钥加密存储 | 自己用 AES 加密写文件 | electron-store + safeStorage | safeStorage 使用系统 keychain，密钥不在应用代码中 |
| JWT 生成 | 手写 base64url + HMAC | jose | JWT 规范细节多（padding、字符集），手写容易出 1002/1003 错误 |
| HMAC-SHA256 | Node.js crypto 模块 | crypto-js | crypto 模块在 Capacitor WebView 不可用，crypto-js 两端兼容 |

**Key insight:** Phase 1 的所有"基础设施"问题都有成熟的库解决，手写会引入难以调试的边界问题（时钟偏差、编码格式、加密密钥派生）。

## Common Pitfalls

### Pitfall 1: electron-vite 中 jose 的 ESM 问题

**What goes wrong:** jose 是纯 ESM 包，在主进程（CommonJS 环境）直接 require 会报 `ERR_REQUIRE_ESM`。
**Why it happens:** electron-vite 默认将主进程构建为 CJS，而 jose 不提供 CJS 版本。
**How to avoid:** 在 `electron.vite.config.ts` 的 main 配置中，将 jose 从 externalize 排除，让 electron-vite 将其打包进主进程 bundle。
**Warning signs:** 启动时报 `Error [ERR_REQUIRE_ESM]: require() of ES Module`。

### Pitfall 2: safeStorage 在 app.ready 前调用

**What goes wrong:** `safeStorage.encryptString()` 在 `app.whenReady()` 之前调用会抛出异常。
**Why it happens:** safeStorage 需要 app 完全初始化后才可用。
**How to avoid:** 所有 safeStorage 调用放在 `app.whenReady()` 回调内，或在 ipcMain.handle 处理器中（此时 app 已就绪）。

### Pitfall 3: BrowserWindow webPreferences 配置不完整

**What goes wrong:** contextBridge 不生效，渲染进程报 `window.electron is not defined`。
**Why it happens:** 缺少 `contextIsolation: true` 或 `preload` 路径错误。
**How to avoid:** 必须同时设置 `contextIsolation: true`、`nodeIntegration: false`、`preload: path.join(__dirname, '../preload/index.js')`。

### Pitfall 4: 即梦签名 Query 参数排序

**What goes wrong:** 签名验证失败，返回 401 或签名错误。
**Why it happens:** canonical querystring 必须按字母序排列参数，`Action` 在 `Version` 前面（A < V，正确）。
**How to avoid:** 始终对 query 参数 key 排序后再拼接。

### Pitfall 5: 可灵 JWT nbf 时钟偏差导致 1003

**What goes wrong:** 可灵返回 `1003 Authorization未到有效时间`。
**Why it happens:** nbf 设为当前时间，但服务端时钟比客户端快几秒，token 还未到生效时间。
**How to avoid:** nbf 固定设为 `now - 5`（秒），给 5 秒的时钟偏差容忍窗口。

## Code Examples

### shared/types.ts 基础类型定义

```typescript
// shared/types.ts
export interface ConfigStatus {
  jimengConfigured: boolean
  klingConfigured: boolean
}

export interface SaveConfigParams {
  jimengAk?: string
  jimengSk?: string
  klingAk?: string
  klingSk?: string
}

export type TaskStatus = 'submitted' | 'processing' | 'done' | 'failed'
export type TaskType = 'image' | 'video'

export interface Task {
  id: string
  type: TaskType
  status: TaskStatus
  prompt: string
  createdAt: number
  result?: { imageUrls?: string[]; videoUrl?: string }
  error?: string
}
```

### 完整 IPC 配置通道（主进程侧）

```typescript
// main/ipc/configHandlers.ts
import { ipcMain } from 'electron'
import { saveCredentials, getCredentials, hasCredentials } from '../store/configStore'
import { buildJimengAuthHeaders } from '../auth/hmacSigner'
import { getKlingToken } from '../auth/jwtSigner'

export function registerConfigHandlers() {
  ipcMain.handle('config:save', async (_event, config: SaveConfigParams) => {
    if (config.jimengAk) saveCredentials('jimeng_ak', config.jimengAk)
    if (config.jimengSk) saveCredentials('jimeng_sk', config.jimengSk)
    if (config.klingAk) saveCredentials('kling_ak', config.klingAk)
    if (config.klingSk) saveCredentials('kling_sk', config.klingSk)
    return { success: true }
  })

  ipcMain.handle('config:get-status', async (): Promise<ConfigStatus> => {
    return {
      jimengConfigured: hasCredentials('jimeng_ak') && hasCredentials('jimeng_sk'),
      klingConfigured: hasCredentials('kling_ak') && hasCredentials('kling_sk'),
    }
  })

  ipcMain.handle('config:verify-jimeng', async () => {
    const ak = getCredentials('jimeng_ak')
    const sk = getCredentials('jimeng_sk')
    if (!ak || !sk) return { valid: false, error: '未配置' }
    try {
      buildJimengAuthHeaders(ak, sk, 'CVSync2AsyncSubmitTask', '{}')
      return { valid: true }
    } catch (e) {
      return { valid: false, error: String(e) }
    }
  })

  ipcMain.handle('config:verify-kling', async () => {
    const ak = getCredentials('kling_ak')
    const sk = getCredentials('kling_sk')
    if (!ak || !sk) return { valid: false, error: '未配置' }
    try {
      await getKlingToken(ak, sk)
      return { valid: true }
    } catch (e) {
      return { valid: false, error: String(e) }
    }
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| electron-builder + webpack | electron-vite | 2022+ | 构建速度提升 10x，HMR 支持 |
| Vuex | Pinia | Vue 3 时代 | 更轻量，TypeScript 友好 |
| localStorage 存密钥 | electron-store + safeStorage | Electron 15+ | 系统 keychain 保护，安全性质变 |
| ipcRenderer.send（单向） | ipcRenderer.invoke（双向） | Electron 7+ | 支持 async/await，代码更清晰 |

**Deprecated/outdated:**
- `remote` 模块：Electron 14 已移除，用 IPC 替代
- `nodeIntegration: true`：安全漏洞，用 contextBridge 替代

## Open Questions

1. **electron-store v10 与 Electron 41 的兼容性**
   - What we know: electron-store v10 支持 Electron 28+（ESM 版本）
   - What's unclear: v10 是否需要在 package.json 中设置 `"type": "module"`
   - Recommendation: 实施时运行 `npm info electron-store` 确认最新版本，如有问题降级到 v8（CJS 版本）

2. **electron-vite 与现有 package.json 的兼容性**
   - What we know: 现有 package.json 没有 `"type": "module"`，是 CJS 模式
   - What's unclear: electron-vite 构建后 main 字段需要更新为 `out/main/index.js`
   - Recommendation: 实施时更新 package.json 的 main 字段和 scripts

3. **设计文档的详细程度**
   - What we know: DOC-01 需要组件结构，DOC-02 需要 API 集成方案
   - Recommendation: Phase 1 生成功能性设计文档（组件树、页面流程、API 接口定义），视觉细节留给实施时决定

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest（Wave 0 安装） |
| Config file | `vitest.config.ts`（Wave 0 创建） |
| Quick run command | `npx vitest run src/main/auth/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONF-01 | 保存即梦 AK/SK 到 electron-store | unit | `npx vitest run src/main/store/configStore.test.ts` | ❌ Wave 0 |
| CONF-02 | 保存可灵 AK/SK 到 electron-store | unit | `npx vitest run src/main/store/configStore.test.ts` | ❌ Wave 0 |
| CONF-03 | getConfigStatus 只返回布尔值 | unit | `npx vitest run src/main/ipc/configHandlers.test.ts` | ❌ Wave 0 |
| CONF-01/02 | 即梦 HMAC-SHA256 签名生成正确 | unit | `npx vitest run src/main/auth/hmacSigner.test.ts` | ❌ Wave 0 |
| CONF-01/02 | 可灵 JWT HS256 生成正确格式 | unit | `npx vitest run src/main/auth/jwtSigner.test.ts` | ❌ Wave 0 |
| DOC-01/02 | 设计文档文件存在且非空 | smoke | `node -e "require('fs').statSync('docs/UI设计文档.md')"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/main/auth/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** 全部测试绿色 + 两份设计文档存在

### Wave 0 Gaps

- [ ] `src/main/auth/hmacSigner.test.ts` — 覆盖 CONF-01/02 签名逻辑
- [ ] `src/main/auth/jwtSigner.test.ts` — 覆盖 CONF-01/02 JWT 生成
- [ ] `src/main/store/configStore.test.ts` — 覆盖 CONF-01/02/03 存储逻辑
- [ ] `vitest.config.ts` — 测试框架配置
- [ ] Framework install: `npm install vitest --save-dev`

## Sources

### Primary (HIGH confidence)

- `docs/即梦.md` — HMAC-SHA256 V4 签名算法、canonical request 构造、错误码
- `docs/可灵.md` — JWT HS256 鉴权规范（iss/exp/nbf 字段）、错误码 1003/1004
- `.planning/research/STACK.md` — 技术栈选型决策
- `.planning/research/ARCHITECTURE.md` — 主进程/渲染进程架构、IPC 模式
- `package.json` — Electron 41.0.3 版本确认

### Secondary (MEDIUM confidence)

- 训练知识（截止 2025-08）— electron-vite、electron-store v10、jose v5 API
- Electron 官方文档（训练数据）— contextBridge、safeStorage、ipcMain.handle

### Tertiary (LOW confidence)

- electron-store v10 与 Electron 41 的具体兼容性 — 需实施时 `npm info` 验证

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 基于项目已有决策 + API 文档直接分析
- Architecture: HIGH — Electron contextBridge 是成熟模式，文档完善
- Pitfalls: HIGH — 基于 API 文档明确记录的错误码（1003、签名错误）

**Research date:** 2026-03-20
**Valid until:** 2026-04-20（electron-vite/electron-store 版本号需实施前验证）
