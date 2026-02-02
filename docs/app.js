// Phase1: Stock-based Past Life Diagnosis (No Worker / No API)
// - Keeps existing UI flow and DOM ids
// - Saves result to localStorage, and uses URL param `id` as a local key
// - Aura image: not used (hidden / cleared)

const panels = {
  intro: document.getElementById("intro"),
  questionnaire: document.getElementById("questionnaire"),
  loading: document.getElementById("loading"),
  result: document.getElementById("result"),
};

const birthDateInput = document.getElementById("birthDate");
const birthTimeInput = document.getElementById("birthTime");
const birthPlaceInput = document.getElementById("birthPlace");

const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("options");
const progressLabel = document.getElementById("progressLabel");
const progressBar = document.getElementById("progressBar");

const resultIdBadge = document.getElementById("resultIdBadge");
const pastLifeSummary = document.getElementById("pastLifeSummary");
const dailyDetails = document.getElementById("dailyDetails");
const keyEvent = document.getElementById("keyEvent");
const traits = document.getElementById("traits");
const shadow = document.getElementById("shadow");
const advice = document.getElementById("advice");
const catchphrase = document.getElementById("catchphrase");
const auraImage = document.getElementById("auraImage");
const auraMood = document.getElementById("auraMood");
const auraColors = document.getElementById("auraColors");
const errorMessage = document.getElementById("errorMessage");
const questionError = document.getElementById("questionError");

// ---------- Questions (existing UI uses this shape) ----------
const QUESTIONS = [
  {
    text: "夕暮れ時、最も惹かれる音は？",
    options: [
      "市場の呼び声と銅貨の音",
      "寺院や教会の鐘の余韻",
      "砂漠を渡る風と鈴の音",
      "港の帆と波が擦れる音",
    ],
  },
  {
    text: "旅の支度で真っ先に持ちたいものは？",
    options: [
      "小さな筆記帳と墨壺",
      "乾燥ハーブと薬包",
      "耐久性のある外套",
      "交易品のサンプル",
    ],
  },
  {
    text: "落ち着く景色は？",
    options: [
      "山麓の段々畑と水路",
      "石造りの街路と噴水",
      "河口に集う船と倉庫",
      "夜の火と星が映る草原",
    ],
  },
  {
    text: "人から頼られる役目は？",
    options: [
      "記録や計算をまとめる",
      "調停や儀礼を整える",
      "道案内や船の段取り",
      "食料や道具の調達",
    ],
  },
  {
    text: "好きな仕事道具は？",
    options: [
      "織物の梭（ひ）や糸",
      "鉄製の小さな刃物",
      "木製の測量具",
      "香料の小瓶と量り",
    ],
  },
  {
    text: "誇りに感じる価値観は？",
    options: [
      "約束を守る信用",
      "祈りや儀式の丁寧さ",
      "遠方の知恵を持ち帰る",
      "共同体を守る勇気",
    ],
  },
  {
    text: "季節の中で好きな瞬間は？",
    options: [
      "初雪の匂いが立つ朝",
      "雨季の湿った街角",
      "乾いた風が吹く黄昏",
      "港に霧がかかる夜明け",
    ],
  },
  {
    text: "誰かに贈るならどんな品？",
    options: [
      "精巧な地図や航路図",
      "染め布と香油",
      "金属細工の護符",
      "乾物や保存食",
    ],
  },
];

// ---------- Axes model (hidden scoring) ----------
const AXES = ["order", "adventure", "care", "mind", "art", "shadow"];

/**
 * Each question option maps to 1-2 axes points.
 * This mapping is tuned to your existing 8 questions & 4 options.
 * You can tweak later without touching UI.
 */
