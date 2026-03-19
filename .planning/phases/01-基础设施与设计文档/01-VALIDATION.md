---
phase: 1
slug: 基础设施与设计文档
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts — Wave 0 installs |
| **Quick run command** | `npm run test:unit -- --run` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- --run`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | — | setup | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | CONF-01/02 | unit | `npm run test:unit -- --run` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | CONF-03 | unit | `npm run test:unit -- --run` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | DOC-01/02 | manual | — | ✅ | ⬜ pending |
| 1-02-02 | 02 | 2 | CONF-01/02 | unit | `npm run test:unit -- --run` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | CONF-01/02 | unit | `npm run test:unit -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/main/__tests__/auth.test.ts` — stubs for CONF-01/02/03 (即梦 HMAC + 可灵 JWT)
- [ ] `vitest.config.ts` — vitest configuration
- [ ] `npm install -D vitest @vitest/coverage-v8` — install test framework

*Wave 0 must complete before any auth implementation tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 设置页面 AK/SK 输入保存 | CONF-01/02/03 | Electron UI 交互 | 启动应用，进入设置页，输入密钥，验证显示"已配置"不暴露明文 |
| UI/技术设计文档内容完整性 | DOC-01/02 | 文档质量判断 | 检查 docs/ 下两份文档包含所有必要章节 |
| Electron 应用正常启动 | — | 运行时验证 | `npm run dev` 启动，Electron 窗口正常显示 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
