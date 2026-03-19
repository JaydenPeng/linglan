# Stack Research

**Domain:** Electron + Capacitor AI 生图/生视频移动应用
**Researched:** 2026-03-19
**Confidence:** MEDIUM（网络工具不可用，基于训练知识 + 项目文档推断，截止 2025-08）

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Electron | ^41.0.3 | 桌面壳（已有） | 项目已存在，保持不动 |
| Capacitor | ^7.x | iOS/Android 打包桥接 | 官方支持 Web → Native，与任意前端框架无关，无需 Cordova 插件生态 |
| Vue 3 | ^3.5.x | 前端 UI 框架 | Composition API + `<script setup>` 适合移动端组件化；比 React 在国内生态更成熟；Ionic 官方 Vue 绑定完善 |
| Vite | ^6.x | 构建工具 | Capacitor 官方推荐；HMR 快；替代裸 Electron 直接加载 HTML 的方式，支持 TypeScript/CSS 预处理 |
| TypeScript | ^5.x | 类型安全 | API 响应结构复杂（即梦/可灵各有不同字段），类型约束减少运行时错误 |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| axios | ^1.7.x | HTTP 客户端 | 所有 API 调用；支持拦截器统一注入 Authorization header，比 fetch 更易处理超时和错误 |
| jose | ^5.x | JWT 生成（可灵鉴权） | 纯 JS 实现 HS256 签名，无 Node.js 原生依赖，在 Capacitor WebView 环境可用 |
| crypto-js | ^4.2.x | HMAC-SHA256（即梦鉴权） | 浏览器兼容的 HMAC 实现；即梦签名需要 HMAC-SHA256 + 多步骤 canonical request 构造 |
| @capacitor/filesystem | ^7.x | 本地文件存储（下载图片/视频） | 保存生成结果到设备；iOS/Android 原生文件系统访问 |
| @capacitor/preferences | ^7.x | 轻量 KV 持久化（历史记录） | 替代 localStorage，跨平台一致；存储任务历史 JSON |
| @vueuse/core | ^11.x | Vue 组合式工具集 | `useIntervalFn`（轮询控制）、`useStorage`（响应式持久化）、`useFetch` 等 |
| Pinia | ^2.x | 状态管理 | 管理任务队列、轮询状态、历史记录；比 Vuex 更轻量，与 Vue 3 Composition API 原生契合 |
| Ionic Vue | ^8.x | 移动端 UI 组件库 | 提供 iOS/Android 原生风格组件（IonCard、IonList、IonProgressBar 等），与 Capacitor 同属 Ionic 生态 |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| @capacitor/cli | Capacitor 项目初始化和同步 | `npx cap init` / `npx cap sync` / `npx cap open ios` |
| electron-builder | Electron 桌面打包 | 如需保留桌面版本；与 Capacitor 移动端打包并行 |
| Xcode (macOS) | iOS 打包 | Capacitor iOS 必须在 macOS 上用 Xcode 构建 |
| Android Studio | Android 打包 | Capacitor Android 构建工具 |

## Installation

```bash
# 初始化 Vite + Vue 3 + TypeScript 项目（替换现有裸 HTML）
npm create vite@latest . -- --template vue-ts

# Capacitor 核心
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/filesystem @capacitor/preferences

# UI 框架
npm install @ionic/vue @ionic/vue-router ionicons

# 状态管理
npm install pinia

# HTTP + 鉴权
npm install axios jose crypto-js
npm install -D @types/crypto-js

# 工具集
npm install @vueuse/core

# Capacitor 初始化（在 vite build 后执行）
npx cap init linglan com.linglan.app --web-dir dist
npx cap add ios
npx cap add android
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vue 3 | React 18 | 团队已有 React 经验时；Ionic React 同样成熟 |
| Ionic Vue | Quasar | 需要更多桌面端组件或 SSR 时；Quasar 也支持 Capacitor |
| Ionic Vue | NativeWind + Tailwind | 纯 Tailwind 风格偏好时；但移动端原生组件需自行实现 |
| Pinia | Zustand / Vuex | Vuex 已过时；Zustand 仅适用 React |
| axios | native fetch | fetch 在 Capacitor 环境可用，但缺少拦截器，鉴权注入更繁琐 |
| jose | jsonwebtoken | jsonwebtoken 依赖 Node.js crypto 模块，在 Capacitor WebView 中不可用 |
| crypto-js | SubtleCrypto (Web API) | SubtleCrypto 是异步 API，即梦签名流程复杂，crypto-js 同步更易实现 |
| @capacitor/preferences | localStorage | localStorage 在 iOS WKWebView 可能被系统清理；Preferences 插件持久化更可靠 |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| jsonwebtoken | 依赖 Node.js `crypto` 内置模块，在 Capacitor WebView（浏览器环境）中运行时报错 | jose（纯 JS 实现） |
| Cordova | 已进入维护模式，Ionic 官方推荐迁移到 Capacitor | Capacitor 7 |
| Vuex | Vue 官方已推荐 Pinia 作为替代，Vuex 5 开发停滞 | Pinia 2 |
| setInterval（裸用） | 无法在组件卸载时自动清理，导致内存泄漏和重复轮询 | `@vueuse/core` 的 `useIntervalFn`，或封装 class 管理生命周期 |
| localStorage（直接用） | iOS WKWebView 在低存储时会清除 localStorage；无法存储二进制文件 | @capacitor/preferences（KV）+ @capacitor/filesystem（文件） |
| Electron 主进程发 HTTP 请求 | 绕过 Capacitor 插件体系，导致 iOS/Android 上无法复用同一套代码 | 统一在渲染进程（Vue 层）用 axios 发请求 |
| node-fetch / got | Node.js 专用 HTTP 库，在 Capacitor WebView 环境不可用 | axios（浏览器兼容） |

## Stack Patterns by Variant

**Electron 桌面模式（开发调试）：**
- Vite dev server → Electron 加载 `http://localhost:5173`
- 鉴权签名在渲染进程执行（crypto-js / jose 均为浏览器兼容）
- API 请求直接走 axios，无 CORS 问题（Electron 无同源限制）

