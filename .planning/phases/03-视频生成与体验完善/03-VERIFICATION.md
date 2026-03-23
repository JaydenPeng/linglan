---
phase: 03-视频生成与体验完善
verified: 2026-03-20T10:00:00Z
status: gaps_found
score: 11/13 must-haves verified
re_verification: false
gaps:
  - truth: "用户可以从历史记录复用提示词重新发起任务（HIST-02）"
    status: partial
    reason: "HistoryPage 将提示词写入 sessionStorage 并显示 toast，但不自动跳转到生成页面；用户需手动切换 Tab 才能使用复用的提示词，体验不完整"
    artifacts:
      - path: "src/renderer/pages/HistoryPage.vue"
        issue: "onReusePrompt 只写 sessionStorage + 显示 toast，缺少 activeTab 切换到 video 的逻辑"
    missing:
      - "HistoryPage.onReusePrompt 写入 sessionStorage 后，需通过 emit 或共享状态将 App.vue 的 activeTab 切换到 'video'，使用户直接看到填入提示词的视频生成页面"
  - truth: "提示词模板面板接入图片生成页面（PROMPT-01/02/03 对图片生成的覆盖）"
    status: failed
    reason: "03-04-PLAN 要求 PromptTemplatePanel 同时接入 VideoGeneratePage 和 ImageGeneratePage，但 renderer 中不存在 ImageGeneratePage（Phase 2 尚未完成），App.vue 也无图片生成 Tab"
    artifacts:
      - path: "src/renderer/pages/VideoGeneratePage.vue"
        issue: "PromptTemplatePanel 已接入，但 ImageGeneratePage 不存在"
    missing:
      - "Phase 2 完成后，需在 ImageGeneratePage 中接入 PromptTemplatePanel（'从模板选择'按钮 + select 事件处理）"
      - "App.vue 需添加图片生成 Tab（Phase 2 范围，但影响 Phase 3 完整性）"
human_verification:
  - test: "左滑操作在桌面端（鼠标）和触摸屏上均可触发"
    expected: "向左拖拽超过阈值后，复用/收藏/删除三个按钮从右侧滑出"
    why_human: "touch/mouse 事件交互行为无法通过静态代码分析验证"
  - test: "视频任务完成后点击封面展开播放器"
    expected: "VideoPlayer 出现并自动播放视频，进度条可拖拽，暂停/播放按钮正常"
    why_human: "需要真实视频 URL 和 Electron 环境才能验证播放行为"
  - test: "提示词模板面板底部半屏弹出效果"
    expected: "点击'从模板选择'后，遮罩出现，面板从底部滑入，占屏幕约 60% 高度"
    why_human: "CSS 动画和视觉效果需人工确认"
---

# Phase 3: 视频生成与体验完善 验证报告

