
# 无名杀 - 常见开发任务实战指南

*按复杂度从易到难*

---

## 🟢 简单任务 (30分钟内完成)

### Task 1: 修改游戏配置

**目标：** 改变游戏的基本设置（如起始血量、卡牌数量等）

**文件位置：** `noname/library/index.js` 或配置文件

```javascript
// 修改示例：改变初始血量计算
// 原代码（在 lib 中）
lib.hp = (num) => num + 3;  // 初始血量 = 体力 + 3

// 修改为
lib.hp = (num) => num + 5;  // 初始血量 = 体力 + 5

// 修改后刷新浏览器，所有武将的初始血量都会增加 2 点
```

**验证方法：**
1. 开启单机游戏
2. 观察左上角的血量条
3. 应该比原来多 2 点

---

### Task 2: 改变游戏背景音乐

**目标：** 更换游戏背景音乐

**文件位置：** `audio/background/`

```bash
# 1. 准备新的音乐文件 (mp3 格式)
# 例如：my_music.mp3

# 2. 放入 audio/background/ 目录

# 3. 在 game/config.js 或 init 中配置
game.backgroundMusic = 'my_music.mp3';

# 4. 刷新浏览器测试
```

**或者在 theme 中修改：** `theme/music/` 中定义音乐映射

---

### Task 3: 修改 UI 主题颜色

**目标：** 改变游戏 UI 的配色

**文件位置：** `theme/style/` 或 `theme/simple/`

```css
/* theme/style/default.css */

/* 原始颜色 */
:root {
    --primary-color: #8B0000;      /* 暗红色 */
    --secondary-color: #D4AF37;    /* 金色 */
    --background-color: #1a1a1a;   /* 深灰 */
}

/* 改为新颜色 */
:root {
    --primary-color: #0066cc;      /* 蓝色 */
    --secondary-color: #00cc99;    /* 青绿色 */
    --background-color: #0a0a0a;   /* 更深的黑 */
}

/* 刷新后所有使用这些变量的元素都会改变颜色 */
```

**验证方法：** 刷新浏览器，观察 UI 颜色变化

---

## 🟡 中等任务 (1-2小时内完成)

### Task 4: 添加一个新的标准卡牌

**目标：** 在卡牌库中添加一张新卡牌

**文件位置：** `card/standard.js`

```javascript
// 打开 card/standard.js，找到 export 对象

export default {
    // 原有卡牌...
    'sha': { ... },
    'shan': { ... },
    
    // 添加新卡牌
    'newcard': {
        name: '新卡',           // 卡牌名字
        suit: 'heart',          // 花色：heart/diamond/club/spade
        number: 5,              // 点数：1-13
        type: 'basic',          // 类型：basic/trick/weapon 等
        subtype: '',            // 子类型（可选）
        useLimit: 1,            // 使用次数限制（可选）
        
        // 卡牌效果（如果是特殊卡牌）
        effect: {
            // 定义卡牌的游戏效果
            // 会在武将技能 content 中调用此效果
        }
    }
}

// 刷新后，在摸卡时有可能摸到此卡牌
```

**卡牌类型说明：**
- `basic`: 基础卡（杀、闪、桃、酒等）
- `trick`: 锦囊卡（南蛮入侵、万箭齐发等）
- `weapon`: 武器（赤兔马、青龙偃月刀等）
- `armor`: 防具（八卦阵等）

---

### Task 5: 修改一个武将的初始属性

**目标：** 改变武将的血量、性别或所属势力

**文件位置：** `character/standard.js` 或对应版本

```javascript
export default {
    // 找到要修改的武将
    
    // 修改前
    caocao: {
        name: '曹操',
        hp: 8,
        sex: 'male',
        group: 'wei',
        skills: ['zhaohu', 'jianxiong']
    },
    
    // 修改后（例如增加血量到 10）
    caocao: {
        name: '曹操',
        hp: 10,              // ← 从 8 改为 10
        sex: 'male',
        group: 'wei',
        skills: ['zhaohu', 'jianxiong']
    }
}

// 或者在浏览器 Console 中动态修改（仅当前游戏有效）
const { lib } = noname;
lib.character.standard.caocao.hp = 10;
```

