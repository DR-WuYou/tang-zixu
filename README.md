# Tang Zixu

个人网站：北京大学 / 本科 / 医学影像技术。

## 运行

纯静态网站，无构建依赖。在目录中运行 `python -m http.server 4174`，打开 `http://localhost:4174`。

## GitHub Pages

仓库 Settings → Pages → Deploy from a branch，选择 `main`、`/ (root)`。
所有资源使用相对地址，可直接部署到项目 Pages 路径。

## 内容与视觉

- `index.html`：真实个人信息与页面结构。
- `styles.css`：暖色明暗布局、响应式与微交互。
- `visual.js`：原创参数化 WebGL 点云；整体、分层、截面模式，拖动旋转。图形为抽象示意，不代表医学扫描或研究成果。
- `app.js`：导航、观察控制、动效暂停、复制姓名。
- 页面不可见或画面离开视口时停止渲染；遵循系统减少动态效果偏好，并提供手动暂停。WebGL 不可用时使用 Canvas 2D 降级图形。
- Manrope 字体随站点托管，授权见 `assets/OFL-Manrope.txt`。

不包含生活兴趣、未提供的作品、联系方式或虚构经历。暂无后台、追踪脚本或外部运行时依赖。
