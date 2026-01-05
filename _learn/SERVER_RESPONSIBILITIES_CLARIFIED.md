
# 无名杀服务端职责详解

> 服务端真正在做什么？有没有游戏逻辑？

---

## 快速答案

**游戏逻辑：** 全部在客户端（特别是主机）  
**服务端职责：** 房间管理 + 消息转发 + 基础验证

```javascript
// 简化的服务端逻辑
const rooms = {};

ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    // 1. 查找房间
    const room = rooms[data.gameId];
    
    // 2. 验证发送者在房间中
    if (!room.players.includes(data.playerId)) {
        return;  // 非法
    }
    
    // 3. 广播给房间内所有人
    room.players.forEach(player => {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(data));
        }
    });
    
    // 就这么简单！
});
```

---

## 服务端的完整职责

```
┌──────────────────────────────────────────────┐
│          服务端职责分类                       │
├──────────────────────────────────────────────┤
│ 有逻辑的部分：                               │
│  ✓ 房间管理                                 │
│  ✓ 玩家连接管理                             │
│  ✓ 基础验证（防止明显的作弊）               │
│  ✓ 超时处理                                 │
│                                              │
│ 无逻辑的部分（只转发）：                     │
│  ✗ 游戏事件处理（useCard、技能触发等）      │
│  ✗ 伤害计算                                 │
│  ✗ 卡牌池                                   │
│  ✗ 技能判定                                 │
│  ✗ 死亡判定                                 │
└──────────────────────────────────────────────┘
```

---

## 服务端的完整代码分析

### 1. 房间管理

```javascript
// noname-server.cts 或 scripts/server.js

const rooms = {};  // 所有房间

// 创建房间
app.post('/createRoom', (req, res) => {
    const gameId = generateId();
    
    rooms[gameId] = {
        host: req.body.hostId,          // 主机
        players: [],                     // 玩家列表
        gameState: 'waiting',            // 状态
        createdAt: Date.now()
    };
    
    res.json({ gameId: gameId });
});

// 加入房间
app.post('/joinRoom', (req, res) => {
    const { gameId, playerId } = req.body;
    const room = rooms[gameId];
    
    if (!room) {
        return res.status(404).json({ error: '房间不存在' });
    }
    
    if (room.players.length >= 4) {
        return res.status(400).json({ error: '房间已满' });
    }
    
    // 添加玩家
    room.players.push({
        id: playerId,
        ws: null,  // 稍后在 WebSocket 连接时赋值
        connected: false
    });
    
    res.json({ success: true });
});

// 销毁房间
setInterval(() => {
    for (const gameId in rooms) {
        const room = rooms[gameId];
        
        // 如果房间已关闭 + 所有玩家都断线
        if (room.gameState === 'closed') {
            const allDisconnected = room.players.every(p => !p.connected);
            
            if (allDisconnected) {
                delete rooms[gameId];  // 销毁房间
            }
        }
    }
}, 60000);  // 每分钟检查一次
```

### 2. WebSocket 消息处理