**Phase Goal:** 用户可以发起文生视频任务，查看历史记录，使用提示词模板提升创作效率
**Verified:** 2026-03-20T10:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | 主进程可接收视频生成请求并调用可灵 API | ✓ VERIFIED | `videoHandlers.ts` 注册 `video:submit`/`video:poll`，`main/index.ts` 调用 `registerVideoHandlers(ipcMain)` |
| 2 | 支持首帧/尾帧图片参数（base64）传入 API | ✓ VERIFIED | `klingVideoApi.ts` 展开 `image_url`/`image_tail_url`；`VideoParamsForm.vue` 用 FileReader 转 base64 |
| 3 | 支持 multi_shot 模式，与 std/pro 区分 | ✓ VERIFIED | `VideoParamsForm.vue` multi_shot 按钮有 `.multi-badge` 黄色标识，`klingVideoApi.ts` 直接传 mode 字段 |
| 4 | 视频任务状态实时轮询更新 | ✓ VERIFIED | `videoTaskStore.ts` setInterval 3000ms 调用 `video:poll`，succeed/failed 时 clearInterval |
| 5 | 任务完成后可在线播放视频 | ✓ VERIFIED | `VideoTaskCard.vue` v-if 条件渲染 `VideoPlayer`，点击封面切换 showPlayer |
| 6 | 历史记录持久化（应用重启后保留） | ✓ VERIFIED | `historyStore.ts` persist key `linglan-history`，`main.ts` 注册 `pinia-plugin-persistedstate` |
| 7 | 历史记录支持图片/视频混合，按时间倒序 | ✓ VERIFIED | `HistoryRecord.type` 为 `image\|video`，`addRecord` 用 `unshift` 插入头部 |
| 8 | 用户可收藏、删除历史记录 | ✓ VERIFIED | `HistoryItem.vue` 左滑展开收藏/删除按钮，调用 `historyStore.toggleFavorite`/`deleteRecord` |
| 9 | 用户可从历史记录复用提示词重新发起任务 | ✗ PARTIAL | sessionStorage 写入正确，但 HistoryPage 不自动跳转到视频生成页，用户需手动切换 Tab |
| 10 | 全部/已收藏筛选正确过滤列表 | ✓ VERIFIED | `HistoryPage.vue` computed `displayRecords` 调用 `historyStore.filteredRecords(filter.value)` |
| 11 | 内置提示词模板按分类组织（15 条，5 类） | ✓ VERIFIED | `promptTemplate.ts` BUILTIN_TEMPLATES 15 条，覆盖风景/人物/动漫/建筑/抽象各 3 条 |
| 12 | 点击模板填入提示词并关闭面板 | ✓ VERIFIED | `PromptTemplatePanel.vue` onSelect emit `select(content)` + `close()`，VideoGeneratePage 监听 select 填入 prompt |
| 13 | 自定义模板可增删，接入生成页面 | ✗ FAILED | 自定义模板增删功能完整，但仅接入 VideoGeneratePage；ImageGeneratePage 不存在（Phase 2 未完成） |

**Score:** 11/13 truths verified

### Required Artifacts

