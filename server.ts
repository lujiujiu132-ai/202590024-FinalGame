import express from 'express';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Ensure local DNS resolution works gracefully
dns.setDefaultResultOrder('ipv4first');

const app = express();
app.use(express.json());

const PORT = 3000;
const SPREADSHEET_ID = '15iGuHT7kncN3hHJIVb_EMDJk8AV7WS4oM4tRnJDG4rA';

// Helper to translate typical Google Drive preview links to raw direct display URLs
function parseDriveLink(link: string | undefined): string {
  if (!link) return '';
  let id = '';
  const matchD = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) {
    id = matchD[1];
  } else {
    const matchId = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId) {
      id = matchId[1];
    }
  }
  if (id) {
    return `https://lh3.googleusercontent.com/d/${id}`;
  }
  return link;
}

// Minimal CSV parser (handles commas and quotes)
function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(cell.trim());
        if (row.length > 1 || row[0] !== '') {
          result.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.length > 1 || row[0] !== '') {
      result.push(row);
    }
  }
  return result;
}

function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const list: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    list.push(obj);
  }
  return list;
}

// Global cached sheet data
let googleSheetCache: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds cache TTL

// Load sheets dynamically (falls back to local JSON on failure or offline)
async function getSheetDataset() {
  const now = Date.now();
  if (googleSheetCache && now - lastCacheTime < CACHE_TTL) {
    return googleSheetCache;
  }

  const sheets = ['bg', 'player', 'Butler', 'Maid', 'Visitor', 'Niece', 'Doctor', 'Item', 'bgStart'];
  const data: Record<string, any> = {};

  for (const sheetName of sheets) {
    let rawObjects: any[] = [];
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const text = await response.text();
        const rows = parseCSV(text);
        rawObjects = csvToObjects(rows);
      } else {
        throw new Error(`HTTP status ${response.status}`);
      }
    } catch (err: any) {
      console.warn(`[Sheet Sync] Failed to live load ${sheetName}, using local fallback.`, err.message);
      try {
        const fallbackPath = path.join(process.cwd(), 'src', 'data', 'fallback', `${sheetName}.json`);
        if (fs.existsSync(fallbackPath)) {
          const content = fs.readFileSync(fallbackPath, 'utf-8');
          rawObjects = JSON.parse(content);
        }
      } catch (fallbackErr: any) {
        console.error(`[Fatal] Fallback loading failed block for ${sheetName}:`, fallbackErr.message);
      }
    }

    // Map links in rawObjects through our direct images translator
    const processed = rawObjects.map((item: any) => {
      const copy = { ...item };
      if (copy.link) {
        copy.resolvedLink = parseDriveLink(copy.link);
      }
      return copy;
    });

    data[sheetName] = processed;
  }

  googleSheetCache = data;
  lastCacheTime = now;
  return data;
}

