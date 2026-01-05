
# 无名杀联机逻辑深度解析

> 从出牌到响应：多人游戏同步机制详解

---

## 目录
1. [联机的核心问题](#联机的核心问题)
2. [无名杀的架构](#无名杀的架构)
3. [出牌流程详解](#出牌流程详解)
4. [等待响应的实现](#等待响应的实现)
5. [事件同步机制](#事件同步机制)
6. [网络延迟处理](#网络延迟处理)

---

## 联机的核心问题

### 什么是"出牌后等待响应"？

**单机游戏**
```
玩家 A 出牌
  ↓
游戏计算伤害
  ↓
玩家 B 是否使用防卡？
  → 游戏暂停，等待用户输入
  → 用户点击"使用闪"或"不使用"
  ↓
计算结果
  ↓
继续游戏
```

**联机游戏**
```
玩家 A（本机）出牌
  ↓
通过 WebSocket 发送给服务器
  ↓
服务器转发给玩家 B（远程机）
  ↓
玩家 B 的屏幕显示"选择是否防卡"
  ↓
玩家 B 点击"使用闪"
  ↓
玩家 B 的客户端通过 WebSocket 发送响应
  ↓
服务器转发给玩家 A（本机）
  ↓
本机游戏继续：计算伤害、检查是否死亡
  ↓
同步结果给所有玩家
```

### 关键难点

```
1️⃣ 时序问题
   A 出牌
   ↓
   B 需要立即响应（不能乱序）
   ↓
   C 看着 B 的操作
   ↓
   D 等待轮到他

2️⃣ 网络延迟
   A 的出牌信息送到 B 需要 100ms
   B 的响应回到 A 需要 100ms
   总延迟 200ms
   
   怎么让游戏流畅？

3️⃣ 同步一致性
   A、B、C、D 四个客户端
   都要执行同样的游戏逻辑
   得到同样的结果
   
   否则会：
   A 看到 B 死了
   B 看到自己还活着
   游戏崩溃！

4️⃣ 断线重连
   B 中途掉线
   怎么继续游戏？
   B 重新连接后怎么同步状态？
```

---

## 无名杀的架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        玩家 A（主机）                             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  浏览器                                                  │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  前端应用（Vue + 无名杀引擎）                      │ │   │
│  │  │                                                    │ │   │
│  │  │  game 对象（维护游戏状态）                        │ │   │
│  │  │  ├─ players[]  # 所有玩家数据                     │ │   │
│  │  │  ├─ currentPlayer  # 当前轮到谁                  │ │   │
│  │  │  ├─ state  # 游戏状态                             │ │   │
│  │  │  └─ onlineID/onlineKey  # 多人标识               │ │   │
│  │  │                                                    │ │   │
│  │  │  UI 系统（显示界面）                              │ │   │
│  │  │  ├─ 玩家位置                                      │ │   │
│  │  │  ├─ 手牌显示                                      │ │   │
│  │  │  ├─ 对话框（选择、确认）                          │ │   │
│  │  │  └─ 操作按钮                                      │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                      ↑ ↓ WebSocket                     │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  WebSocket 客户端                                 │ │   │
│  │  │  ├─ 连接到 ws://server:8080                       │ │   │
│  │  │  ├─ 监听 message 事件                             │ │   │
│  │  │  ├─ 发送 send() 方法                              │ │   │
│  │  │  └─ 自动心跳（保活）                              │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        WebSocket 双向通信（持久连接）
        数据格式：JSON
        延迟：~100ms（局域网）
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│               Node.js 服务器 (Express + ws)                      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  房间管理                                               │   │
│  │  ├─ room[gameId]  # 每个房间一个对象                  │   │
│  │  │   ├─ host  # 主机玩家信息                          │   │
│  │  │   ├─ players[4]  # 四个玩家的 WebSocket 连接      │   │
│  │  │   ├─ gameState  # 当前游戏状态                     │   │
│  │  │   └─ events[]  # 事件队列                          │   │
│  │  │                                                     │   │
│  │  └─────────────────────────────────────────────────────┘   │
│  │                                                              │
│  │  WebSocket 事件处理                                         │
│  │  ├─ connection  # 玩家连接                                 │
│  │  ├─ message  # 接收玩家的操作                              │
│  │  │   └─ 转发给房间内其他玩家                              │
│  │  └─ disconnect  # 玩家断连                                 │
│  │      └─ 标记玩家离线                                      │
│  │                                                              │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        WebSocket 广播（1 个消息 → 所有玩家）
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                  玩家 B（客户端）                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  浏览器                                                 │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  前端应用                                          │ │   │
│  │  │  ├─ 接收 WebSocket 消息                           │ │   │
│  │  │  ├─ 更新本地 game 对象                            │ │   │
│  │  │  ├─ 触发事件钩子                                  │ │   │
│  │  │  └─ UI 重新渲染                                   │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                      ↑ ↓                              │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  WebSocket 客户端                                 │ │   │
│  │  │  ├─ 监听服务器的广播消息                          │ │   │
│  │  │  └─ 玩家操作时发送给服务器                        │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  （同样的架构和流程）                                            │
└──────────────────────────────────────────────────────────────────┘
```

### 关键概念

```
主机 (Host)
  = 创建房间的玩家 A
  = 执行游戏主逻辑的节点
  = 其他玩家要同步的参考
  
  职责：
  - 执行 game.start()
  - 计算回合逻辑
  - 检查技能触发
  - 计算伤害结果
  - 广播给其他玩家

客户端 (Client)
  = 加入房间的玩家 B、C、D
  = 被动接收主机的指令
  = 只负责显示和用户输入
  
  职责：
  - 接收主机的状态更新
  - 显示游戏界面
  - 收集用户输入
  - 发送操作给主机
```

---

## 出牌流程详解

### 流程 1：出牌的完整链路

```javascript
// ======================== 主机（玩家 A）==================
// 第 1 步：用户在界面上选择卡牌并点击"使用"
ui.click.card(card, async () => {
    // 用户点击了卡牌
    
    // 第 2 步：等待玩家选择目标
    const targets = await ui.create.dialog('选择目标', {
        buttons: [
            { text: '玩家 B', onClick: () => playerB },
            { text: '玩家 C', onClick: () => playerC }
        ]
    });
    
    // 第 3 步：出牌（本地执行）
    game.useCard({
        source: playerA,
        card: card,
        targets: [targets]
    });
});

// ======================== game.useCard() 执行 ===================
async function useCard(info) {
    // 第 4 步：触发 'useCard' 事件
    // 本地：玩家 A 的技能可能被激活
    //       如"激将"可以让对方出牌
    await game.emit('useCard', {
        source: info.source,
        target: info.targets[0],
        card: info.card,
        result: { bool: true }
    });
    
    // 第 5 步：计算伤害（如果是"杀"）
    // 但不立即处理，需要等待对方响应
    
    // 第 6 步：广播给所有玩家
    // 这是关键！
    if (game.online) {
        // 如果是联机模式
        game.send({
            type: 'gameSync',
            event: 'useCard',
            source: playerA.id,
            card: card,
            targets: [playerB.id],
            timestamp: Date.now()
        });
    }
}

// ======================== 玩家 A 的客户端 ==================
// WebSocket 接收 message
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'gameSync') {
        // 更新本地游戏状态
        const source = game.players[message.source];
        const card = lib.element.Card(message.card);
        
        // 如果这是其他玩家的操作，更新屏幕
        if (source !== game.currentPlayer) {
            // 显示"玩家 B 出了一张杀"
            ui.create.cardEffect(card, source);
        }
    }
};

// ======================== 玩家 B 的客户端 ==================
// 1. 收到玩家 A 出牌的消息
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    // 2. 更新本地游戏状态
    const source = game.players[message.source];  // 玩家 A
    const card = lib.element.Card(message.card);   // 一张"杀"
    
    // 3. 显示"玩家 A 对你出了一张杀"
    ui.create.dialog('玩家 A 对你出了一张杀，是否使用闪？');
    
    // 4. 这个对话框是一个 Promise，等待用户点击
    const response = await ui.create.dialog('响应卡', {
        buttons: [
            { text: '使用闪', onClick: () => 'shan' },
            { text: '不使用', onClick: () => null }
        ]
    });
    
    // 5. 用户选择后，发送响应给主机
    if (response === 'shan') {
        ws.send(JSON.stringify({
            type: 'playerResponse',
            event: 'useCard',
            response: 'shan',  // 使用了闪
            timestamp: Date.now()
        }));
    }
};

// ======================== 主机（玩家 A）==================
// 第 7 步：等待玩家 B 的响应
// 这是关键！游戏流程必须暂停，等待响应

// 在主机上，使用 Promise 等待
async function waitForResponse(player, timeout = 10000) {
    return new Promise((resolve, reject) => {
        // 设置超时
        const timer = setTimeout(() => {
            resolve(null);  // 超时没有响应，视为"不使用"
        }, timeout);
        
        // 创建一次性的响应监听器
        const listener = (message) => {
            if (message.type === 'playerResponse') {
                clearTimeout(timer);
                removeListener(listener);
                resolve(message.response);
            }
        };
        
        game.onMessage(listener);
    });
}

// 在 useCard() 中等待响应
async function useCard(info) {
    const source = info.source;
    const target = info.targets[0];
    const card = info.card;
    
    // 触发事件
    await game.emit('useCard', {
        source, target, card,
        result: { bool: true }
    });
    
    // 现在等待目标玩家的响应
    // 这是游戏的关键！
    const response = await waitForResponse(target, 10000);
    
    if (response === 'shan') {
        // 玩家 B 使用了闪，伤害被防止
        console.log('伤害被防止');
    } else if (response === null) {
        // 玩家 B 没有响应（超时或不使用）
        console.log('造成伤害');
        
        // 第 8 步：计算伤害
        target.damage(1);
        
        // 第 9 步：广播伤害结果
        game.send({
            type: 'damageResult',
            target: target.id,
            damage: 1,
            timestamp: Date.now()
        });
    }
}
```

### 时序图

```
时间轴
───────────────────────────────────────────────────

玩家 A (主机)           服务器              玩家 B (客户端)
    │                    │                    │
    ├─ 用户点击卡牌
    │
    ├─ game.useCard()
    │
    ├─ 本地执行事件
    │
    ├─ 广播 "useCard"
    │ ────────────────→ ────────────────→ （延迟 100ms）
    │                                       │
    │                                       ├─ 接收消息
    │                                       │
    │                                       ├─ 显示对话框
    │                                       │ "是否使用闪？"
    │                                       │
    │ (暂停游戏，等待响应)                  ├─ 用户选择
    │                                       │
    │ (继续等待...)                         ├─ 点击"使用闪"
    │                                       │
    │ ←──────────────── ←──────────────── (延迟 100ms)
    │ 收到 response: 'shan'
    │
    ├─ 处理响应结果
    │
    ├─ 伤害被防止
    │
    └─ 继续游戏
```

---

## 等待响应的实现

### 方案 1：Promise + 事件监听器（最常用）

```javascript
// 核心实现
class GamePromises {
    constructor(game) {
        this.game = game;
        this.listeners = {};
    }
    
    // 添加一个一次性监听器
    once(eventName) {
        return new Promise((resolve) => {
            const listener = (data) => {
                // 移除监听器
                delete this.listeners[eventName];
                
                // 返回数据
                resolve(data);
            };
            
            this.listeners[eventName] = listener;
        });
    }
    
    // 触发监听器
    emit(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName](data);
        }
    }
}

// 使用示例
const gamePromises = new GamePromises(game);

// 在处理响应的地方
async function processResponse(message) {
    if (message.type === 'playerResponse') {
        gamePromises.emit('responseReceived', message);
    }
}

// 在等待响应的地方
async function useCard(info) {
    const source = info.source;
    const target = info.targets[0];
    
    // 广播出牌
    game.send({
        type: 'useCard',
        source: source.id,
        target: target.id,
        card: info.card
    });
    
    // 等待响应（超时 10 秒）
    const response = await Promise.race([
        gamePromises.once('responseReceived'),
        new Promise((resolve) => 
            setTimeout(() => resolve(null), 10000)
        )
    ]);
    
    if (response && response.response === 'shan') {
        // 使用了防卡
    } else {
        // 造成伤害
        target.damage(1);
    }
}
```

### 方案 2：使用 async generator（Vue 组件风格）

```javascript
// 这是无名杀项目中实际使用的方法
// 在 noname/game/promises.js 中

class GamePromises {
    constructor(game) {
        this.game = game;
        this.queue = [];
    }
    
    // 创建一个 Promise，但以生成器的方式等待
    async* createSequence(eventType) {
        let step = 0;
        
        while (true) {
            // 提交一个操作，等待响应
            const result = await new Promise((resolve) => {
                this.queue.push({
                    type: eventType,
                    step: step++,
                    resolve: resolve
                });
            });
            
            yield result;
        }
    }
    
    // 处理来自玩家的响应
    handleResponse(message) {
        const pending = this.queue.shift();
        
        if (pending) {
            pending.resolve(message);
        }
    }
}

// 使用示例
async function useCard(info) {
    const promiseSequence = gamePromises.createSequence('playerResponse');
    
    // 广播出牌
    game.send({
        type: 'useCard',
        source: info.source.id,
        target: info.targets[0].id,
        card: info.card
    });
    
    // 等待第一个响应
    const response = await promiseSequence.next();
    
    if (response.value && response.value.response === 'shan') {
        // 处理响应
    }
}
```

### 方案 3：async/await + WebSocket 事件

```javascript
// 最直观的实现方式

class WebSocketManager {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.pendingRequests = new Map();
        this.requestId = 0;
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.requestId && this.pendingRequests.has(message.requestId)) {
                // 这是对某个请求的响应
                const resolve = this.pendingRequests.get(message.requestId);
                this.pendingRequests.delete(message.requestId);
                
                resolve(message.data);
            }
        };
    }
    
    // 发送请求并等待响应
    async requestResponse(data, timeout = 10000) {
        const requestId = this.requestId++;
        
        // 发送请求
        this.ws.send(JSON.stringify({
            ...data,
            requestId: requestId
        }));
        
        // 创建 Promise，等待响应
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                resolve(null);  // 超时
            }, timeout);
            
            // 保存 resolve 函数
            this.pendingRequests.set(requestId, (response) => {
                clearTimeout(timer);
                resolve(response);
            });
        });
    }
}

