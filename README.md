# Multi-Agent Travel Planner - 2-Day Trip MVP

**多智能体旅行规划助手 - 通用2日游规划工具**

一个生产就绪的 MVP Web 应用，通过多个 AI 专家角色的讨论，为全球任意目的地提供详细的2日游规划。支持实时聊天、智能图片显示、暂停/继续等高级功能。

## 📋 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [数据库设计](#数据库设计)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [数据库迁移](#数据库迁移)
- [API 端点](#api-端点)
- [核心功能说明](#核心功能说明)
- [故障排查](#故障排查)
- [部署指南](#部署指南)

---

## 项目概述

### 🎯 核心价值

通过多智能体协作讨论的方式，一次性呈现多个专业视角的旅行建议。用户无需反复询问多个AI，系统会自动模拟规划师、现实检查员和预算顾问的深度讨论，最终给出综合建议。

### ✨ 主要特性

- **🤖 三角色AI讨论系统**
  - **Planner (规划师)**: 使用智谱 GLM-4-flash，负责行程结构设计和整体规划
  - **Reality Checker (现实检查员)**: 使用智谱 GLM-4-plus，关注时间可行性、人流、实际约束
  - **Budget Advisor (预算顾问)**: 使用 DeepSeek-chat，关注成本效益和性价比

- **💬 微信风格聊天界面**
  - 按时间顺序显示所有发言
  - 支持消息引用/回复功能
  - 不同AI角色使用不同颜色气泡区分
  - 实时进度显示和自动滚动

- **🖼️ 智能图片展示**
  - 自动识别对话中的景点、美食、地点
  - 使用Bing爬虫实时搜索相关图片
  - 内置反爬保护机制（请求限流、UA轮换、智能缓存）
  - 右侧独立图片面板，不影响对话浏览

- **⏸️ 暂停/继续功能**
  - 可随时暂停AI讨论
  - 支持发送用户消息参与讨论
  - 灵活的AI模型选择（可选择让哪些AI参与）

- **📌 会话管理**
  - 会话置顶功能
  - 会话重命名
  - 历史会话查看
  - 会话状态实时跟踪

---

## 核心功能

### 1. 多智能体讨论流程

#### Round 1: 独立提案阶段
3个AI角色各自基于目的地生成完整的2日游方案，互不干扰：

```
Planner → 生成包含景点、活动、时间安排的完整行程提案
Reality Checker → 生成考虑实际约束的可行方案
Budget Advisor → 生成高性价比的预算友好方案
```

#### Round 2: 互相批评阶段
每个AI审视其他角色的提案，指出问题和改进建议：

```
Planner → 批评 Reality Checker 和 Budget Advisor 的提案（过于保守/过于省钱）
Reality Checker → 批评 Planner 和 Budget Advisor 的提案（时间不现实/质量妥协）
Budget Advisor → 批评 Planner 和 Reality Checker 的提案（超出预算/资源浪费）
```

**关键设计**: Round 2的每条消息会通过`reply_to_id`引用Round 1中该AI自己的提案，便于理解批评背景。

#### Round 3: 最终综合阶段
Planner汇总所有讨论观点，生成最终推荐：

```
Planner → 综合考虑Round 1和Round 2的所有观点
        → 提取一致点（所有AI都认同的建议）
        → 总结分歧点（需要用户权衡的不同观点）
        → 给出最终推荐行程（平衡各方考虑）
```

### 2. 智能实体提取与图片展示

系统使用DeepSeek LLM实时分析AI对话，自动提取：

- **景点**: 如"北京故宫"、"上海外滩"
- **美食**: 如"四川火锅"、"西安肉夹馍"
- **地点**: 如"杭州西湖"、"云南丽江"

然后通过Bing图片搜索获取相关图片，并在右侧面板展示。

**反爬保护机制**:
- User-Agent池轮换（6种真实浏览器UA）
- 请求频率限制（最小间隔2秒）
- 随机延迟（1-3秒）
- 智能缓存（5分钟有效期）
- 完整浏览器请求头模拟

### 3. 用户交互功能

- **暂停/继续**: 随时暂停讨论，稍后继续
- **参与讨论**: 用户可发送消息，AI会根据用户输入调整建议
- **AI选择**: 可选择让哪些AI参与讨论
- **会话置顶**: 重要会话置顶显示
- **会话重命名**: 自定义会话标题

---

## 技术栈

### 前端
- **框架**: Next.js 16.1.1 (App Router + Turbopack)
- **UI库**: TailwindCSS 4.1, Radix UI, shadcn/ui
- **语言**: TypeScript 5
- **状态管理**: React Hooks (useState, useEffect, useRef)
- **样式方案**: TailwindCSS + CSS Modules

### 后端
- **API路由**: Next.js API Routes (App Router)
- **ORM**: Drizzle ORM 0.44.7
- **数据库**: PostgreSQL (Supabase)
- **认证**: Better Auth 1.3.32

### AI服务
- **智谱AI**: GLM-4-flash (快速规划), GLM-4-plus (深度分析)
- **DeepSeek**: DeepSeek-chat (预算优化), DeepSeek用于实体提取

### 图片服务
- **Bing图片爬虫**: 无需API Key，支持中文内容
- **反爬保护**: 请求限流、UA轮换、智能缓存

---

## 项目结构

```
src/
├── app/
│   ├── (routes)/(home)/
│   │   └── page.tsx                          # 首页（新建讨论表单）
│   ├── progress/[sessionId]/page.tsx         # 进度页面重定向
│   ├── layout.tsx                            # 根布局
│   └── api/
│       ├── discuss/
│       │   ├── route.ts                      # POST 创建讨论会话
│       │   └── [sessionId]/
│       │       ├── route.ts                  # GET 获取会话消息
│       │       ├── pause/
│       │       │   └── route.ts              # POST 暂停/继续
│       │       ├── message/
│       │       │   └── route.ts              # POST 发送用户消息
│       │       └── continue/
│       │           └── route.ts              # POST 继续讨论
│       ├── sessions/
│       │   ├── route.ts                      # GET 获取会话列表
│       │   └── [sessionId]/
│       │       ├── route.ts                  # GET/PUT/PATCH/DELETE 会话
│       │       └── pin/
│       │           └── route.ts              # POST 置顶/取消置顶
│       ├── scrape-images/
│       │   └── route.ts                      # GET Bing图片爬虫
│       ├── extract-entities/
│       │   └── route.ts                      # POST 实体提取API
│       ├── auth/[...all]/route.ts            # Better Auth
│       └── email/route.ts                    # 邮箱收集（已废弃）
│
├── components/
│   ├── app/
│   │   ├── AppLayout.tsx                     # 主布局组件
│   │   ├── ActiveDiscussion.tsx              # 进行中会话视图
│   │   ├── HistoryViewer.tsx                 # 历史会话视图
│   │   └── NewDiscussionForm.tsx             # 新建讨论表单
│   ├── chat/
│   │   ├── Sidebar.tsx                       # 左侧会话列表
│   │   ├── SessionList.tsx                   # 会话列表组件
│   │   ├── SessionItem.tsx                   # 单个会话项
│   │   ├── ChatContainer.tsx                 # 聊天消息容器
│   │   ├── ChatMessage.tsx                   # 单条消息组件
│   │   └── ImagePanel.tsx                    # 右侧图片面板
│   └── ui/                                   # shadcn/ui组件
│       ├── button.tsx, input.tsx, label.tsx
│       ├── radio-group.tsx, dropdown-menu.tsx
│       └── sonner.tsx                        # Toast通知
│
├── db/
│   ├── schema/
│   │   ├── auth/                             # Better Auth表
│   │   │   ├── user.ts, account.ts
│   │   │   ├── session.ts, verification.ts
│   │   ├── planner.ts                        # 核心业务表
│   │   │   ├── plannerSession.ts             # 会话表
│   │   │   ├── discussionMessage.ts          # 消息表
│   │   │   └── emailCapture.ts               # 邮箱表
│   │   ├── analytics.ts                      # 分析事件表
│   │   └── index.ts                          # Schema导出
│   ├── index.ts                              # 数据库客户端
│   └── migrate.ts                            # 数据库迁移脚本
│
├── lib/
│   ├── api-config.ts                         # AI API配置
│   ├── prompts.ts                            # AI提示词模板
│   ├── entity-extraction.ts                  # 实体提取逻辑
│   ├── client-api.ts                         # 客户端API调用
│   ├── image-service.ts                      # 图片搜索服务
│   ├── bing-scraper.ts                       # Bing爬虫（带反爬）
│   └── utils.ts                              # 工具函数
│
└── providers/
    └── index.tsx                             # Theme/Toast Provider
```

---

## 数据库设计

### 核心表结构

#### 1. `planner_session` - 规划会话表

```typescript
{
  id: string                      // UUID主键
  question: string               // 用户问题（如"北京2日游"）
  title: string                  // 会话标题（用户自定义）
  pace: string                   // 节奏：fast | balanced | relaxed
  budget: string                 // 预算：budget-conscious | flexible
  focus: string                  // 重点：experience-first | practical

  // 讨论结果（JSON格式）
  round1Proposals: json          // Round 1: 独立提案
  round2Critiques: json          // Round 2: 互相批评
  round3Consensus: json          // Round 3: 最终共识

  // 最终结果
  agreements: text              // JSON数组字符串：一致点
  disagreements: text           // JSON数组字符串：分歧点
  recommendation: text          // 最终推荐行程

  status: string                 // pending | processing | completed | failed
  isPaused: boolean              // 暂停状态（默认false）
  isPinned: boolean              // 置顶状态（默认false）
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 2. `discussion_messages` - 讨论消息表

```typescript
{
  id: string                      // UUID主键
  sessionId: string              // 外键 → planner_session.id
  role: enum                     // 'user' | 'assistant'
  agentId: string                // 'planner' | 'realityChecker' | 'budgetAdvisor'（用户消息为null）
  round: integer                 // 1 | 2 | 3（用户消息为null）
  content: string                // 消息内容
  replyToId: string              // 引用的消息ID（外键 → discussion_messages.id）
  createdAt: timestamp
}
```

**索引**:
```sql
CREATE INDEX idx_messages_session_round
  ON discussion_messages(sessionId, round, createdAt);
```

#### 3. `email_capture` - 邮箱捕获表（已废弃）

```typescript
{
  id: string
  email: string (UNIQUE)
  sessionId: string
  createdAt: timestamp
}
```

#### 4. `analytics_event` - 分析事件表

```typescript
{
  id: string
  eventType: string
  sessionId: string
  metadata: string (JSON)
  createdAt: timestamp
}
```

### 数据库关系图

```
planner_session (1)
    ↓ (1:N)
discussion_messages (N)
    ↓ (自引用)
reply_to_id

planner_session (1)
    ↓ (1:N)
analytics_event (N)

planner_session (1)
    ↓ (1:N)
email_capture (N)
```

---

## 快速开始

### 前置要求

- Node.js 18.17+
- PostgreSQL数据库（推荐使用Supabase）
- 智谱AI API Key
- DeepSeek API Key

### 1. 克隆项目

```bash
git clone <repository-url>
cd nk
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
# 或
bun install
```

### 3. 配置环境变量

复制示例配置并填写实际值：

```bash
cp .env.example .env
```

编辑 `.env` 文件（详见[环境配置](#环境配置)章节）

### 4. 数据库迁移

```bash
# 使用Drizzle ORM推送schema到数据库
npm run db:push

# 或者使用迁移文件
npm run db:generate
npm run db:migrate
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 环境配置

### 必需环境变量

```bash
# ==================== 数据库配置 ====================
# Supabase连接池（推荐用于生产）
DATABASE_URL="postgresql://postgres:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# 直接连接（用于数据库迁移）
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# ==================== Better Auth ====================
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# ==================== AI API配置 ====================
# 智谱AI（用于Planner和RealityChecker）
OPENAI_API_KEY="your-zhipu-api-key"  # 格式：id.secret
OPENAI_BASE_URL="https://open.bigmodel.cn/api/paas/v4"

# 备用配置
ZHIPU_API_KEY="your-zhipu-api-key"

# DeepSeek（用于BudgetAdvisor和实体提取）
DEEPSEEK_API_KEY="sk-xxxxxxxx"
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"

# ==================== 功能开关 ====================
# API模式（true=使用mock模式，false=使用真实AI）
USE_MOCK_API="false"
```

### 可选环境变量

```bash
# Google Analytics（如需使用）
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# 自定义模型（可选）
PLANNER_MODEL="glm-4-flash"
REALITY_CHECKER_MODEL="glm-4-plus"
BUDGET_ADVISOR_MODEL="deepseek-chat"
```

### 获取API密钥

#### 1. 智谱AI API
1. 访问 [https://open.bigmodel.cn/](https://open.bigmodel.cn/)
2. 注册账号并实名认证
3. 进入"API Keys"页面
4. 创建新的API Key
5. 复制Key，格式如：`0534b191400e4b7a8ab8689092988c21.jIVA9yPMMf0mxpoY`

#### 2. DeepSeek API
1. 访问 [https://platform.deepseek.com/](https://platform.deepseek.com/)
2. 注册账号
3. 进入"API Keys"页面
4. 创建新的API Key
5. 复制Key，格式如：`sk-c6c462061f0f48dbbf47a52ee1c1110b`

#### 3. Supabase数据库
1. 访问 [https://supabase.com](https://supabase.com)
2. 创建新项目
3. 进入Project Settings > Database
4. 复制Connection String（Pooler和Direct）

---

## 数据库迁移

### 使用Drizzle ORM（推荐）

项目使用Drizzle ORM进行数据库管理。

#### 初次创建表

```bash
# 方式1：直接推送schema（推荐用于开发）
npm run db:push

# 方式2：生成迁移文件
npm run db:generate
npm run db:migrate
```

#### 数据库迁移脚本

数据库包含自动迁移脚本，在应用启动时运行：

```typescript
// src/db/migrate.ts
export async function ensureMessageRoleColumn() {
  // 自动检查并添加role列
}
```

此脚本在API路由中被调用，确保数据库schema始终是最新的。

#### 数据库管理工具

```bash
# 启动Drizzle Studio（可视化数据库管理）
npm run db:studio
```

访问 `http://localhost:4983` 查看数据库内容。

### 手动创建表（紧急情况）

如果Drizzle ORM不可用，可以手动执行SQL：

```sql
-- 1. 创建枚举类型
CREATE TYPE IF NOT EXISTS message_role AS ENUM ('user', 'assistant');

-- 2. 创建会话表
CREATE TABLE IF NOT EXISTS planner_session (
  id text PRIMARY KEY,
  question text NOT NULL,
  title text NOT NULL,
  pace text NOT NULL,
  budget text NOT NULL,
  focus text NOT NULL,
  round1_proposals json,
  round2_critiques json,
  round3_consensus json,
  agreements text,
  disagreements text,
  recommendation text,
  status text NOT NULL DEFAULT 'pending',
  is_paused boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now()
);

-- 3. 创建消息表
CREATE TABLE IF NOT EXISTS discussion_messages (
  id text PRIMARY KEY,
  session_id text NOT NULL,
  role message_role NOT NULL DEFAULT 'assistant',
  agent_id text,
  round integer,
  content text NOT NULL,
  reply_to_id text,
  created_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT discussion_messages_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES planner_session(id) ON DELETE CASCADE
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_messages_session_round
  ON discussion_messages(session_id, round, created_at);

-- 5. 创建邮箱表（可选）
CREATE TABLE IF NOT EXISTS email_capture (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  session_id text,
  created_at timestamp DEFAULT now() NOT NULL
);

-- 6. 创建分析事件表（可选）
CREATE TABLE IF NOT EXISTS analytics_event (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  session_id text NOT NULL,
  metadata text,
  created_at timestamp DEFAULT now() NOT NULL
);
```

### 验证数据库

使用psql或Drizzle Studio验证表已创建：

```bash
# 使用psql
psql $DATABASE_URL -c "\dt"

# 或启动Drizzle Studio
npm run db:studio
```

预期输出：
```
          List of relations
 Schema |         Name          | Type  |  Owner
--------+-----------------------+-------+----------
 public | analytics_event      | table | postgres
 public | discussion_messages   | table | postgres
 public | email_capture        | table | postgres
 public | planner_session      | table | postgres
 public | user                 | table | postgres
 public | account              | table | postgres
 public | session              | table | postgres
 public | verification         | table | postgres
```

---

## API 端点

### 讨论相关

#### POST `/api/discuss`
创建新的讨论会话。

**请求体**:
```json
{
  "question": "Plan a 2-day trip to Paris",
  "pace": "balanced",
  "budget": "flexible",
  "focus": "experience-first"
}
```

**响应**:
```json
{
  "sessionId": "uuid",
  "status": "processing",
  "message": "Discussion started"
}
```

#### GET `/api/discuss/[sessionId]`
获取会话信息和所有消息。

**响应**:
```json
{
  "id": "uuid",
  "question": "Plan a 2-day trip to Paris",
  "status": "processing",
  "isPaused": false,
  "messages": [
    {
      "id": "msg-uuid",
      "sessionId": "uuid",
      "role": "assistant",
      "agentId": "planner",
      "round": 1,
      "content": "I recommend starting with...",
      "replyToId": null,
      "createdAt": "2025-01-02T12:00:00Z",
      "replyTo": null
    }
  ]
}
```

#### POST `/api/discuss/[sessionId]/pause`
暂停或继续讨论。

**请求体**:
```json
{
  "action": "pause"  // 或 "resume"
}
```

#### POST `/api/discuss/[sessionId]/message`
发送用户消息参与讨论。

**请求体**:
```json
{
  "message": "I'd like to visit more museums",
  "selectedAgents": ["planner", "realityChecker"]
}
```

#### POST `/api/discuss/[sessionId]/continue`
继续已完成的讨论。

**请求体**:
```json
{
  "selectedAgents": ["planner", "realityChecker", "budgetAdvisor"]
}
```

### 会话管理

#### GET `/api/sessions`
获取所有会话列表。

**响应**:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Paris 2-Day Trip",
      "question": "Plan a 2-day trip to Paris",
      "status": "completed",
      "messageCount": 12,
      "isPinned": true,
      "createdAt": "2025-01-02T10:00:00Z"
    }
  ]
}
```

#### PATCH `/api/sessions/[sessionId]`
更新会话标题。

**请求体**:
```json
{
  "title": "New Title"
}
```

#### DELETE `/api/sessions/[sessionId]`
删除会话。

#### POST `/api/sessions/[sessionId]/pin`
置顶或取消置顶会话。

### 图片服务

#### GET `/api/scrape-images`
Bing图片爬虫（带反爬保护）。

**查询参数**:
- `q`: 搜索关键词（必需）
- `count`: 返回图片数量（可选，默认5）

**示例**:
```
GET /api/scrape-images?q=北京故宫景点&count=3
```

**响应**:
```json
{
  "query": "北京故宫景点",
  "count": 3,
  "images": [
    {
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "title": "Forbidden City",
      "sourceUrl": "https://..."
    }
  ]
}
```

#### POST `/api/extract-entities`
实体提取API（服务器端）。

**请求体**:
```json
{
  "message": "I recommend visiting the Eiffel Tower and trying French cuisine",
  "context": "",
  "question": "Plan a 2-day trip to Paris"
}
```

**响应**:
```json
{
  "entities": [
    {
      "keyword": "巴黎埃菲尔铁塔景点",
      "type": "attraction",
      "confidence": 0.9
    },
    {
      "keyword": "法国美食",
      "type": "food",
      "confidence": 0.8
    }
  ]
}
```

### 认证相关

#### `/api/auth/[...all]`
Better Auth处理的所有认证请求。

---

## 核心功能说明

### 聊天界面设计

#### 消息顺序
完全按时间顺序（`created_at`）显示，不按轮次分组：
```
12:00 Planner (Round 1)
12:01 Reality Checker (Round 1)
12:02 Budget Advisor (Round 1)
12:03 Planner (Round 2) → 引用自己的Round 1消息
12:04 Reality Checker (Round 2) → 引用自己的Round 1消息
...
```

#### 视觉区分
- **Planner**: 蓝色气泡 📋
- **Reality Checker**: 紫色气泡 🔍
- **Budget Advisor**: 绿色气泡 💰
- **User**: 灰色气泡（右对齐）

#### 引用样式
当消息有`replyToId`时，在气泡上方显示被引用内容：
```
┌────────────────────────────┐
│ 📌 Planner: 我建议第一天... │ ← 引用标记
└────────────────────────────┘

┌────────────────────────────┐
│ 💬 Reality Checker (12:35) │
│ 我不同意，时间太紧...      │
└────────────────────────────┘
```

### 实体提取与图片展示流程

```
1. AI发送消息
   ↓
2. ChatContainer触发displayImage事件
   ↓
3. ImagePanel接收事件，调用实体提取API
   ↓
4. /api/extract-entities使用DeepSeek分析消息
   - 提取景点、美食、地点
   - 自动添加地点前缀（基于问题中的目的地）
   - 添加合适后缀（景点/美食/风光）
   ↓
5. 调用图片搜索API (/api/scrape-images)
   - 使用Bing爬虫搜索
   - 应用反爬保护（限流、延迟、缓存）
   ↓
6. ImagePanel显示图片
   - 保持最多10张图片
   - 自动滚动到最新
   - 显示关键词和来源
```

### 反爬保护机制

**Bing爬虫包含以下保护措施**：

1. **User-Agent轮换**: 6种真实浏览器UA随机选择
2. **请求频率限制**: 最小间隔2秒
3. **随机延迟**: 每次请求前1-3秒随机延迟
4. **智能缓存**: 5分钟缓存，避免重复请求
5. **完整请求头**: 模拟真实浏览器请求

**配置位置**: `src/lib/bing-scraper.ts`

---

## 故障排查

### 1. 数据库连接失败

**错误**: `Failed query` 或 `ENOTFOUND`

**解决**:
```bash
# 检查DATABASE_URL
cat .env | grep DATABASE_URL

# 测试连接
psql $DATABASE_URL -c "SELECT 1"

# 检查Supabase项目状态（控制台）
```

### 2. API调用失败

**错误**: `401 Unauthorized`

**解决**:
```bash
# 检查API密钥
cat .env | grep API_KEY

# 测试智谱AI
curl -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-4-flash","messages":[{"role":"user","content":"hi"}]}'

# 测试DeepSeek
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"hi"}]}'
```

### 3. 表不存在

**错误**: `relation "discussion_messages" does not exist`

**解决**:
```bash
# 重新推送schema
npm run db:push

# 或运行迁移
npm run db:migrate

# 验证表
npm run db:studio
```

### 4. 实体提取失败

**错误**: `[Entity Extraction] API error: 401`

**解决**:
```bash
# 检查DeepSeek API Key
cat .env | grep DEEPSEEK_API_KEY

# 确保USE_MOCK_API=false
cat .env | grep USE_MOCK_API

# 查看详细日志
# [Entity Extraction] API Key exists: true
# [Entity Extraction] API Key prefix: sk-c6c462061f0f
```

### 5. 图片不显示

**检查清单**:
- [ ] 控制台是否有 `[BingScraper]` 日志？
- [ ] 是否有 `Rate limiting: waiting` 日志（说明在限流）？
- [ ] 是否有 `Using cached results` 日志（说明使用了缓存）？
- [ ] 实体是否被正确提取（查看`extracted entities`日志）？

**解决**:
```bash
# 查看图片搜索日志
[BingScraper] Scraping Bing Images for: 北京故宫景点
[BingScraper] HTML length: 123456
[BingScraper] Successfully scraped 3 images

# 如果没有图片，可能是：
# 1. Bing返回的HTML格式变化（需要更新正则表达式）
# 2. 关键词没有结果（尝试其他关键词）
# 3. 被反爬拦截（增加延迟时间）
```

### 6. 编译错误

**错误**: TypeScript或build错误

**解决**:
```bash
# 清除缓存
rm -rf .next

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重启dev server
npm run dev
```

### 7. 消息不更新

**检查**:
- 轮询是否正常（500ms间隔）
- sessionId是否正确
- `/api/discuss/[sessionId]`是否返回新消息

```bash
# 查看数据库中的消息
psql $DATABASE_URL -c "SELECT COUNT(*), agent_id FROM discussion_messages GROUP BY agent_id;"
```

---

## 部署指南

### 构建生产版本

```bash
npm run build
```

### 生产环境变量检查清单

- [ ] `DATABASE_URL` - 使用连接池URL
- [ ] `DIRECT_URL` - 使用直接连接URL
- [ ] `BETTER_AUTH_SECRET` - 强密码（32+字符）
- [ ] `NEXT_PUBLIC_BASE_URL` - 生产域名
- [ ] `ZHIPU_API_KEY` - 有效的智谱API Key
- [ ] `DEEPSEEK_API_KEY` - 有效的DeepSeek API Key
- [ ] `USE_MOCK_API` - 设置为 `false`

### 启动生产服务器

```bash
npm start
```

### 推荐部署平台

#### Vercel（推荐）
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 环境变量安全提示

**⚠️ 重要**:
- 永远不要将 `.env` 文件提交到Git
- 使用 `.env.example` 作为模板
- 在部署平台的环境变量设置中配置密钥
- 定期轮换API密钥

---

## 开发指南

### 添加新的AI Agent

1. **更新配置** (`src/lib/api-config.ts`):
```typescript
export const apiConfig = {
  models: {
    planner: "glm-4-flash",
    realityChecker: "glm-4-plus",
    budgetAdvisor: "deepseek-chat",
    newAgent: "model-name",  // 新增
  },
};
```

2. **更新提示词** (`src/lib/prompts.ts`):
```typescript
export const SYSTEM_PROMPTS = {
  newAgent: `You are a...`,
};
```

3. **更新UI** (`src/components/app/ActiveDiscussion.tsx`):
```typescript
const agents = ["planner", "realityChecker", "budgetAdvisor", "newAgent"];
```

### 修改提示词

所有AI提示词在 `src/lib/prompts.ts` 中：

```typescript
export const ROUND1_PROMPT = `...`;
export const ROUND2_PROMPT = `...`;
export const ROUND3_PROMPT = `...`;
```

### 调整反爬参数

编辑 `src/lib/bing-scraper.ts`:

```typescript
const MIN_REQUEST_INTERVAL = 2000;  // 请求间隔（毫秒）
const MIN_DELAY = 1000;             // 最小延迟
const MAX_DELAY = 3000;             // 最大延迟
const CACHE_DURATION = 5 * 60 * 1000;  // 缓存时长
```

### 自定义样式

- **全局样式**: `src/app/globals.css`
- **Tailwind配置**: `tailwind.config.ts`
- **聊天组件**: `src/components/chat/ChatMessage.tsx`
- **图片面板**: `src/components/chat/ImagePanel.tsx`

---

## 性能优化

### 数据库
- 使用连接池（`DATABASE_URL`）
- 已创建索引优化查询
- 轮询间隔500ms（可调整）

### API调用
- 异步处理，不阻塞响应
- Token限制控制成本
- 错误重试机制

### 图片搜索
- 智能缓存（5分钟）
- 请求限流（2秒最小间隔）
- 最多显示10张图片

---

## 许可证

MIT

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新**: 2025-01-02
**版本**: 4.0.0 - 完整版（包含图片展示、反爬保护、暂停继续等功能）
