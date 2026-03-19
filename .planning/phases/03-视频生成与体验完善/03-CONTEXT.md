# Phase 3: 视频生成与体验完善 - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

扩展可灵 Omni-Video API 的文生视频能力（文生视频、首尾帧控制、多镜头模式），补充历史记录本地持久化，以及提示词模板库（内置模板 + 自定义模板）。视频任务的提交、轮询、状态管理复用 Phase 2 建立的任务管理架构。

</domain>

<decisions>
## Implementation Decisions

### 视频参数表单布局
- 全部参数平铺展示，不折叠高级选项
- 首帧/尾帧图片上传：点击上传按钮，选完后显示缩略图预览
- 模式选择：std/pro 用文字标签切换，multi_shot 单独标识（加"多镜头"标记），让用户明白它是不同类型
- 时长（3-15s）用 Ionic Range 滑块控件
- 宽高比（16:9/9:16/1:1）用图标按钮组

### 历史记录展示
- 图片和视频混合在同一列表，按时间倒序
- 每条记录显示：缩略图/视频封面、提示词预览、时间、状态
- 操作触发方式：左滑展开操作按钮（复用提示词、收藏、删除）
- 收藏筛选：顶部"全部"/"已收藏"切换按钮

### 提示词模板库
- 入口：提示词输入框下方的模板快捷入口，点击展开底部半屏面板
- 分类浏览：按风格分组（如风景、人物、动漫等），顶部横向标签切换
- 选择模板：点击直接填入提示词输入框，面板自动关闭
- 自定义模板管理：面板内"我的模板" Tab，支持查看、编辑、删除

### 视频播放体验
- 播放位置：任务卡片内嵌入播放器（不跳转页面）
- 任务完成前：卡片内显示视频封面图
- 任务完成后：点击封面展开嵌入播放器
- 播放控制：自动循环播放 + 进度条 + 暂停按钮
- 下载入口：卡片内下载按钮，与 Phase 2 图片下载保持一致

### Claude's Discretion
- 视频生成页面与图片生成页面的导航结构（Tab 切换还是独立页面）
- 历史记录的本地存储格式（Pinia persist + localStorage）
- 内置模板的具体内容和数量
- 加载骨架屏设计
- 错误状态处理

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 2 任务管理架构（提交任务、轮询、状态更新）：视频任务直接复用，仅需新增可灵 API 的 IPC handler
- Phase 2 图片下载逻辑：视频下载复用相同模式
- Phase 2 历史记录存储（如已实现）：扩展支持视频类型

### Established Patterns
- 主进程处理 API 调用和轮询，渲染进程通过 IPC 通信（密钥不进入渲染进程）
- Vue 3 + Pinia 状态管理
- Ionic Vue 组件库（IonRange、IonSegment 等可直接用于参数控件）

### Integration Points
- 可灵 API：POST /v1/videos/omni-video 提交，GET /v1/videos/omni-video/{id} 轮询
- JWT 鉴权（jose，Phase 1 已实现）
- 历史记录持久化：Pinia persist plugin + localStorage

</code_context>

<specifics>
## Specific Ideas

- 模式选择中 multi_shot 需要单独标识，避免用户误以为只是另一个质量档位
- 历史记录左滑操作是移动端标准手势，与 Ionic 的 IonItemSliding 组件天然契合

</specifics>

<deferred>
## Deferred Ideas

- 视频参考主体库（element_list）— v2 ADV-01
- 视频参考视频（video_list）— v2 ADV-02
- 历史记录云端同步 — v2 ADV-04

</deferred>

---

*Phase: 03-视频生成与体验完善*
*Context gathered: 2026-03-20*
