# Feature Research

**Domain:** AI 生图/生视频移动应用
**Researched:** 2026-03-19
**Confidence:** HIGH（基于即梦/可灵 API 文档 + 项目 PROJECT.md 直接分析）

## Feature Landscape

### Table Stakes（用户默认期待，缺失即感觉残缺）

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 自由文本 Prompt 输入 | AI 生成工具的核心入口 | LOW | 支持中英文，即梦限 800 字符，可灵限 2500 字符 |
| 宽高比选择 | 用户需要控制输出尺寸 | LOW | 图片：1:1/4:3/3:2/16:9/21:9；视频：16:9/9:16/1:1 |
| 任务提交与状态轮询 | API 为异步模式，必须有等待反馈 | MEDIUM | 即梦轮询 CVSync2AsyncGetResult；可灵轮询 /v1/videos/omni-video/{id} |
| 任务进度展示 | 用户需要知道任务在跑 | LOW | 状态：submitted → processing → done/failed |
| 生成结果预览 | 生成完成后必须能看到 | LOW | 图片直接展示；视频需要播放器 |
| 结果下载到本地 | 用户需要保存作品 | LOW | 注意可灵视频 URL 30 天后失效，需及时转存 |
| 历史记录列表 | 用户需要回看之前的作品 | MEDIUM | 本地持久化，Capacitor Filesystem / localStorage |
| 任务失败提示 | 生成失败需要告知原因 | LOW | 即梦有内容审核错误码；可灵有 task_status_msg |
| 图片/视频模式切换 | 两种生成类型需要明确区分 | LOW | 对应不同 API 和参数集 |

### Differentiators（竞争优势，非必须但有价值）

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Prompt 模板库 | 降低新用户门槛，快速出好图 | MEDIUM | 预置分类模板（风格/场景/人物），用户选择后填充输入框 |
| Prompt 历史复用 | 用户常用同类 prompt，减少重复输入 | LOW | 从历史记录中提取 prompt，一键填入 |
| 参考图上传（图生图） | 即梦支持最多 10 张参考图，大幅提升可控性 | MEDIUM | 需要图片选择器 + 上传逻辑；scale 参数控制参考强度 |
| 视频首尾帧控制 | 可灵支持首帧/尾帧图片，精确控制视频起止画面 | HIGH | 需要区分 first_frame/end_frame 类型上传 |
| 模型选择 | 可灵有 kling-video-o1 和 kling-v3-omni 两个模型 | LOW | 简单下拉选择，说明各模型特点 |
| 生成模式选择（std/pro） | 可灵 std 性价比高，pro 高品质，用户按需选择 | LOW | 影响生成质量和费用 |
| 视频时长选择 | 可灵支持 3~15 秒，用户按场景选择 | LOW | 枚举选择器，默认 5 秒 |
| 收藏/标记功能 | 从大量历史中快速找到满意作品 | LOW | 本地标记，历史列表过滤 |
| 多镜头视频（multi_shot） | 可灵独有功能，生成叙事性多段视频 | HIGH | 需要分镜 prompt 编辑器，复杂度高 |

### Anti-Features（看似合理，实则有问题）

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 用户账号/登录系统 | 云端同步、多设备访问 | 初版增加后端复杂度，延迟上线；PROJECT.md 明确排除 | 本地持久化，v2 再考虑云同步 |
| 实时流式生成预览 | 用户希望看到生成过程 | API 本身为异步模式，不支持流式；轮询间隔无法模拟流式 | 清晰的进度状态 + 完成后展示 |
| 批量并发提交（大量任务） | 用户想一次生成多张 | 即梦有 QPS/并发限制（50429/50430），可灵有 1302/1303 限流 | 单次提交，队列串行处理 |
| 社区分享/发布功能 | 用户想展示作品 | 需要后端、内容审核、社区治理，复杂度极高 | 支持下载后用户自行分享 |
| 参数精细调节（scale 小数输入） | 高级用户想精确控制 | 移动端小数输入体验差，大多数用户不理解参数含义 | 预设档位（低/中/高），映射到具体数值 |
| 云端历史同步 | 多设备访问历史 | 需要后端存储，PROJECT.md 明确排除 | 本地持久化，导出/导入文件 |

## Feature Dependencies

```
[Prompt 输入]
    └──requires──> [任务提交]
                       └──requires──> [状态轮询]
                                          └──requires──> [结果预览]
                                                             └──enhances──> [结果下载]
                                                             └──enhances──> [历史记录]

[参考图上传]
    └──enhances──> [Prompt 输入]（图生图场景）

[视频首尾帧控制]
    └──requires──> [参考图上传]

[Prompt 模板库]
    └──enhances──> [Prompt 输入]

[Prompt 历史复用]
    └──requires──> [历史记录]

[收藏功能]
    └──requires──> [历史记录]

[模型选择]
    └──enhances──> [任务提交]（视频模式）

[多镜头视频]
    └──requires──> [视频时长选择]
    └──conflicts──> [视频首尾帧控制]（multi_shot=true 时不支持首尾帧）
```