**常见属性：**
- `hp`: 初始血量
- `sex`: 性别 ('male'/'female')
- `group`: 势力 ('wei'/'shu'/'wu'/'qun'/'ye')
- `skills`: 技能数组
- `picture`: 默认立绘编号
- `description`: 武将描述

---

### Task 6: 调整一个技能的发动条件

**目标：** 改变技能何时发动或何时不发动

**文件位置：** `character/perfectPairs.js` 或武将定义中

```javascript
// 技能定义位置通常是 lib.skill.XXX

// 原始技能
lib.skill.example = {
    name: '示例技能',
    
    // 原始 trigger - 只在对手出杀时触发
    trigger: { global: ['useCard'] },
    
    // 改为新的 trigger - 改为在伤害时触发
    trigger: { global: ['damageStart'] },
    
    filter(event, source) {
        // 原始条件：只有自己才能发动
        return source === this;
        
        // 改为：只有存活的人才能发动（包括其他玩家）
        return !source.dead;
    },
    
    async content(event, trigger, source) {
        // 技能效果保持不变
        console.log('技能发动了！');
    }
};
```

**常见 trigger 事件：**
- `useCard`: 出卡
- `damageStart`: 伤害开始
- `damageEnd`: 伤害结束
- `phaseStart`: 回合开始
- `phaseEnd`: 回合结束
- `gameStart`: 游戏开始
- `death`: 死亡

---

### Task 7: 创建一个简单的游戏模式扩展

**目标：** 创建一个新的游戏模式（类似斗地主模式）

**文件位置：** `extension/myMode/index.js`

```javascript
// 导出扩展信息
export const name = '我的模式';
export const description = '这是一个自定义游戏模式';
export const author = '作者';
export const version = '1.0.0';

export async function onLoad() {
    const { lib, game } = noname;
    
    // 注册新的游戏模式
    lib.mode['mymode'] = {
        name: '我的模式',
        
        // 初始化游戏
        async start(config) {
            console.log('模式开始');
            // 初始化游戏状态
        },
        
        // 获取玩家顺序
        async getOrder() {
            return [0, 1, 2, 3];  // 按顺序返回玩家索引
        },
        
        // 定义胜利条件
        async isGameOver() {
            return game.dead.length === game.players.length - 1;
        },
        
        // 定义获胜者
        async getWinner() {
            return game.players.filter(p => !p.dead);
        }
    };
}

export async function onUnload() {
    console.log('扩展卸载');
}
```

---

## 🟠 困难任务 (2-4小时内完成)

### Task 8: 创建一个完整的自定义技能

**目标：** 创建一个复杂的技能，需要与其他技能互动

**文件位置：** `extension/customSkill/index.js`

```javascript
export const name = '自定义技能扩展';
export const version = '1.0.0';

export async function onLoad() {
    const { lib, game, ui, get } = noname;
    
    // 注册新技能
    lib.skill['lianhuagui'] = {
        name: '莲花诡',
        description: '每当你对其他玩家造成伤害时，你可以获得一张随机卡牌',
        
        // 何时触发
        trigger: { global: ['damageEnd'] },
        
        // 是否满足条件
        filter(event, source) {
            // 伤害造成者是自己，且伤害值大于 0
            return event.source === source && event.damage > 0;
        },
        
        // 执行效果（异步）
        async content(event, trigger, source) {
            // 1. 获取全部卡牌
            const allCards = get.itemList('card');
            
            // 2. 随机选择一张
            const randomCard = allCards[
                Math.floor(Math.random() * allCards.length)
            ];
            
            // 3. 放入手牌
            source.cards.push(randomCard);
            
            // 4. 更新 UI
            ui.updateLayout();
            
            // 5. 显示效果
            await ui.create.dialog('莲花诡触发', 
                `你获得了: ${randomCard.name}`
            );
        },
        
        // 配置
        frequent: false,           // 不是频繁技能
        locked: false,             // 可以关闭
        group: ['lianhua'],        // 技能组（用于禁用多个关联技能）
    };
    
    // 为一个现有武将添加此技能
    lib.character.standard.lvlingqi = {
        name: '吕玲绮',
        hp: 5,
        sex: 'female',
        group: 'qun',
        skills: ['lianhuagui', 'lingji']
    };
}
```