**Capacitor iOS/Android 模式（生产）：**
- `vite build` → `npx cap sync` → Xcode / Android Studio 打包
- API 请求需配置 `capacitor.config.ts` 的 `server.allowNavigation` 或使用 `@capacitor/http` 插件绕过 WKWebView CORS 限制
- 文件下载用 `@capacitor/filesystem` 写入 `Documents` 目录

**异步轮询模式（即梦 + 可灵均适用）：**
- 提交任务 → 获取 `task_id` → 存入 Pinia store
- `useIntervalFn(pollFn, 3000)` 每 3 秒查询一次
- 状态机：`submitted → processing → done/failed`
- 所有活跃任务完成后调用 `pause()` 停止轮询

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Capacitor ^7.x | @capacitor/ios ^7.x, @capacitor/android ^7.x | 主版本必须一致，混用会报运行时错误 |
| Capacitor ^7.x | Ionic Vue ^8.x | Ionic 8 对应 Capacitor 6/7，兼容 |
| Vite ^6.x | Vue 3 ^3.5.x | 完全兼容 |
| Electron ^41.x | Vite ^6.x | 通过 `electron-vite` 或手动配置 `loadURL` 集成 |
| jose ^5.x | 浏览器 / Node.js 18+ | 纯 ESM，需要 Vite 处理；不兼容 CommonJS require |
| crypto-js ^4.x | 浏览器 / Node.js | 同时支持 CJS 和 ESM，Vite 下无问题 |

## 鉴权实现要点

### 可灵 JWT（HS256）
```typescript
// 使用 jose，每次请求前生成（有效期 30 分钟）
import { SignJWT } from 'jose'

async function getKlingToken(ak: string, sk: string): Promise<string> {
  const secret = new TextEncoder().encode(sk)
  return new SignJWT({ iss: ak })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime('30m')
    .setNotBefore('-5s')
    .sign(secret)
}
```

### 即梦 HMAC-SHA256（火山引擎 V4 签名）
```typescript
// 使用 crypto-js 实现多步骤签名
import CryptoJS from 'crypto-js'

function sign(key: CryptoJS.lib.WordArray | string, msg: string) {
  return CryptoJS.HmacSHA256(msg, key)
}
// 完整签名流程：kDate → kRegion → kService → kSigning → Authorization header
```

## Sources

- 训练知识（截止 2025-08）— Capacitor 7、Vue 3、Pinia、Ionic 8 版本信息 [MEDIUM confidence]
- 项目文档 `docs/可灵.md` — JWT HS256 鉴权流程确认 [HIGH confidence]
- 项目文档 `docs/即梦.md` — HMAC-SHA256 V4 签名流程确认 [HIGH confidence]
- 项目文档 `.planning/PROJECT.md` — 技术约束和功能需求确认 [HIGH confidence]
- 现有代码 `package.json` — Electron 41.0.3 版本确认 [HIGH confidence]
- 注意：WebSearch 和 WebFetch 在本次研究中不可用，版本号需在实施前用 `npm info [package] version` 验证

---
*Stack research for: 灵览 AI 创作工具（Electron + Capacitor + Vue 3）*
*Researched: 2026-03-19*
