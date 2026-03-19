# Phase 4: 移动端适配 - Research

**Researched:** 2026-03-20
**Domain:** Capacitor 6 + Vue 3 + Vite 移动端打包适配
**Confidence:** MEDIUM

## Summary

本阶段的核心工作是将已有的 electron-vite + Vue 3 应用通过 Capacitor 6 打包为 iOS 和 Android 原生应用。项目已有 @ionic/vue 依赖，UI 层无需改动。主要挑战有三个：一是构建产物目录适配（electron-vite 输出到 `out/renderer/`，Capacitor 需要独立的 web 构建输出）；二是 API 调用架构重构（移动端无 Electron 主进程，需要新建共享服务层，在渲染进程直接调用 @capacitor-community/http 绕过 CORS）；三是密钥存储迁移（从 electron-store 迁移到 @capacitor/preferences）。

已知风险点：@capacitor-community/http 与即梦 HMAC-SHA256 自定义签名 Header（Authorization、X-Date、X-Content-Sha256）的兼容性需要真机验证。该插件通过原生 HTTP 客户端发送请求，理论上支持任意自定义 Header，但实际行为需要验证。备选方案是使用原生 fetch（Capacitor 6 在原生平台上会自动拦截 fetch 并通过原生层发送，绕过 WebView CORS 限制）。

**Primary recommendation:** 优先使用 Capacitor 6 内置的 fetch 拦截机制（无需额外插件），仅在 fetch 拦截不满足需求时才引入 @capacitor-community/http。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 密钥存储：Capacitor Preferences（原生存储，非 localStorage）
- HTTP 请求：使用 @capacitor-community/http 插件，绕过 WebView CORS 限制，支持自定义 Header（即梦 HMAC 签名 Header、可灵 JWT Authorization Header）
- 架构模式：共享服务层 + 环境检测
  - 新建 `src/services/` 共享 API 服务层，封装即梦和可灵的 API 调用逻辑
  - 渲染进程通过环境检测决定调用路径：Electron 环境走 IPC（主进程处理），Capacitor 环境直接调用共享服务层
  - Electron 主进程的 IPC handler 保留不动，不影响桌面端

### Claude's Discretion
- 环境检测的具体实现方式（`window.electron` 检测 / `Capacitor.isNativePlatform()` 检测）
- @capacitor-community/http 与即梦自定义签名 Header 的兼容性问题处理（如不兼容，降级为 fetch + CORS 代理或其他方案）
- iOS/Android 原生权限声明（相机、相册读写、网络）的具体配置
- Capacitor 配置文件（capacitor.config.ts）的具体参数
- 打包验证范围（模拟器 vs 真机，由开发者根据实际条件决定）

### Deferred Ideas (OUT OF SCOPE)
- 中间代理服务器方案（密钥存服务端）— 超出 v1 范围，如需更高安全性可作为 v2 考虑
- CI/CD 自动打包流程 — 超出当前范围
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOB-01 | 应用可打包为 iOS 原生应用（通过 Capacitor） | Capacitor 6 安装流程、capacitor.config.ts 配置、npx cap add ios、Xcode 构建步骤 |
| MOB-02 | 应用可打包为 Android 原生应用（通过 Capacitor） | Capacitor 6 安装流程、capacitor.config.ts 配置、npx cap add android、Android Studio 构建步骤 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/core | ^6.x | Capacitor 运行时核心 | 官方包，提供原生桥接层 |
| @capacitor/cli | ^6.x | Capacitor CLI 工具 | 官方包，提供 cap init/add/sync 命令 |
| @capacitor/android | ^6.x | Android 平台支持 | 官方包 |
| @capacitor/ios | ^6.x | iOS 平台支持 | 官方包 |
| @capacitor-community/http | ^6.x | 原生 HTTP 请求，绕过 CORS | 社区标准插件，支持自定义 Header |
| @capacitor/preferences | ^6.x | 原生键值存储 | 官方插件，替代 localStorage |
| @capacitor/filesystem | ^6.x | 文件读写，保存到相册 | 官方插件，处理文件下载 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @capacitor/share | ^6.x | 原生分享 | 如需实现 RES-04 分享功能 |