const OPTION_AXES = [
  // Q1: sound
  [
    ["order", "mind"],      // 市場
    ["care", "art"],        // 鐘
    ["adventure", "shadow"],// 砂漠の風
    ["mind", "adventure"],  // 港の波
  ],
  // Q2: travel item
  [
    ["mind", "order"],      // 筆記帳
    ["care", "mind"],       // ハーブ
    ["order", "shadow"],    // 外套（防衛）
    ["adventure", "art"],   // 交易品（好奇心＋審美）
  ],
  // Q3: calming scenery
  [
    ["order", "mind"],      // 段々畑と水路
    ["order", "art"],       // 石造りと噴水
    ["adventure", "mind"],  // 河口の船
    ["adventure", "shadow"] // 草原の火と星
  ],
  // Q4: trusted role
  [
    ["mind", "order"],      // 記録/計算
    ["care", "order"],      // 調停/儀礼
    ["adventure", "mind"],  // 道案内/船
    ["care", "shadow"],     // 調達（背負う）
  ],
  // Q5: tool
  [
    ["art", "order"],       // 織物
    ["shadow", "order"],    // 刃物
    ["mind", "order"],      // 測量具
    ["art", "care"],        // 香料
  ],
  // Q6: pride
  [
    ["order", "mind"],      // 信用
    ["care", "art"],        // 儀式
    ["adventure", "mind"],  // 知恵
    ["care", "shadow"],     // 守る勇気
  ],
  // Q7: season moment
  [
    ["mind", "order"],      // 初雪
    ["care", "art"],        // 雨季の街角
    ["adventure", "shadow"],// 乾いた風
    ["mind", "shadow"],     // 港の霧
  ],
  // Q8: gift
  [
    ["mind", "adventure"],  // 地図
    ["art", "care"],        // 染め布と香油
    ["shadow", "order"],    // 護符
    ["care", "order"],      // 保存食
  ],
];