// 使用
const wsManager = new WebSocketManager('ws://server:8080');

async function useCard(info) {
    // 发送出牌请求，等待响应
    const response = await wsManager.requestResponse({
        type: 'useCard',
        source: info.source.id,
        target: info.targets[0].id,
        card: info.card
    });
    
    if (response) {
        // 处理响应
    }
}
```

---

## 事件同步机制

### 问题：如何保证所有玩家看到相同的结果？

```
情景：出一张杀，对方使用闪防止了伤害

玩家 A（主机）看到：
  伤害被防止了 ✓

玩家 B 看到：
  我使用了闪，防止了伤害 ✓

玩家 C 看到：
  ... 什么都没看到？
  
玩家 D 看到：
  ... 什么都没看到？

问题：C 和 D 应该看到结果，否则游戏不一致！
```

### 解决方案：事件广播

```javascript
// 出牌流程

1️⃣ 主机广播"出牌"事件
game.send({
    type: 'gameEvent',
    event: 'useCard',
    source: A.id,
    target: B.id,
    card: card,
    timestamp: Date.now()
});

// 所有玩家（包括主机）接收并显示
ws.onmessage = (message) => {
    if (message.type === 'gameEvent') {
        // 在屏幕上显示卡牌飞向对方
        ui.show.cardEffect(message);
    }
};

