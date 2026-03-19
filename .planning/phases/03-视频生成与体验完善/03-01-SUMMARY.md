---
phase: "03-视频生成与体验完善"
plan: "01"
subsystem: "主进程视频 API 层"
tags: [video, kling, ipc, api, tdd]
dependency_graph:
  requires: ["01-01 (jose JWT signer)", "01-01 (electron-vite scaffold)"]
  provides: ["video:submit IPC channel", "video:poll IPC channel", "VideoSubmitParams/VideoTask types"]
  affects: ["渲染进程视频生成页面 (Phase 3 后续计划)"]
tech_stack:
  added: []
  patterns: ["Node.js https module for API calls", "IPC handler pattern (ipcMain.handle)", "JWT Bearer auth via getKlingToken"]
key_files:
  created:
    - src/shared/types/video.ts
    - src/main/api/klingVideoApi.ts
    - src/main/ipc/videoHandlers.ts
    - src/main/__tests__/klingVideoApi.test.ts
    - src/main/__tests__/videoHandlers.test.ts
  modified:
    - src/main/index.ts
decisions:
  - "渲染进程轮询策略：渲染进程定时调用 video:poll，主进程不内部轮询，与 Phase 2 架构一致"
  - "图片参数（image_url/image_tail_url）直接透传，可灵 API 支持 base64 data URI"
metrics:
  duration: "15 min"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase 3 Plan 01: 可灵 Omni-Video API 封装与 IPC Handler 注册 Summary

可灵 Omni-Video API 完整封装：JWT 鉴权 HTTP 请求（提交 + 轮询）+ IPC handler 注册，渲染进程可通过 `video:submit` / `video:poll` 发起视频任务，密钥不进入渲染进程。

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 定义视频类型并封装可灵 Omni-Video API | 53cc355 | src/shared/types/video.ts, src/main/api/klingVideoApi.ts, src/main/__tests__/klingVideoApi.test.ts |
| 2 | 注册视频 IPC handlers 并接入主进程 | f410272 | src/main/ipc/videoHandlers.ts, src/main/__tests__/videoHandlers.test.ts, src/main/index.ts |

## Verification

- src/shared/types/video.ts 导出 VideoMode、VideoSubmitParams、VideoTask
- src/main/api/klingVideoApi.ts 导出 submitVideoTask、pollVideoTask
- src/main/ipc/videoHandlers.ts 导出 registerVideoHandlers
- src/main/index.ts 已调用 registerVideoHandlers(ipcMain)
- 10 个单元测试全部通过（klingVideoApi 5 + videoHandlers 5）

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 修复测试 mock 参数位置**
- **Found during:** Task 1 GREEN 阶段
- **Issue:** 测试中 `https.request` mock 使用三参数形式 `(url, opts, cb)`，但实现使用两参数形式 `(opts, cb)`，导致 `cb is not a function`
- **Fix:** 将所有 mock 改为两参数形式
- **Files modified:** src/main/__tests__/klingVideoApi.test.ts
- **Commit:** 53cc355（含修复）

## Deferred Items

- `src/main/__tests__/auth.test.ts` 中 4 个 jwtSigner 测试失败：`jose` 在 jsdom 环境下 `Buffer.from(sk)` 不被识别为 `Uint8Array`，属于预存问题，与本计划无关。需在后续计划中修复（改用 `new TextEncoder().encode(sk)` 或切换测试环境为 node）。

## Self-Check: PASSED
