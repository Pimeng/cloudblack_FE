# API 文档

## 目录

1. [鉴权机制](#1-鉴权机制-authentication)
   - [1.1 Bot Token 鉴权](#11-bot-token-鉴权)
   - [1.2 管理员 Token 鉴权](#12-管理员-token-鉴权)
   - [1.3 权限等级系统](#13-权限等级系统)
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
4. [管理接口（管理员用）](#4-管理接口管理员用)
   - [4.1 获取申诉列表](#41-获取申诉列表)
   - [4.2 审核申诉](#42-审核申诉)
   - [4.3 获取申诉详情](#43-获取申诉详情)
   - [4.4 获取统计数据](#44-获取统计数据)
   - [4.5 获取黑名单列表](#45-获取黑名单列表管理端)
   - [4.6 手动添加黑名单](#46-手动添加黑名单管理端)
   - [4.7 手动移除黑名单](#47-手动移除黑名单管理端)
   - [4.8 修改黑名单条目](#48-修改黑名单条目)
   - [4.9 删除申诉](#49-删除申诉管理员用)
   - [4.10 清理已处理申诉](#410-清理已处理申诉)
   - [4.11 管理员登录](#411-管理员登录)
   - [4.12 管理员登出](#412-管理员登出)
   - [4.13 获取极验配置](#413-获取极验配置)
   - [4.14 获取管理员列表](#414-获取管理员列表)
   - [4.15 创建管理员](#415-创建管理员)
   - [4.16 修改管理员信息](#416-修改管理员信息)
   - [4.17 删除管理员](#417-删除管理员)
   - [4.18 获取 Bot Token 列表](#418-获取-bot-token-列表)
   - [4.19 创建 Bot Token](#419-创建-bot-token)
   - [4.20 修改 Bot Token](#420-修改-bot-token)
   - [4.21 删除 Bot Token](#421-删除-bot-token)
   - [4.22 获取 Bot Token 原文](#422-获取-bot-token-原文)
   - [4.23 获取系统配置](#423-获取系统配置)
   - [4.24 更新系统配置](#424-更新系统配置)
   - [4.25 重启服务器](#425-重启服务器)
   - [4.26 获取系统信息](#426-获取系统信息)
   - [4.27 查询审计日志](#427-查询审计日志)
   - [4.28 获取日志统计](#428-获取日志统计)
   - [4.29 获取操作类型](#429-获取操作类型)
5. [审计日志系统](#5-审计日志系统)
   - [5.1 日志字段说明](#51-日志字段说明)
   - [5.2 操作类型列表](#52-操作类型列表)
   - [5.3 日志查看权限](#53-日志查看权限)
6. [错误处理与速率限制](#6-错误处理与速率限制)
   - [6.1 状态码说明](#61-状态码说明)
   - [6.2 请求频率限制](#62-请求频率限制)
   - [6.3 IP 封禁机制](#63-ip-封禁机制)
7. [配置文件说明](#7-配置文件说明)
8. [AI 分析接口](#8-ai-分析接口)
   - [8.1 获取申诉AI分析](#81-获取申诉ai分析)
   - [8.2 刷新申诉AI分析](#82-刷新申诉ai分析)
   - [8.3 列出所有AI分析](#83-列出所有ai分析)
   - [8.4 获取AI配置](#84-获取ai配置)
   - [8.5 删除AI分析缓存](#85-删除ai分析缓存)

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

### 1.3 权限等级系统

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
          "added_by": "yll",
          "added_at": "2026-02-01 00:50:00"
      }
  }
  ```

### 2.2 Bot专用接口

> **说明**: 所有 `/api/bot/*` 接口都需要 **Bot Token** 鉴权，且**免人机验证**。
> 
> **鉴权方式**: 在请求头中添加 `Authorization: your_bot_token`

#### 2.2.1 获取黑名单列表（Bot专用）
- **接口地址**: `/api/bot/getlist`
- **请求方法**: `GET`
- **鉴权**: **需要（Bot Token）**
- **其他限制**: 频率限制 + IP限制
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
                  "added_by": "yll",
                  "added_at": "2026-02-01 00:50:00"
              },
              {
                  "user_id": "987654321",
                  "user_type": "group",
                  "reason": "群聊违规",
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
      "reason": "发布违规广告"
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 是 | 加入黑名单的原因 |
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "添加用户成功",
      "data": { ... }
  }
  ```

#### 2.2.4 删除黑名单条目（Bot专用）
- **接口地址**: `/api/bot/delete`
- **请求方法**: `POST`
- **鉴权**: **需要（Bot Token）**
- **其他限制**: 频率限制 + IP限制
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
      "message": "删除用户成功",
      "data": { ... }
  }
  ```

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
      "reason": "发布违规广告"
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 是 | 加入黑名单的原因 |
- **说明**: 功能同 `/api/bot/add`，保留用于兼容旧版Bot

#### 2.3.2 删除黑名单条目（旧接口）
- **接口地址**: `/api/delete`
- **请求方法**: `POST`
- **鉴权**: **需要（Bot Token）**
- **其他限制**: 频率限制 + IP限制
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
- **说明**: 功能同 `/api/bot/delete`，保留用于兼容旧版Bot

---

## 3. 申诉接口（前端用）

### 3.1 提交申诉
- **接口地址**: `/api/appeals`
- **请求方法**: `POST`
- **鉴权**: 不需要
- **说明**:
  - 如果已调用 `/api/appeals/verify-captcha` 完成验证且未超过5分钟，则提交申诉时会自动跳过重复验证
  - `geetest` 数据必须与 `verify-captcha` 接口使用的一致
- **请求体**:
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
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号，必须与 `verify-captcha` 接口使用的一致 |
  | `user_type` | string | 否 | 类型：`user`(个人QQ，默认)、`group`(群号) |
  | `content` | string | 是 | 申诉内容，最多2000字 |
  | `contact_email` | string | 是 | 联系邮箱 |
  | `images` | array | 否 | 图片URL列表，最多3张 |
  | `geetest` | object | 否 | 极验验证数据（如已单独验证则为可选） |
  | `geetest.lot_number` | string | 条件 | 验证流水号（未单独验证时为必填） |
  | `geetest.captcha_output` | string | 条件 | 验证输出信息（未单独验证时为必填） |
  | `geetest.pass_token` | string | 条件 | 验证通过标识（未单独验证时为必填） |
  | `geetest.gen_time` | string | 条件 | 验证通过时间戳（未单独验证时为必填） |
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
- **重复提交响应示例**（已有进行中的申诉）：
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
  | `user_type` | string | 否 | 类型：`user`(个人)、`group`(群号)，不指定则同时匹配 |
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
- **说明**: 仅允许修改状态为 `pending` 的申诉
- **请求体**:
  ```json
  {
      "user_id": "1234567890",
      "content": "修改后的申诉内容",
      "contact_email": "new@example.com",
      "images": ["/uploads/appeals/xxx.jpg"]
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
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
- **说明**: 仅允许删除状态为 `pending` 的申诉
- **请求体**:
  ```json
  {
      "user_id": "1234567890"
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
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

### 3.4 人机验证接口（极验 GT4）
- **接口地址**: `/api/appeals/verify-captcha`
- **请求方法**: `POST`
- **鉴权**: 不需要
- **说明**: 
  - 极验 GT4 人机验证服务端验证接口
  - 验证成功后会缓存结果（5分钟），后续提交申诉时无需重复验证
  - **注意**: 提交申诉时使用的 `user_id` 必须与本接口一致
- **请求体**:
  ```json
  {
      "provider": "geetest",
      "user_id": "1234567890",
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
  | `provider` | string | 是 | 验证提供商，固定为 `geetest` |
  | `user_id` | string | 是 | 用户ID或群号，用于缓存验证结果 |
  | `geetest.lot_number` | string | 是 | 验证流水号 |
  | `geetest.captcha_output` | string | 是 | 验证输出信息 |
  | `geetest.pass_token` | string | 是 | 验证通过标识 |
  | `geetest.gen_time` | string | 是 | 验证通过时间戳 |
- **响应示例**（验证成功）:
  ```json
  {
      "success": true,
      "message": "验证通过",
      "data": {
          "provider": "geetest",
          "verified": true
      }
  }
  ```
- **响应示例**（缓存命中）:
  ```json
  {
      "success": true,
      "message": "验证通过（缓存）",
      "data": {
          "provider": "geetest",
          "verified": true,
          "from_cache": true
      }
  }
  ```
- **响应示例**（验证失败）:
  ```json
  {
      "success": false,
      "message": "人机验证失败，请重试"
  }
  ```

### 3.5 上传图片
- **接口地址**: `/api/upload`
- **请求方法**: `POST`
- **鉴权**: 不需要
- **Content-Type**: `multipart/form-data`
- **请求参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `file` | File | 图片文件（最大5MB） |
- **限制说明**:
  - 文件大小：最大5MB，更大文件请联系管理员
  - 文件类型：png, jpg, jpeg, gif, webp
- **去重说明**:
  - 系统会自动检测重复图片（基于文件内容 MD5 哈希）
  - 如果上传的图片已存在，将直接返回已有图片的路径，不会重复存储
  - 通过响应中的 `existing` 字段可判断是否为已存在的文件
- **响应示例**:
  ```json
  {
      "success": true,
      "message": "上传成功",
      "data": {
          "filename": "20260316_abc123def456.jpg",
          "original_name": "screenshot.jpg",
          "path": "appeals/20260316_abc123def456.jpg",
          "size": 2048576,
          "url": "/uploads/appeals/20260316_abc123def456.jpg",
          "existing": false
      }
  }
  ```
- **重复文件响应示例**:
  ```json
  {
      "success": true,
      "message": "该图片已存在，返回已有文件",
      "data": {
          "filename": "20260315_xyz789abc123.jpg",
          "original_name": "screenshot.jpg",
          "path": "appeals/20260315_xyz789abc123.jpg",
          "size": 2048576,
          "url": "/uploads/appeals/20260315_xyz789abc123.jpg",
          "existing": true
      }
  }
  ```

### 3.6 访问上传的文件
- **接口地址**: `/uploads/{filename}`
- **请求方法**: `GET`
- **鉴权**: 不需要
- **说明**: 直接访问上传的图片文件

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

## 4. 管理接口（管理员用）

### 4.1 获取申诉列表
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

### 4.2 获取申诉详情
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

### 4.3 审核申诉
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

### 4.4 获取统计数据
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

### 4.5 获取黑名单列表（管理端）
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

### 4.6 手动添加黑名单（管理端）
- **接口地址**: `/api/admin/blacklist`
- **请求方法**: `POST`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **请求体":
  ```json
  {
      "user_id": "1234567890",
      "user_type": "user",
      "reason": "严重违规"
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_id` | string | 是 | 用户ID或群号 |
  | `user_type` | string | 否 | 类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 是 | 加入黑名单的原因 |
- **响应示例**: 同 2.3

### 4.7 手动移除黑名单（管理端）
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

### 4.8 修改黑名单条目
- **接口地址**: `/api/admin/blacklist/{user_id}`
- **请求方法**: `PUT`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 3+
- **说明**: 修改黑名单条目（支持修改原因、ID、类型）
- **请求体":
  ```json
  {
      "user_type": "user",           // 原类型，可选，默认"user"
      "reason": "新的违规原因",     // 可选
      "new_user_id": "新QQ号",      // 可选，用于修改ID
      "new_user_type": "group"      // 可选，用于修改类型
  }
  ```
- **参数说明**:
  | 参数名 | 类型 | 必填 | 说明 |
  | :--- | :--- | :--- | :--- |
  | `user_type` | string | 否 | 原类型：`user`(用户，默认)、`group`(群聊) |
  | `reason` | string | 否 | 新的违规原因 |
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
          "added_by": "bot:xxx",
          "added_at": "2026-03-16 10:00:00",
          "updated_at": "2026-03-16 14:00:00"
      }
  }
  ```

### 4.9 删除申诉（管理员用）
- **接口地址**: `/api/admin/appeals/{appeal_id}`
- **请求方法**: `DELETE`
- **鉴权**: **需要（管理员 Token）**
- **说明**: 管理员可删除任意状态的申诉
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

### 4.10 清理已处理申诉
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

### 4.11 管理员登录
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

### 4.12 管理员登出
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

### 4.13 获取极验配置
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

### 4.14 获取管理员列表
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

### 4.15 创建管理员
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

### 4.16 修改管理员信息
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

### 4.17 删除管理员
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

### 4.18 获取 Bot Token 列表
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

### 4.19 创建 Bot Token
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

### 4.20 修改 Bot Token
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

### 4.21 删除 Bot Token
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

### 4.22 获取 Bot Token 原文
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

### 4.23 获取系统配置
- **接口地址**: `/api/admin/config`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（超级管理员）
- **说明**: 获取所有站点配置信息，包含以下文件内容：
  - `config.json` - 系统核心配置
  - `admin_tokens.json` - 管理员列表
  - `blacklist.json` - 黑名单数据
  - `tokenlist.json` - Bot Token 列表
  - `appeals.json` - 申诉数据
  
  注意：所有敏感信息（密码、密钥等）都会完整返回
- **响应示例**:
  ```json
  {
      "success": true,
      "data": {
          "config": {
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
          },
          "admin_tokens": {
              "admins": [
                  {
                      "admin_id": "admin1",
                      "name": "管理员1",
                      "level": 4,
                      "created_at": "2026-03-16 00:00:00",
                      "password": "admin_password"
                  }
              ]
          },
          "blacklist": {
              "blacklist": [...],
              "updateAt": "2026-03-19 03:17:20"
          },
          "tokenlist": {
              "bots": {...}
          },
          "appeals": {
              "appeals": [...],
              "updateAt": "2026-03-19 03:17:38"
          }
      }
  }
  ```

### 4.24 更新系统配置
- **接口地址**: `/api/admin/config`
- **请求方法**: `PUT`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 4（超级管理员）
- **说明**: 部分更新配置，修改后需要重启生效。等级4管理员可以修改任何配置，包括敏感配置（smtp、geetest）
- **请求体**:
  ```json
  {
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

### 4.25 重启服务器
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

### 4.26 获取系统信息
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

### 4.27 查询审计日志
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
                  "details": {
                      "level": 4,
                      "success": true
                  },
                  "ip": "192.168.1.100",
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

### 4.28 获取日志统计
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

### 4.29 获取操作类型
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
          "appeal_create": "创建申诉",
          "appeal_review": "审核申诉"
      }
  }
  ```

---

## 8. AI 分析接口

AI 分析功能用于辅助审核申诉，自动分析申诉内容并给出审核建议。

### 安全防护机制

为了防止提示词注入（Prompt Injection）攻击，系统采用以下多层防护策略：

1. **输入清理**
   - 过滤危险字符和控制字符
   - 移除常见的提示词注入模式（如"忽略之前的指令"等）
   - 转义XML标签防止标签注入
   - 限制输入长度（申诉内容最大2000字符）

2. **结构隔离**
   - 使用XML标签明确隔离系统指令和用户数据
   - 在系统指令中明确指示AI忽略任何改变角色的尝试

3. **输出验证**
   - 验证AI返回的JSON格式是否符合预期
   - 限制字段长度防止溢出攻击
   - 移除HTML标签防止XSS攻击
   - 确保confidence值在0-100范围内
   - 确保recommendation值为预定义的有效值之一

4. **内容审计**
   - 所有AI分析请求和响应均记录审计日志
   - 异常情况可被追踪和审查

### 8.1 获取申诉AI分析
- **接口地址**: `/api/admin/appeals/{appeal_id}/ai-analysis`
- **请求方法**: `GET`
- **鉴权**: **需要（管理员 Token）**
- **需要等级**: 2+
- **查询参数**:
  | 参数名 | 类型 | 说明 |
  | :--- | :--- | :--- |
  | `refresh` | bool | 是否强制刷新分析（true/false，默认false） |
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
                "risk_factors": []
            },
            "message": null
        }
    }
    ```
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

### 8.2 刷新申诉AI分析
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

### 8.3 列出所有AI分析
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

### 8.4 获取AI配置
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
          "has_api_key": true
      }
  }
  ```

### 8.5 删除AI分析缓存
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

---

## 5. 审计日志系统

系统记录所有敏感操作的审计日志，便于追踪和审查。

### 5.1 日志字段说明

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `timestamp` | string | 操作时间（格式：YYYY-MM-DD HH:MM:SS） |
| `action_type` | string | 操作类型，如 `admin_login`, `blacklist_add` 等 |
| `operator_id` | string | 操作者ID（admin_id/bot_name/user_id） |
| `operator_type` | string | 操作者类型：`admin`/`bot`/`user` |
| `operator_level` | int | 操作者等级（1-4，仅admin类型有） |
| `details` | object | 操作详情，包含具体操作的参数和结果 |
| `ip` | string | 操作者IP地址 |
| `status` | string | 操作状态：`success`/`failure` |

### 5.2 操作类型列表

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
| `blacklist_add` | 添加黑名单 | Bot/等级3+ |
| `blacklist_remove` | 移除黑名单 | Bot/等级3+ |
| `blacklist_update` | 更新黑名单 | 等级3+ |
| `appeal_create` | 创建申诉 | 用户 |
| `appeal_update` | 更新申诉 | 用户 |
| `appeal_delete` | 删除申诉 | 用户/等级3+ |
| `appeal_review` | 审核申诉 | 等级2+ |
| `config_update` | 更新系统配置 | 等级4 |
| `system_restart` | 系统重启 | 等级4 |
| `file_upload` | 文件上传 | 所有用户 |
| `ai_analysis_query` | 查询AI分析 | 等级2+ |
| `ai_analysis_refresh` | 刷新AI分析 | 等级2+ |
| `ai_analysis_delete` | 删除AI分析缓存 | 等级3+ |

### 5.3 日志查看权限

| 查看者等级 | 可查看的日志范围 |
| :--- | :--- |
| 等级 4 | 所有日志（包括等级4的操作） |
| 等级 3 | 等级3及以下的日志（排除等级4的操作） |
| 等级 2 | 只能查看自己的日志 |
| 等级 1 | 只能查看自己的日志 |

**说明**: 此权限控制确保高权限操作（如超级管理员的操作）只有超级管理员自己可以看到，低等级管理员无法查看高等级管理员的操作记录。

---

## 6. 错误处理与速率限制

### 6.1 状态码说明

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

### 6.2 请求频率限制

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

### 6.3 IP 封禁机制

- **IP 限制**: 鉴权失败超过 `ip_limit_max_attempts` 次（默认5次），IP 将被封禁 `ip_limit_window` 秒（默认1小时）
- **文件上传**: 单文件最大5MB

---

## 7. 配置文件说明

`config.json` 示例：

```json
{
    "host": "0.0.0.0",
    "port": 8080,
    "debug": false,
    "blacklist_file": "blacklist.json",
    "token_list_file": "tokenlist.json",
    "admin_token_file": "admin_tokens.json",
    "appeals_file": "appeals.json",
    "upload_folder": "uploads",
    "max_upload_size": 5242880,
    "allowed_extensions": ["png", "jpg", "jpeg", "gif", "webp"],
    "cache_ttl": 300,
    "ip_limit_max_attempts": 5,
    "ip_limit_window": 3600,
    "log_level": "INFO",
    "ip_header": "X-Forwarded-For"
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `host` | string | "0.0.0.0" | 服务器绑定地址 |
| `port` | int | 8080 | 服务器端口 |
| `debug` | bool | false | 调试模式 |
| `blacklist_file` | string | "blacklist.json" | 黑名单数据文件 |
| `token_list_file` | string | "tokenlist.json" | Bot Token 文件 |
| `admin_token_file` | string | "admin_tokens.json" | 管理员 Token 文件 |
| `appeals_file` | string | "appeals.json" | 申诉数据文件 |
| `upload_folder` | string | "uploads" | 上传文件目录 |
| `max_upload_size` | int | 5242880 | 最大上传文件大小（字节，默认5MB） |
| `allowed_extensions` | array | ["png", "jpg", ...] | 允许的文件扩展名 |
| `cache_ttl` | int | 300 | 数据缓存时间（秒） |
| `ip_limit_max_attempts` | int | 5 | IP 最大错误尝试次数 |
| `ip_limit_window` | int | 3600 | IP 尝试计数窗口（秒） |
| `temp_token_ttl` | int | 3600 | 管理员临时 token 有效期（秒，默认1小时） |
| `audit_log_file` | string | "logs/audit.log" | 审计日志文件路径 |
| `audit_log_retention_days` | int | 90 | 审计日志保留天数 |
| `audit_log_max_size` | int | 104857600 | 审计日志最大大小（字节，默认100MB） |
| `rate_limit_window` | int | 1 | 频率限制时间窗口（秒） |
| `rate_limit_max_requests` | int | 3 | 时间窗口内最大请求数 |
| `log_level` | string | "INFO" | 日志级别 |
| `ip_header` | string | "X-Forwarded-For" | 获取真实 IP 的请求头 |
| `allowed_origins` | array | ["http://localhost:5173", ...] | **统一的域名白名单**，用于 CORS 和防盗链 |

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

## 7. 目录结构

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
│   └── appeal_manager.py  # 申诉数据管理
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
