# Phase 4: 移动端适配 - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

将已完成的 Electron 应用通过 Capacitor 打包为 iOS 和 Android 原生应用。核心工作是适配 API 调用架构（移动端无 Electron 主进程）、配置原生权限、验证核心功能在真机上正常运行。不新增功能，只做平台适配。

</domain>

<decisions>
## Implementation Decisions

### API 调用架构
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 1-3 建立的 Electron IPC handler：保留，Capacitor 环境下不调用
- Phase 1 的 hmacSigner / jwtSigner 逻辑：迁移到共享服务层复用
- Phase 2-3 的任务管理、轮询逻辑：在共享服务层中复用

### Established Patterns
- 所有 API 调用目前在 Electron 主进程（IPC 模式）
- Phase 4 新增 Capacitor 直调路径，两套路径共存
- 密钥管理：Electron 用 electron-store，Capacitor 用 Capacitor Preferences

### Integration Points
- `src/services/` 新建共享 API 服务层（即梦 + 可灵）
- 渲染进程的 Pinia store 调用服务层时加入环境判断
- `capacitor.config.ts` 配置 appId、webDir 等
- `ios/` 和 `android/` 目录由 `npx cap add ios/android` 生成

</code_context>

<specifics>
## Specific Ideas

- STATE.md 已记录风险：@capacitor-community/http 与即梦自定义签名 Header 的兼容性需真机验证，Phase 4 需要专门处理这个已知风险点

</specifics>

<deferred>
## Deferred Ideas

- 中间代理服务器方案（密钥存服务端）— 超出 v1 范围，如需更高安全性可作为 v2 考虑
- CI/CD 自动打包流程 — 超出当前范围

</deferred>

---

*Phase: 04-移动端适配*
*Context gathered: 2026-03-20*
