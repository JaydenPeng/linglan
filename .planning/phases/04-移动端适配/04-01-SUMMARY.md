---
phase: 04-移动端适配
plan: 01
subsystem: mobile-services
tags: [capacitor, platform-detection, storage, api-signing, download]
dependency_graph:
  requires: [03-06]
  provides: [platform-detection, storage-service, jimeng-service, kling-service, download-service]
  affects: [04-02, 04-03]
tech_stack:
  added:
    - "@capacitor/preferences: 跨平台密钥存储"
    - "@capacitor/filesystem: 文件下载支持"
    - "@capacitor-community/http: HTTP 请求支持"
  patterns:
    - "crypto-js 复现主进程签名逻辑（浏览器兼容）"
    - "环境检测函数区分 Electron/Capacitor 运行环境"
key_files:
  created:
    - src/renderer/bridge/platform.ts
    - src/renderer/bridge/__tests__/platform.test.ts
    - src/services/storageService.ts
    - src/services/__tests__/storageService.test.ts
    - src/services/jimengService.ts
    - src/services/__tests__/jimengService.test.ts
    - src/services/klingService.ts
    - src/services/__tests__/klingService.test.ts
    - src/services/downloadService.ts
    - src/services/__tests__/downloadService.test.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - "使用 crypto-js 在浏览器环境复现 Node.js crypto 的 HMAC-SHA256 和 JWT HS256 签名逻辑"
  - "storageService 专为 Capacitor 路径设计，Electron 路径继续走 IPC"
  - "downloadService 通过 isCapacitor() 判断使用 Filesystem API 或 <a> 标签下载"
metrics:
  duration: 6
  completed_date: "2026-03-22"
  tasks_completed: 2
  files_created: 10
---

# Phase 04 Plan 01: 移动端共享服务层 Summary

**一句话总结:** 建立 Capacitor 移动端共享服务层，包含环境检测、跨平台密钥存储、即梦/可灵 API 直调服务（crypto-js 签名）、文件下载服务，所有服务均通过 TDD 方式实现并测试通过。

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | 环境检测 + storageService（TDD） | e3e6b4a | platform.ts, storageService.ts + 测试文件 |
| 2 | jimeng/kling/download 服务（TDD） | 7a21695, 319a3cf | jimengService.ts, klingService.ts, downloadService.ts + 测试文件 |

## Implementation Details

### Task 1: 环境检测 + storageService

**平台检测 (platform.ts):**
- `isElectron()`: 检测 `window.electron` 是否存在
- `isCapacitor()`: 检测 `window.Capacitor?.isNativePlatform()` 是否为 true

**跨平台存储 (storageService.ts):**
- 使用 `@capacitor/preferences` API 实现密钥存储
- `getItem/setItem/removeItem` 异步接口
- 专为 Capacitor 环境设计，Electron 环境继续使用 IPC

**测试覆盖:**
- platform.test.ts: 5 个测试用例，覆盖环境检测逻辑
- storageService.test.ts: 4 个测试用例，mock Preferences API

### Task 2: API 服务 + 文件下载

**即梦服务 (jimengService.ts):**
- `buildJimengHeaders()`: 使用 crypto-js 复现 HMAC-SHA256 V4 签名
- 与主进程 `hmacSigner.ts` 算法完全一致
- 返回包含 X-Date、Authorization、Host、Content-Type 的 Headers

**可灵服务 (klingService.ts):**
- `buildKlingToken()`: 使用 crypto-js 复现 JWT HS256 签名
- 与主进程 `jwtSigner.ts` 算法完全一致
- 实现 token 缓存逻辑（有效期 > 60s 时复用）

**下载服务 (downloadService.ts):**
- `downloadFile()`: 跨平台文件下载
- Capacitor 环境: 使用 Filesystem API 写入 Documents 目录
- Web/Electron 环境: 使用 `<a>` 标签触发浏览器下载

**测试覆盖:**
- jimengService.test.ts: 4 个测试用例，验证签名 Header 格式
- klingService.test.ts: 3 个测试用例，验证 JWT 结构和缓存
- downloadService.test.ts: 2 个测试用例，验证 web 路径下载

## Deviations from Plan

无偏差 - 计划按原定方案执行。

## Verification Results

**单元测试:**
```
✓ 68 tests passed (13 test files)
✓ 新增 9 个测试用例全部通过
```

**TypeScript 编译:**
```
✓ npx tsc --noEmit 无错误
```

**关键验证点:**
- ✅ platform.ts 正确区分 Electron 和 Capacitor 环境
- ✅ storageService 正确调用 Preferences API
- ✅ jimengService 签名 Header 格式与主进程一致
- ✅ klingService JWT 格式与主进程一致，缓存逻辑正常
- ✅ downloadService web 路径能触发浏览器下载

## Dependencies Installed

```json
{
  "@capacitor/preferences": "^6.0.2",
  "@capacitor/filesystem": "^6.0.1",
  "@capacitor-community/http": "^1.4.1"
}
```

## Next Steps

- **04-02**: 实现 API 调用函数（submitImageTask/pollImageTask/submitVideoTask/pollVideoTask）
- **04-03**: 接线 configStore 和 taskStore，Capacitor 环境下调用共享服务层

## Self-Check

验证创建的文件是否存在:

```
✓ FOUND: src/renderer/bridge/platform.ts
✓ FOUND: src/services/storageService.ts
✓ FOUND: src/services/jimengService.ts
✓ FOUND: src/services/klingService.ts
✓ FOUND: src/services/downloadService.ts
```

验证提交是否存在:

```
✓ All commits found (e3e6b4a, 7a21695, 319a3cf)
```

## Self-Check: PASSED

所有文件已创建，所有提交已记录，测试全部通过。