2️⃣ 玩家 B 选择响应
// 玩家 B 点击"使用闪"后
ws.send({
    type: 'playerAction',
    action: 'respond',
    response: 'shan',
    timestamp: Date.now()
});

3️⃣ 主机收到响应，计算结果
// 主机发送最终结果
game.send({
    type: 'gameEvent',
    event: 'damageBlocked',
    source: A.id,
    target: B.id,
    reason: 'blocked_by_shan',
    timestamp: Date.now()
});

// 所有玩家看到"伤害被防止"的动画
```

### 架构：事件层次

```
应用层
  ↓
游戏事件
  ├─ useCard（出牌）
  ├─ respondCard（响应）
  ├─ damageStart（伤害开始）
  ├─ damageEnd（伤害结束）
  ├─ skillTriggered（技能触发）
  └─ playerDeath（玩家死亡）
  
  这些事件在主机计算，然后广播给所有客户端
  
  ↓
  
WebSocket 层
  ├─ 消息格式：JSON
  ├─ 消息类型：gameEvent / playerAction / sync
  ├─ 每条消息包含：timestamp（时间戳）
  └─ 用于去重和顺序保证
  
  ↓
  
网络层
  └─ TCP (WebSocket 基于 TCP)
      ├─ 保证消息不丢失
      ├─ 保证消息顺序
      └─ 如果网络中断，连接断开