### Dependency Notes

- **状态轮询 requires 任务提交：** 没有 task_id 就无法轮询，两者必须同相
- **视频首尾帧 requires 参考图上传：** 首尾帧本质是带 type 标记的参考图，复用同一上传组件
- **Prompt 历史复用 requires 历史记录：** 历史记录是 prompt 复用的数据源
- **多镜头视频 conflicts 首尾帧：** 可灵 API 明确：multi_shot=true 时不支持首尾帧生成

## MVP Definition

### Launch With（v1）

最小可验证产品——验证核心价值：用户能发起任务并看到结果。

- [ ] 自由文本 Prompt 输入 — 核心交互入口
- [ ] 图片/视频模式切换 — 两个 API 的入口分离
- [ ] 宽高比选择（图片）/ 宽高比 + 时长选择（视频） — 最基础的参数控制
- [ ] 任务提交 + 状态轮询 — API 异步模式的必要实现
- [ ] 任务进度展示（submitted/processing/done/failed） — 用户等待期间的反馈
- [ ] 生成结果预览（图片展示 + 视频播放） — 核心价值交付
- [ ] 结果下载到本地 — 用户留存作品
- [ ] 历史记录列表（本地持久化） — 回看之前作品
- [ ] 任务失败提示（含错误原因） — 基础容错体验

### Add After Validation（v1.x）

核心跑通后，提升体验的功能。

- [ ] Prompt 历史复用 — 用户开始重复使用时自然需要
- [ ] 参考图上传（图生图） — 验证用户对可控性的需求
- [ ] 模型选择（可灵 o1 vs v3-omni） — 用户开始关注质量差异时
- [ ] 收藏/标记功能 — 历史记录积累到一定量后需要过滤

### Future Consideration（v2+）

等产品方向验证后再考虑。

- [ ] Prompt 模板库 — 需要运营维护模板内容，成本较高
- [ ] 视频首尾帧控制 — 高级功能，先验证基础生成需求
- [ ] 多镜头视频 — 复杂度高，需要专门的分镜编辑 UI
- [ ] 生成模式选择（std/pro） — 涉及费用差异，需要先明确计费策略

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Prompt 输入 | HIGH | LOW | P1 |
| 任务提交 + 轮询 | HIGH | MEDIUM | P1 |
| 任务进度展示 | HIGH | LOW | P1 |
| 结果预览 | HIGH | LOW | P1 |
| 结果下载 | HIGH | LOW | P1 |
| 历史记录 | HIGH | MEDIUM | P1 |
| 图片/视频模式切换 | HIGH | LOW | P1 |
| 宽高比选择 | MEDIUM | LOW | P1 |
| 任务失败提示 | MEDIUM | LOW | P1 |
| Prompt 历史复用 | MEDIUM | LOW | P2 |
| 参考图上传 | MEDIUM | MEDIUM | P2 |
| 收藏功能 | MEDIUM | LOW | P2 |
| 模型选择 | LOW | LOW | P2 |
| 视频时长选择 | MEDIUM | LOW | P2 |
| Prompt 模板库 | MEDIUM | HIGH | P3 |
| 视频首尾帧控制 | LOW | HIGH | P3 |
| 多镜头视频 | LOW | HIGH | P3 |

**Priority key:**
- P1: 必须在 v1 上线
- P2: 应该有，v1.x 补充
- P3: 锦上添花，v2+ 考虑

## Competitor Feature Analysis

| Feature | 即梦（Jimeng） | 可灵（Kling） | 灵览（Our Approach） |
|---------|--------------|--------------|---------------------|
| 文生图 | 支持，jimeng_t2i_v40 | 不适用 | v1 支持 |
| 文生视频 | 不适用 | 支持，omni-video | v1 支持 |
| 参考图输入 | 支持最多 10 张 | 支持最多 7 张 | v1.x 支持 |
| 宽高比控制 | 支持多种预设 | 16:9/9:16/1:1 | v1 支持 |
| 视频时长 | 不适用 | 3~15 秒 | v1 支持 |
| 首尾帧控制 | 不适用 | 支持 | v2+ 考虑 |
| 多镜头 | 不适用 | 支持最多 6 分镜 | v2+ 考虑 |
| 水印控制 | 支持（可选） | 支持（可选） | 跟随 API 默认值 |
| 内容审核 | 自动（前/后审） | 自动（内容安全策略） | 展示 API 返回的错误原因 |

## Sources

- `docs/即梦.md` — 即梦 jimeng_t2i_v40 API 文档（火山引擎视觉服务）
- `docs/可灵.md` — 可灵 Omni-Video API 文档（kling AI）
- `.planning/PROJECT.md` — 项目需求与约束定义

---
*Feature research for: AI 生图/生视频移动应用（灵览）*
*Researched: 2026-03-19*
