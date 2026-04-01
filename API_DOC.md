# API 文档

## 目录

1. [鉴权机制](#1-鉴权机制-authentication)
   - [1.1 Bot Token 鉴权](#11-bot-token-鉴权)
   - [1.2 管理员 Token 鉴权](#12-管理员-token-鉴权)
   - [1.3 Logto SSO 认证](#13-logto-sso-认证)
   - [1.4 权限等级系统](#14-权限等级系统)
2. [黑名单接口](#2-黑名单接口)
   - [2.1 公开接口（供普通用户使用）](#21-公开接口供普通用户使用)
   - [2.2 Bot专用接口](#22-bot专用接口)
   - [2.3 兼容旧接口（已废弃）](#23-兼容旧接口已废弃建议迁移)
   - **说明**: 支持 `user_type` 参数区分用户(`user`)和群聊(`group`)
3. [申诉接口（前端用）](#3-申诉接口前端用)
   - [3.1 提交申诉](#31-提交申诉)
   - [3.2 查询申诉详情](#32-查询申诉详情)
   - [3.3 修改申诉](#33-修改申诉)
   - [3.4 删除申诉](#34-删除申诉)
   - [3.5 获取用户所有申诉](#35-获取用户所有申诉)
   - [3.6 访问上传的文件](#36-访问上传的文件)
   - [3.7 获取公共统计数据](#37-获取公共统计数据)
4. [黑名单举报接口（公共接口）](#4-黑名单举报接口公共接口)
   - [4.1 提交黑名单举报](#41-提交黑名单举报)
   - [4.2 查询举报详情](#42-查询举报详情)
   - [4.3 获取极验配置](#43-获取极验配置)
5. [管理接口（管理员用）](#5-管理接口管理员用)
   - [5.1 获取申诉列表](#41-获取申诉列表)
   - [5.2 获取申诉详情](#42-审核申诉)
   - [5.3 审核申诉](#43-获取申诉详情)
   - [5.4 获取统计数据](#44-获取统计数据)
   - [5.5 获取黑名单列表](#45-获取黑名单列表管理端)
   - [5.6 手动添加黑名单](#46-手动添加黑名单管理端)
   - [5.6a 获取等级4待确认列表](#46a-获取等级4待确认列表)
   - [5.6b 确认等级4记录](#46b-确认等级4记录)
   - [5.6c 取消等级4待确认](#46c-取消等级4待确认)
   - [5.7 手动移除黑名单](#47-手动移除黑名单管理端)
   - [5.8 修改黑名单条目](#48-修改黑名单条目)
   - [5.9 删除黑名单条目（RESTful风格）](#49-删除黑名单条目restful风格)
   - [5.10 删除申诉](#410-删除申诉管理员用)
   - [5.11 清理已处理申诉](#411-清理已处理申诉)
   - [5.12 管理员登录](#412-管理员登录)
   - [5.13 管理员登出](#413-管理员登出)
   - [5.13a 统一认证登出](#413a-统一认证登出)
   - [5.14 获取极验配置](#414-获取极验配置)
   - [5.15 获取管理员列表](#415-获取管理员列表)
   - [5.16 创建管理员](#416-创建管理员)
   - [5.17 修改管理员信息](#417-修改管理员信息)
   - [5.18 删除管理员](#418-删除管理员)
   - [5.18a 获取个人信息](#418a-获取个人信息)
   - [5.18b 修改个人信息](#418b-修改个人信息)
   - [5.18c 修改密码](#418c-修改密码)
   - [5.19 获取 Bot Token 列表](#419-获取-bot-token-列表)
   - [5.20 创建 Bot Token](#420-创建-bot-token)
   - [5.21 修改 Bot Token](#421-修改-bot-token)
   - [5.22 删除 Bot Token](#422-删除-bot-token)
   - [5.23 获取 Bot Token 原文](#423-获取-bot-token-原文)
   - [5.24 获取系统配置](#424-获取系统配置)
   - [5.25 更新系统配置](#425-更新系统配置)
   - [5.26 重启服务器](#426-重启服务器)
   - [5.27 获取系统信息](#427-获取系统信息)
   - [5.28 查询审计日志](#428-查询审计日志)
   - [5.29 获取日志统计](#429-获取日志统计)
   - [5.30 获取操作类型](#430-获取操作类型)
   - [5.31 获取备份状态](#431-获取备份状态)
   - [5.32 列出所有备份](#432-列出所有备份)
   - [5.33 创建备份](#433-创建备份)
   - [5.34 删除备份](#434-删除备份)
   - [5.35 获取备份配置](#435-获取备份配置)
   - [5.36 更新备份配置](#436-更新备份配置)
   - [5.37 验证CRON表达式](#437-验证cron表达式)
   - [5.38 更新备份备注](#438-更新备份备注)
   - [5.39 获取图片列表](#439-获取图片列表)
   - [5.40 上传图片](#440-上传图片)
   - [5.41 删除图片](#441-删除图片)
   - [5.42 获取图片子目录列表](#542-获取图片子目录列表)
   - [5.43 获取黑名单举报列表](#543-获取黑名单举报列表)
   - [5.44 获取黑名单举报详情](#544-获取黑名单举报详情)
   - [5.45 审核黑名单举报](#545-审核黑名单举报)
   - [5.46 删除黑名单举报](#546-删除黑名单举报)
   - [5.47 获取举报AI分析](#547-获取举报ai分析)
   - [5.48 刷新举报AI分析](#548-刷新举报ai分析)
   - [5.49 删除举报AI分析缓存](#549-删除举报ai分析缓存)
   - [5.50 批量分析举报](#550-批量分析举报)
   - [5.51 清理已处理举报](#551-清理已处理举报)
6. [审计日志系统](#6-审计日志系统)
   - [6.1 日志字段说明](#61-日志字段说明)
   - [6.2 操作类型列表](#62-操作类型列表)
   - [6.3 日志查看权限](#63-日志查看权限)
7. [错误处理与速率限制](#7-错误处理与速率限制)
   - [7.1 状态码说明](#71-状态码说明)
   - [7.2 请求频率限制](#72-请求频率限制)
   - [7.3 IP 封禁机制](#73-ip-封禁机制)
8. [配置文件说明](#8-配置文件说明)
9. [AI 分析接口](#9-ai-分析接口)
   - [9.1 获取申诉AI分析](#91-获取申诉ai分析)
   - [9.2 刷新申诉AI分析](#92-刷新申诉ai分析)
   - [9.3 列出所有AI分析](#93-列出所有ai分析)
   - [9.4 获取AI配置](#94-获取ai配置)
   - [9.5 删除AI分析缓存](#95-删除ai分析缓存)
   - [9.6 批量分析申诉](#96-批量分析申诉)
10. [数据库备份接口](#10-数据库备份接口)
11. [Logto SSO 认证](#11-logto-sso-认证)
    - [11.1 支持的认证方式查询](#111-支持的认证方式查询)
    - [11.2 Logto 登录入口](#112-logto-登录入口)
    - [11.3 Logto 登录回调](#113-logto-登录回调)
    - [11.4 获取 Logto 绑定状态](#114-获取-logto-绑定状态)
    - [11.5 获取 Logto 绑定授权 URL](#115-获取-logto-绑定授权-url)
    - [11.6 Logto 绑定回调](#116-logto-绑定回调)
    - [10.7 解绑 Logto 账户](#107-解绑-logto-账户)
    - [10.8 Logto 登出跳转](#108-logto-登出跳转)
    - [10.9 强制 SSO 登录](#109-强制-sso-登录)
    - [10.10 前端集成示例](#1010-前端集成示例)
    - [10.11 配置说明](#1011-配置说明)
    - [10.12 刷新令牌轮换](#1012-刷新令牌轮换)
    - [10.13 后端通道注销](#1013-后端通道注销)

---

## 1. 鉴权机制 (Authentication)

### 1.1 Bot Token 鉴权
用于 Bot 自动化操作（增删黑名单），在 HTTP 请求头中包含：
- **Header**: `Authorization`
- **Value**: 对应的 Bot 令牌（定义在 `tokenlist.json` 中）

### 1.2 管理员 Token 鉴权
用于管理员人工操作（审核申诉、管理黑名单）：

**登录流程**:
1. 调用 `/api/admin/login` 接口，使用 `admin_id` + `password` 登录
2. 登录成功后返回临时 token (`temp_token`)
3. 后续请求在 HTTP 请求头中包含：
   - **Header**: `Authorization`
   - **Value**: 临时 token（例如：`550e8400-e29b-41d4-a716-446655440000`）

**注意**: 禁止使用永久 password 直接进行操作，必须使用登录获取的临时 token。

管理员配置文件格式 (`admin_tokens.json`):
```json
{
    "admins": [
        {
            "admin_id": "admin_001",
            "name": "超级管理员",
            "password": "your_secure_password_here",
            "level": 4,
            "created_at": "2026-03-16 00:00:00"
        }
    ]
}
```

### 1.3 Logto SSO 认证

系统支持通过 [Logto](https://logto.io/) 进行单点登录（SSO），支持 QQ、微信等社交登录方式。

**登录方式**:
1. **密码登录**: 使用 `admin_id` + `password` 登录（传统方式）
2. **Logto SSO**: 跳转至 Logto 授权页面，使用 QQ/微信等登录

**绑定流程**:
1. 先使用密码登录获取临时 token
2. 调用 `/api/auth/logto/bind/url` 获取绑定授权 URL
3. 用户授权后，Logto 账户与本地管理员账户绑定
4. 后续可直接使用 Logto SSO 登录

**强制 SSO**:
- 管理员可设置 `force_sso` 字段强制使用 SSO 登录
- 设置后该管理员无法使用密码登录
- 详细说明见 [10. Logto SSO 认证](#10-logto-sso-认证)

### 1.4 权限等级系统

系统采用 4 级权限管理制度：

| 等级 | 名称 | 权限说明 |
| :--- | :--- | :--- |
| **4** | 超级管理员 | 可执行所有操作，包括修改系统配置(config.json)、管理其他管理员、创建/删除 Bot Token、重启服务器 |
| **3** | 普通管理员 | 可管理黑名单、查看/审核申诉、查看统计数据，**不可**修改系统配置和管理其他管理员 |
| **2** | 申诉审核员 | 仅可查看和审核申诉内容，**不可**操作黑名单和管理员功能 |
| **1** | Bot 持有者 | 仅可管理自己的 Bot Token（查看、修改自己的 Bot 信息） |

**权限继承**: 高等级管理员拥有低等级的所有权限。

**接口权限标注**: 每个管理接口文档中会标注 `需要等级: X+`，表示该接口所需的最低权限等级。

---

## 2. 黑名单接口

### 黑名单严重等级说明

黑名单条目支持**4级严重等级**（`level`），用于区分不同性质的违规行为及对应的处置措施：

| 等级 | 名称 | 典型行为 | 处置措施 | 申诉权限 |
| :--- | :--- | :--- | :--- | :--- |
| **1** | 轻微违规 | 人身攻击、低素质言论 | 教育为主，警告处理 | ✅ 可申诉 |
| **2** | 一般违规 | 多次警告无效、轻度骚扰 | 限制功能（禁言/限制发言） | ✅ 可申诉 |
| **3** | 平台违规 | 违反QQ/微信用户协议、广告 spam | 跨群同步，限制加入其他群 | ✅ 可申诉 |
| **4** | 严重违规 | 诈骗、威胁、传播非法内容 | 全网标记+上报平台官方 | ❌ 不可申诉 |

> **注意**: 等级4需要 **2** 名管理员共同确认才能加入黑名单

#### 前端提示建议

> **注意**: 以下前端提示文案仅供参考，实际前端实现由开发者自行调整。

**添加黑名单时的等级选择提示**:
```
等级1 - 轻微违规: 人身攻击、低素质言论（教育为主）
等级2 - 一般违规: 多次警告无效、轻度骚扰（限制功能）
等级3 - 平台违规: 违反平台协议、广告 spam（跨群同步）
等级4 - 严重违规: 诈骗、威胁、传播非法内容（全网标记+上报）
```

---

### 关于 `user_type` 参数（个人用户 vs 群聊）

系统支持对**个人用户**和**群聊**分别进行黑名单管理。通过 `user_type` 参数区分：

| 值 | 说明 | 示例 |
| :--- | :--- | :--- |
| `user` | 个人QQ用户（默认值） | 123456789 |
| `group` | QQ群聊 | -123456789 |

**重要说明**：
1. **联合唯一索引**：系统使用 `(user_id, user_type)` 联合索引，即同一个ID可以是个人用户也可以是群聊，两者互不影响
2. **默认行为**：如果请求中不提供 `user_type` 参数，默认为 `user`（个人用户）
3. **群号特点**：QQ群号通常以 `-` 开头（如 `-123456789`），但这不是强制的，只是常见约定

**使用示例**：
```json
// 添加个人用户到黑名单
{
    "user_id": "123456789",
    "user_type": "user",
    "reason": "发布违规广告"
}

// 添加群聊到黑名单
{
    "user_id": "-123456789",
    "user_type": "group",
    "reason": "群聊违规"
}

// 不指定 user_type，默认为个人用户
{
    "user_id": "123456789",
    "reason": "发布违规广告"
}
```

### 2.1 公开接口（供普通用户使用）

#### 2.1.1 检查用户/群聊是否在黑名单
- **接口地址**: `/api/check`
- **请求方法**: `POST`
- **鉴权**: 不需要（带人机验证）
- **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user",
      "geetest": {
          "lot_number": "验证流水号",
          "captcha_output": "验证输出信息",
          "pass_token": "验证通过标识",
          "gen_time": "验证通过时间戳"
      }
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `geetest` | object | 否 | 极验验证数据（如启用） |
  | `geetest.lot_number` | string | 是 | 验证流水号（如启用） |
  | `geetest.captcha_output` | string | 是 | 验证输出信息（如启用） |
  | `geetest.pass_token` | string | 是 | 验证通过标识（如启用） |
  | `geetest.gen_time` | string | 是 | 验证通过时间戳（如启用） |
- **响应示例**:
  ```json
  {
      "success": true,
      "in_blacklist": true,
      "data": {
          "user_id": "1234567890",
          "user_type": "user",
          "reason": "发布违规广告",
          "level": 3,
          "added_at": "2026-02-01 00:50:00"
      }
  }
  ```
- **说明**: 公共查询接口不返回 `added_by`（添加人）字段，以保护操作者隐私

### 2.2 Bot专用接口

> **说明**: 所有 `/api/bot/*` 接口都需要 **Bot Token** 鉴权，且**免人机验证**。
> 
> **鉴权方式**: 在请求头中添加 `Authorization: your_bot_token`

#### 2.2.1 获取黑名单列表（Bot专用）
- **接口地址**: `/api/bot/getlist`
- **请求方法**: `GET`
- **鉴权**: **需要（Bot Token）**
- **其他限制**: 频率限制 + IP限制
- **查询参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_type` | string | 否 | 类型：`user`(只返回用户)、`group`(只返回群聊)，不传返回全部 |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "blacklist": [
              {
                  "user_id": "1234567890",
                  "user_type": "user",
                  "reason": "发布违规广告",
                  "level": 3,
                  "added_by": "yll",
                  "added_at": "2026-02-01 00:50:00"
              },
              {
                  "user_id": "987654321",
                  "user_type": "group",
                  "reason": "群聊违规",
                  "level": 2,
                  "added_by": "yll",
                  "added_at": "2026-02-01 01:00:00"
              }
          ],
          "updateAt": "2026-02-01 01:00:00"
      }
  }
  ```

#### 2.2.2 检查用户/群聊是否在黑名单（Bot专用）
- **接口地址**: `/api/bot/check`
- **请求方法**: `POST`
- **鉴权**: **需要（Bot Token）**
- **其他限制**: 频率限制 + IP限制（**免人机验证**）
- **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user"
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
- **响应示例**:
  ```json
  {
      "success": true,
      "in_blacklist": true,
      "data": {
          "user_id": "1234567890",
          "user_type": "user",
          "reason": "发布违规广告",
          "level": 3,
          "added_by": "yll",
          "added_at": "2026-02-01 00:50:00"
      }
  }
  ```

#### 2.2.3 添加黑名单条目（Bot专用）
- **接口地址**: `/api/bot/add`
- **请求方法**: `POST`
- **鉴权**: **需要（Bot Token）**
- **其他限制**: 频率限制 + IP限制
- **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user",
      "reason": "发布违规广告",
      "level": 3
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 是 | 加入黑名单的原因 |
  | `level` | int | 否 | 严重等级（1-4），默认1。详见[黑名单严重等级说明](#黑名单严重等级说明) |
- **响应示例**（添加成功）:
  ```json
  {
      "success": true,
      "message": "添加用户成功",
      "data": { ... }
  }
  ```
- **响应示例**（等级4被拒绝）:
  ```json
  {
      "success": false,
      "message": "严重违规（等级4）需通过管理端添加，并需要两名管理员共同确认"
  }
  ```
- **说明**: Bot 接口不支持添加等级4（严重违规）的黑名单记录，如需添加等级4记录请使用管理端接口

#### 2.2.4 删除黑名单条目（Bot专用）
- **接口地址**: `/api/bot/delete`
- **请求方法**: `POST`
- **鉴权**: **需要（Bot Token）**
- **其他限制**: 频率限制 + IP限制
- **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user",
      "reason": "误判，已核实"
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 否 | 移除原因/备注，将记录到审计日志 |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "删除用户成功",
      "data": { ... }
  }
  ```
- **说明**: 建议提供 `reason` 参数记录移除原因，便于后续审计追踪。如未提供，审计日志将记录"未提供移除原因"

### 2.3 兼容旧接口（已废弃，建议迁移）

> **警告**: 以下旧接口将在未来版本中移除，请尽快迁移到新的 `/api/bot/*` 接口。

#### 2.3.1 添加黑名单条目（旧接口）
- **接口地址**: `/api/add`
- **请求方法**: `POST`
- **鉴权**: **需要（Bot Token）**
- **其他限制**: 频率限制 + IP限制
- **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user",
      "reason": "发布违规广告",
      "level": 3
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 是 | 加入黑名单的原因 |
  | `level` | int | 否 | 严重等级（1-4），默认1。详见[黑名单严重等级说明](#黑名单严重等级说明) |
- **说明**: 
  - 功能同 `/api/bot/add`，保留用于兼容旧版Bot
  - **注意**: 同样不支持添加等级4（严重违规）记录

#### 2.3.2 删除黑名单条目（旧接口）
- **接口地址**: `/api/delete`
- **请求方法**: `POST`
- **鉴权**: **需要（Bot Token）**
- **其他限制**: 频率限制 + IP限制
- **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user",
      "reason": "误判，已核实"
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 否 | 移除原因/备注，将记录到审计日志 |
- **说明**: 功能同 `/api/bot/delete`，保留用于兼容旧版Bot。建议提供 `reason` 参数记录移除原因

---

## 3. 申诉接口（前端用）

### 3.1 提交申诉
- **接口地址**: `/api/appeals`
- **请求方法**: `POST`
- **鉴权**: 不需要
- **说明**:
  - 支持两种方式提交：**表单上传**（推荐）或 **JSON**
  - 表单上传可一次性完成文件上传、人机验证和申诉提交
  - 人机验证数据必须与 `user_id` 一致
- **方式一：表单上传（multipart/form-data）⭐ 推荐**
  - 支持同时上传图片文件和提交申诉数据
  - 一次性完成所有操作，无需单独调用上传接口
  
  **请求示例**:
  ```http
  POST /api/appeals
  Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
  
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="user_id"
  
  1234567890
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="user_type"
  
  user
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="content"
  
  申诉内容详细说明...
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="contact_email"
  
  user@example.com
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="geetest_lot_number"
  
  验证流水号
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="geetest_captcha_output"
  
  验证输出信息
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="geetest_pass_token"
  
  验证通过标识
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="geetest_gen_time"
  
  验证通过时间戳
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="files"; filename="screenshot1.jpg"
  Content-Type: image/jpeg
  
  [图片文件内容]
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="files"; filename="screenshot2.png"
  Content-Type: image/png
  
  [图片文件内容]
  ------WebKitFormBoundary--
  ```

- **方式二：JSON（application/json）**
  - 图片需先通过上传接口获取URL
  
  **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user",
      "content": "申诉内容详细说明...",
      "contact_email": "user@example.com",
      "images": ["/uploads/appeals/xxx.jpg", "/uploads/appeals/yyy.png"],
      "geetest": {
          "lot_number": "验证流水号",
          "captcha_output": "验证输出信息",
          "pass_token": "验证通过标识",
          "gen_time": "验证通过时间戳"
      }
  }
  ```

- **参数说明**（表单方式字段名与JSON方式对应）：
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(个人QQ，默认)、`group`(群号) |
  | `content` | string | 是 | 申诉内容，最多2000字 |
  | `contact_email` | string | 是 | 联系邮箱 |
  | **表单特有** ||||
  | `files` | File[] | **是** | 图片文件（可多选），**至少1张，最多3张**，最大5MB |
  | `geetest_lot_number` | string | 条件 | 极验验证流水号 |
  | `geetest_captcha_output` | string | 条件 | 极验验证输出信息 |
  | `geetest_pass_token` | string | 条件 | 极验验证通过标识 |
  | `geetest_gen_time` | string | 条件 | 极验验证通过时间戳 |
  | **JSON特有** ||||
  | `images` | array | **是** | 图片URL列表，**至少1张**，最多3张 |
  | `geetest` | object | 否 | 极验验证数据对象 |
  | `geetest.lot_number` | string | 条件 | 验证流水号 |
  | `geetest.captcha_output` | string | 条件 | 验证输出信息 |
  | `geetest.pass_token` | string | 条件 | 验证通过标识 |
  | `geetest.gen_time` | string | 条件 | 验证通过时间戳 |

- **文件限制说明**（表单上传时）：
  - 文件大小：单张最大5MB
  - 文件类型：png, jpg, jpeg, gif, webp
  - 数量限制：**至少1张，最多3张**
  - 去重机制：系统基于MD5哈希自动去重，重复图片直接返回已有路径

- **安全检查说明**（多层防护）：
  系统对上传的文件执行严格的安全检查，包括：
  
  | 检查层级 | 检查内容 | 拒绝情况 |
  | :--- | :--- | :--- |
  | **扩展名黑名单** | 检查危险扩展名（如 .exe, .php, .jsp 等） | 发现危险扩展名立即拒绝 |
  | **双扩展名检查** | 检测双扩展名攻击（如 .jpg.php） | 发现可疑双扩展名立即拒绝 |
  | **扩展名白名单** | 只允许 png, jpg, jpeg, gif, webp | 其他扩展名被拒绝 |
  | **魔数验证** | 验证文件头签名（Magic Number） | 文件头不匹配则拒绝 |
  | **类型一致性** | 对比扩展名与实际文件类型 | 扩展名欺骗（如 .png 实际是 .exe）被拒绝 |
  | **文件完整性** | 检查图片文件是否完整 | 损坏或不完整的图片被拒绝 |
  | **内容检测** | 检测常见恶意文件签名 | 发现可执行文件、脚本等立即拒绝 |
  
  **支持的文件类型魔数**：
  - PNG: `89 50 4E 47 0D 0A 1A 0A`
  - JPEG: `FF D8 FF`
  - GIF: `47 49 46 38` (GIF87a/GIF89a)
  - WebP: `52 49 46 46` + `57 45 42 50` (RIFF + WEBP)
  
  **错误响应示例**（安全检查失败）：
  ```json
  {
      "success": false,
      "message": "文件安全检查失败: 文件扩展名与内容不匹配: 声称 jpg 但实际为 png"
  }
  ```
  ```json
  {
      "success": false,
      "message": "文件安全检查失败: 检测到不安全的文件类型: PHP脚本"
  }
  ``` |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "申诉提交成功",
      "data": {
          "appeal_id": "a1b2c3d4e5f6g7h8",
          "status": "pending",
          "user_type": "user",
          "created_at": "2026-03-16 10:30:00"
      }
  }
  ```
- **错误响应示例**（未上传图片）：
```json
{
    "success": false,
    "message": "必须上传至少一张图片作为申诉证明"
}
```

**重复提交响应示例**（已有进行中的申诉）：
  ```json
  {
      "success": false,
      "message": "您已有一个正在处理中的申诉，请勿重复提交",
      "existing_appeal_id": "a1b2c3d4e5f6g7h8"
  }
  ```

### 3.2 查询申诉详情
- **接口地址**: `/api/appeals/{appeal_id}`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号，用于验证是否本人的申诉 |
  | `user_type` | string | 否 | 类型：`user`(个人)、`group`(群号)，不指定则不验证类型 |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "appeal_id": "a1b2c3d4e5f6g7h8",
          "user_id": "1234567890",
          "user_type": "user",
          "content": "申诉内容...",
          "contact_email": "user@example.com",
          "images": [],
          "status": "approved",
          "created_at": "2026-03-16 10:30:00",
          "updated_at": "2026-03-16 14:20:00",
          "review": {
              "action": "approve",
              "reason": "经核实，用户已改正",
              "admin_id": "admin_001",
              "admin_name": "超级管理员",
              "reviewed_at": "2026-03-16 14:20:00"
          }
      }
  }
  ```

### 3.3 修改申诉
- **接口地址**: `/api/appeals/{appeal_id}`
- **请求方法**: `PUT`
- **鉴权**: 不需要
- **说明**: 
  - 仅允许修改状态为 `pending` 的申诉
  - 支持通过 `update_reason` 字段记录修改原因，将写入审计日志
- **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "update_reason": "补充更多证据材料",
      "content": "修改后的申诉内容",
      "contact_email": "new@example.com",
      "images": ["/uploads/appeals/xxx.jpg"]
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `update_reason` | string | 否 | 修改原因/备注，将记录到审计日志 |
  | `content` | string | 否 | 新的申诉内容，最多2000字 |
  | `contact_email` | string | 否 | 新的联系邮箱 |
  | `images` | array | 否 | 新的图片URL列表，最多3张 |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "申诉已更新",
      "data": {
          "appeal_id": "a1b2c3d4e5f6g7h8",
          "user_id": "1234567890",
          "content": "修改后的申诉内容",
          "status": "pending",
          "updated_at": "2026-03-16 14:30:00"
      }
  }
  ```

### 3.4 删除申诉
- **接口地址**: `/api/appeals/{appeal_id}`
- **请求方法**: `DELETE`
- **鉴权**: 不需要
- **说明**: 
  - 仅允许删除状态为 `pending` 的申诉
  - 支持通过 `delete_reason` 字段记录删除原因，将写入审计日志
- **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "delete_reason": "申诉内容填写错误，准备重新提交"
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `delete_reason` | string | 否 | 删除原因/备注，将记录到审计日志 |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "申诉已删除",
      "data": {
          "appeal_id": "a1b2c3d4e5f6g7h8",
          "deleted": true
      }
  }
  ```

### 3.5 获取用户所有申诉
- **接口地址**: `/api/appeals/user/{user_id}`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_type` | string | 否 | 类型：`user`(个人)、`group`(群号)，不指定则同时查询个人和群号 |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": [
          {
              "appeal_id": "a1b2c3d4e5f6g7h8",
              "user_id": "1234567890",
              "user_type": "user",
              "content": "申诉内容...",
              "status": "pending",
              "created_at": "2026-03-16 10:30:00"
          }
      ]
  }
  ```

### 3.6 访问上传的文件
- **接口地址**: `/uploads/{path:filename}`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 直接访问上传的图片文件，支持子目录访问（如 `/uploads/appeals/xxx.jpg`）

### 3.7 获取公共统计数据
- **接口地址**: `/api/statistics`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 获取系统统计数据，用于展示在公开页面上
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "processed_appeals": 128,
          "blacklist_count": 256,
          "success_rate": 75.5,
          "avg_processing_hours": 12.5
      }
  }
  ```
- **字段说明**:
  | 字段名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `processed_appeals` | int | 已处理申诉总数（包含已批准和已退回） |
  | `blacklist_count` | int | 当前黑名单用户数量 |
  | `success_rate` | float | 申诉成功率（%），即已批准申诉占已处理申诉的比例 |
  | `avg_processing_hours` | float | 平均处理时间（小时），从申诉提交到审核完成的平均时长 |

---

## 4. 黑名单举报接口（公共接口）

> **说明**: 黑名单举报接口允许用户提交想要拉黑的人的信息，复用了申诉接口的组件（文件上传、极验验证、邮件通知等）。

### 4.1 提交黑名单举报
- **接口地址**: `/api/blacklist/reports`
- **请求方法**: `POST`
- **鉴权**: 不需要
- **说明**:
  - 支持两种方式提交：**表单上传**（推荐）或 **JSON**
  - 表单上传可一次性完成文件上传、人机验证和举报提交
  - 人机验证数据必须与 `target_user_id` 一致
- **方式一：表单上传（multipart/form-data）⭐ 推荐**
  - 支持同时上传图片文件和提交举报数据
  - 一次性完成所有操作，无需单独调用上传接口
  
  **请求示例**:
  ```http
  POST /api/blacklist/reports
  Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
  
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="target_user_id"
  
  1234567890
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="target_user_type"
  
  user
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="reason"
  
  该用户多次发布违规广告...
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="reporter_contact"
  
  reporter@example.com
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="reporter_user_id"
  
  987654321
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="geetest_lot_number"
  
  验证流水号
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="geetest_captcha_output"
  
  验证输出信息
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="geetest_pass_token"
  
  验证通过标识
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="geetest_gen_time"
  
  验证通过时间戳
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="files"; filename="screenshot1.jpg"
  Content-Type: image/jpeg
  
  [图片文件内容]
  ------WebKitFormBoundary--
  ```

- **方式二：JSON（application/json）**
  - 图片需先通过上传接口获取URL
  
  **请求体**:
  ```json
  {
      "target_user_id": "1234567890",
      "target_user_type": "user",
      "reason": "该用户多次发布违规广告，请核实处理",
      "reporter_contact": "reporter@example.com",
      "reporter_user_id": "987654321",
      "evidence": ["/uploads/reports/xxx.jpg", "/uploads/reports/yyy.png"],
      "geetest": {
          "lot_number": "验证流水号",
          "captcha_output": "验证输出信息",
          "pass_token": "验证通过标识",
          "gen_time": "验证通过时间戳"
      }
  }
  ```

- **参数说明**（表单方式字段名与JSON方式对应）：
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `target_user_id` | string | 是 | 被举报的用户ID或群号 |
  | `target_user_type` | string | 否 | 类型：`user`(个人，默认)、`group`(群聊) |
  | `reason` | string | 是 | 举报原因，最多2000字 |
  | `reporter_contact` | string | 否 | 举报人联系方式（邮箱） |
  | `reporter_user_id` | string | 否 | 举报人用户ID |
  | **表单特有** ||||
  | `files` | File[] | **是** | 证据图片文件（可多选），**至少1张，最多3张**，最大5MB |
  | `geetest_lot_number` | string | 条件 | 极验验证流水号 |
  | `geetest_captcha_output` | string | 条件 | 极验验证输出信息 |
  | `geetest_pass_token` | string | 条件 | 极验验证通过标识 |
  | `geetest_gen_time` | string | 条件 | 极验验证通过时间戳 |
  | **JSON特有** ||||
  | `evidence` | array | **是** | 证据图片URL列表，**至少1张**，最多3张 |
  | `geetest` | object | 否 | 极验验证数据对象 |
  | `geetest.lot_number` | string | 条件 | 验证流水号 |
  | `geetest.captcha_output` | string | 条件 | 验证输出信息 |
  | `geetest.pass_token` | string | 条件 | 验证通过标识 |
  | `geetest.gen_time` | string | 条件 | 验证通过时间戳 |

- **文件限制说明**（表单上传时）：
  - 文件大小：单张最大5MB
  - 文件类型：png, jpg, jpeg, gif, webp
  - 数量限制：**至少1张，最多3张**
  - 去重机制：系统基于MD5哈希自动去重，重复图片直接返回已有路径

- **安全检查说明**：同申诉接口，系统对上传的文件执行严格的安全检查

- **响应示例**:
  ```json
  {
      "success": true,
      "message": "举报提交成功，管理员会尽快审核",
      "data": {
          "report_id": "a1b2c3d4e5f6g7h8",
          "status": "pending",
          "target_user_type": "user",
          "created_at": "2026-03-28 22:30:00"
      }
  }
  ```
- **错误响应示例**（未上传图片）：
  ```json
  {
      "success": false,
      "message": "必须上传至少一张图片作为举报证明"
  }
  ```

### 4.2 查询举报详情
- **接口地址**: `/api/blacklist/reports/{report_id}`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 用于举报人查询自己提交的举报状态
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "report_id": "a1b2c3d4e5f6g7h8",
          "target_user_id": "1234567890",
          "target_user_type": "user",
          "reason": "该用户多次发布违规广告",
          "evidence": ["/uploads/reports/xxx.jpg"],
          "status": "pending",
          "created_at": "2026-03-28 22:30:00",
          "updated_at": "2026-03-28 22:30:00",
          "reviewed_at": null
      }
  }
  ```
- **字段说明**:
  | 字段名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `report_id` | string | 举报ID |
  | `target_user_id` | string | 被举报用户ID |
  | `target_user_type` | string | 被举报者类型：`user`/`group` |
  | `reason` | string | 举报原因 |
  | `evidence` | array | 证据图片URL列表 |
  | `status` | string | 状态：`pending`(待处理)/`approved`(已通过)/`rejected`(已拒绝) |
  | `created_at` | string | 创建时间 |
  | `updated_at` | string | 更新时间 |
  | `reviewed_at` | string | 审核时间（未审核时为null） |

### 4.3 获取极验配置
- **接口地址**: `/api/blacklist/reports/geetest-config`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 获取极验 GT4 配置（黑名单举报页面使用）
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "enabled": true,
          "captcha_id": "76443218de0908087c97c1e5f9a59272"
      }
  }
  ```

---

## 5. 管理接口（管理员用）

### 5.1 获取申诉列表
- **接口地址**: `/api/admin/appeals`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **请求参数":
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `status` | string | 状态筛选：pending/approved/rejected |
  | `page` | int | 页码（默认1） |
  | `per_page` | int | 每页数量（默认20，最大100） |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "appeal_id": "a1b2c3d4e5f6g7h8",
                  "user_id": "123456789",
                  "user_type": "user",
                  "content": "申诉内容...",
                  "contact_email": "user@example.com",
                  "status": "pending",
                  "created_at": "2026-03-16 14:20:00",
                  "ai_analysis": {
                      "status": "completed",
                      "recommendation": "通过"
                  }
              }
          ],
          "total": 100,
          "page": 1,
          "per_page": 20,
          "pages": 5
      }
  }
  ```
- **AI分析字段说明**:
  | 字段名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `ai_analysis.status` | string | AI分析状态：`pending`(分析中)/`completed`(已完成)/`failed`(失败)/`null`(未开始) |
  | `ai_analysis.recommendation` | string | AI建议：仅在`completed`状态时返回，值为`通过`/`拒绝`/`需更多信息`/`需人工判断` |

### 5.2 获取申诉详情
- **接口地址**: `/api/admin/appeals/{appeal_id}`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 返回申诉详情，包含完整的AI分析结果（如果已完成）
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "appeal_id": "a1b2c3d4e5f6g7h8",
          "user_id": "123456789",
          "user_type": "user",
          "content": "申诉内容...",
          "contact_email": "user@example.com",
          "images": ["uploads/appeals/xxx.jpg"],
          "status": "pending",
          "created_at": "2026-03-16 14:20:00",
          "updated_at": "2026-03-16 14:20:00",
          "review": null,
          "ai_analysis": {
              "status": "completed",
              "result": {
                  "summary": "申诉要点总结...",
                  "reason_analysis": "理由合理性分析...",
                  "recommendation": "通过",
                  "confidence": 85,
                  "suggestions": "具体建议...",
                  "risk_factors": ["风险点1"]
              },
              "updated_at": "2026-03-19 15:31:20"
          }
      }
  }
  ```
- **AI分析字段说明**:
  | 字段名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `ai_analysis.status` | string | AI分析状态：`pending`/`completed`/`failed` |
  | `ai_analysis.result` | object | 完整分析结果（仅在`completed`状态时返回） |
  | `ai_analysis.result.summary` | string | 申诉要点总结 |
  | `ai_analysis.result.reason_analysis` | string | 理由合理性分析 |
  | `ai_analysis.result.recommendation` | string | AI建议：`通过`/`拒绝`/`需更多信息`/`需人工判断` |
  | `ai_analysis.result.confidence` | int | 置信度（0-100） |
  | `ai_analysis.result.suggestions` | string | 具体建议 |
  | `ai_analysis.result.risk_factors` | array | 风险点列表 |
  | `ai_analysis.error` | string | 错误信息（仅在`failed`状态时返回） |
  | `ai_analysis.updated_at` | string | 分析更新时间 |
  
  **注意**: `ai_analysis` 字段可能为 `null`，表示该申诉尚未开始AI分析。

### 5.3 审核申诉
- **接口地址**: `/api/admin/appeals/{appeal_id}/review`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **请求体":
  ```json
  {
      "action": "approve",
      "reason": "经核实，用户已改正",
      "remove_from_blacklist": true
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `action` | string | 是 | 操作类型：approve(批准)/reject(退回) |
  | `reason` | string | 是 | 操作原因说明，最多1000字 |
  | `remove_from_blacklist` | bool | 否 | 批准时是否同时从黑名单移除（默认true） |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "审核完成",
      "data": {
          "appeal_id": "a1b2c3d4e5f6g7h8",
          "status": "approved",
          "review": {
              "action": "approve",
              "reason": "经核实，用户已改正",
              "admin_id": "admin_001",
              "admin_name": "超级管理员",
              "reviewed_at": "2026-03-16 14:20:00"
          }
      }
  }
  ```

### 5.4 获取统计数据
- **接口地址**: `/api/admin/stats`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **响应示例":
  ```json
  {
      "success": true,
      "data": {
          "pending_appeals": 5,
          "total_appeals": 128,
          "blacklist_count": 256
      }
  }
  ```

### 5.5 获取黑名单列表（管理端）
- **接口地址**: `/api/admin/blacklist`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **请求参数":
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `search` | string | 搜索关键词（搜索user_id/reason/added_by） |
  | `user_type` | string | 类型筛选：`user`(用户)、`group`(群聊) |
  | `page` | int | 页码（默认1） |
  | `per_page` | int | 每页数量（默认50，最大200） |
- **响应示例**: 同 4.1 格式

### 5.6 手动添加黑名单（管理端）
- **接口地址**: `/api/admin/blacklist`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**:
  - 支持两种方式提交：**表单上传**（推荐）或 **JSON**
  - 表单上传可一次性完成文件上传和黑名单添加
  - **必须提供至少一张图片证明**才能添加黑名单
- **方式一：表单上传（multipart/form-data）⭐ 推荐**
  - 支持同时上传图片文件和提交黑名单数据
  - 一次性完成所有操作，无需单独调用上传接口
  
  **请求示例**:
  ```http
  POST /api/admin/blacklist
  Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
  
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="user_id"
  
  1234567890
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="user_type"
  
  user
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="reason"
  
  该用户多次发布违规广告，情节严重
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="level"
  
  3
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="files"; filename="screenshot1.jpg"
  Content-Type: image/jpeg
  
  [图片文件内容]
  ------WebKitFormBoundary
  Content-Disposition: form-data; name="files"; filename="screenshot2.png"
  Content-Type: image/png
  
  [图片文件内容]
  ------WebKitFormBoundary--
  ```

- **方式二：JSON（application/json）**
  - 图片需先通过上传接口获取URL
  
  **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user",
      "reason": "严重违规",
      "level": 4,
      "evidence": ["/uploads/blacklist_evidence/xxx.jpg", "/uploads/blacklist_evidence/yyy.png"]
  }
  ```

- **参数说明**（表单方式字段名与JSON方式对应）：
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 是 | 加入黑名单的原因 |
  | `level` | int | 否 | 严重等级（1-4），默认1。详见[黑名单严重等级说明](#黑名单严重等级说明) |
  | **表单特有** ||||
  | `files` | File[] | **是** | 证据图片文件（可多选），**至少1张，最多3张**，最大5MB |
  | **JSON特有** ||||
  | `evidence` | array | **是** | 证据图片URL列表，**至少1张**，最多3张 |

- **文件限制说明**（表单上传时）：
  - 文件大小：单张最大5MB
  - 文件类型：png, jpg, jpeg, gif, webp
  - 数量限制：**至少1张，最多3张**
  - 去重机制：系统基于MD5哈希自动去重，重复图片直接返回已有路径

- **安全检查说明**：同申诉接口，系统对上传的文件执行严格的安全检查

- **响应示例**（等级1-3直接添加成功）:
  ```json
  {
      "success": true,
      "message": "添加用户成功",
      "data": {
          "blacklist": [
              {
                  "user_id": "1234567890",
                  "user_type": "user",
                  "reason": "严重违规",
                  "level": 3,
                  "added_by": "admin:张三",
                  "added_at": "2026-03-22 21:50:00"
              }
          ],
          "updateAt": "2026-03-22 21:50:00"
      }
  }
  ```
- **响应示例**（等级4提交待确认）:
  ```json
  {
      "success": true,
      "message": "严重违规记录已提交，需要另一名管理员确认后才能生效",
      "data": {
          "confirmation_id": 123,
          "status": "pending",
          "user_id": "1234567890",
          "level": 4,
          "first_admin": "admin:张三",
          "created_at": "2026-03-22 21:50:00"
      }
  }
  ```
- **错误响应示例**（未上传图片）：
  ```json
  {
      "success": false,
      "message": "必须上传至少一张图片作为添加黑名单的证明"
  }
  ```

### 5.6a 获取等级4待确认列表
- **接口地址**: `/api/admin/blacklist/level4-pending`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `status` | string | 否 | 状态筛选：`pending`(待确认)、`confirmed`(已确认)、`cancelled`(已取消)、`all`(全部)，默认`pending` |
  | `page` | int | 否 | 页码，默认1 |
  | `per_page` | int | 否 | 每页数量，默认20，最大100 |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "id": 123,
                  "user_id": "1234567890",
                  "user_type": "user",
                  "reason": "诈骗行为",
                  "first_admin_id": "admin001",
                  "first_admin_name": "张三",
                  "first_confirmed_at": "2026-03-22 21:50:00",
                  "second_admin_id": null,
                  "second_admin_name": null,
                  "second_confirmed_at": null,
                  "status": "pending",
                  "created_at": "2026-03-22 21:50:00",
                  "updated_at": "2026-03-22 21:50:00"
              }
          ],
          "total": 1,
          "page": 1,
          "per_page": 20,
          "pages": 1
      }
  }
  ```

### 5.6b 确认等级4记录
- **接口地址**: `/api/admin/blacklist/level4-confirm`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 第二名管理员确认待处理的等级4记录，确认后用户正式加入黑名单
- **请求体**:
  ```json
  {
      "confirmation_id": 123
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `confirmation_id` | int | 是 | 待确认记录ID |
- **响应示例**（确认成功）:
  ```json
  {
      "success": true,
      "message": "确认成功，该用户已正式加入黑名单",
      "data": {
          "user_id": "1234567890",
          "user_type": "user",
          "level": 4,
          "confirmed_by": [
              "admin:张三",
              "admin:李四"
          ],
          "added_at": "2026-03-22 21:55:00"
      }
  }
  ```
- **响应示例**（自己不能确认自己）:
  ```json
  {
      "success": false,
      "message": "您不能确认自己提交的等级4记录"
  }
  ```

### 5.6c 取消等级4待确认
- **接口地址**: `/api/admin/blacklist/level4-pending/{confirmation_id}`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 取消待确认的等级4记录。只有提交者本人或超级管理员（等级4）可以取消
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `reason` | string | 否 | 取消原因 |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "待确认记录已取消"
  }
  ```
- **响应示例**（无权限）:
  ```json
  {
      "success": false,
      "message": "只有提交者本人或超级管理员可以取消"
  }
  ```

### 5.7 手动移除黑名单（管理端）
- **接口地址**: `/api/admin/blacklist/delete`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **请求体":
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user",
      "reason": "已申诉通过"
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 否 | 移除原因 |
- **响应示例**: 同 2.4

### 5.8 删除黑名单条目（RESTful风格）
- **接口地址**: `/api/admin/blacklist/{user_id}`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 
  - RESTful风格的删除接口，与 [4.7 手动移除黑名单](#47-手动移除黑名单管理端) 功能相同
  - 路径中的 `user_id` 可以是用户ID或群号
  - 通过 `user_type` 参数区分个人用户和群聊
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 否 | 移除原因，默认"管理员删除" |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "删除用户成功"
  }
  ```
- **响应示例**（用户不存在）:
  ```json
  {
      "success": false,
      "message": "用户不在黑名单中"
  }
  ```

**使用示例**:
```bash
# 删除用户（默认 user_type=user）
DELETE /api/admin/blacklist/105823395

# 删除群聊
DELETE /api/admin/blacklist/-123456789?user_type=group

# 带原因
DELETE /api/admin/blacklist/105823395?reason=误封已处理
```

### 5.9 修改黑名单条目
- **接口地址**: `/api/admin/blacklist/{user_id}`
- **请求方法**: `PUT`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 修改黑名单条目（支持修改原因、等级、ID、类型）
- **请求体":
  ```json
  {
      "user_type": "user",           // 原类型，可选，默认"user"
      "reason": "新的违规原因",     // 可选
      "level": 3,                    // 可选，修改严重等级
      "new_user_id": "新QQ号",      // 可选，用于修改ID
      "new_user_type": "group"      // 可选，用于修改类型
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_type` | string | 否 | 原类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 否 | 新的违规原因 |
  | `level` | int | 否 | 严重等级（1-4） |
  | `new_user_id` | string | 否 | 新的用户ID或群号 |
  | `new_user_type` | string | 否 | 新的类型：`user`或`group` |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "更新成功",
      "data": {
          "user_id": "1234567890",
          "user_type": "user",
          "reason": "新的违规原因",
          "level": 3,
          "added_by": "bot:xxx",
          "added_at": "2026-03-16 10:00:00",
          "updated_at": "2026-03-16 14:00:00"
      }
  }
  ```

### 5.10 删除申诉（管理员用）
- **接口地址**: `/api/admin/appeals/{appeal_id}`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 
  - 管理员可删除任意状态的申诉
  - 支持通过 `reason` 参数或请求体中的 `delete_reason` 字段记录删除原因
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `reason` | string | 否 | 删除原因（URL参数） |
- **请求体**:
  ```json
  {
      "delete_reason": "申诉内容涉及敏感信息，应用户要求删除"
  }
  ```
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "申诉已删除",
      "data": {
          "appeal_id": "a1b2c3d4e5f6g7h8",
          "deleted": true
      }
  }
  ```

### 5.11 清理已处理申诉
- **接口地址**: `/api/admin/appeals/clear-processed`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（仅超级管理员可操作）
- **说明**: 
  - 一键清理所有已处理的申诉（approved 和 rejected 状态）
  - 支持按天数筛选，只清理指定天数前已处理的申诉
  - **pending 状态的申诉不会被删除**
  - 操作会立即同步到磁盘
- **请求体**:
  ```json
  {
      "days": 30  // 可选，只删除30天前已处理的申诉，不传则删除所有已处理的
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `days` | int | 否 | 天数阈值，只删除该天数前已处理的申诉，不传则删除所有已处理的 |
- **响应示例**（成功清理）:
  ```json
  {
      "success": true,
      "message": "已清理 15 条已处理申诉",
      "data": {
          "deleted_count": 15,
          "details": ["appeal_id_1", "appeal_id_2", "..."],
          "days_threshold": 30
      }
  }
  ```
- **响应示例**（没有可清理的申诉）:
  ```json
  {
      "success": true,
      "message": "没有需要清理的已处理申诉",
      "data": {
          "deleted_count": 0,
          "details": [],
          "days_threshold": 30
      }
  }
  ```
- **响应示例**（参数错误）:
  ```json
  {
      "success": false,
      "message": "days 必须大于等于0"
  }
  ```
- **使用场景**:
  1. **定期清理**: 设置定时任务，每月清理30天前的已处理申诉，保持数据库精简
  2. **批量清理**: 在申诉积压严重时，批量清理所有历史已处理申诉
  3. **数据归档**: 清理前可先导出/备份数据，然后清理本地记录

### 5.12 管理员登录
- **接口地址**: `/api/admin/login`
- **请求方法**: `POST`
- **鉴权**: 不需要
- **说明**: 
  - 使用 **admin_id + password** 登录
  - 成功后返回临时 token（有效期1小时，可配置）
  - **后续所有管理员操作必须使用临时 token**
  - 禁止直接使用永久 password 进行操作
- **请求体**:
  ```json
  {
      "admin_id": "pimeng",
      "password": "your_password_here",
      "geetest": {
          "lot_number": "验证流水号",
          "captcha_output": "验证输出信息",
          "pass_token": "验证通过标识",
          "gen_time": "验证通过时间戳"
      }  // 如果启用了极验验证
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `admin_id` | string | 是 | 管理员ID |
  | `password` | string | 是 | 管理员密码 |
  | `geetest` | object | 否 | 极验验证数据（如启用） |
  | `geetest.lot_number` | string | 是 | 验证流水号（如启用） |
  | `geetest.captcha_output` | string | 是 | 验证输出信息（如启用） |
  | `geetest.pass_token` | string | 是 | 验证通过标识（如启用） |
  | `geetest.gen_time` | string | 是 | 验证通过时间戳（如启用） |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "登录成功",
      "data": {
          "admin_id": "pimeng",
          "name": "皮梦",
          "level": 4,
          "avatar": "https://example.com/avatar.png",
          "temp_token": "550e8400-e29b-41d4-a716-446655440000",
          "expires_in": 3600
      }
  }
  ```
- **错误响应**（使用永久 password 直接操作）：
  ```json
  {
      "success": false,
      "message": "请使用临时 token 进行操作，请先调用登录接口获取临时 token"
  }
  ```

### 5.13 管理员登出
- **接口地址**: `/api/admin/logout`
- **请求方法**: `POST`
- **鉴权**: **需要（临时 Token）**
- **说明**: 任何等级的管理员都可以登出，使当前临时 token 立即失效
- **请求头**:
  - `Authorization`: 临时 token
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "登出成功"
  }
  ```
- **注意**: 
  - 登出后该临时 token 将无法再用于任何操作
  - 如需继续操作需要重新登录获取新的临时 token

### 5.13a 统一认证登出（支持 SSO）
- **接口地址**: `/api/auth/logout`
- **请求方法**: `POST`
- **鉴权**: 不需要（但传入 Token 会将其失效）
- **说明**: 
  - 统一登出接口，同时处理本地 token 失效和 Logto SSO 登出
  - 如启用了 Logto，可返回 SSO 登出跳转 URL
- **请求体**:
  ```json
  {
      "redirect": true  // 可选，是否返回 Logto 登出跳转 URL
  }
  ```
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "登出成功",
      "data": {
          "local_logout": true,
          "sso_logout_url": "https://login.pmnet.work/oidc/session/end?..."
      }
  }
  ```

### 5.14 获取极验配置
- **接口地址**: `/api/admin/geetest-config`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 获取极验 GT4 配置（管理员登录页面使用）
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "enabled": true,
          "captcha_id": "76443218de0908087c97c1e5f9a59272"
      }
  }
  ```

- **前端集成示例**（bind 模式，绑定到登录按钮）：
  ```html
  <script src="https://static.geetest.com/v4/gt4.js"></script>
  <button id="login-btn">登录</button>
  
  <script>
  // 获取配置后初始化
  fetch('/api/admin/geetest-config')
    .then(res => res.json())
    .then(config => {
      if (config.data.enabled) {
        initGeetest4({
          captchaId: config.data.captcha_id,
          product: 'bind'  // 隐藏按钮类型
        }, function(captchaObj) {
          document.getElementById('login-btn').addEventListener('click', function() {
            captchaObj.showCaptcha();
          });
          
          captchaObj.onSuccess(function() {
            var result = captchaObj.getValidate();
            // 提交登录请求
            fetch('/api/admin/login', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                admin_id: 'admin_id',
                password: 'password',
                geetest: {
                  lot_number: result.lot_number,
                  captcha_output: result.captcha_output,
                  pass_token: result.pass_token,
                  gen_time: result.gen_time
                }
              })
            });
          });
        });
      }
    });
  </script>
  ```

### 5.15 获取管理员列表
- **接口地址**: `/api/admin/admins`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **响应示例**:
  ```json
  {
      "success": true,
      "data": [
          {
              "admin_id": "admin_001",
              "name": "超级管理员",
              "level": 4,
              "created_at": "2026-03-16 00:00:00"
          }
      ]
  }
  ```

### 5.16 创建管理员
- **接口地址**: `/api/admin/admins`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（仅超级管理员可创建新管理员）
- **请求体**:
  ```json
  {
      "admin_id": "new_admin",
      "name": "新管理员",
      "password": "secure_password",
      "level": 3
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `admin_id` | string | 是 | 管理员唯一ID |
  | `name` | string | 是 | 管理员显示名称 |
  | `password` | string | 是 | 管理员密码（至少6位） |
  | `level` | int | 否 | 权限等级（1-4），默认为3 |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "管理员创建成功",
      "data": {
          "admin_id": "new_admin",
          "name": "新管理员",
          "level": 3
      }
  }
  ```

### 5.17 修改管理员信息
- **接口地址**: `/api/admin/admins/{admin_id}`
- **请求方法**: `PUT`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 
  - 等级 4：可修改任何管理员，包括等级
  - 等级 3：可修改自己的信息（但不能修改等级）
- **请求体**:
  ```json
  {
      "name": "新名称",         // 可选
      "password": "新密码",     // 可选
      "level": 3               // 可选，仅等级4可修改
  }
  ```
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "管理员信息更新成功",
      "data": {
          "admin_id": "admin_001",
          "name": "新名称",
          "level": 3
      }
  }
  ```

### 5.18 删除管理员
- **接口地址**: `/api/admin/admins/{admin_id}`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（仅超级管理员可删除其他管理员）
- **说明**: 
  - 不能删除当前登录的管理员自己
  - 系统必须保留至少一个超级管理员
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "管理员已删除",
      "data": {
          "admin_id": "admin_001",
          "deleted": true
      }
  }
  ```

### 5.18a 获取个人信息
- **接口地址**: `/api/admin/me`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **说明**: 获取当前登录管理员的详细信息
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "admin_id": "admin_001",
          "name": "管理员",
          "level": 4,
          "avatar": "https://example.com/avatar.png",
          "created_at": "2026-01-01 00:00:00",
          "force_sso": false,
          "logto": {
              "bound": true,
              "logto_id": "abc123",
              "logto_email": "user@example.com"
          }
      }
  }
  ```

### 5.18b 修改个人信息
- **接口地址**: `/api/admin/me`
- **请求方法**: `PUT`
- **鉴权**: **需要（管理员 Token）**
- **说明**: 修改当前登录管理员的个人信息（不含密码、Logto 绑定）
- **请求体**:
  ```json
  {
      "name": "新名称",
      "avatar": "https://example.com/new-avatar.png"
  }
  ```
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "个人信息更新成功",
      "data": { ... }
  }
  ```

### 5.18c 修改密码
- **接口地址**: `/api/admin/me/password`
- **请求方法**: `PUT`
- **鉴权**: **需要（管理员 Token）**
- **说明**: 修改当前登录管理员的密码
- **请求体**:
  ```json
  {
      "old_password": "旧密码",
      "new_password": "新密码"
  }
  ```
- **注意**: 如账户强制使用 SSO 登录，可能无法修改密码

### 5.19 获取 Bot Token 列表
- **接口地址**: `/api/admin/bots`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 返回所有 Bot Token 列表（不含实际 token 值）。如需查看 token 原文，请使用 [4.22 获取 Bot Token 原文](#422-获取-bot-token-原文) 接口。
- **响应示例**:
  ```json
  {
      "success": true,
      "data": [
          {
              "bot_name": "yll",
              "owner": "pimeng",
              "description": "皮梦的Bot",
              "created_at": "2026-03-16 00:00:00"
          }
      ]
  }
  ```

### 5.20 创建 Bot Token
- **接口地址**: `/api/admin/bots`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（仅超级管理员可创建）
- **请求体**:
  ```json
  {
      "bot_name": "new_bot",
      "owner": "admin_id",
      "description": "Bot描述",
      "token": "自定义token"  // 可选，不传则自动生成
  }
  ```
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "Bot Token 创建成功",
      "data": {
          "bot_name": "new_bot",
          "owner": "admin_id",
          "description": "Bot描述",
          "token": "自动生成的token值"
      }
  }
  ```

### 5.21 修改 Bot Token
- **接口地址**: `/api/admin/bots/{bot_name}`
- **请求方法**: `PUT`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 
  - 等级 4：可修改任何 Bot
  - 等级 1+：可修改自己的 Bot
- **请求体**:
  ```json
  {
      "description": "新描述",  // 可选
      "owner": "新所有者",      // 可选（仅等级4可修改）
      "token": "新token"        // 可选
  }
  ```
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "Bot Token 更新成功",
      "data": {
          "bot_name": "yll",
          "owner": "pimeng",
          "description": "新描述"
      }
  }
  ```

### 5.22 删除 Bot Token
- **接口地址**: `/api/admin/bots/{bot_name}`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 
  - 等级 4：可删除任何 Bot
  - 等级 1+：可删除自己的 Bot
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "Bot Token 已删除",
      "data": {
          "bot_name": "yll",
          "deleted": true
      }
  }
  ```

### 5.23 获取 Bot Token 原文
- **接口地址**: `/api/admin/bots/{bot_name}/token`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（仅超级管理员可查看 Token 原文）
- **说明**: 此接口仅返回指定 Bot 的 Token 原文，用于管理员查看或复制。此操作会被记录到审计日志。
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "bot_name": "mybot",
          "token": "完整的token字符串",
          "owner": "admin_id",
          "description": "Bot描述",
          "created_at": "2024-01-01 12:00:00"
      }
  }
  ```

### 5.24 获取系统配置
- **接口地址**: `/api/admin/config`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（超级管理员）
- **说明**: 获取系统核心配置信息（`config.json` 内容）
  
  注意：所有敏感信息（密码、密钥等）都会完整返回
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "host": "0.0.0.0",
          "port": 8080,
          "debug": false,
          "smtp": {
              "host": "smtp.example.com",
              "port": 465,
              "username": "user@example.com",
              "password": "actual_password"
          },
          "geetest": {
              "enabled": true,
              "captcha_id": "76443218de0908087c97c1e5f9a59272",
              "captcha_key": "your-geetest-captcha-key"
          }
      }
  }
  ```

### 5.25 更新系统配置
- **接口地址**: `/api/admin/config`
- **请求方法**: `PUT`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（超级管理员）
- **说明**: 
  - 部分更新配置，修改后需要重启生效。等级4管理员可以修改任何配置，包括敏感配置（smtp、geetest）
  - 支持通过 `_update_reason` 字段记录更新原因，将写入审计日志
- **请求体**:
  ```json
  {
      "_update_reason": "修改SMTP配置以支持新的邮件服务商",
      "port": 8080,
      "debug": false,
      "temp_token_ttl": 7200,
      "smtp": {
          "host": "smtp.example.com",
          "port": 465,
          "username": "user@example.com",
          "password": "new_password"
      },
      "geetest": {
          "enabled": true,
          "captcha_id": "76443218de0908087c97c1e5f9a59272",
          "captcha_key": "your-geetest-captcha-key"
      }
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `_update_reason` | string | 否 | 更新原因/备注，将记录到审计日志 |
  | 其他配置项 | - | 否 | 要更新的配置项，支持嵌套更新 |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "配置已更新，重启后生效",
      "data": {
          "host": "0.0.0.0",
          "port": 8080,
          "debug": false,
          "smtp": {...},
          "geetest": {...}
      }
  }
  ```
- **审计日志**: 配置更新会记录详细的审计日志，包括：
  - 更新的配置段列表 (`updated_sections`)
  - 更新的配置路径 (`updated_paths`)
  - 更新前的原值 (`original_values`，敏感值会被脱敏显示为 `***`)
  - 更新原因 (`update_reason`)

### 5.26 重启服务器
- **接口地址**: `/api/admin/restart`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（超级管理员）
- **说明**: 
  - 此操作会立即终止当前进程
  - **Docker 环境**: 容器会自动重新启动（需要配置 `restart: always` 或 `restart: unless-stopped`）
  - **非 Docker 环境**: 需要手动重新启动服务
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "服务器正在重启，Docker 将自动重新启动容器..."
  }
  ```

### 5.27 获取系统信息
- **接口地址**: `/api/admin/system-info`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 获取服务器运行状态、资源使用情况
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "platform": "Linux-5.4.0",
          "python_version": "3.9.0",
          "cpu_percent": 15.2,
          "memory": {
              "total": 8589934592,
              "available": 4294967296,
              "percent": 50.0
          },
          "disk": {
              "total": 107374182400,
              "used": 53687091200,
              "free": 53687091200,
              "percent": 50.0
          },
          "uptime": 86400
      }
  }
  ```

### 5.28 查询审计日志
- **接口地址**: `/api/admin/logs`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **说明**: 
  - **等级 4**: 可查看所有日志
  - **等级 3**: 可查看等级 3 及以下的日志（排除等级 4 的操作）
  - **等级 2 及以下**: 只能查看自己的日志
- **查询参数:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `action_type` | string | 操作类型筛选，如 `admin_login`, `blacklist_add` 等 |
  | `operator_id` | string | 操作者ID筛选 |
  | `operator_type` | string | 操作者类型筛选：`admin`/`bot`/`user` |
  | `status` | string | 状态筛选：`success`/`failure` |
  | `start_time` | string | 开始时间（格式：YYYY-MM-DD HH:MM:SS） |
  | `end_time` | string | 结束时间（格式：YYYY-MM-DD HH:MM:SS） |
  | `search` | string | 搜索关键词（在操作详情中搜索） |
  | `page` | int | 页码（默认1） |
  | `per_page` | int | 每页数量（默认50，最大200） |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "timestamp": "2026-03-19 14:30:00",
                  "action_type": "admin_login",
                  "operator_id": "pimeng",
                  "operator_type": "admin",
                  "operator_level": 4,
                  "details": {
                      "level": 4,
                      "success": true
                  },
                  "ip": "192.168.1.100",
                  "status": "success"
              },
              {
                  "timestamp": "2026-03-19 15:00:00",
                  "action_type": "blacklist_add",
                  "operator_id": "mybot",
                  "operator_type": "bot",
                  "details": {
                      "target_id": "123456789",
                      "user_type": "user",
                      "reason": "发布违规广告，多次警告无效"
                  },
                  "ip": "10.0.0.5",
                  "status": "success"
              },
              {
                  "timestamp": "2026-03-19 16:30:00",
                  "action_type": "blacklist_remove",
                  "operator_id": "admin_001",
                  "operator_type": "admin",
                  "operator_level": 3,
                  "details": {
                      "target_id": "123456789",
                      "user_type": "user",
                      "reason": "申诉已通过，核实无误"
                  },
                  "ip": "192.168.1.101",
                  "status": "success"
              },
              {
                  "timestamp": "2026-03-19 17:00:00",
                  "action_type": "appeal_review",
                  "operator_id": "admin_002",
                  "operator_type": "admin",
                  "operator_level": 2,
                  "details": {
                      "appeal_id": "APL-1234567890",
                      "action": "approve",
                      "reason": "用户提供了充分的证据，确认误封",
                      "remove_from_blacklist": true,
                      "user_id": "123456789"
                  },
                  "ip": "192.168.1.102",
                  "status": "success"
              }
          ],
          "total": 1000,
          "page": 1,
          "per_page": 50,
          "pages": 20
      }
  }
  ```
- **说明**: 通过 `details` 字段可以查看每项操作的详细原因和上下文信息，如拉黑原因、移除原因、审核原因等

### 5.29 获取日志统计
- **接口地址**: `/api/admin/logs/statistics`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **说明**: 
  - **等级 4**: 可查看所有日志统计
  - **等级 3**: 可查看等级 3 及以下的日志统计
  - **等级 2 及以下**: 只能查看自己的日志统计
- **查询参数**:
- **查询参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `days` | int | 统计最近几天的数据（默认7，范围1-365） |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "period_days": 7,
          "action_counts": {
              "admin_login": 50,
              "blacklist_add": 20,
              "appeal_create": 100
          },
          "top_operators": [
              ["pimeng", 30],
              ["raincore", 25]
          ],
          "daily_counts": {
              "2026-03-13": 20,
              "2026-03-14": 35,
              "2026-03-15": 25
          }
      }
  }
  ```

### 5.30 获取操作类型
- **接口地址**: `/api/admin/logs/action-types`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 获取所有支持的操作类型列表，用于日志查询筛选
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "admin_login": "管理员登录",
          "admin_logout": "管理员登出",
          "admin_create": "创建管理员",
          "admin_update": "更新管理员",
          "admin_delete": "删除管理员",
          "bot_create": "创建 Bot Token",
          "bot_update": "更新 Bot Token",
          "bot_delete": "删除 Bot Token",
          "blacklist_add": "添加黑名单",
          "blacklist_remove": "移除黑名单",
          "blacklist_update": "更新黑名单",
          "blacklist_check": "查询黑名单",
          "appeal_create": "创建申诉",
          "appeal_update": "更新申诉",
          "appeal_delete": "删除申诉",
          "appeal_review": "审核申诉",
          "appeal_query": "查询申诉",
          "appeal_clear_processed": "清理已处理申诉",
          "config_update": "更新系统配置",
          "system_restart": "系统重启",
          "file_upload": "文件上传",
          "ai_analysis_query": "查询AI分析",
          "ai_analysis_refresh": "刷新AI分析",
          "ai_analysis_delete": "删除AI分析缓存",
          "backup_status_query": "查询备份状态",
          "backup_list_query": "查询备份列表",
          "backup_create": "创建数据库备份",
          "backup_delete": "删除数据库备份",
          "backup_remark_update": "更新备份备注",
          "backup_config_update": "更新备份配置"
      }
  }
  ```

### 5.31 获取黑名单举报列表
- **接口地址**: `/api/admin/blacklist/reports`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 获取用户提交的黑名单举报列表，支持状态筛选和分页
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `status` | string | 否 | 状态筛选：`pending`(待处理)/`approved`(已通过)/`rejected`(已拒绝) |
  | `page` | int | 否 | 页码，默认1 |
  | `per_page` | int | 否 | 每页数量，默认20，最大100 |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "report_id": "a1b2c3d4e5f6g7h8",
                  "target_user_id": "123456789",
                  "target_user_type": "user",
                  "reason": "该用户多次发布违规广告",
                  "evidence": ["/uploads/reports/xxx.jpg"],
                  "reporter_contact": "reporter@example.com",
                  "reporter_user_id": "987654321",
                  "status": "pending",
                  "created_at": "2026-03-28 22:30:00",
                  "updated_at": "2026-03-28 22:30:00"
              }
          ],
          "total": 50,
          "page": 1,
          "per_page": 20,
          "pages": 3
      }
  }
  ```

### 5.32 获取黑名单举报详情
- **接口地址**: `/api/admin/blacklist/reports/{report_id}`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 获取单个举报的完整详情，包含所有证据图片
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "report_id": "a1b2c3d4e5f6g7h8",
          "target_user_id": "123456789",
          "target_user_type": "user",
          "reason": "该用户多次发布违规广告，请核实处理",
          "evidence": ["/uploads/reports/xxx.jpg", "/uploads/reports/yyy.png"],
          "reporter_contact": "reporter@example.com",
          "reporter_user_id": "987654321",
          "status": "pending",
          "admin_note": null,
          "created_at": "2026-03-28 22:30:00",
          "updated_at": "2026-03-28 22:30:00",
          "reviewed_at": null,
          "reviewed_by": null
      }
  }
  ```

### 5.33 审核黑名单举报
- **接口地址**: `/api/admin/blacklist/reports/{report_id}/review`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 
  - 批准举报时可选择是否将被举报用户加入黑名单
  - 等级4需要等级3+权限，且需要第二名管理员确认
- **请求体**:
  ```json
  {
      "action": "approve",
      "reason": "经核实，该用户确实存在违规行为",
      "admin_note": "已核实，证据充分",
      "add_to_blacklist": true,
      "level": 2
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `action` | string | 是 | 操作类型：`approve`(批准)/`reject`(拒绝) |
  | `reason` | string | 是 | 审核原因，最多1000字 |
  | `admin_note` | string | 否 | 管理员备注（仅内部可见） |
  | `add_to_blacklist` | bool | 否 | 批准时是否加入黑名单，默认true |
  | `level` | int | 否 | 加入黑名单时的等级（1-4），默认2 |
- **响应示例**（批准并加入黑名单）:
  ```json
  {
      "success": true,
      "message": "审核完成",
      "data": {
          "report_id": "a1b2c3d4e5f6g7h8",
          "status": "approved",
          "added_to_blacklist": true
      }
  }
  ```
- **响应示例**（等级4待确认）:
  ```json
  {
      "success": true,
      "message": "审核完成",
      "data": {
          "report_id": "a1b2c3d4e5f6g7h8",
          "status": "approved",
          "added_to_blacklist": "level4_pending"
      }
  }
  ```

### 5.34 删除黑名单举报
- **接口地址**: `/api/admin/blacklist/reports/{report_id}`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 管理员可删除任意状态的举报，建议提供删除原因
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `reason` | string | 否 | 删除原因（URL参数） |
- **请求体**（可选）:
  ```json
  {
      "delete_reason": "重复举报，已合并处理"
  }
  ```
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "举报已删除",
      "data": {
          "report_id": "a1b2c3d4e5f6g7h8",
          "deleted": true
      }
  }
  ```

### 5.35 获取举报AI分析
- **接口地址**: `/api/admin/blacklist/reports/{report_id}/ai-analysis`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 获取或触发举报的AI分析，如果分析已完成则返回缓存结果
- **响应示例**（分析已完成）:
  ```json
  {
      "success": true,
      "data": {
          "report_id": "a1b2c3d4e5f6g7h8",
          "ai_analysis": {
              "status": "completed",
              "result": {
                  "summary": "用户举报某用户发布赌博广告，提供了截图证据",
                  "reason_analysis": "举报理由具体，涉及赌博违法行为，有证据支持",
                  "recommendation": "通过",
                  "confidence": 85,
                  "suggestions": "建议核实截图证据，如属实应将用户加入黑名单",
                  "risk_factors": ["赌博广告", "诱导点击"],
                  "evidence_strength": 80,
                  "category": "违法广告",
                  "processing_time_ms": 3250
              },
              "updated_at": "2026-03-28 23:15:00"
          }
      }
  }
  ```
- **响应示例**（分析进行中）:
  ```json
  {
      "success": true,
      "data": {
          "report_id": "a1b2c3d4e5f6g7h8",
          "ai_analysis": {
              "status": "pending",
              "message": "AI分析正在进行中，请稍后查询"
          }
      }
  }
  ```
- **AI分析字段说明**:
  | 字段名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `status` | string | 分析状态：`pending`(分析中)/`completed`(已完成)/`failed`(失败) |
  | `result.summary` | string | 举报要点总结 |
  | `result.reason_analysis` | string | 举报理由合理性分析 |
  | `result.recommendation` | string | AI建议：`通过`/`拒绝`/`需更多信息` |
  | `result.confidence` | int | 置信度（0-100） |
  | `result.suggestions` | string | 具体建议 |
  | `result.risk_factors` | array | 风险点列表 |
  | `result.evidence_strength` | int | 证据强度（0-100） |
  | `result.category` | string | 举报类别：违法广告/骚扰/诈骗/证据不足/恶意举报/其他 |

### 5.36 刷新举报AI分析
- **接口地址**: `/api/admin/blacklist/reports/{report_id}/ai-analysis`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 强制重新进行AI分析，会覆盖之前的分析结果
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "AI分析已刷新",
      "data": {
          "report_id": "a1b2c3d4e5f6g7h8",
          "ai_analysis": {
              "status": "pending",
              "message": "AI分析正在进行中，请稍后查询"
          }
      }
  }
  ```

### 5.49 删除举报AI分析缓存
- **接口地址**: `/api/admin/blacklist/reports/{report_id}/ai-analysis`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 删除指定举报的AI分析缓存，清理后下次会重新分析
- **响应示例**（删除成功）:
  ```json
  {
      "success": true,
      "message": "AI分析缓存已删除"
  }
  ```
- **响应示例**（删除失败）:
  ```json
  {
      "success": false,
      "message": "删除失败，该举报可能没有AI分析缓存"
  }
  ```

### 5.50 批量分析举报
- **接口地址**: `/api/admin/blacklist/reports/ai-analysis/batch`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 批量提交多个举报进行AI分析，使用线程池并行处理，单次最多50条
- **请求体**:
  ```json
  {
      "report_ids": ["report_id_1", "report_id_2", "report_id_3"]
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `report_ids` | array | 是 | 举报ID数组，最多50个 |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "批量分析完成，成功 3 条，失败 0 条",
      "data": {
          "total": 3,
          "completed": 3,
          "failed": 0,
          "pending": 0,
          "results": [
              {
                  "report_id": "report_id_1",
                  "status": "completed",
                  "result": {
                      "summary": "举报要点总结",
                      "recommendation": "通过",
                      "confidence": 85,
                      "category": "违法广告"
                  },
                  "error": null
              }
          ]
      }
  }
  ```
- **返回字段说明**:
  | 字段名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `total` | int | 处理的举报总数 |
  | `completed` | int | 分析成功的数量 |
  | `failed` | int | 分析失败的数量 |
  | `pending` | int | 正在分析中的数量 |
  | `results` | array | 每个举报的分析结果详情 |

### 5.51 清理已处理举报
- **接口地址**: `/api/admin/blacklist/reports/clear-processed`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（仅超级管理员可操作）
- **说明**: 一键清理已审核（approved/rejected状态）的举报记录，释放数据库空间
- **请求体**（可选）:
  ```json
  {
      "days": 30
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `days` | int | 否 | 只清理指定天数前处理的举报，不传则清理所有已处理举报 |
- **响应示例**（清理成功）:
  ```json
  {
      "success": true,
      "message": "已清理 15 条已处理举报",
      "data": {
          "deleted_count": 15,
          "days_threshold": 30,
          "details": ["report_id_1", "report_id_2", "..."]
      }
  }
  ```
- **响应示例**（无数据可清理）:
  ```json
  {
      "success": true,
      "message": "没有需要清理的已处理举报",
      "data": {
          "deleted_count": 0,
          "days_threshold": 30,
          "details": []
      }
  }
  ```
- **使用场景**:
  1. **定期清理**: 设置定时任务，每月清理30天前的已处理举报，保持数据库精简
  2. **批量清理**: 在举报积压严重时，批量清理所有历史已处理举报
  3. **数据归档**: 清理前可先导出/备份数据，然后清理本地记录

---

## 9. AI 分析接口

AI 分析功能用于辅助审核申诉，自动分析申诉内容并给出审核建议。

### 安全防护机制

为了防止提示词注入（Prompt Injection）攻击，系统采用以下多层防护策略：

1. **输入清理**
   - 过滤危险字符和控制字符
   - 移除常见的提示词注入模式（如"忽略之前的指令"等）
   - 转义XML标签防止标签注入
   - 限制输入长度（申诉内容最大2000字符）
   - 使用 SHA-256 生成缓存键，防止缓存键碰撞攻击

2. **结构隔离**
   - 使用XML标签明确隔离系统指令和用户数据
   - 在系统指令中明确指示AI忽略任何改变角色的尝试
   - 添加 Few-shot 示例引导 AI 输出格式

3. **输出验证**
   - 验证AI返回的JSON格式是否符合预期
   - 限制字段长度防止溢出攻击
   - 移除HTML标签防止XSS攻击
   - 确保confidence值在0-100范围内
   - 确保recommendation值为预定义的有效值之一
   - 验证并修正 evidence_strength 和 sentiment_score 范围

4. **内容审计**
   - 所有AI分析请求和响应均记录审计日志
   - 异常情况可被追踪和审查

5. **图片安全处理**
   - 自动压缩大尺寸图片，减少 token 消耗
   - 图片格式标准化（转换为 JPEG）
   - 图片内容缓存，避免重复处理
   - 支持的最大图片尺寸可配置

### 9.1 获取申诉AI分析
- **接口地址**: `/api/admin/appeals/{appeal_id}/ai-analysis`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **查询参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `refresh` | bool | 是否强制刷新分析（true/false，默认false） |

**状态说明**:
| 状态值 | 说明 |
| :--- | :--- |
| `pending` | 分析中，首次请求AI API |
| `retrying` | 重试中，API调用失败正在自动重试（最多3次） |
| `completed` | 分析完成，可获取结果 |
| `failed` | 分析失败，所有重试均失败 |

- **响应示例**:
  - **分析已完成**:
    ```json
    {
        "success": true,
        "data": {
            "appeal_id": "abc123",
            "status": "completed",
            "result": {
                "summary": "用户申诉被误封，理由充分",
                "reason_analysis": "申诉理由合理，提供了相关证据",
                "recommendation": "通过",
                "confidence": 85,
                "suggestions": "建议解除黑名单",
                "risk_factors": [],
                "sentiment_score": 0.7,
                "category": "误判申诉",
                "evidence_strength": 80,
                "processing_time_ms": 2500,
                "parse_error": false
            },
            "message": null
        }
    }
    ```
    
    **新增字段说明**:
    | 字段名 | 类型 | 说明 |
    | :--- | :--- | :--- |
    | `sentiment_score` | float | 情感倾向评分（0-1，0为负面，1为正面） |
    | `category` | string | 申诉分类：误判/恶意申诉/证据不足/重复申诉/未分类 |
    | `evidence_strength` | int | 证据强度评分（0-100） |
    | `processing_time_ms` | int | AI处理耗时（毫秒） |
    | `parse_error` | bool | 是否发生解析错误 |
  - **分析中**:
    ```json
    {
        "success": true,
        "data": {
            "appeal_id": "abc123",
            "status": "pending",
            "result": null,
            "message": "AI分析正在进行中，请稍后查询"
        }
    }
    ```
  - **重试中**（API调用失败时自动重试）：
    ```json
    {
        "success": true,
        "data": {
            "appeal_id": "abc123",
            "status": "retrying",
            "result": null,
            "error": "第1次尝试失败，正在重试 (1/2)",
            "retry_count": 1
        }
    }
    ```
  - **分析失败**:
    ```json
    {
        "success": true,
        "data": {
            "appeal_id": "abc123",
            "status": "failed",
            "result": null,
            "message": "AI API请求失败: 超时"
        }
    }
    ```

### 9.2 刷新申诉AI分析
- **接口地址**: `/api/admin/appeals/{appeal_id}/ai-analysis`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 强制重新请求AI分析，即使已有缓存结果也会重新分析
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "AI分析已刷新",
      "data": {
          "appeal_id": "abc123",
          "status": "pending",
          "result": null
      }
  }
  ```

### 9.3 列出所有AI分析
- **接口地址**: `/api/admin/ai-analysis`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **查询参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `status` | string | 状态筛选：pending/completed/failed |
  | `page` | int | 页码（默认1） |
  | `per_page` | int | 每页数量（默认20，最大100） |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "appeal_id": "abc123",
                  "status": "completed",
                  "created_at": "2026-03-19 15:30:00",
                  "updated_at": "2026-03-19 15:31:20"
              }
          ],
          "total": 50,
          "page": 1,
          "per_page": 20,
          "pages": 3
      }
  }
  ```

### 9.4 获取AI配置
- **接口地址**: `/api/admin/ai-config`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（仅超级管理员）
- **说明**: 获取AI分析配置信息（不包含敏感信息如API Key）
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "enabled": true,
          "base_url": "https://api.kimi.com/coding/v1",
          "model": "kimi-for-coding",
          "max_tokens": 2048,
          "temperature": 0.7,
          "has_api_key": true,
          "max_workers": 5,
          "max_retries": 3,
          "image_max_size": 1024,
          "image_quality": 85
      }
  }
  ```

**配置项说明**:
| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `enabled` | bool | false | 是否启用AI分析 |
| `api_key` | string | "" | AI API密钥（敏感信息，配置时传入，查询时不返回） |
| `base_url` | string | "https://api.kimi.com/coding/v1" | API基础地址 |
| `model` | string | "kimi-for-coding" | 使用的模型名称 |
| `max_tokens` | int | 2048 | 最大生成token数 |
| `temperature` | float | 0.7 | 采样温度（0-2） |
| `timeout` | int | 120 | API请求超时时间（秒） |
| `max_workers` | int | 5 | 线程池最大工作线程数 |
| `max_retries` | int | 3 | API调用失败时的最大重试次数 |
| `image_max_size` | int | 1024 | 图片最大边长（像素） |
| `image_quality` | int | 85 | JPEG压缩质量（1-100） |

### 9.5 删除AI分析缓存
- **接口地址**: `/api/admin/appeals/{appeal_id}/ai-analysis`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 删除申诉的AI分析缓存，删除后下次获取会重新请求AI分析
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "AI分析缓存已删除"
  }
  ```

### 9.6 批量分析申诉
- **接口地址**: `/api/admin/ai-analysis/batch`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **说明**: 批量提交多个申诉进行AI分析，使用线程池并行处理
- **请求体**:
  ```json
  {
      "appeals": [
          {
              "appeal_id": "abc123",
              "user_id": "123456789",
              "user_type": "user",
              "content": "申诉内容...",
              "images": ["/uploads/xxx.jpg"],
              "created_at": "2026-03-20 10:00:00"
          }
      ],
      "blacklist_info_map": {
          "abc123": {
              "reason": "广告刷屏",
              "added_at": "2026-03-15",
              "added_by": "admin_001",
              "level": 2
          }
      }
  }
  ```
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "total": 5,
          "completed": 3,
          "failed": 1,
          "pending": 1,
          "results": [
              {
                  "appeal_id": "abc123",
                  "status": "completed",
                  "result": { ... }
              }
          ]
      }
  }
  ```

---

## 6. 审计日志系统

系统记录所有敏感操作的审计日志，便于追踪和审查。

### 6.1 日志字段说明

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `timestamp` | string | 操作时间（格式：YYYY-MM-DD HH:MM:SS） |
| `action_type` | string | 操作类型，如 `admin_login`, `blacklist_add` 等 |
| `operator_id` | string | 操作者ID（admin_id/bot_name/user_id） |
| `operator_type` | string | 操作者类型：`admin`/`bot`/`user` |
| `operator_level` | int | 操作者等级（1-4，仅admin类型有） |
| `details` | object | 操作详情，包含具体操作的参数、原因和结果（详见下方） |
| `ip` | string | 操作者IP地址 |
| `status` | string | 操作状态：`success`/`failure` |

#### 5.1.1 `details` 字段详细说明

`details` 字段记录了每项操作的详细上下文信息，特别是**操作原因**和**变更内容**。不同操作类型的 `details` 内容如下：

**黑名单相关操作：**

| 操作类型 | `details` 字段内容 |
| :--- | :--- |
| `blacklist_add` | `{ "target_id": "用户ID", "user_type": "user/group", "reason": "拉黑原因/备注", "level": 严重等级 }` |
| `blacklist_remove` | `{ "target_id": "用户ID", "user_type": "user/group", "reason": "移除原因" }` |
| `blacklist_update` | `{ "original_user_id": "原ID", "new_user_id": "新ID", "new_reason": "新原因", "new_level": 新等级, "updated_fields": ["字段列表"] }` |
| `blacklist_level4_submit` | `{ "user_id": "用户ID", "user_type": "user/group", "reason": "拉黑原因", "level": 4, "confirmation_id": 待确认记录ID }` |
| `blacklist_level4_confirm` | `{ "confirmation_id": 待确认记录ID, "user_id": "用户ID", "user_type": "user/group", "first_admin": "第一名管理员" }` |
| `blacklist_level4_cancel` | `{ "confirmation_id": 待确认记录ID, "cancel_reason": "取消原因" }` |

**黑名单举报相关操作：**

| 操作类型 | `details` 字段内容 |
| :--- | :--- |
| `blacklist_report_create` | `{ "target_user_id": "被举报用户ID", "target_user_type": "user/group", "report_id": "举报ID", "reporter_contact": "举报人联系方式", "evidence_count": 证据数量, "error": 错误信息 }` |
| `blacklist_report_review` | `{ "report_id": "举报ID", "action": "approve/reject", "reason": "审核原因", "admin_note": "管理员备注", "target_user_id": "被举报用户ID", "add_to_blacklist": true/false, "level": 黑名单等级 }` |
| `blacklist_report_delete` | `{ "report_id": "举报ID", "delete_reason": "删除原因", "report_summary": {举报摘要}, "error": 错误信息 }` |
| `blacklist_report_clear_processed` | `{ "deleted_count": 删除数量, "days_threshold": 天数阈值, "deleted_ids": ["删除的举报ID列表"] }` |

**申诉相关操作：**

| 操作类型 | `details` 字段内容 |
| :--- | :--- |
| `appeal_create` | `{ "user_type": "user/group", "appeal_id": "申诉ID", "contact_email": "联系邮箱", "images_count": 图片数量, "error": 错误信息 }` |
| `appeal_update` | `{ "appeal_id": "申诉ID", "updates": ["更新的字段"], "update_reason": "更新原因", "original_summary": {原内容摘要}, "update_summary": {更新摘要}, "error": 错误信息 }` |
| `appeal_delete` (用户) | `{ "appeal_id": "申诉ID", "delete_reason": "删除原因", "appeal_summary": {申诉摘要}, "deleted_by_owner": true, "error": 错误信息 }` |
| `appeal_delete` (管理员) | `{ "appeal_id": "申诉ID", "appeal_status": "原状态", "appeal_summary": {申诉摘要}, "delete_reason": "删除原因", "deleted_by_admin": true, "admin_name": "管理员名称" }` |
| `appeal_review` | `{ "appeal_id": "申诉ID", "action": "approve/reject", "reason": "审核原因/备注", "remove_from_blacklist": true/false, "user_id": "用户ID" }` |
| `appeal_clear_processed` | `{ "deleted_count": 删除数量, "days_threshold": 天数阈值, "deleted_ids": ["删除的申诉ID列表"] }` |

**管理员相关操作：**

| 操作类型 | `details` 字段内容 |
| :--- | :--- |
| `admin_create` | `{ "target_admin_id": "被创建管理员ID", "target_level": 等级, "success": true/false }` |
| `admin_update` | `{ "target_admin_id": "被修改管理员ID", "updated_fields": ["修改的字段列表"], "success": true/false }` |
| `admin_delete` | `{ "target_admin_id": "被删除管理员ID", "success": true/false }` |
| `admin_login` | `{ "level": 等级, "success": true/false }` |

**Bot Token 相关操作：**

| 操作类型 | `details` 字段内容 |
| :--- | :--- |
| `bot_create` | `{ "bot_name": "Bot名称", "owner": "所有者", "description": "描述", "custom_token": true/false }` |
| `bot_update` | `{ "bot_name": "Bot名称", "updated_fields": ["修改的字段列表"], "has_token_update": true/false }` |
| `bot_delete` | `{ "bot_name": "Bot名称", "deleted_by": "删除者" }` |
| `bot_view_token` | `{ "bot_name": "Bot名称", "exists": true/false }` |

**系统配置相关操作：**

| 操作类型 | `details` 字段内容 |
| :--- | :--- |
| `system_restart` | `{ "restart_type": "重启类型", "triggered_by": "触发者" }` |
| `config_update` | `{ "updated_sections": ["更新的配置段列表"], "updated_paths": ["更新的配置路径"], "original_values": {原值摘要}, "update_reason": "更新原因" }` |
| `admin_logout` | `{ "token_revoked": true/false }` |

**AI分析相关操作：**

| 操作类型 | `details` 字段内容 |
| :--- | :--- |
| `ai_analysis_query` | `{ "appeal_id": "申诉ID", "status": "状态", "refresh": true/false }` |
| `ai_analysis_refresh` | `{ "appeal_id": "申诉ID", "status": "状态" }` |
| `ai_analysis_delete` | `{ "appeal_id": "申诉ID" }` 或 `{ "report_id": "举报ID" }` |
| `ai_analysis_batch` | `{ "total": 总数, "completed": 成功数, "failed": 失败数, "report_ids": ["举报ID列表"] }` |

**数据库备份相关操作：**

| 操作类型 | `details` 字段内容 |
| :--- | :--- |
| `backup_status_query` | `{}` (基本查询操作) |
| `backup_list_query` | `{ "count": 备份数量 }` |
| `backup_create` | `{ "filename": "备份文件名", "size": "文件大小", "remark": "备份备注" }` |
| `backup_delete` | `{ "filename": "备份文件名" }` |
| `backup_remark_update` | `{ "filename": "备份文件名", "remark": "新备注" }` |
| `backup_config_update` | `{ "enabled": true/false, "cron": "定时表达式", "backup_dir": "备份目录", "max_backups": 最大备份数, "retention_days": 保留天数 }` |

### 6.2 操作类型列表

| 操作类型 | 说明 | 记录等级 |
| :--- | :--- | :--- |
| `admin_login` | 管理员登录 | 所有等级 |
| `admin_logout` | 管理员登出 | 所有等级 |
| `admin_create` | 创建管理员 | 等级4 |
| `admin_update` | 更新管理员 | 所有等级 |
| `admin_delete` | 删除管理员 | 等级4 |
| `bot_create` | 创建 Bot Token | 等级4 |
| `bot_update` | 更新 Bot Token | 所有等级 |
| `bot_delete` | 删除 Bot Token | 所有等级 |
| `bot_use` | Bot 使用 Token | Bot |
| `bot_view_token` | 查看 Bot Token 原文 | 等级4 |
| `blacklist_add` | 添加黑名单 | Bot/等级3+ |
| `blacklist_remove` | 移除黑名单 | Bot/等级3+ |
| `blacklist_update` | 更新黑名单 | 等级3+ |
| `blacklist_check` | 查询黑名单 | Bot/所有用户 |
| `blacklist_level4_submit` | 提交等级4待确认 | 等级3+ |
| `blacklist_level4_confirm` | 确认等级4记录 | 等级3+ |
| `blacklist_level4_cancel` | 取消等级4待确认 | 等级3+
| `blacklist_report_create` | 创建黑名单举报 | 用户 |
| `blacklist_report_review` | 审核黑名单举报 | 等级2+ |
| `blacklist_report_delete` | 删除黑名单举报 | 等级3+ |
| `blacklist_report_clear_processed` | 清理已处理举报 | 等级4 | |
| `appeal_create` | 创建申诉 | 用户 |
| `appeal_update` | 更新申诉 | 用户 |
| `appeal_delete` | 删除申诉 | 用户/等级3+ |
| `appeal_review` | 审核申诉 | 等级2+ |
| `appeal_query` | 查询申诉 | 等级2+ |
| `appeal_clear_processed` | 清理已处理申诉 | 等级3+ |
| `config_update` | 更新系统配置 | 等级4 |
| `system_restart` | 系统重启 | 等级4 |
| `file_upload` | 文件上传 | 所有用户 |
| `ai_analysis_query` | 查询AI分析 | 等级2+ |
| `ai_analysis_refresh` | 刷新AI分析 | 等级2+ |
| `ai_analysis_delete` | 删除AI分析缓存 | 等级3+ |
| `ai_analysis_batch` | 批量AI分析 | 等级2+ |
| `backup_status_query` | 查询备份状态 | 等级3+ |
| `backup_list_query` | 查询备份列表 | 等级3+ |
| `backup_create` | 创建数据库备份 | 等级4 |
| `backup_delete` | 删除数据库备份 | 等级4 |
| `backup_remark_update` | 更新备份备注 | 等级4 |
| `backup_config_update` | 更新备份配置 | 等级4 |

### 6.3 日志查看权限

| 查看者等级 | 可查看的日志范围 |
| :--- | :--- |
| 等级 4 | 所有日志（包括等级4的操作） |
| 等级 3 | 等级3及以下的日志（排除等级4的操作） |
| 等级 2 | 只能查看自己的日志 |
| 等级 1 | 只能查看自己的日志 |

**说明**: 此权限控制确保高权限操作（如超级管理员的操作）只有超级管理员自己可以看到，低等级管理员无法查看高等级管理员的操作记录。

---

## 7. 错误处理与速率限制

### 7.1 状态码说明

| 状态码 | 说明 |
| :--- | :--- |
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 鉴权失败 |
| 403 | IP 被暂时封禁或无权访问 |
| 404 | 资源不存在 |
| 413 | 文件大小超过限制 |
| 429 | 请求过于频繁（频率限制） |
| 500 | 服务器内部错误 |

### 7.2 请求频率限制

系统对所有 API 接口实施频率限制，防止滥用：

**限制规则**:
- **默认配置**: 1 秒内最多 3 次请求
- **限制维度**: 同时基于 **IP 地址** 和 **管理员 ID** 进行限制
  - 单个 IP 超过限制：该 IP 被限制
  - 单个管理员超过限制：该管理员账号被限制
- **影响范围**: 所有接口（包括公开接口和需要鉴权的接口）

**配置项**:
```json
{
    "rate_limit_window": 1,        // 时间窗口（秒）
    "rate_limit_max_requests": 3   // 窗口内最大请求数
}
```

**超出限制时的响应**:
```json
{
    "success": false,
    "message": "IP请求过于频繁，请等待 1 秒后重试",
    "error_code": "RATE_LIMIT_EXCEEDED"
}
```

**响应头信息**:
| 响应头 | 说明 |
| :--- | :--- |
| `X-RateLimit-IP-Remaining` | IP 剩余可用请求数 |
| `X-RateLimit-IP-Reset` | IP 限制重置时间戳 |
| `X-RateLimit-Admin-Remaining` | 管理员剩余可用请求数 |
| `X-RateLimit-Admin-Reset` | 管理员限制重置时间戳 |

### 7.3 IP 封禁机制

- **IP 限制**: 鉴权失败超过 `ip_limit_max_attempts` 次（默认5次），IP 将被封禁 `ip_limit_window` 秒（默认1小时）
- **文件上传**: 单文件最大5MB

---

## 8. 配置文件说明

`config.json` 示例：

```json
{
    "host": "0.0.0.0",
    "port": 8080,
    "debug": false,
    "public_url": "https://api.example.com",
    "frontend_url": "https://example.com",
    "secret_key": "your-secret-key",
    "upload_folder": "uploads",
    "max_upload_size": 5242880,
    "temp_token_ttl": 3600,
    "log_level": "INFO",
    "ip_header": "X-Forwarded-For",
    "geetest": {
        "enabled": true,
        "captcha_id": "your-captcha-id",
        "captcha_key": "your-captcha-key"
    },
    "logto": {
        "enabled": false,
        "endpoint": "https://login.example.com",
        "app_id": "your-app-id",
        "app_secret": "your-app-secret"
    }
}
```

### 核心配置项

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `host` | string | "0.0.0.0" | 服务器绑定地址 |
| `port` | int | 8080 | 服务器端口 |
| `debug` | bool | false | 调试模式 |
| `public_url` | string | "" | **后端 API 地址**，用于生成回调地址 |
| `frontend_url` | string | "" | **前端地址**，用于 CORS 和登出跳转 |
| `secret_key` | string | "" | **Flask Session 密钥**（用于 Logto） |
| `upload_folder` | string | "uploads" | 上传文件目录 |
| `max_upload_size` | int | 5242880 | 最大上传文件大小（字节，默认5MB） |
| `temp_token_ttl` | int | 3600 | 管理员临时 token 有效期（秒） |
| `log_level` | string | "INFO" | 日志级别 |
| `ip_header` | string | "X-Forwarded-For" | 获取真实 IP 的请求头 |

### 极验验证配置 (`geetest`)

用于配置极验 GT4 人机验证功能：

```json
{
    "geetest": {
        "enabled": true,
        "captcha_id": "76443218de0908087c97c1e5f9a59272",
        "captcha_key": "your-geetest-captcha-key"
    }
}
```

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `enabled` | bool | true | 是否启用极验验证 |
| `captcha_id` | string | "" | 极验验证 ID（从极验后台获取） |
| `captcha_key` | string | "" | 极验验证密钥（从极验后台获取） |

### Logto SSO 配置 (`logto`)

用于配置 Logto 单点登录功能：

```json
{
    "logto": {
        "enabled": true,
        "endpoint": "https://login.pmnet.work",
        "app_id": "rw5o1mk0q19g6pvu1ucir",
        "app_secret": "your-app-secret",
        "scopes": ["openid", "profile", "email"],
        "session_ttl": 86400,
        "remember_me_enabled": true,
        "remember_me_ttl": 2592000,
        "multi_device_login": true,
        "max_concurrent_sessions": 5
    }
}
```

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `enabled` | bool | false | 是否启用 Logto SSO |
| `endpoint` | string | "" | Logto 服务地址 |
| `app_id` | string | "" | Logto Application ID |
| `app_secret` | string | "" | Logto Application Secret |
| `scopes` | array | ["openid", "profile", "email"] | 请求的 OAuth 权限范围 |
| `session_ttl` | int | 86400 | 会话有效期（秒），默认 24 小时 |
| `remember_me_enabled` | bool | true | 是否启用"记住我"功能 |
| `remember_me_ttl` | int | 2592000 | 记住我会话有效期（秒），默认 30 天 |
| `multi_device_login` | bool | true | 是否允许多设备同时登录 |
| `max_concurrent_sessions` | int | 5 | 最大同时会话数 |

**Logto 控制台配置**:
- **应用程序类型**: 传统 Web 应用
- **Redirect URI**: `{public_url}/api/auth/logto/callback`
- **Post Sign-out Redirect URI**: `{frontend_url}/login`
- **刷新令牌轮换**: 默认开启（建议保持）
- **刷新令牌 TTL**: 14 天（可根据需要调整）

### AI 分析配置 (`ai_analysis`)

用于配置 AI 辅助审核申诉功能：

```json
{
    "ai_analysis": {
        "enabled": true,
        "api_key": "your-api-key",
        "base_url": "https://api.kimi.com/coding/v1",
        "model": "kimi-for-coding",
        "max_tokens": 2048,
        "temperature": 0.7,
        "timeout": 60,
        "cache_file": "ai_analysis_cache.json"
    }
}
```

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `enabled` | bool | true | 是否启用 AI 分析功能 |
| `api_key` | string | "" | AI 服务 API Key |
| `base_url` | string | "https://api.kimi.com/coding/v1" | AI 服务 Base URL |
| `model` | string | "kimi-for-coding" | AI 模型名称 |
| `max_tokens` | int | 2048 | 最大生成 token 数 |
| `temperature` | float | 0.7 | 生成温度（0-1） |
| `timeout` | int | 60 | API 请求超时时间（秒） |
| `cache_file` | string | "ai_analysis_cache.json" | AI 分析缓存文件 |

### 数据库备份配置 (`database_backup`)

用于配置数据库自动备份功能：

```json
{
    "database_backup": {
        "enabled": true,
        "cron": "0 2 * * *",
        "backup_dir": "backups",
        "max_backups": 10,
        "retention_days": 30
    }
}
```

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `enabled` | bool | true | 是否启用自动备份 |
| `cron` | string | "0 2 * * *" | CRON 表达式，定义备份频率 |
| `backup_dir` | string | "backups" | 备份文件存储目录 |
| `max_backups` | int | 10 | 最多保留的备份数量 |
| `retention_days` | int | 30 | 备份文件保留天数 |

### CORS 跨域配置 (`cors`)

用于配置前端跨域访问限制，使用统一的 `allowed_origins` 作为域名白名单：

```json
{
    "cors": {
        "enabled": true,
        "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allowed_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": true
    }
}
```

| 配置项 | 类型 | 说明 |
| :--- | :--- | :--- |
| `enabled` | bool | 是否启用 CORS 限制 |
| `allowed_methods` | array | 允许的 HTTP 方法 |
| `allowed_headers` | array | 允许的请求头 |
| `supports_credentials` | bool | 是否支持携带凭证（如 Cookies） |

### 图片防盗链配置 (`hotlink_protection`)

用于防止未授权网站直接引用上传的图片，使用统一的 `allowed_origins` 作为域名白名单：

```json
{
    "hotlink_protection": {
        "enabled": true,
        "allowed_empty_referer": true,
        "protected_paths": ["/uploads/"]
    }
}
```

| 配置项 | 类型 | 说明 |
| :--- | :--- | :--- |
| `enabled` | bool | 是否启用防盗链 |
| `allowed_empty_referer` | bool | 是否允许空 Referer（直接访问图片） |
| `protected_paths` | array | 受防盗链保护的路径列表 |

---

## 8. 目录结构

```
bot-blacklist-api/
├── main.py                 # 主入口文件
├── config.json             # 配置文件
├── blacklist.json          # 黑名单数据
├── tokenlist.json          # Bot Token 列表
├── admin_tokens.json       # 管理员 Token 列表
├── appeals.json            # 申诉数据
├── API_DOC.md             # API 文档
├── logger.py              # 日志模块
├── models/                # 数据模型层
│   ├── __init__.py
│   ├── config_manager.py  # 配置管理
│   ├── data_manager.py    # 黑名单数据管理
│   ├── appeal_manager.py  # 申诉数据管理
│   ├── backup_manager.py  # 数据库备份管理
│   └── database.py        # SQLite数据库管理
├── utils/                 # 工具模块
│   ├── __init__.py
│   ├── auth.py            # 认证管理
│   ├── ip_limit.py        # IP 限制
│   └── upload.py          # 文件上传
├── routes/                # 路由层
│   ├── __init__.py
│   ├── blacklist.py       # 黑名单路由
│   ├── appeals.py         # 申诉路由（前端）
│   └── admin.py           # 管理路由
├── uploads/               # 上传文件目录
│   └── appeals/          # 申诉图片
└── logs/                  # 日志目录
```


---

## 10. 数据库备份接口

数据库备份功能支持基于 CRON 表达式的定期自动备份，同时提供手动备份和管理接口。

### 配置说明

在 `config.json` 中添加以下配置：

```json
{
    "database_backup": {
        "enabled": true,
        "cron": "0 2 * * *",
        "backup_dir": "backups",
        "max_backups": 10,
        "retention_days": 30
    }
}
```

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `enabled` | bool | `true` | 是否启用自动备份 |
| `cron` | string | `"0 2 * * *"` | CRON 表达式，定义备份频率 |
| `backup_dir` | string | `"backups"` | 备份文件存储目录 |
| `max_backups` | int | `10` | 最多保留的备份数量 |
| `retention_days` | int | `30` | 备份文件保留天数 |

### CRON 表达式示例

| 表达式 | 说明 |
| :--- | :--- |
| `0 2 * * *` | 每天凌晨 2:00 |
| `0 */6 * * *` | 每 6 小时一次 |
| `0 0 * * 0` | 每周日午夜 |
| `0 0 1 * *` | 每月 1 号午夜 |
| `*/30 * * * *` | 每 30 分钟 |

---

### 10.1 获取备份状态

获取当前备份管理器的状态和下次备份时间。

**接口**: `GET /api/admin/backup/status`

**鉴权**: 管理员 Token（需要等级 3+）

**响应示例**:
```json
{
    "success": true,
    "data": {
        "enabled": true,
        "cron": "0 2 * * *",
        "cron_available": true,
        "running": true,
        "backup_dir": "backups",
        "max_backups": 10,
        "retention_days": 30,
        "next_backup": "2026-03-22 02:00:00",
        "db_file": "data.db",
        "backup_count": 5
    }
}
```

---

### 10.2 列出所有备份

列出所有数据库备份文件。

**接口**: `GET /api/admin/backup/list`

**鉴权**: 管理员 Token（需要等级 3+）

**响应示例**:
```json
{
    "success": true,
    "data": {
        "backups": [
            {
                "filename": "backup_20260321_150000.db",
                "path": "backups/backup_20260321_150000.db",
                "created_at": 1711023600.0,
                "created_at_str": "2026-03-21 15:00:00",
                "size": 1048576,
                "size_human": "1.00 MB",
                "remark": "自动备份 2026-03-21 15:00",
                "is_auto": true
            }
        ],
        "total": 5
    }
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `filename` | string | 备份文件名 |
| `path` | string | 备份文件完整路径 |
| `created_at` | float | 创建时间戳 |
| `created_at_str` | string | 创建时间字符串 |
| `size` | int | 文件大小（字节） |
| `size_human` | string | 格式化后的文件大小 |
| `remark` | string | 备份备注 |
| `is_auto` | bool | 是否为自动备份 |

---

### 10.3 创建备份

手动创建数据库备份。

**接口**: `POST /api/admin/backup`

**鉴权**: 管理员 Token（需要等级 4，超级管理员）

**请求体**（可选）:
```json
{
    "remark": "升级前备份"
}
```

**响应示例**（成功）:
```json
{
    "success": true,
    "message": "备份创建成功",
    "data": {
        "success": true,
        "filename": "backup_20260321_153000.db",
        "path": "backups/backup_20260321_153000.db",
        "timestamp": "20260321_153000",
        "size": 1048576,
        "size_human": "1.00 MB",
        "remark": "升级前备份",
        "is_auto": false
    }
}
```

**响应示例**（失败）:
```json
{
    "success": false,
    "message": "备份创建失败: 数据库文件不存在"
}
```

---

### 10.4 删除备份

删除指定的备份文件。

**接口**: `DELETE /api/admin/backup/{filename}`

**鉴权**: 管理员 Token（需要等级 4，超级管理员）

**路径参数**:
- `filename`: 备份文件名（如 `backup_20260321_150000.db`）

**响应示例**（成功）:
```json
{
    "success": true,
    "message": "备份 backup_20260321_150000.db 已删除"
}
```

**响应示例**（失败）:
```json
{
    "success": false,
    "message": "删除失败，文件可能不存在"
}
```

---

### 10.5 获取备份配置

获取当前的备份配置。

**接口**: `GET /api/admin/backup/config`

**鉴权**: 管理员 Token（需要等级 4，超级管理员）

**响应示例**:
```json
{
    "success": true,
    "data": {
        "enabled": true,
        "cron": "0 2 * * *",
        "backup_dir": "backups",
        "max_backups": 10,
        "retention_days": 30
    }
}
```

---

### 10.6 更新备份配置

更新备份配置参数。

**接口**: `PUT /api/admin/backup/config`

**鉴权**: 管理员 Token（需要等级 4，超级管理员）

**请求体**:
```json
{
    "enabled": true,
    "cron": "0 2 * * *",
    "backup_dir": "backups",
    "max_backups": 10,
    "retention_days": 30
}
```

**字段说明**:
- 所有字段均为可选
- 只有提供的字段会被更新
- `cron` 字段必须符合 CRON 表达式格式

**响应示例**（成功）:
```json
{
    "success": true,
    "message": "备份配置已更新",
    "data": {
        "enabled": true,
        "cron": "0 2 * * *",
        "backup_dir": "backups",
        "max_backups": 10,
        "retention_days": 30
    }
}
```

**响应示例**（无效 CRON）:
```json
{
    "success": false,
    "message": "无效的 CRON 表达式"
}
```

---

### 10.7 验证CRON表达式

验证 CRON 表达式是否有效，并返回下次执行时间。

**接口**: `POST /api/admin/backup/validate-cron`

**鉴权**: 管理员 Token（需要等级 4，超级管理员）

**请求体**:
```json
{
    "cron": "0 2 * * *"
}
```

**响应示例**（有效）:
```json
{
    "success": true,
    "data": {
        "valid": true,
        "next_run": "2026-03-22 02:00:00"
    }
}
```

**响应示例**（无效）:
```json
{
    "success": true,
    "data": {
        "valid": false
    }
}
```

---

### 10.8 更新备份备注

更新指定备份文件的备注信息。

**接口**: `PUT /api/admin/backup/{filename}/remark`

**鉴权**: 管理员 Token（需要等级 4，超级管理员）

**路径参数**:
- `filename`: 备份文件名（如 `backup_20260321_150000.db`）

**请求体**:
```json
{
    "remark": "升级前备份"
}
```

**响应示例**（成功）:
```json
{
    "success": true,
    "message": "备份 backup_20260321_150000.db 备注已更新",
    "data": {
        "filename": "backup_20260321_150000.db",
        "remark": "升级前备份"
    }
}
```

**响应示例**（失败）:
```json
{
    "success": false,
    "message": "更新失败，文件可能不存在"
}
```

---

### 10.9 获取图片列表

获取已上传图片的列表，仅返回相对路径，前端可手动拼接完整 URL。

- **接口地址**: `/api/admin/images`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `subfolder` | string | 否 | 子目录名称，默认 `appeals` |
  | `page` | int | 否 | 页码，默认 1 |
  | `per_page` | int | 否 | 每页数量，默认 50，最大 200 |
  | `search` | string | 否 | 搜索关键词（按文件名模糊匹配） |
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "items": [
              {
                  "filename": "20260323_abc123def456.jpg",
                  "path": "appeals/20260323_abc123def456.jpg",
                  "size": 2048576,
                  "created_at": "2026-03-23 10:30:00",
                  "modified_at": "2026-03-23 10:30:00"
              }
          ],
          "total": 128,
          "page": 1,
          "per_page": 50,
          "pages": 3,
          "subfolder": "appeals"
      }
  }
  ```
- **字段说明**:
  | 字段名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `filename` | string | 文件名 |
  | `path` | string | 相对路径（可用于拼接完整 URL，如 `/uploads/appeals/xxx.jpg`） |
  | `size` | int | 文件大小（字节） |
  | `created_at` | string | 创建时间 |
  | `modified_at` | string | 最后修改时间 |

### 10.10 上传图片

管理员手动上传图片到指定子目录。

- **接口地址**: `/api/admin/images`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **Content-Type**: `multipart/form-data`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `file` | File | 是 | 图片文件（最大 5MB） |
  | `subfolder` | string | 否 | 子目录名称，默认 `appeals` |
- **文件限制**:
  - 文件大小：最大 5MB
  - 文件类型：png, jpg, jpeg, gif, webp
  - 系统会自动检测重复图片（基于 MD5 哈希）
- **响应示例**（上传成功）:
  ```json
  {
      "success": true,
      "message": "上传成功",
      "data": {
          "filename": "20260323_abc123def456.jpg",
          "path": "appeals/20260323_abc123def456.jpg",
          "size": 2048576,
          "existing": false
      }
  }
  ```
- **响应示例**（文件已存在）:
  ```json
  {
      "success": true,
      "message": "文件已存在",
      "data": {
          "filename": "20260322_xyz789abc123.jpg",
          "path": "appeals/20260322_xyz789abc123.jpg",
          "size": 2048576,
          "existing": true
      }
  }
  ```

### 10.11 删除图片

删除指定的上传图片。

- **接口地址**: `/api/admin/images/{filepath}`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **路径参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `filepath` | string | 是 | 文件的相对路径（如 `appeals/20260323_xxx.jpg`） |
- **响应示例**（成功）:
  ```json
  {
      "success": true,
      "message": "文件已删除",
      "data": {
          "filepath": "appeals/20260323_xxx.jpg",
          "filename": "20260323_xxx.jpg"
      }
  }
  ```
- **响应示例**（文件不存在）:
  ```json
  {
      "success": false,
      "message": "文件不存在"
  }
  ```
- **安全说明**:
  - 系统会检查路径合法性，防止目录遍历攻击
  - 只能删除 uploads 目录下的文件

### 10.12 获取图片子目录列表

获取所有图片子目录的列表。

- **接口地址**: `/api/admin/images/subfolders`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "subfolders": [
              {
                  "name": "appeals",
                  "file_count": 128
              },
              {
                  "name": "avatars",
                  "file_count": 15
              }
          ]
      }
  }
  ```
- **字段说明**:
  | 字段名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `name` | string | 子目录名称 |
  | `file_count` | int | 目录中的文件数量 |

---

## 备份文件管理

### 自动清理策略

备份管理器会自动执行以下清理策略：

1. **数量限制**: 当备份数量超过 `max_backups` 时，删除最旧的备份
2. **时间限制**: 删除超过 `retention_days` 天的备份

### 备份文件存储结构

备份数据存储在文件系统中：

```
backups/
├── backup_20260321_150000.db      # 实际的备份文件
├── backup_20260322_020000.db      # 实际的备份文件
└── backup_info.json               # 备份元数据（备注、是否自动等）
```

### 黑名单表结构

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | INTEGER | 主键，自增 |
| `user_id` | TEXT | 用户ID或群号 |
| `user_type` | TEXT | 类型：`user`(用户)、`group`(群聊) |
| `reason` | TEXT | 加入黑名单的原因 |
| `level` | INTEGER | 严重等级（1-4），默认1 |
| `added_by` | TEXT | 添加人（Bot名称或管理员） |
| `added_at` | TEXT | 添加时间 |
| `updated_at` | TEXT | 更新时间 |

### 等级4待确认记录表结构

用于存储需要两名管理员共同确认的等级4（严重违规）黑名单记录：

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | INTEGER | 主键，自增 |
| `user_id` | TEXT | 用户ID或群号 |
| `user_type` | TEXT | 类型：`user`(用户)、`group`(群聊) |
| `reason` | TEXT | 加入黑名单的原因 |
| `first_admin_id` | TEXT | 第一名管理员ID（提交者） |
| `first_admin_name` | TEXT | 第一名管理员名称 |
| `first_confirmed_at` | TEXT | 第一次提交时间 |
| `second_admin_id` | TEXT | 第二名管理员ID（确认者） |
| `second_admin_name` | TEXT | 第二名管理员名称 |
| `second_confirmed_at` | TEXT | 第二次确认时间 |
| `status` | TEXT | 状态：`pending`(待确认)、`confirmed`(已确认)、`cancelled`(已取消) |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 更新时间 |

### 备份文件命名规则

备份文件命名格式：`backup_{YYYYMMDD}_{HHMMSS}.db`

例如：`backup_20260321_150000.db` 表示 2026年3月21日 15:00:00 创建的备份

### 备份元数据

备份的元数据（备注、是否自动备份等）存储在 `backups/backup_info.json` 文件中：

```json
{
    "backup_20260321_150000.db": {
        "created_at": "2026-03-21 15:00:00",
        "size": 1048576,
        "remark": "手动备份",
        "is_auto": false
    },
    "backup_20260322_020000.db": {
        "created_at": "2026-03-22 02:00:00",
        "size": 1048576,
        "remark": "自动备份 2026-03-22 02:00",
        "is_auto": true
    }
}
```

### 备份备注

每个备份都可以添加备注，用于标识备份的用途或说明：

- **自动备份备注**: 自动生成的格式为 `自动备份 YYYY-MM-DD HH:MM`
- **手动备份备注**: 创建时通过 `remark` 参数指定，如 `"升级前备份"`
- **更新备注**: 可通过 `PUT /api/admin/backup/{filename}/remark` 接口随时修改

### 手动恢复备份

如需从备份恢复数据库：

1. 停止服务
2. 备份当前数据库：`cp data.db data.db.bak`
3. 复制备份文件：`cp backups/backup_20260321_150000.db data.db`
4. 启动服务

**注意**: 建议通过管理界面实现恢复功能，避免直接操作文件。


---

## 11. Logto SSO 认证

系统支持通过 Logto 进行单点登录（SSO），支持 QQ、微信等社交登录方式。

### 11.1 支持的认证方式查询

- **接口地址**: `/api/auth/methods`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 获取系统支持的认证方式
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "methods": ["password", "logto"],
          "logto": {
              "enabled": true,
              "login_url": "/api/auth/logto/login"
          }
      }
  }
  ```

### 11.2 Logto 登录入口

- **接口地址**: `/api/auth/logto/login`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 
  - 跳转至 Logto 登录页面
  - 用户完成 QQ/微信登录后自动回调
- **查询参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `next` | string | 否 | 登录成功后跳转的前端页面路径 |
- **响应**: 302 跳转至 Logto 授权页面

### 11.3 Logto 登录回调

- **接口地址**: `/api/auth/logto/callback`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: Logto 登录后的回调处理
- **处理流程**:
  1. 获取 Logto 用户信息
  2. 检查是否已绑定本地管理员账户
  3. 如已绑定，创建临时 token 并返回
  4. 如未绑定，返回错误提示需要绑定
- **响应示例**（已绑定）:
  ```json
  {
      "success": true,
      "message": "SSO 登录成功",
      "data": {
          "admin_id": "admin_001",
          "name": "管理员",
          "level": 4,
          "temp_token": "xxx",
          "expires_in": 3600
      }
  }
  ```
- **响应示例**（未绑定）:
  ```json
  {
      "success": false,
      "message": "该 Logto 账户未绑定到任何管理员账户",
      "error": "ACCOUNT_NOT_BOUND"
  }
  ```

### 11.4 获取 Logto 绑定状态

- **接口地址**: `/api/auth/logto/status`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **说明**: 查询当前管理员的 Logto 绑定状态
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "enabled": true,
          "bound": true,
          "logto_id": "abc123",
          "logto_email": "user@example.com"
      }
  }
  ```

### 11.5 获取 Logto 绑定授权 URL

- **接口地址**: `/api/auth/logto/bind/url`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **说明**: 
  - 获取 Logto 授权 URL，用于绑定当前登录的管理员账户
  - 需要先使用密码登录获取 temp_token
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "请使用此 URL 跳转至 Logto 完成绑定",
      "data": {
          "url": "https://login.pmnet.work/oidc/auth?...",
          "expires_in": 600
      }
  }
  ```

### 11.6 Logto 绑定回调

- **接口地址**: `/api/auth/logto/bind/callback`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 
  - 绑定流程的回调处理
  - 验证当前登录的管理员身份后完成绑定
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "Logto 账户绑定成功",
      "data": {
          "logto_id": "abc123",
          "logto_email": "user@example.com"
      }
  }
  ```

### 11.7 解绑 Logto 账户

- **接口地址**: `/api/auth/logto/unbind`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **说明**: 
  - 解绑当前管理员的 Logto 账户
  - 需要验证密码，确保账户安全
  - 如账户强制使用 SSO，无法解绑
- **请求体**:
  ```json
  {
      "password": "当前密码"
  }
  ```
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "Logto 账户解绑成功"
  }
  ```

### 11.8 Logto 登出跳转

- **接口地址**: `/api/auth/logto/logout`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 
  - 直接跳转至 Logto 登出页面
  - 清除 Logto Session
- **查询参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `redirect_uri` | string | 否 | 登出后的跳转地址 |
- **响应**: 302 跳转至 Logto 登出页面

### 11.9 强制 SSO 登录

管理员可设置 `force_sso` 字段强制使用 SSO 登录：

- **设置方式**: 超级管理员通过 `PUT /api/admin/admins/{admin_id}` 接口设置 `force_sso: true`
- **效果**:
  - 该管理员无法使用密码登录
  - 必须使用 Logto SSO 登录
  - 必须先绑定 Logto 账户才能设置强制 SSO

**密码登录被拒响应**:
```json
{
    "success": false,
    "message": "该账户已强制使用 SSO 登录，请使用 Logto 登录",
    "sso_required": true,
    "sso_login_url": "/api/auth/logto/login"
}
```

### 11.10 前端集成示例

```javascript
// 1. 检查支持的认证方式
const methods = await fetch('/api/auth/methods').then(r => r.json());

// 2. Logto 登录（直接跳转）
function loginWithLogto() {
    window.location.href = '/api/auth/logto/login?next=/dashboard';
}

// 3. 回调处理页面 (/auth/callback)
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
if (token) {
    localStorage.setItem('admin_token', token);
    window.location.href = params.get('next') || '/admin';
}

// 4. 绑定流程（已登录状态下）
async function bindLogto() {
    const res = await fetch('/api/auth/logto/bind/url', {
        headers: { 'Authorization': currentToken }
    }).then(r => r.json());
    window.location.href = res.data.url;
}

// 5. 登出
async function logout() {
    const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: JSON.stringify({ redirect: true })
    }).then(r => r.json());
    
    localStorage.removeItem('admin_token');
    
    // 跳转至 Logto 登出
    if (res.data.sso_logout_url) {
        window.location.href = res.data.sso_logout_url;
    }
}
```

### 11.11 配置说明

在 `config.json` 中配置：

```json
{
    "public_url": "https://api.example.com",
    "frontend_url": "https://example.com",
    "secret_key": "your-secret-key",
    "logto": {
        "enabled": true,
        "endpoint": "https://login.pmnet.work",
        "app_id": "your-app-id",
        "app_secret": "your-app-secret",
        "scopes": ["openid", "profile", "email"],
        "session_ttl": 86400,
        "remember_me_enabled": true,
        "remember_me_ttl": 2592000,
        "multi_device_login": true,
        "max_concurrent_sessions": 5
    }
}
```

#### 核心配置项

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `public_url` | string | "" | **后端 API 地址**，用于生成回调地址 |
| `frontend_url` | string | "" | **前端地址**，用于 CORS 和登出跳转 |
| `secret_key` | string | "" | **Flask Session 密钥**（用于 Logto） |
| `logto.enabled` | bool | false | 是否启用 Logto SSO |
| `logto.endpoint` | string | "" | Logto 服务地址 |
| `logto.app_id` | string | "" | Logto Application ID |
| `logto.app_secret` | string | "" | Logto Application Secret |
| `logto.scopes` | array | ["openid", "profile", "email"] | 请求的 OAuth 权限范围 |

#### 会话配置项

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `logto.session_ttl` | int | 86400 | 会话有效期（秒），默认 24 小时 |
| `logto.remember_me_enabled` | bool | true | 是否启用"记住我"功能 |
| `logto.remember_me_ttl` | int | 2592000 | 记住我会话有效期（秒），默认 30 天 |
| `logto.multi_device_login` | bool | true | 是否允许多设备同时登录 |
| `logto.max_concurrent_sessions` | int | 5 | 最大同时会话数（多设备登录时） |

**Logto 控制台配置**:
- **应用程序类型**: 传统 Web 应用
- **Redirect URI**: `{public_url}/api/auth/logto/callback`
- **Post Sign-out Redirect URI**: `{frontend_url}/login`
- **刷新令牌轮换**: 默认开启（建议保持）
- **刷新令牌 TTL**: 14 天（可根据需要调整）

### 11.12 刷新令牌轮换

Logto 默认启用刷新令牌轮换，这是安全措施：

- **公共客户端（SPA）**: 每次使用刷新令牌都会获得新令牌
- **私有客户端**: 在 70% TTL 或 1 年后轮换
- **旧令牌**: 轮换后的旧令牌立即失效

**无需额外配置**，系统已兼容此特性。

### 11.13 后端通道注销（可选）

如需在用户在 Logto 控制台手动注销时，通知后端清除会话：

**Logto 控制台配置**:
- **后端通道注销 URI**: `{public_url}/api/auth/logto/backchannel-logout`

**触发场景**:
1. 用户在 Logto 控制台手动注销会话
2. 管理员在 Logto 控制台强制注销用户
3. 用户在其他应用执行全局登出

**后端处理流程**:
1. Logto 向后端发送 `logout_token` (JWT)
2. 后端验证令牌并查找绑定的管理员
3. 使该管理员的所有会话失效
4. 返回 HTTP 200 确认收到通知