```

---

## 网络延迟处理

### 问题 1：延迟导致的不同步

```
情景：主机 A 出牌给 B

实际时间顺序：
T=0ms     玩家 A 出牌
T=100ms   消息到达玩家 B
T=200ms   玩家 B 选择防卡
T=300ms   响应消息到达主机 A
T=350ms   主机广播结果

但如果网络延迟不稳定：
T=0ms     玩家 A 出牌
T=150ms   消息到达玩家 C
T=100ms   消息到达玩家 B（乱序！）
T=200ms   玩家 B 选择防卡

怎么处理乱序消息？

答案：使用时间戳和序列号
```

### 解决方案 1：时间戳和 eventId

```javascript
// 每个事件都有全局递增的 ID 和时间戳

let eventSequence = 0;

function broadcastEvent(event) {
    const message = {
        eventId: eventSequence++,        // 全局递增
        timestamp: Date.now(),            // 发送时间
        type: event.type,
        data: event
    };
    
    // 所有客户端接收
    game.send(message);
}

// 客户端接收
const receivedEvents = new Map();

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    // 按 eventId 排序，保证顺序处理
    receivedEvents.set(message.eventId, message);
    
    // 按 eventId 处理所有消息
    processEventsInOrder();
};

function processEventsInOrder() {
    let nextId = 0;
    
    while (receivedEvents.has(nextId)) {
        const message = receivedEvents.get(nextId);
        
        // 处理这个事件
        handleGameEvent(message);
        
        nextId++;
    }
}
```

### 解决方案 2：确认机制（ACK）

```javascript
// 关键消息需要确认