```javascript
wss.on('connection', (ws) => {
    console.log('玩家连接');
    
    let gameId = null;
    let playerId = null;
    
    // 玩家首次连接，发送连接消息
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        
        // ==================== 第一步：建立连接 ====================
        if (message.type === 'init') {
            gameId = message.gameId;
            playerId = message.playerId;
            
            const room = rooms[gameId];
            if (!room) {
                ws.send(JSON.stringify({ error: '房间不存在' }));
                ws.close();
                return;
            }
            
            // 找到玩家对象
            const player = room.players.find(p => p.id === playerId);
            if (!player) {
                ws.send(JSON.stringify({ error: '玩家不存在' }));
                ws.close();
                return;
            }
            
            // 关键：保存 WebSocket 连接
            player.ws = ws;
            player.connected = true;
            
            // 通知房间内所有人："玩家 X 已连接"
            broadcastToRoom(gameId, {
                type: 'playerConnected',
                playerId: playerId
            });
            
            console.log(`玩家 ${playerId} 已连接到房间 ${gameId}`);
            
            return;  // 重要！不要继续处理
        }
        
        // ==================== 第二步：处理游戏消息 ====================
        // 此时 gameId 和 playerId 已经确定
        
        // 验证：玩家是否在房间中
        const room = rooms[gameId];
        if (!room) {
            return;
        }
        
        const player = room.players.find(p => p.id === playerId);
        if (!player || !player.connected) {
            return;
        }
        
        // ==================== 关键：只转发消息，不处理逻辑 ====================
        switch (message.type) {
            // ✗ 服务端不处理游戏逻辑
            // ✗ 例如：不检查技能是否有效
            // ✗ 例如：不计算伤害
            // ✗ 例如：不检查出牌的合法性
            
            // ✓ 只转发
            case 'useCard':
            case 'respondCard':
            case 'damageStart':
            case 'playerDeath':
                // 直接转发给房间内的所有玩家
                broadcastToRoom(gameId, {
                    ...message,
                    playerId: playerId,  // 附加发送者 ID
                    timestamp: Date.now()
                });
                break;
            
            // ✓ 一些需要服务端处理的特殊消息
            case 'chat':
                // 转发聊天消息（简单转发）
                broadcastToRoom(gameId, {
                    type: 'chat',
                    playerId: playerId,
                    message: message.text
                });
                break;
            
            case 'heartbeat':
                // 心跳包，只需要更新连接状态
                player.lastHeartbeat = Date.now();
                break;
            
            case 'gameOver':
                // 游戏结束，更新房间状态
                room.gameState = 'finished';
                
                // 广播游戏结束
                broadcastToRoom(gameId, {
                    type: 'gameOver',
                    winner: message.winner
                });
                break;
            
            default:
                // 未知消息，忽略
                break;
        }
    });
    
    // 玩家断线处理
    ws.on('close', () => {
        if (gameId && playerId) {
            const room = rooms[gameId];
            
            if (room) {
                const player = room.players.find(p => p.id === playerId);
                if (player) {
                    player.connected = false;
                    
                    // 通知房间内其他玩家
                    broadcastToRoom(gameId, {
                        type: 'playerDisconnected',
                        playerId: playerId
                    });
                    
                    console.log(`玩家 ${playerId} 已断连`);
                }
            }
        }
    });
});

// 广播函数
function broadcastToRoom(gameId, message) {
    const room = rooms[gameId];
    
    if (!room) return;
    
    const data = JSON.stringify(message);
    
    room.players.forEach(player => {
        if (player.connected && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(data);
        }
    });
}
```

### 3. 验证层面（可选）

```javascript
// 服务端可以添加一些基础验证，防止明显的作弊

function validateMessage(message, room) {
    switch (message.type) {
        case 'useCard':
            // ✓ 验证：发送者是否是当前玩家
            if (message.playerId !== room.currentPlayer) {
                console.warn(`非法：${message.playerId} 不是当前玩家`);
                return false;
            }
            
            // ✓ 验证：目标玩家是否在游戏中
            const target = room.players.find(p => p.id === message.target);
            if (!target) {
                console.warn(`非法：目标玩家 ${message.target} 不存在`);
                return false;
            }
            
            // ✗ 验证：不检查技能是否真的有效
            // ✗ 原因：服务端不知道游戏规则
            // ✗ 可能的恶意：玩家声称造成 100 点伤害
            // ✗ 但验证需要知道技能的定义、卡牌的定义等
            // ✗ 太复杂，通常交给客户端验证
            
            return true;
        
        case 'respondCard':
            // ✓ 验证：是否轮到响应
            // （这取决于游戏状态，通常也由主机验证）
            
            return true;
        
        default:
            return true;
    }
}
```

---

## 对比：服务端 vs 主机客户端

```
┌─────────────────────────────────────────────────────────┐
│               职责分工对比                               │
├────────────┬──────────────────┬──────────────────────────┤
│ 功能       │ 服务端           │ 主机客户端               │
├────────────┼──────────────────┼──────────────────────────┤
│ 房间管理   │ ✓ (创建/销毁)    │ ✗                        │
│            │                  │                          │
│ 玩家连接   │ ✓ (管理连接)     │ ✗                        │
│            │                  │                          │
│ 消息转发   │ ✓ (广播)         │ ✗                        │
│            │                  │                          │
│ 游戏规则   │ ✗                │ ✓ (完整逻辑)            │
│            │                  │                          │
│ 摸牌       │ ✗                │ ✓ (计算牌库)            │
│            │                  │                          │
│ 技能触发   │ ✗                │ ✓ (所有技能逻辑)        │
│            │                  │                          │
│ 伤害计算   │ ✗                │ ✓ (计算伤害值)          │
│            │                  │                          │
│ 死亡判定   │ ✗                │ ✓ (检查 HP)             │
│            │                  │                          │
│ 出牌验证   │ △ (基础验证)     │ ✓ (完整验证)            │
│            │                  │                          │
│ 防作弊     │ △ (检测异常)     │ △ (验证输入)            │
└────────────┴──────────────────┴──────────────────────────┘
```