**Installation:**
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor-community/http
npm install @capacitor/preferences @capacitor/filesystem
npx cap init
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/              # 新建：共享 API 服务层（Capacitor 直调）
│   ├── jimengService.ts   # 即梦 API（含 HMAC 签名）
│   ├── klingService.ts    # 可灵 API（含 JWT 签名）
│   └── storageService.ts  # 密钥存储（Capacitor Preferences）
├── renderer/
│   ├── bridge/
│   │   ├── ipcClient.ts   # 已有：Electron IPC 客户端（保留）
│   │   └── platform.ts    # 新建：环境检测 + 统一调用入口
│   └── store/
│       └── configStore.ts # 修改：加入环境判断
├── main/                  # 已有：Electron 主进程（不动）
├── preload/               # 已有：Electron preload（不动）
└── shared/                # 已有：共享类型定义
capacitor.config.ts        # 新建：Capacitor 配置
android/                   # 由 npx cap add android 生成
ios/                       # 由 npx cap add ios 生成
```

### Pattern 1: 环境检测 + 统一调用入口
**What:** 在 `src/renderer/bridge/platform.ts` 中封装环境检测逻辑，Pinia store 通过此入口调用，无需关心底层平台
**When to use:** 所有需要 API 调用或密钥读写的地方

```typescript
// src/renderer/bridge/platform.ts
import { Capacitor } from '@capacitor/core'

export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.electron
}

export const isCapacitor = (): boolean => {
  return Capacitor.isNativePlatform()
}

// 统一 API 调用入口
export async function callJimengApi(payload: unknown): Promise<unknown> {
  if (isElectron()) {
    return window.electron.invokeJimeng(payload)  // IPC 路径
  }
  // Capacitor 路径：直接调用共享服务层
  const { jimengService } = await import('../../../services/jimengService')
  return jimengService.call(payload)
}
```

### Pattern 2: Capacitor Preferences 密钥存储
**What:** 用 @capacitor/preferences 替代 electron-store，在 Capacitor 环境下存储 AK/SK
**When to use:** Capacitor 环境下的所有密钥读写操作

```typescript
// src/services/storageService.ts
import { Preferences } from '@capacitor/preferences'

export const storageService = {
  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value })
  },
  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key })
    return value
  },
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key })
  }
}
```

### Pattern 3: @capacitor-community/http 发送带自定义 Header 的请求
**What:** 通过原生 HTTP 客户端发送请求，绕过 WebView CORS 限制，支持任意自定义 Header
**When to use:** Capacitor 环境下调用即梦（需要 Authorization、X-Date、X-Content-Sha256 Header）和可灵 API

```typescript
// src/services/jimengService.ts
import { Http } from '@capacitor-community/http'

export const jimengService = {
  async call(action: string, body: unknown): Promise<unknown> {
    const headers = buildHmacHeaders(body)  // 复用 hmacSigner 逻辑
    const response = await Http.request({
      method: 'POST',
      url: 'https://visual.volcengineapi.com/?Action=' + action + '&Version=2022-08-31',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': headers.authorization,
        'X-Date': headers.xDate,
        'X-Content-Sha256': headers.xContentSha256,
      },
      data: body,
    })
    return response.data
  }
}
```

### Pattern 4: capacitor.config.ts 配置
**What:** Capacitor 项目配置，指定 appId、appName 和 webDir（Vite 构建输出目录）
**When to use:** 项目初始化时创建

```typescript
// capacitor.config.ts（项目根目录）
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.linglan.app',
  appName: '灵览',
  webDir: 'dist/renderer',  // Vite 独立构建的输出目录（非 electron-vite 的 out/）
  server: {
    androidScheme: 'https'  // Android 使用 https scheme，避免混合内容问题
  }
}

export default config
```

### Pattern 5: 文件下载保存到相册
**What:** 用 @capacitor/filesystem 将 base64 图片/视频写入设备存储
**When to use:** 用户点击下载按钮时（MOB 环境下替代 web 的 <a download> 方案）

```typescript
// src/services/downloadService.ts
import { Filesystem, Directory } from '@capacitor/filesystem'
import { isCapacitor } from '../renderer/bridge/platform'

