# 灵览 AI 创作工具

## What This Is

基于 Electron + Capacitor 构建的 iOS/Android 移动应用，允许用户通过提示词和参数驱动 AI 生成图片和视频。
图片调用即梦 API（jimeng_t2i_v40），视频调用可灵 API（Omni-Video），均为异步任务模式，需轮询查询接口直到任务完成。

## Core Value

用户能够通过提示词模板或自由输入，快速发起 AI 生图/生视频任务，并在任务完成后查看、下载结果。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 用户可以通过提示词（模板或自由输入）+ 参数配置发起生图任务
- [ ] 用户可以通过提示词（模板或自由输入）+ 参数配置发起生视频任务
- [ ] 系统异步轮询任务状态，直到所有任务完成后停止轮询
- [ ] 用户可以查看生成结果（图片/视频在线预览）
- [ ] 用户可以下载生成的图片/视频到本地
- [ ] 用户可以查看历史生成记录（本地持久化）
- [ ] 应用可打包为 iOS 和 Android 原生应用

### Out of Scope

- 用户账号系统 — 初版本地化，无需登录
- 云端同步历史记录 — 本地存储即可
- 实时生成（流式）— API 本身为异步模式

## Context

- 当前已有 Electron 基础项目（index.html + main.js + package.json）
- 即梦 API：火山引擎视觉服务，HMAC-SHA256 签名鉴权，提交任务后轮询 CVSync2AsyncGetResult
- 可灵 API：JWT 鉴权（HS256），提交 /v1/videos/omni-video 后轮询 /v1/videos/omni-video/{id}
- 需要集成 Capacitor 以支持 iOS/Android 打包
- 设计文档需输出到 docs/ 目录（UI 设计文档 + 技术设计文档）

## Constraints

- **Tech Stack**: Electron + Capacitor（iOS/Android 打包）
- **API**: 即梦（图片）+ 可灵（视频），均为异步轮询模式
- **Storage**: 本地持久化（Capacitor Filesystem / localStorage）
- **Auth**: 即梦用 HMAC-SHA256 签名，可灵用 JWT（HS256）

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Electron + Capacitor | 复用现有 Electron 代码，同时支持 iOS/Android 打包 | — Pending |
| 本地轮询（setInterval）| 无 WebSocket 支持，API 为异步模式 | — Pending |
| 本地持久化历史 | 无需后端，降低复杂度 | — Pending |

---
*Last updated: 2026-03-19 after initialization*
