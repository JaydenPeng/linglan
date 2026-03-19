---
phase: 02-图片生成核心流程
plan: "02"
subsystem: main-process-image-handler
tags: [electron, ipc, hmac-sha256, polling, jimeng-api]
dependency_graph:
  requires: [02-01]
  provides: [registerImageHandlers, signRequest, submitImageTask, queryTaskStatus, startPolling]
  affects: [02-03, 02-04]
tech_stack:
  added: []
  patterns: [HMAC-SHA256 签名, setInterval 轮询管理, activePollers Map 生命周期]
key_files:
  created:
    - src/main/imageHandler.ts
    - src/main/api/hmacSigner.ts
  modified:
    - src/main/index.ts
decisions:
  - 使用 Node.js https 模块而非 fetch（与 klingVideoApi.ts 保持一致，避免 Electron 环境兼容问题）
  - hmacSigner 放在 src/main/api/ 目录，与 klingVideoApi.ts 同级，保持 API 层统一
  - cancel 时额外推送 CANCELLED 状态更新，确保渲染进程 taskStore 状态同步
metrics:
  duration: 2 min
  completed: 2026-03-20
---

# Phase 02 Plan 02: 主进程 API 调用与轮询管理器 Summary

**One-liner:** 即梦 HMAC-SHA256 签名 + 主进程 imageHandler，支持多任务并行轮询、cancel 即停、超时保护

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 实现即梦 API 调用函数 | 1f3050b | src/main/imageHandler.ts, src/main/api/hmacSigner.ts |
| 2 | 在主进程入口注册 imageHandler | 4f940ea | src/main/index.ts |

## Decisions Made

1. 使用 Node.js `https` 模块而非 `fetch`，与 `klingVideoApi.ts` 保持一致，避免 Electron 主进程环境兼容问题
2. `hmacSigner.ts` 放在 `src/main/api/` 目录，与 `klingVideoApi.ts` 同级，保持 API 层统一
3. `cancel` 时额外推送 `CANCELLED` 状态更新，确保渲染进程 `taskStore` 状态同步

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 创建缺失的 hmacSigner.ts**
- **Found during:** Task 1
- **Issue:** 计划引用 `./hmacSigner` 但文件不存在，imageHandler.ts 无法编译
- **Fix:** 创建 `src/main/api/hmacSigner.ts`，实现火山引擎 HMAC-SHA256 签名（dateStr/dateTimeStr/canonicalRequest/stringToSign/signingKey 完整流程）
- **Files modified:** src/main/api/hmacSigner.ts（新建）
- **Commit:** 1f3050b

**2. [Rule 1 - Bug] 修正导入路径**
- **Found during:** Task 1
- **Issue:** 计划中 `import from '../../src/types/image'` 路径错误（相对于 src/main/ 应为 `../types/image`），`configStore` 实际在 `./store/configStore` 且导出 `getCredentials` 而非 `getConfig`
- **Fix:** 使用正确路径 `../types/image`、`./store/configStore`，调用 `getCredentials('jiMengAk')` / `getCredentials('jiMengSk')`
- **Files modified:** src/main/imageHandler.ts
- **Commit:** 1f3050b

## Self-Check: PASSED