export async function saveMediaToDevice(url: string, filename: string): Promise<void> {
  if (!isCapacitor()) {
    // Web/Electron 环境：使用 <a download> 方案
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    return
  }
  // Capacitor 环境：fetch 图片 → base64 → 写入 Documents
  const response = await fetch(url)
  const blob = await response.blob()
  const base64 = await blobToBase64(blob)
  await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Documents,
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1])
    reader.readAsDataURL(blob)
  })
}
```

### Pattern 6: Vite 独立构建配置（供 Capacitor 使用）
**What:** electron-vite 的构建输出（`out/renderer/`）不适合 Capacitor，需要独立的 Vite 构建配置
**When to use:** 打包移动端时

```typescript
// vite.mobile.config.ts（新建）
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist/renderer',  // 与 capacitor.config.ts 的 webDir 一致
  },
  base: './',  // 相对路径，Capacitor WebView 需要
})
```

```json
// package.json 新增脚本
{
  "scripts": {
    "build:mobile": "vite build --config vite.mobile.config.ts",
    "cap:sync": "npm run build:mobile && npx cap sync"
  }
}
```

### Anti-Patterns to Avoid
- **直接用 electron-vite 的 out/renderer/ 作为 webDir：** electron-vite 的渲染进程构建包含 Electron 特定的 preload 引用，不适合 Capacitor WebView
- **在 Capacitor 环境使用 localStorage 存密钥：** WebView 的 localStorage 在 iOS 上可能被系统清除，必须用 @capacitor/preferences
- **在 Capacitor 环境直接用 fetch 调用即梦 API：** 即梦 API 不设置 CORS 头，WebView 中的 fetch 会被浏览器 CORS 策略拦截（注意：Capacitor 6 的 fetch 拦截在 iOS 上有效，Android 上行为不同）
- **忘记 `base: './'`：** Capacitor WebView 使用 file:// 或 capacitor:// scheme 加载资源，相对路径必须正确

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 原生 HTTP 请求绕过 CORS | 自定义 fetch wrapper | @capacitor-community/http | 原生层实现，无 CORS 限制，支持任意 Header |
| 原生键值存储 | localStorage / IndexedDB | @capacitor/preferences | 原生存储，iOS 不会被系统清除，Android 加密存储 |
| 文件写入设备 | 自定义 base64 写入逻辑 | @capacitor/filesystem | 处理 iOS/Android 目录权限差异 |
| 环境检测 | 自定义 UA 检测 | Capacitor.isNativePlatform() | 官方 API，准确可靠 |

**Key insight:** Capacitor 插件封装了 iOS/Android 平台差异，手写原生调用会遇到大量平台特定的边界情况。

## Common Pitfalls

### Pitfall 1: electron-vite 构建产物不兼容 Capacitor
**What goes wrong:** 直接将 `out/renderer/` 设为 webDir，WebView 加载时报错或白屏
**Why it happens:** electron-vite 的渲染进程构建使用绝对路径，且包含 Electron 特定的 contextBridge 调用
**How to avoid:** 新建 `vite.mobile.config.ts`，设置 `base: './'`，输出到 `dist/renderer/`
**Warning signs:** WebView 加载后白屏，控制台报 "Cannot find module" 或资源 404

### Pitfall 2: @capacitor-community/http 与即梦签名 Header 不兼容
**What goes wrong:** 即梦 API 返回签名验证失败（HTTP 401 或业务错误码）
**Why it happens:** 某些 Capacitor HTTP 插件版本会修改或过滤自定义 Header（特别是 Authorization）
**How to avoid:** 优先测试 @capacitor-community/http 的 `Http.request()` 直接调用（非 fetch 拦截模式）；如不兼容，降级为 Capacitor 6 内置 fetch 拦截（在 iOS 上有效）
**Warning signs:** 请求到达服务器但签名验证失败；或请求根本未发出

### Pitfall 3: Android 上 fetch 拦截不生效
**What goes wrong:** Android WebView 中 fetch 请求仍然受 CORS 限制
**Why it happens:** Capacitor 6 的 fetch 拦截在 Android 上依赖 WebView 版本，行为不如 iOS 稳定
**How to avoid:** Android 上明确使用 @capacitor-community/http 的 `Http.request()` 方法，不依赖 fetch 拦截
**Warning signs:** iOS 正常，Android 报 CORS 错误

### Pitfall 4: iOS 文件保存权限缺失
**What goes wrong:** iOS 上调用 Filesystem.writeFile 崩溃或静默失败
**Why it happens:** iOS 要求在 Info.plist 中声明相册访问权限
**How to avoid:** 在 `ios/App/App/Info.plist` 添加 `NSPhotoLibraryAddUsageDescription` 和 `NSPhotoLibraryUsageDescription`
**Warning signs:** 真机上保存文件无响应，模拟器正常

### Pitfall 5: Android 13+ 存储权限变更
**What goes wrong:** Android 13+ 上 READ_EXTERNAL_STORAGE / WRITE_EXTERNAL_STORAGE 权限被废弃
**Why it happens:** Android 13 引入了分区存储，旧权限不再有效
**How to avoid:** 使用 @capacitor/filesystem 的 `Directory.Documents` 或 `Directory.Data`（应用私有目录，无需权限）；如需保存到相册，使用 @capacitor/media 插件
**Warning signs:** Android 13+ 设备上文件保存失败，旧设备正常

### Pitfall 6: capacitor.config.ts 的 server.androidScheme
**What goes wrong:** Android WebView 中 http:// 资源加载被阻止（混合内容）
**Why it happens:** Android 默认使用 http scheme，现代 WebView 阻止 http 内容
**How to avoid:** 设置 `server: { androidScheme: 'https' }`
**Warning signs:** Android 上图片/视频无法加载，iOS 正常

## Code Examples

### Capacitor 初始化流程
```bash
# 1. 安装依赖
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm install @capacitor-community/http @capacitor/preferences @capacitor/filesystem

