# Requirements: 灵览 AI 创作工具

**Defined:** 2026-03-19
**Core Value:** 用户能够通过提示词模板或自由输入，快速发起 AI 生图/生视频任务，并在任务完成后查看、下载结果。

## v1 Requirements

### Configuration（配置）

- [x] **CONF-01**: 用户可以在设置页面输入并保存即梦 AK/SK
- [x] **CONF-02**: 用户可以在设置页面输入并保存可灵 AK/SK
- [x] **CONF-03**: 用户可以在设置页面查看当前已配置的密钥状态（已配置/未配置，不显示明文）

### Image Generation（生图）

- [x] **IMG-01**: 用户可以通过文字提示词发起生图任务（文生图）
- [x] **IMG-02**: 用户可以上传参考图片并结合提示词发起生图任务（图生图）
- [x] **IMG-03**: 用户可以配置图片参数（宽度、高度、宽高比）
- [x] **IMG-04**: 用户可以配置 force_single 强制单图输出

### Video Generation（生视频）

- [ ] **VID-01**: 用户可以通过文字提示词发起生视频任务（文生视频）
- [ ] **VID-02**: 用户可以上传首帧/尾帧图片控制视频内容
- [ ] **VID-03**: 用户可以配置视频参数（时长 3-15s、宽高比 16:9/9:16/1:1、模式 std/pro）
- [ ] **VID-04**: 用户可以使用多镜头模式（multi_shot）生成视频

### Task Management（任务管理）

- [x] **TASK-01**: 用户可以实时查看任务状态（已提交/处理中/成功/失败）
- [x] **TASK-02**: 系统支持多个任务并行执行，轮询直到所有任务完成
- [x] **TASK-03**: 用户可以对失败的任务发起重试
- [x] **TASK-04**: 用户可以取消进行中的任务（停止轮询）

### Results（结果展示）

- [ ] **RES-01**: 用户可以预览生成的图片（在线展示）
- [ ] **RES-02**: 用户可以预览生成的视频（在线播放）
- [ ] **RES-03**: 用户可以将生成的图片/视频下载到本地
- [ ] **RES-04**: 用户可以分享生成结果的链接

### History（历史记录）

- [ ] **HIST-01**: 用户可以查看历史生成记录列表（本地持久化）
- [ ] **HIST-02**: 用户可以从历史记录中复用提示词重新发起任务
- [ ] **HIST-03**: 用户可以收藏历史记录中的结果
- [ ] **HIST-04**: 用户可以删除历史记录

### Prompt UX（提示词体验）

- [ ] **PROMPT-01**: 用户可以从内置提示词模板库选择模板
- [ ] **PROMPT-02**: 用户可以自由输入提示词
- [ ] **PROMPT-03**: 用户可以保存自定义提示词模板

### Mobile（移动端）

- [ ] **MOB-01**: 应用可打包为 iOS 原生应用（通过 Capacitor）
- [ ] **MOB-02**: 应用可打包为 Android 原生应用（通过 Capacitor）

### Design Docs（设计文档）

- [x] **DOC-01**: 生成 UI 设计文档（docs/UI设计文档.md）
- [x] **DOC-02**: 生成技术设计文档（docs/技术设计文档.md）

## v2 Requirements

### Advanced Features

- **ADV-01**: 可灵视频参考主体库（element_list）
- **ADV-02**: 视频参考视频（video_list）
- **ADV-03**: 批量生成任务
- **ADV-04**: 云端同步历史记录

### Social

- **SOC-01**: 用户账号系统
- **SOC-02**: 社区分享广场

## Out of Scope

| Feature | Reason |
|---------|--------|
| 用户账号/登录 | 初版本地化，无需后端 |
| 云端同步 | 本地存储即可满足 v1 需求 |
| 实时流式生成 | API 本身为异步模式，不支持流式 |
| 视频编辑功能 | 超出 v1 范围 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONF-01 ~ CONF-03 | Phase 1 | Pending |
| DOC-01 ~ DOC-02 | Phase 1 | Pending |
| IMG-01 ~ IMG-04 | Phase 2 | Pending |
| TASK-01 ~ TASK-04 | Phase 2 | Pending |
| RES-01 ~ RES-04 | Phase 2 | Pending |
| VID-01 ~ VID-04 | Phase 3 | Pending |
| HIST-01 ~ HIST-04 | Phase 3 | Pending |
| PROMPT-01 ~ PROMPT-03 | Phase 3 | Pending |
| MOB-01 ~ MOB-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-20 after roadmap creation*
