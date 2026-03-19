---
phase: 4
slug: 移动端适配
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-20
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test:unit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | MOB-01/02 | unit | `npm run test -- src/renderer/bridge/platform` | ❌ Wave 0 | ⬜ pending |
| 4-01-02 | 01 | 0 | MOB-01/02 | unit | `npm run test -- src/services/storageService` | ❌ Wave 0 | ⬜ pending |
| 4-01-03 | 01 | 0 | MOB-01/02 | unit | `npm run test -- src/services/jimengService` | ❌ Wave 0 | ⬜ pending |
| 4-01-04 | 01 | 0 | MOB-01/02 | unit | `npm run test -- src/services/klingService` | ❌ Wave 0 | ⬜ pending |
| 4-01-05 | 01 | 0 | MOB-01/02 | unit | `npm run test -- src/services/downloadService` | ❌ Wave 0 | ⬜ pending |
| 4-02-01 | 02 | 1 | MOB-01 | manual | Xcode 构建 + 真机运行 | manual-only | ⬜ pending |
| 4-02-02 | 02 | 1 | MOB-02 | manual | Android Studio 构建 + 真机运行 | manual-only | ⬜ pending |
| 4-03-01 | 03 | 2 | MOB-01/02 | unit | `npm run test -- src/renderer/store` | ✅ Wave 2 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/renderer/bridge/platform.test.ts` — 覆盖 isElectron / isCapacitor 检测逻辑（MOB-01/02）
- [ ] `src/services/storageService.test.ts` — mock @capacitor/preferences，测试 set/get/remove（MOB-01/02）
- [ ] `src/services/jimengService.test.ts` — 测试 HMAC Header 构建，复用 hmacSigner 逻辑（MOB-01/02）
- [ ] `src/services/klingService.test.ts` — 测试 JWT Header 构建，复用 jwtSigner 逻辑（MOB-01/02）
- [ ] `src/services/downloadService.test.ts` — 测试 web 路径（Capacitor 路径需 mock）（MOB-01/02）

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| iOS 原生应用打包并在真机运行 | MOB-01 | 需要 Xcode + Apple 开发者账号 + 真机 | `npx cap open ios` → Xcode 构建 → 真机安装 → 验证核心功能 |
| Android 原生应用打包并在真机运行 | MOB-02 | 需要 Android Studio + 真机 | `npx cap open android` → Android Studio 构建 → 真机安装 → 验证核心功能 |
| 移动端文件下载到设备本地 | MOB-01/02 | 需要真机验证文件系统写入 | 在真机上点击下载按钮 → 验证文件出现在 Documents 目录 |
| @capacitor-community/http 与即梦签名 Header 兼容性 | MOB-01/02 | 需要真机 + 网络请求验证 | 在真机上触发图片生成 → 验证 API 返回成功（非 401） |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
