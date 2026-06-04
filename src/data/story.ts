/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language, TranslationSet, LocationKey, ClueNode, DeductionRule, NPC } from '../types';

export const LOCALIZED_STRINGS: Record<Language, TranslationSet> = {
  KR: {
    title: "자정의 의혹 · AI 수사관",
    subtitle: "대저택 도난 사건의 진실을 파헤쳐라",
    tagline: "구글 시트 데이터 기반 · 제미나이 AI 대화형 추리 게임",
    startBtn: "수사 시작하기",
    LivingRoom: "거실 (Living Room)",
    Hallway: "복도 (Hallway)",
    Kitchen: "주방 (Kitchen)",
    Bedroom: "침실 (Bedroom)",
    WineCellar: "지하 와인창고 (Wine Cellar)",
    navTitle: "이동 경로 선택",
    goTo: "이동",
    presentEvidence: "증거 제시 (Present)",
    askNPC: "심문하기 (Ask AI)",
    askPlaceholder: "NPC에게 예리한 질문을 입력하세요... (예: '23:15분에 어디에 계셨습니까?')",
    notebookTitle: "탐정 수사 수첩",
    notebookTabClues: "수집된 단서",
    notebookTabEvidence: "소지품 증물함",
    evidenceEmptyList: "아직 결정적인 증물이 발견되지 않았습니다. 현장 수사 혹은 흰색 패널을 적극적으로 정리해보세요.",
    evidenceAcquiredAt: "획득 시간",
    pinboardTitle: "수사 단서 논리 보드 (Detective Connection Board)",
    pinboardSubtitle: "두 단서를 클릭 후 '논리 결합' 단추를 눌러 새로운 모순/추리를 해제하세요! '바둑판 정렬'로 깔끔하게 정리됩니다.",
    pinboardArrange: "바둑판 정렬 (Arrange)",
    pinboardDeduct: "논리 결합 (Deduce)",
    pinboardAlertLink: "선택한 두 단서 연결 성공: ",
    pinboardInferenceFound: "단서 결합 완료! 새로운 단서가 추가되었습니다: ",
    accuseBtn: "범인 지목하기",
    accuseConfirm: "이 인물을 진짜 범인으로 지목하시겠습니까?",
    accuseTitle: "의혹의 밤 - 최후의 변론",
    accuseNPC: "용의자 선택",
    accuseSelect: "용의자 지목",
    accuseWarning: "주의: 범인 지목은 신중해야 합니다. 단서와 증물이 부족할 경우 오판 혹은 진실 은폐 엔딩을 맞이할 수 있습니다.",
    foundItemTitle: "★ 결정적인 증물 획득 ★",
    closeBtn: "닫기",
    restartBtn: "처음부터 다시",
    gavelObjection: "쉿! 모순이 발견되었습니다!",
    stressLevel: "심리 불안도",
    outburstActive: "폭발 분노 상태!",
    hotspotInvestigate: "조사하기",
    hotspotFoundClue: "새로운 무언가를 발견했습니다! 단서 수첩에 기록되었습니다."
  },
  CN: {
    title: "午夜疑云 · AI探案",
    subtitle: "揭秘大别墅失窃案背后的历史阴谋",
    tagline: "谷歌表格数据驱动 · Gemini AI 动态对话推理游戏",
    startBtn: "开启午夜调查",
    LivingRoom: "客厅 (Living Room)",
    Hallway: "走廊 (Hallway)",
    Kitchen: "厨房 (Kitchen)",
    Bedroom: "卧室 (Bedroom)",
    WineCellar: "地下酒窖 (Wine Cellar)",
    navTitle: "前往下个场景",
    goTo: "前往",
    presentEvidence: "出示证物 (Present)",
    askNPC: "自由盘问 (Ask AI)",
    askPlaceholder: "输入任何问题盘问NPC...（例：‘23:15你为什么出现在走廊？’）",
    notebookTitle: "侦探助理手账",
    notebookTabClues: "线索清单",
    notebookTabEvidence: "证据保管箱",
    evidenceEmptyList: "暂无关键物证。请继续调查现场或在逻辑白板关联线索。",
    evidenceAcquiredAt: "获取时间",
    pinboardTitle: "侦探逻辑连接白板",
    pinboardSubtitle: "选中两个卡片并点击“线索关联”连接红线以触发高能推论。点击“自动整理”一键在网格排列不被遮挡。",
    pinboardArrange: "网格整理 (Arrange)",
    pinboardDeduct: "线索关联 (Deduce)",
    pinboardAlertLink: "成功连接两条线索关系: ",
    pinboardInferenceFound: "恭喜！您通过逻辑推论解锁了全新深层线索: ",
    accuseBtn: "指控真正的凶手",
    accuseConfirm: "确认指控此嫌疑人是幕后真凶吗？",
    accuseTitle: "午夜终局 · 指控审判",
    accuseNPC: "选择嫌疑犯",
    accuseSelect: "进行呈堂质证",
    accuseWarning: "警告：一旦结案指控不容撤销。若未找到“夜鸦之眼”或缺少逻辑推导，极易导致凶手逍遥法外。",
    foundItemTitle: "★ 获得关键案件物证 ★",
    closeBtn: "合上书页",
    restartBtn: "重入午夜复盘",
    gavelObjection: "有异议！矛盾推论成立！",
    stressLevel: "心理压力值",
    outburstActive: "情绪失控暴走中！",
    hotspotInvestigate: "点击搜查",
    hotspotFoundClue: "调查完毕！发现关键嫌疑，已计入手册。"
  },
  EN: {
    title: "Midnight Suspicion: AI Case",
    subtitle: "Unravel the Conspiracy in the Villa Theft",
    tagline: "Google Sheets Data Driven · Gemini AI Interactive Mystery",
    startBtn: "Begin Investigation",
    LivingRoom: "Living Room",
    Hallway: "Hallway",
    Kitchen: "Kitchen",
    Bedroom: "Bedroom",
    WineCellar: "Wine Cellar",
    navTitle: "Scene Navigation",
    goTo: "Go To",
    presentEvidence: "Present Clue",
    askNPC: "Interrogate",
    askPlaceholder: "Ask NPC anything to interrogate... (e.g. 'Where were you at 23:15?')",
    notebookTitle: "Detective Handbook",
    notebookTabClues: "Discovered Clues",
    notebookTabEvidence: "Evidence Inventory",
    evidenceEmptyList: "No crucial physical evidence in hand. Keep exploring locations or map link paths on the Pin-board.",
    evidenceAcquiredAt: "Discovered at",
    pinboardTitle: "Detective Logic Pin-board",
    pinboardSubtitle: "Select two clues and click 'Connect Deduce' to link them and spark new insights! Use 'Arrange' to snap to format.",
    pinboardArrange: "Arrange Grid",
    pinboardDeduct: "Connect Deduce",
    pinboardAlertLink: "Successfully linked clue relationship: ",
    pinboardInferenceFound: "Logic Deduced! You established a new deep clue: ",
    accuseBtn: "Accuse True Suspect",
    accuseConfirm: "Are you absolutely sure you want to accuse this suspect?",
    accuseTitle: "The Accusation Trial",
    accuseNPC: "Select Defendant",
    accuseSelect: "Confirm Accusation",
    accuseWarning: "Warning: Accusation trial cannot be undone. Lacking the stolen necklace or necessary reasoning will trigger failed endings.",
    foundItemTitle: "★ Acquired Critical Evidence ★",
    closeBtn: "Close Folder",
    restartBtn: "Restart Investigation",
    gavelObjection: "Objection! A contradiction is verified!",
    stressLevel: "Psychological Stress",
    outburstActive: "Emotional Breakdown Outburst!",
    hotspotInvestigate: "Investigate Spot",
    hotspotFoundClue: "Search complete! Extracted crucial doubt and recorded in handbook."
  }
};

