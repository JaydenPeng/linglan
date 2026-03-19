---
phase: 01-基础设施与设计文档
plan: "03"
subsystem: main-process-auth
tags: [auth, ipc, crypto, electron, safeStorage]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [configStore, hmacSigner, jwtSigner, configHandlers]
  affects: [phase-02-image-gen, phase-03-video-gen]
tech_stack:
  added: [Node.js crypto (HS256 JWT), CryptoJS (HMAC-SHA256), electron-store, safeStorage]
  patterns: [IPC handler registration, credential encryption, JWT caching]
key_files:
  created:
    - src/main/auth/hmacSigner.ts
    - src/main/auth/jwtSigner.ts
    - src/main/store/configStore.ts
    - src/main/ipc/configHandlers.ts
  modified:
    - src/main/index.ts
    - vitest.config.ts
decisions:
  - "jwtSigner 使用 Node.js crypto 而非 jose，避免 vitest node 环境中 Uint8Array 跨 realm instanceof 失败"
  - "vitest.config 为 src/main/**/*.test.ts 指定 node 环境，避免 jsdom 干扰主进程测试"
metrics:
  duration: "~10 min"
  completed: "2026-03-19T17:10:53Z"
  tasks_completed: 2
  files_created: 4
  files_modified: 2
---

# Phase 01 Plan 03: 主进程鉴权与密钥存储 Summary

实现了即梦 HMAC-SHA256 V4 签名、可灵 HS256 JWT 生成（带缓存）、safeStorage 加密存储，以及 4 个 IPC 通道注册。

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 实现密钥存储和鉴权模块 | cbbae78 | hmacSigner.ts, jwtSigner.ts, configStore.ts, vitest.config.ts |
| 2 | 实现 IPC 处理器并更新测试 | 358cd91 | configHandlers.ts, index.ts |

## Verification

- `npx vitest run`: 18/18 tests passed (hmacSigner 4 + jwtSigner 4 + existing 10)
- Authorization header 格式: `HMAC-SHA256 Credential={ak}/...，SignedHeaders=...，Signature=[a-f0-9]{64}`
- JWT nbf = now-5，exp = now+1800，缓存命中逻辑正常
- config:get-status 只返回布尔值，密钥不经 IPC 回传

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jwtSigner: jose SignJWT 在 vitest node 环境中 Uint8Array instanceof 失败**
- Found during: Task 1 (RED phase)
- Issue: jose 的 webapi 版本在 vitest node 环境中，`Buffer instanceof Uint8Array` 检查失败，抛出 `payload must be an instance of Uint8Array`
- Fix: 用 Node.js 内置 `crypto.createHmac` 直接实现 HS256 JWT，完全绕过 jose 的 webapi 路径
- Files modified: src/main/auth/jwtSigner.ts
- Commit: cbbae78

**2. [Rule 1 - Bug] index.ts 已有 registerVideoHandlers，需合并而非覆盖**
- Found during: Task 2
- Issue: index.ts 已被其他计划修改，包含 registerVideoHandlers 调用
- Fix: 在保留 registerVideoHandlers 的基础上追加 registerConfigHandlers
- Files modified: src/main/index.ts
- Commit: 358cd91

## Self-Check: PASSED

All 4 created files exist. Both task commits (cbbae78, 358cd91) verified in git log.
