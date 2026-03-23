---
status: testing
phase: 03-视频生成与体验完善
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md, 03-06-SUMMARY.md]
started: 2026-03-22T02:15:00Z
updated: 2026-03-22T02:15:00Z
---

## Current Test

number: 1
name: 冷启动冒烟测试
expected: |
  关闭所有运行中的应用实例。清除临时状态(如有)。从头启动应用。
  应用正常启动,无错误,主窗口显示,视频生成页面作为默认页面加载成功。
awaiting: user response

## Tests

### 1. 冷启动冒烟测试
expected: 关闭所有运行中的应用实例。清除临时状态(如有)。从头启动应用。应用正常启动,无错误,主窗口显示,视频生成页面作为默认页面加载成功。
result: [pending]

### 2. 视频生成页面访问
expected: 应用启动后默认显示视频生成页面,底部 Tab Bar 显示"视频"和"设置"两个标签,"视频"标签处于选中状态。
result: [pending]

### 3. 视频参数表单
expected: 视频生成页面显示参数表单:时长滑块(5-10秒可调)、宽高比选择按钮(16:9/9:16/1:1)、模式选择(标准/专业/多镜头,多镜头有明显 amber 色 badge 标识)。
result: [pending]

### 4. 首帧/尾帧图片上传
expected: 点击"首帧图片"或"尾帧图片"上传按钮,选择图片后显示 64x64 缩略图预览,预览旁有清除按钮可移除图片。
result: [pending]

### 5. 提示词模板面板(视频)
expected: 视频生成页面提示词输入框下方有"从模板选择"按钮,点击后从底部弹出半屏模板面板,显示模板库和我的模板两个 Tab。
result: [pending]

### 6. 提示词模板选择
expected: 模板库 Tab 显示分类标签(风景/人物/动漫/建筑/抽象)横向滚动,点击分类显示对应模板,点击模板后提示词自动填入输入框,面板关闭。
result: [pending]

### 7. 视频任务提交
expected: 填写提示词和参数后点击"生成视频"按钮,任务卡片出现在页面下方,显示提示词、参数和"处理中"状态。
result: [pending]

### 8. 视频任务轮询
expected: 提交任务后,任务卡片状态自动更新(处理中→成功或失败),成功后显示视频封面缩略图。
result: [pending]

### 9. 视频播放
expected: 点击成功任务的封面缩略图,展开嵌入式视频播放器,显示播放/暂停控制和进度条,可正常播放视频。
result: [pending]

### 10. 历史记录页面
expected: 点击底部 Tab Bar 的"历史"标签,切换到历史记录页面,显示历史记录列表和"全部/已收藏"筛选按钮。
result: [pending]

### 11. 历史记录筛选
expected: 点击"全部"显示所有历史记录,点击"已收藏"只显示已收藏的记录,切换流畅无延迟。
result: [pending]

### 12. 历史记录左滑操作
expected: 在历史记录项上向左滑动,展开三个操作按钮:复用/收藏/删除,点击按钮执行对应操作,向右滑动或点击其他区域收起按钮。
result: [pending]

### 13. 复用提示词跳转
expected: 在历史记录页点击某条记录的"复用"按钮,自动跳转到视频生成页面(Tab 切换到"视频"),提示词输入框自动填入该历史记录的提示词。
result: [pending]

### 14. 图片生成页提示词模板
expected: 在图片生成页面(CreatePage),提示词输入框下方也有"从模板选择"按钮,点击后弹出相同的模板面板,选择模板后填入提示词。
result: [pending]

### 15. 自定义模板管理
expected: 提示词模板面板的"我的模板"Tab 显示自定义模板列表,可通过内联表单新增模板(输入标题和内容),可删除自定义模板(有二次确认),内置模板不可删除。
result: [pending]

## Summary

total: 15
passed: 0
issues: 0
pending: 15
skipped: 0

## Gaps

[none yet]
