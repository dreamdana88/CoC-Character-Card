export const OCCUPATIONS = Object.freeze([
  {
    "id": "1",
    "name": "自定义职业",
    "pointFormula": "CUSTOM",
    "creditMin": null,
    "creditMax": null,
    "occupationalSkills": [],
    "skillText": "不多于8个本职技能。在右侧职业属性中输入第二职业属性的数值（留空则视为EDU）并自行设置起始信誉。使用自定义职业前，请先咨询你的守秘人。"
  },
  {
    "id": "2",
    "name": "会计师",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "会计",
      "法律",
      "图书馆使用",
      "聆听",
      "说服",
      "侦查"
    ],
    "skillText": "会计，法律，图书馆，聆听，说服，侦查，任意其他两项个人或时代特长。"
  },
  {
    "id": "3",
    "name": "杂技演员",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "攀爬",
      "闪避",
      "跳跃",
      "投掷",
      "侦查",
      "游泳"
    ],
    "skillText": "攀爬，闪避，跳跃，投掷，侦查，游泳，任意两项其他个人或时代特长。"
  },
  {
    "id": "4",
    "name": "演员-戏剧演员",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 40,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "格斗",
      "历史",
      "心理学"
    ],
    "skillText": "技艺（表演），乔装，格斗，历史，两项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "5",
    "name": "演员-电影演员",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 20,
    "creditMax": 90,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "汽车驾驶",
      "心理学"
    ],
    "skillText": "技艺（表演），乔装，汽车驾驶，两项社交技能（取悦、话术、恐吓、说服），心理学，任意两项其他个人或时代特长（如骑乘或格斗）。"
  },
  {
    "id": "6",
    "name": "事务所侦探、保安",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 20,
    "creditMax": 45,
    "occupationalSkills": [
      "格斗",
      "射击",
      "法律",
      "图书馆使用",
      "心理学",
      "潜行",
      "追踪"
    ],
    "skillText": "一项社交技能（取悦、话术、恐吓、说服），格斗（斗殴），射击，法律，图书馆，心理学，潜行，追踪。"
  },
  {
    "id": "7",
    "name": "精神病医生（古典）",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 60,
    "occupationalSkills": [
      "法律",
      "聆听",
      "医学",
      "外语",
      "精神分析",
      "心理学",
      "科学"
    ],
    "skillText": "法律，聆听，医学，外语，精神分析，心理学，科学（生物学，化学）。"
  },
  {
    "id": "8",
    "name": "动物训练师",
    "pointFormula": "EDU_X2_PLUS_MAX_APP_X2_POW_X2",
    "creditMin": 10,
    "creditMax": 40,
    "occupationalSkills": [
      "跳跃",
      "聆听",
      "博物学",
      "心理学",
      "科学",
      "潜行",
      "追踪"
    ],
    "skillText": "跳跃，聆听，自然，心理学，科学（动物学），潜行，追踪，任意一项其他个人或时代特长。"
  },
  {
    "id": "9",
    "name": "文物学家（原作向）",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "估价",
      "技艺",
      "历史",
      "图书馆使用",
      "外语",
      "侦查"
    ],
    "skillText": "估价，技艺（任一），历史，图书馆，外语，一项社交技能（取悦、话术、恐吓、说服），侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "10",
    "name": "古董商",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 50,
    "occupationalSkills": [
      "会计",
      "估价",
      "汽车驾驶",
      "历史",
      "图书馆使用",
      "导航"
    ],
    "skillText": "会计，估价，汽车驾驶，两项社交技能（取悦、话术、恐吓、说服），历史，图书馆，导航。"
  },
  {
    "id": "11",
    "name": "考古学家（原作向）",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 40,
    "occupationalSkills": [
      "估价",
      "考古学",
      "历史",
      "外语",
      "图书馆使用",
      "侦查",
      "机械维修"
    ],
    "skillText": "估价，考古，历史，外语，图书馆，侦查，机械维修，导航或科学（任一：如化学、物理、地理等）。"
  },
  {
    "id": "12",
    "name": "建筑师",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "会计",
      "技艺",
      "法律",
      "母语",
      "说服",
      "心理学",
      "科学"
    ],
    "skillText": "会计，技艺（技术制图），法律，母语，计算机或图书馆，说服，心理学，科学（数学）。"
  },
  {
    "id": "13",
    "name": "艺术家",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_POW_X2",
    "creditMin": 9,
    "creditMax": 50,
    "occupationalSkills": [
      "技艺",
      "外语",
      "心理学",
      "侦查"
    ],
    "skillText": "技艺（任一），历史或自然，一项社交技能（取悦、话术、恐吓、说服），外语，心理学，侦查，任意两项其他个人或时代特长。"
  },
  {
    "id": "14",
    "name": "精神病院看护",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 8,
    "creditMax": 20,
    "occupationalSkills": [
      "闪避",
      "格斗",
      "急救",
      "聆听",
      "心理学",
      "潜行"
    ],
    "skillText": "闪避，格斗（斗殴），急救，两项社交技能（取悦、话术、恐吓、说服），聆听，心理学，潜行。"
  },
  {
    "id": "15",
    "name": "运动员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 70,
    "occupationalSkills": [
      "攀爬",
      "跳跃",
      "格斗",
      "骑术",
      "游泳",
      "投掷"
    ],
    "skillText": "攀爬，跳跃，格斗（斗殴），骑乘，一项社交技能（取悦、话术、恐吓、说服），游泳，投掷，任意一项其他个人或时代特长。"
  },
  {
    "id": "16",
    "name": "作家（原作向）",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "历史",
      "图书馆使用",
      "外语",
      "母语",
      "心理学"
    ],
    "skillText": "技艺（文学），历史，图书馆，自然或神秘学，外语，母语，心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "17",
    "name": "酒保",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 8,
    "creditMax": 25,
    "occupationalSkills": [
      "会计",
      "格斗",
      "聆听",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），格斗（斗殴），聆听，心理学，侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "18",
    "name": "猎人",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 20,
    "creditMax": 50,
    "occupationalSkills": [
      "射击",
      "博物学",
      "导航",
      "科学",
      "潜行",
      "追踪"
    ],
    "skillText": "射击，聆听或侦查，自然，导航，外语或生存（任一），科学（生物学或植物学），潜行，追踪。"
  },
  {
    "id": "19",
    "name": "书商",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 40,
    "occupationalSkills": [
      "会计",
      "估价",
      "汽车驾驶",
      "历史",
      "图书馆使用",
      "母语",
      "外语"
    ],
    "skillText": "会计，估价，汽车驾驶，历史，图书馆，母语，外语，一项社交技能（取悦、话术、恐吓、说服）。"
  },
  {
    "id": "20",
    "name": "赏金猎人",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "汽车驾驶",
      "法律",
      "心理学",
      "追踪",
      "潜行"
    ],
    "skillText": "汽车驾驶，电子学或电气维修，格斗或射击，一项社交技能（取悦、话术、恐吓、说服），法律，心理学，追踪，潜行。"
  },
  {
    "id": "21",
    "name": "拳击手、摔跤手",
    "pointFormula": "EDU_X2_PLUS_STR_X2",
    "creditMin": 9,
    "creditMax": 60,
    "occupationalSkills": [
      "闪避",
      "格斗",
      "恐吓",
      "跳跃",
      "心理学",
      "侦查"
    ],
    "skillText": "闪避，格斗（斗殴），恐吓，跳跃，心理学，侦查，任意两项其他个人或时代特长。"
  },
  {
    "id": "22",
    "name": "管家、男仆、女仆",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 40,
    "occupationalSkills": [
      "技艺",
      "急救",
      "聆听",
      "外语",
      "心理学",
      "侦查"
    ],
    "skillText": "会计或估价，技艺（任一：如烹饪、裁缝、理发），急救，聆听，外语，心理学，侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "23",
    "name": "神职人员",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 60,
    "occupationalSkills": [
      "会计",
      "历史",
      "图书馆使用",
      "聆听",
      "外语",
      "心理学"
    ],
    "skillText": "会计，历史，图书馆，聆听，外语，一项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他技能。"
  },
  {
    "id": "24",
    "name": "程序员、电子工程师（现代）",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 70,
    "occupationalSkills": [
      "计算机使用",
      "电气维修",
      "电子学",
      "图书馆使用",
      "科学",
      "侦查"
    ],
    "skillText": "计算机，电气维修，电子学、图书馆，科学（数学），侦查，任意两项其他个人或时代特长。"
  },
  {
    "id": "25",
    "name": "黑客/骇客（现代）",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 70,
    "occupationalSkills": [
      "计算机使用",
      "电气维修",
      "电子学",
      "图书馆使用",
      "侦查"
    ],
    "skillText": "计算机，电气维修，电子学，图书馆，侦查，一项社交技能（取悦、话术、恐吓、说服），任意两项其他技能。"
  },
  {
    "id": "26",
    "name": "牛仔",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "闪避",
      "跳跃",
      "骑术",
      "生存",
      "投掷",
      "追踪"
    ],
    "skillText": "闪避，格斗或射击，急救或自然，跳跃，骑乘，生存（任一），投掷，追踪。"
  },
  {
    "id": "27",
    "name": "工匠",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 10,
    "creditMax": 40,
    "occupationalSkills": [
      "会计",
      "技艺",
      "机械维修",
      "博物学",
      "侦查"
    ],
    "skillText": "会计，技艺（任二），机械维修，自然，侦查，任意两项其他个人或时代特长。"
  },
  {
    "id": "28",
    "name": "罪犯-刺客",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 30,
    "creditMax": 60,
    "occupationalSkills": [
      "乔装",
      "电气维修",
      "格斗",
      "射击",
      "锁匠",
      "机械维修",
      "潜行",
      "心理学"
    ],
    "skillText": "乔装，电气维修，格斗，射击，锁匠，机械维修，潜行，心理学。"
  },
  {
    "id": "29",
    "name": "罪犯-银行劫匪",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 5,
    "creditMax": 75,
    "occupationalSkills": [
      "汽车驾驶",
      "格斗",
      "射击",
      "恐吓",
      "锁匠",
      "操作重型机械"
    ],
    "skillText": "汽车驾驶，电气维修或机械维修，格斗，射击，恐吓，锁匠，操作重型机械，任意一项其他个人或时代特长。"
  },
  {
    "id": "30",
    "name": "罪犯-打手、暴徒",
    "pointFormula": "EDU_X2_PLUS_STR_X2",
    "creditMin": 5,
    "creditMax": 30,
    "occupationalSkills": [
      "汽车驾驶",
      "格斗",
      "射击",
      "心理学",
      "潜行",
      "侦查"
    ],
    "skillText": "汽车驾驶，格斗，射击，两项社交技能（取悦、话术、恐吓、说服），心理学，潜行，侦查。"
  },
  {
    "id": "31",
    "name": "罪犯-窃贼",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 5,
    "creditMax": 40,
    "occupationalSkills": [
      "估价",
      "攀爬",
      "聆听",
      "锁匠",
      "妙手",
      "潜行",
      "侦查"
    ],
    "skillText": "估价，攀爬，电气维修或机械维修，聆听，锁匠，妙手，潜行，侦查。"
  },
  {
    "id": "32",
    "name": "罪犯-欺诈师",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 10,
    "creditMax": 65,
    "occupationalSkills": [
      "估价",
      "技艺",
      "聆听",
      "心理学",
      "妙手"
    ],
    "skillText": "估价，技艺（表演），法律或外语，聆听，两项社交技能（取悦、话术、恐吓、说服），心理学，妙手。"
  },
  {
    "id": "33",
    "name": "罪犯-独行罪犯",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 5,
    "creditMax": 65,
    "occupationalSkills": [
      "估价",
      "潜行",
      "心理学",
      "侦查"
    ],
    "skillText": "技艺（表演）或乔装，估价，一项社交技能（取悦、话术、恐吓、说服），格斗或射击，锁匠或机械维修，潜行，心理学，侦查。"
  },
  {
    "id": "34",
    "name": "罪犯-女飞贼（古典）",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 10,
    "creditMax": 80,
    "occupationalSkills": [
      "技艺",
      "汽车驾驶",
      "聆听",
      "潜行"
    ],
    "skillText": "技艺（任意），两项社交技能（取悦、话术、恐吓、说服），格斗（斗殴）或射击（手枪），汽车驾驶，聆听，潜行，任意一项其他个人或时代特长。"
  },
  {
    "id": "35",
    "name": "罪犯-赃物贩子",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 20,
    "creditMax": 40,
    "occupationalSkills": [
      "会计",
      "估价",
      "技艺",
      "历史",
      "图书馆使用",
      "侦查"
    ],
    "skillText": "会计，估价，技艺（伪造），历史，一项社交技能（取悦、话术、恐吓、说服），图书馆，侦查，任意一项其他技能。"
  },
  {
    "id": "36",
    "name": "罪犯-赝造者",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 60,
    "occupationalSkills": [
      "会计",
      "估价",
      "技艺",
      "历史",
      "图书馆使用",
      "侦查",
      "妙手"
    ],
    "skillText": "会计，估价，技艺（伪造），历史，图书馆，侦查，妙手，任意一项其他个人或时代特长（如计算机）。"
  },
  {
    "id": "37",
    "name": "罪犯-走私者",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 20,
    "creditMax": 60,
    "occupationalSkills": [
      "射击",
      "聆听",
      "导航",
      "心理学",
      "妙手",
      "侦查"
    ],
    "skillText": "射击，聆听，导航，一项社交技能（取悦、话术、恐吓、说服），汽车驾驶或驾驶（飞行器或船），心理学，妙手，侦查。"
  },
  {
    "id": "38",
    "name": "罪犯-混混",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 3,
    "creditMax": 10,
    "occupationalSkills": [
      "攀爬",
      "格斗",
      "射击",
      "跳跃",
      "妙手",
      "潜行",
      "投掷"
    ],
    "skillText": "攀爬，一项社交技能（取悦、话术、恐吓、说服），格斗，射击，跳跃，妙手，潜行，投掷。"
  },
  {
    "id": "39",
    "name": "教团首领",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 60,
    "occupationalSkills": [
      "会计",
      "神秘学",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），神秘学，心理学，侦查，任意其他两项其他个人特长。"
  },
  {
    "id": "40",
    "name": "除魅师（现代）",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 50,
    "occupationalSkills": [
      "汽车驾驶",
      "历史",
      "神秘学",
      "心理学",
      "潜行"
    ],
    "skillText": "两项社交技能（取悦、话术、恐吓、说服），汽车驾驶，格斗（斗殴）或射击，历史，神秘学，心理学，潜行。※经KP允许 可用催眠替换其中一项。"
  },
  {
    "id": "41",
    "name": "设计师",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 60,
    "occupationalSkills": [
      "会计",
      "技艺",
      "机械维修",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，技艺（摄影），技艺（任一），计算机或图书馆，机械维修，心理学，侦查，任意一项其他个人特长。"
  },
  {
    "id": "42",
    "name": "业余艺术爱好者（原作向）",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 50,
    "creditMax": 99,
    "occupationalSkills": [
      "技艺",
      "射击",
      "外语",
      "骑术"
    ],
    "skillText": "技艺（任一），射击，外语，骑乘，一项社交技能（取悦、话术、恐吓、说服），任意三项其他个人或时代特长。"
  },
  {
    "id": "43",
    "name": "潜水员",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "潜水",
      "急救",
      "机械维修",
      "驾驶",
      "科学",
      "侦查",
      "游泳"
    ],
    "skillText": "潜水，急救，机械维修，驾驶（船），科学（生物），侦查，游泳，任意一项其他个人或时代特长。"
  },
  {
    "id": "44",
    "name": "医生（原作向）",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 80,
    "occupationalSkills": [
      "急救",
      "医学",
      "外语",
      "心理学",
      "科学"
    ],
    "skillText": "急救、医学、外语（拉丁文）、心理学、科学（生物学，制药），任两种其他学术或个人特长。"
  },
  {
    "id": "45",
    "name": "流浪者",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2",
    "creditMin": 0,
    "creditMax": 5,
    "occupationalSkills": [
      "攀爬",
      "跳跃",
      "聆听",
      "导航",
      "潜行"
    ],
    "skillText": "攀爬，跳跃，聆听，导航，一项社交技能（取悦、话术、恐吓、说服），潜行，任意两项其他个人或时代特长。"
  },
  {
    "id": "46",
    "name": "司机-私人司机",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 10,
    "creditMax": 40,
    "occupationalSkills": [
      "汽车驾驶",
      "聆听",
      "机械维修",
      "导航",
      "侦查"
    ],
    "skillText": "汽车驾驶，两项社交技能（取悦、话术、恐吓、说服），聆听，机械维修，导航，侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "47",
    "name": "司机-司机",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "会计",
      "汽车驾驶",
      "聆听",
      "机械维修",
      "导航",
      "心理学"
    ],
    "skillText": "会计，汽车驾驶，聆听，一项社交技能（取悦、话术、恐吓、说服），机械维修，导航，心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "48",
    "name": "司机-出租车司机",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "会计",
      "汽车驾驶",
      "电气维修",
      "话术",
      "机械维修",
      "导航",
      "侦查"
    ],
    "skillText": "会计，汽车驾驶，电气维修，话术，机械维修，导航，侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "49",
    "name": "编辑",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 30,
    "occupationalSkills": [
      "会计",
      "历史",
      "母语",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，历史，母语，两项社交技能（取悦、话术、恐吓、说服），心理学，侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "50",
    "name": "政府官员",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 50,
    "creditMax": 90,
    "occupationalSkills": [
      "取悦",
      "历史",
      "恐吓",
      "话术",
      "聆听",
      "母语",
      "说服",
      "心理学"
    ],
    "skillText": "取悦，历史，恐吓，话术，聆听，母语，说服，心理学。"
  },
  {
    "id": "51",
    "name": "工程师",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 60,
    "occupationalSkills": [
      "技艺",
      "电气维修",
      "图书馆使用",
      "机械维修",
      "操作重型机械",
      "科学"
    ],
    "skillText": "技艺（技术制图），电气维修，图书馆，机械维修，操作重型机械，科学（工程学，物理），任意一项其他个人或时代特长。"
  },
  {
    "id": "52",
    "name": "艺人",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 70,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "聆听",
      "心理学"
    ],
    "skillText": "技艺（表演类，如表演、演唱、喜剧等），乔装，两项社交技能（取悦、话术、恐吓、说服），聆听，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "53",
    "name": "探险家（古典）",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2",
    "creditMin": 55,
    "creditMax": 80,
    "occupationalSkills": [
      "射击",
      "历史",
      "跳跃",
      "博物学",
      "导航",
      "外语",
      "生存"
    ],
    "skillText": "攀爬或游泳，射击，历史，跳跃，自然，导航，外语，生存。"
  },
  {
    "id": "54",
    "name": "农民",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "机械维修",
      "博物学",
      "操作重型机械",
      "追踪"
    ],
    "skillText": "技艺（耕作），汽车驾驶（或运货马车），一项社交技能（取悦、话术、恐吓、说服），机械维修，自然，操作重型机械，追踪，任意一项其他个人或时代特长"
  },
  {
    "id": "55",
    "name": "联邦探员",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 40,
    "occupationalSkills": [
      "汽车驾驶",
      "格斗",
      "射击",
      "法律",
      "说服",
      "潜行",
      "侦查"
    ],
    "skillText": "汽车驾驶，格斗（斗殴），射击，法律，说服，潜行，侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "56",
    "name": "消防员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "攀爬",
      "闪避",
      "汽车驾驶",
      "急救",
      "跳跃",
      "机械维修",
      "操作重型机械",
      "投掷"
    ],
    "skillText": "攀爬，闪避，汽车驾驶，急救，跳跃，机械维修，操作重型机械，投掷。"
  },
  {
    "id": "57",
    "name": "驻外记者",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 40,
    "occupationalSkills": [
      "历史",
      "外语",
      "母语",
      "聆听",
      "心理学"
    ],
    "skillText": "历史，外语，母语，聆听，两项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "58",
    "name": "法医",
    "pointFormula": "EDU_X4",
    "creditMin": 40,
    "creditMax": 60,
    "occupationalSkills": [
      "外语",
      "图书馆使用",
      "医学",
      "说服",
      "科学",
      "侦查"
    ],
    "skillText": "外语（拉丁文），图书馆，医学，说服，科学（生物学，药学，司法科学），侦查。"
  },
  {
    "id": "59",
    "name": "赌徒",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 8,
    "creditMax": 50,
    "occupationalSkills": [
      "会计",
      "技艺",
      "聆听",
      "心理学",
      "妙手",
      "侦查"
    ],
    "skillText": "会计，技艺（表演），两项社交技能（取悦、话术、恐吓、说服），聆听，心理学，妙手，侦查。"
  },
  {
    "id": "60",
    "name": "黑帮-黑帮老大",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 60,
    "creditMax": 95,
    "occupationalSkills": [
      "格斗",
      "射击",
      "法律",
      "聆听",
      "心理学",
      "侦查"
    ],
    "skillText": "格斗，射击，法律，聆听，两项社交技能（取悦、话术、恐吓、说服），心理学，侦查。"
  },
  {
    "id": "61",
    "name": "黑帮-马仔",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "汽车驾驶",
      "格斗",
      "射击",
      "心理学"
    ],
    "skillText": "汽车驾驶，格斗，射击，两项社交技能（取悦、话术、恐吓、说服），心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "62",
    "name": "绅士、淑女",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 40,
    "creditMax": 90,
    "occupationalSkills": [
      "技艺",
      "射击",
      "历史",
      "外语",
      "导航",
      "骑术"
    ],
    "skillText": "技艺（任一），两项社交技能（取悦、话术、恐吓、说服），射击（步枪/霰弹枪），历史，外语（任一），导航，骑乘。"
  },
  {
    "id": "63",
    "name": "游民",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 0,
    "creditMax": 5,
    "occupationalSkills": [
      "技艺",
      "攀爬",
      "跳跃",
      "聆听",
      "导航",
      "潜行"
    ],
    "skillText": "技艺（任一），攀爬，跳跃，聆听，锁匠或妙手，导航，潜行，任意一项其他个人或时代特长。"
  },
  {
    "id": "64",
    "name": "勤杂护工",
    "pointFormula": "EDU_X2_PLUS_STR_X2",
    "creditMin": 6,
    "creditMax": 15,
    "occupationalSkills": [
      "电气维修",
      "格斗",
      "急救",
      "聆听",
      "机械维修",
      "心理学",
      "潜行"
    ],
    "skillText": "电气维修，一项社交技能（取悦、话术、恐吓、说服），格斗（斗殴），急救，聆听，机械维修，心理学，潜行。"
  },
  {
    "id": "65",
    "name": "记者(原作向)-调查记者",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "历史",
      "图书馆使用",
      "母语",
      "心理学"
    ],
    "skillText": "技艺（艺术或摄影），一项社交技能（取悦、话术、恐吓、说服），历史，图书馆，母语，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "66",
    "name": "记者(原作向)-通讯记者",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "历史",
      "聆听",
      "母语",
      "心理学",
      "潜行",
      "侦查"
    ],
    "skillText": "技艺（表演），历史，聆听，母语，一项社交技能（取悦、话术、恐吓、说服），心理学，潜行，侦查。"
  },
  {
    "id": "67",
    "name": "法官",
    "pointFormula": "EDU_X4",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "历史",
      "恐吓",
      "法律",
      "图书馆使用",
      "聆听",
      "母语",
      "说服",
      "心理学"
    ],
    "skillText": "历史，恐吓，法律，图书馆，聆听，母语，说服，心理学。"
  },
  {
    "id": "68",
    "name": "实验室助理",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 30,
    "occupationalSkills": [
      "电气维修",
      "外语",
      "科学",
      "侦查"
    ],
    "skillText": "计算机或图书馆，电气维修，外语，科学（化学和任意两项），侦查，任意一项其他个人特长。"
  },
  {
    "id": "69",
    "name": "工人-非熟练工人",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "汽车驾驶",
      "电气维修",
      "格斗",
      "急救",
      "机械维修",
      "操作重型机械",
      "投掷"
    ],
    "skillText": "汽车驾驶，电气维修，格斗，急救，机械维修，操作重型机械，投掷，任意一项其他个人或时代特长。"
  },
  {
    "id": "70",
    "name": "工人-伐木工",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "攀爬",
      "闪避",
      "格斗",
      "急救",
      "跳跃",
      "机械维修",
      "投掷"
    ],
    "skillText": "攀爬，闪避，格斗（链锯），急救，跳跃，机械维修，自然或科学（生物学或植物学），投掷。"
  },
  {
    "id": "71",
    "name": "工人-矿工",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "攀爬",
      "科学",
      "跳跃",
      "机械维修",
      "操作重型机械",
      "潜行",
      "侦查"
    ],
    "skillText": "攀爬，科学（地质），跳跃，机械维修，操作重型机械，潜行，侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "72",
    "name": "律师",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 80,
    "occupationalSkills": [
      "会计",
      "法律",
      "图书馆使用",
      "心理学"
    ],
    "skillText": "会计，法律，图书馆，两项社交技能（取悦、话术、恐吓、说服），心理学，两项其他技能。"
  },
  {
    "id": "73",
    "name": "图书馆管理员（原作向）",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 35,
    "occupationalSkills": [
      "会计",
      "图书馆使用",
      "外语",
      "母语"
    ],
    "skillText": "会计，图书馆，外语，母语，任意四项其他个人特长或专业书籍主题。"
  },
  {
    "id": "74",
    "name": "技师",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 40,
    "occupationalSkills": [
      "技艺",
      "攀爬",
      "汽车驾驶",
      "电气维修",
      "机械维修",
      "操作重型机械"
    ],
    "skillText": "技艺（木工、焊接、管道工等），攀爬，汽车驾驶，电气维修，机械维修，操作重型机械，任意两项其他个人或时代或技术特长。"
  },
  {
    "id": "75",
    "name": "军官",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 20,
    "creditMax": 70,
    "occupationalSkills": [
      "会计",
      "射击",
      "导航",
      "急救",
      "心理学"
    ],
    "skillText": "会计，射击，导航，急救，两项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "76",
    "name": "传教士",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 0,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "急救",
      "机械维修",
      "医学",
      "博物学"
    ],
    "skillText": "技艺（任一），急救，机械维修，医学，自然，一项社交技能（取悦、话术、恐吓、说服），任意两项其他个人或时代特长。"
  },
  {
    "id": "77",
    "name": "登山家",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 30,
    "creditMax": 60,
    "occupationalSkills": [
      "攀爬",
      "急救",
      "跳跃",
      "聆听",
      "导航",
      "外语",
      "生存",
      "追踪"
    ],
    "skillText": "攀爬，急救，跳跃，聆听，导航，外语，生存（阿尔卑斯或类似），追踪。"
  },
  {
    "id": "78",
    "name": "博物馆管理员",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 30,
    "occupationalSkills": [
      "会计",
      "估价",
      "考古学",
      "历史",
      "图书馆使用",
      "神秘学",
      "外语",
      "侦查"
    ],
    "skillText": "会计，估价，考古，历史，图书馆，神秘学，外语，侦查。"
  },
  {
    "id": "79",
    "name": "音乐家",
    "pointFormula": "EDU_X2_PLUS_MAX_POW_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "聆听",
      "心理学"
    ],
    "skillText": "技艺（乐器），一项社交技能（取悦、话术、恐吓、说服），聆听，心理学，四项其他技能。"
  },
  {
    "id": "80",
    "name": "护士",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "急救",
      "聆听",
      "医学",
      "心理学",
      "科学",
      "侦查"
    ],
    "skillText": "急救，聆听，医学，一项社交技能（取悦、话术、恐吓、说服），心理学，科学（生物学，化学），侦查。"
  },
  {
    "id": "81",
    "name": "神秘学家",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 65,
    "occupationalSkills": [
      "人类学",
      "历史",
      "图书馆使用",
      "神秘学",
      "外语",
      "科学"
    ],
    "skillText": "人类学，历史，图书馆，一项社交技能（取悦、话术、恐吓、说服），神秘学，外语，科学（天文），任意一项其他个人或时代特长 ※经KP允许 可以包含克苏鲁神话"
  },
  {
    "id": "82",
    "name": "旅行家",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 5,
    "creditMax": 20,
    "occupationalSkills": [
      "射击",
      "急救",
      "聆听",
      "博物学",
      "导航",
      "侦查",
      "生存",
      "追踪"
    ],
    "skillText": "射击，急救，聆听，自然，导航，侦查，生存（任一），追踪。"
  },
  {
    "id": "83",
    "name": "超心理学家",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "人类学",
      "技艺",
      "历史",
      "图书馆使用",
      "神秘学",
      "外语",
      "心理学"
    ],
    "skillText": "人类学，技艺（摄影），历史，图书馆，神秘学，外语，心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "84",
    "name": "药剂师",
    "pointFormula": "EDU_X4",
    "creditMin": 35,
    "creditMax": 75,
    "occupationalSkills": [
      "会计",
      "急救",
      "外语",
      "图书馆使用",
      "心理学",
      "科学"
    ],
    "skillText": "会计，急救，外语（拉丁文），图书馆，一项社交技能（取悦、话术、恐吓、说服），心理学，科学（制药，化学）。"
  },
  {
    "id": "85",
    "name": "摄影师-摄影师",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "心理学",
      "科学",
      "潜行",
      "侦查"
    ],
    "skillText": "技艺（摄影），一项社交技能（取悦、话术、恐吓、说服），心理学，科学（化学），潜行，侦查，任意两项其他个人或时代特长。"
  },
  {
    "id": "86",
    "name": "摄影师-摄影记者",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "攀爬",
      "外语",
      "心理学",
      "科学"
    ],
    "skillText": "技艺（摄影），攀爬，一项社交技能（取悦、话术、恐吓、说服），外语，心理学，科学（化学），任意两项其他个人或时代特长。"
  },
  {
    "id": "87",
    "name": "飞行员-飞行员",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 20,
    "creditMax": 70,
    "occupationalSkills": [
      "电气维修",
      "机械维修",
      "导航",
      "操作重型机械",
      "驾驶",
      "科学"
    ],
    "skillText": "电气维修，机械维修，导航，操作重型机械，驾驶（飞行器），科学（天文），任意两项其他个人或时代特长。"
  },
  {
    "id": "88",
    "name": "飞行员-特技飞行员（古典）",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 60,
    "occupationalSkills": [
      "会计",
      "电气维修",
      "聆听",
      "机械维修",
      "导航",
      "驾驶",
      "侦查"
    ],
    "skillText": "会计，电气维修，聆听，机械维修，导航，驾驶（飞行器），侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "89",
    "name": "警方(原作向)-警探",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 20,
    "creditMax": 50,
    "occupationalSkills": [
      "射击",
      "法律",
      "聆听",
      "心理学",
      "侦查"
    ],
    "skillText": "技艺（表演）或乔装，射击，法律，聆听，一项社交技能（取悦、话术、恐吓、说服），心理学，侦查，一项其他技能。"
  },
  {
    "id": "90",
    "name": "警方(原作向)-巡警",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "格斗",
      "射击",
      "急救",
      "法律",
      "心理学",
      "侦查"
    ],
    "skillText": "格斗（斗殴），射击，急救，一项社交技能（取悦、话术、恐吓、说服），法律，心理学，侦查和下面的一种个人特长：汽车驾驶或骑乘。"
  },
  {
    "id": "91",
    "name": "私家侦探",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "法律",
      "图书馆使用",
      "心理学",
      "侦查"
    ],
    "skillText": "技艺（摄影），乔装，法律，图书馆，一项社交技能（取悦、话术、恐吓、说服），心理学，侦查，一项其他个人或时代特长（如计算机、锁匠、格斗、射击）。"
  },
  {
    "id": "92",
    "name": "教授（原作向）",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 70,
    "occupationalSkills": [
      "图书馆使用",
      "外语",
      "母语",
      "心理学"
    ],
    "skillText": "图书馆，外语，母语，心理学，任意四项其他学术、时代或个人特长。"
  },
  {
    "id": "93",
    "name": "淘金客",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 0,
    "creditMax": 10,
    "occupationalSkills": [
      "攀爬",
      "急救",
      "历史",
      "机械维修",
      "导航",
      "科学",
      "侦查"
    ],
    "skillText": "攀爬、急救、历史、机械维修、导航、科学（地质），侦查，任意一项其他个人或时代特长。"
  },
  {
    "id": "94",
    "name": "性工作者",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 5,
    "creditMax": 50,
    "occupationalSkills": [
      "技艺",
      "闪避",
      "心理学",
      "妙手",
      "潜行"
    ],
    "skillText": "技艺（任一），两项社交技能（取悦、话术、恐吓、说服），闪避，心理学，妙手，潜行，任意一项其他个人或时代特长。"
  },
  {
    "id": "95",
    "name": "精神病学家",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 80,
    "occupationalSkills": [
      "外语",
      "聆听",
      "医学",
      "说服",
      "精神分析",
      "心理学",
      "科学"
    ],
    "skillText": "外语，聆听，医学，说服，精神分析，心理学，科学（生物学，化学）。"
  },
  {
    "id": "96",
    "name": "心理学家、精神分析学家",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 40,
    "occupationalSkills": [
      "会计",
      "图书馆使用",
      "聆听",
      "说服",
      "精神分析",
      "心理学"
    ],
    "skillText": "会计，图书馆，聆听，说服，精神分析，心理学，任意两项其他学术、个人或时代特长。"
  },
  {
    "id": "97",
    "name": "研究员",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "历史",
      "图书馆使用",
      "外语",
      "侦查"
    ],
    "skillText": "历史，图书馆，一项社交技能（取悦、话术、恐吓、说服），外语，侦查，任意三项其他学术领域。"
  },
  {
    "id": "98",
    "name": "海员-军舰海员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "格斗",
      "射击",
      "急救",
      "导航",
      "驾驶",
      "生存",
      "游泳"
    ],
    "skillText": "电工或机械维修，格斗，射击，急救，导航，驾驶（船），生存（海上），游泳。"
  },
  {
    "id": "99",
    "name": "海员-民船海员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 20,
    "creditMax": 40,
    "occupationalSkills": [
      "急救",
      "机械维修",
      "博物学",
      "导航",
      "驾驶",
      "侦查",
      "游泳"
    ],
    "skillText": "急救，机械维修，自然，导航，一项社交技能（取悦、话术、恐吓、说服），驾驶（船），侦查，游泳。"
  },
  {
    "id": "100",
    "name": "推销员",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 40,
    "occupationalSkills": [
      "会计",
      "汽车驾驶",
      "聆听",
      "心理学"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），汽车驾驶，聆听，心理学，潜行或妙手，一项其他技能。"
  },
  {
    "id": "101",
    "name": "科学家",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 50,
    "occupationalSkills": [
      "外语",
      "母语",
      "侦查"
    ],
    "skillText": "任意三项科学专业领域，计算机或图书馆，外语，母语，一项社交技能（取悦、话术、恐吓、说服），侦查。"
  },
  {
    "id": "102",
    "name": "秘书",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "会计",
      "技艺",
      "母语",
      "心理学"
    ],
    "skillText": "会计，技艺（打字或速记），两项社交技能（取悦、话术、恐吓、说服），母语，图书馆或计算机，心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "103",
    "name": "店老板",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 20,
    "creditMax": 40,
    "occupationalSkills": [
      "会计",
      "电气维修",
      "聆听",
      "机械维修",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），电气维修，聆听，机械维修，心理学，侦查。"
  },
  {
    "id": "104",
    "name": "士兵、海军陆战队士兵",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "闪避",
      "格斗",
      "射击",
      "潜行",
      "生存"
    ],
    "skillText": "攀爬或游泳，闪避，格斗，射击，潜行，生存，下面任选两项：急救、机械维修、外语。"
  },
  {
    "id": "105",
    "name": "间谍",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 20,
    "creditMax": 60,
    "occupationalSkills": [
      "射击",
      "聆听",
      "外语",
      "心理学",
      "妙手",
      "潜行"
    ],
    "skillText": "技艺（表演）或乔装，射击，聆听，外语，一项社交技能（取悦、话术、恐吓、说服），心理学，妙手，潜行。"
  },
  {
    "id": "106",
    "name": "学生、实习生",
    "pointFormula": "EDU_X4",
    "creditMin": 5,
    "creditMax": 10,
    "occupationalSkills": [
      "图书馆使用",
      "聆听"
    ],
    "skillText": "语言（母语或外语），图书馆，聆听，三个学习的专业，任意两项其他个人或时代特长。"
  },
  {
    "id": "107",
    "name": "替身演员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 10,
    "creditMax": 50,
    "occupationalSkills": [
      "攀爬",
      "闪避",
      "格斗",
      "急救",
      "跳跃",
      "游泳"
    ],
    "skillText": "攀爬，闪避，电气维修或机械维修，格斗，急救，跳跃，游泳，下面任选一项：潜水、汽车驾驶、驾驶（任一），骑乘。"
  },
  {
    "id": "108",
    "name": "部落成员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 0,
    "creditMax": 15,
    "occupationalSkills": [
      "攀爬",
      "聆听",
      "博物学",
      "神秘学",
      "侦查",
      "游泳",
      "生存"
    ],
    "skillText": "攀爬，格斗或投掷，聆听，自然，神秘学，侦查，游泳，生存（任一）。"
  },
  {
    "id": "109",
    "name": "殡葬师",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 40,
    "occupationalSkills": [
      "会计",
      "汽车驾驶",
      "历史",
      "神秘学",
      "心理学",
      "科学"
    ],
    "skillText": "会计，汽车驾驶，一项社交技能（取悦、话术、恐吓、说服），历史，神秘学，心理学，科学（生物学，化学）。"
  },
  {
    "id": "110",
    "name": "工会活动家",
    "pointFormula": "EDU_X4",
    "creditMin": 5,
    "creditMax": 50,
    "occupationalSkills": [
      "会计",
      "格斗",
      "法律",
      "聆听",
      "操作重型机械",
      "心理学"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），格斗（斗殴），法律，聆听，操作重型机械，心理学。"
  },
  {
    "id": "111",
    "name": "服务生",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "会计",
      "技艺",
      "闪避",
      "聆听",
      "心理学"
    ],
    "skillText": "会计，技艺（任一），闪避，聆听，两项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "112",
    "name": "白领工人-职员、主管",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "会计",
      "法律",
      "聆听"
    ],
    "skillText": "会计，语言，法律，图书馆或计算机，聆听，一项社交技能（取悦、话术、恐吓、说服），任意两项其他个人或时代特长。"
  },
  {
    "id": "113",
    "name": "白领工人-中高层管理人员",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 80,
    "occupationalSkills": [
      "会计",
      "外语",
      "法律",
      "心理学"
    ],
    "skillText": "会计，外语，法律，两项社交技能（取悦、话术、恐吓、说服），心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "114",
    "name": "狂热者",
    "pointFormula": "EDU_X2_PLUS_MAX_APP_X2_POW_X2",
    "creditMin": 0,
    "creditMax": 30,
    "occupationalSkills": [
      "历史",
      "心理学",
      "潜行"
    ],
    "skillText": "历史，两项社交技能（取悦、话术、恐吓、说服），心理学，潜行，任意三项其他个人或时代特长。"
  },
  {
    "id": "115",
    "name": "饲养员",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 40,
    "occupationalSkills": [
      "动物驯养",
      "会计",
      "闪避",
      "急救",
      "博物学",
      "医学",
      "科学"
    ],
    "skillText": "驯兽，会计，闪避，急救，自然，医学，科学（制药，动物学）。"
  },
  {
    "id": "116",
    "name": "大使",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 50,
    "creditMax": 90,
    "occupationalSkills": [
      "取悦",
      "历史",
      "恐吓",
      "话术",
      "聆听",
      "母语",
      "说服",
      "心理学"
    ],
    "skillText": "取悦，历史，恐吓，话术，聆听，母语，说服，心理学。(用一到两种外语取代前面两种技能)"
  },
  {
    "id": "117",
    "name": "运动员（游泳/潜水）",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "攀爬",
      "跳跃",
      "格斗",
      "外语",
      "游泳",
      "投掷"
    ],
    "skillText": "攀爬，跳跃，格斗（斗殴），外语，一项社交技能（取悦、话术、恐吓、说服），游泳，投掷，任意一项其他个人或时代特长。"
  },
  {
    "id": "118",
    "name": "运动员（高尔夫）",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 50,
    "creditMax": 70,
    "occupationalSkills": [
      "攀爬",
      "跳跃",
      "格斗",
      "骑术",
      "游泳",
      "投掷"
    ],
    "skillText": "攀爬，跳跃，格斗（斗殴），骑术，一项社交技能（取悦、话术、恐吓、说服），游泳，投掷，任意一项其他个人或时代特长。"
  },
  {
    "id": "119",
    "name": "运动员（网球）",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "跳跃",
      "格斗",
      "闪避",
      "心理学",
      "侦查",
      "投掷"
    ],
    "skillText": "跳跃，格斗（斗殴），闪避，一项社交技能（取悦、话术、恐吓、说服），心理学，侦察，投掷，任意一项其他个人或时代特长。"
  },
  {
    "id": "120",
    "name": "运动员（田径）",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "攀爬",
      "跳跃",
      "格斗",
      "外语",
      "闪避",
      "投掷"
    ],
    "skillText": "攀爬，跳跃，格斗（斗殴），外语，一项社交技能（取悦、话术、恐吓、说服），闪避，投掷，任意一项其他个人或时代特长。"
  },
  {
    "id": "121",
    "name": "发言人",
    "pointFormula": "EDU_X4",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "乔装",
      "闪避",
      "心理学",
      "外语"
    ],
    "skillText": "乔装，闪避，三项社交技能（取悦、话术、恐吓、说服），心理学，外语，任意一项其他个人或时代特长。"
  },
  {
    "id": "122",
    "name": "保释担保人",
    "pointFormula": "EDU_X4",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "会计",
      "法律",
      "图书馆使用",
      "心理学"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），法律，图书馆，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "123",
    "name": "神职人员(天主教牧师)",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 70,
    "occupationalSkills": [
      "会计",
      "母语",
      "外语",
      "图书馆使用",
      "神秘学",
      "心理学"
    ],
    "skillText": "会计，母语，外语(拉丁文)，图书馆，神秘学，一项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他技能。"
  },
  {
    "id": "124",
    "name": "神职人员(新教牧师)",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 60,
    "occupationalSkills": [
      "会计",
      "历史",
      "图书馆使用",
      "聆听",
      "外语",
      "心理学"
    ],
    "skillText": "会计，历史，图书馆，聆听，外语，一项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他技能。"
  },
  {
    "id": "125",
    "name": "神职人员(犹太教拉比)",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 60,
    "occupationalSkills": [
      "母语",
      "外语",
      "历史",
      "图书馆使用",
      "神秘学",
      "心理学"
    ],
    "skillText": "母语，外语（希伯来语），历史，图书馆，神秘学，一项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他技能。"
  },
  {
    "id": "126",
    "name": "专栏作家",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "乔装",
      "母语",
      "外语",
      "心理学",
      "潜行"
    ],
    "skillText": "乔装，一项社交技能（取悦、话术、恐吓、说服），历史或图书馆，母语，外语，心理学，潜行。"
  },
  {
    "id": "127",
    "name": "社会主义者/激进主义者",
    "pointFormula": "EDU_X2_PLUS_MAX_APP_X2_POW_X2",
    "creditMin": 0,
    "creditMax": 30,
    "occupationalSkills": [
      "格斗",
      "射击",
      "外语",
      "心理学"
    ],
    "skillText": "格斗（斗殴），两项社交技能（取悦、话术、恐吓、说服），射击（手枪），外语，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "128",
    "name": "撰稿人",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 60,
    "occupationalSkills": [
      "母语",
      "技艺",
      "历史",
      "图书馆使用",
      "聆听",
      "心理学"
    ],
    "skillText": "母语，艺术（文学），两项社交技能（取悦、话术、恐吓、说服），历史，图书馆，聆听，心理学。"
  },
  {
    "id": "129",
    "name": "罪犯（赌博庄家）",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "会计",
      "心理学",
      "侦查",
      "妙手"
    ],
    "skillText": "会计,两项社交技能（取悦、话术、恐吓、说服）,心理学，侦察，妙手，任意一项其他个人或时代特长。"
  },
  {
    "id": "130",
    "name": "罪犯（放高利贷者）",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "会计",
      "估价",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，估价，两项社交技能（取悦、话术、恐吓、说服）,心理学，侦察，任意两项其他个人或时代特长。"
  },
  {
    "id": "131",
    "name": "罪犯（扒手）",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "乔装",
      "潜行",
      "聆听",
      "心理学",
      "侦查",
      "妙手"
    ],
    "skillText": "乔装，一项社交技能（取悦、话术、恐吓、说服）,潜行，聆听，心理学，侦察，妙手，任意一项其他个人或时代特长。"
  },
  {
    "id": "132",
    "name": "罪犯（地下钱庄）",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "会计",
      "法律",
      "图书馆使用",
      "聆听",
      "说服",
      "侦查"
    ],
    "skillText": "会计，法律，图书馆，聆听，说服，侦察，任意其他两项个人或时代特长。"
  },
  {
    "id": "133",
    "name": "罪犯（黑律师）",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 80,
    "occupationalSkills": [
      "会计",
      "法律",
      "图书馆使用",
      "心理学"
    ],
    "skillText": "会计，法律，图书馆，两项社交技能（取悦、话术、恐吓、说服），心理学，两项其他技能。"
  },
  {
    "id": "134",
    "name": "牙医",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "急救",
      "医学",
      "外语",
      "心理学",
      "科学"
    ],
    "skillText": "急救、医学、外语（拉丁文）、心理学、科学（生物学，制药），任两种其他学术或个人特长。"
  },
  {
    "id": "135",
    "name": "外科医生/内科医生",
    "pointFormula": "EDU_X4",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "急救",
      "医学",
      "外语",
      "心理学",
      "科学"
    ],
    "skillText": "急救、医学、外语（拉丁文）、心理学、科学（生物学，制药），任两种其他学术或个人特长。"
  },
  {
    "id": "136",
    "name": "整形医生",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 80,
    "occupationalSkills": [
      "急救",
      "医学",
      "外语",
      "心理学",
      "科学"
    ],
    "skillText": "急救、医学、外语（拉丁文）、心理学、科学（生物学，制药），任两种其他学术或个人特长。"
  },
  {
    "id": "137",
    "name": "司机-公交司机",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 30,
    "creditMax": 50,
    "occupationalSkills": [
      "会计",
      "汽车驾驶",
      "电气维修",
      "机械维修",
      "导航",
      "心理学"
    ],
    "skillText": "会计，汽车驾驶，电气维修，机械维修，导航，一项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "138",
    "name": "实地调研员",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "会计",
      "急救",
      "图书馆使用",
      "外语"
    ],
    "skillText": "会计，攀爬或跳跃，急救，图书馆，外语，一项社交技能（取悦、话术、恐吓、说服），两项研究领域相关技能。"
  },
  {
    "id": "139",
    "name": "电影摄制人员",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_POW_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "攀爬",
      "汽车驾驶",
      "电气维修",
      "机械维修"
    ],
    "skillText": "艺术/工艺(任一,如摄影)，攀爬，汽车驾驶，电气维修，机械维修，一项社交技能（取悦、话术、恐吓、说服），任意两项其他个人或时代特长。"
  },
  {
    "id": "140",
    "name": "司法科学家",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 50,
    "occupationalSkills": [
      "技艺",
      "医学",
      "法律",
      "科学",
      "侦查"
    ],
    "skillText": "艺术（摄影），医学，法律，科学（化学，司法科学，药学），侦察，任意一项其他个人或时代特长。"
  },
  {
    "id": "141",
    "name": "运动经理",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 20,
    "creditMax": 70,
    "occupationalSkills": [
      "会计",
      "格斗",
      "闪避",
      "急救",
      "心理学"
    ],
    "skillText": "会计，格斗（斗殴），闪避，两项社交技能（取悦、话术、恐吓、说服），急救，心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "142",
    "name": "商船队船员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 20,
    "creditMax": 30,
    "occupationalSkills": [
      "人类学",
      "攀爬",
      "跳跃",
      "操作重型机械",
      "外语",
      "生存"
    ],
    "skillText": "人类学，攀爬，电气维修或机械维修，跳跃，操作重型机械，外语，生存（海上），任意一项其他个人或时代特长。"
  },
  {
    "id": "143",
    "name": "古典音乐家",
    "pointFormula": "EDU_X2_PLUS_MAX_POW_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "会计",
      "技艺",
      "聆听",
      "心理学"
    ],
    "skillText": "会计，技艺（乐器），一项社交技能（取悦、话术、恐吓、说服），聆听，心理学，三项其他技能。"
  },
  {
    "id": "144",
    "name": "赛车手/ 赛艇手",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "汽车驾驶",
      "电气维修",
      "机械维修",
      "驾驶",
      "心理学",
      "侦查"
    ],
    "skillText": "汽车驾驶，电气维修，机械维修，驾驶（船），心理学，侦察，任意两项其他个人或时代特长。"
  },
  {
    "id": "145",
    "name": "电台播音员",
    "pointFormula": "EDU_X4",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "技艺",
      "母语",
      "取悦",
      "话术",
      "说服",
      "心理学"
    ],
    "skillText": "艺术（表演），母语，取悦，话术，说服，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "146",
    "name": "推销员（圣经推销员）",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 40,
    "occupationalSkills": [
      "会计",
      "汽车驾驶",
      "聆听",
      "心理学"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），汽车驾驶，聆听，心理学，潜行或妙手，一项其他技能。"
  },
  {
    "id": "147",
    "name": "推销员（旅行推销员）",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "会计",
      "汽车驾驶",
      "导航",
      "聆听",
      "心理学"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），汽车驾驶，导航，聆听，心理学，一项其他技能。"
  },
  {
    "id": "148",
    "name": "小企业家",
    "pointFormula": "EDU_X4",
    "creditMin": 50,
    "creditMax": 70,
    "occupationalSkills": [
      "会计",
      "心理学"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），心理学，四项经营业务相关技能。"
  },
  {
    "id": "149",
    "name": "舞台工作人员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "技艺",
      "母语",
      "乔装",
      "心理学"
    ],
    "skillText": "艺术/ 工艺（任一），母语，两项社交技能（取悦、话术、恐吓、说服），乔装，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "150",
    "name": "证券经纪人",
    "pointFormula": "EDU_X4",
    "creditMin": 60,
    "creditMax": 90,
    "occupationalSkills": [
      "会计",
      "估价",
      "母语",
      "心理学"
    ],
    "skillText": "会计，估价，母语，两项社交技能（取悦、话术、恐吓、说服），心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "151",
    "name": "勘测员",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 60,
    "occupationalSkills": [
      "会计",
      "技艺",
      "图书馆使用",
      "博物学",
      "导航",
      "生存",
      "侦查"
    ],
    "skillText": "会计，艺术（摄影），图书馆，博物学，导航，生存（任一），侦察，任意一项其他个人或时代特长。"
  },
  {
    "id": "152",
    "name": "电话接线员",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 50,
    "occupationalSkills": [
      "母语",
      "外语",
      "聆听",
      "心理学"
    ],
    "skillText": "母语，外语，两项社交技能（取悦、话术、恐吓、说服），聆听，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "153",
    "name": "星探",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "会计",
      "法律",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），法律，心理学，侦察，任意两项其他个人或时代特长。"
  },
  {
    "id": "154",
    "name": "医疗技术员",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 60,
    "occupationalSkills": [
      "技艺",
      "电气维修",
      "图书馆使用",
      "机械维修",
      "医学",
      "科学"
    ],
    "skillText": "艺术（摄影），电气维修，图书馆，机械维修，医学，科学（生物，化学，药学）。"
  },
  {
    "id": "155",
    "name": "队医",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "急救",
      "医学",
      "科学",
      "心理学",
      "侦查"
    ],
    "skillText": "两项社交技能（取悦、话术、恐吓、说服），急救，医学，科学（药学），心理学，侦察，任意一项其他个人或时代特长。"
  },
  {
    "id": "156",
    "name": "寻宝猎人",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "估价",
      "攀爬",
      "历史",
      "跳跃",
      "侦查"
    ],
    "skillText": "估价，攀爬，汽车驾驶或驾驶（飞行器或船），电气维修或机械维修，历史，跳跃，一项社交技能（取悦、话术、恐吓、说服），侦察。"
  },
  {
    "id": "157",
    "name": "西部治安官",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 20,
    "creditMax": 50,
    "occupationalSkills": [
      "汽车驾驶",
      "射击",
      "格斗",
      "法律",
      "骑术",
      "追踪"
    ],
    "skillText": "汽车驾驶，射击（任一），格斗（斗殴，鞭），法律，说服或心理学，骑术，追踪。"
  },
  {
    "id": "158",
    "name": "暴走族",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 5,
    "creditMax": 10,
    "occupationalSkills": [
      "格斗",
      "汽车驾驶",
      "机械维修",
      "话术",
      "恐吓"
    ],
    "skillText": "格斗（斗殴），汽车驾驶，机械维修，话术，恐吓，任意三项其他个人或时代特长。"
  },
  {
    "id": "159",
    "name": "神职人员(和尚,尼姑)",
    "pointFormula": "EDU_X4",
    "creditMin": 5,
    "creditMax": 60,
    "occupationalSkills": [
      "技艺",
      "外语",
      "学识",
      "心理学",
      "聆听"
    ],
    "skillText": "艺术（书法），历史或图书馆，外语（汉语或梵语），学识（佛教），一项社交技能（取悦、话术、恐吓、说服），心理学，聆听，任意一项其他个人或时代特长。"
  },
  {
    "id": "160",
    "name": "神职人员(神官,巫女)",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 60,
    "occupationalSkills": [
      "技艺",
      "图书馆使用",
      "神秘学",
      "学识",
      "心理学"
    ],
    "skillText": "艺术（书法，另任一），图书馆，神秘学，学识（神道教），一项社交技能（取悦、话术、恐吓、说服），心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "161",
    "name": "风水师",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 50,
    "occupationalSkills": [
      "技艺",
      "图书馆使用",
      "神秘学",
      "学识",
      "科学"
    ],
    "skillText": "艺术（任一），图书馆，神秘学，学识（道教），一项社交技能（取悦、话术、恐吓、说服），科学（天文，地质），任意一项其他个人或时代特长。"
  },
  {
    "id": "162",
    "name": "家传降妖人",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "格斗",
      "博物学",
      "神秘学",
      "学识",
      "心理学",
      "潜行"
    ],
    "skillText": "格斗（斗殴），博物学，神秘学，学识（佛教或神道教），心理学，潜行，任意两项其他个人或时代特长。"
  },
  {
    "id": "163",
    "name": "高中生(教育60以下)",
    "pointFormula": "EDU_X4",
    "creditMin": 5,
    "creditMax": 10,
    "occupationalSkills": [
      "攀爬",
      "潜行",
      "跳跃",
      "图书馆使用",
      "格斗",
      "母语",
      "外语"
    ],
    "skillText": "攀爬、潜行、跳跃、图书馆、格斗（任一）、母语、科学（任一）或历史、外语（英语或其他）。"
  },
  {
    "id": "164",
    "name": "市子（盲人）",
    "pointFormula": "EDU_X4",
    "creditMin": 5,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "聆听",
      "学识",
      "神秘学",
      "历史",
      "心理学"
    ],
    "skillText": "艺术（表演），聆听，学识（神道教），神秘学，历史，话术或说服，心理学，任意一项特长。※经KP同意，可以用「灵媒」技能代替一项自选技能。"
  },
  {
    "id": "165",
    "name": "言灵师/阴阳师",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "技艺",
      "母语",
      "学识",
      "科学",
      "神秘学"
    ],
    "skillText": "艺术（书法，另任一），历史或图书馆，母语，学识（阴阳道），科学（天文），神秘学，任意一项其他个人或时代特长。"
  },
  {
    "id": "166",
    "name": "炼丹师",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 50,
    "occupationalSkills": [
      "图书馆使用",
      "医学",
      "神秘学",
      "科学",
      "博物学",
      "学识",
      "外语"
    ],
    "skillText": "图书馆，医学，神秘学，科学（化学），博物学，学识（道教），外语（汉语），急救或精神分析。"
  },
  {
    "id": "167",
    "name": "外语教师",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 60,
    "occupationalSkills": [
      "历史",
      "聆听",
      "母语",
      "心理学"
    ],
    "skillText": "历史，聆听，母语，心理学，两项社交技能（取悦、话术、恐吓、说服），任意两项其他个人或时代特长。"
  },
  {
    "id": "168",
    "name": "非法移民",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 0,
    "creditMax": 5,
    "occupationalSkills": [
      "乔装",
      "话术",
      "聆听",
      "侦查",
      "潜行",
      "妙手",
      "心理学"
    ],
    "skillText": "乔装，话术，聆听，侦察，潜行，妙手，心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "169",
    "name": "相扑力士(SIZ>80,STR>70)",
    "pointFormula": "EDU_X2_PLUS_STR_X2",
    "creditMin": 9,
    "creditMax": 60,
    "occupationalSkills": [
      "闪避",
      "格斗",
      "恐吓",
      "跳跃",
      "心理学",
      "侦查"
    ],
    "skillText": "闪避，格斗（斗殴），恐吓，跳跃，心理学，侦察，任意两项其他个人或时代特长。(你的体型可以超过99)"
  },
  {
    "id": "170",
    "name": "渔民",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "机械维修",
      "操作重型机械",
      "游泳",
      "驾驶",
      "科学",
      "导航",
      "博物学",
      "侦查"
    ],
    "skillText": "机械维修，操作重型机械，游泳，驾驶（船），科学（天文），导航，博物学，侦察。"
  },
  {
    "id": "171",
    "name": "心理治疗师",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 50,
    "occupationalSkills": [
      "技艺",
      "法律",
      "外语",
      "心理学",
      "精神分析"
    ],
    "skillText": "艺术（任一），两项社交技能（取悦、话术、恐吓、说服），法律，外语，心理学，精神分析，任意一项其他个人或时代特长。"
  },
  {
    "id": "172",
    "name": "女学生",
    "pointFormula": "EDU_X4",
    "creditMin": 5,
    "creditMax": 10,
    "occupationalSkills": [
      "驾驶",
      "急救",
      "聆听",
      "技艺",
      "图书馆使用",
      "外语"
    ],
    "skillText": "一项社交技能（取悦、话术、恐吓、说服），自行车驾驶，急救，聆听，艺术/ 工艺（任一），图书馆，格斗（矛）或射击（弓术），外语（任一）。"
  },
  {
    "id": "173",
    "name": "寄居学生",
    "pointFormula": "EDU_X4",
    "creditMin": 5,
    "creditMax": 10,
    "occupationalSkills": [
      "急救",
      "会计",
      "技艺",
      "说服",
      "图书馆使用",
      "外语"
    ],
    "skillText": "急救，会计，手艺（木匠），说服，图书馆，外语（任一），任意两项其他个人或时代特长。"
  },
  {
    "id": "174",
    "name": "动物辅助治疗师",
    "pointFormula": "EDU_X2_PLUS_MAX_APP_X2_POW_X2",
    "creditMin": 30,
    "creditMax": 50,
    "occupationalSkills": [
      "聆听",
      "心理学",
      "精神分析",
      "科学",
      "跳跃",
      "追踪",
      "博物学"
    ],
    "skillText": "聆听，心理学，精神分析，科学（动物学），跳跃，追踪，博物学，任意一项其他个人或时代特长。\n跳跃，追踪，博物学，任意一项其他个人或时代特长。"
  },
  {
    "id": "175",
    "name": "急诊医生/救援队员",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 50,
    "occupationalSkills": [
      "医学",
      "急救",
      "科学",
      "锁匠",
      "机械维修",
      "电气维修",
      "攀爬",
      "跳跃"
    ],
    "skillText": "医学，急救，科学（化学），锁匠，机械维修，电气维修，攀爬，跳跃。"
  },
  {
    "id": "176",
    "name": "密医",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 70,
    "occupationalSkills": [
      "医学",
      "急救",
      "会计",
      "法律",
      "科学",
      "外语"
    ],
    "skillText": "医学，急救，会计，一项社交技能（取悦、话术、恐吓、说服），法律，科学（药学），外语，任意一项其他个人或时代特长。"
  },
  {
    "id": "177",
    "name": "科学搜查研究员",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 50,
    "occupationalSkills": [
      "技艺",
      "医学",
      "法律",
      "科学",
      "侦查"
    ],
    "skillText": "艺术（摄影），医学，法律，科学（化学，司法科学，药学），侦察，任意一项其他个人或时代特长。"
  },
  {
    "id": "178",
    "name": "山岳救援队员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 10,
    "creditMax": 50,
    "occupationalSkills": [
      "急救",
      "聆听",
      "跳跃",
      "追踪",
      "攀爬",
      "导航",
      "生存",
      "外语"
    ],
    "skillText": "急救，聆听，跳跃，追踪，攀爬，导航，生存（山地），外语。"
  },
  {
    "id": "179",
    "name": "舞者",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 70,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "聆听",
      "心理学"
    ],
    "skillText": "技艺（表演类，如表演、演唱、喜剧等），乔装，两项社交技能（取悦、话术、恐吓、说服），聆听，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "180",
    "name": "服装设计师",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 60,
    "occupationalSkills": [
      "会计",
      "技艺",
      "乔装",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，技艺（摄影），技艺（任一），计算机或图书馆，乔装，心理学，侦察，任意一项其他个人特长。※可以通过成功的「侦察」检定，从对方的服饰判定其地位和收入等。"
  },
  {
    "id": "181",
    "name": "海上自卫队员",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "格斗",
      "射击",
      "急救",
      "导航",
      "驾驶",
      "生存",
      "游泳"
    ],
    "skillText": "电气维修或机械维修，格斗，射击，急救，导航，驾驶（船），生存（海上），游泳。"
  },
  {
    "id": "182",
    "name": "海警",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 40,
    "occupationalSkills": [
      "急救",
      "机械维修",
      "博物学",
      "导航",
      "驾驶",
      "侦查",
      "游泳"
    ],
    "skillText": "急救，机械维修，博物学，导航，一项社交技能（取悦、话术、恐吓、说服），驾驶（船），侦察，游泳。"
  },
  {
    "id": "183",
    "name": "陆上自卫队员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "闪避",
      "格斗",
      "射击",
      "潜行",
      "生存"
    ],
    "skillText": "攀爬或游泳，闪避，格斗，射击，潜行，生存，下面任选两项：急救、机械维修、外语。"
  },
  {
    "id": "184",
    "name": "私人军事公司成员",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "闪避",
      "格斗",
      "射击",
      "潜行",
      "生存"
    ],
    "skillText": "攀爬或游泳，闪避，格斗，射击，潜行，生存，下面任选两项：急救、机械维修、外语。"
  },
  {
    "id": "185",
    "name": "冒险家教授",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2",
    "creditMin": 55,
    "creditMax": 80,
    "occupationalSkills": [
      "射击",
      "历史",
      "跳跃",
      "博物学",
      "导航",
      "外语",
      "生存"
    ],
    "skillText": "攀爬或游泳，射击，历史，跳跃，博物学，导航，外语，生存。"
  },
  {
    "id": "186",
    "name": "评论家",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "乔装",
      "母语",
      "外语",
      "心理学",
      "潜行"
    ],
    "skillText": "乔装，一项社交技能（取悦、话术、恐吓、说服），历史或图书馆，母语，外语，心理学，潜行。"
  },
  {
    "id": "187",
    "name": "偶像",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 70,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "聆听",
      "心理学"
    ],
    "skillText": "技艺（表演,歌唱,舞蹈），乔装，两项社交技能（取悦、话术、恐吓、说服），聆听，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "188",
    "name": "歌手",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 70,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "聆听",
      "心理学"
    ],
    "skillText": "技艺（歌唱,舞蹈,乐器），乔装，两项社交技能（取悦、话术、恐吓、说服），聆听，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "189",
    "name": "搞笑艺人",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 70,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "聆听",
      "心理学"
    ],
    "skillText": "技艺（表演,杂技,喜剧），乔装，两项社交技能（取悦、话术、恐吓、说服），聆听，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "190",
    "name": "运动员艺人",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "攀爬",
      "闪避",
      "跳跃",
      "投掷",
      "侦查",
      "游泳"
    ],
    "skillText": "攀爬，闪避，跳跃，投掷，侦察，游泳，任意两项其他个人或时代特长。"
  },
  {
    "id": "191",
    "name": "播音员",
    "pointFormula": "EDU_X4",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "技艺",
      "母语",
      "取悦",
      "话术",
      "说服",
      "心理学"
    ],
    "skillText": "艺术（表演），母语，取悦，话术，说服，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "192",
    "name": "主持人",
    "pointFormula": "EDU_X4",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "技艺",
      "母语",
      "取悦",
      "话术",
      "说服",
      "心理学"
    ],
    "skillText": "艺术（表演），母语，取悦，话术，说服，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "193",
    "name": "电视解说员",
    "pointFormula": "EDU_X4",
    "creditMin": 50,
    "creditMax": 80,
    "occupationalSkills": [
      "技艺",
      "母语",
      "取悦",
      "话术",
      "说服",
      "心理学"
    ],
    "skillText": "艺术（表演），母语，取悦，话术，说服，心理学，任意两项其他个人或时代特长。"
  },
  {
    "id": "194",
    "name": "网络明星",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 70,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "聆听",
      "心理学",
      "计算机使用",
      "电气维修"
    ],
    "skillText": "技艺（表演，歌唱，喜剧），乔装，两项社交技能（取悦、话术、恐吓、说服），聆听，心理学，计算机，电气维修。"
  },
  {
    "id": "195",
    "name": "经纪人",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "汽车驾驶",
      "潜行",
      "聆听",
      "法律"
    ],
    "skillText": "汽车驾驶、两项社交技能（取悦、话术、恐吓、说服），潜行，聆听，法律，任意两项其他个人或时代特长。"
  },
  {
    "id": "196",
    "name": "捉鬼人",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "神秘学",
      "科学",
      "机械维修",
      "技艺",
      "电气维修"
    ],
    "skillText": "神秘学，科学（物理，化学，生物），机械维修，艺术（摄影），电气维修，一项社交技能（取悦、话术、恐吓、说服）。"
  },
  {
    "id": "197",
    "name": "占卜师、灵媒师",
    "pointFormula": "EDU_X2_PLUS_MAX_EDU_X2_APP_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "历史",
      "图书馆使用",
      "神秘学",
      "心理学"
    ],
    "skillText": "艺术（表演），历史，图书馆，两项社交技能（取悦、话术、恐吓、说服），神秘学，心理学，任意一项其他个人或时代特长。"
  },
  {
    "id": "198",
    "name": "机械师",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 40,
    "occupationalSkills": [
      "技艺",
      "攀爬",
      "汽车驾驶",
      "电气维修",
      "机械维修",
      "操作重型机械"
    ],
    "skillText": "技艺（木工、焊接、管道工等），攀爬，汽车驾驶，电气维修，机械维修，操作重型机械，任意两项其他个人或时代或技术特长。"
  },
  {
    "id": "199",
    "name": "厨师",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "科学",
      "格斗",
      "博物学",
      "侦查",
      "外语"
    ],
    "skillText": "手艺（烹饪），科学（生物，化学），格斗（斗殴），博物学，侦察，外语，任意一项其他个人或时代特长。"
  },
  {
    "id": "200",
    "name": "网络犯罪者",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 70,
    "occupationalSkills": [
      "计算机使用",
      "电气维修",
      "电子学",
      "图书馆使用",
      "侦查"
    ],
    "skillText": "计算机，电气维修，电子学，图书馆，侦察，一项社交技能（取悦、话术、恐吓、说服），任意两项其他技能。"
  },
  {
    "id": "201",
    "name": "佣兵",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "闪避",
      "格斗",
      "射击",
      "潜行",
      "生存"
    ],
    "skillText": "攀爬或游泳，闪避，格斗，射击，潜行，生存，下面任选两项：急救、机械维修、外语。"
  },
  {
    "id": "202",
    "name": "自宅警备员",
    "pointFormula": "EDU_X4",
    "creditMin": 1,
    "creditMax": 10,
    "occupationalSkills": [
      "计算机使用",
      "聆听",
      "潜行",
      "图书馆使用",
      "母语"
    ],
    "skillText": "计算机，聆听，潜行，图书馆，母语，任意三项符合尼特族形象的特长。"
  },
  {
    "id": "203",
    "name": "壮汉保镖",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "格斗",
      "射击",
      "急救",
      "法律",
      "心理学",
      "侦查"
    ],
    "skillText": "格斗（斗殴），射击，急救，一项社交技能（取悦、话术、恐吓、说服），法律，心理学，侦察和下面的一种个人特长：汽车驾驶或骑术。"
  },
  {
    "id": "204",
    "name": "游戏测试员",
    "pointFormula": "EDU_X4",
    "creditMin": 9,
    "creditMax": 20,
    "occupationalSkills": [
      "技艺",
      "计算机使用",
      "电气维修",
      "电子学",
      "聆听"
    ],
    "skillText": "手艺（游戏），计算机，电气维修，电子学，聆听，一项社交技能（取悦、话术、恐吓、说服），任意两项其他个人或时代特长。"
  },
  {
    "id": "205",
    "name": "交际花",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "技艺",
      "估价",
      "潜行",
      "急救",
      "外语",
      "心理学",
      "骑术"
    ],
    "skillText": "艺术（任意），估价，潜行，一项社交技能（取悦、话术、恐吓、说服），急救，其他语言（欧洲），心理学，骑术，（乔装、钳工）中的一种，任意一项其他个人或时代特长"
  },
  {
    "id": "206",
    "name": "考古学家",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 60,
    "occupationalSkills": [
      "会计",
      "技艺",
      "估价",
      "历史",
      "图书馆使用",
      "外语",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，艺术（任意），估价，历史，图书馆，其他语言（欧洲），一项社交技能（取悦、话术、恐吓、说服），心理学，侦查，任意两项其他个人或时代特长"
  },
  {
    "id": "207",
    "name": "贵族",
    "pointFormula": "EDU_X2_PLUS_MAX_EDU_X2_APP_X2",
    "creditMin": 70,
    "creditMax": 99,
    "occupationalSkills": [
      "外语",
      "法律",
      "骑术",
      "射击"
    ],
    "skillText": "拉丁语，法律，其他语言（欧洲），一项社交技能（取悦、话术、恐吓、说服），骑术，射击（霰弹枪），任意三项其他个人或时代特长"
  },
  {
    "id": "208",
    "name": "艺术家",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_POW_X2",
    "creditMin": 10,
    "creditMax": 40,
    "occupationalSkills": [
      "技艺",
      "估价",
      "历史",
      "图书馆使用",
      "外语",
      "侦查"
    ],
    "skillText": "艺术及手艺（任意多种），估价，历史，图书馆，其他语言（欧洲），侦查，任意两项其他个人或时代特长"
  },
  {
    "id": "209",
    "name": "作家",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 40,
    "occupationalSkills": [
      "技艺",
      "历史",
      "图书馆使用",
      "外语",
      "母语",
      "心理学"
    ],
    "skillText": "艺术（写作），历史，图书馆，其他语言（欧洲），母语，一项社交技能（取悦、话术、恐吓、说服），心理学，任意两项其他个人或时代特长"
  },
  {
    "id": "210",
    "name": "马车夫",
    "pointFormula": "EDU_X2_PLUS_DEX_X2",
    "creditMin": 3,
    "creditMax": 10,
    "occupationalSkills": [
      "闪避",
      "驾驶",
      "跳跃",
      "聆听",
      "机械维修",
      "博物学",
      "导航",
      "侦查",
      "格斗"
    ],
    "skillText": "闪避，马车驾驶，跳跃，聆听，机械维修，博物学，导航，一项社交技能（取悦、话术、恐吓、说服），侦查，格斗（鞭），任意一项其他个人或时代特长"
  },
  {
    "id": "211",
    "name": "牧师",
    "pointFormula": "EDU_X2_PLUS_MAX_APP_X2_POW_X2",
    "creditMin": 20,
    "creditMax": 65,
    "occupationalSkills": [
      "历史",
      "外语",
      "图书馆使用",
      "心理学"
    ],
    "skillText": "历史，拉丁语，图书馆，一项社交技能（取悦、话术、恐吓、说服），心理学，任意两项其他个人或时代特长"
  },
  {
    "id": "212",
    "name": "咨询侦探",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 60,
    "occupationalSkills": [
      "人类学",
      "估价",
      "科学",
      "急救",
      "历史",
      "法律",
      "图书馆使用",
      "聆听",
      "心理学",
      "外语",
      "侦查",
      "追踪"
    ],
    "skillText": "人类学，估价，科学（化学），急救，历史，法律，图书馆，聆听，心理学，其他语言（任意），侦查，追踪，任意两项其他个人或时代特长"
  },
  {
    "id": "213",
    "name": "工匠",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 35,
    "occupationalSkills": [
      "会计",
      "估价",
      "技艺",
      "机械维修",
      "侦查"
    ],
    "skillText": "会计，估价，手艺（任意多种），机械维修，一项社交技能（取悦、话术、恐吓、说服），侦查，任意一项其他个人或时代特长"
  },
  {
    "id": "214",
    "name": "罪犯",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "估价",
      "乔装",
      "潜行",
      "锁匠",
      "格斗"
    ],
    "skillText": "估价，乔装，一项社交技能（取悦、话术、恐吓、说服），潜行，锁匠，格斗（任意两项），任意一项其他个人或时代特长"
  },
  {
    "id": "215",
    "name": "业余艺术爱好者",
    "pointFormula": "EDU_X2_PLUS_APP_X2",
    "creditMin": 10,
    "creditMax": 70,
    "occupationalSkills": [],
    "skillText": "任意六项个人或时代特长"
  },
  {
    "id": "216",
    "name": "艺人",
    "pointFormula": "EDU_X2_PLUS_MAX_APP_X2_POW_X2",
    "creditMin": 10,
    "creditMax": 40,
    "occupationalSkills": [
      "技艺",
      "乔装",
      "闪避",
      "聆听",
      "母语",
      "心理学"
    ],
    "skillText": "艺术（任意多种），乔装，闪避，两项社交技能（取悦、话术、恐吓、说服），聆听，母语，心理学，任意三项其他个人或时代特长"
  },
  {
    "id": "217",
    "name": "退役军官",
    "pointFormula": "EDU_X4",
    "creditMin": 40,
    "creditMax": 75,
    "occupationalSkills": [
      "潜行",
      "急救",
      "射击",
      "导航",
      "外语",
      "心理学",
      "骑术",
      "格斗",
      "侦查"
    ],
    "skillText": "潜行，急救，射击（手枪、来复枪）,导航，其他语言（任意）,一项社交技能（取悦、话术、恐吓、说服）,心理学，骑术,格斗（剑），侦查，（攀爬、游泳）中的一种"
  },
  {
    "id": "218",
    "name": "探险家",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2",
    "creditMin": 45,
    "creditMax": 70,
    "occupationalSkills": [
      "人类学",
      "考古学",
      "估价",
      "科学",
      "攀爬",
      "急救",
      "射击",
      "格斗",
      "博物学",
      "导航",
      "外语",
      "驾驶",
      "骑术",
      "潜行",
      "侦查",
      "游泳",
      "追踪"
    ],
    "skillText": "人类学，考古学，估价，科学（生物学），攀爬，急救，射击（手枪、来复枪），格斗（斗殴），博物学，导航，其他语言（任意），驾驶（小艇，船，热气球），骑术，潜行，侦查，游泳，追踪"
  },
  {
    "id": "219",
    "name": "私家侦探",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 9,
    "creditMax": 40,
    "occupationalSkills": [
      "会计",
      "法律",
      "图书馆使用",
      "聆听",
      "锁匠",
      "技艺",
      "侦查"
    ],
    "skillText": "会计，两项社交技能（取悦、话术、恐吓、说服），法律，图书馆，聆听，锁匠，艺术及手艺（摄影），侦查，任意一项其他个人或时代特长"
  },
  {
    "id": "220",
    "name": "记者",
    "pointFormula": "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "估价",
      "闪避",
      "图书馆使用",
      "聆听",
      "外语",
      "母语",
      "技艺",
      "心理学",
      "侦查"
    ],
    "skillText": "估价，闪避，两项社交技能（取悦、话术、恐吓、说服），图书馆，聆听，其他语言（欧洲），母语，艺术及手艺（摄影），心理学，侦查。"
  },
  {
    "id": "221",
    "name": "劳工",
    "pointFormula": "EDU_X2_PLUS_STR_X2",
    "creditMin": 0,
    "creditMax": 10,
    "occupationalSkills": [
      "估价",
      "闪避",
      "急救",
      "机械维修",
      "操作重型机械"
    ],
    "skillText": "估价，一项社交技能（取悦、话术、恐吓、说服），闪避，急救，机械维修，重型机械操作，任意一项其他个人或时代特长，以及从以下任选两种：（攀爬，斗殴，手艺（任意），马车驾驶，驾驶：船）"
  },
  {
    "id": "222",
    "name": "律师",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 80,
    "occupationalSkills": [
      "会计",
      "估价",
      "历史",
      "外语",
      "法律",
      "图书馆使用",
      "聆听",
      "心理学"
    ],
    "skillText": "会计，估价，两项社交技能（取悦、话术、恐吓、说服），历史，拉丁语，法律，图书馆，聆听，心理学，任意两项其他个人或时代特长"
  },
  {
    "id": "223",
    "name": "医生",
    "pointFormula": "EDU_X4",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "科学",
      "急救",
      "外语",
      "图书馆使用",
      "医学",
      "心理学"
    ],
    "skillText": "科学（生物学、药剂学），急救，拉丁语，图书馆，医学，心理学，任意两项其他个人或时代特长"
  },
  {
    "id": "224",
    "name": "警察",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "格斗",
      "闪避",
      "急救",
      "射击",
      "法律",
      "聆听",
      "心理学",
      "潜行",
      "侦查"
    ],
    "skillText": "格斗（斗殴），闪避，一项社交技能（取悦、话术、恐吓、说服），急救，射击（手枪），法律，聆听，心理学，潜行，侦查"
  },
  {
    "id": "225",
    "name": "教授/学者",
    "pointFormula": "EDU_X4",
    "creditMin": 20,
    "creditMax": 50,
    "occupationalSkills": [
      "图书馆使用",
      "外语",
      "心理学"
    ],
    "skillText": "图书馆，其他语言（欧洲），一项社交技能（取悦、话术、恐吓、说服），心理学，至多六种额外的学识技巧作为个人专长"
  },
  {
    "id": "226",
    "name": "科学家",
    "pointFormula": "EDU_X4",
    "creditMin": 10,
    "creditMax": 60,
    "occupationalSkills": [
      "技艺",
      "历史",
      "图书馆使用",
      "机械维修",
      "侦查"
    ],
    "skillText": "手艺（任意），历史，图书馆，机械维修，一项社交技能（取悦、话术、恐吓、说服），侦查，至多六种其他学识技巧作为个人专长"
  },
  {
    "id": "227",
    "name": "佣人",
    "pointFormula": "EDU_X2_PLUS_MAX_APP_X2_DEX_X2",
    "creditMin": 0,
    "creditMax": 10,
    "occupationalSkills": [
      "技艺",
      "闪避",
      "聆听",
      "潜行"
    ],
    "skillText": "手艺（任意），闪避，聆听，潜行，任意一项其他个人或时代特长，以及从以下中最多选取三个：（会计，估价，马车驾驶，礼仪，急救，其他语言（欧洲），说服）"
  },
  {
    "id": "228",
    "name": "店主",
    "pointFormula": "EDU_X2_PLUS_MAX_APP_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "会计",
      "估价",
      "技艺",
      "聆听",
      "心理学",
      "侦查"
    ],
    "skillText": "会计，估价，手艺（任意），聆听，一项社交技能（取悦、话术、恐吓、说服），心理学，侦查，任意一项其他个人或时代特长"
  },
  {
    "id": "229",
    "name": "士兵",
    "pointFormula": "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
    "creditMin": 9,
    "creditMax": 30,
    "occupationalSkills": [
      "闪避",
      "急救",
      "潜行",
      "聆听",
      "机械维修",
      "射击",
      "侦查"
    ],
    "skillText": "闪避，急救，潜行，聆听，机械维修，射击（来复枪），潜行，侦查，任意两项其他个人或时代特长"
  },
  {
    "id": "230",
    "name": "密探",
    "pointFormula": "EDU_X2_PLUS_MAX_APP_X2_DEX_X2",
    "creditMin": 30,
    "creditMax": 70,
    "occupationalSkills": [
      "乔装",
      "潜行",
      "历史",
      "图书馆使用",
      "聆听",
      "锁匠",
      "导航",
      "外语",
      "心理学",
      "侦查",
      "格斗"
    ],
    "skillText": "乔装，一项社交技能（取悦、话术、恐吓、说服），潜行，历史，图书馆，聆听，锁匠，导航，其他语言（欧洲），心理学，侦查，格斗（任意）"
  }
]);