# 2. 初始化（在项目根目录）
npx cap init "灵览" "com.linglan.app" --web-dir dist/renderer

# 3. 添加平台
npx cap add android
npx cap add ios

# 4. 构建 web 资源并同步
npm run build:mobile
npx cap sync

# 5. 打开原生 IDE
npx cap open android  # 打开 Android Studio
npx cap open ios      # 打开 Xcode
```

### Android 权限配置（AndroidManifest.xml）
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<!-- Android 12 及以下需要，13+ 不需要 -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="29" />
```

### iOS 权限配置（Info.plist）
```xml
<!-- ios/App/App/Info.plist -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>需要访问相册以保存生成的图片和视频</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册以保存生成的图片和视频</string>
```

### 注册 Capacitor 插件（main.ts）
```typescript
// src/renderer/main.ts（移动端构建入口）
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'

// 注册 Capacitor 插件（仅在 Capacitor 环境）
import { Http } from '@capacitor-community/http'
// Http 插件在 import 时自动注册，无需额外调用

const app = createApp(App)
app.use(createPinia())
app.use(IonicVue)
app.mount('#app')
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Capacitor Storage | @capacitor/preferences | Capacitor 4 | API 名称变更，功能相同 |
| @capacitor/storage | @capacitor/preferences | 2022 | 旧包已废弃 |
| WRITE_EXTERNAL_STORAGE | 分区存储 / MediaStore | Android 10+ | 直接写外部存储需要新 API |
| Capacitor 5 fetch 拦截 | Capacitor 6 内置 HTTP 插件 | 2024 | Capacitor 6 将 HTTP 功能内置 |

**Deprecated/outdated:**
- `@capacitor/storage`：已废弃，使用 `@capacitor/preferences`
- `Capacitor.Plugins.Storage`：旧 API，使用 `import { Preferences } from '@capacitor/preferences'`
- Android `WRITE_EXTERNAL_STORAGE`（API 30+）：使用应用私有目录或 MediaStore API

## Open Questions

1. **@capacitor-community/http 与即梦 HMAC 签名 Header 的兼容性**
   - What we know: 插件支持自定义 Header，文档示例显示 `headers: { 'X-Fake-Header': 'value' }`
   - What's unclear: Authorization Header 是否会被插件或原生层过滤/修改；Android 和 iOS 行为是否一致
   - Recommendation: 在 Wave 1 中优先实现并测试此路径；准备降级方案（Capacitor 6 内置 fetch 拦截）

2. **electron-vite 与 Capacitor 构建的共存方式**
   - What we know: 需要独立的 `vite.mobile.config.ts`，输出到 `dist/renderer/`
   - What's unclear: 是否需要修改 `tsconfig.web.json` 的 paths 配置
   - Recommendation: 新建 `vite.mobile.config.ts`，复用 `src/renderer/` 入口，仅修改 outDir 和 base

3. **Capacitor 6 是否已内置 HTTP 功能（无需 @capacitor-community/http）**
   - What we know: 搜索结果提到 "Capacitor 6 将 HTTP 功能内置"，但用户已锁定使用 @capacitor-community/http
   - What's unclear: 内置 HTTP 是否支持相同的自定义 Header 能力
   - Recommendation: 按用户决策使用 @capacitor-community/http；如遇问题，调查内置 HTTP API

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.x |
| Config file | vitest.config.ts |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOB-01 | iOS 打包构建不报错 | manual | 需要 Xcode 环境，无法自动化 | manual-only |
| MOB-02 | Android 打包构建不报错 | manual | 需要 Android Studio 环境，无法自动化 | manual-only |
| MOB-01/02 | platform.ts 环境检测逻辑正确 | unit | `npm run test -- src/renderer/bridge/platform` | ❌ Wave 0 |
| MOB-01/02 | storageService 的 set/get/remove 接口正确 | unit | `npm run test -- src/services/storageService` | ❌ Wave 0 |
| MOB-01/02 | jimengService / klingService 构建签名 Header 正确 | unit | `npm run test -- src/services/jimengService` | ❌ Wave 0 |
| MOB-01/02 | downloadService 在非 Capacitor 环境走 web 路径 | unit | `npm run test -- src/services/downloadService` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/renderer/bridge/platform.test.ts` — 覆盖 isElectron / isCapacitor 检测逻辑
- [ ] `src/services/storageService.test.ts` — mock @capacitor/preferences，测试 set/get/remove
- [ ] `src/services/jimengService.test.ts` — 测试 HMAC Header 构建（复用 hmacSigner 逻辑）
- [ ] `src/services/klingService.test.ts` — 测试 JWT Header 构建（复用 jwtSigner 逻辑）
- [ ] `src/services/downloadService.test.ts` — 测试 web 路径（Capacitor 路径需 mock）

