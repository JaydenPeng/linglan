# Roadmap: 灵览 AI 创作工具

## Overview

从项目骨架出发，先建立安全的 API 鉴权架构和设计文档，再跑通图片生成完整流程，然后扩展视频生成并完善历史记录与提示词体验，最后适配 iOS/Android 移动端打包。四个阶段每个都交付可验证的用户能力。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: 基础设施与设计文档** - 建立项目骨架、API 鉴权架构、密钥配置，输出 UI 和技术设计文档 (completed 2026-03-19)
- [ ] **Phase 2: 图片生成核心流程** - 跑通文生图/图生图完整链路：提交任务、轮询状态、预览下载
- [ ] **Phase 3: 视频生成与体验完善** - 扩展文生视频能力，补充历史记录和提示词模板体验
- [ ] **Phase 4: 移动端适配** - 打包为 iOS/Android 原生应用，处理移动端文件系统和网络适配

## Phase Details

### Phase 1: 基础设施与设计文档
**Goal**: 项目可运行，两套 API 鉴权验证通过，密钥安全存储，设计文档就绪
**Depends on**: Nothing (first phase)
**Requirements**: DOC-01, DOC-02, CONF-01, CONF-02, CONF-03
**Success Criteria** (what must be TRUE):
  1. 用户可以在设置页面输入并保存即梦和可灵的 AK/SK，页面显示"已配置"状态而不暴露明文
  2. docs/UI设计文档.md 和 docs/技术设计文档.md 已生成，包含组件结构和 API 集成方案
  3. 项目可以在 Electron 中启动，Vue 3 + Vite + Pinia 基础框架运行正常
  4. 即梦 HMAC-SHA256 签名和可灵 JWT HS256 鉴权逻辑在主进程中验证通过（密钥不进入渲染进程）
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — electron-vite + Vue 3 + TypeScript 项目骨架 + vitest Wave 0 stub
- [ ] 01-02-PLAN.md — 生成 UI 设计文档和技术设计文档（docs/）
- [ ] 01-03-PLAN.md — 主进程鉴权模块（hmacSigner + jwtSigner + configStore + IPC handlers）

### Phase 2: 图片生成核心流程
**Goal**: 用户可以提交文生图/图生图任务，实时看到任务状态，并预览和下载生成结果
**Depends on**: Phase 1
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04, TASK-01, TASK-02, TASK-03, TASK-04, RES-01, RES-03, RES-04
**Success Criteria** (what must be TRUE):
  1. 用户输入提示词后可以提交生图任务，任务状态从"已提交"变为"处理中"再到"成功/失败"
  2. 用户可以上传参考图片并配置宽高比、强制单图等参数后发起图生图任务
  3. 多个任务可以并行执行，每个任务独立显示状态，失败任务可以重试，进行中任务可以取消
  4. 任务完成后用户可以在线预览生成图片，并下载到本地
  5. 用户可以分享生成结果的链接
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — 类型合约 + Pinia taskStore + contextBridge imageApi（Wave 1）
- [ ] 02-02-PLAN.md — 主进程即梦 API 调用 + 轮询管理器（Wave 2）
- [ ] 02-03-PLAN.md — 任务提交界面 CreateView（文生图/图生图 Tab）（Wave 2）
- [ ] 02-04-PLAN.md — 任务列表 TaskListView + TaskCard 组件（Wave 2）
- [ ] 02-05-PLAN.md — 全屏预览 + 下载 + 分享 ImagePreviewModal（Wave 3）

### Phase 3: 视频生成与体验完善
**Goal**: 用户可以发起文生视频任务，查看历史记录，使用提示词模板提升创作效率
**Depends on**: Phase 2
**Requirements**: VID-01, VID-02, VID-03, VID-04, RES-02, HIST-01, HIST-02, HIST-03, HIST-04, PROMPT-01, PROMPT-02, PROMPT-03
**Success Criteria** (what must be TRUE):
  1. 用户可以输入提示词发起生视频任务，支持配置时长（3-15s）、宽高比和模式，可上传首帧/尾帧图片
  2. 用户可以使用多镜头模式（multi_shot）生成视频，任务完成后可在线播放视频
  3. 用户可以查看历史生成记录列表，从历史记录复用提示词重新发起任务，收藏或删除记录
  4. 用户可以从内置提示词模板库选择模板，自由输入提示词，并保存自定义模板
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — 可灵 Omni-Video API 主进程封装（IPC handlers + API + 类型定义）
- [x] 03-02-PLAN.md — 历史记录 store + 提示词模板 store（数据层 + 内置模板）
- [ ] 03-03-PLAN.md — 视频生成表单 UI + 嵌入播放器（依赖 03-01）
- [ ] 03-04-PLAN.md — 历史记录列表 UI + 提示词模板面板（依赖 03-02）

### Phase 4: 移动端适配
**Goal**: 应用可打包为 iOS 和 Android 原生应用，移动端文件下载和网络请求正常工作
**Depends on**: Phase 3
**Requirements**: MOB-01, MOB-02
**Success Criteria** (what must be TRUE):
  1. 应用可以通过 Capacitor 打包为 iOS 原生应用并在真机上运行，所有核心功能正常
  2. 应用可以通过 Capacitor 打包为 Android 原生应用并在真机上运行，所有核心功能正常
  3. 移动端可以将生成的图片/视频下载到设备本地相册或文件系统
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — 共享服务层（platform.ts + storageService + jimengService + klingService + downloadService）
- [ ] 04-02-PLAN.md — Capacitor 初始化 + 原生平台配置 + 权限声明 + 真机验证检查点
- [ ] 04-03-PLAN.md — Pinia configStore 双路径接线（Electron IPC / Capacitor storageService）

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 基础设施与设计文档 | 3/3 | Complete   | 2026-03-19 |
| 2. 图片生成核心流程 | 3/5 | In Progress|  |
| 3. 视频生成与体验完善 | 2/4 | In Progress | - |
| 4. 移动端适配 | 0/3 | Not started | - |