---

## 实际数据流

### 场景 1：出牌

```
玩家 B 的客户端
  ├─ 点击卡牌
  ├─ 发送 WebSocket 消息：
  │  {
  │    type: 'useCard',
  │    playerId: 'B',
  │    card: { name: '杀', suit: 'heart' },
  │    target: 'C'
  │  }
  │
  └─ 发送到服务器

服务器
  ├─ 接收消息
  ├─ 验证：B 在房间中？ ✓
  ├─ 不验证：这张卡是否真的有效？ ✗
  ├─ 不验证：目标 C 是否合法？ ✗
  │  (客户端验证过了)
  │
  └─ 广播给房间内所有人：
     {
         type: 'useCard',
         playerId: 'B',
         card: { name: '杀', suit: 'heart' },
         target: 'C',
         timestamp: 1234567890
     }

主机客户端（玩家 A）
  ├─ 接收消息
  ├─ 执行完整的游戏逻辑：
  │  ├─ 触发 'useCard' 事件
  │  ├─ 检查 B 是否有激将技能
  │  ├─ 等待 C 的响应（闪、酒等）
  │  ├─ 计算伤害
  │  ├─ 检查 C 是否死亡
  │  └─ 触发死亡事件
  │
  └─ 广播结果

其他客户端
  └─ 接收并显示结果
```

### 场景 2：技能计算（服务端完全不参与）

```
主机客户端执行
  ├─ 检查是否触发 B 的"激将"技能
  │  (这是游戏规则，服务端不知道)
  │
  ├─ 如果触发，让出牌者进行额外操作
  │
  ├─ 计算伤害值
  │  damage = baseAttack + skillBonus - defenseBonus
  │  (服务端完全不知道这个计算)
  │
  ├─ 检查目标是否死亡
  │  if (target.hp <= 0) { target.dead = true }
  │
  └─ 广播给其他客户端

服务器
  └─ 只是转发消息，不参与任何计算
```

---

## 潜在的安全问题

由于服务端不进行游戏逻辑验证，存在作弊的可能性：

### 问题 1：修改客户端代码

```javascript
// 恶意玩家修改自己的客户端代码

// 原本的伤害计算
damage = 1;

// 修改为
damage = 999;

// 发送给服务器
ws.send(JSON.stringify({
    type: 'damage',
    target: 'A',
    damage: 999  // ← 作弊！
}));

// 服务器直接转发，完全不检查
// A 的客户端收到，被迫认为受到了 999 点伤害
```

### 问题 2：发送不合法的消息

```javascript
// 恶意玩家直接发送原始的 WebSocket 消息

// 不使用 UI，直接发送
ws.send(JSON.stringify({
    type: 'useCard',
    playerId: 'A',     // 冒充其他玩家！
    card: 'shan',
    target: 'B'
}));

// 但等等... 服务器验证会拒绝这个吗？

function validateMessage(message, room) {
    // ✗ 服务端通常不做这个验证
    // 因为 WebSocket 连接已经知道是哪个玩家
}

// 实际上，服务端应该这样验证：
if (message.playerId !== authenticatedPlayerId) {
    // 拒绝
}
```

---

## 无名杀的安全设计

### 实际的验证机制

```typescript
// 来自 noname-server.cts

class GameServer {
    private rooms = new Map();
    
    handleMessage(ws: WebSocket, message: any) {
        // 第 1 道防线：连接验证
        const player = this.getPlayerByConnection(ws);
        if (!player) {
            ws.close();
            return;
        }
        
        const room = this.getRoomByPlayer(player);
        if (!room) {
            ws.close();
            return;
        }
        
        // 第 2 道防线：基础验证
        // - 玩家是否在房间中
        // - 消息格式是否正确
        // - 是否试图冒充其他玩家
        
        if (!this.validateMessage(message, room, player)) {
            console.warn(`非法消息来自 ${player.id}`);
            return;
        }
        
        // 第 3 道防线：简单的逻辑检查
        // - 是否轮到这个玩家？
        // - 目标玩家是否存在？
        // - 但 ✗ 不检查技能是否真的有效
        
        switch (message.type) {
            case 'useCard':
                // 只验证基本的：是否是当前玩家在出牌
                if (room.currentPlayer !== player.id) {
                    console.warn(`玩家 ${player.id} 不是当前玩家`);
                    return;
                }
                
                // ✗ 不验证：卡牌是否真的在手里
                // ✗ 不验证：目标是否合法
                // ✗ 这些交给客户端验证
                
                // ✓ 只转发
                this.broadcast(room, message);
                break;
            
            default:
                this.broadcast(room, message);
                break;
        }
    }
}
```

