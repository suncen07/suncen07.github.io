# data.json 结构说明

## 文件位置
将 `data.json` 与 `index.html` 放在 **同一目录** 下。
必须通过 HTTP 服务器访问（例如 `python -m http.server 8080` 或 VS Code Live Server），
直接双击打开 HTML 文件会因浏览器安全限制导致 fetch 失败。

---

## 顶层结构

```json
{
  "plan_id_1": { ... },
  "plan_id_2": { ... }
}
```

每个键是计划 ID（如 `height_friendly`），值是一个完整的训练计划对象。
网站会自动列出所有计划供用户切换。

---

## 单个计划对象

```json
{
  "config": { ... },       // 外观配置
  "meta": { ... },         // 首页内容 / 文字数据
  "exerciseCatMap": { ... }, // 动作分类映射（可选）
  "data": {
    "schedule": [ ... ]    // 周一到周日的训练数据
  }
}
```

---

## config（外观配置）

```json
"config": {
  "navTitle": "青少年训练计划",
  "navSubtitle": "HEIGHT-FRIENDLY TRAINING",
  "heroEyebrow": "青少年 · 长高友好 · 拳腿基础",
  "heroTitle": "<em>长高友好</em> + 体型优化<br>+ 拳腿基础训练",
  "heroSub": "恢复优先、姿态优先...",
  "cssVars": {
    "--accent":  "#c8f060",
    "--accent2": "#60d0f0",
    "--accent3": "#f06090",
    "--accent4": "#f0b060",
    "--accent5": "#a060f0"
  }
}
```

`cssVars` 中的所有颜色会被注入为 CSS 变量，切换计划时主题色随之切换。

---

## meta（首页文字内容）

所有字段均为可选，未提供则对应区块自动隐藏。

```json
"meta": {
  "safetyIntro": "如果你...",
  "notices": ["疼痛越来越重", "手臂麻木"],
  "prerequisites": {
    "title": "本方案默认前提",
    "items": ["没有急性损伤", "日常走路无明显异常"]
  },
  "teenAvoid": "<strong>需要刻意避免：</strong><br>高负重...",
  "goalsTitle": "这套计划到底在练什么？",
  "goalsSub": "GOAL & DESIGN LOGIC",
  "goalsIntro": "你想要的目标...",
  "goalCards": [
    { "icon": "📈", "title": "更适合青春期发育", "body": "..." }
  ],
  "principlesTitle": "五大核心原则",
  "principlesSub": "CORE PRINCIPLES",
  "principles": [
    { "title": "原则1：...", "body": "..." }
  ],
  "sessionStructure": {
    "title": "每次训练的统一结构",
    "sub": "SESSION STRUCTURE",
    "steps": [
      { "name": "① 热身（Warm-up）", "duration": "8–10 min" }
    ],
    "callout": "热身不要省"
  },
  "techniqueCuesTitle": "最该记住的技术提醒",
  "techniqueCuesSub": "KEY TECHNIQUE CUES",
  "techniqueCues": [
    {
      "title": "🥊 出拳（Punching）",
      "cues": ["下巴微收", "打出去立刻回收"]
    }
  ],
  "oneSentenceSummary": "最适合你当前阶段的版本是...<strong>...</strong>",
  "timeOptions": {
    "title": "时间不够时怎么压缩",
    "sub": "30 / 45 / 60 分钟版本",
    "options": [
      {
        "label": "30<span style='font-size:12px'>min</span>",
        "items": [
          { "name": "热身", "value": "8 分钟" },
          { "name": "主训练", "value": "15 分钟" }
        ]
      }
    ]
  },
  "miniRoutines": [
    {
      "title": "每日 10 分钟小套餐",
      "titleStyle": "",
      "wrapStyle": "",
      "intro": "如果某天没空...",
      "items": [
        { "name": "下巴回收", "sets": "2×8" }
      ],
      "footer": "注意：...",
      "links": [
        { "label": "▶ 视频", "url": "https://..." }
      ]
    }
  ],
  "habitsTitle": "日常习惯同样重要",
  "dailyHabits": ["每坐 40–50 分钟起来活动"],
  "progressionTitle": "4 周进阶方法",
  "progressionSub": "4-WEEK PROGRESSION",
  "progressionWeeks": [
    { "week": "第 1 周", "title": "适应周", "body": "...", "style": "" }
  ],
  "executionAdvice": {
    "title": "简单执行建议",
    "sub": "HOW TO EXECUTE WELL",
    "items": [
      { "title": "动作速度建议", "body": "下放慢一点..." }
    ]
  },
  "finalAdvice": ["先把动作做标准，再去加量。"],
  "warmupTemplate": {
    "phases": [
      {
        "title": "阶段一：轻度升温（2分钟）",
        "note": "不需要做很大幅度",
        "items": [
          { "name": "原地快走", "sets": "march · 1分钟" }
        ]
      }
    ]
  },
  "warmupExercises": [ ... ],
  "weeklyPriority": {
    "title": "一周最重要的训练优先级",
    "sub": "WEEKLY PRIORITY ORDER",
    "items": [
      { "name": "① 周一（腿 + 跳 + 核心）", "level": "优先", "highlight": true }
    ],
    "callout": "如果实在忙..."
  },
  "recoveryCards": [
    {
      "icon": "😴",
      "title": "睡眠（Sleep）",
      "intro": "你的恢复...",
      "items": ["固定上床和起床时间"]
    }
  ]
}
```