// 1. Service Sheet Meta API
app.get('/api/sheet-data', async (req, res) => {
  try {
    const dataset = await getSheetDataset();
    res.json({ success: true, data: dataset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Configure Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Stress keyword scanner triggers reactive emotion adjustments
function calculateStressImpact(text: string, lang: string): number {
  const query = text.toLowerCase();
  
  // High pressure keywords related to clues / contradictions
  const stressKeywords = [
    'lies', 'lying', 'diary', 'secret', 'faucet', 'drip', 'water', 'melt', 'solvent', 'cabinet', 'lock', 'debt', 'money', 'ticket', 'ship', 'conspiracy', 'stole', 'stolen', 'thief', 'culprit', 'suspect',
    '거짓말', '거짓', '일기', '일기장', '비밀', '수돗물', '물소리', '용제', '화학', '장식장', '자물쇠', '빚', '채무', '승선표', '티켓', '선표', '도둑', '공범', '음모',
    '说谎', '谎言', '日记', '秘密', '水龙头', '漏水', '流水', '溶剂', '化学', '锁', '债务', '欠债', '钱', '船票', '阴谋', '同谋', '偷', '项链', '夜鸦之眼'
  ];

  let hits = 0;
  for (const keyword of stressKeywords) {
    if (query.includes(keyword)) {
      hits++;
    }
  }

  // Cap initial change at 15-25 points based on depth of accusation keywords
  return hits > 0 ? Math.min(hits * 12, 28) : 0;
}

function generateOfflineSmartResponse(
  npcId: string,
  message: string,
  language: string,
  currentEmotion: number,
  isOutburst: boolean
): string {
  const lang = language || 'KR';
  const query = message.toLowerCase();

  const data: Record<string, { standard: Record<string, string>; outburst: Record<string, string>; keywords: string[] }> = {
    Butler: {
      keywords: [
        'lie', 'lying', 'fake', 'maid', 'clara', 'hallway', '23:15', 'closet', 'cabinet', 'witness', 'alibi', 'contradict',
        '거짓말', '거짓', '메이드', '클라라', '복도', '수납장', '23시 15분', '23:15', '진술', '목격', '알리바이', '모순', '물소리', '수사관',
        '说谎', '女佣', '安娜', '走廊', '钥匙', '柜子', '柜', '目击', '供词', '流水', '漏水'
      ],
      standard: {
        KR: "탐정님, 저는 일평생 정직하게 하우스 도메스틱으로 일해 왔습니다. 23:00 정각부터 침실 방 안에서 계속 곤히 잠들어 있었습니다. 메이드가 무언가 오해를 한 동향입니다.",
        CN: "侦探，我当时确实在房间里睡觉休息。女佣大概是在漆黑的走廊里看错人了，或者是她神经过敏。我从来没有深夜翻箱倒柜的行为。",
        EN: "Detective, I was strictly asleep in my room since 23:00. The maid must have mistaken some other shape in the dark hallway or made up stories."
      },
      outburst: {
        KR: "그녀가 절 보았다고요?! ...아, 아닙니다! 그건... 집안 정화 작업을 위해 복도에 잠시 다녀간 것뿐입니다! 왜 그렇게 범인 취급하며 협박하십니까!",
        CN: "她看见了我……？！不，雷德菲尔德没有撒谎！我只是凑巧巡逻，去钥匙柜看看，对，只是看看！这不能证明我和项链失窃有关！",
        EN: "She witnessed me in the hall?! No... I mean, I merely went out to check the corridor's locks! That is a standard servant routine! Do not corner me!"
      }
    },
    Maid: {
      keywords: [
        'lie', 'lying', 'stole', 'guilty', 'evidence', 'clue', 'butler', 'rudolf', 'water', 'faucet', 'drip',
        '거짓말', '범인', '훔쳤', '집사', '루돌프', '수두', '물소리', '목격', '도둑', '공범',
        '说谎', '偷', '同谋', '管家', '雷德菲尔德', '流水', '水龙头', '目击', '证词'
      ],
      standard: {
        KR: "저는 오직 사실만을 진술하고 있습니다. 23:15분에 복도의 보관함을 몰래 뒤적이던 집사 돌프 님의 당혹스러운 그 시선을 잊을 수 없습니다. 게다가 주방 물소리도 비정상적이었습니다.",
        CN: "我没有撒谎，侦探。那一晚23:15分管家探手进入抽屉的样子真的很不寻常，而且周遭水声掩盖了廊道的急促脚步声，他们一定隐藏着什么大案子。",
        EN: "I only share what I truly saw. At exactly 23:15, Butler Rudolf's behavior of fiddling with the supply closet was highly suspicious, accompanied by that rushing kitchen water."
      },
      outburst: {
        KR: "오해하지 말아주세요! 저는 평범한 고용인일 뿐 훔쳐갈 물건엔 관심도 없습니다! 집사 님과 주방의 사운드 단서들은 정말 확실하게 일어난 진실입니다!",
        CN: "请相信我，我只是个挣微博工资的清洁工，怎么可能会去偷夜鸦之眼？！我提供管家的那些线索句句属实，绝无虚构！",
        EN: "Please believe me! I have no financial interest in that stolen antique. What I saw around 23:15 is the absolute raw truth!"
      }
    },
    Visitor: {
      keywords: [
        'lie', 'lying', 'ticket', 'ship', 'escape', 'crook', 'traitor', 'conspiracy', 'boat', 'flee', 'charlie',
        '거짓말', '티켓', '승선표', '승선권', '선표', '크루즈', '배', '탈출', '찰리', '공모', '음모', '외국',
        '说谎', '船票', '逃跑', '潜逃', '同谋', '串通', '游轮', '卡特', '交易'
      ],
      standard: {
        KR: "무슨 소리이십니까? 저는 저명한 미술 보석 딜러로서 거실 게스트 대기 데스크에 단지 편안하게 기품 머물렀을 뿐입니다. 공모나 침입 따윈 근거 없는 헛된 낭설입니다.",
        CN: "探长，请注意您的措辞。我作为名誉优良的珠宝评估商，受邀留宿。我一直在客休区喝茶安顿。您拿这些不着边际的事来质疑我是失礼的。",
        EN: "Detective, please maintain professional courtesy. I was resting comfortably in the lobby lounge. There is no conspiracy or exit ticket on my end."
      },
      outburst: {
        KR: "제 여객 탈출 승선표를 어디서 입수하신 겁니까?! ...아, 아닙니다! 그것은 그냥 사후 개인 업무를 위한 예매 선일 뿐... 절도가 아니라니깐요! 제가 집사에게 무얼 시켰단 겁니까!",
        CN: "你居然搜出了我两点出境的货船班单？！……该死，那只是次级旅行储备计划而已！管家收了钱帮我开后门通融，但他才是内应，执行的是另有其人！",
        EN: "Where did you retrieve my cruise ticket papers?!... No! That is a pure travel backup for general client meetings! I did not break into the vault, I swear!"
      }
    },
    Niece: {
      keywords: [
        'lie', 'lying', 'diary', 'journal', 'inheritance', 'bedroom', 'bella', 'hated', 'hate', 'stole', 'thief',
        '거짓말', '일기', '일기장', '서랍', '상속', '조카', '복수', '미워', '방', '침실', '훔쳤', '도둑',
        '说谎', '日记', '塞西莉亚', '复仇', '继承', '卧室', '偷', '恨', '遗嘱'
      ],
      standard: {
        KR: "삼촌은 독선적이고 위선적인 인물이에요. 전 가족 유산을 삼촌이 조작하는 것 같아 마음에 상처가 클 뿐입니다. 그렇지만 23:10에는 방 안에서 계속 안정을 취하고 있었습니다.",
        CN: "伯父确实自私冷酷得像个魔鬼。但我当晚头痛厉害，23:10一直在卧室里独自休息，至于那颗吊坠的下落我一概不清楚，真的。",
        EN: "My uncle is a tyrant keeping the family wealth to himself. But I stayed in my bedroom during the incident block. I have nothing to hide."
      },
      outburst: {
        KR: "제 일기를 샅샅이 파헤친 거군요! 맞아요, 전 삼촌을 증오해요! 제 정당한 유산을 가져가려 발버둥친 것도 사실이지만 자물쇠를 녹일 용제 따윈 전 다룰 수 없어요!",
        CN: "你竟然看过了我的日记……！是的，我恨他们！23:12我曾拿着簪子去试过撬锁，可铜锁我打不开！接着我看到医生兜着试剂走进来，我就吓得跑回来了！",
        EN: "You snooped through my hidden journal! Yes, I despise my uncle and wanted my family legacy back! But I only had a pin. I couldn't melt high-grade glass locks!"
      }
    },
    Doctor: {
      keywords: [
        'lie', 'lying', 'melt', 'solvent', 'chemistry', 'debt', 'money', 'bankruptcy', 'harvey', 'cellar', 'liquid', 'reagent',
        '거짓말', '녹아', '용제', '화학', '빚', '부채', '부도', '용액', '시약', '파산', '실험실', '지하', '맥주통', '하비', '주치의',
        '说谎', '溶解', '熔毁', '化学', '溶剂', '债务', '欠钱', '药效', '催缴函', '破产', '地窖', '哈维'
      ],
      standard: {
        KR: "탐정님, 과학 수사를 맹신하지 마시지요. 저와 같은 명문가 주치의가 사채 대출이나 약품 남용 절도를 저지를 리가 있겠습니까? 전 그저 소박한 배상만 대기하고 있었습니다.",
        CN: "探长，我是受过高度教育的生药专家，在这里只负责主人的常规配药。我的实验室账户很正常，地窖里也只是保存一些怕热的活性心脏提取素。",
        EN: "Detective, science can be easily misconstrued. As a high-status private physician, financial rumors are standard corporate gossip. I have zero medical loan debts."
      },
      outburst: {
        KR: "그 빚쟁이 가압류 통고장이 지하에 가득했다는 사실을 찾아내다니요?! ...말도 안 됩니다! 유리 금고를 무너뜨린 강한 화학 용제가 제 소관 지출물일리 없습니다! 누명입니다!",
        CN: "酒库存放的实验室破产单居然被找到了？！不、不可理喻！我虽然确实急需周转资金，但我手头怎么会留存熔毁古董柜锁的高级溶剂环己烷？！这绝对是栽赃！",
        EN: "My medical laboratory's debt notification?! Drat... how did that resurface?! But even so, I didn't supply the solvents to melt that display cage! This is speculative!"
      }
    }
  };

  const npcData = data[npcId];
  if (!npcData) {
    return lang === 'KR' ? "수사관님, 저는 사건과 상관없으며 잘 모르는 일입니다." :
           lang === 'CN' ? "侦探，我对这起案件完全不知情，请不要继续询问。" :
           "Detective, I am not familiar with these circumstances.";
  }

  // Detect query type by keywords matching
  let matched = false;
  for (const kw of npcData.keywords) {
    if (query.includes(kw)) {
      matched = true;
      break;
    }
  }

  // Pick suitable response sets based on outburst and matching states
  const set = isOutburst ? npcData.outburst : npcData.standard;
  let replyText = set[lang] || set['KR'];

  if (matched && !isOutburst) {
    if (lang === 'KR') {
      replyText += " (질문에 찔리는 듯 눈을 피하며 식은땀을 흘립니다. 불안도가 가중되었습니다.)";
    } else if (lang === 'CN') {
      replyText += " （你的提问似乎触碰到了对方的痛处，他开始躲闪你的视线，额头隐约有汗珠。心理压力明显上升。）";
    } else {
      replyText += " (Avoids eye contact and sweats slightly as your specific keyword strikes home. Psychological stress grows.)";
    }
  } else if (!matched) {
    if (lang === 'KR') {
      replyText = isOutburst ?
        `쓸데없는 소리 마세요! 그런 질문은 제 범법을 증명하지 못해요! ${npcId === 'Butler' ? '안뜰' : npcId === 'Niece' ? '상속' : '당직'}과 무관합니다!` :
        `그 부분은 알지 못합니다. 제가 정직한 ${npcId === 'Butler' ? '집사' : npcId === 'Doctor' ? '의사' : npcId === 'Visitor' ? '고객' : '용의자'}라는 사실을 의심하시는 겁니까?`;
    } else if (lang === 'CN') {
      replyText = isOutburst ?
        `别拿这些无聊的事打扰我！你在胡编乱造些什么！完全不对劲！` :
        `关于这个，我并不清楚。难道您对我的诚意有什么不合规矩的揣测吗？`;
    } else {
      replyText = isOutburst ?
        `Nonsense! That question has nothing to do with me! You are fishing in the dark!` :
        `I am not familiar with those details. Are you trying to baselessly implicate my character?`;
    }
  }

  return replyText;
}

// 2. NPC Dynamic AI Dialog API (with dynamic emotion simulation and localized replies)
app.post('/api/chat-npc', async (req, res) => {
  try {
    const { npcId, message, language, currentEmotion, isOutburst, history, suspectProfile, suspectTestimony } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message payload is required' });
    }

    // Evaluate trigger-based stress progression
    const stressAddition = calculateStressImpact(message, language || 'KR');
    const newEmotion = Math.min(100, Math.max(0, (currentEmotion || 0) + stressAddition));
    const newlyTriggeredOutburst = newEmotion >= 75;

    let reply = '';
    let isFallback = false;

    if (!ai) {
      reply = generateOfflineSmartResponse(npcId, message, language, newEmotion, newlyTriggeredOutburst);
      isFallback = true;
    } else {
      try {
        const historyCtx = history && Array.isArray(history)
          ? history.map((chat: any) => `${chat.isAi ? 'NPC' : 'Detective'}: ${chat.text}`).join('\n')
          : '';

        const systemInstruction = `
You are ${npcId}, a key suspect in a high-society burglar conspiracy in a dark rainy night villa mansion in Midnight Suspicion 《午夜疑云·AI探案》.
The player is a detective interrogating you. You must stay strictly in character.

Active Interrogation Language: ${language || 'KR'}. IMPORTANT: YOU MUST ONLY SPEAK AND REPLY IN ${language || 'KR'}. DO NOT EXPOSE ANY ENGLISH OR OTHER LANGUAGES IF PLAYING IN ANOTHER LANGUAGE.
Suspect Bio/Profile: ${JSON.stringify(suspectProfile)}
Your Original Alibi/Testimony statement: ${JSON.stringify(suspectTestimony)}

Current Psychological Stress State: ${newEmotion}/100.
Active Outburst Stage: ${newlyTriggeredOutburst ? 'YES - Panic/Breaking down' : 'NO - Composed'}.

Character Instructions:
- If Outburst is YES, you are highly stressed, angry, defensive, stuttering, or slipping up clues. Your tone is nervous and fragmented.
- If Outburst is NO, you are cold, evasive, trying to uphold your fake alibi, acting polite but manipulative.
- Keep your reply compact and immersive (2 to 4 sentences maximum) to sit perfectly inside a dialogue box. Never quote system terms.
`;

        const userPrompt = `
Conversation History:
${historyCtx}
Detective Question: "${message}"

Write your in-character reply as ${npcId}:
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: newlyTriggeredOutburst ? 1.0 : 0.7,
            maxOutputTokens: 250,
          },
        });

        reply = response.text || '';
      } catch (geminiErr: any) {
        console.warn(`[Gemini API Failed] Falling back to high-fidelity offline simulation for ${npcId}:`, geminiErr.message);
        reply = generateOfflineSmartResponse(npcId, message, language, newEmotion, newlyTriggeredOutburst);
        isFallback = true;
      }
    }

    res.json({
      success: true,
      reply: reply.trim(),
      newEmotion,
      isOutburst: newlyTriggeredOutburst,
      stressAddition,
      isFallback
    });
  } catch (err: any) {
    console.error('Gemini NPC chat error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Configure Vite integration for SPA fallback
async function boot() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for SPA router fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Developer Server] Server running behind proxy at http://localhost:${PORT}`);
  });
}

boot();
