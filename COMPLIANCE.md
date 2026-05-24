# 合规检查清单

该检查清单用于在 GitHub 上发布项目前进行审核。**本文档不构成法律意见**。

## 本仓库已完成的合规工作

- ✅ MIT 许可证存在于 `LICENSE`
- ✅ `package.json` 声明了项目许可证、作者和包管理器版本
- ✅ 第三方依赖许可证说明在 `THIRD_PARTY_NOTICES.md`
- ✅ 隐私考虑事项说明在 `PRIVACY.md`
- ✅ 安全报告和密钥处理指南在 `SECURITY.md`
- ✅ 本地配置文件通过 `.gitignore` 忽略
- ✅ 可选的 Bing 图片元数据获取功能默认禁用
- ✅ 调试输出不暴露 API 密钥
- ✅ 占位符环境变量避免真实密钥泄露
- ✅ 移除了未使用的模板 logo 资源

## 发布前检查清单

### 版权和许可证
- [ ] 确认 `LICENSE` 中的版权持有者名称正确
- [ ] 确认版权年份是否需要更新（当前: 2025-2026）
- [ ] 确认 `package.json` 中的 `author` 字段是实际的持有者

### 隐私和数据保护
- [ ] 准备部署特定的隐私政策（使用 `PRIVACY.md` 作为模板）
- [ ] 如涉及欧盟用户，确保符合 GDPR 要求
- [ ] 如涉及中国用户，确保符合《个人信息保护法》（PIPL）
- [ ] 确认第三方 AI 服务商（智谱、DeepSeek）的数据处理条款
- [ ] 如启用 Bing 图片搜索，确保符合 Bing 服务条款
- [ ] 在应用中向用户披露数据处理政策

### 安全性
- [ ] 执行密钥扫描，确保 Git 历史中无泄露的凭证
- [ ] 检查依赖项中是否有已知漏洞：`npm audit`
- [ ] 确认环境变量模板 `.env.example` 不包含真实密钥
- [ ] 验证 `.gitignore` 规则包含所有敏感文件类型

### 第三方依赖
- [ ] 重新运行依赖许可证报告：`npm list --all`
- [ ] 更新 `THIRD_PARTY_NOTICES.md` 以反映任何新的许可证
- [ ] 确保所有 LGPL/GPL 依赖项的合规性
- [ ] 验证 shadcn/ui 等开源组件的许可证

### 代码质量
- [ ] 运行 ESLint: `npm run lint`
- [ ] 类型检查通过：`tsc --noEmit`
- [ ] 检查是否有 `TODO`, `FIXME`, `HACK` 等未解决的标记
- [ ] 确保所有密钥都存储在环境变量中，而非代码里

### README 和文档
- [ ] 验证 README 中的所有代码示例都能正确运行
- [ ] 确认 npm/pnpm 命令的版本一致性
- [ ] 确保文档中的 API 端点都是准确的
- [ ] 文档中不包含真实的 API 密钥或域名

### 功能特定
- [ ] 确认 Bing 图片抓取默认禁用（`ENABLE_BING_IMAGE_SCRAPER=false`）
- [ ] 如启用此功能，确保提示用户检查服务条款

### 部署前
- [ ] 清空或轮换任何曾被暴露过的 API 密钥
- [ ] 配置生产环境的强认证密钥（`BETTER_AUTH_SECRET`）
- [ ] 测试数据库连接和迁移流程
- [ ] 测试所有外部 API 集成

## 如果发现问题

如果你在 Git 历史中发现了泄露的密钥：
1. 立即从 `.env` 中移除
2. 轮换密钥（在提供商控制板中）
3. 使用 `git filter-branch` 或 `BFG Repo-Cleaner` 从历史中移除
4. Force push 到所有分支
5. 通知所有项目贡献者

## 许可证维护

每次发布前，重新运行许可证扫描并更新 `THIRD_PARTY_NOTICES.md`：

```bash
npm list --all > /tmp/npm-list.txt
```

## 相关文档

- 📄 [PRIVACY.md](./PRIVACY.md) - 隐私考虑事项
- 🔒 [SECURITY.md](./SECURITY.md) - 安全报告和密钥处理
- 📋 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) - 第三方许可证
- 📜 [LICENSE](./LICENSE) - MIT 许可证全文

