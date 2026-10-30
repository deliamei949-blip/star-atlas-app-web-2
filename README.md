# Star Atlas · Web Demo

把原来的 macOS 桌面版 Star Atlas 调整为可以直接在浏览器体验的交互 Demo。

## 在线体验

部署到 GitHub Pages 后，把地址替换到这里：

```text
https://<你的 GitHub 用户名>.github.io/<仓库名>/
```

## 当前可体验的功能

- 3D 星图旋转、缩放与漫游
- 浏览器内捕获星光
- 演示版 AI 点燃知识卡片
- 查看卡片正面与知识内核
- 建立四种知识关系并自动升级星座
- 语义概念搜索及相似知识提示
- 黑洞谜题与关联知识
- 脉冲日志与推演内容
- 浏览器本地持久化

## 浏览器版与原桌面版的区别

原始版本使用 Electron、系统快捷键、本地 SQLite 和真实 AI 接口。网页版为了能够直接部署到 GitHub Pages，做了以下替换：

- 使用 `localStorage` 保存演示数据
- 使用内置演示 AI 生成知识内核
- 使用轻量语义匹配实现概念搜索和脉冲日志分发
- 使用页面内捕获按钮和 `⌘⇧K` 打开捕获界面
- 不连接真实模型，不需要 API Key，不会上传输入内容

因此它适合展示完整产品流程和交互，但不能替代正式版本的 AI 能力。

## 本地运行

需要 Node.js 18 或以上版本。

```bash
npm install
npm run dev
```

打开终端中显示的本地地址，通常是：

```text
http://localhost:5173
```

生产构建：

```bash
npm run build
```

构建结果会生成在 `dist/`。

## 部署到 GitHub Pages

仓库已经包含 `.github/workflows/deploy.yml`，推荐使用 GitHub Actions 自动部署：

1. 新建一个 GitHub 仓库
2. 上传本项目全部源文件，不需要上传 `node_modules/` 和 `dist/`
3. 打开仓库的 `Settings → Pages`
4. 在 `Build and deployment` 中选择 `GitHub Actions`
5. 运行 `Deploy Star Atlas to GitHub Pages`，或向 `main` 分支推送代码
6. 等待 Actions 完成，在 Pages 页面获得公开链接

如果不想使用 Actions，也可以执行 `npm run build`，再把 `dist/` 里的内容部署到你自己的静态托管服务。

## 操作说明

- 拖拽空白处：旋转星图
- 滚轮或双指缩放：调整镜头
- 点击星体：查看知识卡片正面与内核
- 左侧星云带：捕获、点燃和管理知识
- 顶部搜索：按语义寻找相关知识
- 底部按钮：开始漫游
- 右下角：投放黑洞谜题
- 左下角：新增星光或重置演示数据

## 产品逻辑

Star Atlas 把知识内化拆成四个动作：

```text
捕获 → 点燃 → 连接 → 漫游
```

三种知识形态会单向演化：

```text
星辰 → 脉冲星 → 星座
```

- 星辰：刚捕获，还没有完成结构化理解
- 脉冲星：已经生成知识内核
- 星座：至少与两条其他知识建立关系

## 隐私说明

网页 Demo 不包含后端，不接入分析服务。演示内容与你的操作只保存在当前浏览器
`localStorage` 中。清除浏览器站点数据或点击左下角“重置”即可恢复初始演示。
