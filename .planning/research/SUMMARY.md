# Project Research Summary

**Project:** 灵览 AI 创作工具
**Domain:** Electron + Capacitor AI 生图/生视频移动应用（即梦 + 可灵双 API）
**Researched:** 2026-03-19
**Confidence:** MEDIUM-HIGH（API 文档直接分析为 HIGH，框架版本号需实施前验证）

## Executive Summary

灵览是一款基于 Electron + Capacitor 的跨平台 AI 创作工具，核心价值是让用户通过文本 Prompt 驱动即梦（文生图）和可灵（文生视频）两套异步 API，在桌面和移动端均可使用。这类产品的关键挑战不在于 UI，而在于异步任务生命周期管理：两套 API 均为"提交 → 轮询 → 获取结果"模式，轮询逻辑的健壮性直接决定产品可用性。推荐架构是将所有 API 调用、签名计算和轮询逻辑集中在 Electron 主进程，渲染进程通过 IPC 通信，这既解决了密钥安全问题，也避免了页面切换导致轮询中断。

技术选型上，Vue 3 + Vite + Pinia + Ionic Vue 是最优组合：与 Capacitor 同属 Ionic 生态，移动端原生组件开箱即用，Composition API 适合封装轮询状态机。两套 API 的鉴权差异显著——即梦需要 HMAC-SHA256 V4 多步骤签名（crypto-js），可灵需要 JWT HS256（jose），两者都必须在主进程完成，不能暴露到渲染进程。

最大风险集中在三点：密钥安全（AK/SK 绝不能进入渲染进程）、轮询健壮性（JWT 过期自动刷新、interval 生命周期管理、即梦图片 URL 24h 过期后必须本地化）、移动端适配（Capacitor WebView CORS 限制、iOS 后台执行挂起）。这三点如果在 Phase 1 没有正确设计，后期修复成本极高。

## Key Findings

### Recommended Stack

推荐以 Vue 3 + Vite + TypeScript 为前端基础，Pinia 管理任务状态，Ionic Vue 提供移动端 UI 组件，Capacitor 7 负责 iOS/Android 打包桥接。HTTP 层统一用 axios（支持拦截器，便于统一注入鉴权 header）。鉴权库选择需特别注意运行环境：jose（纯 ESM，浏览器兼容）用于可灵 JWT，crypto-js 用于即梦 HMAC-SHA256，两者均可在 Capacitor WebView 中运行，而 jsonwebtoken 依赖 Node.js crypto 模块，在 WebView 中会报错。

**核心技术：**
- Vue 3 ^3.5.x：Composition API + `<script setup>`，适合移动端组件化
- Capacitor ^7.x：Web → Native 桥接，与 Ionic 同生态
- Vite ^6.x：构建工具，Capacitor 官方推荐
- Pinia ^2.x：任务队列和轮询状态管理
- Ionic Vue ^8.x：移动端原生风格 UI 组件
- axios ^1.7.x：HTTP 客户端，统一拦截器注入鉴权
- jose ^5.x：可灵 JWT HS256 生成（浏览器兼容）
- crypto-js ^4.2.x：即梦 HMAC-SHA256 签名（浏览器兼容）
- @capacitor/filesystem ^7.x：移动端文件存储（下载图片/视频）
- @capacitor/preferences ^7.x：轻量 KV 持久化（历史记录）

### Expected Features

**必须有（v1 Table Stakes）：**
- 自由文本 Prompt 输入 — 核心交互入口
- 图片/视频模式切换 — 两套 API 的入口分离
- 宽高比选择 — 最基础的参数控制
- 任务提交 + 状态轮询 — API 异步模式的必要实现
- 任务进度展示（submitted/processing/done/failed）— 等待期间的用户反馈
- 生成结果预览（图片展示 + 视频播放）— 核心价值交付
- 结果下载到本地 — 用户留存作品
- 历史记录列表（本地持久化）— 回看之前作品
- 任务失败提示（含错误原因）— 基础容错体验

**应该有（v1.x 差异化）：**
- Prompt 历史复用 — 减少重复输入
- 参考图上传（图生图）— 即梦支持最多 10 张参考图
- 模型选择（可灵 o1 vs v3-omni）— 质量与速度权衡
- 收藏/标记功能 — 历史记录过滤
- 视频时长选择（3~15 秒）— 可灵参数控制

