# Pitfalls Research

**Domain:** Electron + Capacitor 移动应用，异步 AI API 轮询（即梦图片 + 可灵视频）
**Researched:** 2026-03-19
**Confidence:** MEDIUM（基于 API 文档 + 框架知识，无 WebSearch 验证）

---

## Critical Pitfalls

### Pitfall 1: 轮询 setInterval 未清理导致内存泄漏

**What goes wrong:**
用户提交任务后，`setInterval` 开始轮询。若用户切换页面、关闭任务卡片或应用进入后台，interval 仍在运行。多次提交任务后，同一 task_id 可能有多个 interval 并发轮询，最终导致内存泄漏和重复状态更新。

**Why it happens:**
开发者在组件 unmount 或页面切换时忘记调用 `clearInterval`。React/Vue 组件销毁时不会自动清理全局 timer。

**How to avoid:**
- 用 Map 管理所有活跃 interval：`activePolls: Map<taskId, intervalId>`
- 组件 unmount 时统一清理：`useEffect(() => () => clearAllPolls(), [])`
- 任务完成（done/failed/expired）时立即 `clearInterval`
- 设置最大轮询次数上限（如 120 次 × 5s = 10 分钟），超时后自动停止并标记任务为超时

**Warning signs:**
- 控制台出现重复的 API 请求日志
- 内存占用随时间线性增长
- 同一任务状态被更新多次

**Phase to address:** Phase 1（核心轮询机制搭建阶段）

---

### Pitfall 2: 可灵 JWT Token 在轮询中途过期

**What goes wrong:**
可灵 JWT 有效期为 30 分钟（`exp: now + 1800s`）。视频生成任务可能耗时 5-15 分钟，若 token 在任务提交后 30 分钟内过期，后续轮询查询接口会返回 `401 1004 Authorization已失效`，轮询中断，用户看到任务卡住。

**Why it happens:**
开发者在提交任务时生成一次 token，然后复用同一个 token 做所有后续轮询请求，没有检查 token 剩余有效期。

**How to avoid:**
- 每次轮询请求前检查 token 剩余有效期（`exp - now < 5min` 则重新生成）
- 或者每次轮询都重新生成 JWT（JWT 生成是纯本地计算，无网络开销，成本极低）
- 封装 `getValidToken()` 函数，内部做过期检查 + 自动刷新

**Warning signs:**
- 轮询在 25-30 分钟后突然停止
- 错误码 `1004` 出现在轮询日志中
- 长视频任务（15s 视频）比短任务更频繁失败

**Phase to address:** Phase 1（API 鉴权层实现阶段）

---

### Pitfall 3: Electron 主进程直接暴露 AK/SK 到渲染进程

**What goes wrong:**
为了方便，开发者将即梦的 `AccessKey`/`SecretKey` 或可灵的 `SecretKey` 直接传递给渲染进程（前端 JS），导致密钥可通过 DevTools 或打包后的 asar 文件被提取。

**Why it happens:**
HMAC 签名逻辑需要 SecretKey，开发者习惯在前端直接做签名计算，忽略了 Electron 的进程隔离边界。

**How to avoid:**
- 所有签名计算（即梦 HMAC-SHA256、可灵 JWT 生成）必须在 Electron 主进程完成
- 渲染进程通过 `ipcRenderer.invoke('sign-request', payload)` 请求签名
- 主进程通过 `ipcMain.handle('sign-request', ...)` 返回已签名的 headers
- 密钥存储在主进程内存或 Electron `safeStorage` 中，不写入 localStorage

**Warning signs:**
- 渲染进程 JS 文件中出现 `accessKey` 或 `secretKey` 变量
- 前端代码中有 `hmac` 或 `jwt.sign` 调用

**Phase to address:** Phase 1（安全架构设计阶段，必须在第一行 API 代码前确定）

---

### Pitfall 4: Capacitor 移动端 HTTP 请求被 CORS 或 App Transport Security 拦截

