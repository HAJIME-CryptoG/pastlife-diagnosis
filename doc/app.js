const WORKER_URL = window.WORKER_URL || "https://your-worker.example.workers.dev";

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

let currentIndex = 0;
const answers = Array(QUESTIONS.length).fill(null);

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
    if (answers[currentIndex] === index) {
      button.classList.add("selected");
    }
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

  const payload = {
    birth_date: birthDateInput.value,
    birth_time: birthTimeInput.value,
    birth_place: birthPlaceInput.value,
    answers: answers.map((answerIndex, questionIndex) => ({
      question: QUESTIONS[questionIndex].text,
      choice: QUESTIONS[questionIndex].options[answerIndex],
    })),
  };

  try {
    const response = await fetch(`${WORKER_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "生成に失敗しました。");
    }

    const data = await response.json();
    renderResult(data);
    const url = new URL(window.location.href);
    url.searchParams.set("id", data.result_id);
    window.history.replaceState({}, "", url.toString());
  } catch (error) {
    errorMessage.textContent =
      "生成に失敗しました。混雑時は数分空けて再試行してください。";
    showPanel("result");
  }
}

function renderList(target, items) {
  target.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function renderResult(data) {
  const result = data.result_json;
  resultIdBadge.textContent = `ID: ${data.result_id}`;
  pastLifeSummary.textContent = `${result.past_life.era}・${result.past_life.region}で${result.past_life.role}として過ごしました。`;
  keyEvent.textContent = result.past_life.key_event;
  renderList(dailyDetails, result.past_life.daily_details);
  renderList(traits, result.carryover_traits);
  renderList(shadow, result.shadow);
  renderList(advice, result.advice);
  catchphrase.textContent = result.catchphrase;

  auraImage.src = data.aura_image;
  auraMood.textContent = `オーラのムード：${result.aura.mood}`;
  auraColors.innerHTML = "";
  result.aura.colors.forEach((color) => {
    const chip = document.createElement("span");
    chip.className = "color-chip";
    chip.textContent = color;
    auraColors.appendChild(chip);
  });

  const shareText = `私の前世は「${result.past_life.role}」だったかも。#前世診断`;
  const shareUrl = window.location.href;
  const shareLink = `https://x.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;
  document.getElementById("shareButton").href = shareLink;

  errorMessage.textContent = "";
  showPanel("result");
}

async function loadResultById(resultId) {
  showPanel("loading");
  try {
    const response = await fetch(`${WORKER_URL}/result?id=${resultId}`);
    if (!response.ok) {
      throw new Error("結果が見つかりませんでした。");
    }
    const data = await response.json();
    renderResult(data);
  } catch (error) {
    errorMessage.textContent =
      "保存された結果を読み込めませんでした。URLを確認してください。";
    showPanel("result");
  }
}

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

const params = new URLSearchParams(window.location.search);
if (params.has("id")) {
  loadResultById(params.get("id"));
} else {
  showPanel("intro");
}