**关键点：**
- `trigger`: 何时发动（监听事件）
- `filter`: 条件检查（返回 true 才能发动）
- `content`: 异步执行效果
- `await ui.create.dialog()`: 等待 UI 响应

---

### Task 9: 实现一个与其他技能互动的机制

**目标：** 创建一个技能，能影响其他玩家的技能

**文件位置：** `extension/skillInteraction/index.js`

```javascript
export const name = '技能互动系统';
export const version = '1.0.0';

export async function onLoad() {
    const { lib } = noname;
    
    // 技能 1：将伤害转移给其他玩家
    lib.skill['yizhuanshang'] = {
        name: '移转伤',
        description: '当你受到伤害时，你可以选择一个其他玩家承受这些伤害',
        
        trigger: { global: ['damageStart'] },
        
        filter(event, source) {
            return event.target === source;  // 伤害目标是自己
        },
        
        async content(event, trigger, source) {
            // 提示玩家选择目标
            const targets = get.alive([source]);  // 除了自己的其他活着的玩家
            
            // 等待玩家选择
            const selected = await ui.create.dialog('选择一个玩家承受伤害', {
                buttons: targets.map(p => ({
                    text: p.name,
                    onClick: () => p
                }))
            });
            
            if (selected) {
                // 改变伤害目标
                event.target = selected;
                
                // 显示效果
                await ui.create.dialog('伤害已转移！', 
                    `${source.name} 将伤害转移给了 ${selected.name}`
                );
            }
        }
    };
    
    // 技能 2：反弹已转移的伤害
    lib.skill['fantan'] = {
        name: '反弹',
        description: '当受到被转移的伤害时，反伤给转移者',
        
        trigger: { global: ['damageStart'] },
        
        filter(event, source) {
            // 如果伤害被转移过，则触发
            return event.target === source && event.transferred;
        },
        
        async content(event, trigger, source) {
            // 反弹伤害
            const source_of_transfer = event.transfer_source;
            source_of_transfer.damage(1);
            
            await ui.create.dialog('反弹！',
                `${source.name} 反弹了伤害给 ${source_of_transfer.name}`
            );
        }
    };
}
```

**技能互动要点：**
- 修改事件对象（`event.target`, `event.damage` 等）
- 使用 `await ui.create.dialog()` 等待用户交互
- 使用 `get.alive()` 等查询接口
- 在技能中标记自定义属性（`event.transferred`）

---

### Task 10: 实现一个完整的扩展武将包

**目标：** 创建一个完整的扩展，包含多个新武将和新技能

**文件位置：** `extension/myCharacters/index.js`

