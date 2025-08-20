/* =========================================================
   روبوت عربي يولّد ردوده بنفسه (بدون قوائم ثابتة)
   - Markov Chain (ثنائي/ثلاثي الكلمات) + نية متقدمة + تعلّم محلي
   - كل شيء يعمل داخل المتصفح فقط
   ========================================================= */

// ---------- أدوات مساعدة للغة العربية ----------
const Arabic = {
  // إزالة التشكيل والحروف الزائدة وتوحيد الألف والياء الخ
  normalize(s = "") {
    return s
      .replace(/[\u064B-\u0652]/g, "")                // تشكيل
      .replace(/[ًٌٍَُِّْـ]/g, "")                    // تشكيل إضافي
      .replace(/أ|إ|آ/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[^\u0621-\u063A\u0641-\u064A0-9\s?!،,.]/g, " ") // إزالة رموز غير عربية
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  },

  // تقسيم مبسّط للكلمات
  tokenize(s = "") {
    return this.normalize(s).split(/\s+/).filter(Boolean);
  },

  // نظام نية متقدم
  intentOf(msg) {
    const text = this.normalize(msg);
    if (text.includes("ازاي") || text.includes("كيف")) return "how";
    if (text.includes("ليه") || text.includes("لماذا")) return "why";
    if (text.includes("مين") || text.includes("من")) return "who";
    if (text.includes("ايه") || text.includes("ماذا")) return "what";
    if (text.includes("اسمك")) return "name";
    if (text.includes("قول لي نكته") || text.includes("احكيلي نكته")) return "joke";
    if (text.includes("كويس") || text.includes("بخير") || text.includes("تمام")) return "fine";
    if (/[?!]$/.test(msg.trim())) return "ask";
    return "chit";
  }
};

// ---------- مولّد ماركوف (كلمات) ----------
class Markov {
  constructor(order = 2) {
    this.order = Math.max(1, Math.min(3, order)); // 1..3
    this.map = new Map(); // key => array of next tokens
    this.starters = [];
  }

  trainFromSentences(sentences) {
    for (const s of sentences) this._eatSentence(s);
  }

  _eatSentence(sentence) {
    const toks = Arabic.tokenize(sentence);
    if (toks.length === 0) return;
    this.starters.push(toks.slice(0, this.order));
    for (let i = 0; i <= toks.length - this.order - 1; i++) {
      const key = toks.slice(i, i + this.order).join(" ");
      const next = toks[i + this.order];
      if (!this.map.has(key)) this.map.set(key, []);
      this.map.get(key).push(next);
    }
  }

  generate(maxWords = 18, seed = []) {
    let state = (seed.length >= this.order ? seed.slice(-this.order) : null) ||
                (this.starters[Math.floor(Math.random() * this.starters.length)] || []);
    if (state.length === 0) return "";

    const out = [...state];
    for (let i = 0; i < maxWords - state.length; i++) {
      const key = out.slice(-this.order).join(" ");
      const nexts = this.map.get(key);
      if (!nexts || nexts.length === 0) break;
      const next = nexts[Math.floor(Math.random() * nexts.length)];
      out.push(next);
      if (/[.؟!،]$/.test(next)) break;
    }
    return out.join(" ");
  }
}

// ---------- كوربس مبدئي أضخم (جُمل عربية عامة) ----------
const SEED_CORPUS = [
  // تحية/حال
  "انا بخير الحمد لله واتمنى تكون بخير انت كمان",
  "كل شيء تمام اليوم والحمد لله اخبرني عن يومك",
  "الحال طيب وانا جاهز اسمعك",
  "تمام الحمد لله طمني عليك",
  "يا رب دايماً تكون بخير",
  "أهلا وسهلا بيك، أنا مستعد للمحادثة",

  // دعم معنوي/حزن
  "الزعل بيمر ومع الوقت هتكون افضل خليك قوي",
  "متشيلش هم انا معاك اسمعك للاخر",
  "خسارة النهاردة مش نهاية الدنيا جرب تدي نفسك وقت",
  "لما بنحس بالحزن الكلام بيريح احكيلي اكتر",
  "الحزن شعور طبيعي، حاول تلاقي حاجة تريحك",
  "الحياة مليانة تحديات بس إحنا قدها",
  "الأمل دايماً موجود حتى في أصعب الظروف",
  "مرة واحد صعيدي اشترى موبايل جديد",
  "مرة واحد محشش فتح التلاجة وشاف الجيلي بيرقص",
  "مرة تلميذ غبي سأله أستاذه أين تقع الهند",
  "مرة واحد بخيل حلم إنه بيموت",
  "مرة واحد صعيدي بيحلم إنه بياكل مكرونة",

  // معلومات عامة (للتوليد)
  "القطط حيوانات أليفة وجميلة",
  "السماء زرقاء والغيوم بيضاء",
  "القاهرة هي عاصمة مصر",
  "الرياض عاصمة السعودية",
  "الاسد هو ملك الغابة",
  "القمر يدور حول الأرض",
  "مصر تقع في شمال أفريقيا",
  "النيل هو اطول نهر في العالم",
  "الاسكندرية هي عروس البحر المتوسط",
  "الذكاء الاصطناعي هو فرع من علوم الكمبيوتر",
  "التعلم الآلي هو جزء من الذكاء الاصطناعي",
  "جبل افرست هو اعلى جبل في العالم",
  "الفن هو تعبير عن المشاعر",
  "العلم هو نور يضيء الطريق",
  "العمل الجاد هو طريق النجاح",
  "الصداقة كنز لا يفنى",
  "الحب سر الحياة",
];

