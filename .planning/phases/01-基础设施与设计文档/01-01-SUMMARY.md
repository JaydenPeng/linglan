---
phase: 01-基础设施与设计文档
plan: "01"
subsystem: infra
tags: [electron-vite, vue3, typescript, pinia, vitest, contextBridge, electron]

requires: []
provides:
  - electron-vite 三目标构建（main/preload/renderer）
  - contextBridge 安全边界（contextIsolation=true, nodeIntegration=false）
  - Vue 3 + Pinia 渲染进程初始化
  - vitest 测试框架 + Wave 0 测试 stub（11 个 todo）
  - window.electron IPC 类型声明
  - Settings.vue 即梦/可灵配置 UI 骨架
affects: [02-鉴权与配置管理, 03-图片生成核心功能, 04-视频生成与体验完善]

tech-stack:
  added:
    - electron-vite@5.0.0
    - vue@3.5.30
    - pinia@3.0.4
    - vite@7.3.1
    - vitest@4.1.0
    - typescript@5.9.3
    - vue-tsc@3.2.6
    - "@vitejs/plugin-vue@6.0.5"
    - electron-store@11.0.2
    - crypto-js@4.2.0
    - jose@6.2.2
    - "@ionic/vue@8.8.1"
  patterns:
    - "IPC 安全边界：主进程逻辑通过 contextBridge 白名单暴露，渲染进程无 Node 访问"
    - "类型共享：src/shared/types.ts 跨主进程/渲染进程共享接口定义"
    - "状态只存布尔值：configStore 只存 jimengConfigured/klingConfigured，不存明文密钥"

key-files:
  created:
    - electron.vite.config.ts
    - tsconfig.json
    - tsconfig.node.json
    - tsconfig.web.json
    - vitest.config.ts
    - src/main/index.ts
    - src/preload/index.ts
    - src/renderer/main.ts
    - src/renderer/App.vue
    - src/renderer/index.html
    - src/shared/types.ts
    - src/main/__tests__/auth.test.ts
    - src/renderer/store/configStore.ts
    - src/renderer/bridge/ipcClient.ts
    - src/renderer/pages/Settings.vue
  modified:
    - package.json

key-decisions:
  - "jose 从 externalizeDepsPlugin 中排除，由 Vite 打包处理 ESM→CJS 转换"
  - "tsconfig.node.json 使用独立配置（不依赖 @electron-toolkit/tsconfig），避免额外依赖"
  - "vitest 使用 jsdom 环境，支持渲染进程组件测试"
  - "node_modules 删除重建解决 npm arborist symlink bug（.store 目录冲突）"

patterns-established:
  - "IPC 命名约定：config:getStatus / config:save / config:clear"
  - "渲染进程通过 window.electron 访问主进程，类型在 ipcClient.ts 中声明"

requirements-completed: [CONF-01, CONF-02, CONF-03]

duration: 25min
completed: 2026-03-20
---

# Phase 01 Plan 01: 项目骨架搭建 Summary

**electron-vite 三目标构建骨架 + contextBridge 安全边界 + vitest Wave 0 测试 stub，为所有后续 Plan 提供基础**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-20T00:34:00Z
- **Completed:** 2026-03-20T01:00:00Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- 将裸 Electron 项目（main.js + index.html）升级为 electron-vite + Vue 3 + TypeScript 三目标构建
- 建立 contextBridge 安全边界：contextIsolatioIntegration=false，window.electron API 类型完整
- vitest 测试框架可运行，Wave 0 stub（11 个 todo）覆盖 hmacSigner/jwtSigner/configStore 三个模块

## Task Commits

1. **Task 1: 安装依赖并重构项目骨架** - `33f3c1b` (feat)
2. **Task 2: 建立 vitest 配置和 Wave 0 测试 stub** - `623c4ed` (feat)

## Files Created/Modified

- `electron.vite.config.ts` - 三目标构建配置，jose 排除 externalize
- `src/main/index.ts` - 主进程入口，BrowserWindow + preload 配置
- `src/preload/index.ts` - contextBridge 白名单 API 暴露
- `src/renderer/main.ts` - Vue 3 + Pinia 初始化
- `src/renderer/App.vue` - 应用根组件
- `src/renderer/index.html` - 渲染进程 HTML 入口
- `src/shared/types.ts` - 跨进程共享类型（ConfigStatus/SaveConfigPayload/IpcResult）
- `src/main/__tests__/auth.test.ts` - Wave 0 测试 stub（11 个 todo）
- `src/renderer/store/configStore.ts` - 只存布尔状态的配置 store
- `src/renderer/bridge/ipcClient.ts` - window.electron 类型声明
- `src/renderer/pages/Settings.vue` - 即梦/可灵配置 UI 骨架
- `package.json` - 更新 main 入口和 scripts

## Decisions Made

- jose 从 externalizeDepsPlugin 排除：jose 是纯 ESM 包，需要 Vite 打包处理 ESM→CJS 转换，否则主进程无法 require
- tsconfig.node.json 独立配置：不依赖 @electron-toolkit/tsconfig，减少依赖链复杂度
- vitest 使用 jsdom 环境：支持渲染进程 Vue 组件测试，而非仅 node 环境

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 删除重建 node_modules 解决 npm arborist symlink bug**
- **Found during:** Task 1（安装依赖）
- **Issue:** 原 node_modules 包含 .store 目录（pnpm 风格），npm arborist 在处理 symlink 时抛出 `Cannot read properties of null (reading 'matches')`
- **Fix:** 删除 node_modules 后重新 `npm install`，恢复标准 hoisted 结构
- **Files modified:** package-lock.json
- **Verification:** npm install 成功，npm run build 通过
- **Committed in:** 33f3c1b（Task 1 commit）

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** 必要的环境修复，无范围蔓延。

## Issues Encountered

- npm arborist symlink bug：原 node_modules 使用 .store 结构导致 npm 无法安装新包，删除重建解决

## User Setup Required

None - 无需外部服务配置。

## Next Phase Readiness

- 项目骨架完整，`npm run build` 和 `npm run test:unit` 均可正常运行
- Plan 02（鉴权与配置管理）可直接在此骨架上实现 IPC handler 和 electron-store 密钥存储
- Wave 0 测试 stub 已就位，Plan 03 实现鉴权逻辑后直接填充测试内容

---
*Phase: 01-基础设施与设计文档*
*Completed: 2026-03-20*