export const INITIAL_CLUES: ClueNode[] = [
  {
    id: 'dripping_sound',
    title: {
      KR: "주방의 비정상적인 유수음",
      CN: "厨房异常流水声",
      EN: "Abnormal Dripping Faucet"
    },
    description: {
      KR: "23:15분경 주방에서 물 흐르는 소리가 들렸습니다. 도난 시간대(23:10~23:20) 누군가가 주방에 있었다는 점을 증명합니다.",
      CN: "约23:15水龙头被人开大滴水，证明作案时间段（23:10~23:20）内主犯在厨房活动过并伪造了声响。",
      EN: "Rushing water at 23:15 from the kitchen faucet. Proves someone was active inside the kitchen during the heist window (23:10~23:20)."
    },
    isDiscovered: false
  },
  {
    id: 'footsteps',
    title: {
      KR: "황급한 도망의 발자국 소리",
      CN: "仓促离去的脚步声",
      EN: "Rushed Fleeing Footsteps"
    },
    description: {
      KR: "누군가 지하실 방향으로 허둥지둥 가던 중 정원 카펫에 젖은 진흙 발자국 흔적을 남겼습니다.",
      CN: "通往地下酒窖的红地毯上留下了略带潮湿的泥土脚印，说明有人在23:18急匆匆走下了阶梯。",
      EN: "Damp muddy shoe outline going towards the wine cellar around 23:18. Indicated rapid downward movement."
    },
    isDiscovered: false
  },
  {
    id: 'butler_lie',
    title: {
      KR: "집사의 알리바이 허위 진술",
      CN: "管家的虚报虚像",
      EN: "Butler's Fabricated Alibi"
    },
    description: {
      KR: "집사는 23:00~23:30에 자기 방에서 잤다고 주장하지만, 고용인 메이드는 23:15분 복도 수납장 근처에서 서성이던 그를 봤다고 진술했습니다.",
      CN: "管家坚称自己23:00~23:30在佣人房熟睡。但佣人却撞见其于23:15在过道保险柜前翻弄物证，明显在遮掩真相。",
      EN: "Butler claimed sleeping from 23:00 to 23:30, but Maid testified seeing him searching the hallway cabinet at precisely 23:15."
    },
    isDiscovered: false
  },
  {
    id: 'broken_cabinet',
    title: {
      KR: "화학적으로 녹아내린 열쇠 잠금창",
      CN: "熔毁的微型物理锁",
      EN: "Chemically Melted Glass Lock"
    },
    description: {
      KR: "거실 골동품 장식장의 유리문 락은 강제로 해제된 것이 아니라 전문적인 화학 시약 유기 용제에 의해 조용히 녹아내렸습니다.",
      CN: "展示柜的挂锁并非撬开，而是被高浓度强极性有机溶剂（如环己烷）无形熔毁。一般人很难弄到这种专业溶剂。",
      EN: "The living room display lock was melted chemically with specialist laboratory reagents rather than picked physically, suggesting access to chemical stock."
    },
    isDiscovered: false
  },
  {
    id: 'doctor_motive',
    title: {
      KR: "의사의 대규모 투자 채무서",
      CN: "私医的大额债务账单",
      EN: "Doctor's Covert Debt Slip"
    },
    description: {
      KR: "지하실의 맥주통 속에 찢겨진 채 우겨져 있던 의학 실험실 도산 부채 통지서. 의사에겐 고가 유물을 훔칠 극단적인 돈이 필요했습니다.",
      CN: "藏匿于酒窖陈旧酒桶顶端缝隙中的债务催缴函，揭示私人医生因地下实验破产欠下巨额高利贷，急需转卖古董套现。",
      EN: "A shredded debt circular found stuffed in the cellar. Details that the Doctor is bankrupt from heavy stock option loans and desperately needed instant capital."
    },
    isDiscovered: false
  },
  {
    id: 'niece_diary',
    title: {
      KR: "조카가 작성한 심야 일기장",
      CN: "侄女紧锁的心底日记",
      EN: "Niece's Lockbox Journal"
    },
    description: {
      KR: "조카의 서랍 속 일기. '가족들이 유산을 빼앗기 위해 날 감시한다. 밤새 난 집안을 돌며 대비책을 구했다'고 쓰여진 편집증 일지입니다.",
      CN: "侄女床头抽屉下的日记，记叙了她对家族遗产分配的怨愤：‘我要拿回属于我的一切，那些虚伪的人会遭天谴。’23:12分她确实离开过卧室。",
      EN: "A journal inside the Niece's drawer. Confessed deep family money feuds: 'I will retake what is rawly mine, no matter the cost.' Confirmed she was roaming around 23:12."
    },
    isDiscovered: false
  },
  {
    id: 'visitor_ticket',
    title: {
      KR: "방문객의 헨리호 바다 티켓",
      CN: "访客预订的凌晨船票",
      EN: "Visitor's International Ticket"
    },
    description: {
      KR: "6월 3일 오전 새벽 2시로 예정된 국제 크루즈 탈출 승선표. 방문객은 범행 후 즉각 해외로 장물 《야까마귀의 눈》과 탈출하고자 했습니다.",
      CN: "从访客外套内侧搜出的6月3日凌晨2:00远洋货船双人舱单，暗示其犯案后即打算携宝潜逃出境，极有极强的潜逃谋划。",
      EN: "A shipping ticket dated June 3rd at 02:00 AM. Suggests Visitor premeditated a high-speed flight of the country alongside the stolen jewel."
    },
    isDiscovered: false
  },
  {
    id: 'mural_clue',
    title: {
      KR: "레이스리 유화 장식 뒤의 잔해",
      CN: "雷斯利油画框后的残留",
      EN: "Residue Behind Leslie Mural"
    },
    description: {
      KR: "복도 벽화 장식 뒷면에 남아있는 미세한 도색 긁힘 자국. 최근 누군가가 정교하게 탐침을 이용하여 가문 소장품을 수색한 흔적입니다.",
      CN: "走廊墙上一侧油画壁挂侧壁发现的新划痕与少许石膏屑，暗示近期有人在过道偷偷摸索或撬动不属于其权限的墙体结构。",
      EN: "Fresh structural scrapes located directly behind the grand wall painting frame, suggesting unrecorded searching attempts."
    },
    isDiscovered: false
  },
  {
    id: 'clock_clue',
    title: {
      KR: "자명종 구역 주변의 정수 적하",
      CN: "古典立钟座底下的积水",
      EN: "Moisture Behind Grandfather Clock"
    },
    description: {
      KR: "고풍스러운 입체 괘종시계 아래에 미세하게 고인 소량의 수분 얼룩. 젖은 신발을 신은 누군가가 신속하게 은둔해 숨어들며 남긴 흔적입니다.",
      CN: "大自鸣钟底座发现的一小滩无色积水。表明在深夜水龙头被恶意放水、积水溅出的同时，曾有人在立钟暗角驻足藏匿过。",
      EN: "Slight water condensation spots centered below the clock, suggesting a damp-shoed trespasser stood here waiting."
    },
    isDiscovered: false
  },
  {
    id: 'kniferack_clue',
    title: {
      KR: "주방 전용 칼칼 수납대의 흔적",
      CN: "剔骨刀架上的油脂微粒",
      EN: "Traces on Culinary Knife Block"
    },
    description: {
      KR: "칼 거치대에 희미하게 무늬가 묻어 있는 유성 성분. 누군가가 주방에서 장갑을 낀 채 손으로 잡다 흘려낸 기름입니다.",
      CN: "主厨剔骨刀架底座附着的深色机械润滑油渍。暗示行窃者作案时戴着沾有特殊机油的劳动皮手套，并在后厨驻足过。",
      EN: "Trace chemical machinery oils left on the knife handler block, proving a glove-wearing trespasser examined kitchen tools."
    },
    isDiscovered: false
  },
  {
    id: 'dinetable_clue',
    title: {
      KR: "식탁 의자 다리 밑의 수분 얼룩",
      CN: "拼边餐桌一角的积水溅痕",
      EN: "Spill Marks on Pine Dining Table"
    },
    description: {
      KR: "목재 식탁 가장자리에 남아 있는 이상한 액체 비말. 주수 수돗가에서 뿜어져 나온 차가운 수돗물이 여기까지 유입되었습니다.",
      CN: "木餐桌边缘残留的自来水溅射粉尘痕迹，侧面证实当时放水的水龙头水流冲力相当巨大，绝非自然偶发滴落。",
      EN: "Rushing tap water splash sprinkles detected nearby on the dining table, corroborating high-velocity kitchen water movement."
    },
    isDiscovered: false
  },
  {
    id: 'drawer_clue',
    title: {
      KR: "침대 서랍 모서리의 금속 칩",
      CN: "床头备用抽屉滑槽的金属碎屑",
      EN: "Metallic Dust in Bedside Drawer"
    },
    description: {
      KR: "서랍 안쪽 정렬 선반에서 채취된 미세한 연성 긁힘. 복사 열쇠를 정렬하여 대저택 내부를 열기 위해 세공 가공을 가한 자국입니다.",
      CN: "床头备用备件手拉抽屉深处暗格里的黄铜钥匙擦痕。证明确实有人在这里偷走或复制过备用的保险箱万能副钥匙。",
      EN: "Fine key-filing brass shavings inside the night drawer, proving someone recently cloned a duplicate estate latch key."
    },
    isDiscovered: false
  },
  {
    id: 'lamp_clue',
    title: {
      KR: "구리 스탠드 머리의 유황 오일",
      CN: "复古铜绿台灯罩下的指腹痕",
      EN: "Fingerprints on Opal Lamp Cover"
    },
    description: {
      KR: "침대 주변을 은은하게 비추는 장식 램프 덮개 아래의 지문 패턴. 조사 결과, 조카 벨라의 무늬가 검출되어 밤사이 활동이 입증됩니다.",
      CN: "复古台灯转轴背后发现的一枚带灰滑润指纹，匹配显示其为大小姐塞西莉亚，证实她当晚绝非乖乖躺着入睡休整。",
      EN: "Slight smudge indices on the lamp turn key, directly tracing to Bella and exposing her active presence late into the midnight hour."
    },
    isDiscovered: false
  },
  {
    id: 'winerack_clue',
    title: {
      KR: "와인 보관소 선반의 자외선 반응",
      CN: "陈年白兰地酒架上的特殊刮白",
      EN: "Abrasions on Mahogany Wine Rack"
    },
    description: {
      KR: "와인 코너 중앙에서 포착된 하얀 침전 긁힘. 병 보관에 필요한 장치가 아니라 소금 화학 약품 병을 흔들며 남겨진 도포 흔적입니다.",
      CN: "陈旧酒架暗角残留的高温白浊化学锈化，极似在熔毁展示柜时所伴随产生的极性化合物粉末，证明熔锁工具此前曾存放于酒窖。",
      EN: "Traces of white chemical efflorescence typical of active organic solvents. Indicates the lock melting tool was once placed inside the cellar selection."
    },
    isDiscovered: false
  },
  {
    id: 'groundgrate_clue',
    title: {
      KR: "지하 지하 비밀 통로의 긁힘",
      CN: "地下冷库铁格栅新裂痕",
      EN: "Scrapes on Rust Iron Sub-floor Grate"
    },
    description: {
      KR: "지하 냉동고 격자창 주변에 박혀 있던 가벼운 철망 부스러기. 무거운 상자가 통과하며 금속이 휘고 긁혀나간 마찰입니다.",
      CN: "地下通气隔油池底格栅上发现的铁斑磨损。证明曾有一个包含重金属质地的储物柜被强行在此处抽拉摩擦过。",
      EN: "Deep metal scoring left across the dark basement floor, suggesting heavy vault box relocation maneuvers occurred here."
    },
    isDiscovered: false
  },

  // 1-3 Deep Logical Clues Unlocked via combining:
  {
    id: 'water_cover',
    title: {
      KR: "소음을 은폐하기 위한 방수 행위",
      CN: "流水声掩饰潜逃",
      EN: "Rushing Water Noise Cover"
    },
    description: {
      KR: "추론: 마구 쏟구치는 주방 수돗물 소리는 발소리를 감추기 위한 속셈이었습니다. 지하실로 도피하는 행적을 덮기 위한 공범의 계획이었습니다.",
      CN: "推论：凶手故意开大水龙头制造噪音，是为了掩盖从后厨悄然逃窜下地下室的急促脚步，是一场精心谋划的时间差诡计。",
      EN: "Deduction: Rushing water was intentionally triggered to suppress the auditory trace of footwear stepping down to the cellar."
    },
    isDiscovered: false
  },
  {
    id: 'theft_partners',
    title: {
      KR: "집사와 방문객의 유착 음모",
      CN: "管家与访客串通合谋",
      EN: "Butler-Visitor Conspiracy"
    },
    description: {
      KR: "추론: 집사의 가짜 잠꼬대 허위 진술은 복도에서 마주친 방문객의 고속 장비 탈출 이동 경로를 은폐하고 공조하기 위함이었습니다.",
      CN: "推论：管家故意在口供中撒谎，实际上是为了给访客在客厅与后院廊道的移动争取时间，两人在此案中达成了分赃共识。",
      EN: "Deduction: Butler fabricated his alibi to mask and buffer the high-speed hallway trespass route of the conspiring Visitor."
    },
    isDiscovered: false
  },
  {
    id: 'chemical_theft',
    title: {
      KR: "의학 용제를 사용한 무소음 탈취",
      CN: "专业药剂腐蚀盗窃法",
      EN: "Medical Solvent Corruption"
    },
    description: {
      KR: "추론: 의학 용제를 이용해 유리 락킹을 도포하여 실시간 녹인 장인은 강력한 채무 독촉에 시달린私人 의사 본인이었습니다.",
      CN: "推论：腐蚀玻璃柜锁的高纯度溶剂正是来自私人医生的药学实验室，由于严重的金钱危机，医生里应外合窃取了圣佩特吊坠。",
      EN: "Deduction: Lock melting with high-grade organic laboratory solvent traces are tied directly to the heavily debt-ridden Doctor."
    },
    isDiscovered: false
  }
];