// ---------- إدارة الذاكرة المحلية ----------
const MEM_KEY = "ar_bot_memory_corpus_v1";

function loadUserCorpus() {
  try {
    const raw = localStorage.getItem(MEM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(-400) : [];
  } catch { return []; }
}

function saveUserUtterance(utt) {
  const arr = loadUserCorpus();
  arr.push(Arabic.normalize(utt));
  localStorage.setItem(MEM_KEY, JSON.stringify(arr.slice(-500)));
}

function clearMemory() {
  localStorage.removeItem(MEM_KEY);
}

// ---------- بناء النموذج ----------
const markov2 = new Markov(2);
const markov3 = new Markov(3);

function rebuildModels() {
  const userPart = loadUserCorpus();
  const all = [...SEED_CORPUS, ...userPart];
  markov2.trainFromSentences(all);
  markov3.trainFromSentences(all);
}
rebuildModels();

// ---------- توليد ردود “من نفسه” ----------
function composeReply(userMsg) {
  const intent = Arabic.intentOf(userMsg);
  const toks = Arabic.tokenize(userMsg);

  // بذور توليد مختلفة حسب النية
  let seed = [];
  if (intent === "fine") seed = ["انا", "بخير"];
  else if (intent === "sad") seed = ["انا", "حزين"];
  else if (intent === "name") seed = ["اسمي", "روبوت"];
  else if (intent === "who" || intent === "what") seed = [toks[1]];
  else if (intent === "how" || intent === "why") seed = [toks[0]];
  else if (intent === "joke") seed = ["مرة", "واحد"];
  else seed = toks.slice(0, 2);

  // جرّب ماركوف 3 ثم 2
  let gen = markov3.generate(20, seed);
  if (!gen || gen.split(" ").length < 6) gen = markov2.generate(18, seed);

  // تنظيف نهائي
  let text = gen;
  text = text.replace(/\s([.،؟!])/g, "$1");
  if (!/[.؟!]$/.test(text)) text += ".";

  // في حالة الرد القصير جدًا، نزود جملة مساعدة
  if (text.split(" ").length < 6) {
    text += " ممكن تحكيلي بتفصيل اكتر؟";
  }

  return text;
}

// ---------- UI ----------
const chatBox = document.getElementById("chat-box");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const clearBtn = document.getElementById("clear-memory");

function addMessage(text, who = "bot") {
  const wrap = document.createElement("div");
  wrap.className = "message";

  const avatar = document.createElement("div");
  avatar.className = "avatar " + (who === "user" ? "user" : "bot");
  avatar.textContent = who === "user" ? "أنت" : "ذكـ";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function botThink(ms = 450) {
  return new Promise(res => setTimeout(res, ms));
}

// رسالة افتتاحية
addMessage("اهلاً! انا روبوت عربي برد من نفسي وبتعلم من كلامك محلياً. اسألني او احكيلي اي حاجة 😊", "bot");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (!msg) return;

  addMessage(msg, "user");
  input.value = "";
  saveUserUtterance(msg);
  rebuildModels();

  await botThink();
  const reply = composeReply(msg);
  addMessage(reply, "bot");
});

clearBtn.addEventListener("click", () => {
  clearMemory();
  rebuildModels();
  addMessage("تم مسح ذاكرة التعلم المحلي. هنبدأ على نظيف ✨", "bot");
});