**What goes wrong:**
在 Capacitor iOS/Android WebView 中，直接从 JS 发起对 `visual.volcengineapi.com` 或 `api-beijing.klingai.com` 的请求，可能被 iOS ATS（App Transport Security）或 Android 网络安全策略拦截，或触发 CORS preflight 失败。

**Why it happens:**
Capacitor WebView 的网络安全策略比浏览器更严格。即梦 API 使用自定义 Header（`X-Date`, `X-Content-Sha256`, `Authorization`），这些非标准 Header 会触发 CORS preflight，而 API 服务器可能不返回正确的 `Access-Control-Allow-Headers`。

**How to avoid:**
- 在 Capacitor 中使用 `@capacitor-community/http` 插件或 Capacitor 原生 HTTP 插件，绕过 WebView CORS 限制
- 或者将所有 API 请求代理到 Electron 主进程（通过 IPC），由主进程的 Node.js 发起请求（Node.js 无 CORS 限制）
- iOS：在 `Info.plist` 中配置 `NSAppTransportSecurity` 允许目标域名
- Android：在 `network_security_config.xml` 中配置允许的域名

**Warning signs:**
- Electron 桌面端正常，Capacitor 移动端请求失败
- 控制台出现 `CORS policy` 或 `NSURLErrorDomain` 错误
- 请求在 preflight OPTIONS 阶段失败

**Phase to address:** Phase 2（Capacitor 集成阶段）

---

### Pitfall 5: 即梦 API 任务状态 `not_found` 被误判为错误

**What goes wrong:**
即梦查询接口返回 `status: "not_found"` 时，开发者将其当作网络错误或任务失败处理，触发错误提示或停止轮询。实际上 `not_found` 可能是任务刚提交后短暂的传播延迟（任务还未进入队列），或任务已过期（12小时后）。

**Why it happens:**
文档说明 `not_found` 原因是"无此任务或任务已过期(12小时)"，但开发者没有区分"刚提交的任务"和"已过期的任务"两种场景。

**How to avoid:**
- 提交任务后前 10 秒内收到 `not_found`，继续轮询（最多重试 3 次）
- 记录任务提交时间戳，若超过 12 小时收到 `not_found`，标记为已过期
- 状态机：`submitted → in_queue → generating → done/failed/expired/not_found`
- 注意文档要求：先判断外层 `code == 10000`，再判断 `data.status`

**Warning signs:**
- 任务提交后立即显示"任务不存在"错误
- 用户反馈任务刚提交就失败

**Phase to address:** Phase 1（轮询状态机实现阶段）

---

### Pitfall 6: 移动端应用进入后台时轮询被系统挂起

**What goes wrong:**
iOS/Android 对后台 JS 执行有严格限制。用户切换到其他 App 后，Capacitor WebView 中的 `setInterval` 轮询会被系统暂停或降频，导致任务完成后用户回到 App 时状态没有更新，需要手动刷新。

**Why it happens:**
Capacitor 应用本质是 WebView，受移动端后台执行限制约束。iOS 尤其激进，后台 JS 执行通常在 30 秒内被暂停。

**How to avoid:**
- 监听 Capacitor `App.addListener('appStateChange', ...)` 事件
- 应用从后台恢复（`isActive: true`）时，立即对所有 `in_queue/generating` 状态的任务触发一次查询
- 不依赖轮询的连续性，而是依赖"恢复时补查"策略
- 可选：使用 Capacitor 本地通知，在任务完成时（通过 callback_url 或恢复时查询）通知用户

**Warning signs:**
- 用户反馈"任务一直在转圈，回来后还没完成"
- 后台超过 2 分钟后任务状态不更新

