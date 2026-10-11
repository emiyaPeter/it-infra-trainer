---
title: Ansible入门实战
description: 安装Ansible、Inventory文件、Ad-hoc命令快速上手
difficulty: beginner
estimatedTime: 90
---

# Ansible 入门实战

## 1. 安装 (在WSL2 Ubuntu中)

```bash
sudo apt update && sudo apt install ansible -y
ansible --version
```

## 2. Inventory 主机清单

```ini
# ~/ansible-hosts
[webservers]
web01 ansible_host=10.0.0.10 ansible_user=ubuntu
web02 ansible_host=10.0.0.11 ansible_user=ubuntu

[dbservers]
db01 ansible_host=10.0.0.20 ansible_user=ubuntu
```

## 3. Ad-hoc 命令

```bash
# Ping所有主机
ansible all -i ~/ansible-hosts -m ping

# 查看磁盘
ansible webservers -i ~/ansible-hosts -m shell -a "df -h"

# 安装Nginx
ansible webservers -i ~/ansible-hosts -m apt -a "name=nginx state=present" --become

# 重启服务
ansible webservers -i ~/ansible-hosts -m systemd -a "name=nginx state=restarted" --become
```

## 4. 实验：用本机学习

```bash
# 用本机作为目标（不需要多台服务器）
echo -e "[local]\nlocalhost ansible_connection=local" > ~/ansible-hosts
ansible local -i ~/ansible-hosts -m ping
ansible local -i ~/ansible-hosts -m apt -a "name=nginx state=present" --become
```

## 📺 免费资源
- [Ansible 101 (Jeff Geerling)](https://www.youtube.com/playlist?list=PL2_OBreMn7FqZkvMYt6ATmgC0WG9XHCsh)
- [Ansible官方入门](https://docs.ansible.com/ansible/latest/getting_started/)