export const COMBINATION_RULES: DeductionRule[] = [
  {
    id: 'rule_water',
    clueIds: ['dripping_sound', 'footsteps'],
    resultClueId: 'water_cover',
    alertMessage: {
      KR: "[비정상적인 유수음] + [황급한 발자국] 결합 성공! 방수는 다른 신체 이동 소음을 가리기 위해 고안된 책략임이 밝혀졌습니다.",
      CN: "成功结合 [厨房异常流水声] + [仓促脚步声]！推断蓄意防水是为了用水声掩盖仓促潜逃至酒窖的声响。",
      EN: "Combined [Abnormal Dripping] + [Rushed Footsteps] successfully! Proves water was rushed deliberately to mask cellar movement noises."
    }
  },
  {
    id: 'rule_partners',
    clueIds: ['butler_lie', 'visitor_ticket'],
    resultClueId: 'theft_partners',
    alertMessage: {
      KR: "[집사의 거짓 알리바이] + [방문객의 크루즈 표] 결합 성공! 집사는 방문객의 도주 타임라인을 확보하기 위해 동맹을 은폐했습니다.",
      CN: "成功结合 [管家的虚报谎言] + [访客的逃亡船票]！揭露管家涉嫌协助外来访客撤离并在此前提供内应支援。",
      EN: "Combined [Butler's fabricated alibi] + [Visitor's escape ticket]! Exposes a direct heist collaboration between the resident servant and buyer."
    }
  },
  {
    id: 'rule_chemical',
    clueIds: ['broken_cabinet', 'doctor_motive'],
    resultClueId: 'chemical_theft',
    alertMessage: {
      KR: "[녹아내린 잠금장치] + [의사의 부채 장본] 결합 성공! 의사는 빚 때문에 자신의 약학 유물 용제로 절도를 수행했습니다.",
      CN: "成功结合 [熔毁的展示架锁] + [医生的债务单]！证实急需用钱的医生利用药学实验室强溶剂实现了无噪音腐蚀开锁，是实际执行人员。",
      EN: "Combined [Melted Glass Lock] + [Doctor's Debt Slip]! Proved the Doctor bypassed the lock using clinical organic solvents to resolve his bankruptcy."
    }
  }
];

