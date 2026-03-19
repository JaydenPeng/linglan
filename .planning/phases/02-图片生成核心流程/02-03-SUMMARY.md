---
phase: 02-图片生成核心流程
plan: "03"
subsystem: create-view-ui
tags: [vue, ionic, pinia, ipc, ui]
dependency_graph:
  requires: [02-01]
  provides: [CreateView, ImageParamsPanel]
  affects: [02-04]
tech_stack:
  added: []
  patterns: [Ionic Vue components, FileReader base64, v-model component binding]
key_files:
  created:
    - src/views/CreateView.vue
    - src/components/ImageParamsPanel.vue
  modified: []
decisions:
  - ImageParamsPanel 使用 v-model (modelValue + update:modelValue) 与父组件双向绑定参数
  - 参考图上传使用 FileReader.readAsDataURL 转 base64，去掉 data URI 前缀后存入 ref_image
  - taskStore.addTask 先于 window.imageApi.submit 调用，确保本地状态立即可见
metrics:
  duration: 5 min
  completed: 2026-03-20
---

# Phase 02 Plan 03: 任务提交界面 Summary

**One-liner:** 文生图/图生图 Tab 切换页面，含可折叠参数面板和参考图上传，提交后写入 taskStore 并跳转任务列表

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 创建可折叠参数配置面板 | 65cf883 | src/components/ImageParamsPanel.vue |
| 2 | 创建任务提交页面 | e892bbf | src/views/CreateView.vue |

## Decisions Made

1. `ImageParamsPanel` 使用标准 `v-model` 模式（`modelValue` prop + `update:modelValue` emit），父组件直接绑定 `imageParams` ref
2. 参考图上传使用 `FileReader.readAsDataURL`，去掉 `data:image/xxx;base64,` 前缀后存入 `params.ref_image`
3. `taskStore.addTask` 先于 `window.imageApi.submit` 调用，任务立即出现在列表，API 失败时再更新为 FAILED 状态

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
