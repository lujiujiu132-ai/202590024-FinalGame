/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Language,
  LocationKey,
  GPSheetRow,
  ClueNode,
  EvidenceItem,
  NPC,
  PlayerAvatarState,
  GameState
} from './types';
import { LOCALIZED_STRINGS, INITIAL_CLUES, COMBINATION_RULES, SUSPECTS_DATA } from './data/story';
import { gameAudio } from './utils/audio';
import LogicBoard from './components/LogicBoard';
import ManualModal from './components/ManualModal';
import DialogueBox from './components/DialogueBox';
import {
  Volume2,
  VolumeX,
  Compass,
  AlertTriangle,
  Notebook,
  Grid,
  Search,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  X
} from 'lucide-react';

export default function App() {
  // Global Game Configuration
  const [language, setLanguage] = useState<Language>('KR'); // Default is KR
  const [playerLocation, setPlayerLocation] = useState<LocationKey>('LivingRoom');
  const [playerAvatar, setPlayerAvatar] = useState<PlayerAvatarState>('StandAvatar');
  const [discoveredClues, setDiscoveredClues] = useState<string[]>([]);
  const [evidenceInventory, setEvidenceInventory] = useState<EvidenceItem[]>([]);
  const [necklaceFound, setNecklaceFound] = useState(false);
  const [activeDialogueNpcId, setActiveDialogueNpcId] = useState<string | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<Record<string, { speaker: string; text: string; isAi: boolean }[]>>({});
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [accusationAttempts, setAccusationAttempts] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [endingType, setEndingType] = useState<GameState['endingType']>(null);
  
  // Game screens
  const [gameStarted, setGameStarted] = useState(false);
  const [showHandbook, setShowHandbook] = useState(false);
  const [showAccuseModal, setShowAccuseModal] = useState(false);
  const [accuseSelectedNpcId, setAccuseSelectedNpcId] = useState<string>('Butler');
  const [presentEvidenceSelectionOpen, setPresentEvidenceSelectionOpen] = useState(false);
  const [showLogicBoardModal, setShowLogicBoardModal] = useState(false);
  const [faucetInvestigated, setFaucetInvestigated] = useState(false);
  const [examinedClue, setExaminedClue] = useState<ClueNode | null>(null);

  // Dynamic Google Sheets dataset state
  const [sheetData, setSheetData] = useState<any>(null);
  const [sheetLoading, setSheetLoading] = useState(true);

  // Pin-board Connections state
  const [pinboardConnections, setPinboardConnections] = useState<[string, string][]>([]);
  const [deducedResults, setDeducedResults] = useState<string[]>([]);

  // Sound configuration
  const [isMuted, setIsMuted] = useState(true); // Default muted to comply with browser autoplay terms

  // Translation sets helper
  const t = LOCALIZED_STRINGS[language];

  // Load Google Sheet resource dataset dynamically
  useEffect(() => {
    async function loadSheets() {
      try {
        const res = await fetch('/api/sheet-data');
        const json = await res.json();
        if (json.success && json.data) {
          setSheetData(json.data);
        } else {
          throw new Error('Fallback triggered');
        }
      } catch (err) {
        console.warn('Live Google Sheets offline, falling back directly...');
      } finally {
        setSheetLoading(false);
      }
    }
    loadSheets();
  }, []);

  // Sync mute state with Audio manager
  useEffect(() => {
    gameAudio.setMute(isMuted);
    if (!isMuted && gameStarted) {
      gameAudio.startAmbientRain();
    } else {
      gameAudio.stopAmbientRain();
    }
    return () => {
      gameAudio.stopAmbientRain();
    };
  }, [isMuted, gameStarted]);

  // Handle auto footstep toggle and animation on location transition
  const handleMoveLocation = (target: LocationKey) => {
    if (target === playerLocation) return;
    gameAudio.playFootstep();
    setPlayerAvatar('WalkAvatar');
    
    // Smooth walking delay transition
    setTimeout(() => {
      setPlayerLocation(target);
      // Let dialogue modal be closed initially on transition to prevent sudden interruptions
      setActiveDialogueNpcId(null);
      setPlayerAvatar(necklaceFound ? 'ConfidentAvatar' : 'StandAvatar');
    }, 600);
  };

  // Helper resolving Drive / Spreadsheet background assets
  const getActiveBackground = (): string => {
    if (sheetData && sheetData.bg) {
      const stateMap: Record<LocationKey, string> = {
        LivingRoom: '1',
        Hallway: '2',
        Kitchen: '3',
        Bedroom: '4',
        WineCellar: '5'
      };
      const code = stateMap[playerLocation];
      const match = sheetData.bg.find((row: any) => row.state === code);
      if (match && match.resolvedLink) {
        return match.resolvedLink;
      }
    }
    // Static Fallbacks design
    const fallbackBgs: Record<LocationKey, string> = {
      LivingRoom: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200',
      Hallway: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200',
      Kitchen: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200',
      Bedroom: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=1200',
      WineCellar: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=1200'
    };
    return fallbackBgs[playerLocation];
  };

  const getStartBackground = (): string => {
    if (sheetData && sheetData.bgStart && sheetData.bgStart[0]) {
      return sheetData.bgStart[0].resolvedLink || sheetData.bgStart[0].link;
    }
    return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=1200';
  };

  const getSuspectScenePosition = (npcId: string, index: number, total: number) => {
    if (total === 1) {
      return { left: '70%' };
    } else {
      // 2 suspects in room
      if (index === 0) {
        return { left: '52%' };
      } else {
        return { left: '78%' };
      }
    }
  };

  const startScreenLocalMap = {
    KR: {
      time: "📍 시간: 자정 23:40",
      case: '💎 사건: 저택 내부의 복잡무쌍하게 단단히 잠긴 유리 공예 수납장에서 가치가 환산되지 않는 전설의 황실 루비 펜던트 《야까마귀의 눈》이 흔적 조차 남기지 않고 돌연 도난당했습니다. 경찰 수사는 엉켰습니다.',
      target: '🔎 탐정 임무: 저택 내부에는 서로 비밀을 한웅큼 숨긴 용의자 5명이 대치 중입니다. 저택 내부 구역을 이동하며 숨겨진 검색 단서들을 찾아내고 소장 수첩과 연결 추리 핀보드를 결합해 붉은 실 관계 추리를 완성한 뒤, AI와 자유 상호작용으로 모순을 타격하여 최종 진범을 체포 선언하십시오!'
    },
    CN: {
      time: "📍 案发时间: 午夜 23:40",
      case: '💎 案发详情: 别墅展架内锁闭保密的皇家绝世古董吊坠《夜鸦之眼》在完全密闭的玻璃长廊陈列柜中离奇无声消失。根据物理调查，锁扣并未强力撬开，而有受化学药剂完全熔毁的微观迹象。',
      target: '🔎 调查任务: 现场滞留有5名嫌疑重重、心怀诡计的庄园人员。移动场景点击搜查搜集关键物证，在白板上碰撞逻辑线索拉出红色连接线触发更高能推理结论，利用Gemini AI智能盘问攻破NPC情感堤坝，最终敲下法槌指控真凶归案！'
    },
    EN: {
      time: "📍 TIME: 23:40 Midnight",
      case: '💎 CASE: The priceless antique royal ruby gemstone pendant "Eye of the Night Raven" mysteriously vanished from a sealed, secure showcase cabinet inside the dining corridor layout of the estate.',
      target: '🔎 TARGET: 5 high-profile suspects are locked inside the villa, each holding dark agendas. Move rooms, inspect clue hotspots for key evidence items, connect thoughts with red threads on your logic pin-board to trigger advanced deductions, interrogate live suspections over Gemini AI conversational inputs, and lock down the mastermind!'
    }
  };

  // Helper resolving Player Detective Character assets
  const getPlayerAvatarUrl = (): string => {
    if (sheetData && sheetData.player) {
      let code = '0'; // Stand
      if (playerAvatar === 'WalkAvatar') code = '1';
      else if (playerAvatar === 'ThinkAvatar') code = '0'; // default uses stand
      else if (playerAvatar === 'ConfidentAvatar') code = '1'; // confident uses state 1 or standard

      const match = sheetData.player.find((row: any) => row.state === code);
      if (match && match.resolvedLink) {
        return match.resolvedLink;
      }
    }
    // High-resolution artistic silhouette fallback
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=500';
  };

  // Resolve Suspect visual novel avatars
  const compileSuspectInfo = (npcId: string): NPC => {
    const raw = SUSPECTS_DATA[npcId];
    let liveAvatar = '';
    let liveOutburstAvatar = '';

    const sheetRows = sheetData ? sheetData[npcId] : null;
    if (sheetRows) {
      const standRow = sheetRows.find((r: any) => r.state === '0');
      const angryRow = sheetRows.find((r: any) => r.state === '1');
      if (standRow) liveAvatar = standRow.resolvedLink;
      if (angryRow) liveOutburstAvatar = angryRow.resolvedLink;
    }

    // Default graphics in case Google Drive fails
    const faceFallbacks: Record<string, { std: string; out: string }> = {
      Butler: {
        std: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=500',
        out: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=500'
      },
      Maid: {
        std: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=500',
        out: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=500' // Clara
      },
      Visitor: {
        std: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=500',
        out: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=500'
      },
      Niece: {
        std: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=500',
        out: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=500'
      },
      Doctor: {
        std: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=500',
        out: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=500'
      }
    };

    const fbSet = faceFallbacks[npcId] || faceFallbacks.Butler;

    return {
      ...raw,
      avatar: liveAvatar || fbSet.std,
      outburstAvatar: liveOutburstAvatar || fbSet.out,
      // Overwrite live values from rawNPCStates controller
      isOutburst: (rawNPCStates[npcId]?.isOutburst || false),
      emotion: (rawNPCStates[npcId]?.emotion ?? 35)
    } as NPC;
  };

  // Suspects state engine within controller
  const [rawNPCStates, setRawNPCStates] = useState<Record<string, { emotion: number; isOutburst: boolean }>>({
    Butler: { emotion: 35, isOutburst: false },
    Maid: { emotion: 15, isOutburst: false },
    Visitor: { emotion: 40, isOutburst: false },
    Niece: { emotion: 48, isOutburst: false },
    Doctor: { emotion: 55, isOutburst: false }
  });

  // Scene search hotspot coordinates mapping
  const roomHotspots: Record<LocationKey, { id: string; name: Record<Language, string>; x: string; y: string; clueId: string }[]> = {
    LivingRoom: [
      { id: 'cabinet', name: { KR: '골동품 장식장', CN: '古董玻璃展示区', EN: 'Antique Showcase Cabinet' }, x: '25%', y: '40%', clueId: 'broken_cabinet' },
      { id: 'fireplace', name: { KR: '대형 벽난로', CN: '暖炉灰烬', EN: 'Stone Fireplace' }, x: '75%', y: '50%', clueId: 'visitor_ticket' },
      { id: 'sofa', name: { KR: '벨벳 가죽 소파', CN: '会客红丝绒沙发', EN: 'Velvet Lounge Sofa' }, x: '50%', y: '68%', clueId: 'butler_lie' }
    ],
    Hallway: [
      { id: 'carpet', name: { KR: '안뜰 고급 깔개', CN: '门厅吸水地毯', EN: 'Muddy Hallway Carpet' }, x: '45%', y: '80%', clueId: 'footsteps' },
      { id: 'mural', name: { KR: '고미술 렉시 벽화', CN: '雷斯利油画壁挂', EN: 'Leslie Historical Mural' }, x: '15%', y: '32%', clueId: 'butler_lie' },
      { id: 'clock', name: { KR: '자명 괘종시계', CN: '欧式古典立钟', EN: 'Grandfather Stand Clock' }, x: '82%', y: '38%', clueId: 'dripping_sound' }
    ],
    Kitchen: [
      { id: 'faucet', name: { KR: '수조 물막 수돗가', CN: '放水的水龙头', EN: 'Rushing Kitchen Faucet' }, x: '35%', y: '48%', clueId: 'dripping_sound' },
      { id: 'kniferack', name: { KR: '연구용 칼 거치대', CN: '主厨剔骨刀架', EN: 'Culinary Knife Block' }, x: '18%', y: '55%', clueId: 'footsteps' },
      { id: 'dinetable', name: { KR: '대식 식탁 상판', CN: '拼边餐洗礼桌', EN: 'Pine Dining Table' }, x: '68%', y: '65%', clueId: 'dripping_sound' }
    ],
    Bedroom: [
      { id: 'diary', name: { KR: '자물 서랍장 비밀 일기', CN: '密封的皮质日记本', EN: 'Family Heritage Diary' }, x: '55%', y: '52%', clueId: 'niece_diary' },
      { id: 'drawer', name: { KR: '침대 화장장 서랍', CN: '床头备用抽屉', EN: 'Bedside Night Drawer' }, x: '28%', y: '68%', clueId: 'niece_diary' },
      { id: 'lamp', name: { KR: '유황 오팔 스탠드', CN: '床头复古铜绿台灯', EN: 'Polished Brass Desk Lamp' }, x: '80%', y: '45%', clueId: 'broken_cabinet' }
    ],
    WineCellar: [
      { id: 'barrel', name: { KR: '진수성찬 맥주통', CN: '堆积的空啤酒桶', EN: 'Fermented Beer Barrels' }, x: '20%', y: '62%', clueId: 'doctor_motive' },
      { id: 'winerack', name: { KR: '철제 고유 와인랙', CN: '陈年白兰地酒架', EN: 'Ancient Mahogany Wine Rack' }, x: '72%', y: '42%', clueId: 'doctor_motive' },
      { id: 'hiddendoor', name: { KR: '★ 빗장 지층 틈막 문 ★', CN: '★ 地底下秘锁石门 ★', EN: '★ Sealed Sub-floor Vault ★' }, x: '50%', y: '50%', clueId: 'necklace_hidden' }
    ]
  };

  // Clicking an active hotspot triggers investigation
  const handleInvestigateHotspot = (spot: typeof roomHotspots.LivingRoom[0]) => {
    gameAudio.playPencilWrite();
    
    // Check if finding the actual stolen "Night Raven Eye" necklace item
    if (spot.clueId === 'necklace_hidden') {
      if (necklaceFound) return;
      
      let driveItemImage = '';
      if (sheetData && sheetData.Item && sheetData.Item[0]) {
        driveItemImage = sheetData.Item[0].resolvedLink;
      }

      setNecklaceFound(true);
      setPlayerAvatar('ConfidentAvatar');
      gameAudio.playGavel();

      const newItem: EvidenceItem = {
        id: 'night_raven_eye',
        name: {
          KR: "야까마귀의 눈 (Eye of the Night Raven)",
          CN: "关键物证 ·《夜鸦之眼》古董吊坠",
          EN: "Stolen Eye of the Night Raven Gemstone"
        },
        description: {
          KR: "대저택에서 도난당했던 황실 고미술 루비 펜던트. 눈부신 주홍빛 빛방울이 매혹적인 보석입니다.",
          CN: "失窃的核心古玩宝藏。呈饱满的鸽血红卵状切割，其微观放射纹恰似惊空夜鸦的赤目，是本次案件的起因与终结。",
          EN: "The gorgeous royal antique pendant reported missing. Crimson refraction trails mimic a soaring raven's fiery glare."
        },
        image: driveItemImage || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400',
        acquiredAt: new Date().toLocaleTimeString()
      };

      setEvidenceInventory(prev => [...prev, newItem]);
      
      // Also register footstep and doctor clues as a bonus of thorough celler vault searches
      if (!discoveredClues.includes('doctor_motive')) {
        setDiscoveredClues(prev => [...prev, 'doctor_motive']);
      }
      return;
    }

    // Normal clue findings
    if (!discoveredClues.includes(spot.clueId)) {
      setDiscoveredClues(prev => [...prev, spot.clueId]);
      // Play clean drip sound if active kitchen water leak searched
      if (spot.clueId === 'dripping_sound') {
        gameAudio.playWaterDrip();
      }
    }

    if (spot.id === 'faucet') {
      setFaucetInvestigated(true);
    }

    // Trigger clue details modal
    const cl = INITIAL_CLUES.find(c => c.id === spot.clueId);
    if (cl) {
      setExaminedClue(cl);
    }
  };

  // Add connections to logic threads Board
  const handlePinboardAddConnection = (id1: string, id2: string) => {
    // Add both order arrangements for safety
    if (!pinboardConnections.some(([a, b]) => (a === id1 && b === id2) || (a === id2 && b === id1))) {
      setPinboardConnections(prev => [...prev, [id1, id2]]);
    }
  };

  // Run connect deduce checking
  const handlePinboardRunDeduction = (selectedIds: string[]) => {
    // Find matching combination rule
    const rule = COMBINATION_RULES.find(r => 
      r.clueIds.includes(selectedIds[0]) && r.clueIds.includes(selectedIds[1])
    );

    if (rule && !deducedResults.includes(rule.id)) {
      gameAudio.playGlassShatter();
      setDeducedResults(prev => [...prev, rule.id]);
      
      // Auto unlock deep logical inference clue
      if (!discoveredClues.includes(rule.resultClueId)) {
        setDiscoveredClues(prev => [...prev, rule.resultClueId]);
      }

      // Beautiful customized success popup Alert
      const alertMsg = rule.alertMessage[language] || rule.alertMessage['KR'];
      alert(alertMsg);
    } else {
      // Just normal thread connected sound
      gameAudio.playPencilWrite();
    }
  };

  // Type custom questions to active NPC (Calling full-stack Gemini dialogue API)
  const handleSendCustomAsk = async (text: string) => {
    if (!activeDialogueNpcId || isChatLoading) return;
    setIsChatLoading(true);

    const activeNpc = compileSuspectInfo(activeDialogueNpcId);
    
    // Optimistic fast-record player statement
    const updatedHistory = [
      ...(dialogueHistory[activeDialogueNpcId] || []),
      { speaker: 'Detective', text, isAi: false }
    ];
    setDialogueHistory(prev => ({
      ...prev,
      [activeDialogueNpcId]: updatedHistory
    }));

    try {
      const response = await fetch('/api/chat-npc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId: activeDialogueNpcId,
          message: text,
          language,
          currentEmotion: activeNpc.emotion,
          isOutburst: activeNpc.isOutburst,
          history: updatedHistory.slice(-4), // trim context window for token economy,
          suspectProfile: activeNpc.profile,
          suspectTestimony: activeNpc.testimony
        })
      });

      const json = await response.json();
      if (json.success) {
        // Apply reactive updates in state
        setRawNPCStates(prev => ({
          ...prev,
          [activeDialogueNpcId]: {
            emotion: json.newEmotion,
            isOutburst: json.isOutburst
          }
        }));

        setDialogueHistory(prev => ({
          ...prev,
          [activeDialogueNpcId]: [
            ...(prev[activeDialogueNpcId] || []),
            { speaker: activeNpc.name[language], text: json.reply, isAi: true }
          ]
        }));

        if (json.isOutburst) {
          gameAudio.playHeartbeat();
        }
      }
    } catch (err) {
      console.error('Interrogation request issue: ', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Cross-examination and evidence presentation panel matching
  const handleSelectEvidenceForNPC = (clueId: string) => {
    setPresentEvidenceSelectionOpen(false);
    if (!activeDialogueNpcId) return;

    const activeNpc = compileSuspectInfo(activeDialogueNpcId);
    
    // Check if the presented catalog matches their core falsehood lock
    if (activeNpc.contradictionClueId === clueId) {
      gameAudio.playGavel();
      
      // Explode NPC into Outburst state immediately
      setRawNPCStates(prev => ({
        ...prev,
        [activeDialogueNpcId]: {
          emotion: 100,
          isOutburst: true
        }
      }));

      // Add high-impact breakthrough transcript to logs
      const successText = activeNpc.gavelSuccessText[language] || activeNpc.gavelSuccessText['KR'];
      setDialogueHistory(prev => ({
        ...prev,
        [activeDialogueNpcId]: [
          ...(prev[activeDialogueNpcId] || []),
          { speaker: 'SYSTEM', text: `[ ${t.gavelObjection} ]`, isAi: true },
          { speaker: activeNpc.name[language], text: successText, isAi: true }
        ]
      }));

      alert(successText);
    } else {
      // Failed objection mismatch - raises stress lightly but doesn't break alibi
      gameAudio.playPencilWrite();
      setRawNPCStates(prev => {
        const old = prev[activeDialogueNpcId] || { emotion: 30, isOutburst: false };
        return {
          ...prev,
          [activeDialogueNpcId]: {
            ...old,
            emotion: Math.min(100, old.emotion + 12)
          }
        };
      });

      const mismatchResponses: Record<Language, string> = {
        KR: "“흠, 그것이 저와슨 무슨 관련이 있다는 겁니까? 무고한 사람을 성급하게 물어뜯지 마십시오 탐정님.”",
        CN: "“……侦探，您拿出的这件证物莫名其妙。它与我所坚称的时间段毫无矛盾，请不要无理取闹。”",
        EN: "“...And what does that have to do with me, Detective? Do not throw random items on trial without real connections.”"
      };

      setDialogueHistory(prev => ({
        ...prev,
        [activeDialogueNpcId]: [
          ...(prev[activeDialogueNpcId] || []),
          { speaker: activeNpc.name[language], text: mismatchResponses[language], isAi: true }
        ]
      }));
    }
  };

  // Accuse Suspect Trial Verdict handler
  const handleConfirmAccusation = () => {
    setShowAccuseModal(false);
    gameAudio.playGavel();

    const perfectCulprit = 'Doctor';
    const hasMeltingClue = discoveredClues.includes('chemical_theft');

    if (accuseSelectedNpcId === perfectCulprit) {
      if (necklaceFound && hasMeltingClue) {
        setEndingType('hidden'); // Perfect family conspiracy mastermind outcome
      } else if (necklaceFound) {
        setEndingType('perfect'); // Captured, but missing full evidence backstory
      } else {
        setEndingType('ordinary'); // Caught, but jewel remaining unfound
      }
    } else if (accuseSelectedNpcId === 'Butler' || accuseSelectedNpcId === 'Visitor') {
      const accompliceInferences = deducedResults.includes('rule_partners');
      if (accompliceInferences) {
        setEndingType('ordinary'); // Solved the accomplice branch halfway
      } else {
        setEndingType('misjudgment'); // Misfire on accomplice without proof
      }
    } else {
      setEndingType('misjudgment'); // Accusing harmless Clara or Niece
    }

    setIsGameOver(true);
  };

  // System restart button reset
  const handleResetGame = () => {
    gameAudio.playPencilWrite();
    setPlayerLocation('LivingRoom');
    setPlayerAvatar('StandAvatar');
    setDiscoveredClues([]);
    setEvidenceInventory([]);
    setNecklaceFound(false);
    setActiveDialogueNpcId(null);
    setDialogueHistory({});
    setAccusationAttempts(3);
    setIsGameOver(false);
    setEndingType(null);
    setPinboardConnections([]);
    setDeducedResults([]);
    setShowLogicBoardModal(false);
    setFaucetInvestigated(false);
    setExaminedClue(null);
    setRawNPCStates({
      Butler: { emotion: 35, isOutburst: false },
      Maid: { emotion: 15, isOutburst: false },
      Visitor: { emotion: 40, isOutburst: false },
      Niece: { emotion: 48, isOutburst: false },
      Doctor: { emotion: 55, isOutburst: false }
    });
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-gray-200 font-sans flex flex-col relative overflow-x-hidden antialiased select-none selection:bg-red-950/50 selection:text-red-400">
      
      {/* Heavy rain atmosphere canvas effect banner */}
      {gameStarted && !isMuted && (
        <div className="pointer-events-none absolute inset-0 bg-[#08090d]/5 overflow-hidden z-25">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:100%_400px] animate-[slide_3s_linear_infinite]" />
        </div>
      )}

      {/* Header Panel */}
      <header className="bg-[#0c0d12]/90 border-b border-zinc-900 sticky top-0 z-40 px-4 md:px-6 py-3 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span className="text-red-600 bg-red-950/40 border border-red-900/60 px-2 py-1.5 text-xs font-mono font-black tracking-widest rounded-lg animate-pulse uppercase leading-none">
            AI CASE
          </span>
          <div>
            <h1 className="text-sm font-bold text-gray-200 tracking-tight leading-none uppercase">
              {t.title}
            </h1>
            <p className="text-[10px] text-zinc-550 font-mono tracking-widest mt-0.5 uppercase hidden sm:inline">
              {t.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Indicator */}
          <button
            id="btn-sound-toggle"
            onClick={() => setIsMuted(prev => !prev)}
            className={`p-2 rounded-lg border transition cursor-pointer active:scale-95 ${
              isMuted
                ? 'border-zinc-800 hover:border-zinc-750 text-zinc-500 bg-zinc-950'
                : 'border-[#fb7185]/30 hover:border-[#fb7185]/55 text-[#f43f5e] bg-rose-950/20'
            }`}
            title="Rain Ambient Audio Control"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Multi-language local toggle */}
          <div className="flex items-center border border-zinc-800 bg-[#07080b] rounded-lg overflow-hidden text-xs">
            {(['KR', 'CN', 'EN'] as Language[]).map(lang => (
              <button
                key={lang}
                id={`lang-select-${lang}`}
                onClick={() => {
                  gameAudio.playPencilWrite();
                  setLanguage(lang);
                }}
                className={`px-3 py-1.5 text-[11px] font-bold transition font-mono ${
                  language === lang
                    ? 'bg-red-650 text-white shadow-inner font-extrabold'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {lang === 'KR' ? '한국어' : lang === 'CN' ? '中文' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 2. GAME MAIN SCREENS NAVIGATION CONFIG */}
      {!gameStarted ? (
        // Title Entrance view Card
        <main className="flex-1 flex items-center justify-center p-4 relative py-20 min-h-[85vh]">
          <div className="absolute inset-0 bg-cover bg-center opacity-35 grayscale-[12%] brightness-[35%] transition-all duration-700" style={{ backgroundImage: `url('${getStartBackground()}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-[#07080b]/90 pointer-events-none" />
          <div className="w-full max-w-lg bg-[#0e1017]/95 border-2 border-zinc-800 p-6 md:p-8 rounded-3xl shadow-2xl shadow-black/80 relative text-center z-10 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-red-500 text-3xl font-black font-mono tracking-widest mx-auto mb-5 leading-none shadow-inner animate-[pulse_2.5s_infinite]">
              ?
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-gray-100 uppercase tracking-wider mb-2 leading-tight">
              {t.title}
            </h1>
            <p className="text-pink-600 font-mono text-xs tracking-wider uppercase mb-5 font-bold">
              {t.subtitle}
            </p>
            <div className="py-4 border-y border-zinc-805 text-zinc-400 text-left text-xs space-y-3 font-sans mb-6">
              <p className="leading-relaxed"><strong className="text-gray-200">{startScreenLocalMap[language].time}</strong></p>
              <p className="leading-relaxed">{startScreenLocalMap[language].case}</p>
              <p className="leading-relaxed text-zinc-350">{startScreenLocalMap[language].target}</p>
            </div>
            
            <button
              id="btn-play-game"
              onClick={() => {
                gameAudio.playFootstep();
                setGameStarted(true);
                setIsMuted(false); // Unmute on active developer click trigger
              }}
              className="w-full py-3.5 bg-gradient-to-r from-red-650 to-red-505 hover:from-red-600 hover:to-red-500 text-white font-serif font-bold text-sm tracking-widest uppercase rounded-2xl transition shadow-xl shadow-red-950/40 active:scale-98 cursor-pointer"
            >
              {t.startBtn}
            </button>
          </div>
        </main>
      ) : isGameOver ? (
        // Results Conclusion Ending page Screen
        <main className="flex-1 flex items-center justify-center p-4 py-16 text-left">
          <div className="w-full max-w-2xl bg-[#090b10] border-2 border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 flex flex-col gap-6">
            <span className="text-gold-400 font-mono font-black border border-amber-900/40 bg-amber-950/20 px-3 py-1.5 align-self-start text-[10px] tracking-widest rounded-lg uppercase inline-block text-amber-500">
              CASE ARCHIVED
            </span>

            {endingType === 'hidden' ? (
              <div id="ending-hidden" className="space-y-4">
                <h2 className="text-2xl font-serif font-black text-amber-500 uppercase tracking-wider">
                  🎉 {language === 'KR' ? '진정한 숨겨진 진실 폭로' : language === 'CN' ? '终焉真相：百年家族遗产的救赎' : 'Uncovered The Ultimate Lost Truth'}
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {language === 'KR'
                    ? '당신은 마침내 단순 도난극을 넘은 가문 피라미드의 역사적 원한을 폭로했습니다! 소지하고 있던 《야까마귀의 눈》을 통해 주치의 하비 박사가 사실 영주의 서자로 자라나 복수를 도모했음이 밝혀 지며 가문 내부의 가해 관계를 해제하고 완승했습니다.'
                    : language === 'CN'
                    ? '您成功锁定了罪犯私人医生哈维！并且凭借搜集到的《夜鸦之眼》物证与对药化学实验室有机溶剂无声消融挂锁的完整推理，哈维见证据确凿瘫坐倒地，供认出了他身为领主私生子为了夺回圣器并洗劫保险箱的惊天家族阴谋！您达成了隐藏完美结局！'
                    : 'You successfully exposed Doctor Harvey! Armed with both the physical night-raven eye necklace and clinical organic solvent melting formulas, you unraveled he is the long-lost heir of the Raven line plotting legacy recovery. Outstanding detective work! Open Hidden Truth unlocked.'}
                </p>
              </div>
            ) : endingType === 'perfect' ? (
              <div id="ending-perfect" className="space-y-4">
                <h2 className="text-xl md:text-2xl font-serif font-black text-emerald-500 uppercase tracking-wider">
                  🏆 {language === 'KR' ? '완벽한 범인 지목 해결엔딩' : language === 'CN' ? '完美破案：捉拿行窃真凶' : 'Perfect Ending: Mastermind Conviction'}
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {language === 'KR'
                    ? '진짜 흉물 훔치기 주범 주치의 하비 박사의 혐의를 입증하고 체포하는 데 승리했습니다! 현장에서 회수한 보물이 영주에게 완벽히 환원되었습니다.'
                    : language === 'CN'
                    ? '完美审判！您指控了真正的作案主谋私人医生哈维并追回了《夜鸦之眼》吊坠。虽然哈维背后的世家阴谋和私生关系未被完全剖析，但窃贼已经被绳之以法，古物物归原主。'
                    : 'A flawless procedural conviction! Dr. Harvey was locked in cuffs and the precious ruby gemstone was successfully secured inside the vault collection.'}
                </p>
              </div>
            ) : endingType === 'ordinary' ? (
              <div id="ending-ordinary" className="space-y-4">
                <h2 className="text-xl md:text-2xl font-serif font-black text-cyan-500 uppercase tracking-wider">
                  ⚖ {language === 'KR' ? '일반 수사 종료엔딩 (장물 미회수/공범 입건)' : language === 'CN' ? '普通结局：打草惊蛇与残缺的证据' : 'Ordinary Ending: Halfway Resolved'}
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {language === 'KR'
                    ? '당신은 주치의 또는 배후의 집사 공모 관계를 추론해냈지만, 결정적 증물 《야까마귀의 눈》을 찾지 못하여 장물이 다른 바이어에게 은닉 처분되는 반쪽자리 승리를 거두었습니다.'
                    : language === 'CN'
                    ? '结案平平。您成功锁定了嫌疑人或协助开门的管家/访客，但由于未能成功在酒窖隐蔽石格搜出挂饰，导致被指控的罪犯百般抵赖，最核心的夜鸦之眼最终神秘失踪。'
                    : 'Case closed, but incomplete. You linked the accomplices block but failed to secure the primary gemstone itself, leaving the actual jewel long gone.'}
                </p>
              </div>
            ) : (
              <div id="ending-misjudgment" className="space-y-4">
                <h2 className="text-xl md:text-2xl font-serif font-black text-red-500 uppercase tracking-wider">
                  ❌ {language === 'KR' ? '사상의 억울한 오판 오보엔딩' : language === 'CN' ? '重大冤假错案与真凶匿迹' : 'Misjudgment Ending: Innocents Prosecuted'}
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {language === 'KR'
                    ? '당신은 무고한 고용인 클라라 혹은 억울한 침실 조카 벨라를 잘못 기소하여 대저택 내부에서 역사적 진범 하비 의사가 유유히 자금을 챙겨 잠적하는 비극을 자초했습니다.'
                    : language === 'CN'
                    ? '法槌敲错！您错误地控告了无辜的女佣安娜或重度抑郁的侄女，真凶私人医生哈维暗自窃笑，早已携取《夜鸦之眼》潜逃国外。法网疏漏，冤屈难平！'
                    : 'A tragic misstep! You accused an innocent household member while Dr. Harvey walked free into the rainy night clutching the valuable gemstone.'}
                </p>
              </div>
            )}

            <button
              id="btn-restart-game"
              onClick={handleResetGame}
              className="mt-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-gray-200 text-xs font-mono font-bold tracking-widest uppercase rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.restartBtn}
            </button>
          </div>
        </main>
      ) : (
        // Central Investigation Dashboard
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Visual Novel Presentation Frame */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* Background Container Frame */}
            <div
              id="scene-visual-novel"
              style={{ backgroundImage: `url('${getActiveBackground()}')` }}
              className="w-full h-80 md:h-[420px] rounded-2xl bg-cover bg-center border border-zinc-805 shadow-2xl relative overflow-hidden flex items-end justify-between p-4 bg-[#0a0a0d]"
            >
              {/* Cinematic vignetting shadow mask */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none z-0" />

              {/* Rain noise sizzle details overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:8px_8px] opacity-60 pointer-events-none" />

              {/* Header metadata label badge */}
              <div className="absolute top-4 left-4 z-10 bg-black/75 backdrop-blur-sm border border-zinc-800/80 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                <Compass className="w-4 h-4 text-red-500 animate-spin" />
                <span className="text-[11px] font-mono tracking-widest font-extrabold uppercase text-gray-200">
                  {t[playerLocation]}
                </span>
              </div>

              {/* Clickable Interactive Hotspots */}
              {roomHotspots[playerLocation]?.map(spot => {
                const isNecklace = spot.clueId === 'necklace_hidden';
                if (isNecklace && necklaceFound) return null;
                const isDiscovered = discoveredClues.includes(spot.clueId) || (isNecklace && necklaceFound);

                return (
                  <button
                    key={spot.id}
                    id={`hotspot-${spot.id}`}
                    onClick={() => handleInvestigateHotspot(spot)}
                    style={{ left: spot.x, top: spot.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                  >
                    <span className="relative flex h-5 w-5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isNecklace ? 'bg-amber-400' : isDiscovered ? 'bg-zinc-650' : 'bg-red-650'
                      }`} />
                      <span className={`relative inline-flex rounded-full h-5 w-5 border flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer ${
                        isNecklace
                          ? 'bg-amber-550 border-amber-400 text-black animate-bounce'
                          : isDiscovered
                          ? 'bg-zinc-800 border-zinc-705 text-zinc-400'
                          : 'bg-red-650 border-red-500 text-white'
                      }`}>
                        {isNecklace ? '💎' : '?'}
                      </span>
                    </span>

                    {/* Tooltip on hover */}
                    <span className="absolute left-1/2 -translate-x-1/2 top-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/90 border border-zinc-700 text-[10px] font-sans px-2 py-1 rounded text-zinc-300 z-30 shadow-lg pointer-events-none">
                      {spot.name[language] || spot.name['KR']}
                    </span>
                  </button>
                );
              })}

              {/* 2. Visual Novel Detective and Suspect models (Integrated and interactive click triggers) */}
              <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-10">
                
                {/* Detective avatar standing on left */}
                <div 
                  className="absolute bottom-0 select-none flex flex-col items-center pb-2 pointer-events-auto"
                  style={{ left: '16%', transform: 'translateX(-50%)' }}
                >
                  <div className="w-24 h-40 md:w-30 md:h-[260px] overflow-hidden relative">
                    <img
                      src={getPlayerAvatarUrl()}
                      alt="Detective Investigator"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] brightness-95"
                    />
                  </div>
                  <span className="mt-1 bg-black/85 border border-zinc-800 text-[8px] tracking-widest font-mono text-zinc-400 px-2 py-0.5 rounded uppercase leading-none">
                    {necklaceFound ? 'CONFIDENT DETECTIVE' : 'INSPECTING'}
                  </span>
                </div>

                {/* Suspects inside current location (placed directly inside the landscape background scene) */}
                {Object.values(SUSPECTS_DATA)
                  .filter(spouse => spouse.location === playerLocation)
                  .map((sus_raw, idx, arr) => {
                    const npc = compileSuspectInfo(sus_raw.id);
                    const isSelected = activeDialogueNpcId === npc.id;
                    const pos = getSuspectScenePosition(npc.id, idx, arr.length);

                    return (
                      <div
                        key={npc.id}
                        id={`scene-npc-${npc.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDialogueNpcId(npc.id);
                          gameAudio.playPencilWrite();
                        }}
                        className={`absolute bottom-0 flex flex-col items-center cursor-pointer transition-all duration-300 select-none pb-2 pointer-events-auto hover:scale-[1.04] ${
                          isSelected ? 'scale-105 z-15' : 'opacity-85 brightness-90 hover:opacity-100 hover:brightness-100'
                        }`}
                        style={{ left: pos.left, transform: 'translateX(-50%)' }}
                      >
                        {/* Active Interrogation Floating Marker Arrow */}
                        {isSelected && (
                          <div className="absolute -top-6 flex flex-col items-center animate-bounce">
                            <span className="bg-red-650 text-white text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded uppercase leading-none shadow-lg">
                              INTERROGATING
                            </span>
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-red-650" />
                          </div>
                        )}

                        <div className="w-24 h-40 md:w-30 md:h-[260px] overflow-hidden relative">
                          <img
                            src={npc.isOutburst ? npc.outburstAvatar : npc.avatar}
                            alt={npc.name[language]}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain transition-all duration-300"
                            style={{
                              filter: isSelected 
                                ? 'drop-shadow(0 0 16px rgba(220, 38, 38, 0.75)) drop-shadow(0 4px 10px rgba(0,0,0,0.85))' 
                                : 'drop-shadow(0 4px 10px rgba(0,0,0,0.85))'
                            }}
                          />
                        </div>

                        <span className={`mt-1 border text-[8px] tracking-widest font-mono px-2 py-0.5 rounded uppercase leading-none transition-all ${
                          isSelected
                            ? 'border-red-600 bg-red-950 text-red-400 font-extrabold animate-pulse'
                            : npc.isOutburst
                            ? 'border-amber-600 bg-amber-950 text-amber-500 font-bold'
                            : 'border-zinc-800 bg-black/85 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                        }`}>
                          {npc.name[language]}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Live Case Briefing / Progress status panel */}
            <div className="bg-[#0b0c10] border border-zinc-900 rounded-2xl p-5 md:p-6 shadow-xl text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 font-black text-6xl select-none font-mono tracking-tighter">
                STATUS
              </div>
              
              <h3 className="text-xs font-mono tracking-wider font-extrabold text-zinc-400 uppercase border-b border-zinc-900 pb-2 mb-4 flex items-center justify-between">
                <span>⚡ {language === 'KR' ? '수사 실시간 브리핑' : language === 'CN' ? '案件实地勘查进度' : 'FIELD DETECTIVE STATUS LOG'}</span>
                <span className="text-[10px] text-zinc-500 font-mono">23:45 UTC</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stats block */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500">{language === 'KR' ? '지목 가능 용의자' : language === 'CN' ? '嫌疑嫌犯人数' : 'TOTAL SUSPECTS'}:</span>
                    <span className="font-bold text-gray-200">5 Persons</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500">{language === 'KR' ? '발견된 단서' : language === 'CN' ? '已搜集线索' : 'DISCOVERED CLUES'}:</span>
                    <span className="font-bold text-red-400">{discoveredClues.length} / {INITIAL_CLUES.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500">{language === 'KR' ? '수조 조사 여부' : language === 'CN' ? '厨房异常放水' : 'FAUCET INSPECTED'}:</span>
                    <span className={`font-bold ${faucetInvestigated ? 'text-cyan-400' : 'text-zinc-650'}`}>
                      {faucetInvestigated 
                        ? (language === 'KR' ? '조완 💧' : language === 'CN' ? '已完成调查 💧' : 'YES 💧') 
                        : (language === 'KR' ? '미조사' : language === 'CN' ? '未搜查' : 'NOT YET')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500">{language === 'KR' ? '목걸이 회수 여부' : language === 'CN' ? '夜鸦之眼锁定' : 'NECKLACE SECURED'}:</span>
                    <span className={`font-bold ${necklaceFound ? 'text-amber-500' : 'text-zinc-650'}`}>
                      {necklaceFound ? 'SECURED 💎' : 'LOST'}
                    </span>
                  </div>
                </div>

                {/* Discovered quick deck block */}
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-zinc-500 tracking-wider block uppercase mb-1.5">
                    {language === 'KR' ? '최신 발견된 단서 목록' : language === 'CN' ? '最新收集的关键勘验' : 'LATEST HOTSPOT CLUES'}
                  </span>
                  <div className="flex-1 overflow-y-auto max-h-[85px] space-y-1 pr-0.5">
                    {discoveredClues.slice(-3).map(id => {
                      const clue = INITIAL_CLUES.find(c => c.id === id);
                      if (!clue) return null;
                      return (
                        <div key={id} className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <span className="text-red-500 shrink-0">▪</span>
                          <span className="truncate">{clue.title[language]}</span>
                        </div>
                      );
                    })}
                    {discoveredClues.length === 0 && (
                      <span className="text-[10px] text-zinc-650 italic block pt-3 text-center">
                        {language === 'KR' ? '[ 아직 발견된 단서가 없습니다 ]' : language === 'CN' ? '[ 暂无搜寻到的关键线索 ]' : '[ NO DISCOVERED CLUES ]'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* Sidebar Area controls */}
          <section className="lg:col-span-4 space-y-6">
            
            {/* Quick Action Buttons */}
            <div className="bg-[#0b0c10] border border-zinc-875 p-5 rounded-2xl shadow-xl space-y-3.5 text-left">
              <h3 className="text-xs font-mono tracking-wider font-extrabold text-zinc-400 uppercase border-b border-zinc-900 pb-2">
                DETECTION EXPEDITION CONTROL
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {/* Visual Logic Pinboard access button */}
                <button
                  id="btn-open-pinboard"
                  onClick={() => {
                    gameAudio.playPencilWrite();
                    setShowLogicBoardModal(true);
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 text-red-400 hover:text-red-300 border-2 border-red-900/60 hover:border-red-600/50 text-xs rounded-xl font-black tracking-widest transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg animate-[pulse_3s_infinite]"
                >
                  <Grid className="w-4 h-4 text-red-500" />
                  {language === 'KR' ? '논리 연결 핀보드' : language === 'CN' ? '推理侦破逻辑白板' : 'LOGIC PIN-BOARD'}
                </button>

                {/* Guide handbook access button */}
                <button
                  id="btn-open-handbook"
                  onClick={() => {
                    gameAudio.playPencilWrite();
                    setShowHandbook(true);
                  }}
                  className="px-4 py-3 bg-[#11131a] hover:bg-[#1b1e2a] text-gray-200 border border-zinc-805 hover:border-zinc-700 text-xs rounded-xl font-bold transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md"
                >
                  <Notebook className="w-4 h-4 text-red-500" />
                  {t.notebookTitle}
                </button>

                {/* Accuse suspects trigger */}
                <button
                  id="btn-trigger-accuses"
                  onClick={() => {
                    gameAudio.playGavel();
                    setShowAccuseModal(true);
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-red-700 to-red-650 hover:from-red-650 hover:to-red-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg shadow-red-950/20 col-span-1 sm:col-span-2 lg:col-span-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {t.accuseBtn}
                </button>
              </div>
            </div>

            {/* Live Evidence Showcase Panel */}
            <div className="bg-[#0b0c10] border border-zinc-800 p-5 rounded-2xl shadow-xl text-left">
              <h3 className="text-xs font-mono tracking-wider font-bold text-zinc-400 uppercase border-b border-zinc-900 pb-2 mb-4 flex items-center justify-between">
                <span>{t.notebookTabEvidence}</span>
                <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-900">COUNT: {evidenceInventory.length}</span>
              </h3>

              <div className="space-y-2.5">
                {evidenceInventory.map(item => (
                  <div key={item.id} className="flex gap-2.5 p-2 bg-zinc-950/60 border border-zinc-900 rounded-xl transition-all hover:border-amber-600/30">
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-850 rounded-lg shrink-0 overflow-hidden">
                      <img src={item.image} alt="Evidence item" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-bold text-amber-500 truncate">{item.name[language]}</h4>
                      <p className="text-[9px] text-zinc-450 mt-0.5 line-clamp-2 leading-relaxed font-sans">{item.description[language]}</p>
                    </div>
                  </div>
                ))}
                {evidenceInventory.length === 0 && (
                  <p className="text-[10px] text-zinc-650 italic text-center py-4">{t.evidenceEmptyList}</p>
                )}
              </div>
            </div>

            {/* Move Route navigator panel */}
            <div className="bg-[#0b0c10] border border-zinc-875 p-5 rounded-2xl shadow-xl text-left">
              <h3 className="text-xs font-mono tracking-wider font-bold text-zinc-400 uppercase border-b border-zinc-900 pb-2 mb-4">
                {t.navTitle}
              </h3>

              <div className="flex flex-col gap-2">
                {(['LivingRoom', 'Hallway', 'Kitchen', 'Bedroom', 'WineCellar'] as LocationKey[]).map(loc => {
                  const isCurrent = playerLocation === loc;
                  const npcInUnit = Object.values(SUSPECTS_DATA).find(n => n.location === loc);

                  return (
                    <button
                      key={loc}
                      id={`nav-btn-${loc}`}
                      onClick={() => handleMoveLocation(loc)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer active:scale-98 ${
                        isCurrent
                          ? 'border-red-600/50 bg-[#fb7185]/10 text-red-400 font-extrabold shadow-sm'
                          : 'border-zinc-8ab hover:border-zinc-700 hover:bg-zinc-900 bg-zinc-950/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-red-500 animate-ping' : 'bg-zinc-700'}`} />
                        <span className="text-xs font-sans tracking-wide">
                          {t[loc]}
                        </span>
                      </div>
                      {npcInUnit && (
                        <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-550 px-2 py-0.5 rounded font-mono uppercase">
                          👤 {npcInUnit.id === 'Doctor' ? 'Harvey' : npcInUnit.id === 'Butler' ? 'Rudolf' : npcInUnit.id}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </section>

        </main>
      )}

      {/* 3. POPUP MODAL ARCHIVES */}
      {/* Evidence handbook panel modal portal */}
      <ManualModal
        discoveredClues={INITIAL_CLUES.filter(c => discoveredClues.includes(c.id))}
        allClues={INITIAL_CLUES}
        evidenceInventory={evidenceInventory}
        language={language}
        t={t}
        isOpen={showHandbook}
        onClose={() => setShowHandbook(false)}
      />

      {/* Special modal displaying the beautiful ruby necklace when discovered */}
      {necklaceFound && evidenceInventory.some(e => e.id === 'night_raven_eye') && (
        <div id="jewel-discovery-modal" className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#13151c] border-2 border-amber-600/70 p-6 rounded-2xl shadow-[0_0_30px_rgba(217,119,6,0.3)] text-center animate-bounce-short">
            <span className="text-2xl animate-spin inline-block mb-3">💎</span>
            <h2 className="text-lg font-serif font-black text-amber-500 tracking-wide uppercase">
              {t.foundItemTitle}
            </h2>
            <div className="w-44 h-44 bg-zinc-950 border border-zinc-800 rounded-2xl mx-auto my-5 overflow-hidden shadow-inner">
              <img
                src={evidenceInventory.find(e => e.id === 'night_raven_eye')?.image}
                alt="Eye of the Night Raven Gem"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xs font-bold text-gray-200 mb-1">
              {evidenceInventory.find(e => e.id === 'night_raven_eye')?.name[language]}
            </h3>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto leading-relaxed font-sans px-1">
              {evidenceInventory.find(e => e.id === 'night_raven_eye')?.description[language]}
            </p>
            <button
              id="btn-close-jewel-alert"
              onClick={() => {
                gameAudio.playPencilWrite();
                // Close alert modal gracefully
                const modal = document.getElementById('jewel-discovery-modal');
                if (modal) modal.style.display = 'none';
              }}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-550 hover:from-amber-550 hover:to-amber-500 text-black font-extrabold text-xs tracking-widest uppercase rounded-xl transition active:scale-95 cursor-pointer shadow-md"
            >
              OK / {t.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* Evidence selecting screen to presentation against NPCs */}
      {presentEvidenceSelectionOpen && (
        <div id="present-selection-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0e1015] border-2 border-zinc-800 rounded-2xl p-5 md:p-6 shadow-2xl text-left">
            <h3 className="text-sm font-bold text-orange-400 tracking-wider uppercase border-b border-zinc-900 pb-2 mb-4 flex items-center gap-2">
              ⚖ {t.presentEvidence}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-80 pr-1">
              {INITIAL_CLUES.filter(c => discoveredClues.includes(c.id)).map(clue => (
                <button
                  key={clue.id}
                  id={`present-item-${clue.id}`}
                  onClick={() => handleSelectEvidenceForNPC(clue.id)}
                  className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-xl transition text-left cursor-pointer flex flex-col justify-between"
                >
                  <h4 className="text-[11px] font-bold text-zinc-300 mb-1 truncate">
                    {clue.title[language] || clue.title['KR']}
                  </h4>
                  <span className="text-[9px] text-[#fb7185]/70 font-mono tracking-tight uppercase">
                    SELECT EVIDENCE ➔
                  </span>
                </button>
              ))}

              {discoveredClues.length === 0 && (
                <div className="col-span-2 py-10 text-center text-zinc-650 text-xs tracking-wider uppercase font-mono">
                  [ NO DISCOVERED CLUES IN HANDBOOK TO PRESENT ]
                </div>
              )}
            </div>

            <div className="flex justify-end mt-5">
              <button
                id="btn-cancel-present"
                onClick={() => setPresentEvidenceSelectionOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs transition active:scale-95 cursor-pointer uppercase font-mono"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Accuse suspects menu */}
      {showAccuseModal && (
        <div id="accusal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#0d0e15] border-2 border-red-950 p-5 md:p-7 rounded-3xl shadow-2xl shadow-red-950/25 text-left">
            
            <h2 className="text-lg font-serif font-black text-red-500 tracking-wide uppercase border-b border-zinc-900 pb-3 mb-4 flex items-center gap-2">
              🚨 {t.accuseTitle}
            </h2>

            <div className="mb-5 bg-red-950/10 border border-red-900/30 rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                {t.accuseWarning}
              </p>
            </div>

            {/* List suspects list selecting */}
            <div className="space-y-4 mb-6">
              <label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase block">
                {t.accuseNPC}
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.keys(SUSPECTS_DATA).map(npcId => {
                  const npc = compileSuspectInfo(npcId);
                  const isCur = accuseSelectedNpcId === npcId;

                  return (
                    <button
                      key={npcId}
                      id={`accuse-suspect-${npcId}`}
                      onClick={() => setAccuseSelectedNpcId(npcId)}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 active:scale-98 cursor-pointer ${
                        isCur
                          ? 'border-red-600 bg-red-950/20 text-red-400 font-bold'
                          : 'border-zinc-850 bg-zinc-950 hover:bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 overflow-hidden shrink-0">
                        <img
                          src={npc.avatar}
                          alt={npc.name[language]}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-sans font-bold">
                          {npc.name[language]}
                        </h4>
                        <span className="text-[9px] text-zinc-500 font-sans block truncate max-w-[160px]">
                          {npc.occupation[language]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-zinc-900">
              <button
                id="btn-cancel-accuse"
                onClick={() => setShowAccuseModal(false)}
                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs transition active:scale-95 cursor-pointer uppercase font-mono"
              >
                {t.closeBtn}
              </button>
              <button
                id="btn-confirm-accuse"
                onClick={handleConfirmAccusation}
                className="px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-650 hover:from-red-650 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer uppercase font-sans flex items-center gap-1"
              >
                ⚖ {t.accuseSelect}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. DIALOGUE INTERROGATION POPUP MODAL OVERLAY */}
      {activeDialogueNpcId && Object.values(SUSPECTS_DATA).some(n => n.location === playerLocation && n.id === activeDialogueNpcId) && (
        <div id="dialogue-modal-overlay" className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-left">
          <div id="dialogue-modal" className="w-full max-w-2xl bg-[#0a0a0d] border border-zinc-805 rounded-3xl overflow-hidden shadow-2xl relative">
            {/* Header with Close */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-900 bg-zinc-950/60">
              <span className="text-red-500 bg-red-955 border border-red-900/40 px-2 py-0.5 text-[9px] font-mono tracking-widest rounded leading-none uppercase font-bold">
                🔎 INTERROGATION ACCORD
              </span>
              <button
                onClick={() => {
                  gameAudio.playPencilWrite();
                  setActiveDialogueNpcId(null);
                }}
                className="text-zinc-450 hover:text-white hover:bg-zinc-900 px-3 py-1 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-lg text-xs font-mono font-bold transition cursor-pointer active:scale-95"
              >
                {t.closeBtn}
              </button>
            </div>

            {/* Dialogue container content */}
            <DialogueBox
              npc={compileSuspectInfo(activeDialogueNpcId)}
              language={language}
              t={t}
              dialogueHistory={dialogueHistory[activeDialogueNpcId] || []}
              isChatLoading={isChatLoading}
              onSendCustomAsk={handleSendCustomAsk}
              onPresentEvidenceSelection={() => setPresentEvidenceSelectionOpen(true)}
              extraQuestionButton={
                faucetInvestigated ? (
                  <button
                    id="btn-extra-faucet-question"
                    onClick={() => {
                      const promptTexts = {
                        KR: "💧 [수조 조사] 23:15 저택 주방의 물소리와 복도 발소리 폭로",
                        CN: "💧 [查验水龙头] 质问 23:15 厨房异常放水与走廊脚步声的共谋",
                        EN: "💧 [Check Faucet] Accuse about the 23:15 kitchen water sound and footsteps"
                      };
                      handleSendCustomAsk(promptTexts[language]);
                    }}
                    className="px-2.5 py-1 bg-gradient-to-r from-teal-950/40 to-cyan-950/40 hover:from-teal-900/50 hover:to-cyan-900/50 border border-cyan-500/40 text-cyan-405 text-[10px] transition font-sans cursor-pointer active:scale-95 flex items-center gap-1 shadow-md shadow-cyan-950/20"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                    {language === 'KR' ? '주방 물소리 추궁' : language === 'CN' ? '厨房异常流水追问' : 'Water Clue interrogation'}
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>
      )}

      {/* 5. LOGIC DEDUCTION WHITEBOARD PORTAL */}
      {showLogicBoardModal && (
        <div id="logic-pinboard-modal-overlay" className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div id="logic-pinboard-modal" className="w-full max-w-5xl h-[88vh] bg-[#0c0d12] border-2 border-red-950 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
            {/* Clean Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/40">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <div>
                  <h3 className="text-sm font-serif font-black tracking-widest text-[#f53f5e] uppercase">
                    {language === 'KR' ? '현장 증거 연쇄 추리 보드' : language === 'CN' ? '悬疑侦破 逻辑拼合连线墙' : 'EVIDENCE CONNECTION BOARD'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5">
                    CLICK TWO CLUE NODES TO DRAW RED LINE DEDUCTIONS
                  </p>
                </div>
              </div>
              <button
                id="btn-close-pinboard-modal"
                onClick={() => {
                  gameAudio.playPencilWrite();
                  setShowLogicBoardModal(false);
                }}
                className="px-5 py-2 hover:bg-[#1E0D0D] text-red-400 border border-red-950 hover:border-red-600 rounded-xl text-xs font-mono font-bold transition cursor-pointer active:scale-95"
              >
                {t.closeBtn}
              </button>
            </div>

            {/* Content canvas */}
            <div className="flex-1 overflow-hidden relative">
              <LogicBoard
                discoveredClues={INITIAL_CLUES.filter(c => discoveredClues.includes(c.id))}
                language={language}
                t={t}
                connections={pinboardConnections}
                onAddConnection={handlePinboardAddConnection}
                onRunDeduction={handlePinboardRunDeduction}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. HOTSPOT SEARCH DISCOVERY POPUP DETAILED CARD */}
      {examinedClue && (
        <div id="clue-detail-modal" className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="w-full max-w-md bg-[#0F1116] border-2 border-red-900 p-6 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.25)] relative text-left">
            {/* Header decoration */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <span className="text-red-500 bg-red-950/40 border border-red-900/60 px-2.5 py-0.5 text-[9px] font-mono tracking-widest rounded leading-none uppercase font-bold">
                🔎 {language === 'KR' ? '단서 도안 획득' : language === 'CN' ? '侦查简报 · 勘测所得' : 'CLUE INVESTIGATION'}
              </span>
              <button
                onClick={() => {
                  gameAudio.playPencilWrite();
                  setExaminedClue(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 p-1 rounded transition duration-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <h3 className="text-sm md:text-base font-serif font-black text-gray-100 tracking-wide uppercase mb-2">
              {examinedClue.title[language] || examinedClue.title['KR']}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-6">
              {examinedClue.description[language] || examinedClue.description['KR']}
            </p>

            {/* Actions button */}
            <div className="flex justify-end pt-2 border-t border-zinc-900">
              <button
                onClick={() => {
                  gameAudio.playPencilWrite();
                  setExaminedClue(null);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-650 hover:from-red-650 hover:to-red-600 text-white font-extrabold text-[10px] tracking-widest uppercase rounded-xl transition duration-200 active:scale-95 cursor-pointer shadow-md"
              >
                {language === 'KR' ? '수첩에 기록 완료' : language === 'CN' ? '记录并闭合案档' : 'Log Clue'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