| Artifact | 计划路径 | 实际路径 | Status | Details |
|----------|---------|---------|--------|---------|
| `src/shared/types/video.ts` | 同左 | 同左 | ✓ VERIFIED | 导出 VideoMode, VideoSubmitParams, VideoTask |
| `src/main/api/klingVideoApi.ts` | 同左 | 同左 | ✓ VERIFIED | 导出 submitVideoTask, pollVideoTask，JWT 鉴权 HTTPS 请求 |
| `src/main/ipc/videoHandlers.ts` | 同左 | 同左 | ✓ VERIFIED | 导出 registerVideoHandlers，注册 video:submit/video:poll |
| `src/shared/types/history.ts` | 同左 | 同左 | ✓ VERIFIED | 导出 HistoryRecord, HistoryRecordType |
| `src/shared/types/promptTemplate.ts` | 同左 | 同左 | ✓ VERIFIED | 导出 PromptTemplate, PromptCategory, BUILTIN_TEMPLATES(15条) |
| `src/renderer/stores/historyStore.ts` | `stores/` | `store/` | ✓ VERIFIED | 路径偏差（单数），功能完整，persist 配置正确 |
| `src/renderer/stores/promptTemplateStore.ts` | `stores/` | `store/` | ✓ VERIFIED | 路径偏差（单数），功能完整，persist 配置正确 |
| `src/renderer/views/VideoGeneratePage.vue` | `views/` | `pages/` | ✓ VERIFIED | 路径偏差，功能完整，接入 videoTaskStore + PromptTemplatePanel |
| `src/renderer/components/VideoParamsForm.vue` | 同左 | 同左 | ✓ VERIFIED | 时长滑块、宽高比按钮组、模式选择、首帧/尾帧上传 |
| `src/renderer/components/VideoTaskCard.vue` | 同左 | 同左 | ✓ VERIFIED | 状态 badge、封面、v-if 条件渲染 VideoPlayer |
| `src/renderer/components/VideoPlayer.vue` | 同左 | 同左 | ✓ VERIFIED | 原生 video 元素，loop/autoplay/muted，进度条，暂停/播放 |
| `src/renderer/stores/videoTaskStore.ts` | `stores/` | `store/` | ✓ VERIFIED | submitTask + setInterval 轮询，video:submit/video:poll IPC |
| `src/renderer/views/HistoryPage.vue` | `views/` | `pages/` | ⚠️ PARTIAL | 路径偏差，筛选/列表功能完整，但复用提示词不自动跳转 |
| `src/renderer/components/HistoryItem.vue` | 同左 | 同左 | ✓ VERIFIED | 左滑操作（touch+mouse），收藏星标，类型 badge，相对时间 |
| `src/renderer/components/PromptTemplatePanel.vue` | 同左 | 同左 | ⚠️ PARTIAL | 功能完整，但仅接入 VideoGeneratePage，ImageGeneratePage 不存在 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `videoHandlers.ts` | `klingVideoApi.ts` | submitVideoTask/pollVideoTask | ✓ WIRED | 直接调用，import 正确 |
| `klingVideoApi.ts` | 可灵 /v1/videos/omni-video | JWT Bearer HTTPS | ✓ WIRED | httpsRequest + Authorization header |
| `main/index.ts` | `videoHandlers.ts` | registerVideoHandlers(ipcMain) | ✓ WIRED | 第 3 行 import，app.whenReady 中调用 |
| `VideoGeneratePage.vue` | video:submit IPC | videoTaskStore.submitTask() | ✓ WIRED | submit() → videoStore.submitTask() → ipcRenderer.invoke('video:submit') |
| `videoTaskStore.ts` | video:poll IPC | setInterval 3000ms | ✓ WIRED | startPolling() 中 setInterval 调用 ipcRenderer.invoke('video:poll') |
| `VideoTaskCard.vue` | `VideoPlayer.vue` | v-if task.succeed + showPlayer | ✓ WIRED | `<VideoPlayer v-if="showPlayer && task.video_url" :src="task.video_url" />` |
| `historyStore.ts` | localStorage | pinia-plugin-persistedstate | ✓ WIRED | persist key 'linglan-history'，main.ts 注册插件 |
| `promptTemplateStore.ts` | localStorage | pinia-plugin-persistedstate | ✓ WIRED | persist key 'linglan-prompt-templates'，pick: ['customTemplates'] |
| `HistoryItem.vue` | `historyStore.ts` | toggleFavorite/deleteRecord | ✓ WIRED | useHistoryStore() 调用，emit reuse-prompt |
| `PromptTemplatePanel.vue` | `promptTemplateStore.ts` | getByCategory/addCustomTemplate/deleteCustomTemplate | ✓ WIRED | usePromptTemplateStore() 调用 |
| `PromptTemplatePanel.vue` | VideoGeneratePage 提示词输入框 | emit select(content) | ✓ WIRED | onTemplateSelect(content) → prompt.value = content |
| `PromptTemplatePanel.vue` | ImageGeneratePage 提示词输入框 | emit select(content) | ✗ NOT_WIRED | ImageGeneratePage 不存在（Phase 2 未完成） |
| `HistoryPage.vue` | VideoGeneratePage（Tab 切换） | sessionStorage + activeTab | ✗ NOT_WIRED | 写入 sessionStorage 但不触发 Tab 切换，用户需手动操作 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| VID-01 | 03-01, 03-03 | 文字提示词发起生视频任务 | ✓ SATISFIED | VideoGeneratePage textarea + videoTaskStore.submitTask |
| VID-02 | 03-01, 03-03 | 上传首帧/尾帧图片 | ✓ SATISFIED | VideoParamsForm 首帧/尾帧上传，base64 传入 API |
| VID-03 | 03-01, 03-03 | 配置时长(3-15s)、宽高比、模式 | ✓ SATISFIED | VideoParamsForm IonRange + 按钮组 + IonSegment |
| VID-04 | 03-01, 03-03 | multi_shot 多镜头模式 | ✓ SATISFIED | VideoParamsForm multi-badge 标识，API 直传 mode 字段 |
| RES-02 | 03-03 | 预览生成的视频（在线播放） | ✓ SATISFIED | VideoPlayer 嵌入 VideoTaskCard，v-if 条件渲染 |
| HIST-01 | 03-02, 03-04 | 查看历史生成记录列表（本地持久化） | ✓ SATISFIED | HistoryPage + historyStore persist |
| HIST-02 | 03-02, 03-04 | 从历史记录复用提示词重新发起任务 | ✗ BLOCKED | sessionStorage 写入正确，但缺少自动跳转到生成页面的逻辑 |
| HIST-03 | 03-02, 03-04 | 收藏历史记录 | ✓ SATISFIED | HistoryItem 左滑收藏按钮 + historyStore.toggleFavorite |
| HIST-04 | 03-02, 03-04 | 删除历史记录 | ✓ SATISFIED | HistoryItem 左滑删除按钮 + 二次确认 + historyStore.deleteRecord |
| PROMPT-01 | 03-02, 03-04 | 从内置提示词模板库选择模板 | ✓ SATISFIED | PromptTemplatePanel 模板库 Tab，15 条内置模板，分类浏览 |
| PROMPT-02 | 03-02, 03-04 | 自由输入提示词 | ✓ SATISFIED | VideoGeneratePage textarea，无限制自由输入 |
| PROMPT-03 | 03-02, 03-04 | 保存自定义提示词模板 | ✓ SATISFIED | PromptTemplatePanel 我的模板 Tab，内联表单新增，persist 持久化 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| 无 | - | - | - | 未发现 TODO/FIXME/placeholder 实现或空 handler |

