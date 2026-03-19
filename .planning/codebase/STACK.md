# 技术栈

**分析日期:** 2026-03-19

## 语言

**主要:**
- JavaScript (ES6+) - 主进程和渲染进程

## 运行时

**环境:**
- Node.js (通过 Electron 包含)

**包管理器:**
- npm
- 锁文件: 存在 (package-lock.json)

## 框架

**核心:**
- Electron 41.0.3 - 跨平台桌面应用框架

**开发工具:**
- 无额外构建工具配置

## 关键依赖

**生产:**
- electron 41.0.3 - 桌面应用运行时和开发依赖

**开发:**
- 仅 Electron 作为 devDependency

## 配置

**环境:**
- 无环境变量配置文件
- 无 .env 文件

**构建:**
- 无构建配置文件 (webpack, vite, rollup 等)
- 直接使用 Electron 原生加载

## 平台要求

**开发:**
- Node.js 环境
- npm 包管理器
- 支持平台: Windows, macOS, Linux (通过 Electron)

**生产:**
- Electron 运行时 (41.0.3)
- 操作系统: Windows, macOS, Linux

## 应用入口

**主进程:**
- `main.js` - Electron 主进程入口

**渲染进程:**
- `index.html` - 应用 UI 入口

---

*技术栈分析: 2026-03-19*