// ---------- 15 stock archetypes ----------
const ARCHETYPES = [
  {
    id: "navigator_scribe",
    title: "港町の航海記録係",
    past_life: {
      era: "14世紀",
      region: "地中海の港湾都市",
      role: "航海日誌と星の記録を残す者",
      key_event:
        "大嵐の夜、帰港できない船の情報を集め、港全体の判断を支える記録を残した。あなたの一文が、命を守った。",
      daily_details: [
        "夜明け前の港で星と風向きを確かめる",
        "帰港した船員の言葉を整理し、日誌に整える",
        "古い地図の破れを補修し、注記を足す",
      ],
    },
    carryover_traits: ["俯瞰力", "言語化能力", "兆しを読む感覚"],
    shadow: ["考えすぎて動けなくなる", "感情を後回しにしがち"],
    advice: [
      "“最小の一歩”を決めて即実行",
      "直感もメモして、後で検証する",
      "胸が重い日は情報を遮断して休む",
    ],
    catchphrase: "あなたは、流れを読む者。",
    aura: { mood: "静謐で透明", colors: ["藍", "青白"] },
    axes: { order: 3, adventure: 2, care: 2, mind: 5, art: 1, shadow: 2 },
  },
  {
    id: "spice_alchemist",
    title: "香料調合の職人",
    past_life: {
      era: "16世紀",
      region: "交易都市",
      role: "香りで心と空気を整える者",
      key_event:
        "不穏な空気が漂う集いで、香と所作で場を鎮めた。争いは起きず、人々は“なぜか落ち着いた”と語った。",
      daily_details: [
        "香料を砕き、湿度で配合を変える",
        "客の表情から必要な香りを推測する",
        "器具を磨き、誤差を消す",
      ],
    },
    carryover_traits: ["場の空気を読む", "微調整力", "癒しの感性"],
    shadow: ["人に合わせすぎて消耗する", "完璧主義で疲れる"],
    advice: ["回復を最優先する日を作る", "“十分良い”基準を持つ", "呼吸・音・香りで自分を整える"],
    catchphrase: "あなたは、空気を整える者。",
    aura: { mood: "神秘的で温かい", colors: ["紫", "金"] },
    axes: { order: 3, adventure: 1, care: 5, mind: 2, art: 3, shadow: 2 },
  },
  {
    id: "inn_matron",
    title: "街道宿の女将",
    past_life: {
      era: "江戸中期",
      region: "街道沿いの宿場町",
      role: "人と情報が交差する場の守り手",
      key_event:
        "揉め事の火種を“言葉の温度”で消し、旅人と町を守った。あなたの判断で、多くの人が安心して眠れた。",
      daily_details: [
        "湯と火を整え、部屋の気配を整える",
        "客の話から危険を察知し先回りする",
        "帳簿を締め、明日の段取りを決める",
      ],
    },
    carryover_traits: ["現実処理力", "対人の勘", "場づくり"],
    shadow: ["抱え込みやすい", "怒りを溜め込みやすい"],
    advice: ["“任せる”をルール化する", "疲れのサインを早めに認める", "言うべき一言を短く伝える"],
    catchphrase: "あなたは、場を守る者。",
    aura: { mood: "安堵と地に足", colors: ["琥珀", "茶"] },
    axes: { order: 5, adventure: 1, care: 4, mind: 2, art: 1, shadow: 3 },
  },
  {
    id: "herbal_mender",
    title: "薬草の手当て人",
    past_life: {
      era: "中世後期",
      region: "山あいの村",
      role: "痛みの正体を静かにほどく者",
      key_event:
        "疫病の気配が広がる中、最小の介入で村を守った。あなたは恐れに飲まれず、呼吸と手当てで人を戻した。",
      daily_details: [
        "山で薬草を採り、乾燥させる",
        "熱と脈から状態を見立てる",
        "夜に一人で祈り、心を整える",
      ],
    },
    carryover_traits: ["共感力", "回復導線を作る力", "静かな胆力"],
    shadow: ["共感しすぎて重くなる", "自分の願いが後回し"],
    advice: ["境界線を言語化する", "回復ルーティンを持つ", "“自分も癒す”を前提にする"],
    catchphrase: "あなたは、痛みをほどく者。",
    aura: { mood: "鎮静と浄化", colors: ["緑", "白"] },
    axes: { order: 2, adventure: 1, care: 5, mind: 2, art: 2, shadow: 3 },
  },
  {
    id: "caravan_accountant",
    title: "隊商の会計係",
    past_life: {
      era: "12世紀",
      region: "シルクロード周辺",
      role: "混沌の中で数字の秩序を守る者",
      key_event:
        "裏切りの兆しを帳簿の違和感で見抜いた。あなたの“気づき”が隊を救い、損失を最小にした。",
      daily_details: [
        "取引記録を暗号的に残す",
        "水と食料の残量を読み、配分する",
        "揉め事の芽を早期に潰す",
      ],
    },
    carryover_traits: ["リスク管理", "仕組み化", "現実的な判断力"],
    shadow: ["疑い深くなる", "安心のためにコントロールしがち"],
    advice: ["信頼の基準を条件で作る", "最悪想定のあと最小の一歩", "管理より“循環”を意識する"],
    catchphrase: "あなたは、秩序を携える者。",
    aura: { mood: "冷静で緊密", colors: ["紺", "銀"] },
    axes: { order: 5, adventure: 3, care: 1, mind: 4, art: 0, shadow: 3 },
  },
  {
    id: "monastery_gardener",
    title: "修道院の菜園管理者",
    past_life: {
      era: "13世紀",
      region: "修道共同体",
      role: "沈黙の中で生を循環させる者",
      key_event:
        "飢饉の年、保存の知恵で共同体を支えた。あなたは土と季節を読み、明日の命を守った。",
      daily_details: [
        "土を耕し、種の並びを整える",
        "保存食を仕込み、冬に備える",
        "手を動かし心を整える",
      ],
    },
    carryover_traits: ["継続力", "回復の導線づくり", "地に足の精神性"],
    shadow: ["変化を怖がる", "我慢が当たり前になる"],
    advice: ["変化を小さく試す", "休む日を予定化する", "願いを言葉にする"],
    catchphrase: "あなたは、循環を守る者。",
    aura: { mood: "安定と静寂", colors: ["深緑", "土色"] },
    axes: { order: 5, adventure: 0, care: 4, mind: 2, art: 1, shadow: 2 },
  },
  {
    id: "stage_backstage",
    title: "舞台の裏方監督",
    past_life: {
      era: "19世紀",
      region: "都市劇場",
      role: "光が当たる場を成立させる者",
      key_event:
        "本番直前の事故を未然に防いだ。あなたの段取りと観察が、舞台を“奇跡の夜”に変えた。",
      daily_details: [
        "稽古の流れを記録し改善点を潰す",
        "道具と導線を整え事故を防ぐ",
        "全員の顔色を確認し整える",
      ],
    },
    carryover_traits: ["段取り力", "空気を読む力", "責任感"],
    shadow: ["期待に縛られる", "自分の表現を抑える"],
    advice: ["自分の出番を少し作る", "分担して任せる", "喜びを表に出す"],
    catchphrase: "あなたは、場を成立させる者。",
    aura: { mood: "集中と緊張", colors: ["紫", "黒"] },
    axes: { order: 5, adventure: 1, care: 3, mind: 2, art: 3, shadow: 3 },
  },
  {
    id: "iron_apprentice",
    title: "鉄器鍛冶の弟子",
    past_life: {
      era: "戦国末期",
      region: "町工房",
      role: "火と音で精神を鍛える者",
      key_event:
        "折れた刃を作り直し、師の信頼を得た。あなたは失敗の熱さを知り、鍛えることで自分を超えた。",
      daily_details: [
        "火加減を読み鉄の色を覚える",
        "無言の教えを身体で理解する",
        "研ぎの音で心を落ち着ける",
      ],
    },
    carryover_traits: ["根性", "職人気質", "本質を見る目"],
    shadow: ["不器用な怒り", "柔軟性の欠如"],
    advice: ["助けを言葉で求める", "柔らかさ＝弱さの思い込みを外す", "熱くなる前に呼吸を入れる"],
    catchphrase: "あなたは、鍛える者。",
    aura: { mood: "覚悟と熱", colors: ["鉄色", "朱"] },
    axes: { order: 4, adventure: 1, care: 1, mind: 2, art: 1, shadow: 5 },
  },
  {
    id: "diplomatic_messenger",
    title: "王都の伝令（影の外交）",
    past_life: {
      era: "18世紀",
      region: "王都",
      role: "火種を未然に消す者",
      key_event:
        "一通の短い文で戦を回避した。あなたは真意を読み、危機の芽を摘む“沈黙の守護者”だった。",
      daily_details: [
        "短い文で要点だけを伝える",
        "沈黙から真意を読む",
        "危険な噂を別の話題で流す",
      ],
    },
    carryover_traits: ["洞察", "危機管理", "交渉感覚"],
    shadow: ["疑心暗鬼", "休めない脳"],
    advice: ["安心の時間を意図的に作る", "決めつけず確認する", "守る役を手放す日を作る"],
    catchphrase: "あなたは、火種を消す者。",
    aura: { mood: "静電気のように鋭い", colors: ["紺", "紫"] },
    axes: { order: 4, adventure: 2, care: 1, mind: 5, art: 0, shadow: 4 },
  },
  {
    id: "astronomy_recorder",
    title: "天文観測の記録係",
    past_life: {
      era: "17世紀",
      region: "観測所",
      role: "天の秩序を地上に写す者",
      key_event:
        "星の周期を突き止め、災いの誤解を解いた。あなたの記録は恐れを理性に変えた。",
      daily_details: [
        "夜更けに観測し誤差を潰す",
        "記録を読み返し法則を探す",
        "器具を保守し精度を保つ",
      ],
    },
    carryover_traits: ["集中力", "論理", "長期視点"],
    shadow: ["孤立しやすい", "感情が遅れて追いつく"],
    advice: ["人に説明する場を持つ", "感情を後で整理する", "孤独と共有を分ける"],
    catchphrase: "あなたは、秩序を写す者。",
    aura: { mood: "透明で静か", colors: ["青白", "銀"] },
    axes: { order: 3, adventure: 0, care: 1, mind: 5, art: 1, shadow: 3 },
  },
  {
    id: "salt_mountain",
    title: "山岳の塩職人",
    past_life: {
      era: "古い時代",
      region: "山間の集落",
      role: "必需を生み暮らしを支える者",
      key_event:
        "困窮の冬、塩の配分で命を守った。あなたの堅実さが共同体の“明日”をつないだ。",
      daily_details: [
        "火を絶やさず煮詰める",
        "天候で工程を変える",
        "配給の順番を守る",
      ],
    },
    carryover_traits: ["粘り強さ", "生活力", "守備力"],
    shadow: ["我慢が癖になる", "評価されないと拗ねる"],
    advice: ["価値を自分で言語化する", "助けてを練習する", "小さな達成を可視化する"],
    catchphrase: "あなたは、必需をつくる者。",
    aura: { mood: "堅実で静か", colors: ["白", "灰"] },
    axes: { order: 4, adventure: 0, care: 3, mind: 1, art: 0, shadow: 3 },
  },
  {
    id: "nomad_horsekeeper",
    title: "遊牧民の馬係",
    past_life: {
      era: "草原の時代",
      region: "大草原",
      role: "自由と責任を同時に担う者",
      key_event:
        "嵐の兆しを嗅ぎ取り、群れを救った。あなたの直感が“生存”を引き寄せた。",
      daily_details: [
        "馬の足音で異変を察知する",
        "移動の判断を瞬時に下す",
        "夜の火の前で祈り整える",
      ],
    },
    carryover_traits: ["直感", "行動力", "自立心"],
    shadow: ["縛られると爆発する", "飽きやすい"],
    advice: ["自由を設計する（ルール化）", "勢いの前に一呼吸", "飽きる前に次の遊びを仕込む"],
    catchphrase: "あなたは、風に乗る者。",
    aura: { mood: "開放と躍動", colors: ["青", "金"] },
    axes: { order: 1, adventure: 5, care: 1, mind: 2, art: 1, shadow: 3 },
  },
  {
    id: "manuscript_apprentice",
    title: "写本工房の見習い",
    past_life: {
      era: "12世紀",
      region: "学都",
      role: "言葉に魂を宿す者",
      key_event:
        "禁書扱いの文を写し、真実を未来に残した。あなたの“丁寧さ”が時代を超える。",
      daily_details: [
        "インクを調合し紙質を確かめる",
        "誤字を恐れ何度も見直す",
        "余白に小さな装飾を忍ばせる",
      ],
    },
    carryover_traits: ["丁寧さ", "編集力", "美意識"],
    shadow: ["自分に厳しすぎる", "間違いを恐れる"],
    advice: ["70点で出す練習", "評価より完成を優先", "美を日常に少し足す"],
    catchphrase: "あなたは、言葉を整える者。",
    aura: { mood: "静謐で洗練", colors: ["紫", "白"] },
    axes: { order: 4, adventure: 0, care: 1, mind: 4, art: 4, shadow: 2 },
  },
  {
    id: "waterway_engineer",
    title: "水路の修繕師",
    past_life: {
      era: "古代都市国家期",
      region: "大河の都市",
      role: "流れを直し暮らしを救う者",
      key_event:
        "水路の詰まりを解消し、飢えの連鎖を止めた。あなたは“仕組みで救う”才能を持つ。",
      daily_details: [
        "水位を測り破損箇所を探す",
        "人員を割り振り工期を守る",
        "流れを変えずに改善策を考える",
      ],
    },
    carryover_traits: ["問題解決", "構造化", "責任感"],
    shadow: ["全部抱える", "感謝されないと落ち込む"],
    advice: ["成果を見える化して共有", "助けを求める", "感謝を受け取る練習"],
    catchphrase: "あなたは、流れを直す者。",
    aura: { mood: "清流のように強い", colors: ["青緑", "銀"] },
    axes: { order: 5, adventure: 1, care: 2, mind: 4, art: 0, shadow: 2 },
  },
  {
    id: "street_poet",
    title: "街角の語り部（吟遊の詩人）",
    past_life: {
      era: "15世紀",
      region: "市街",
      role: "言葉で人の心を起こす者",
      key_event:
        "絶望した群衆の前で歌い、怒りを涙に変えた。あなたは言葉で“場の運命”を変える。",
      daily_details: [
        "人の集まる場所で即興の物語を紡ぐ",
        "笑いの間合いを身体で覚える",
        "夜に孤独と向き合い言葉を探す",
      ],
    },
    carryover_traits: ["表現力", "共鳴させる力", "心を読む感性"],
    shadow: ["情緒の波が大きい", "自己否定に落ちやすい"],
    advice: ["表現を習慣にして守る", "闇を作品に変える", "まず自分で褒める"],
    catchphrase: "あなたは、言葉で起こす者。",
    aura: { mood: "陶酔と煌めき", colors: ["紫", "金"] },
    axes: { order: 0, adventure: 3, care: 2, mind: 2, art: 5, shadow: 4 },
  },
  {
    id: "temple_bell_keeper",
    title: "寺院の鐘守",
    past_life: {
      era: "不詳",
      region: "寺院",
      role: "音で人の心を戻す者",
      key_event:
        "乱れた村の心を鐘の音で落ち着かせた。あなたの音は“浄化”として記憶される。",
      daily_details: [
        "朝夕に鐘を撞き場を整える",
        "参拝者の気配から言葉を選ぶ",
        "一人の時間に呼吸を深める",
      ],
    },
    carryover_traits: ["場の浄化", "落ち着き", "芯のある優しさ"],
    shadow: ["感情を溜め込みやすい", "本音を隠す"],
    advice: ["本音を言葉にする練習", "音・呼吸でリセット", "自分のための儀式を持つ"],
    catchphrase: "あなたは、音で戻す者。",
    aura: { mood: "浄化と静寂", colors: ["白", "紫"] },
    axes: { order: 3, adventure: 0, care: 4, mind: 3, art: 3, shadow: 2 },
  },
];

