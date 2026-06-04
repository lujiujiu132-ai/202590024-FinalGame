// Local offline dialogue simulation engine for Midnight Suspicion
// Fully supports English, Korean, and Chinese with reactive emotional thresholds.

export function parseDriveLink(link: string | undefined): string {
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

export function calculateStressImpact(text: string, lang: string): number {
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

export function generateOfflineSmartResponse(
  npcId: string,
  message: string,
  language: string,
  currentEmotion: number,
  isOutburst: boolean
): string {
  const lang = language || 'KR';
  const query = message.toLowerCase();

  // Categories helper
  const isAlibiQuery = /time|where|hour|clock|23:|midnight|alibi|sleep|bedroom|room|lock|witness|시간|어디|시분|알리바이|자정|침실|잠|시간|방|목격|时间|在哪里|卧室|睡觉|当时|做什么|23|几点|走廊/.test(query);
  const isJewelQuery = /necklace|eye|jewel|pendant|antique|stole|thief|steal|ruby|case|box|보석|야까마귀|눈|목걸이|도둑|훔쳐|절도|골동품|상자|수납|项链|夜鸦之眼|宝石|偷|盗窃|盗首|藏|柜/.test(query);
  const isMotiveOrDebtQuery = /debt|money|solvent|melt|bankrupt|chemistry|reagent|liquid|finance|pay|loan|빚|돈|부채|파산|용제|시약|화학|녹아|수돗|용액|물소리|지하|주방|债务|溶剂|环己烷|破产|钱|熔毁|实验室|欠债|水龙头|流水|水声|药/.test(query);
  const isConspiracyOrOtherQuery = /clara|rudolf|harvey|bella|visitor|doctor|maid|niece|butler|co-conspiracy|partner|accomplice|클라라|루돌프|하비|벨라|조카|집사|메이드|의사|공범|공모|安娜|管家|医生|侄女|塞西莉亚|访客|卡特|共谋|同伙|同谋/.test(query);

  const variations: Record<string, {
    alibi: Record<string, string[]>;
    jewel: Record<string, string[]>;
    motive: Record<string, string[]>;
    conspiracy: Record<string, string[]>;
    general: Record<string, string[]>;
    outburst: Record<string, string[]>;
  }> = {
    Butler: {
      alibi: {
        KR: [
          "23:00분 정각에 침실에 들어간 뒤 밤새 깊이 곤히 잠에 복종해 있었습니다. 외부 복도 상황은 전혀 아는 바 없습니다.",
          "시간이 무슨 소용입니까? 저는 23:00 이후 방을 비우지 않았습니다. 메이드가 무언가 어둠에서 착각한 것이 분명합니다.",
          "그 시각 저는 침실에서 장부 정리를 마친 뒤 곧바로 안정을 취하고 있었습니다. 저를 의심하는 처사는 참담하기 그지없군요."
        ],
        CN: [
          "大概在当晚 23:00，我就锁好后门回到佣人房休息了，这是我服侍公爵多年雷打不动的规律。女佣看到的可能只是夜色里的重影。",
          "23:10以后我绝对合衣安歇在我的卧室，我这个年纪一旦睡沉了，周遭的水流声或其它异动根本听不见分迎。",
          "侦探先生，我23:00就开始睡眠了。如果女佣指控我 23:15 还在大厅或钥匙橱柜附近活动，那纯粹是她神经过敏的胡言乱语。"
        ],
        EN: [
          "I retired directly to my bedroom at exactly 23:00. An old servant keeps absolute punctual hours. I have no idea about hallway movements.",
          "Check the clocks, Detective. I locked the gate at 23:00 and slept soundly until the owner's emergency alert woke me. Clara is mistaken.",
          "I stayed strictly inside my room from 23:00 to 23:30. To question a head butler's night schedule is highly discouraging."
        ]
      },
      jewel: {
        KR: [
          "그 고귀한 보석 '야까마귀의 눈'은 대저택 소유자분의 자랑이었습니다. 저처럼 늙은 고용인이 그런 파렴치한 유혹에 흔들리겠습니까?",
          "유물 장식장은 거실 한가운데에 단단히 유리로 주밀하게 폐쇄되어 있었습니다. 분수에 넘치는 화려한 돌멩이일 뿐입니다.",
          "보석 미술의 시세나 가치는 무지한 편입니다. 그 도난 사실 자체가 저택에 복무해 온 저로서는 크나큰 불명예일 뿐입니다."
        ],
        CN: [
          "《夜鸦之眼》是具有古老传承的帝国遗留物，我平日只是拿鹿皮做日常打理擦拭，充满敬望，怎么会有不轨企图？",
          "客厅展示柜高锁深藏。我这个快退休的生计仆人，拿着那颗受灾难诅咒的血红吊坠，毫无变现途径甚至会引火烧身。",
          "失窃让整个府邸陷入警务阴影，这是对执事信誉的最耻辱打击！我恨不得早日让这场风暴彻底查明事实真相。"
        ],
        EN: [
          "The legendary 'Eye of the Night Raven' represents decades of royal design. A loyal butler has zero financial claim over such treasure.",
          "The crystal case in the living room was secure. Master kept the physical key heavily guarded. Why would I want such a hot gem?",
          "The gemstone is highly distinct. It is impossible to trade without immediate global alerts."
        ]
      },
      motive: {
        KR: [
          "주방 배수관에서 흐르던 비정상적인 물소리라니요... 저는 그것과 어떠한 물질적 연계도 지니고 있지 않습니다.",
          "오물 배수나 조리기구 세척 수돗가 잠금장치는 제가 일상 관장하지만, 심야에 흐르던 누출액 상황에 대해선 지각하지 못했습니다.",
          "채무 관계 소문은 참으로 허망합니다. 집안의 하급 비용 지출 문제로 소소한 논란이 인 것을 과장하여 곡해하지 말아 주십시오."
        ],
        CN: [
          "水龙头的放水声音在寂静夜晚确实很遮盖行踪。但这套把戏与我无关，我没有理由在23:15去拧开水闸。",
          "账目上的轻微波动只是普通的家族理财投资亏损，离所谓的严重欠款倒闭还远着呢！你们侦探总是如此捕风捉影吗？",
          "后厨任何泄水痕迹，通常只有在场负责或者想要洗干嫌疑的人才会走近。我认为应当追问一直呆在主厨房的女佣。"
        ],
        EN: [
          "The running faucet in the kitchen near 23:15 was completely outside my inspection block. I did not open any valves.",
          "Our domestic accounts are healthy. Do not trust kitchen rumors about private ledger loans or debts on my side.",
          "A rushing drainage tap serves nicely as an auditory screen, but executing such tricks is below my standard domestic conduct."
        ]
      },
      conspiracy: {
        KR: [
          "최근 부채서 소문이 도는 주치의 하비와, 심야 선표를 숨긴 방문객 찰리는 극도로 의심스러운 인행입니다.",
          "메이드 클라라 또한 밤낮 전후로 거동이 단조롭지 못했고, 비밀 일기를 몰래 도포하는 조카 벨라도 복도를 서성였습니다.",
          "소액의 자물쇠 키 관리를 의뢰받았던 방문 딜러가 있었습니다. 혹시 그와 집사 사이의 누명을 꾸미려는 이들의 소행이 아닐지..."
        ],
        CN: [
          "私人医生哈维先生近来在地窖配药，把地下室大门反锁，极其神秘。为什么不去重点核实他的实验室文件呢？",
          "外访 珠宝评估商查理携带着奇怪的凌晨船票，半夜不眠，他跟任何人都不曾提及他真实的意图。",
          "伯爵的侄女塞西莉亚经常抱着密码锁日记本写泄愤词汇，案发当晚她甚至拿着金属别针在展示柜附近出没！"
        ],
        EN: [
          "Resident Doctor Harvey has been highly defensive about his pharmacology closet downstairs in the cellar. Explore his lab keys.",
          "That visitor Charlie matches the classic description of a fugitive, hiding emergency cruise passages while claiming idle tea.",
          "The niece has been expressing explosive resentments in her diary. She roamed near the showcases too!"
        ]
      },
      general: {
        KR: [
          "흠... 그 사건 단독 항목에 대해선 제가 이렇다 할 풍부한 변론을 소장하고 있지 않습니다.",
          "수사관님, 저는 평생 이 집안의 기품과 원칙을 지켜왔습니다. 엉뚱한 변변치 않은 말들로 저를 유혹하지 마십시오.",
          "밤 깊은 시각의 질문치고는 맹점이 크군요. 다른 거시적인 상황 증거들을 연결시켜 보시는 것을 권유합니다.",
          "비가 격정적으로 내리쳐 제 노후 관절조차 시큰거리는 군요. 더 정밀한 사안에만 집중해 주시지요."
        ],
        CN: [
          "探长，我想我们应该把有限的时间放在核心金库锁熔毁、以及时间线索关联等绝对实证上，而不是在边际常识闲扯上。",
          "关于这一点，恕我作为多年老执事并无法给你超出常规的无稽猜测。请自便。",
          "窗外的风雨太大，我这个年纪实在禁不起这种反复逻辑审讯，请问有更关键的交叉指证吗？",
          "如果您想通过一些套近乎、或者旁敲侧击的琐细问题让我露出破绽，那我只能说您找错了对象。"
        ],
        EN: [
          "I possess very limited domestic knowledge regarding that tangential topic. Let's return to the stolen ruby timeline.",
          "Detective, my duty is strictly inner organization of the main villa. Let us center our minds on used physical items.",
          "That question relies heavily on speculation. Please coordinate your clues on the pinboard for better insights.",
          "The thunderstorm has been rattling our windows. I suggest exploring direct material items rather than verbal traps."
        ]
      },
      outburst: {
        KR: [
          "그 고약한 메이드가 제 목격담을 날조했다는 겁니까?! ...아니, 조용히 보관함 근처를 1분간 살핀 건 맞지만 절도와는 천만 부당한 누명입니다!",
          "제 복도 도보가 곧 보석 갈취라니 터무니가 고장 났군요! 왜 이리 제 존엄과 명예를 범죄 수준으로 학대하시는 겁니까?!",
          "조카와 방문객의 일탈은 대놓고 수수방관하시면서 정직한 은퇴 예정 집사만 맹공격하시다니 기가 차는군요!"
        ],
        CN: [
          "那个刁妇说看清了我……？！不，这绝对是蓄意歪曲！我当晚去钥匙柜，仅是为了二次确保防潮箱牢固上锁！你们不能把项链失窃这么大一顶脏帽子轻易扣在我头上！",
          "够了！不就是一次普通的夜间廊道停留吗！因为这一个小细节就把我推到犯罪狂潮的最前端，你们的侦探逻辑简直粗鄙不堪！",
          "管家就没有尊严了吗？我在这个庄园风风雨雨十几载，难道就为了贪图一颗惹祸的石头自毁名节？！你们在逼供！"
        ],
        EN: [
          "Clara claims she saw my eyes at 23:15?! Preposterous! I merely went to double check the locks on the cabinet! That does not make me a ruby thief!",
          "I will not tolerate this harassment! A simple minute standing in the hallway is transformed into a heist mastermind plan?! You are cornering me!",
          "You ignore the shady doctor and the panicked niece, preferring to torture an elderly butler nearing retirement! Unbelievable!"
        ]
      }
    },
    Maid: {
      alibi: {
        KR: [
          "저는 23:10부터 23:25분까지 성실히 복도 모퉁이 가벼운 오염을 문지르느라 한눈팔지 않았습니다.",
          "23:15분에 복도 중앙의 집사 돌프 님의 수상망측한 몸동작을 똑바로 지각했습니다. 제 야간 당직 시간은 명백한 진실입니다.",
          "제 알리바이는 가혹한 가사 소모로 충만해 있습니다. 주방 수돗물을 세차게 방출할 빈틈 같은 건 없었습니다."
        ],
        CN: [
          "当晚23:10至23:25分，我正跪在走廊东端全力擦洗地垫上的橘子汁印记，一抬头正好注意到了管家探头探脑的怪异姿势。",
          "我作为唯一的全勤清洁女佣，大半个深夜都在擦抹客厅到走廊过渡带的灰尘，对于谁经过走廊我心里有一本清晰的账本。",
          "在门房发誓我绝不敢说半句假话。23:15分管家假装在钥匙柜整理东西，但我分明听见柜门铁钩剧烈碰撞发出清脆的回响。"
        ],
        EN: [
          "I was busy scrubbing stains off the main rug from 23:10 to 23:25. I was entirely focused on my manual duties.",
          "At exactly 23:15, I witnessed Butler Rudolf's highly odd behavior of checking the key supply closet. It was terrifying.",
          "My shift log is verifiable. I had to scrub all dirt marks from the storm's footsteps before calling it a night."
        ]
      },
      jewel: {
        KR: [
          "야까마귀의 눈이요? 그런 눈부신 고가 유물을 제 봉급으론 평생 구경조차 할 엄두가 나지 않아요.",
          "삼촌 분의 보석은 매우 눈부셔 저택 하인들 사이의 최대 로망이었습니다. 하지만 사라지다니 불길한 신호입니다.",
          "보석 함이 화학 약액으로 뭉그러져 녹았다고 전해 들었습니다. 쇳덩이를 녹이는 약이라니 듣도 보도 못한 가공할 기술이에요."
        ],
        CN: [
          "我只是个辛勤劳作的普通清洁女工，那个据说价值十万英镑的红宝石《夜鸦之眼》平时除尘我都避着走，怎么敢私藏？",
          "听说红宝石切工华美，像受惊野鸦的红眼。那样显眼珍贵的配饰，谁私自携带着立刻就会露嫌，除非早就想好了境外潜逃时间表。",
          "展示架的大锁被人恶意消融了！如果是为了无声无息潜入客厅带走挂坠，那真凶肯定在实验室偷偷做过高强度酸溶化学测试。"
        ],
        EN: [
          "The 'Eye of the Night Raven' is beautiful, but a poor maid has no use for expensive gems that bring bad luck.",
          "I heard custom chemical solvents dissolved the crystal cage with zero noise. Such science is beyond normal workers.",
          "That crimson pendant is too magnificent to carry. Police would capture any runaway trying to trade it immediately."
        ]
      },
      motive: {
        KR: [
          "23:15분에 주방 배수관에서 세찬 수류 마찰 소리가 갑자기 폭성으로 돌렸습니다! 저는 제 당직실 외부 일인 줄 알고 전율했습니다.",
          "주방 청소 용지와 수돗가 급류는 가동되지 않아야 하는 시간인데 크게 울려 퍼졌습니다! 누군가 소리를 가릴 의도였던게 아닐까요?",
          "저는 절대 빚에 쪼들리지 않아요! 제 검박한 은행 예금과 정직한 땀으로 성실하게 내무 노임을 정립하고 있습니다."
        ],
        CN: [
          "23:15厨房的水声实在是太刻意、太狂暴了！就像是有人故意要把水龙头开到最满，以此冲水巨响掩护什么剧烈撞击或奔跑声。",
          "我的工资虽然微薄，但我家里从没欠下过任何不可饶恕的高利贷催缴单。只有地底下的那几位才会常常为此抓狂。",
          "水槽的隔网被放了很多热水洗刷，甚至当时散发出隐秘的浓重化学试剂味，这太反常了。"
        ],
        EN: [
          "The roaring faucet inside the kitchen at 23:15 was incredibly loud. It was definitely meant to muffle intense running noises.",
          "I budget my wages very carefully. I don't have catastrophic loans like those scientific folks hiding downstairs.",
          "The under-sink pipes smelled highly organic and metallic late last night, as if someone flushed something acidic down."
        ]
      },
      conspiracy: {
        KR: [
          "집사 님은 거실에 복도 후문을 사전에 조율했고, 방문객은 새벽 배표를 준비했으니 둘의 관계를 긴장하게 보아야 합니다.",
          "의사 하비는 고리 사채 독촉장에 시달려 늘 신경이 날카로웠어요. 지하실에서 매일 무서운 시약을 배합해 오더군요.",
          "조카 벨라 아가씨는 삼촌을 원망하는 가시 돋친 일기 수첩이 있었답니다. 밤늦게 손톱장치를 들고 거울 복도를 활보했지요."
        ],
        CN: [
          "我觉得管家大晚上的总在帮外来访客卡特跑前跑后。他们深夜在后花园小声密谋分赃，全被我扫地时隐约听到了几句！",
          "哈维医生脾气越来越暴躁，有几次我进他药房打扫，居然在地毯下扫出了他违规药业催讨的最后警告函，数额特别吓人。",
          "继承人塞西莉亚少女性格敏感，她在日记里发誓要把属于母亲的家产强夺回来。她对溶剂化学也是有些基础了解的。"
        ],
        EN: [
          "The Butler was overly catering to that guest Charlie. They spent late evening whispering about exit channels.",
          "The doctor has been incredibly frantic. I swept underneath his lab and found heavily stamped medical debt notifications.",
          "Miss Bella the niece keeps writing angry things in her journal, roaming key areas late with small lock-picking pins."
        ]
      },
      general: {
        KR: [
          "제가 복도 카펫 외에 인지할 수 있는 구역 경로는 매우 소외되어 있습니다.",
          "수사관님, 저는 사건에 성의를 다해 아는 정보의 정직성을 고백했습니다.",
          "그 항목에 관해선 들은 소문조차 아득하네요... 다른 더 큰 수사 지점에 집중해 주세요.",
          "새벽 카펫 세제 냄새 때문에 현기증이 납니다. 저를 구제해 주세요."
        ],
        CN: [
          "探长，我只是负责干累活粗活的小侍女。你问我的这些深奥事，我实在不太懂得该怎么圆满回答。",
          "其实，只要把我们在走廊踩到的鞋印，同大伙所站的位置做对照，大体的主谋轮廓就已经完全浮现了不是吗？",
          "我真的是毫无保留。请相信一个无权无势、在风雨夜里只想着赶紧搞完卫生回去歇息的打工人的真诚口供吧。",
          "这些复杂的猜测性问题听得我头痛欲裂。我只知道管家在撒谎，别的我也拿不出更直接的断语了。"
        ],
        EN: [
          "I am just a simple housekeeper. Deep structural analytical logic is best handled by you, Detective.",
          "My evidence reaches only to what my eyes and ears captured during carpets scrubbing. Please test other clues.",
          "The storm gushes draft through our kitchen window. Focus on alibi contradictions.",
          "I hope this investigation concludes rapidly. Interrogating my routine serves no further breakthroughs."
        ]
      },
      outburst: {
        KR: [
          "제 결백한 증언을 억지로 모해하려는 작정이십니까?! 저는 그저 도난 소동 때 복도 카펫만 훔쳐보듯 다리가 저리게 닦았을 따름입니다!",
          "거짓말을 구상할 이유가 없습니다! 밤일을 해 가며 정직하게 일해 왔는데 어떻게 제 구석 정보를 가증스럽게 공격하십니까?!",
          "저는 절도 유물엔 무관하다니까요! 제발 하인의 무해한 안식을 뺏지 마세요!"
        ],
        CN: [
          "为什么连我也要怀疑？！我只是个拿微薄加班费的保洁女工！大半夜我跪在冷冰冰的地上擦果汁，招谁惹谁了？！我提供管家的线索那是千真万确的线索，绝对没有半个字掺假！",
          "难道穷人的证词就没有法律分量了吗？！你们侦探居然把我和同谋混为一谈，这简直欺人太甚！我没有拿项链，也没有碰过什么熔毁试剂！",
          "别逼我了！我真的一直都老老实实呆在厨房周边干体力活，最后水声暴起把我吓了一大跳，我怎么会知道怎么关它！你们这叫欺负弱小！"
        ],
        EN: [
          "Why are you doubting my clean words?! I was on my knees scrubbing sticky stains for pennies under the storm!",
          "I have zero interest in that stolen rubescent antique! My testifying about Rudolf the butler was completely transparent!",
          "Do not scream at a poor cleaning employee! I gave you the core keys to the Case! Why corner me?!"
        ]
      }
    },
    Visitor: {
      alibi: {
        KR: [
          "저는 23:10경 안뜰 객실 전용 데스크 소파에서 따뜻한 홍차를 기울이며 휴식을 채색하고 있었습니다.",
          "고속 이동 선표 따윈 제 가방에 부재합니다. 저는 그저 미술 보석 가격 절충을 조율하기 위해 장기 투숙하고 있었습니다.",
          "시간의 빈틈은 단지 한가한 휴식일 뿐입니다. 집사와의 은밀한 심야 대화설은 소모성 중상모략에 불과합니다."
        ],
        CN: [
          "哈，真是离谱。23:10到23:20这段关键空档，我正一个人在温煦的贵人接待室里，给自己倒了一杯顶级的阿萨姆红茶小憩呢。",
          "不要把我当成普通的急躁窃贼，探长。我在珠宝行业身价极高，根本没有理由穿着大风衣深夜在潮湿的走廊去钻研物理箱套锁。",
          "我整晚都没有迈出客休区，更不曾在所谓的 23:15 分向该死的管家打听备用化学钥匙，这纯属无端指责。"
        ],
        EN: [
          "I was reclining gracefully on the red velvet lounge sofa in the VIP guest zone around 23:10, nursing imported black tea.",
          "My business reputation is massive, Detective. There is no logistical logic under which I would crawl through cellar grates.",
          "Your clocks are severely misaligned if you suspect my timeline. Rudolf the butler handles keys, I merely evaluate art pieces."
        ]
      },
      jewel: {
        KR: [
          "야까마귀의 눈은 전설적인 황가 역작 펜던트로서 제 보석 유통 제국에 꼭 유치하고 싶던 탐도 대상인 건 사실입니다.",
          "도난당한 장신구의 완벽한 붉은 광선은 사기적 가치를 소장합니다. 그러나 제 법적 수취가 아닌 비열한 무단 탈취는 규율 밖입니다.",
          "유리 락 장치가 조용히 녹아내렸다면 의사 하비 같은 화공 특기자가 개입했음이 백해무익하게 무단 돌연 사실화됩니다."
        ],
        CN: [
          "《夜鸦之眼》的红宝石色泽夺目，反射光谱堪称艺术神迹。我此行正是为了拿下它的全球独家代理权，而非野蛮劫取它。",
          "如此璀璨又标志性的赃物放在公开市场上根本卖不掉，只有拿到海外暗网拍卖行进行买断，所以出境逃匿时间极为严苛。",
          "展示柜受高纯度药物溶剂损坏，这种犯罪创意让我叹为观止。不过只有常年支配临床试验药品的人才能这么高雅作案。"
        ],
        EN: [
          "The 'Eye' is indeed an elite ruby pendant of historical weight. I was negotiating its legal purchase.",
          "A hot piece of royal art is impossible to sell domestically. It must be quietly shipped via structured routes overseas.",
          "Melting a mechanical lock with lab compounds requires deep chemistry training, not general broker toolkits."
        ]
      },
      motive: {
        KR: [
          "주방의 낙수 세례와 제 비즈니스 파산설은 완전한 허위 적립입니다. 저는 탄탄한 투자 지분을 다량 소장하고 있습니다.",
          "저택의 물소리가 발길 편차를 메우기 위해 활용되었다는 거시 조각 지점은 수긍이 가는군요. 단지 제가 꾸민 일은 아니란 겁니다.",
          "선표는 개인 해외 여행 취미에 동반된 부산물일 뿐입니다. 보석 판매와 직행되는 증명과는 거리가 요원합니다."
        ],
        CN: [
          "我确实拥有一张凌晨两点的紧急起航客运票，但这只是为了随时赶赴东非的另一个极其重磅的古玩竞价大案，这叫商业效率！",
          "厨房水闸爆响的时间，客观说刚好和有人急行军下地底的时间重合，这显然是在人为利用水流噪音遮断脚步。有意思的战术。",
          "别提债务了，我的流动现金储备充沛极极。真正急着用钱到快要破产、甚至实验室惨遭法院强封的，恐怕是私人医生哈维先生吧。"
        ],
        EN: [
          "My early departure boat ticket is a standard travel backup for regional diamond shows. Do not paint a suspicious face on it.",
          "The roaring faucet layout fits high-intensity noise muffling, but I prefer elegant direct deals rather than running down damp cellars.",
          "Compare our balances! While I handle capital, others inside this house are suffering brutal corporate bankruptcy closures."
        ]
      },
      conspiracy: {
        KR: [
          "집사 돌프 녀석은 의외로 유착 유도가 쉬운 부부 불화 근로자더군요. 다른 더 큰 금융의 진실을 캐보십시오.",
          "주치의 하비는 파산 상태이며 화학 물질을 마음대로 남용할 수 있는 최고 순도의 유일한 강탈 지목인입니다.",
          "이 귀여운 조카 벨라도 무언가 수납 수평을 깨기 위해 수많은 밤을 밤새 눈물로 지샜습니다. 조카 일기를 구경해보세요."
        ],
        CN: [
          "老管家最近家庭失和、投资惨淡。只要给他开出一个无法拒绝的高价，他自然会乐意在深夜关照一下后门锁闭情况。",
          "哈维医生是个背负惊人高利贷的破产赌徒。而且最关键的是，他掌握着溶剂化学试验基地的钥匙。这简直不言自明！",
          "小继承人侄女日记里写满了对伯父抢占遗产的深沉毒辣仇恨。她深夜带了别针去试探铁锁，估计是打退堂鼓了。"
        ],
        EN: [
          "The elderly butler is vulnerable; an strategic bribe of debt relief often causes such gatekeepers to look away.",
          "Dr. Harvey has been cornered by clinical bankruptcies. Only he commands the required chemical solvent cyclic formulas.",
          "The niece has been expressing fierce rage inside her lockbox journal. Her alibi profile is paper-thin."
        ]
      },
      general: {
        KR: [
          "그런 하찮은 미시 추론 정보에 대해선 제 보석 수집 거래 장부에 명문화되어 있지 않습니다.",
          "수사관님, 저는 품격과 명성을 다하여 귀하와의 법적인 인터뷰 공간에 성실을 납부해 왔습니다.",
          "핵심 논리보드 단편들의 연관성에 집중하시오. 파편화된 잡담은 수사의 해상도를 탁하게 만들 뿐입니다.",
          "홍차가 다 식어 비린내가 오르는 군요. 제 변호사 인적 자금을 대기시켜야 할 시간이 아닌지 의문스럽네요."
        ],
        CN: [
          "哈，这种毫无营养的审讯问题很难匹配我高档的商业谈吐。侦探，建议您查证更直接的内容去推断。",
          "您连逻辑连接板上的红线都没拽对，却来用一些不相干的小问题试探我？我劝你还是多磨练下办案基本功吧。",
          "外面的风暴真是越来越肆虐了。我的跨国客船一般在风雨大作中也会强行启航，所以我的结案倒计时很紧迫。",
          "我已经在首要答复中把底牌展示清楚。关于那些莫名其妙的小卡片线索，我全不知情，也请少安误躁。"
        ],
        EN: [
          "I keep no domestic notations about minor occurrences outside my professional art trade portfolios.",
          "Detective, let us avoid trivial cross-examination questions and center on structural alibi conflicts.",
          "The clock is ticking towards early morning. My maritime passage is unconcerned with simple household gossip.",
          "Why bother checking insignificant details? Focus your logic board on identifying true technical capabilities."
        ]
      },
      outburst: {
        KR: [
          "당장 소리를 거두세요! 제 선표가 왜 기어코 유물 유실과 다이렉트로 결탁되었다며 고래고래 으름장을 부리십니까?!",
          "은혜를 모르는 집사가 책임을 제게 뒤집어씌운 형국이군요! 저는 지하실 유리 장식장을 부술 유동성 용기 같은 시약을 소유하지 않았습니다!",
          "제 옷깃을 모조리 뒤져봐도 보석 같은 건 안 나올 겁니다! 물적 증거도 없으면서 귀빈 대접을 이렇게 혹독하게 더럽혀요?!"
        ],
        CN: [
          "胡说八道！搜出了出境班联单又说明得了什么？！这仅仅是我的次级备用商业出行合同罢了！管家拿了我的美金同意睁一只眼闭一只眼，但我下地窖开箱时锁锁早特么被人熔成了浆糊！真正的劫匪在你们身边！",
          "谁是同谋？！摆脱你们的粗暴词汇！卡特只做光明正大的古董跨国大宗买卖，不干那帮小打小闹的强融开锁行径！",
          "你们这是对跨国贵客的粗暴外交霸凌！仅凭一张白纸船票就想洗劫我的全部名声声誉？！你们有指纹证据吗？有项链赃物吗？没有就给我放尊重点！"
        ],
        EN: [
          "Silence your slanders! A backup boat ticket matches typical business speed, not a ruby robbery trace!",
          "The coward butler redirected his failure to me! I don't carry heavy chemical locker keys or melting solvents, search me!",
          "Show me the stolen Eye of the Night Raven on my body or in my bags! You have zero proof to treat a gentleman like a crook!"
        ]
      }
    },
    Niece: {
      alibi: {
        KR: [
          "저는 23:10분경 극심한 편두통 강습으로 제 방 침실 구석에서 끙끙 앓으며 안정을 구가하고 있었습니다.",
          "일기장 서랍 속 문구들은 단지 개인 무의식의 표출일 뿐입니다. 23:12분에 제 거동이 복도를 밟았다는 건 억측 전선입니다.",
          "방문을 걸어 잠근 뒤 홀로 분노와 두려움을 희석하고 있었습니다. 삼촌과의 면담은 그날 전혀 조우하지 않았습니다."
        ],
        CN: [
          "我当时疼得像头骨开裂，23:10以后一直用浸了冰水的毛巾敷在额头上，缩在被窝里瑟瑟发抖，连灯都没开过。",
          "日记本上了密码锁，那是我个人的秘密妄想和精神自愈空间。你们无权利用那些对伯父的宣泄文字来直接抵扣我的现实轨迹。",
          "23:05之后我把房门牢牢从内关死，除非有谁在窗台外侧偷听。我发誓我绝对没有去打开一楼的大展示钢锁柜。"
        ],
        EN: [
          "I was suffering catastrophic migraines at 23:10, hiding under my room blankets in near pitch black darkness.",
          "My private locked notebook represents mental escape, not material physical blueprints. I didn't steal anything.",
          "The bedroom doors are heavy oak slabs. I remained strictly inside trying to overcome high emotional heartbeats all night."
        ]
      },
      jewel: {
        KR: [
          "야까마귀의 눈은 원래 돌아가신 저희 어머니 손가락에 소장되어야 했던 저희 집안 정당한 정수 고유물입니다! 탐욕스러운 삼촌이 독식한 것뿐이에요.",
          "삼촌의 금고가 둔탁하게 화학 용질로 문질러 녹았다더군요. 전 기계식 열쇠나 다룰 줄 알지, 화공 지식은 중학교 기초 수준입니다.",
          "보석은 저택의 검은 저주 덩어리입니다. 그것이 차라리 하수구든 어디든 침식되어 사라지는 편이 모두의 가치를 위해 홀가분해요."
        ],
        CN: [
          "那本该属于我外祖母的名下遗留资产！叔公用伪造的赠予协议把它霸为己有！我只是想要拿回它，继承正义！",
          "听说那一层极其厚实的防爆钢化玻璃被医生实验室的高级融剂给腐烂成纸糊一样，我一个弱女子哪来的这种精细工业技术？",
          "圣物吊坠被邪恶的心灵和债务缠死，也许它已经被扔进了某些隐秘的死角或污水槽里，远离这场无休一的争夺纠缠才好！"
        ],
        EN: [
          "The 'Eye' belongs rightfully to my mother's estate before my greedy uncle falsified the central inheritances!",
          "The lock was digested by custom organic chemistry solvents. I barely remember basic high school chemistry classes.",
          "That crimson pendant is infested with negative wealth karma. Part of me hopes it was lost deep down a sewer drain."
        ]
      },
      motive: {
        KR: [
          "주방에서 시원하게 누수되던 수돗물 파동과 제 고충 일기장은 아무런 직통 전선이 서지 않습니다.",
          "집안의 식용 약액을 배급하는 주치의 하비는 막대한 채무를 지니고 매일 저택 지하에 화공 장비들을 밀수했습니다.",
          "저는 유산을 갈취당해 평생 극빈한 자괴감에 시달렸지만 상자를 녹여 문을 부술 도구는 확보할 수 없었습니다."
        ],
        CN: [
          "厨房水管流水的声响？对，那晚我好像确实听到了隐约的剧烈水击声，就像是主犯故意拧大来掩护开锁噪音一样。",
          "私人医生天天对我们颐指气使，而我在收拾垃圾时不止一次看清他那些违约催付单，连他诊所名下的房产都被查封在册了！",
          "要是能把吊坠变现换钱，我的偏头痛 以及 对这栋牢房的终生窒息感也会瞬间治愈。可终究，我还是在罪恶之夜当了逃兵。"
        ],
        EN: [
          "That roaring water splash in the kitchen provides nice sound filters for criminals. But my budget contains no dynamic plots like that.",
          "Dr. Harvey has been cornered by ruthless debt agencies. Look into his professional access to industrial dissolver solvents.",
          "I wanted to reclaim my family's legacy deeply, but physical break-ins with chemical corrosion are way outside my capability."
        ]
      },
      conspiracy: {
        KR: [
          "우리의 주치의 하비를 유의 깊게 관찰해 보세요. 그는 약사 자격을 남용해 매일 밤 복도와 거실 주방을 기괴한 자태로 드나들었습니다.",
          "집사 와 방문객도 심야 밀담을 하며 탈출 계획을 대놓고 협잡하는 기운이 대단했습니다. 수사관 수첩에 이를 연결해 보세요.",
          "메이드 클라라는 사실과 진실을 전하는 단순 일꾼이지만 가끔 보석을 닦으며 지나친 탐욕 섞인 한숨을 포효했죠."
        ],
        CN: [
          "哈维医生才是那个经常和伯父就配药资金大吵大闹的人，他的抽屉里塞满了由于赌博破产带来的催缴通知书！",
          "管家和来访的那个珠宝中介，他们俩常在午夜的后厨门廊前鬼崇握手，进行某种高抽成勾兑的谈判。",
          "女佣安娜平时很勤快，但案发23:15那一秒，她似乎也在探头探脑地追随着走廊那份奇怪的流水声线。"
        ],
        EN: [
          "Seek the truth from Dr. Harvey. He holds exclusive pharmacological credentials and bankruptcy motivations.",
          "The Butler and Visitor Charlie were plotting some sneaky financial transaction on the back porch late at night.",
          "Clara the maid keeps pretending to be a pure witness, but her focus on the kitchen faucet is highly interesting."
        ]
      },
      general: {
        KR: [
          "그 가느다란 구석 정보들에 대해선 제 고가 일기 수첩에 등재한 바조차 희박합니다.",
          "제가 억울한 의심 속에 고통받지 않기를 갈망해요. 머리가 너무 아파 장시간 통화가 가엾습니다.",
          "논리 보드의 매칭 단서에 집중하세요. 사건의 본질을 호도하라는 얄팍한 음모론에 제 지력을 찌푸리고 싶군요.",
          "창문을 두드려 치는 비 소리 때문에 이 안뜰 옥탑이 무너질 것만 같아 몸서리쳐집니다."
        ],
        CN: [
          "探长，关于这个不太着力的无关提问，我紧咬的心扉很难吐露出您想要的发散结论。请把精力对准凶手。",
          "您如果不能在白板上把‘管家说谎’或‘私人医生溶剂’成功锁定，哪怕再折磨我，迷局还是无法揭穿的面纱。",
          "卧室里冷的像地窖一样。伯父死死把控着每度电费的支出来剥削我，我没心情跟你们讨论这些无关事务。",
          "我的药效好像快要过去，头痛又像锤子在敲。请赶快找出罪犯，别把无辜又孱弱的继承人囚禁在这里审讯了。"
        ],
        EN: [
          "I recorded nothing in my private locked notebook regarding that miscellaneous topic.",
          "Please, my head is throbbing violently from the damp weather. Center your focus on finding the chemical culprit.",
          "The solution lies on your connection board. Link the real lies and alibis rather than pressing a grieving heiress.",
          "The heavy rain is leaking slightly through my ceiling corners. This entire mansion is an exhausting tomb of secrets."
        ]
      },
      outburst: {
        KR: [
          "제 목숨 같은 비밀 일기장을 몰래 열어서 파헤친 거군요?! 맞아요! 전 유산 상속을 조작한 위선 삼촌을 골백번이고 증오해요! 하지만 자물쇠를 녹여내는 무서운 화학 시약 따위 제 방 화장대엔 없었단 말입니다!",
          "제 일기 속 분노가 곧 직접 유물 절도의 범인 지목이라니 억지춘향이 도를 건넜군요! 23:12 복도에 간 건 단지 핀으로 시험 삼아 찔러보려다 겁먹고 도망친 행보일 뿐입니다!",
          "어떻게 부모 잃은 유일한 직계 상속녀인 절 강압 수사하며 눈물짓게 만드는 겁니까?! 왜 가엾은 저를 범법자로 취급하며 위협해요?!"
        ],
        CN: [
          "你居然私自撬开了我上了密码锁的隐私日记……！是的！我是写满了对大伯的仇恨！我恨不得勒死那个掠夺我母辈家私的伪善狂！但案发23:12那一刻，我只是用发夹去试了一下客厅锁孔，我根本打不开！我接着更撞见医生戴着防酸手套和药水走来，我吓得魂飞魄散爬回卧室！我根本不是真凶！",
          "日记宣泄也是犯法吗？！在这栋吃人的庄园里，我连用文字倾洒委屈的空间都要被你们侦探当堂拿出来公开折磨吗？！你们太狠毒了！",
          "我真希望那颗该死的破石头从世界上彻底蒸发！正是因为它，我才每天像分裂症一样被拷问！但我真的没拿到它……！呜呜……"
        ],
        EN: [
          "You breached and read my private locked journal?! Yes! I despised my tyrant uncle and planned family vengeance! But I only carried a hair needle at 23:12! I couldn't melt industrial glass locks! I ran away when I saw the Doctor walking in with rubber gloves and chemicals!",
          "Angry diary entries do not make me a professional ruby thief! You are using my private grief to shield the real culprit within these walls!",
          "How dare you attack a defenseless niece while the true thief with advanced chemical solvents stands smiling in this house?!"
        ]
      }
    },
    Doctor: {
      alibi: {
        KR: [
          "저는 23:10분 경 지하실 약재 냉동 격실에서 소유주 분의 긴박한 활성 영양 추출제를 냉전 관리하고 있었습니다.",
          "개인 실험실 파산과 채무 등은 현대 자산 투자의 소소한 과정일 뿐, 절도 유발 기폭제와는 거리 차가 엄청납니다.",
          "에어 서큘레이터 세차게 가동되던 지하실이기에 외부 저택 수돗가 유수음이나 부서지는 소동 상황은 하등의 귀도 기울지 않았습니다."
        ],
        CN: [
          "作为具备高端药学博士学位的专业顾问，23:10以后我一直在幽静的地窖冷库里提取易变质的辅酶活性栓剂，绝对没有半点脱逃嫌疑。",
          "我虽然由于科学开发遇到了一些暂时的实验资金滞重，但以我高尚的名誉，决不屑于干出深夜砸箱撬柜的肮脏把戏。",
          "案发关键的23:15时分，我在地底专心操作恒温离心罐，地窖隔音十分强。走廊大院发生的任何脚步、放水沟通音，我一概置若惯闻。"
        ],
        EN: [
          "I was meticulously stabilizing active cardiac extracts inside the cellar's thermostat chamber around 23:10.",
          "Temporary loan adjustments inside a clinical lab do not provide any reasonable triggers for stealing. My ethics are absolute.",
          "The heavy automated cellar air extraction vents make listening to external kitchen water drips or footsteps impossible."
        ]
      },
      jewel: {
        KR: [
          "야까마귀의 눈은 주홍빛 수색 감도가 일품인 루비 광물입니다. 생체 화공 성분으로 보기에도 아주 탁월한 소장 융합품입니다.",
          "도난 장식 상자가 약품 용액으로 교묘하게 부패해 무너졌다면서 저를 추달하시는 건 과학 과학수사의 치욕입니다.",
          "보석은 전문적 화공 처리가 아니면 형상을 무단 분해하기 난해한 물질 중 하나이기에 장물의 신장이 매우 독특할 것입니다."
        ],
        CN: [
          "《夜鸦之眼》的放射裂纹与医学微观红细胞结构高度神似，但在我眼中它仅是一块由碳酸钙与微量铬氧化物组成的物理矿物罢了。",
          "听闻客厅的硬质锁并非暴力砸开，而是被特种极高强度的有机溶剂瞬间液化。无气味腐蚀，需要极高药理素养。一般人甚至会瞬间灼伤手掌。",
          "失窃的红宝石一旦通过物理手段剥除外部微刻封环，其价值会毁灭大半。除非有行家懂得在地下无尘实验室重新打磨切割。"
        ],
        EN: [
          "The 'Eye' is a highly distinct crimson ruby compound. As a physician, I view it merely as structured corundum with chromium impurities.",
          "To imply that the melted showcase seal automatically implicates my medical stock is simplistic pseudo-scientific deduction.",
          "The stolen pendant is highly recognizable. No common criminal could dissolve or recut its royal bevels without high-yield equipment."
        ]
      },
      motive: {
        KR: [
          "주방의 폭주 수돗물 난무는 소리를 억누르기 위한 훌륭한 화공 가림막 역할을 수행할 수 있었겠군요.",
          "용제 분사와 지하실 맥주 상자의 조각 서류 등은 사건 규명에 중대한 자취이지만, 저와의 연관은 완강히 사절합니다.",
          "채무는 단순한 신용 대출 연장 절차 중의 회색 구간일 뿐이며, 파산 통고장은 지하실 정리 중 버려진 구식 쓰레기입니다."
        ],
        CN: [
          "厨房异常放流流水声？哼，经典的时间遮断技术。用水压和阀门水流的巨量噪响去淹没化学剂腐蚀开锁的高频碎裂，作案者心思确实巧妙入微。",
          "债务催告书只不过是医学研发周期过程中的普通质押借贷罢了，别用高利贷倒闭这些低俗故事来玷污一个教授的学术地位。",
          "地窖里存放的陈旧废弃啤酒桶确实有很多，谁能确保不是有人无意中把以前实验室的信纸揉碎扔在了里面，对我进行毫无廉耻的攻击。"
        ],
        EN: [
          "A roaring kitchen faucet is a textbook methodology to mask noise. It hides footstep rhythms directly.",
          "My medical research invoices are routine capitalization issues. Do not twist normal venture debts into larceny triggers.",
          "The discarded notification slips inside the cellar barrels are outdated papers from a closed lab. They carry zero prosecutorial weight."
        ]
      },
      conspiracy: {
        KR: [
          "집사 와 방문객의 야음 탈출 음모야말로 이번 사건의 중심 타격 지점입니다. 수첩에 두 선을 조율해 보세요.",
          "메이드는 사건 당시 그 자리에서 복도를 열심히 닦았기에 수조 물소리가 울릴 소동 구조를 면밀히 눈치챘을 것입니다.",
          "조카 벨라 역시 삼촌을 향한 증오심으로 매일 밤 일기에 저항적인 극단 복수를 구상하며 방을 배회했답니다."
        ],
        CN: [
          "管家提前开启后花园走廊锁卡、与珠宝中商卡特预备凌晨的秘密航线，这两项关系完美契合，绝对是一唱一和的同伙！",
          "那个看上去卑微诚朴的女佣，在23:15水声爆鸣时表现得很冷淡。她如果不是在装聋作哑，就绝对在提供时间缓冲。",
          "塞西莉亚经常抢夺庄园大印，声称要让那个剥夺母亲地契的老东西付出代价。她对熔毁挂锁可能同样了解机理。"
        ],
        EN: [
          "The Butler's fabricated clock reports align flawlessly with Visitor Charlie's maritime passage timing. They are natural coconspirators.",
          "Clara the domestic maid stayed very close to the kitchen drain. She had ample opportunity to operate the water cover.",
          "The desperate niece has been wandering with mental breakdown indicators. Her diary holds clear details of revenge."
        ]
      },
      general: {
        KR: [
          "그런 미시적인 연유에 대해선 제 처방전 세트나 임상의학 차트에 기입되어 있지 않군요.",
          "수사관님, 저는 사건에 닿는 기하 원인들을 의학적 합리로만 풀이하고 있습니다. 감정적 궤변은 사절합니다.",
          "논리 보드에서 '잠금장치 해제 화공 시약'과 '의사의 부채' 등의 명백한 연결고리가 없다면 제 결백은 철벽과 같습니다.",
          "지하실 습기 때문에 제 천식 실험용 인젝터라도 보강 구동해야 할 지경이로군요. 간단히 답하고 조사를 끝냅시다."
        ],
        CN: [
          "侦探，关于这个过于发散且缺乏科学印证的闲聊提问，我作为理智的药理学研究员，恐怕无法为您提供妄加猜测。",
          "您的白板连线是否有些过于幼稚散碎？如果没有锁定熔毁柜锁所匹配的‘专业药剂连线’，您盯着我拷问只是在盲目挥霍搜查体力。",
          "外面冰凉大雨倾泻，地窖里存放的医学试管急需防潮，我并不习惯和外行的警长长谈。",
          "我已经在首轮辩护里展现了无可指摘的时间证明。寻找那种高极度溶剂化学瓶，只有具备专业医药制造的人才配携带吧。"
        ],
        EN: [
          "I recorded no diagnostic opinions regarding that trivial topic on my dynamic patient charts.",
          "My career relies on scientific deductions, Detective. I recommend matching physical facts rather than chasing gossips.",
          "Check your deduction board. Unless you physically link my laboratory solvents to the melted lock, your suspicions are speculative.",
          "The cellar atmosphere is damp and triggering for my allergies. Let us focus exclusively on hard timeline contradictions."
        ]
      },
      outburst: {
        KR: [
          "지하에 보관했던 제 사채 통고장들을 기어코 훔쳐서 해킹해 낸 것이군요?! ...아닙니다! 부채의 덫에 눌린 것은 맞지만 장식장을 소멸시킨 순도 고강도 용제가 제 실험실 밖으로 출도되었단 물증은 희박합니다! 억지입니다!",
          "제 화공 의사 면허가 절도로 귀결되다니 해괴망측하군요! 저는 그 시간 주인의 수명을 위한 심장액 안정에만 골몰해 있었습니다!",
          "물적 증거를 대십시오! 제가 이 지하실에 보석을 은닉하는 장면에 직접 사법 조준을 가져가지 못했다면 다 허위 표명입니다!"
        ],
        CN: [
          "你们居然去翻开了地窖下的旧酒箱，翻出了我的债务到期通知？！……一派胡言！没错，我确实面临着重大的实验基建借贷纠纷，但这根本不足以支撑熔毁锁具的高浓度环己烷是我携带进来的！这纯是主观推理，毫无微观药学残留论证！",
          "我是备受尊敬的高等驻诊医师！如果我有心谋取，我有一百种不落痕迹的药物配额让伯爵由于健康变故在继承书中套现，何苦深夜湿漉漉去撬柜子？！你们逻辑低劣！",
          "证据！不要在此指手画脚！除非你指控我时，能在我直接管辖的理化冷柜里现场捕获红挂坠赃物，否则我立刻起诉你们涉嫌公权力暴力霸凌！"
        ],
        EN: [
          "You forced open the old barrels and retrieved my laboratory's financial bankruptcy warnings?! ...A total setup! Yes, my finances are critical, but that doesn't prove I utilized cyclohexane solvents to melt that show cabinet lock! It is speculative nonsense!",
          "I am a highly regarded physician of biological pharmacy! Why would I crawl down corridors and execute messy break-ins when simple clinical drops would secure his wealth gracefully?! Your case is trash!",
          "Provide physical evidence matching! Unless you establish a real chemical balance or recover the Eye of the Night Raven directly, I will have my lawyers strip you of your magnifying glass!"
        ]
      }
    }
  };

  const npc = variations[npcId];
  if (!npc) {
    return lang === 'KR' ? "수사관님, 저는 사건과 상관없으며 잘 모르는 일입니다." :
           lang === 'CN' ? "侦探，我对这起案件完全不知情，请不要继续询问。" :
           "Detective, I am not familiar with these circumstances.";
  }

  // Choose the slice to fetch based on question context
  let category: 'alibi' | 'jewel' | 'motive' | 'conspiracy' | 'general' = 'general';
  if (isAlibiQuery) category = 'alibi';
  else if (isJewelQuery) category = 'jewel';
  else if (isMotiveOrDebtQuery) category = 'motive';
  else if (isConspiracyOrOtherQuery) category = 'conspiracy';

  // Get index based on unique length of message and currentEmotion to simulate rolling but deterministic cycling
  const pool = isOutburst ? npc.outburst[lang] : (npc[category]?.[lang] || npc.general[lang]);
  const idx = (message.length + currentEmotion + Math.abs(currentEmotion - message.length || 1)) % pool.length;
  let replyText = pool[idx] || pool[0];

  // Add immersive descriptive suffix if keyword strikes interest under normal emotion
  const isKeywordMatched = query.includes('lie') || query.includes('lying') || query.includes('거짓') || query.includes('说谎') ||
                          query.includes('23:15') || query.includes('수돗') || query.includes('용제') || query.includes('시약') ||
                          query.includes('일기') || query.includes('선표') || query.includes('부채') || query.includes('빚') ||
                          query.includes('熔毁') || query.includes('债务') || query.includes('船票') || query.includes('日记') ||
                          query.includes('solvent') || query.includes('ticket') || query.includes('debt') || query.includes('diary');

  if (isKeywordMatched && !isOutburst) {
    if (lang === 'KR') {
      replyText += " (성대를 흔들고 시선을 황급히 회피하며, 목덜미의 땀방울을 정돈하려 애씁니다. 심리 스트레스가 커 보입니다.)";
    } else if (lang === 'CN') {
      replyText += " （对方在说出这句话时明显咽了咽唾沫，视线急促地飘向一侧，额角隐约冒出一颗冷汗。心理防线正在面临巨压。）";
    } else {
      replyText += " (Their voice hitches slightly; they rapidly shift their stance and look askance, attempting to conceal a droplet of cold sweat. Psychological stress builds.)";
    }
  }

  return replyText;
}
