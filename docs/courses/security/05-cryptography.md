---
title: 密码学基础 — 运维必知必会
description: 对称/非对称加密、哈希、PKI、TLS 证书管理实战
difficulty: intermediate
estimatedTime: 90
prerequisites:
  - ../01-security-concepts
---

# 密码学基础

运维日常与证书、密钥、签名打交道。本节聚焦你实际会用到的密码学知识。

## 1. 三大概念

| 类型 | 用途 | 代表算法 |
|------|------|----------|
| 对称加密 | 加解密用同一个密钥（快） | AES |
| 非对称加密 | 公钥加密、私钥解密（安全） | RSA, ECC |
| 哈希 | 单向摘要，不可逆 | SHA-256 |

## 2. OpenSSL 实战

```bash
# 生成 RSA 私钥
openssl genrsa -out private.key 2048

# 生成自签名证书
openssl req -new -x509 -key private.key -out cert.pem -days 365

# 查看证书内容
openssl x509 -in cert.pem -text -noout

# 生成 CSR（证书签名请求）
openssl req -new -key private.key -out request.csr
```

## 3. Let's Encrypt 免费证书

```bash
apt install certbot
certbot certonly --standalone -d example.com -d www.example.com
# 证书位置: /etc/letsencrypt/live/example.com/
# 自动续期: certbot renew --dry-run
```

## 4. SSH 密钥管理

```bash
ssh-keygen -t ed25519 -C "alice@company.com"  # ED25519 推荐
ssh-copy-id user@server                        # 复制公钥
ssh-keygen -R hostname                         # 移除过期 host key
```

## 5. 自测

<details>
<summary>1. 对称加密和非对称加密的核心区别？</summary>
对称：加密解密用**同一个**密钥，速度快（AES）。非对称：公钥加密、私钥解密，速度慢但解决了密钥分发问题（RSA/ECC）。现实中两者结合：用非对称加密传递对称密钥（TLS 就是这样）。
</details>

<details>
<summary>2. 为什么要用 ED25519 而不是 RSA？</summary>
ED25519 密钥更短（256bit vs 2048+），签名速度更快，安全性相当甚至更好。现代系统建议默认 ED25519。
</details>
