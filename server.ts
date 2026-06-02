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
    if (!ai) {
      // Offline fallback in case of missing Gemini keys
      const fallbackMsgs: any = {
        KR: {
          standard: `수사관님, 저는 오직 결백할 뿐입니다. 저의 주장이나 활동에 대해 엉뚱한 오해를 삼가지 말아 주십시오.`,
          outburst: `그걸 어떻게...! 아닙니다! 전 아무것도 모릅니다! 제발 제 사생활을 침해하지 마세요!`
        },
        CN: {
          standard: `侦探，我已经把知道的都告诉你了，请不要继续用这些无端的问题纠缠我。`,
          outburst: `你怎么可能知道这些……？！不，这不是我做的！你没有任何实证，纯属污蔑！`
        },
        EN: {
          standard: `Detective, I have shared everything I know. Please do not twist my words with unwarranted queries.`,
          outburst: `How on earth...?! No! I know nothing about that! Do not stick your nose into my personal matters!`
        }
      };

      const set = fallbackMsgs[language || 'KR'] || fallbackMsgs.KR;
      reply = newlyTriggeredOutburst ? set.outburst : set.standard;
    } else {
      // Craft an immersive, context-driven AI prompt
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
    }

    res.json({
      success: true,
      reply: reply.trim(),
      newEmotion,
      isOutburst: newlyTriggeredOutburst,
      stressAddition
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
