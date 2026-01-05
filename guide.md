# 无名杀部署指南（本地与 Docker）

本指南基于当前仓库结构，提供两种部署方式：
1) 本地部署（前端 + 联机 WS）
2) Docker 一键部署（单镜像）

默认端口：
- 网页/静态资源：8089
- 联机 WS：8080

---

## 一、本地部署全流程

### 1. 环境准备
- Node.js: ^20.19.0 或 >=22.12.0
- pnpm: >=9

确认版本：
```bash
node -v
npm -v
pnpm -v
```

### 2. 构建前端
```bash
cd /home/qzy/sanguosha/noname
pnpm install
pnpm build:full
```

### 3. 运行网页服务（8089）
构建产物在 `dist/`，用以下命令启动服务：
```bash
pnpm serve
```

### 4. 运行联机 WS 服务（8080）
`scripts/server.js` 是 CommonJS，仓库 `type: module`，建议复制为 `.cjs` 再运行：
```bash
cp /home/qzy/sanguosha/noname/scripts/server.js /home/qzy/sanguosha/noname/scripts/server.cjs
node /home/qzy/sanguosha/noname/scripts/server.cjs
```

### 5. 访问与联机方式
- 网页地址：`http://<服务器IP>:8089/`
- 联机地址（游戏内填写）：`<服务器IP>` 或 `ws://<服务器IP>:8080`

---

## 二、Docker 一键部署全流程

### 1. 构建镜像
```bash
cd /home/qzy/sanguosha/noname
docker build -t noname-all .
```

### 2. 启动容器
```bash
docker run -d --name noname \
  -p 8089:8089 \
  -p 8080:8080 \
  noname-all
```

### 3. 查看状态与日志
```bash
docker ps
docker logs -f noname
```

### 4. 访问与联机方式
- 网页地址：`http://<服务器IP>:8089/`
- 联机地址（游戏内填写）：`<服务器IP>` 或 `ws://<服务器IP>:8080`

---

## 常见问题

### 端口占用
如果 Docker 启动时报 8080/8089 被占用，先停止本地进程或修改端口映射。

### 仅本机访问
本机可用 `127.0.0.1` 测试；局域网其他设备需使用服务器内网 IP。
