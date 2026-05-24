# 第三方许可证和通知

本项目根据 MIT 许可证发布。本项目中使用的第三方包、字体、UI 代码片段和服务 SDK 遵守各自的许可证和通知。

## 直接运行时和开发依赖项

`package.json` 中声明的直接依赖主要采用 MIT、Apache-2.0、ISC 和 Unlicense 等开源许可证。

### 主要依赖项及其许可证

| 包名 | 版本 | 许可证 | 备注 |
|-----|------|--------|------|
| Next.js | ^16.0.0 | MIT | React 框架 |
| React | ^19.2.0 | MIT | UI 库 |
| React DOM | ^19.2.0 | MIT | DOM 渲染 |
| TypeScript | ^5 | Apache-2.0 | 类型检查 |
| Tailwind CSS | ^4.1.16 | MIT | CSS 框架 |
| Radix UI | 各版本 | MIT | UI 原语 |
| React Hook Form | ^7.65.0 | MIT | 表单管理 |
| Zod | ^4.1.12 | MIT | 数据验证 |
| Drizzle ORM | ^0.44.7 | Apache-2.0 | ORM 库 |
| Drizzle Zod | ^0.8.3 | Apache-2.0 | ORM 与 Zod 集成 |
| Better Auth | ^1.3.32 | MIT | 认证库 |
| class-variance-authority | ^0.7.1 | Apache-2.0 | CSS 类工具 |
| lucide-react | ^0.548.0 | ISC | 图标库 |
| postgres | ^3.4.7 | Unlicense | PostgreSQL 驱动 |
| Sonner | ^2.0.7 | MIT | Toast 通知 |
| PostCSS | ^8 | MIT | CSS 转换工具 |

## 注意的传递依赖项许可证

在审查依赖项元数据时发现了以下具有额外义务的传递包：

| 许可证 | 包名 | 说明 |
|-------|------|------|
| LGPL-3.0-or-later | sharp/libvips | 图片处理库的平台包 |
| MPL-2.0 | lightningcss, axe-core | CSS 编译器和无障碍工具 |
| CC-BY-4.0 | caniuse-lite | 浏览器兼容性数据 |
| Python-2.0 | argparse | Python 参数解析库 |

**重要**: 在重新分发包含第三方代码的打包工件时，请保持这些包的许可证通知完整。

## 源代码片段和资产

### Shadcn/ui 组件

- Shadcn/ui 组件模式通过 Radix UI 和本地组件代码使用
- 将这些代码片段视为 MIT 许可的第三方材料
- 更多信息: https://github.com/shadcn-ui/ui

### 字体资产

- `src/app/fonts/` 下的 Geist 字体文件是来自 Next.js 生态的第三方字体资产
- 替换、打包或重新分发这些字体时，请保留其上游许可证通知

### 被移除的资产

为避免暗示与 Vercel 的联系或支持，已删除以下未使用的 Next.js/Vercel 模板资产：
- `/public/next.svg`
- `/public/vercel.svg`
- `/public/file.svg`
- `/public/globe.svg`
- `/public/window.svg`

## 许可证合规性

### 许可证检查流程

在每次公开发布前，都应重新运行依赖项许可证报告：

```bash
# 生成完整的依赖项列表
pnpm list --all

# 检查审计
pnpm audit

# 详细的许可证报告（需要许可证工具）
npm-check-licenses
```

### 如何处理新的许可证

如果添加了新的依赖项：

1. **检查许可证**:
   ```bash
   pnpm info <package-name> | grep license
   ```

2. **评估兼容性**:
   - MIT / Apache-2.0 / ISC: ✅ 兼容
   - BSD-3-Clause / 0BSD: ✅ 通常兼容
   - GPL / AGPL: ⚠️ 需要特殊考虑
   - 其他专有许可证: ❌ 不兼容

3. **更新本文件**: 在遇到新许可证时更新此文件

## 常见许可证说明

### MIT 许可证
最宽松的许可证之一，允许商业使用、修改和分发，只要保留原始许可证和版权通知。

### Apache-2.0 许可证
类似 MIT，但明确处理专利权。要求对修改的文件进行通知。

### LGPL-3.0 许可证
比 GPL 更灵活的"弱" copyleft 许可证。允许在专有应用中链接，但库本身的修改必须以相同许可证发布。

### 关于我们的合规性

✅ **本项目的许可证政策**:
- 主要依赖项使用许可的开源许可证
- 任何 LGPL 依赖项仅作为二进制依赖项包含
- 所有许可证通知都被保留和记录
- 项目本身采用 MIT 许可证发布

## 版权归属

- **项目版权**: Copyright (c) 2025-2026 [版权持有者]
- **依赖项**: 各自由其原作者保留版权
- **字体**: 各字体资产由其原作者保留版权

## 相关文档

- 📜 [MIT 许可证全文](./LICENSE)
- 📋 [合规检查清单](./COMPLIANCE.md)
- 🔒 [安全政策](./SECURITY.md)
- 📄 [隐私政策](./PRIVACY.md)

## 更新日志

**最后更新**: 2025-01-02

所有依赖项许可证信息都应在每次主要版本发布前进行验证和更新。

