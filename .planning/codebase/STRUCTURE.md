# 代码库结构

**分析日期：** 2026-03-19

## 目录布局

```
linglan/
├── main.js              # Electron 主进程入口
├── index.html           # 应用 UI 入口
├── package.json         # 项目配置和依赖
├── docs/                # 文档目录
│   ├── 可灵.md          # Omni-Video API 文档
│   └── 即梦.md          # 图片生成 API 文档
├── node_modules/        # 依赖包（生成）
└── .planning/           # 规划文档目录
    └── codebase/        # 代码库分析文档
```

## 目录用途

**根目录：**
- 目的：项目配置和应用入口
- 包含：主进程文件、HTML 入口、包管理配置
- 关键文件：`main.js`、`index.html`、`package.json`

**docs 目录：**
- 目的：API 文档和参考资料
- 包含：外部服务 API 文档（Kling AI 视频生成、火山引擎图片生成）
- 关键文件：`可灵.md`（视频 API）、`即梦.md`（图片 API）

**node_modules 目录：**
- 目的：项目依赖存储
- 包含：npm 包
- 生成：是
- 提交：否

**.planning 目录：**
- 目的：项目规划和分析文档
- 包含：架构、结构、约定等分析文档
- 生成：是
- 提交：是

## 关键文件位置

**入口点：**
- `main.js`：Electron 应用主进程，应用启动时执行
- `index.html`：应用 UI 入口，由主进程加载

**配置：**
- `package.json`：项目元数据、依赖声明、npm 脚本

**核心逻辑：**
- `main.js`：窗口创建、应用生命周期管理

**测试：**
- 无测试文件

## 命名约定

**文件：**
- 主进程：`main.js`（Electron 约定）
- HTML：`index.html`（Web 约定）
- 配置：`package.json`（npm 约定）
- 文档：`*.md`（Markdown 格式）

**目录：**
- 文档：`docs/`（小写）
- 规划：`.planning/`（隐藏目录，小写）
- 依赖：`node_modules/`（npm 约定）

## 新增代码位置指南

**新功能：**
- 主进程逻辑：`main.js`
- UI 组件：`index.html`
- 如需模块化，创建 `src/` 目录结构

**新模块/组件：**
- 实现：`src/[module-name]/index.js`
- 建议创建 `src/` 目录以组织代码

**工具函数：**
- 共享辅助函数：`src/utils/`

## 特殊目录

**.planning 目录：**
- 目的：存储代码库分析和规划文档
- 生成：由 GSD 工具生成
- 提交：是

**docs 目录：**
- 目的：存储 API 文档和参考资料
- 包含：外部服务文档
- 提交：是

---

*结构分析：2026-03-19*
