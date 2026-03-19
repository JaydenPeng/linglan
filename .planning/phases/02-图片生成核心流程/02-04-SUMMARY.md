---
phase: 02-图片生成核心流程
plan: "04"
subsystem: UI
tags: [vue, ionic, task-list, task-card, ipc]
dependency_graph:
  requires: [02-01]
  provides: [TaskListView, TaskCard, ImagePreviewModal-placeholder]
  affects: [src/views, src/components]
tech_stack:
  added: []
  patterns: [Pinia store binding, IPC onStatusUpdate listener, Vue lifecycle cleanup]
key_files:
  created:
    - src/components/TaskCard.vue
    - src/views/TaskListView.vue
    - src/components/ImagePreviewModal.vue
  modified: []
decisions:
  - "ImagePreviewModal.vue 创建为占位组件，Plan 05 替换完整实现，避免编译错误"
metrics:
  duration: "2 min"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_created: 3
---

# Phase 02 Plan 04: 任务列表页面与卡片组件 Summary

**One-liner:** 基于 Pinia taskStore + IPC onStatusUpdate 的实时任务列表，含状态卡片、进度条、重试/取消操作和缩略图展示。

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | 创建任务卡片组件 TaskCard | 27407a9 | src/components/TaskCard.vue |
| 2 | 创建任务列表页面 TaskListView | 2641147 | src/views/TaskListView.vue, src/components/ImagePreviewModal.vue |

## Decisions Made

- ImagePreviewModal.vue 创建为占位组件（仅 `<div />`），Plan 05 替换完整实现，避免 import 导致编译错误

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TaskCard.vue 存在，接受 task prop，emit preview/retry/cancel 事件
- 处理中（PENDING/PROCESSING）显示 indeterminate 进度条
- 失败状态显示重试按钮，处理中显示取消按钮
- 成功状态显示缩略图，点击 emit preview 事件
- TaskListView.vue 存在，onMounted 注册 onStatusUpdate 监听，onUnmounted 取消监听
- 重试逻辑：生成新 UUID → addTask → imageApi.submit，失败时 updateTask FAILED
- 取消逻辑：cancelTask（本地状态）→ imageApi.cancel（停止主进程轮询）
- ImagePreviewModal.vue 占位文件存在，不阻塞编译

## Self-Check: PASSED