**推迟到 v2+：**
- Prompt 模板库 — 需要运营维护，成本高
- 视频首尾帧控制 — 高级功能，先验证基础需求
- 多镜头视频（multi_shot）— 复杂度高，需专门分镜编辑 UI
- 生成模式选择（std/pro）— 涉及计费策略，需先明确

### Architecture Approach

采用严格的主进程/渲染进程分离架构：所有 API 调用、签名计算、任务队列和轮询逻辑集中在 Electron 主进程，渲染进程通过 contextBridge + IPC 通信，密钥永远不离开主进程。移动端通过 Capacitor Bridge 访问原生能力（文件系统、网络），并通过平台适配层（`Capacitor.isNativePlatform()`）统一接口，避免平台判断散落在业务代码中。

**主要组件：**
1. TaskQueue（主进程）— 维护任务生命周期，驱动轮询，向渲染进程推送状态更新
2. JimengService / KlingService（主进程）— 封装两套 API 调用和签名逻辑
3. Auth Module（主进程）— HMAC-SHA256 和 JWT HS256 两套鉴权，密钥隔离
4. IPC Layer（preload + ipcMain）— contextBridge 安全边界，白名单 API 暴露
5. taskStore（渲染进程 Pinia）— 前端任务状态，响应 IPC push 更新
6. Platform Adapter（capacitor/plugins.ts）— 文件操作等跨平台统一接口

### Critical Pitfalls

1. **AK/SK 暴露到渲染进程** — 所有签名计算必须在主进程完成，渲染进程通过 IPC 请求，密钥存主进程内存或 Electron safeStorage。这是安全红线，必须在第一行 API 代码前确定。

2. **轮询 setInterval 未清理导致内存泄漏** — 用 Map 管理所有活跃 interval，任务完成/失败/超时时立即清理，设置最大轮询次数上限（120 次 × 5s = 10 分钟）。

3. **可灵 JWT Token 在轮询中途过期** — 每次轮询前检查 token 剩余有效期，`exp - now < 5min` 时重新生成；nbf 设为 `now - 5` 避免时钟偏差导致 1003 错误。

4. **即梦图片 URL 24h 过期** — 任务完成后必须立即下载图片到本地（@capacitor/filesystem），历史记录存本地文件路径而非 URL。

5. **Capacitor 移动端 CORS/ATS 拦截** — 使用 `@capacitor-community/http` 插件或将 API 请求代理到主进程 IPC，iOS 需配置 NSAppTransportSecurity，Android 需配置 network_security_config.xml。

## Implications for Roadmap

基于研究，建议以下阶段结构：

### Phase 1: 基础设施与安全架构

**Rationale:** 架构决策必须最先确定，尤其是密钥安全边界和 IPC 通信模式。一旦 API 调用代码写错位置（渲染进程），后期重构成本极高。
**Delivers:** 可运行的项目骨架，两套 API 鉴权验证通过，IPC 通道建立
**Addresses:** shared/types.ts、Auth Module（hmacSigner + jwtSigner）、IPC 框架
**Avoids:** AK/SK 暴露（Pitfall 3）、JWT nbf 时钟偏差（Pitfall 2）
**Research flag:** 标准 Electron 安全模式，无需额外研究

### Phase 2: 核心任务流程（图片生成）

**Rationale:** 先用即梦图片 API 跑通完整的"提交 → 轮询 → 展示 → 下载"流程，比视频 API 更快验证核心价值（图片生成约 30-60 秒，视频需 3-10 分钟）。
**Delivers:** 用户可以提交文生图任务并看到结果，历史记录可用
**Addresses:** JimengService、TaskQueue、轮询状态机、结果预览、本地下载、历史记录
**Avoids:** 轮询内存泄漏（Pitfall 1）、即梦 not_found 误判（Pitfall 5）、图片 URL 过期（Pitfall 4）
**Research flag:** 即梦 HMAC-SHA256 V4 签名细节已在 STACK.md 中记录，可直接实施

### Phase 3: 视频生成扩展

**Rationale:** 视频 API（可灵）与图片 API 共享同一套任务队列架构，在图片流程验证后扩展，风险最低。视频任务耗时更长，需要额外处理 JWT 刷新和进度提示。
**Delivers:** 用户可以提交文生视频任务，支持宽高比和时长选择
**Addresses:** KlingService、视频播放器组件、视频时长选择、可灵 JWT 自动刷新
**Avoids:** JWT 过期中断轮询（Pitfall 2）、可灵视频 URL 30 天过期提示
**Research flag:** 可灵 JWT 鉴权细节已在 STACK.md 中记录，无需额外研究