```javascript
export const name = '我的武将包';
export const description = '添加 5 个新武将及其技能';
export const author = 'MyName';
export const version = '1.0.0';

export async function onLoad() {
    const { lib } = noname;
    
    // 注册技能
    lib.skill['xinzhu'] = {
        name: '心诛',
        description: '当你对其他玩家造成伤害时，该玩家的下回合摸牌数 -1',
        trigger: { global: ['damageEnd'] },
        filter(event, source) {
            return event.source === source && event.damage > 0;
        },
        async content(event, trigger, source) {
            event.target.mark['xinzhu'] = 
                (event.target.mark['xinzhu'] || 0) + event.damage;
        }
    };
    
    lib.skill['xingu'] = {
        name: '心固',
        description: '当你需要摸牌时，摸牌数减少该数值',
        trigger: { global: ['drawCard'] },
        filter(event, source) {
            return event.target === source;
        },
        async content(event, trigger, source) {
            const deduct = source.mark['xinzhu'] || 0;
            event.drawNum = Math.max(0, event.drawNum - deduct);
            delete source.mark['xinzhu'];
        }
    };
    
    // 注册新武将包
    lib.character['mypack'] = {
        // 武将 1
        hero1: {
            name: '新英雄1',
            hp: 5,
            sex: 'male',
            group: 'wei',
            skills: ['xinzhu']
        },
        
        // 武将 2
        hero2: {
            name: '新英雄2',
            hp: 6,
            sex: 'female',
            group: 'shu',
            skills: ['xingu']
        },
        
        // 武将 3 - 更复杂的技能
        hero3: {
            name: '新英雄3',
            hp: 5,
            sex: 'male',
            group: 'wu',
            skills: ['tech1', 'tech2']
        }
    };
    
    // 添加更多技能...
}

export async function onUnload() {
    // 清理资源
    console.log('武将包已卸载');
}
```

---

## 🔴 高难度任务 (4+ 小时)

### Task 11: 修改游戏核心引擎

**目标：** 修改游戏的基础逻辑（如改变摸卡规则）

**文件位置：** `noname/game/index.js` 或钩子系统

```javascript
// 方式 1：使用事件钩子（推荐，不需要改动源代码）
export async function onLoad() {
    const { lib, game } = noname;
    
    // 拦截摸卡事件，改变摸卡规则
    lib.hook.on('drawCard', (event) => {
        // 原规则：摸卡数 = 配置的数值
        // 新规则：摸卡数 = 玩家 HP * 2
        
        event.drawNum = event.target.hp * 2;
        
        console.log(`${event.target.name} 将摸 ${event.drawNum} 张卡`);
    });
}

// 方式 2：直接修改源代码（不推荐）
// 打开 noname/game/index.js
// 找到 draw() 方法
// 修改 card drawing 的逻辑
```

**钩子系统要点：**
- 使用 `lib.hook.on()` 监听事件
- 修改事件对象来改变游戏流程
- 不需要修改源代码，易于维护

---

### Task 12: 实现一个复杂的游戏模式

**目标：** 创建一个有完整规则的新游戏模式

**文件位置：** `extension/newMode/index.js`

```javascript
export const name = '大乱斗模式';
export const version = '1.0.0';

export async function onLoad() {
    const { lib, game, ui } = noname;
    
    lib.mode['chaos'] = {
        name: '大乱斗',
        description: '所有玩家互相敌对，独自存活者获胜',
        
        async start(config) {
            // 初始化
            game.players.forEach(p => {
                p.hp = 5;  // 统一 HP
                p.cards = [];
            });
        },
        
        async getOrder() {
            // 随机顺序
            return game.players.map((_, i) => i)
                .sort(() => Math.random() - 0.5);
        },
        
        async autoEnd() {
            // 到达时间限制
            return false;
        },
        
        async isGameOver() {
            // 只有 1 个存活玩家
            return game.dead.length === game.players.length - 1;
        },
        
        async getWinner() {
            return game.players.filter(p => !p.dead);
        }
    };
}
```

---

## 📊 开发流程检查清单

### 添加新武将
- [ ] 在 `character/` 中定义武将基础属性
- [ ] 在 `lib.skill` 中实现技能
- [ ] 准备武将立绘（可选）
- [ ] 在游戏中选择新武将测试
- [ ] 检查 DevTools 中是否有错误

### 添加新技能
- [ ] 确定 `trigger` 事件类型
- [ ] 编写 `filter()` 条件检查
- [ ] 编写 `content()` 效果实现
- [ ] 在武将中注册技能
- [ ] 游戏中测试技能是否正确发动
- [ ] 检查技能与其他技能的交互