**Phase to address:** Phase 2（移动端适配阶段）

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 渲染进程直接调用 API（跳过 IPC） | 开发快，代码简单 | 密钥暴露，移动端 CORS 问题，难以统一错误处理 | 永不可接受 |
| 硬编码轮询间隔（固定 3s） | 简单 | 视频任务（5-15min）浪费大量请求配额，触发 QPS 限制 | MVP 阶段可接受，后续需指数退避 |
| localStorage 存储历史记录 | 零依赖 | Capacitor 移动端 localStorage 容量有限（5-10MB），大量 base64 图片会溢出 | 仅存储元数据可接受，图片/视频不存 base64 |
| 单一全局 token（不刷新） | 代码简单 | 可灵 JWT 30min 过期，长任务轮询中断 | 永不可接受 |
| 不区分即梦 base64 和 URL 返回模式 | 少一个参数 | base64 图片无法直接在移动端 `<img>` 标签显示，需转换；URL 有 24h 有效期 | 永不可接受，必须明确选择 return_url=true |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| 即梦 HMAC 签名 | 签名时 `x-date` 时间戳与实际请求时间不一致（时钟偏差） | 签名和发请求必须在同一时刻，不能缓存签名 header |
| 即梦查询接口 | 先判断 `data.status` 再判断外层 `code` | 文档明确要求：先判断 `code == 10000`，否则解析 data 可能 panic |
| 可灵 JWT | `nbf`（生效时间）设为 `now`，导致服务端时钟偏差拒绝请求 | 设 `nbf: now - 5`（提前 5 秒生效），文档示例已说明 |
| 可灵视频 URL | 直接存储 URL 到历史记录 | URL 30 天后失效，需提示用户及时下载，或在展示时检查 `updated_at` |
| 即梦图片 URL | 直接存储 URL 到历史记录 | URL 仅 24 小时有效，必须在任务完成后立即下载到本地 |
| 可灵 callback_url | 忽略此参数 | 移动端可用 callback_url 替代轮询，避免后台挂起问题（需要服务端中转） |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 固定 3s 轮询间隔 | 视频任务（5-15min）产生 100-300 次无效请求 | 指数退避：前 10 次 3s，之后 10s，再之后 30s | 并发 3+ 个视频任务时触发 QPS 限制（即梦 50429/50430） |
| 轮询结果存 base64 到内存 | 内存占用飙升，App 被系统杀死 | 任务完成后立即写入 Capacitor Filesystem，清空内存中的 base64 | 单张 4K 图片 base64 约 30-50MB |
| 并发提交多个视频任务 | 触发可灵 1302/1303 并发限制 | 实现任务队列，限制同时 in-flight 的视频任务数（建议 ≤ 2） | 3+ 个并发视频任务时 |
| 每次轮询都重新渲染整个历史列表 | 列表闪烁，性能下降 | 只更新变化的任务项（key-based diff） | 历史记录超过 20 条时明显 |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| AK/SK 写入前端 JS 或 localStorage | 用户可通过 DevTools 或 asar 解包提取密钥 | 密钥只存主进程内存，使用 Electron `safeStorage` 加密存储 |
| 即梦 HMAC 签名在渲染进程计算 | SecretKey 暴露在渲染进程 JS 上下文 | 签名逻辑移至主进程，通过 IPC 通信 |
| 可灵 JWT 在渲染进程生成 | SecretKey 暴露 | 同上，JWT 生成在主进程 |
| 不验证 API 响应的 HTTPS 证书 | 中间人攻击 | Electron 默认验证证书，不要设置 `rejectUnauthorized: false` |
| 将用户 prompt 直接拼接到签名字符串 | 注入攻击影响签名 | 对 prompt 做 JSON 序列化后再放入 body，不做字符串拼接 |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 不显示任务预计剩余时间 | 用户不知道要等多久，焦虑 | 图片任务提示"约 30-60 秒"，视频任务提示"约 3-10 分钟" |
| 任务失败只显示错误码 | 用户不知道如何处理 | 将 API 错误码映射为用户友好提示（如 50412 → "提示词包含敏感内容，请修改后重试"） |
| 即梦图片 URL 24h 过期后历史记录显示空白 | 用户困惑，以为 App 有 bug | 任务完成后立即下载图片到本地，历史记录展示本地文件 |
| 轮询期间无法取消任务 | 用户误操作后无法撤回，浪费 API 配额 | 提供取消按钮，取消时停止轮询（API 本身不支持取消，但可停止查询） |
| 内容审核失败（50411/50412）无明确提示 | 用户反复提交相同 prompt，持续失败 | 检测到审核失败错误码时，高亮提示并建议修改 prompt |