### Phase 4: Capacitor 移动端适配

**Rationale:** 桌面端（Electron）功能验证后再做移动端适配，避免同时调试两个平台。移动端有独立的 CORS、文件系统、后台执行等问题，需要专门处理。
**Delivers:** iOS/Android 可运行的 App，文件下载到设备，后台恢复状态同步
**Addresses:** Platform Adapter、@capacitor/filesystem、appStateChange 监听、CORS 配置
**Avoids:** Capacitor CORS 拦截（Pitfall 4）、移动端后台轮询挂起（Pitfall 6）
**Research flag:** 需要验证 @capacitor-community/http 插件与即梦/可灵 API 的兼容性

### Phase 5: 体验增强（v1.x）

**Rationale:** 核心流程验证后，基于用户反馈补充差异化功能，优先选择实现成本低、用户价值高的功能。
**Delivers:** Prompt 历史复用、参考图上传（图生图）、收藏功能、模型选择
**Addresses:** FEATURES.md 中所有 P2 功能
**Avoids:** 过早实现高复杂度功能（视频首尾帧、多镜头）
**Research flag:** 参考图上传需要验证即梦 base64 上传格式和大小限制

### Phase Ordering Rationale

- Phase 1 → 2：安全架构必须先于业务逻辑，否则密钥安全问题无法修复
- Phase 2 → 3：图片 API 比视频 API 反馈更快（30s vs 5-10min），更适合验证轮询架构
- Phase 3 → 4：桌面端验证后再做移动端，避免双平台同时调试
- Phase 4 → 5：移动端适配完成后，体验增强才有意义（否则移动端用户无法使用新功能）

### Research Flags

需要在规划阶段深入研究：
- **Phase 4（Capacitor 移动端）：** @capacitor-community/http 插件与即梦自定义签名 Header 的兼容性，iOS ATS 配置细节，需要真机验证
- **Phase 5（参考图上传）：** 即梦参考图 base64 编码格式、大小限制（单图最大尺寸）、多图上传顺序

标准模式，可跳过深入研究：
- **Phase 1（基础设施）：** Electron contextBridge + IPC 是成熟模式，文档完善
- **Phase 2（图片生成）：** 即梦 API 文档完整，HMAC-SHA256 签名已有代码示例
- **Phase 3（视频生成）：** 可灵 API 文档完整，JWT 鉴权已有代码示例

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | 框架版本基于训练知识（截止 2025-08），实施前需 `npm info [package] version` 验证最新版本 |
| Features | HIGH | 直接基于即梦/可灵 API 文档 + PROJECT.md 分析，功能边界清晰 |
| Architecture | HIGH | Electron 主/渲染进程架构是成熟模式，API 文档确认了鉴权和状态机细节 |
| Pitfalls | MEDIUM | 基于 API 文档和框架知识推断，部分（如 Capacitor CORS）需真机验证 |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **版本号验证：** Capacitor 7、Ionic Vue 8、Vite 6 等版本号需在项目初始化时用 `npm info` 确认最新稳定版
- **Capacitor HTTP 插件选型：** `@capacitor-community/http` vs Capacitor 官方 `@capacitor/http`（如已发布）需在 Phase 4 前确认
- **即梦 return_url 参数：** 必须明确设置 `return_url=true`，否则返回 base64 数据，移动端 `<img>` 标签无法直接显示；需在 Phase 2 实施时验证
- **可灵视频 URL 下载策略：** 视频文件较大（可能 50-200MB），移动端下载策略（后台下载 vs 前台下载）需在 Phase 4 确认

## Sources

### Primary (HIGH confidence)
- `docs/即梦.md` — 即梦 jimeng_t2i_v40 API 文档：HMAC-SHA256 V4 签名、任务状态枚举、错误码
- `docs/可灵.md` — 可灵 Omni-Video API 文档：JWT HS256 鉴权规范、任务状态枚举、错误码
- `.planning/PROJECT.md` — 项目需求与技术约束定义
- `package.json` — Electron 41.0.3 版本确认

### Secondary (MEDIUM confidence)
- 训练知识（截止 2025-08）— Capacitor 7、Vue 3、Pinia、Ionic 8 版本信息和最佳实践
- Electron 官方文档（训练数据）— contextBridge 安全模型、主/渲染进程架构

### Tertiary (LOW confidence)
- Capacitor 移动端网络限制（训练数据推断）— WebView CORS、iOS ATS、后台执行限制，需真机验证

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