---

## exerciseCatMap（动作分类，可选）

用于动作库的分类过滤。未提供的动作会使用内置默认分类。

```json
"exerciseCatMap": {
  "深蹲": "下肢",
  "墙天使": "姿态/颈肩",
  "自定义动作名": "自定义分类"
}
```

---

## data.schedule（训练日数组）

每天的训练数据：

```json
"schedule": [
  {
    "day": "周一",
    "dayEn": "Monday",
    "cls": "mon",
    "theme": "弹跳 + 下肢力量 + 核心",
    "themeEn": "Jump + Lower Body + Core",
    "duration": "40–50 分钟",
    "tags": [
      { "l": "弹跳", "c": "t-green" },
      { "l": "下肢", "c": "t-blue" }
    ],
    "focus": "刺激骨骼、腿部力量",
    "goals": ["刺激骨骼", "练腿部力量"],
    "warmupNote": "使用统一热身",
    "sections": [
      {
        "title": "低量弹跳",
        "en": "Low-volume Plyometrics",
        "exercises": [
          {
            "zh": "原地小弹跳",
            "en": "Pogo Jump",
            "sets": "3×12",
            "purpose": "低量骨骼刺激、踝部弹性",
            "cues": ["落地轻", "脚踝轻弹"],
            "mistakes": ["砸地", "膝盖内扣"],
            "videos": [
              { "label": "教程视频", "url": "https://www.youtube.com/watch?v=..." }
            ],
            "timer": 30
          }
        ]
      }
    ],
    "stretchGoal": "放松腿前侧...",
    "stretches": [ ... ],
    "notes": ["落地一定轻"],
    "summary": "今天不要追求很累。"
  }
]
```