### 创建新扩展
- [ ] 创建 `extension/myExt/` 目录
- [ ] 编写 `index.js` 主文件
- [ ] 导出 `name`, `version`, `onLoad`, `onUnload`
- [ ] 在 `onLoad` 中注册内容
- [ ] 重启游戏测试扩展加载
- [ ] 检查扩展卸载是否正确清理资源

### 修改 UI
- [ ] 定位要修改的 DOM 元素
- [ ] 在 `ui/create` 或 `ui/click` 中找到对应代码
- [ ] 修改样式或行为
- [ ] 刷新浏览器测试
- [ ] 检查多种分辨率的显示效果

---

## 🐛 调试技巧

### 1. 使用 Console 调试

```javascript
// 在浏览器 Console 中（F12）

// 查看游戏状态
console.log(game.players);

// 查看玩家卡牌
console.log(game.players[0].cards);

// 查看全局状态
console.log(_status);

// 手动触发事件
game.emit('damageStart', {
    source: game.players[0],
    target: game.players[1],
    damage: 1
});

// 调用方法
game.players[0].damage(2);
ui.updateLayout();
```

### 2. 使用 DevTools Sources 调试

```javascript
// 在源代码中添加断点
// 1. 打开 DevTools (F12)
// 2. 切换到 Sources 标签
// 3. 找到你的文件（Ctrl+P 搜索）
// 4. 点击行号添加断点
// 5. 刷新或触发操作，代码会在断点处暂停
```

### 3. 添加 console.log 调试

```javascript
// 在代码中添加日志
lib.skill.example = {
    filter(event, source) {
        console.log('filter 被调用', { event, source });
        return source === this;
    },
    
    async content(event, trigger, source) {
        console.log('content 被执行', { event });
        // ... 效果代码
    }
};
```

### 4. 使用 DevTools Network 监控

```
监控 HTTP 请求 / WebSocket 消息：
1. F12 打开 DevTools
2. Network 标签
3. 观察请求和响应
4. 对于 WebSocket，切换到 Messages 标签查看实时消息
```

---

## 🚀 性能优化建议

### 1. 避免在技能中进行重操作

```javascript
// ❌ 不好：在 content 中遍历所有卡牌
async content(event, trigger, source) {
    for (const card of getAllCards()) {  // 重操作
        // ...
    }
}

// ✅ 好：使用查询接口
async content(event, trigger, source) {
    const cards = get.itemList('card', { suit: 'heart' });
    // ...
}
```

### 2. 缓存计算结果

```javascript
// ❌ 不好：每次都重新计算
filter(event, source) {
    return calculateComplexCondition(event, source);
}

// ✅ 好：缓存结果
const cached = {};
filter(event, source) {
    const key = `${event.id}_${source.id}`;
    if (key in cached) return cached[key];
    
    cached[key] = calculateComplexCondition(event, source);
    return cached[key];
}
```

### 3. 避免阻塞 UI

```javascript
// ❌ 不好：同步循环阻塞 UI
async content(event, trigger, source) {
    for (let i = 0; i < 1000; i++) {
        doSomething();  // UI 卡顿
    }
}

// ✅ 好：分割任务
async content(event, trigger, source) {
    for (let i = 0; i < 1000; i++) {
        if (i % 100 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));  // 让出 UI 线程
        }
        doSomething();
    }
}
```

---

## 📖 推荐学习路径

### 第 1 周：基础理解
1. Task 1-3：简单配置修改
2. 深入理解游戏架构
3. 学习事件系统

### 第 2 周：动手实践
1. Task 4-5：修改武将和卡牌
2. Task 6：调整技能条件
3. 跟踪代码执行

### 第 3 周：创建内容
1. Task 7-8：创建扩展和技能
2. 测试技能与其他技能的交互
3. 优化代码

### 第 4 周+：高级开发
1. Task 9-12：复杂互动和模式
2. 性能优化
3. 社区贡献

---

**祝你开发愉快！** 🎉

如有问题，参考官方文档或 GitHub Issues。