---

## "Looks Done But Isn't" Checklist

- [ ] **轮询清理:** 组件销毁/页面切换时所有 interval 是否被清理 — 验证：在任务进行中切换页面，检查网络请求是否停止
- [ ] **JWT 刷新:** 提交任务 29 分钟后轮询是否仍正常 — 验证：手动设置 token exp 为 2 分钟，观察轮询是否自动刷新
- [ ] **图片本地化:** 任务完成后图片是否已下载到本地（而非只存 URL）— 验证：断网后历史记录图片是否仍可显示
- [ ] **移动端后台恢复:** App 后台 5 分钟后恢复，任务状态是否正确更新 — 验证：提交任务后切换 App，等待完成，回来检查状态
- [ ] **CORS 移动端:** Capacitor iOS/Android 上 API 请求是否正常（不只测 Electron）— 验证：在真机上运行并提交任务
- [ ] **错误码覆盖:** 所有 API 错误码是否有对应的用户提示 — 验证：模拟 50412、50429、1004 等错误码的响应

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 轮询内存泄漏 | MEDIUM | 重构为集中式 PollManager 单例，统一管理所有 interval |
| JWT 过期中断轮询 | LOW | 在 API 请求拦截器中统一处理 401 1004，自动刷新 token 并重试 |
| 图片 URL 过期（历史记录空白） | HIGH | 需要重新提交任务，或从 API 重新查询（任务 12h 后过期则无法恢复） |
| 移动端 CORS 问题 | MEDIUM | 将所有 API 请求迁移到 Capacitor HTTP 插件或 IPC 代理 |
| 密钥暴露 | HIGH | 立即轮换 AK/SK，重构签名逻辑到主进程，审计所有历史提交 |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 轮询内存泄漏 | Phase 1（轮询机制） | 提交 5 个任务后切换页面，确认网络请求停止 |
| JWT 过期中断轮询 | Phase 1（API 鉴权层） | 设置短 exp 测试自动刷新 |
| AK/SK 暴露到渲染进程 | Phase 1（安全架构，最优先） | 渲染进程 JS 中搜索 `secretKey`/`accessKey` |
| Capacitor CORS 拦截 | Phase 2（Capacitor 集成） | 真机测试 API 请求 |
| 即梦 not_found 误判 | Phase 1（状态机实现） | 提交任务后立即查询，验证不报错 |
| 移动端后台轮询挂起 | Phase 2（移动端适配） | 后台 5 分钟后恢复，验证状态更新 |
| 图片 URL 24h 过期 | Phase 1（任务完成处理） | 任务完成后 25h 检查历史记录图片是否可显示 |
| 内容审核失败无提示 | Phase 1（错误处理层） | 模拟 50412 响应，验证用户提示 |

---

## Sources

- 即梦 API 文档（docs/即梦.md）：任务状态枚举、错误码、查询接口说明
- 可灵 API 文档（docs/可灵.md）：JWT 鉴权规范（exp=now+1800, nbf=now-5）、错误码 1003/1004
- PROJECT.md：技术栈约束（Electron + Capacitor，本地轮询 setInterval）
- Electron 安全最佳实践（训练数据，MEDIUM confidence）：主/渲染进程隔离、safeStorage
- Capacitor 网络请求限制（训练数据，MEDIUM confidence）：WebView CORS、iOS ATS、后台执行限制

---
*Pitfalls research for: Electron + Capacitor AI 生图/生视频应用（即梦 + 可灵）*
*Researched: 2026-03-19*