### cls 颜色对应
| cls | 顶部色条颜色 |
|-----|-------------|
| mon | 绿色 (#c8f060) |
| tue | 蓝色 (#60d0f0) |
| wed | 粉色 (#f06090) |
| thu | 橙色 (#f0b060) |
| fri | 紫色 (#a060f0) |
| sat | 青绿 (#60f0b0) |
| sun | 黄色 (#f0f060) |

### tag 颜色
| c | 颜色 |
|---|------|
| t-green | accent 绿 |
| t-blue | accent2 蓝 |
| t-pink | accent3 粉 |
| t-orange | accent4 橙 |
| t-purple | accent5 紫 |

### warmupNote 特殊值
- 以 `无需热身` 开头 → 不显示热身模块

---

## data.generalWarmup（热身模板）

从 data 部分拉取固定热身，所有训练日都通用。

```json
"generalWarmup": {
  "title": "固定热身（Warm-up）",
  "duration": "8–10 分钟",
  "exercises": [
    {
      "zh": "原地慢走",
      "en": "March in Place",
      "sets": "2 分钟",
      "purpose": "慢慢提升体温与心率",
      "cues": ["步伐自然", "呼吸放松", "不要着急"],
      "timer": 120
    },
    {
      "zh": "肩部绕环",
      "en": "Shoulder Rolls",
      "sets": "30–45 秒",
      "purpose": "放松肩部和上背",
      "cues": ["动作轻柔", "前后都做"],
      "timer": 45
    }
  ]
}
```

**Notes:**
- 所有 `timer` 值单位为**秒**
- 此部分为可选（Optional），不提供则 HTML 会使用内置默认热身

---

# 快速启动本地服务器

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# 然后访问
# http://localhost:8080
```

---

# 完整 JSON 模板示例

以下是一个最小化但完整的训练计划 JSON 模板，包含所有 HTML 使用的必要字段。

```json
{
  "my_plan": {
    "config": {
      "navTitle": "我的训练计划",
      "navSubtitle": "MY TRAINING PLAN",
      "heroEyebrow": "自定义 · 适合我的 · 循序渐进",
      "heroTitle": "<em>自定义</em> 训练<br>循序渐进",
      "heroSub": "根据你的需求定制的训练方案。",
      "cssVars": {
        "--accent": "#c8f060",
        "--accent2": "#60d0f0",
        "--accent3": "#f06090",
        "--accent4": "#f0b060",
        "--accent5": "#a060f0"
      }
    },
    "meta": {
      "safetyIntro": "如果你有以下情况，请先咨询医生：",
      "notices": [
        "持续疼痛",
        "新伤",
        "关节不适"
      ],
      "principles": [
        {
          "title": "原则1：循序渐进",
          "body": "从低强度开始，逐步增加训练量和难度。"
        }
      ],
      "goalCards": [
        {
          "icon": "💪",
          "title": "力量提升",
          "body": "通过规律训练增强肌肉力量。"
        }
      ],
      "dailyHabits": [
        "保证充足睡眠（8-10 小时）",
        "规律三餐，补充蛋白质"
      ],
      "progressionWeeks": [
        {
          "week": "第 1 周",
          "title": "适应期",
          "body": "按计划下限做，找动作感觉。",
          "style": ""
        }
      ],
      "weeklyPriority": {
        "title": "一周训练优先级",
        "sub": "WEEKLY PRIORITY",
        "items": [
          {
            "name": "① 周一（力量）",
            "level": "优先",
            "highlight": true
          }
        ],
        "callout": "如果时间有限，至少保证周一的训练。"
      },
      "recoveryCards": [
        {
          "icon": "😴",
          "title": "睡眠",
          "intro": "恢复的基础。",
          "items": ["每天 8-10 小时规律睡眠"]
        }
      ]
    },
    "data": {
      "generalWarmup": {
        "title": "固定热身",
        "duration": "8–10 分钟",
        "exercises": [
          {
            "zh": "原地快走",
            "en": "March in Place",
            "sets": "2 分钟",
            "purpose": "升温",
            "cues": ["步伐自然"],
            "timer": 120
          },
          {
            "zh": "肩部绕环",
            "en": "Shoulder Rolls",
            "sets": "45 秒",
            "purpose": "关节活动",
            "cues": ["轻柔", "前后各做"],
            "timer": 45
          }
        ]
      },
      "schedule": [
        {
          "day": "周一",
          "dayEn": "Monday",
          "cls": "mon",
          "theme": "力量训练",
          "themeEn": "Strength",
          "duration": "45 分钟",
          "tags": [
            { "l": "力量", "c": "t-green" },
            { "l": "下肢", "c": "t-blue" }
          ],
          "focus": "增强腿部和核心力量",
          "goals": [
            "下肢力量",
            "核心稳定性"
          ],
          "warmupNote": "使用统一热身",
          "sections": [
            {
              "title": "力量组",
              "en": "Strength",
              "exercises": [
                {
                  "zh": "深蹲",
                  "en": "Bodyweight Squat",
                  "sets": "4×12",
                  "purpose": "下肢力量基础",
                  "cues": [
                    "膝盖朝脚尖方向",
                    "髋向后坐"
                  ],
                  "mistakes": [
                    "膝内扣",
                    "含胸"
                  ],
                  "videos": [
                    {
                      "label": "深蹲教程",
                      "url": "https://www.youtube.com/watch?v=xXXXXXXXXXX"
                    }
                  ],
                  "timer": 45
                }
              ]
            }
          ],
          "stretchGoal": "放松下肢",
          "stretches": [
            {
              "zh": "大腿前侧拉伸",
              "en": "Quad Stretch",
              "sets": "20 秒",
              "purpose": "放松大腿前侧"
            }
          ],
          "notes": [
            "控制速度，不要太快",
            "如感到不适立即停止"
          ],
          "summary": "今天重点是力量基础，不追求数量只求质量。"
        },
        {
          "day": "周二",
          "dayEn": "Tuesday",
          "cls": "tue",
          "theme": "恢复日",
          "themeEn": "Recovery",
          "duration": "30 分钟",
          "tags": [
            { "l": "恢复", "c": "t-green" }
          ],
          "focus": "放松和伸展",
          "goals": [
            "全身放松"
          ],
          "warmupNote": "无需热身，直接进入",
          "sections": [
            {
              "title": "拉伸放松",
              "en": "Stretching",
              "exercises": [
                {
                  "zh": "全身拉伸",
                  "en": "Full Body Stretch",
                  "sets": "20 秒",
                  "purpose": "放松肌肉",
                  "cues": ["温和拉伸"],
                  "timer": 20
                }
              ]
            }
          ],
          "stretchGoal": "全身放松",
          "stretches": [],
          "notes": [
            "今天重点是恢复"
          ],
          "summary": "为下一周的训练做准备。"
        }
      ]
    },
    "exerciseCatMap": {
      "深蹲": "下肢",
      "大腿前侧拉伸": "拉伸"
    }
  }
}
```

---

## 模板说明

### 必需字段
- `config.navTitle` - 计划名称（必需，显示在侧边栏）
- `config.cssVars` - 颜色主题（必需，5 种颜色）
- `data.schedule` - 训练日计划（必需，至少 1 天）

### 可选字段
- `meta.*` - 所有首页内容可选，不提供则自动隐藏对应区块
- `data.generalWarmup` - 统一热身（可选，不提供使用内置默认）
- `exerciseCatMap` - 动作分类映射（可选，不提供使用内置分类）

### 常用约定
- **timer 值单位为秒** （60 = 1 分钟）
- **cls 值必须是** `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun` 等周日名
- **tag.c 颜色值** 参考 tag 颜色表（`t-green`, `t-blue`, `t-pink`, `t-orange`, `t-purple`）
- **sets 字段** 格式灵活：`3×12`, `2×每腿10`, `30 秒` 都可以
```