### 为什么不在服务端验证完整逻辑？

#### 原因 1：性能

```
服务端验证完整逻辑
  ├─ 需要在服务端加载所有游戏规则
  ├─ 需要在服务端维护每个房间的游戏状态
  ├─ 需要在服务端执行所有技能判定
  ├─ 需要在服务端计算所有伤害
  └─ 🔴 服务器负载爆表

客户端验证逻辑
  ├─ 每个客户端独立运行游戏逻辑
  ├─ 服务端只是转发消息
  └─ 🟢 服务器轻松应对数千个房间
```

#### 原因 2：代码重复

```
同步客户端和服务端的逻辑
  ├─ 客户端代码（JavaScript）
  ├─ 服务端代码（Node.js）
  ├─ 如果游戏规则改变
  │  └─ 必须同时更新两边
  └─ 🔴 容易不一致

只在客户端执行逻辑
  ├─ 修改一份代码
  └─ 🟢 所有地方都更新
```

#### 原因 3：复杂性

```
完整的服务端验证需要
  ├─ 完整的游戏规则引擎
  ├─ 所有武将定义
  ├─ 所有技能定义
  ├─ 所有卡牌定义
  ├─ 状态机（游戏流程）
  └─ 🔴 整个项目大小翻倍

简单的转发
  ├─ 房间管理
  ├─ 连接管理
  ├─ 消息路由
  └─ 🟢 代码简洁，易维护
```

---

## 回答原问题

### Q: 服务端只负责转发消息？

**答：** 是的，大部分功能只是转发。但完整的职责是：

```
✓ 做的事情：
  1. 房间创建和销毁
  2. 玩家连接和断线管理
  3. 消息广播（转发给所有玩家）
  4. 基础验证（防止连接异常的作弊）
  5. 心跳检测（检测玩家是否在线）
  6. 游戏结束处理

✗ 不做的事情：
  1. 游戏规则判定
  2. 技能触发计算
  3. 伤害数值计算
  4. 卡牌的合法性检查
  5. 比赛胜负计算（由客户端广播）
  6. 任何游戏逻辑
```

### Q: 为什么不在服务端实现完整逻辑？

**答：** 三个原因：

```
1. 性能：客户端计算 > 服务端处理大量计算
2. 维护：改规则只改一份代码
3. 简化：服务端代码只需要 100 行，不是 10000 行
```

### Q: 这样不会有作弊问题吗？

**答：** 会的，但对于无名杀这个项目来说：

```
✓ 是否值得修复作弊：
  - 无名杀是休闲游戏
  - 通常和朋友一起玩（信任环境）
  - 不涉及真实货币或排名
  - 所以作弊成本不高

✗ 完整防作弊的代价：
  - 服务端代码从 100 行变成 10000 行
  - 维护难度大幅增加
  - 但防止的只是"恶意修改客户端"
  - 而不是"利用网络漏洞"（TCP 本身保证）

结论：权衡是合理的
```

---

## 最后的架构总结

```
真实场景：四人游戏

玩家 A（主机）
  ├─ 执行完整的游戏逻辑
  ├─ 计算所有结果
  ├─ 广播给其他人
  └─ 其他人信任 A 的计算结果

玩家 B、C、D（客户端）
  ├─ 接收 A 的计算结果
  ├─ 更新本地显示
  └─ 发送自己的操作到 A

服务器
  ├─ 接收 A 的广播
  ├─ 转发给 B、C、D
  ├─ 接收 B、C、D 的操作
  ├─ 转发给 A
  ├─ 如果有人断线，记录并通知
  └─ 完全不参与游戏逻辑

这种设计的优点：
✓ 服务器负载低
✓ 延迟低（直接路由）
✓ 易于扩展（房间数量不受限制）
✓ 代码简洁

这种设计的缺点：
✗ 容易被作弊
✗ 主机掉线游戏中断
✗ 依赖主机的计算结果
```

现在清楚了吗？服务端就是个**消息枢纽**，真正的智慧在客户端！

