# LUMIMORE LED 产品管理系统 - 部署指南

## 部署到 Vercel（免费）

### 方法 1：使用 GitHub（推荐）

1. **推送代码到 GitHub**
```bash
git init
git add .
git commit -m "LUMIMORE LED 产品管理系统"
git branch -M main
git remote add origin https://github.com/你的用户名/lumimore-led.git
git push -u origin main
```

2. **在 Vercel 导入项目**
- 访问 https://vercel.com/new
- 点击 "Import Git Repository"
- 选择你的 GitHub 仓库
- 点击 "Deploy"

3. **完成！** 获得免费域名 `https://你的项目.vercel.app`

---

### 方法 2：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd /workspace/projects
vercel

# 按提示操作
# Production deployment? → Y
# Which scope? → 选择你的账户
# Link to existing project? → N

# 获得预览链接
# 按 Enter 部署
```

---

## 功能说明

- **数据存储**：浏览器 localStorage（换浏览器会丢失数据）
- **数据备份**：支持导出 JSON 文件备份
- **数据恢复**：支持导入 JSON 文件恢复

### 建议：定期导出备份
系统右上角或设置中可以导出备份文件，防止数据丢失。

---

## 自定义域名（可选）

1. 在 Vercel 项目 → Settings → Domains
2. 添加你的域名（如 `led.lumimore.com`）
3. 在域名服务商添加 DNS 记录
4. 自动获得免费 SSL 证书