async function broadcastWithConfirmation(event) {
    const eventId = generateId();
    
    // 1. 广播事件给所有玩家
    game.send({
        type: 'gameEvent',
        eventId: eventId,
        data: event
    });
    
    // 2. 等待所有玩家的确认
    const confirmations = await Promise.all([
        waitForAck(playerB, eventId, 5000),
        waitForAck(playerC, eventId, 5000),
        waitForAck(playerD, eventId, 5000)
    ]);
    
    // 3. 如果有玩家没有确认，重新发送
    confirmations.forEach((ack, index) => {
        if (!ack) {
            console.warn(`玩家 ${index} 没有确认事件 ${eventId}`);
            // 重新发送或断线处理
        }
    });
}

function waitForAck(player, eventId, timeout) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), timeout);
        
        const listener = (message) => {
            if (message.type === 'ack' && message.eventId === eventId) {
                clearTimeout(timer);
                resolve(true);
            }
        };
        
        game.onMessage(listener);
    });
}
```

### 解决方案 3：乐观更新 + 回滚

```javascript
// 玩家本地立即显示操作结果
// 等待主机确认，如果不符合就回滚

// 玩家 B 使用闪
ui.useCard('shan');

// 本地立即显示
ui.show.animation('shan_used');
game.scene.display.update();

// 发送给主机
ws.send({
    type: 'playerAction',
    action: 'shan'
});

