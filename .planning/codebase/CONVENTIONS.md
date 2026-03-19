# 代码规范

**分析日期:** 2026-03-19

## 命名规范

**文件:**
- 主入口文件: `main.js` (Electron主进程)
- HTML文件: `index.html` (渲染进程)
- 使用小写字母和下划线分隔

**函数:**
- 使用驼峰命名法 (camelCase)
- 示例: `createWindow()` 在 `main.js` 中

**变量:**
- 使用驼峰命名法 (camelCase)
- 示例: `win` 用于BrowserWindow实例

**类型/对象:**
- 使用PascalCase表示类和构造函数
- 示例: `BrowserWindow` (来自Electron)

## 代码风格

**格式化:**
- 未配置专门的格式化工具 (Prettier/ESLint)
- 使用2空格缩进 (观察自 `main.js`)
- 分号结尾

**Linting:**
- 未检测到ESLint配置
- 无自动代码检查

## 导入组织

**顺序:**
1. Node.js/Electron核心模块 (如 `require('electron')`)
2. 本地模块

**路径别名:**
- 未使用路径别名

## 错误处理

**模式:**
- 当前代码中未实现显式错误处理
- 使用Promise链处理异步操作 (`.then()`)
- 示例: `app.whenReady().then(() => { createWindow() })` 在 `main.js` 中

## 日志

**框架:** 未使用专门的日志库

**模式:**
- 未观察到日志记录

## 注释

**何时注释:**
- 当前代码中未使用注释
- 建议为复杂逻辑添加注释

**JSDoc/TSDoc:**
- 未使用

## 函数设计

**大小:**
- 函数保持简洁 (如 `createWindow()` 仅3行)

**参数:**
- 最小化参数数量

**返回值:**
- 函数通常不返回值,而是执行副作用

## 模块设计

**导出:**
- 使用CommonJS `require()` 语法
- 示例: `const { app, BrowserWindow } = require('electron')`

**Barrel文件:**
- 未使用

---

*规范分析: 2026-03-19*
