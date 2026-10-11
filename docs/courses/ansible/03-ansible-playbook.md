---
title: Ansible Playbook 实战
description: 编写YAML剧本、使用变量、组织角色
difficulty: intermediate
estimatedTime: 90
---

# Ansible Playbook 实战

Playbook是Ansible的核心——用YAML描述目标状态，而不是执行步骤。

## 1. 第一个Playbook

```yaml
# deploy-web.yml
- name: 部署Web服务器
  hosts: webservers
  become: yes
  vars:
    nginx_port: 80
  tasks:
    - name: 安装Nginx
      apt: name=nginx state=latest
    - name: 启动Nginx
      systemd: name=nginx state=started enabled=yes
    - name: 部署网站文件
      copy: src=./index.html dest=/var/www/html/ mode=0644
    - name: 配置防火墙
      ufw: rule=allow port={{ nginx_port }} proto=tcp
```

运行: `ansible-playbook -i ~/ansible-hosts deploy-web.yml`

## 2. 关键概念

- **vars**: 变量，用`{{ }}`引用
- **handlers**: 仅在配置变更时触发（如改了Nginx配置才重启）
- **templates**: Jinja2模板，动态生成配置文件
- **roles**: 可复用的Playbook模块（ansible-galaxy init创建）

## 3. 实验

```bash
# 创建Playbook → 在WSL2本地运行
ansible-playbook -c local deploy-web.yml
curl localhost
```

## 📺 免费资源
- [Ansible Playbook教程](https://www.youtube.com/watch?v=Kui1UDzQ2rA) — YouTube
- [Ansible Galaxy](https://galaxy.ansible.com/) — 官方角色库
