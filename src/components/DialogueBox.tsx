/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { NPC, Language, TranslationSet } from '../types';
import { gameAudio } from '../utils/audio';
import { Sparkles, MessageCircle, AlertCircle, HeartCrack } from 'lucide-react';

interface DialogueBoxProps {
  npc: NPC;
  language: Language;
  t: TranslationSet;
  dialogueHistory: { speaker: string; text: string; isAi: boolean }[];
  isChatLoading: boolean;
  onSendCustomAsk: (message: string) => void;
  onPresentEvidenceSelection: () => void;
  extraQuestionButton?: React.ReactNode;
}

export default function DialogueBox({
  npc,
  language,
  t,
  dialogueHistory,
  isChatLoading,
  onSendCustomAsk,
  onPresentEvidenceSelection,
  extraQuestionButton
}: DialogueBoxProps) {
  const [inputText, setInputText] = useState('');
  const [triggerShake, setTriggerShake] = useState(false);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);

  // Quick inquiry prompt definitions
  const quickQuestions: Record<Language, string[]> = {
    KR: [
      "자정 근처에 어디에서 무엇을 하고 계셨습니까?",
      "이 저택의 보석 '야까마귀의 눈'에 대해 무엇을 아십니까?",
      "다른 인물들 중 누구를 가장 의심하고 계십니까?"
    ],
    CN: [
      "23:10点至23:20点案发时间，你具体在做什么？",
      "针对古董吊坠《夜鸦之眼》的离奇失踪，你作何解释？",
      "别墅现场的其他人，你认为谁更有作案嫌疑？"
    ],
    EN: [
      "Where exactly were you between 23:10 and 23:20?",
      "What do you know regarding the stolen Eye of the Night Raven?",
      "Which other guest or household staff do you suspect most?"
    ]
  };

  // Automated scroll behavior on new dialogue streams
  useEffect(() => {
    if (bottomScrollRef.current) {
      bottomScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dialogueHistory]);

  // Shake effect on outburst trigger
  useEffect(() => {
    if (npc.isOutburst) {
      setTriggerShake(true);
      gameAudio.playHeartbeat();
      
      const timer = setTimeout(() => {
        setTriggerShake(false);
      }, 5000); // Strict 5-second timeout to prevent eye fatigue
      
      return () => clearTimeout(timer);
    } else {
      setTriggerShake(false);
    }
  }, [npc.isOutburst, npc.emotion]);

  const handleSend = () => {
    if (!inputText.trim() || isChatLoading) return;
    onSendCustomAsk(inputText.trim());
    setInputText('');
  };

  return (
    <div
      id={`dialogue-container-${npc.id}`}
      className={`bg-[#11131a] rounded-2xl border-2 p-4 md:p-5 flex flex-col md:flex-row gap-5 relative overflow-hidden transition-all duration-300 ${
        npc.isOutburst
          ? 'border-red-600/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
          : 'border-zinc-800'
      } ${triggerShake ? 'animate-shake' : ''}`}
    >
      {/* Sound active background overlay on outburst */}
      {npc.isOutburst && (
        <span className="absolute -top-12 -right-12 w-24 h-24 bg-red-650/10 blur-[30px] rounded-full animate-pulse" />
      )}

      {/* Suspect avatar display */}
      <div className="w-full md:w-56 flex flex-col items-center shrink-0">
        <div className="w-40 h-56 md:w-48 md:h-[300px] bg-[#090b10] border-2 rounded-xl flex items-center justify-center overflow-hidden relative group border-zinc-800">
          <img
            src={npc.isOutburst ? npc.outburstAvatar : npc.avatar}
            alt={npc.name[language]}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain p-2 transition duration-300 transform group-hover:scale-[1.03]"
          />
          {npc.isOutburst && (
            <div className="absolute inset-0 bg-red-950/20 mix-blend-overlay animate-pulse" />
          )}
        </div>

        {/* Emotion stressful details */}
        <div className="w-full mt-3.5 px-1">
          <div className="flex items-center justify-between text-[11px] mb-1 leading-none">
            <span className="text-zinc-400 flex items-center gap-1 font-mono tracking-wider">
              {npc.isOutburst ? (
                <HeartCrack className="w-3.5 h-3.5 text-red-500 animate-bounce" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-[#fb7185]" />
              )}
              {t.stressLevel}
            </span>
            <span className={`font-mono font-bold ${npc.isOutburst ? 'text-red-500 font-extrabold animate-pulse' : 'text-[#fb7185]'}`}>
              {npc.emotion}%
            </span>
          </div>

          {/* Slider line bar */}
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              style={{ width: `${npc.emotion}%` }}
              className={`h-full transition-all duration-500 ${
                npc.isOutburst
                  ? 'bg-gradient-to-r from-red-650 to-red-500'
                  : 'bg-gradient-to-r from-rose-400 to-rose-500'
              }`}
            />
          </div>

          {npc.isOutburst && (
            <div className="text-[10px] text-red-400 text-center font-bold tracking-widest uppercase mt-2 animate-pulse font-mono">
              ★ {t.outburstActive} ★
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Dialogue Box Chat Screen */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        
        {/* Chat History Panel */}
        <div className="h-56 md:h-[260px] overflow-y-auto border border-zinc-805 bg-[#090b10] rounded-xl p-3 flex flex-col gap-2.5 scrollbar-thin">
          <div className="text-[9px] text-[#fb1380] font-mono tracking-widest uppercase text-left pb-1 border-b border-zinc-900 flex items-center justify-between">
            <span>INTERROGATION CHRONOLOGY</span>
            <span>SECURE ENCRYPTED</span>
          </div>

          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto mt-1 pr-1">
            {dialogueHistory.map((line, idx) => (
              <div
                key={idx}
                className={`flex flex-col text-left ${line.isAi ? 'items-start' : 'items-end'}`}
              >
                <div className="text-[9px] font-mono text-zinc-500 mb-0.5 tracking-wider uppercase">
                  {line.speaker}
                </div>
                <div
                  className={`text-xs p-2.5 rounded-lg leading-relaxed max-w-[90%] font-sans ${
                    line.isAi
                      ? 'bg-zinc-900/90 text-zinc-200 border border-zinc-800'
                      : 'bg-[#fb7185]/10 text-[#fda4af] border border-[#fb7185]/35'
                  }`}
                >
                  {line.text}
                </div>
              </div>
            ))}

            {dialogueHistory.length === 0 && (
              <div className="text-zinc-650 text-xs italic py-8 text-center font-mono">
                [ NO QUESTIONS RECORDED. INITIATE盤问 TO UNCOVER SECRETS ]
              </div>
            )}

            {isChatLoading && (
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono py-1 text-left">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>AI {npc.id === 'Doctor' ? 'Harvey' : npc.id === 'Butler' ? 'Rudolf' : npc.id} IS WRITING WITNESS ACCOUNT...</span>
              </div>
            )}

            <div ref={bottomScrollRef} />
          </div>
        </div>

        {/* Rapid option selector & Action panels */}
        <div className="mt-3 flex flex-wrap gap-1.5 justify-start text-left items-center">
          {extraQuestionButton}
          {quickQuestions[language].map((qText, idx) => (
            <button
              key={idx}
              id={`quick-query-${idx}`}
              onClick={() => {
                if (isChatLoading) return;
                setInputText(qText);
              }}
              className="px-2.5 py-1 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded text-[10px] transition max-w-full truncate font-sans cursor-pointer active:scale-95"
            >
              {qText}
            </button>
          ))}
        </div>

        {/* Input box section */}
        <div className="mt-3.5 flex flex-col sm:flex-row gap-2 relative z-10 text-left">
          <div className="flex-1 relative flex items-center">
            <MessageCircle className="absolute left-3 w-4 h-4 text-zinc-505" />
            <input
              id="ai-prompt-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.askPlaceholder}
              disabled={isChatLoading}
              className="w-full py-2 pl-9 pr-3 bg-[#0a0c12] border border-zinc-800 text-xs rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-1 focus:ring-red-600/50 transition font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-present-evidence"
              onClick={onPresentEvidenceSelection}
              className="px-4 py-2 bg-gradient-to-r from-zinc-900 to-zinc-905 hover:from-zinc-850 hover:to-zinc-900 text-orange-400 hover:text-orange-350 font-bold text-xs rounded-xl border border-zinc-800 transition active:scale-95 flex items-center gap-1.5 font-sans justify-center grow cursor-pointer shadow-md"
            >
              🚀 {t.presentEvidence}
            </button>
            <button
              id="btn-ask-ai"
              onClick={handleSend}
              disabled={!inputText.trim() || isChatLoading}
              className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 font-sans grow cursor-pointer shadow-lg ${
                inputText.trim() && !isChatLoading
                  ? 'bg-red-600 hover:bg-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] text-white'
                  : 'bg-zinc-800 text-zinc-505 cursor-not-allowed border border-zinc-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.askNPC}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