// 等待主机确认
ws.onmessage = (message) => {
    if (message.type === 'actionResult') {
        if (message.success) {
            // 主机确认，继续
            console.log('闪成功使用');
        } else {
            // 主机不认可，回滚
            console.log('操作无效，回滚');
            ui.undo.animation('shan_used');
            game.scene.display.update();
        }
    }
};
```

### 解决方案 4：断线重连

```javascript
// 玩家断线处理

ws.onclose = () => {
    console.log('连接断开');
    
    // 保存当前状态
    const gameState = {
        gameId: game.onlineID,
        playerId: game.playerIndex,
        lastEventId: lastProcessedEventId,
        timestamp: Date.now()
    };
    
    localStorage.setItem('gameState', JSON.stringify(gameState));
    
    // 显示重连对话框
    ui.show.dialog('连接断开，正在重连...');
    
    // 尝试重新连接
    reconnect();
};

async function reconnect() {
    try {
        // 创建新的 WebSocket 连接
        ws = new WebSocket('ws://server:8080');
        
        ws.onopen = () => {
            // 发送重连请求，附加保存的状态
            ws.send(JSON.stringify({
                type: 'reconnect',
                gameState: JSON.parse(localStorage.getItem('gameState'))
            }));
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'reconnectSuccess') {
                // 主机发送最新状态
                game.sync(message.gameState);
                
                // 重新开始接收事件
                ui.show.dialog('重连成功');
                localStorage.removeItem('gameState');
            }
        };
    } catch (error) {
        console.error('重连失败', error);
        // 几秒后重试
        setTimeout(reconnect, 3000);
    }
}
```

---

## 实际代码示例：完整的响应流程

### 无名杀项目中的实现

#### 1. 出牌（game/index.js）

```javascript
// 玩家出杀
async function useCard(cardData) {
    const source = this.currentPlayer;
    const targets = await this.selectTargets(cardData);
    
    // 如果是联机模式，广播
    if (this.online) {
        this.broadcastEvent({
            type: 'useCard',
            source: source.id,
            targets: targets.map(t => t.id),
            card: cardData
        });
    }
    
    // 本地处理出牌事件
    await this.emit('useCard', {
        source: source,
        targets: targets,
        card: cardData,
        result: { bool: true }
    });
    
    // 触发技能（其他玩家可能有反应技能）
    // 但需要等待远程玩家的响应
    
    const target = targets[0];
    
    // 等待对方是否有响应卡
    await this.waitForResponse(target);
    
    // 计算伤害
    // ...
}
```

#### 2. 等待响应（game/promises.js）

```javascript
async waitForResponse(player, timeout = 10000) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            this.responseHandlers.delete(player.id);
            resolve(null);  // 超时
        }, timeout);
        
        // 设置响应处理器
        this.responseHandlers.set(player.id, (response) => {
            clearTimeout(timer);
            resolve(response);
        });
        
        // 如果是本机玩家，显示对话框
        if (player === this.me) {
            ui.show.respondDialog();
        }
        
        // 如果是远程玩家，等待 WebSocket 消息
        // （在 WebSocket 事件处理器中处理）
    });
}
```

#### 3. WebSocket 消息处理

```javascript
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
        case 'useCard':
            // 其他玩家的出牌
            game.displayCardEffect(message);
            
            // 如果我是目标
            if (message.targets.includes(game.me.id)) {
                // 显示响应对话框给我
                ui.show.respondDialog();
            }
            break;
            
        case 'playerResponse':
            // 远程玩家的响应
            if (game.responseHandlers.has(message.playerId)) {
                const resolve = game.responseHandlers.get(message.playerId);
                resolve(message.response);
            }
            break;
            
        case 'gameSync':
            // 同步游戏状态
            game.updateState(message.state);
            break;
    }
};
```

#### 4. 本地响应处理

```javascript
ui.show.respondDialog = async function() {
    // 等待玩家选择是否使用防卡
    const choice = await ui.create.dialog('是否使用闪？', {
        buttons: [
            { text: '使用闪', onClick: () => 'shan' },
            { text: '不使用', onClick: () => null }
        ]
    });
    
    if (choice) {
        // 发送响应给主机
        ws.send(JSON.stringify({
            type: 'playerResponse',
            playerId: game.me.id,
            response: choice
        }));
    }
};
```

---

## 总体流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                      完整的联机对战流程                           │
└─────────────────────────────────────────────────────────────────┘

1️⃣ 创建房间/加入房间
   Player A 创建 → 等待其他玩家加入
   Player B/C/D 加入 → 都连接到服务器
   
2️⃣ 游戏开始
   Player A（主机）执行 game.start()
   其他玩家接收 WebSocket 消息
   所有玩家同时初始化游戏状态

3️⃣ Player A 的回合
   a. 主机执行摸牌逻辑
   b. 广播"Player A 摸了 X 张牌"
   c. 所有玩家更新 UI
   
4️⃣ Player A 出牌
   a. Player A 在界面上选择卡牌
   b. 选择目标（比如 Player B）
   c. 主机计算出牌事件
   d. 广播"Player A 对 Player B 出了杀"
   e. Player B 收到消息，显示响应对话框
   f. Player C/D 收到消息，只是看着
   
5️⃣ Player B 响应
   a. Player B 点击"使用闪"
   b. 本地 UI 显示"已使用闪"
   c. 通过 WebSocket 发送响应给主机
   d. 主机接收响应，计算伤害被防止
   e. 主机广播"伤害被防止"
   f. 所有玩家更新 UI
   
6️⃣ 继续游戏
   a. Player B 的回合
   b. Player C 的回合
   c. Player D 的回合
   d. ...直到游戏结束

关键：
  - 主机是"源头"，计算所有逻辑
  - 客户端等待主机的指令
  - 通过 Promise + WebSocket 实现等待
  - 所有事件都广播给所有玩家，保证一致性
  - 网络延迟通过时间戳和确认机制处理
```

