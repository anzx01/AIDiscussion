# 贡献指南 (Contributing Guide)

感谢你有兴趣为本项目做出贡献！本指南将帮助你理解我们的开发流程。

## 行为准则

本项目实行 [行为准则](./CODE_OF_CONDUCT.md)。通过参与本项目，你同意遵守其条款。

## 开发工作流程

### 环境准备

```bash
# 1. Fork 本仓库
# (在 GitHub 上点击 Fork 按钮)

# 2. 克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/ai-discussion.git
cd ai-discussion

# 3. 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/ai-discussion.git

# 4. 安装依赖
pnpm install

# 5. 创建 .env.local 文件
cp .env.example .env.local
# 填写你的 API 密钥

# 6. 启动开发服务器
pnpm run dev
```

### 创建分支

使用描述性的分支名称：

```bash
# 功能分支
git checkout -b feature/add-user-preferences

# Bug 修复
git checkout -b fix/chat-message-not-updating

# 文档改进
git checkout -b docs/update-api-reference

# 性能优化
git checkout -b perf/reduce-bundle-size
```

### 提交信息

遵循约定式提交（Conventional Commits）格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（无逻辑变更）
- `refactor`: 代码重构（无功能变更）
- `perf`: 性能优化
- `test`: 添加或更新测试
- `ci`: CI/CD 配置更改
- `chore`: 其他不影响代码的变更

**示例**:
```
feat(ai): add support for Claude models

Add support for Anthropic Claude models as an alternative to Zhipu and DeepSeek.
Users can now select Claude as the primary planning agent.

Closes #123
```

### 代码风格

本项目遵循以下约定：

- **语言**: TypeScript / JavaScript (Next.js)
- **格式化**: Prettier (自动)
- **Linting**: ESLint (运行 `pnpm run lint`)
- **命名**:
  - 组件: PascalCase (`UserProfile.tsx`)
  - 函数/变量: camelCase (`getUserData`)
  - 常量: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### 测试

虽然本项目还没有完整的测试套件，但我们鼓励：
- 手动测试你的变更
- 在浏览器中验证功能
- 检查 TypeScript 编译: `pnpm run build`
- 运行 Linter: `pnpm run lint`

## Pull Request 流程

### 准备 PR

1. 从最新的 `main` 分支重新基准化你的分支：
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. 确保代码通过检查：
   ```bash
   pnpm run lint
   pnpm run build
   ```

3. 提交你的 PR，使用以下模板：

### PR 模板

```markdown
## 描述
对你的变更进行简明扼要的描述。

## 相关议题
修复 #(issue 号)

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 性能优化

## 测试清单
- [ ] 手动测试了功能
- [ ] 在多个浏览器中测试过
- [ ] 检查了无关回归

## 截图（如适用）
添加前后对比的截图。

## 其他信息
任何其他需要了解的信息。
```

### PR 审核

- 至少需要一名维护者的批准
- 所有 CI 检查必须通过
- 代码必须符合项目风格指南

## 报告 Bug

### 安全漏洞

**请勿在 GitHub Issues 中报告安全漏洞**。改为按照 [SECURITY.md](./SECURITY.md) 中的说明进行私密报告。

### 一般 Bug

创建 Issue 时，请包括：

1. **标题**: 清晰简洁的问题描述
2. **环境**:
   - 操作系统和浏览器
   - Node.js 版本
   - npm/pnpm 版本
3. **重现步骤**: 详细的步骤列表
4. **期望行为**: 应该发生什么
5. **实际行为**: 实际发生了什么
6. **日志/错误**: 控制台输出、错误堆栈等
7. **截图**: 如果可能的话

### 功能请求

创建 Issue 时，请包括：

1. **用例**: 描述你想要的功能及其用途
2. **动机**: 为什么这对你很重要
3. **可能的解决方案**: 如果你有想法的话
4. **替代方案**: 其他可能的方法

## 文档贡献

文档位置：
- **API 文档**: `README.md` 中的 "API 端点" 部分
- **指南**: `README.md` 中的对应章节
- **合规**: `COMPLIANCE.md`, `PRIVACY.md`, `SECURITY.md`

改进文档的步骤：
1. 编辑相关 Markdown 文件
2. 检查 Markdown 语法
3. 验证链接是否有效
4. 提交 PR 进行审核

## 项目架构

在做出大的改动前，建议了解：

- **前端**: Next.js 16 + React 19 + TailwindCSS 4
- **后端**: Next.js API Routes + Drizzle ORM
- **数据库**: PostgreSQL (Supabase)
- **AI 服务**: 智谱 AI + DeepSeek

详见 README.md 中的 [技术栈](README.md#技术栈) 和 [项目结构](README.md#项目结构)。

## 获取帮助

有问题？

- 📖 阅读 [README](README.md) 和常见问题
- 💬 在 GitHub Discussions 中提问
- 🐛 查看现有的 Issues
- 📧 联系项目维护者

## 许可证

通过贡献此项目，你同意你的贡献将在 MIT 许可证下发布。

## 致谢

感谢所有为本项目做出贡献的人！你们让这个项目变得更好。
