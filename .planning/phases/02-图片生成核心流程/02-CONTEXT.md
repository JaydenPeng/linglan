# Phase 2: 图片生成核心流程 - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

用户提交文生图/图生图任务，实时查看任务状态，并预览和下载生成结果，支持分享图片链接。
视频生成、历史记录、提示词模板库属于后续阶段，不在本阶段范围内。

</domain>

<decisions>
## Implementation Decisions

### 任务提交界面
- 单页面 + Tab 切换，顶部 Tab 区分文生图/图生图，减少导航层级
- 提示词输入框：多行自动拉伸，高度随内容增长
- 参数配置区域（宽高比、force_single）默认折叠，用户展开后配置
- 图生图模式下，参考图上传为点击区域交互，选图后显示缩略图预览
- 提交后自动跳转到任务列表页

### 任务列表与状态
- 卡片列表布局，每张卡片显示：提示词预览、状态标签、时间、缩略图（成功后）
- 处理中任务：卡片内嵌进度条动画 + 状态文字（已提交/处理中/成功/失败）显示在卡片右上角
- 失败任务：卡片内直接显示"重试"按钮
- 处理中任务：卡片内直接显示"取消"按钮
- 无需长按菜单或更多按钮，操作直接可见

### 图片预览与下载
- 点击卡片缩略图后全屏模态框展示原图
- 同一任务多张图支持左右滑动切换
- 下载入口在全屏预览界面内，点击下载按钮保存到本地相册
- 下载成功后显示 Toast 提示"已保存到相册"

### 分享功能
- 分享按钮在全屏预览界面内，与下载按钮并列
- 点击分享弹出选项面板，包含三个选项：
  1. 复制图片链接（复制即梦 API 返回的图片 URL）
  2. 保存到相册
  3. 系统分享（调用 iOS/Android 原生分享面板）

### Claude's Discretion
- 卡片具体间距和圆角样式
- 进度条动画实现细节
- 模态框关闭手势（下滑/点击背景）
- Toast 显示时长和位置

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- 无现有 src/ 代码（Phase 1 尚未执行）
- Phase 1 将建立：electron-vite + Vue 3 + Pinia + Ionic Vue 骨架、IPC 通信层、contextBridge

### Established Patterns
- 所有 API 调用在 Electron 主进程，渲染进程通过 IPC 通信（安全红线，密钥不进渲染进程）
- 即梦 API 为异步轮询模式：提交任务 → 轮询 CVSync2AsyncGetResult → 直到完成
- 状态管理使用 Pinia
- UI 组件使用 Ionic Vue（移动端适配）

### Integration Points
- 任务状态轮询：主进程 setInterval 轮询，通过 IPC 推送状态更新到渲染进程
- 图片下载：Capacitor Filesystem API 保存到本地相册
- 系统分享：Capacitor Share API 调用原生分享面板
- 参考图上传（图生图）：Capacitor Camera/FilePicker 选取图片，转 base64 后通过 IPC 传给主进程

</code_context>

<specifics>
## Specific Ideas

- 即梦 API 注意事项：return_url 参数必须设置为 true，否则返回 base64 数据（STATE.md 中已记录）
- 分享的"图片链接"即即梦 API 返回的图片 URL，本身是公开可访问的链接

</specifics>

<deferred>
## Deferred Ideas

- 视频生成任务 — Phase 3
- 历史记录持久化 — Phase 3
- 提示词模板库 — Phase 3

</deferred>

---

*Phase: 02-图片生成核心流程*
*Context gathered: 2026-03-20*