---

## 关键概念回顾

### 1. 主机 vs 客户端

| 职责 | 主机 | 客户端 |
|------|------|--------|
| 游戏逻辑 | 执行 | 只显示 |
| 状态计算 | 负责 | 被动同步 |
| 出牌验证 | 检查合法性 | 信任主机 |
| 技能判定 | 计算 | 显示结果 |

### 2. Promise 的应用

```javascript
// 三种等待模式

1. 等待本机玩家操作
   const choice = await ui.create.dialog(...);
   
2. 等待远程玩家响应
   const response = await waitForWebSocketMessage(...);
   
3. 等待两者之一（超时）
   const result = await Promise.race([
       waitForResponse(remotePlayer, 10000),
       new Promise(resolve => setTimeout(resolve, 10000))
   ]);
```

### 3. 事件同步

```
事件触发
   ↓
主机计算
   ↓
广播给所有客户端（包括自己）
   ↓
每个客户端独立处理
   ↓
更新本地 UI
   ↓
所有客户端最终状态一致
```

### 4. 网络考虑

- 延迟：100-300ms（局域网）
- 丢包：TCP 保证不丢
- 乱序：时间戳 + 序列号
- 断线：重连 + 状态同步

---

## 常见问题

### Q: 为什么主机要广播给自己？

A: 保证一致性。主机作为"真理源"，计算结果后广播给所有人（包括自己），确保自己看到的和其他人看到的完全一样。

### Q: 如果主机断线怎么办？

A: 游戏中断。需要设计断线重连或主机转移机制（复杂）。无名杀目前的方案是简单地中断游戏。

### Q: 多个玩家同时出牌怎么办？

A: 不会发生。游戏严格按照"轮次"进行，同一时刻只有一个玩家可以出牌。其他玩家被冻结，只能看着。

### Q: 技能的联动会不会导致卡死？

A: 可能。如果 A 的技能依赖 B 的响应，B 的技能依赖 C 的响应，C 的技能依赖 A 的响应，就会形成死循环。这需要游戏设计避免。

### Q: 响应超时 10 秒后怎么办？

A: 视为"不使用"，游戏继续。给玩家充分的反应时间。

---

**现在你应该理解联机的核心了！** 🎉

关键思想：
1. 主机执行逻辑，客户端展示结果
2. Promise + WebSocket 实现异步等待
3. 广播保证所有客户端状态一致
4. 网络延迟通过时间戳和确认处理

