---
title: 身份与访问管理 (IAM) — 企业实战
description: 掌握认证、授权、SSO、MFA 的企业级实施
difficulty: intermediate
estimatedTime: 90
prerequisites:
  - ../../linux/03-users-groups
  - ../01-security-concepts
---

# 身份与访问管理 (IAM)

IAM 是安全的第一道门。本节聚焦真实企业中身份管理的架构与实践。

## 1. 认证 vs 授权

- **认证 (Authentication)**: 你是谁 → 密码/密钥/MFA/生物特征
- **授权 (Authorization)**: 你能做什么 → 权限/RBAC/ACL

## 2. MFA 多因素认证

三类因素：你知道的（密码）、你拥有的（手机/YubiKey）、你是的（指纹/人脸）

```bash
# Linux 上配置 Google Authenticator PAM
apt install libpam-google-authenticator
google-authenticator     # 生成密钥，扫码绑定

# /etc/pam.d/sshd 中添加
auth required pam_google_authenticator.so
```

## 3. 最小权限原则 (PoLP)

每个用户/服务只拥有完成工作所需的最小权限，不多不少。定期审查：`awk -F: '$3==0{print $1}' /etc/passwd` 检查特权账户。

## 4. SSO 单点登录

LDAP/AD + SAML/OIDC：一次登录访问所有系统。通常用 Keycloak/Authentik 等开源方案实现。

## 5. 自测

<details>
<summary>1. 认证和授权的区别？</summary>
认证 = 证明你是谁（登录），授权 = 确定你能访问什么（权限检查）。先认证后授权。
</details>

<details>
<summary>2. MFA 为什么比单密码安全？</summary>
即使密码泄露，攻击者仍需要第二因素（手机/硬件密钥）才能登录。MFA 阻挡了 99% 的密码攻击。
</details>

<details>
<summary>3. 为什么要给服务账户最小权限？</summary>
如果服务被攻破（如 Web 应用漏洞），攻击者只能以该服务账户的身份操作。权限越小，破坏范围越小。
</details>
