# Multi-Agent Decision App (Travel MVP)

**多智能体决策助手 - 通用2日游规划工具**

一个生产就绪的 MVP Web 应用，通过模拟多个 AI 视角的讨论，帮助用户做出更好的全球任意目的地2日游规划决策。

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [数据库设计](#数据库设计)
- [环境配置](#环境配置)
- [快速开始](#快速开始)
- [数据库重建](#数据库重建)
- [API 端点](#api-端点)
- [核心功能](#核心功能)
- [故障排查](#故障排查)

---

## 项目概述

### 🎯 核心价值

解决用户反复询问多个 AI 并手动比较答案的痛点，通过多智能体讨论的方式，一次性呈现多个视角的全面分析。支持全球任意目的地。

### ✨ 主要特性

- **🤖 多智能体讨论**: 3 个 AI 角色进行 3 轮讨论
  - **Planner (规划师)**: 使用智谱 GLM-4-flash，负责行程结构设计
  - **Reality Checker (现实检查员)**: 使用智谱 GLM-4-plus，关注现实约束、时间、人流
  - **Budget Advisor (预算顾问)**: 使用 DeepSeek-chat，关注成本效益

- **💬 实时聊天界面**: 微信风格的对话界面
  - 按时间顺序显示所有发言
  - 支持📌引用/回复功能
  - 自动滚动到最新消息
  - 实时进度显示
  - **简短对话式发言**: 每个AI发言3-5句话，像真实会议讨论

- **📊 结构化输出**:
  - 一致点列表
  - 分歧点列表
  - 最终推荐行程

- **📈 数据追踪**: 分析用户行为事件

---

## 技术栈

### 前端
- **框架**: Next.js 16.1.1 (App Router)
- **UI 库**: TailwindCSS 4, Radix UI
- **语言**: TypeScript
- **状态管理**: React Hooks

### 后端
- **API 路由**: Next.js API Routes
- **ORM**: Drizzle ORM
- **数据库**: PostgreSQL (Supabase)

### AI 服务
- **智谱 AI**: GLM-4-flash, GLM-4-plus
- **DeepSeek**: DeepSeek-chat

---

## 项目结构

```
src/
├── app/
│   ├── page.tsx                          # 首页（输入表单）
│   ├── progress/[sessionId]/page.tsx     # 进度页面（聊天界面）
│   ├── results/[sessionId]/page.tsx      # 结果页面
│   ├── layout.tsx                        # 根布局
│   └── api/
│       ├── discuss/
│       │   ├── route.ts                  # 创建讨论会话（POST）
│       │   └── [sessionId]/
│       │       └── route.ts              # 获取会话消息（GET）
│       ├── analytics/route.ts            # 事件追踪
│       └── email/route.ts                # 邮箱收集
│
├── components/
│   ├── chat/
│   │   ├── ChatMessage.tsx               # 单条消息组件
│   │   └── ChatContainer.tsx            # 聊天容器组件
│   ├── email-capture.tsx                 # 邮箱收集组件
│   └── ui/                               # UI 组件库
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── radio-group.tsx
│
├── db/
│   ├── schema/
│   │   ├── auth/                         # 认证相关表（better-auth）
│   │   │   ├── account.ts
│   │   │   ├── session.ts
│   │   │   ├── user.ts
│   │   │   └── verification.ts
│   │   ├── analytics.ts                  # 分析事件表
│   │   └── planner.ts                    # 规划会话表 ⭐
│   │       ├── plannerSession.ts         # 会话主表
│   │       ├── discussionMessage.ts     # 讨论消息表 ⭐
│   │       └── emailCapture.ts          # 邮箱捕获表
│   └── index.ts                          # 数据库客户端
│
├── lib/
│   ├── api-config.ts                     # AI API 配置
│   └── prompts.ts                        # 所有提示词模板
│
└── styles/
    └── globals.css                       # 全局样式
```

---

## 数据库设计

### 📊 数据库表结构

#### 1. `planner_session` - 规划会话表

存储每次讨论会话的信息。

```typescript
{
  id: string                      // 主键，UUID
  question: string               // 用户问题
  pace: string                   // 节奏：fast | balanced | relaxed
  budget: string                 // 预算：budget-conscious | flexible
  focus: string                  // 重点：experience-first | practical

  // 讨论结果（JSON 格式，向后兼容）
  round1Proposals: json          // Round 1: 独立提案
  round2Critiques: json          // Round 2: 互相批评
  round3Consensus: json          // Round 3: 最终共识

  // 最终结果
  agreements: string             // JSON 数组字符串：一致点
  disagreements: string           // JSON 数组字符串：分歧点
  recommendation: string          // 最终推荐行程

  status: string                  // 状态：pending | processing | completed | failed
  createdAt: timestamp           // 创建时间
  updatedAt: timestamp           // 更新时间
}
```

#### 2. `discussion_messages` - 讨论消息表 ⭐

存储每个 AI 的每条发言，支持聊天界面显示。

```typescript
{
  id: string                      // 主键，UUID
  session_id: string              // 外键，关联 planner_session.id
  agent_id: string                // AI ID：planner | realityChecker | budgetAdvisor
  round: integer                  // 轮次：1 | 2 | 3
  content: string                 // 消息内容
  reply_to_id: string             // 引用的消息 ID（外键到 discussion_messages.id）
  created_at: timestamp           // 创建时间
}
```

**索引**:
- `idx_messages_session_round`: (session_id, round, created_at) - 优化查询性能

**关键设计**:
- Round 2 的消息 `reply_to_id` 指向 Round 1 中同一 agent 的消息
- 支持按 `created_at` 顺序显示，实现真正的聊天体验

#### 3. `email_capture` - 邮箱捕获表

```typescript
{
  id: string                      // 主键，UUID
  email: string                   // 邮箱地址（唯一）
  session_id: string              // 关联的会话 ID（可选）
  createdAt: timestamp           // 创建时间
}
```

#### 4. `analytics_event` - 分析事件表

```typescript
{
  id: string                      // 主键，UUID
  event_type: string              // 事件类型
  session_id: string              // 关联的会话 ID
  metadata: string                // 附加信息（JSON）
  created_at: timestamp           // 创建时间
}
```

#### 5. 认证相关表（better-auth）

- `user` - 用户表
- `account` - 账户表
- `session` - 会话表
- `verification` - 验证表

---

### 🗂️ 数据库关系图

```
planner_session (1)
    ↓
    ↓ (1:N)
    ↓
discussion_messages (N)
    ↓
    ↓ (自引用)
    ↓
reply_to_id (可选)

planner_session (1)
    ↓
    ↓ (1:N)
    ↓
analytics_event (N)

planner_session (1)
    ↓
    ↓ (1:N)
    ↓
email_capture (N)
```

---

## 环境配置

### 📝 环境变量说明

创建 `.env` 文件：

```bash
# 数据库连接（使用 Supabase 连接池）
DATABASE_URL="postgresql://user:password@host:port/database"

# 直接连接（用于某些操作）
DIRECT_URL="postgresql://user:password@host:port/database"

# Better Auth 认证密钥
BETTER_AUTH_SECRET="your-secret-key-here"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# API 模式（false = 使用真实 AI，true = 模拟模式）
USE_MOCK_API="false"

# 智谱 AI API（用于 Planner 和 RealityChecker）
OPENAI_API_KEY="your-zhipu-api-key"
OPENAI_BASE_URL="https://open.bigmodel.cn/api/paas/v4"

# DeepSeek API（用于 Budget Advisor）
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
```

### 🔑 获取 API 密钥

1. **智谱 AI**:
   - 访问 [https://open.bigmodel.cn/](https://open.bigmodel.cn/)
   - 注册并创建 API Key

2. **DeepSeek**:
   - 访问 [https://platform.deepseek.com/](https://platform.deepseek.com/)
   - 注册并创建 API Key

3. **Supabase**:
   - 访问 [https://supabase.com](https://supabase.com)
   - 创建新项目
   - 获取数据库连接字符串

---

## 快速开始

### 1️⃣ 安装依赖

```bash
npm install
```

### 2️⃣ 配置环境

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API 密钥和数据库 URL
```

### 3️⃣ 创建数据库表

```bash
# 运行数据库迁移脚本
node scripts/run-migration.js
```

这将创建以下表：
- ✅ `planner_session`
- ✅ `discussion_messages`
- ✅ `analytics_event`
- ✅ `email_capture`
- ✅ `user` (认证)
- ✅ `account` (认证)
- ✅ `session` (认证)
- ✅ `verification` (认证)

### 4️⃣ 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 数据库重建

### 🔄 完整重建步骤

如果数据库被误删或需要重新创建，按以下步骤操作：

#### 方法一：使用迁移脚本（推荐）

```bash
# 1. 确保已配置 .env 文件
cat .env | grep DATABASE_URL

# 2. 运行迁移脚本
node scripts/run-migration.js

# 3. 验证表已创建
node scripts/test-messages-table.js
```

#### 方法二：手动执行 SQL

如果需要手动创建，使用以下 SQL：

```sql
-- 1. 创建核心表
CREATE TABLE IF NOT EXISTS "planner_session" (
  "id" text PRIMARY KEY,
  "question" text NOT NULL,
  "pace" text NOT NULL,
  "budget" text NOT NULL,
  "focus" text NOT NULL,
  "round1_proposals" json,
  "round2_critiques" json,
  "round3_consensus" json,
  "agreements" text,
  "disagreements" text,
  "recommendation" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "discussion_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "round" integer NOT NULL,
  "content" text NOT NULL,
  "reply_to_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT discussion_messages_session_id_fkey
    FOREIGN KEY ("session_id") REFERENCES "planner_session"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "analytics_event" (
  "id" text PRIMARY KEY NOT NULL,
  "event_type" text NOT NULL,
  "session_id" text NOT NULL,
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "email_capture" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "session_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "email_capture_email_unique" UNIQUE("email")
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS "idx_messages_session_round"
  ON "discussion_messages"("session_id", "round", "created_at");
```

### 📝 验证数据库

运行测试验证所有表已创建：

```bash
node scripts/test-messages-table.js
```

预期输出：
```
✓ discussion_messages table exists
Columns: 7
✓ Current messages in table: 0
✓ Current sessions: X
```

---

## API 端点

### 📡 讨论相关

#### POST `/api/discuss`

创建新的讨论会话。

**请求体**:
```typescript
{
  question: string;      // 包含目的地的旅游问题，如 "Plan a 2-day trip to Paris"
  pace: "fast" | "balanced" | "relaxed";
  budget: "budget-conscious" | "flexible";
  focus: "experience-first" | "practical";
}
```

**响应**:
```typescript
{
  sessionId: string;
  status: "processing";
  message: "Discussion started";
}
```

#### GET `/api/discuss/[sessionId]`

获取会话信息和所有消息。

**响应**:
```typescript
{
  sessionId: string;
  status: "processing" | "completed";
  question: string;
  messages: Array<{
    id: string;
    agentId: string;
    round: number;
    content: string;
    replyToId: string | null;
    createdAt: string;
    replyTo?: {  // 如果有引用
      agentId: string;
      content: string;
    }
  }>;
}
```

### 📊 其他端点

- `POST /api/analytics` - 追踪分析事件
- `POST /api/email` - 收集用户邮箱

---

## 核心功能

### 🤖 多智能体讨论流程

#### Round 1: 独立提案

3 个 AI 各自生成指定目的地的 2 日游方案，互不干扰：

```
Planner → 生成完整行程提案
Reality Checker → 生成完整行程提案
Budget Advisor → 生成完整行程提案
```

#### Round 2: 互相批评

每个 AI 审视其他人的提案，指出问题：

```
Planner → 批评 Reality Checker 和 Budget Advisor 的提案
Reality Checker → 批评 Planner 和 Budget Advisor 的提案
Budget Advisor → 批评 Planner 和 Reality Checker 的提案
```

**关键**: Round 2 的每条消息都会 `reply_to` Round 1 中该 AI 自己的提案

#### Round 3: 最终综合

Planner 汇总所有讨论，生成最终推荐方案：

```
Planner → 综合考虑 Round 1 和 Round 2 的所有观点
        → 提取一致点
        → 总结分歧点
        → 给出最终推荐行程
```

### 💬 聊天界面设计

#### 消息顺序

完全按时间顺序（`created_at`）显示，不按轮次分组。每个AI发言简短（3-5句话），像真实会议讨论：

```
12:30:00 [Planner, Round 1] 基于平衡节奏和灵活预算，我建议第一天从时代广场和洛克菲勒中心开始...
12:31:15 [Reality Checker, Round 1] 我建议第一天从中央公园开始（早上人少），然后大都会博物馆...
12:32:30 [Budget Advisor, Round 1] 从预算角度，我建议使用免费的史泰登岛渡轮看自由女神像...
12:33:45 [Planner, Round 2] 📌 Planner: 基于平衡节奏...
                          Reality Checker，我喜欢你的人流策略，但Top of the Rock和帝国大厦同一天去有点重复...
12:34:00 [Reality Checker, Round 2] 📌 Reality Checker: 我建议第一天从...
                            Planner，时代广场早上9点仍然很拥挤。另外，提到百老汇演出但没有预订时间不现实...
12:35:00 [Budget Advisor, Round 2] 📌 Budget Advisor: 从预算角度...
                              Planner，你的方案加起来很快：Top of the Rock ($40+)、MoMA ($30)...
12:36:00 [Planner, Round 3] 综合以上讨论，我的最终建议是...
```

#### 视觉区分

- **Planner**: 蓝色气泡 📋
- **Reality Checker**: 紫色气泡 🔍
- **Budget Advisor**: 绿色气泡 💰

#### 引用样式

当消息有 `reply_to_id` 时，在消息气泡上方显示被引用的内容：

```
┌────────────────────────────┐
│ 📌 Planner: 我建议第一天... │ ← 引用标记
└────────────────────────────┘

┌────────────────────────────┐
│ 💬 Reality Checker (12:35) │
│ 我不同意，时间太紧...      │
└────────────────────────────┘
```

---

## 故障排查

### ❌ 常见问题

#### 1. 数据库连接失败

**错误**: `Failed query` 或 `ENOTFOUND`

**解决**:
```bash
# 检查 .env 文件中的 DATABASE_URL
grep DATABASE_URL .env

# 确保 Supabase 项目未被暂停
# 访问 Supabase 控制台检查项目状态

# 重新获取连接字符串并更新 .env
```

#### 2. API 调用失败

**错误**: `ZHIPU_API error: 401` 或 `DEEPSEEK API error: 401`

**解决**:
```bash
# 检查 API 密钥是否正确
grep "API_KEY" .env

# 验证 API 密钥是否有效
curl -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-4-flash","messages":[{"role":"user","content":"hi"}]}'
```

#### 3. 表不存在

**错误**: `relation "discussion_messages" does not exist`

**解决**:
```bash
# 重新创建表
node scripts/run-migration.js

# 验证表已创建
node scripts/test-messages-table.js
```

#### 4. 验证失败

**错误**: `Question is required`

**解决**: 确保问题字段非空且包含目的地信息。

例如：
- ✅ "Plan a 2-day trip to Paris"
- ✅ "I want to visit Tokyo for 2 days"
- ✅ "Help me plan a weekend in London"
- ❌ "" (空字符串)

#### 5. 编译错误

**错误**: TypeScript 或 build 错误

**解决**:
```bash
# 清除构建缓存
rm -rf .next

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重启开发服务器
npm run dev
```

#### 6. 消息不显示

**检查清单**:
- [ ] 服务器终端是否有错误日志？
- [ ] 浏览器控制台是否有错误？
- [ ] `/api/discuss/[sessionId]` 是否返回消息？
- [ ] `discussion_messages` 表是否有数据？

```bash
# 查看表中的数据
psql $DATABASE_URL -c "SELECT COUNT(*) FROM discussion_messages;"
```

---

## 🎯 开发指南

### 添加新的 AI Agent

1. 在 `src/lib/prompts.ts` 中添加新 agent：
```typescript
export const PARTICIPANTS = {
  // ...existing agents
  newAgent: {
    role: "New Agent",
    purpose: "What it does",
    model: "model-name",
    provider: "zhipu" as const,
  },
};
```

2. 在 `src/app/api/discuss/route.ts` 中处理新 agent
3. 在 UI 组件中添加对应的样式和头像

### 修改提示词

所有提示词都在 `src/lib/prompts.ts` 中，可以直接编辑：

```typescript
export const SYSTEM_PROMPTS = {
  planner: `You are the Planner...`,
  realityChecker: `You are the Reality Checker...`,
  budgetAdvisor: `You are the Budget Advisor...`,
};
```

### 自定义 UI 样式

聊天组件位于 `src/components/chat/`:
- `ChatMessage.tsx` - 单条消息样式
- `ChatContainer.tsx` - 聊天容器逻辑

---

## 📈 性能优化

### 数据库查询

- 使用连接池（`DATABASE_URL`）而非直接连接
- 已创建索引优化查询性能
- 轮询间隔设置为 500ms（可调整）

### API 调用

- 使用异步方式，不阻塞响应
- 错误处理和重试机制
- Token 限制控制成本

---

## 🚀 部署

### 构建

```bash
npm run build
```

### 生产环境变量

确保设置所有必需的环境变量，特别是：
- `DATABASE_URL`
- `ZHIPU_API_KEY`
- `DEEPSEEK_API_KEY`

### 启动生产服务器

```bash
npm start
```

---

## 📝 许可证

MIT

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新**: 2025-12-31
**版本**: 3.0.0 - 通用旅游规划版本 (支持全球任意目的地，简短对话式讨论)