export const SUSPECTS_DATA: Record<string, Omit<NPC, 'avatar' | 'outburstAvatar'>> = {
  Butler: {
    id: 'Butler',
    location: 'LivingRoom',
    name: { KR: "루돌프 (Rudolf / 집사)", CN: "管家（雷德菲尔德）", EN: "Butler (Rudolf)" },
    occupation: { KR: "수석 대저택 관리 집사", CN: "资深内务管家", EN: "Head Estate Butler" },
    profile: {
      KR: "저택에서 12년간 성실하게 근속해 온 원로 집사. 겉보기엔 매사 냉정하고 헌신적이지만 속내를 잘 드러내지 않습니다. 부부 불화로 최근 이적 자금이 필요했다는 증언이 들립니다.",
      CN: "在此别墅服侍超过12年的老管家，行事低调古板。表面上忠心耿耿，但由于最近外贸投资遭遇洗劫，私下急需大量应急流动资金。",
      EN: "A highly meticulous head servant of 12 years. Seemingly dedicated and flawless, but rumors suggest heavy secret asset loss inside foreign shipping deals recently."
    },
    testimony: {
      KR: "‘저는 23:00 정각에 안뜰 구역의 침실에서 완전하게 깊이 잠에 들었습니다. 자정 가까이 깨어난 주인님의 호출 소리를 들을 때까지 가재 수납장 앞이나 복도 구역으로 전혀 발걸음을 옮긴 적이 없다니까요!’ (고용인 메이드가 23:15 수납장 앞에서 당신을 보았다고 합니다. 모순되는 단서를 들이미세요.)",
      CN: "‘大约在23:00，我就按照老规矩关上了后门，回到自己的下人房入睡了。在别墅内，直到大火或警报惊醒主人之前，我绝没有半夜出去在走廊或者陈列柜旁边徘徊，那简直是无端指控！’（证人女佣在23:15分清晰撞见其在过道柜橱闪烁，拿出[管家虚报时间]来击破他的谎言！）",
      EN: "'I securely locked the servant gate and checked into my bed exactly at 23:00. I absolute never sneaked into the corridors, nor approached the showcase. Pure nonsense!' (Maid reported seeing him at 23:15. Present [Butler's Fabricated Alibi] to shatter his claims.)"
    },
    contradictionClueId: 'butler_lie',
    gavelSuccessText: {
      KR: "(쾅쾅쾅! 법槌 타격!) 집사 돌프의 다리가 덜덜 떨리기 시작합니다! 은폐 협조 사실이 드러나며 소리를 지릅니다: '죄송합니다 탐정님! 사실은 방문객이 제 빚을 탕감해주는 대가로 눈을 돌려 달라고 협박했습니다!'",
      CN: "（法槌轰击！震屏振颤）管家双腿开始战栗，满头虚汗！“对、对不起！访客答应帮我偿还外债，只要我今晚提前打开了走廊后门且假装没看见他，并帮他遮掩，我…我没有偷项链，凶手是他！”",
      EN: "(Gavel Slam! Screen Shake!) The Butler begins to sweat heavily! 'I... I apologize! The Visitor promised to pay off my loans if I unlocked the hallway door and acted as look out! He executed the theft, not me!'"
    },
    emotion: 42,
    isOutburst: false
  },
  Maid: {
    id: 'Maid',
    location: 'Hallway',
    name: { KR: "클라라 (Clara / 메이드)", CN: "女佣（安娜）", EN: "Maid (Clara)" },
    occupation: { KR: "저택 가사 전담 관리인", CN: "全职后勤女佣", EN: "Household Maid" },
    profile: {
      KR: "자정이 가까웠지만 물걸레 청소와 주방 살림 보조를 보던 충실한 가용 하우스키퍼. 저택에 드나드는 모든 사람들의 수상한 시간대 무선 동선을 관찰했습니다.",
      CN: "勤劳单纯的兼职年轻女佣，案发当晚负责收拾餐厅和厨房，对23:10点左右客厅发生的异常响动和后院流水的响动深表怀疑。她并没有偷盗物证，但掌握着揭穿管家的关键证词。",
      EN: "An observant servant managing nighttime kitchen cleaning and supplies. Witnessed several odd sound patterns near 23:10."
    },
    testimony: {
      KR: "‘전 23:10부터 23:25분까지 계속 서쪽 복도 바닥의 가벼운 카펫 오염을 문지르느라 여념이 없었어요. 그때 23:15쯤 집사 돌프 님이 분명 수납장 곁을 지키며 좌우를 획획 두리번거리더군요. 주방에선 누군가 수돗물을 콸콸 크게 튼 소리도 동시에 복도까지 이어져서 나더라고요.’",
      CN: "‘案发当晚，我一整晚都在走廊深处辛勤擦洗地毯上的果汁渍。大约在23:15分左右，我发誓我绝对看到管家神色极其慌张地把手伸进走廊配药钥匙橱里，而厨房那个时候更是有异常的放水声音传出来。’",
      EN: "'I was busy scrubbing stains off the main rug from 23:10 to 23:25. I distinctly saw the Butler nervously searching the key cabinet at 23:15. At the exact same time, loud water rushing echoes burst out from the kitchen.'"
    },
    contradictionClueId: '', // Companion, not the lie-merchant
    gavelSuccessText: {
      KR: "그녀는 무고한 증인입니다. 성실하게 자신이 알고 있는 도주로 사운드를 증명해주고 있습니다.",
      CN: "女佣为无辜目击者，未发现谎言。她真诚地提供了揭穿管家的绝对核心证据。",
      EN: "She is a truthful witness. She correctly supplied the critical detail required to crack the Butler's lie."
    },
    emotion: 25,
    isOutburst: false
  },
  Visitor: {
    id: 'Visitor',
    location: 'LivingRoom',
    name: { KR: "찰리 (Charlie / 방문객)", CN: "访客（卡特）", EN: "Visitor (Charlie)" },
    occupation: { KR: "저택 방문 도매 보석상", CN: "外来珠宝掮客", EN: "Visiting Jewel Buyer" },
    profile: {
      KR: "대저택의 귀빈 전용 게스트하우스에 방을 배정 받았던 수상자. 값비싼 명작 고미술 수집품 《야까마귀의 눈》 거래 타진을 위해 사전에 은밀하게 방문했다고 변명합니다.",
      CN: "受邀拜访别墅的古玩中介商。名义上是来对《夜鸦之眼》进行公允估值并促成交易。但行迹十分可疑，随身携带着凌晨2点的货轮船票，且有与管家密谈的蛛丝马迹。",
      EN: "An opportunistic antiques broker visiting under the cover of buying negotiations. Hidden ship papers indicate plans of sudden overseas flight."
    },
    testimony: {
      KR: "‘하하, 무슨 오해를 하십니까 탐정님! 저는 이 저택의 최고 손님입니다. 도난 시간대인 23:10분엔 제 전용 대기실 소파에서 홀로 따뜻한 홍차를 천천히 마시고 있었을 뿐입니다. 지하실이나 집사와는 한 번도 몰래 대화 조차 조율한 바 없고, 탈출용 선표 같은 것은 애초에 존재하지도 않아요!’ (탈출용船票 [방문객의 船票] 혹은 [집사와 방문객의 유착 음모]를 내보이십시오.)",
      CN: "‘真是荒谬至极，探长！我是来正规采购翡翠吊坠的客商，我的交易身价是几百万，怎么会半夜潜入地窖行窃？23:10到23:20，我一直在贵宾客休室的沙发上抽烟喝茶。至于管家？我连跟他说一句话的兴趣都没有，更没有任何急着离境的准备。’（出示[访客船票]或[管家与访客串通合谋]击碎他的狡辩！）",
      EN: "'Preposterous! I am a high-status buyer. I was sipping tea on the guest lobby sofa from 23:10 to 23:20. I didn't exchange a word with the Butler, nor buy any travel ticket!' (Present [Visitor's Ticket] or [Butler-Visitor Conspiracy] to destroy his lie.)"
    },
    contradictionClueId: 'visitor_ticket',
    gavelSuccessText: {
      KR: "(쾅쾅쾅! 법槌 타격!) 방문객 찰리는 얼굴이 퍼렇게 굳어 비명을 지릅니다: '내 사적인 여객 승선표를 어디서 찾으신 겁니까?! ...맞습니다, 저택 안을 잘 아는 집사가 열쇠를 사전에 복사해 건네줬고, 전 지하실 근처에 귀중품을 일단 감추려 했습니다!'",
      CN: "（法槌痛击！心跳震怒）访客瘫倒在沙发上，捂着大衣口袋嚎叫：“你怎么会知道我有2点离境的船票？！……是的，是我联合了那个渴望债务脱困的老管家。他给我开了后门，并故意弄出些流水声响来混淆女佣把风，但…但最终我下地窖找古董时，装有项链的密室门怎么都撬不开，最终是被别人先捷足先登了！”",
      EN: "(Gavel Slam! Real-time confrontation!) 'How did you get your hands on my early morning ticket?!... Fine! The Butler gave me a duplicate skeleton key. But when I went to the cellar vault, the showcase lock was already melted from inside! Someone else took it first!'"
    },
    emotion: 48,
    isOutburst: false
  },
  Niece: {
    id: 'Niece',
    location: 'Bedroom',
    name: { KR: "벨라 (Bella / 조카녀)", CN: "继承人侄女（塞西莉亚）", EN: "Niece (Bella)" },
    occupation: { KR: "저택 소유주의 직계 조카", CN: "家族遗嘱继承人", EN: "Niece/Heiress" },
    profile: {
      KR: "삼촌의 극심한 금전 유산 독식에 깊은 증오와 불안을 안고 방에 갇혀 살던 직계 연고자. 불안증으로 인해 개인 일기에 유물 탈취 복수를 빼놓지 않고 구사했습니다.",
      CN: "别墅主人的远房侄女，神态焦虑不安。常年忍受伯父对巨额家族遗产的垄断和压榨。她有严重的心率失常和偏执人格，深信《夜鸦之眼》本就是属于自己母亲的历史遗物。",
      EN: "An emotionally troubled niece of the owner. Deeply resentful of the inheritance hoarding, she roamed the corridors with a locked diary of paranoid plans."
    },
    testimony: {
      KR: "‘나는 삼촌의 보석 도난 사건 따위 손도 댄 적이 전무해요! 저녁 밤새 난 가만히 내 방 침대에 정좌하여 미동도 하지 않고 책을 바라보며 사색했습니다. 23:12분에 제 흔적이 복도에 드러났다거나 제 일기에 소동 의혹을 표명한 바 없다니까요!’ (서랍 속 찾아낸 [조카가 작성한 일기장]을 보여 그 거짓말을 허물어 뜨리세요.)",
      CN: "‘我怎么可能会去偷伯父那个肮脏的圣物吊坠？在案发前后（23:00~23:30），我由于偏头痛发作一直躺在卧室里闭目养神，根本没走出屋门半步，更不可能有任何意图夺取它的文字记录！’（当其撒谎时，出示搜查自床头柜的[侄女日记]当庭打破谎言！）",
      EN: "'I never touched that cursed jewel! I was resting in my room all night, reading and meditating. I never wandered at 23:12!' (Present [Niece's Journal] to crack her timeline lie.)"
    },
    contradictionClueId: 'niece_diary',
    gavelSuccessText: {
      KR: "(쾅쾅쾅! 법槌 타격!) 조카는 머리를 쥐어싸고 눈물을 왈칵 흘립니다: '네! 제 일기를 보셨군요! 하지만 저는 그날 밤 가득한 환청 때문에 복도로 나갔을 뿐입니다, 장식장을 열 수 있는 용제 같은 유기화합공학 지식 따윈 제겐 없어요!'",
      CN: "（法槌重击！震撼长鸣）侄女痛苦地抱住头，眼泪滑落：“对、对！日记写满了我对他们的恨意！23:12分我拿着发卡试图去撬客厅那个玻璃柜门，但我连铜锁都打不开，更没有药剂。而且我很快就看到私人医生带着白手套和试剂瓶走进了客厅，我吓得立刻钻回了二楼卧室！”",
      EN: "(Gavel Slam!) She covers her face crying: 'Yes, it's true! I wrote those things and went down at 23:12. But I only had a safety pin, and the cabinet was locked fast. I returned to my room after running away in fear when I saw the Doctor carrying chemical vials!'"
    },
    emotion: 50,
    isOutburst: false
  },
  Doctor: {
    id: 'Doctor',
    location: 'WineCellar',
    name: { KR: "하비 (Harvey / 주치의)", CN: "私人医生（哈维）", EN: "Doctor (Harvey)" },
    occupation: { KR: "저택 소유주의 전담 주치의", CN: "全职家庭私人医生", EN: "Household Doctor" },
    profile: {
      KR: "저택에 고용되어 상주하며 주인의 약 제조를 해 오던 엘리트 화공의사. 외견상 친절하지만, 이면엔 불법 실험실 사채 빚 독달에 허덕이며 약제 보관을 독점하는 어둠이 있습니다.",
      CN: "名校毕业的生物药学博士，受雇驻扎在别墅为主人调配心脏病用药。谈吐优雅，但其实背地里卷入了高利贷纠纷，因违规研制活性化合物面临巨额破产索赔。掌握最关键作案手法，也是真凶。",
      EN: "A highly educated resident physician hiding catastrophic debts. He possesses access to the private pharmacology lab and professional solvent inventory."
    },
    testimony: {
      KR: "‘탐정님, 전 의료적인 헌신만을 알고 있는 무고한 의학자입니다. 23:15분 도난 당시에 지하실 등에서 소음을 은폐할 필요 따윗 없었으며, 그런 복잡한 화학 전이 약액 용제를 사용하거나 채무로 압박을 겪은 적은 일절 단호히 없습니다!’ (결정적 증거 [의학 용제를 사용한 탈취] 또는 [의사의 부채 증서]를 제시하세요.)",
      CN: "‘探长，我身为别墅主人的全职医疗顾问，享受着极高的社会地位和稳定薪水，有什么理由自毁前程去盗窃？我晚上23:10起一直在地窖冷存心脏提取素，从没有听到任何走廊后门那里的流水诡计，更没动用过实验室里的任何溶剂去毁灭挂锁。’（出示组合推论[专业药剂腐蚀盗窃]或[医生的债务单]将他彻底锁定击碎！）",
      EN: "'Detective, I am a simple medical servant with high salary. I have absolutely zero debts, nor did I melt any glass locks with laboratory reagent chemicals!' (Confront him with [Medical Solvent Corruption] or [Doctor's Debt Slip] to secure victory!)"
    },
    contradictionClueId: 'chemical_theft',
    gavelSuccessText: {
      KR: "(쾅쾅쾅! 법槌 타격!) 의사 하비의 다리에 힘이 빠지며 와락 쓰러집니다! '아... 말도 안 돼! 내 실험실 용제 성분까지 지문으로 규명하실 줄은... 맞습니다! 빚에 떠밀렸습니다, 방문객 찰리가 실패하고 빠져나간 직후 제가 흔적 없이 신장을 녹여 가져간 것입니다!'",
      CN: "（金色审判！法槌巨震！）哈维的镜架几乎滑落，面色惨白地跌坐在酒桶前：“你竟然能重组这套逻辑，并锁定了我的债务与实验用剂熔毁证据……对，是我做的！我用‘环己烷’溶剂完全消融了那个老旧滑轮锁扣，在23:16潜入客厅拿到了夜鸦之眼。但我没想到，我把项链藏在酒窖隐形地格刚出来，就被你们堵在了这！”",
      EN: "(True Culprit Broken! Gavel Thuds!) Dr. Harvey kneels down, totally defeated! 'Unbelievable... You connected the chemical lock degradation directly to my pharmacology loan debt... Yes! It indeed was me. I melted the lock silently at 23:16 and hid the necklace inside the cellar threshold floorboards just minutes ago!'"
    },
    emotion: 60,
    isOutburst: false
  }
};