注：`src/views/CreateView.vue` 中的 `placeholder` 属性为 HTML input placeholder 文本，非代码占位符，不计入。

### Human Verification Required

#### 1. 左滑操作交互

**Test:** 在 HistoryPage 中，用鼠标向左拖拽一条历史记录条目超过 40px
**Expected:** 复用/收藏/删除三个操作按钮从右侧滑出（宽度 180px），点击各按钮功能正常
**Why human:** touch/mouse 事件的拖拽阈值和 CSS transition 效果需在真实 Electron 窗口中验证

#### 2. 视频播放器功能

**Test:** 提交一个视频任务，等待完成后点击封面图
**Expected:** VideoPlayer 出现，视频自动播放（静音），进度条随时间更新，暂停/播放按钮切换正常
**Why human:** 需要真实可灵 API 密钥和网络环境，视频 URL 有效性无法静态验证

#### 3. 提示词模板面板视觉效果

**Test:** 在视频生成页面点击"从模板选择"按钮
**Expected:** 黑色半透明遮罩出现，面板从底部滑入，高度约 60vh，分类标签可横向滚动
**Why human:** CSS fixed 定位和视觉效果需人工确认

### Gaps Summary

发现 2 个 gap，均与跨页面交互和 Phase 2 依赖相关：

**Gap 1 — HIST-02 复用提示词跳转缺失（可修复）：** `HistoryPage.onReusePrompt` 将提示词写入 sessionStorage 后仅显示 toast，未触发 Tab 切换。`VideoGeneratePage.onMounted` 已正确读取 sessionStorage，但用户必须手动切换到视频 Tab 才能看到填入的提示词。修复方式：通过 Pinia store 或 emit 将 `App.vue` 的 `activeTab` 切换到 `'video'`。

**Gap 2 — PromptTemplatePanel 未接入 ImageGeneratePage（Phase 2 依赖）：** 03-04-PLAN 要求面板同时接入视频和图片生成页面，但 Phase 2 的 `ImageGeneratePage` 尚未实现，`App.vue` 也无图片生成 Tab。此 gap 根因在 Phase 2 未完成，Phase 3 本身的实现逻辑正确，待 Phase 2 完成后补充接入即可。

---

_Verified: 2026-03-20T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