## Sources

### Primary (HIGH confidence)
- Capacitor 官方文档 (capacitorjs.com/docs) — 安装流程、capacitor.config.ts 配置、webDir 参数
- 项目 docs/技术设计文档.md — 即梦/可灵签名逻辑、现有架构
- 项目 .planning/phases/04-移动端适配/04-CONTEXT.md — 用户决策

### Secondary (MEDIUM confidence)
- capgo.app/blog/capacitor-cli-project-setup-guide — Capacitor CLI 安装步骤（与官方文档一致）
- capacitor-community.github.io/http/docs — @capacitor-community/http API 文档（自定义 Header 示例）
- stackoverflow.com/questions/67019659 — iOS Filesystem.writeFile 问题及解决方案

### Tertiary (LOW confidence)
- 搜索结果摘要中关于 "Capacitor 6 内置 HTTP 功能" 的说法 — 需要验证是否与 @capacitor-community/http 重叠

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — 核心包版本来自官方文档摘要，@capacitor-community/http 兼容性未实测
- Architecture: MEDIUM — 共享服务层模式基于项目 CONTEXT.md 决策，环境检测 API 来自官方文档
- Pitfalls: HIGH — 基于项目已记录的已知风险 + 社区常见问题

**Research date:** 2026-03-20
**Valid until:** 2026-04-20（Capacitor 6 稳定版，30 天有效）