// ---------- State ----------
let currentIndex = 0;
const answers = Array(QUESTIONS.length).fill(null);

// ---------- UI helpers ----------
function showPanel(name) {
  Object.values(panels).forEach((panel) => panel.classList.remove("active"));
  panels[name].classList.add("active");
}

function renderQuestion() {
  const question = QUESTIONS[currentIndex];
  questionText.textContent = question.text;
  progressLabel.textContent = `${currentIndex + 1} / ${QUESTIONS.length}`;
  progressBar.style.width = `${((currentIndex + 1) / QUESTIONS.length) * 100}%`;
  questionError.textContent = "";

  optionsContainer.innerHTML = "";
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";
    if (answers[currentIndex] === index) button.classList.add("selected");
    button.textContent = option;
    button.addEventListener("click", () => {
      answers[currentIndex] = index;
      renderQuestion();
    });
    optionsContainer.appendChild(button);
  });
}

function validateBirthDate() {
  if (!birthDateInput.value) {
    questionError.textContent = "生年月日を入力してください。";
    return false;
  }
  questionError.textContent = "";
  return true;
}

function renderList(target, items) {
  target.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function safeText(x) {
  return typeof x === "string" ? x : "";
}

function makeLocalId() {
  // local-only unique-ish id (no crypto needed)
  return "pl_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function scoreFromAnswers() {
  const score = Object.fromEntries(AXES.map((a) => [a, 0]));
  answers.forEach((answerIndex, qIndex) => {
    const axes = OPTION_AXES[qIndex]?.[answerIndex] || [];
    axes.forEach((ax) => {
      if (score[ax] !== undefined) score[ax] += 1;
    });
  });
  return score;
}

function pickArchetype(score) {
  let best = null;
  let bestDist = Infinity;

  for (const a of ARCHETYPES) {
    const dist = AXES.reduce((sum, ax) => sum + Math.abs((score[ax] || 0) - (a.axes?.[ax] || 0)), 0);
    if (dist < bestDist) {
      bestDist = dist;
      best = a;
    }
  }
  return best || ARCHETYPES[0];
}

function buildResultJson(archetype, meta) {
  // shape matches your previous renderResult expectations
  return {
    past_life: {
      era: archetype.past_life.era,
      region: archetype.past_life.region,
      role: archetype.past_life.role,
      key_event: archetype.past_life.key_event,
      daily_details: archetype.past_life.daily_details,
    },
    carryover_traits: archetype.carryover_traits,
    shadow: archetype.shadow,
    advice: archetype.advice,
    catchphrase: archetype.catchphrase,
    aura: archetype.aura,
    meta,
  };
}

function renderResult(data) {
  const result = data.result_json;

  resultIdBadge.textContent = `ID: ${data.result_id}`;
  pastLifeSummary.textContent = `${result.past_life.era}・${result.past_life.region}で${result.past_life.role}として過ごしました。`;
  keyEvent.textContent = safeText(result.past_life.key_event);
  renderList(dailyDetails, result.past_life.daily_details || []);
  renderList(traits, result.carryover_traits || []);
  renderList(shadow, result.shadow || []);
  renderList(advice, result.advice || []);
  catchphrase.textContent = safeText(result.catchphrase);

  // Aura image not used in Phase1
  if (auraImage) {
    auraImage.removeAttribute("src");
    auraImage.style.display = "none";
  }

  auraMood.textContent = `オーラのムード：${safeText(result.aura?.mood)}`;
  auraColors.innerHTML = "";
  (result.aura?.colors || []).forEach((color) => {
    const chip = document.createElement("span");
    chip.className = "color-chip";
    chip.textContent = color;
    auraColors.appendChild(chip);
  });

  const shareText = `私の前世は「${result.past_life.role}」だったかも。#前世診断`;
  const shareUrl = window.location.href;
  const shareLink = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const shareButton = document.getElementById("shareButton");
  if (shareButton) shareButton.href = shareLink;

  errorMessage.textContent = "";
  showPanel("result");
}

// ---------- Local persistence ----------
const STORAGE_PREFIX = "pastlife_result_";

function saveLocalResult(resultId, payload) {
  try {
    localStorage.setItem(STORAGE_PREFIX + resultId, JSON.stringify(payload));
    return true;
  } catch (e) {
    return false;
  }
}

function loadLocalResult(resultId) {
  const raw = localStorage.getItem(STORAGE_PREFIX + resultId);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// ---------- Main: Generate result (stock) ----------
async function generateResult() {
  if (!validateBirthDate()) {
    showPanel("questionnaire");
    return;
  }
  if (answers.some((answer) => answer === null)) {
    questionError.textContent = "すべての質問に回答してください。";
    showPanel("questionnaire");
    return;
  }

  showPanel("loading");

  // Simulate a tiny delay for UX (optional)
  await new Promise((r) => setTimeout(r, 350));

  try {
    const score = scoreFromAnswers();
    const archetype = pickArchetype(score);

    const meta = {
      birth_date: birthDateInput.value,
      birth_time: birthTimeInput.value || "",
      birth_place: birthPlaceInput.value || "",
      score,
      picked: archetype.id,
      version: "phase1-stock-v1",
      generated_at: new Date().toISOString(),
    };

    const result_id = makeLocalId();
    const result_json = buildResultJson(archetype, meta);

    const data = {
      result_id,
      result_json,
      // aura_image: (none in phase1)
      aura_image: "",
    };

    // save locally
    const ok = saveLocalResult(result_id, data);
    if (!ok) {
      // if storage full / blocked, still show result but warn
      errorMessage.textContent = "結果の保存に失敗しました（ブラウザ設定/容量）。この画面は表示できます。";
    }

    // update URL with id
    const url = new URL(window.location.href);
    url.searchParams.set("id", result_id);
    window.history.replaceState({}, "", url.toString());

    renderResult(data);
  } catch (error) {
    errorMessage.textContent = "生成に失敗しました。ページを再読み込みして再試行してください。";
    showPanel("result");
  }
}

async function loadResultById(resultId) {
  showPanel("loading");
  await new Promise((r) => setTimeout(r, 200));

  const data = loadLocalResult(resultId);
  if (!data) {
    errorMessage.textContent = "保存された結果を読み込めませんでした（別端末/削除/シークレットモードの可能性）。";
    showPanel("result");
    return;
  }
  renderResult(data);
}

// ---------- Events ----------
function setupEvents() {
  document.getElementById("startButton").addEventListener("click", () => {
    showPanel("questionnaire");
    renderQuestion();
  });

  document.getElementById("nextButton").addEventListener("click", () => {
    if (answers[currentIndex] === null) {
      questionError.textContent = "回答を選んでください。";
      showPanel("questionnaire");
      return;
    }

    if (currentIndex < QUESTIONS.length - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      generateResult();
    }
  });

  document.getElementById("backButton").addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderQuestion();
    }
  });

  document.getElementById("restartButton").addEventListener("click", () => {
    currentIndex = 0;
    answers.fill(null);
    birthDateInput.value = "";
    birthTimeInput.value = "";
    birthPlaceInput.value = "";
    showPanel("intro");

    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    window.history.replaceState({}, "", url.toString());
  });

  document.getElementById("copyButton").addEventListener("click", async () => {
    const text = [
      pastLifeSummary.textContent,
      "日々の情景：" + Array.from(dailyDetails.children).map((li) => li.textContent).join(" / "),
      "転機：" + keyEvent.textContent,
      "持ち越した資質：" + Array.from(traits.children).map((li) => li.textContent).join(" / "),
      "影の課題：" + Array.from(shadow.children).map((li) => li.textContent).join(" / "),
      "助言：" + Array.from(advice.children).map((li) => li.textContent).join(" / "),
      catchphrase.textContent,
      window.location.href,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      errorMessage.textContent = "コピーしました。";
    } catch (error) {
      errorMessage.textContent = "コピーに失敗しました。";
    }
  });
}

setupEvents();

// ---------- Boot ----------
const params = new URLSearchParams(window.location.search);
if (params.has("id")) {
  loadResultById(params.get("id"));
} else {
  showPanel("intro");
}
