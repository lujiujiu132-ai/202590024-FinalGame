/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClueNode, EvidenceItem, Language, TranslationSet } from '../types';
import { BookOpen, Award, FileText, CheckCircle2 } from 'lucide-react';
import { gameAudio } from '../utils/audio';

interface ManualModalProps {
  discoveredClues: ClueNode[];
  allClues: ClueNode[];
  evidenceInventory: EvidenceItem[];
  language: Language;
  t: TranslationSet;
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualModal({
  discoveredClues,
  allClues,
  evidenceInventory,
  language,
  t,
  isOpen,
  onClose
}: ManualModalProps) {
  const [activeTab, setActiveTab] = useState<'clues' | 'evidence'>('clues');

  if (!isOpen) return null;

  const handleTabChange = (tab: 'clues' | 'evidence') => {
    gameAudio.playPencilWrite();
    setActiveTab(tab);
  };

  return (
    <div id="handbook-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div
        id="handbook-modal"
        className="w-full max-w-3xl h-[580px] bg-[#14161d] border-2 border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Subtle page edge design */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-red-950/40 border-r border-[#1e2029]" />

        {/* Header */}
        <div className="p-5 md:p-6 border-b border-zinc-800/80 bg-[#171922] flex items-center justify-between relative pl-8">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-md md:text-lg font-bold text-gray-100 uppercase tracking-wider font-sans">
                {t.notebookTitle}
              </h2>
              <div className="text-[10px] text-zinc-500 font-mono tracking-widest mt-0.5">
                ACTIVE STATUS: IN QUEST OF TRUTH
              </div>
            </div>
          </div>
          <button
            id="btn-close-handbook"
            onClick={() => {
              gameAudio.playPencilWrite();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded text-xs transition active:scale-95 duration-200 uppercase font-mono font-bold"
          >
            {t.closeBtn}
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800/60 bg-[#12131a] relative pl-8">
          <button
            id="tab-clues"
            onClick={() => handleTabChange('clues')}
            className={`px-5 py-3 text-xs font-bold tracking-wider uppercase transition border-b-2 flex items-center gap-2 ${
              activeTab === 'clues'
                ? 'text-red-500 border-red-500 bg-zinc-900/40'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {t.notebookTabClues} ({discoveredClues.length}/{allClues.length})
          </button>
          <button
            id="tab-evidence"
            onClick={() => handleTabChange('evidence')}
            className={`px-5 py-3 text-xs font-bold tracking-wider uppercase transition border-b-2 flex items-center gap-2 ${
              activeTab === 'evidence'
                ? 'text-red-500 border-red-500 bg-zinc-900/40'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            {t.notebookTabEvidence} ({evidenceInventory.length})
          </button>
        </div>

        {/* Main tabs view content */}
        <div className="flex-1 overflow-y-auto p-5 pl-10 bg-[#0f1116] text-left">
          {activeTab === 'clues' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discoveredClues.map(clue => {
                const isDeepIntel = ['water_cover', 'theft_partners', 'chemical_theft'].includes(clue.id);
                return (
                  <div
                    key={clue.id}
                    id={`handbook-clue-${clue.id}`}
                    className={`p-4 rounded-xl border transition ${
                      isDeepIntel
                        ? 'bg-gradient-to-br from-amber-950/20 to-zinc-900 border-amber-600/30'
                        : 'bg-zinc-900/50 border-zinc-800/65'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className={`w-4 h-4 ${isDeepIntel ? 'text-amber-500' : 'text-red-500'}`} />
                      <h4 className={`text-xs font-bold ${isDeepIntel ? 'text-amber-400' : 'text-zinc-200'}`}>
                        {clue.title[language] || clue.title['KR']}
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      {clue.description[language] || clue.description['KR']}
                    </p>
                  </div>
                );
              })}

              {discoveredClues.length === 0 && (
                <div className="col-span-2 py-16 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
                  [ No files archived. Investigate rooms or assemble whiteboards ]
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col justify-between">
              {evidenceInventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-xl font-bold mb-4 font-mono">
                    ?
                  </div>
                  <p className="text-xs text-zinc-500 max-w-sm leading-normal">
                    {t.evidenceEmptyList}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {evidenceInventory.map(item => (
                    <div
                      key={item.id}
                      id={`handbook-evidence-${item.id}`}
                      className="bg-zinc-900/40 border border-zinc-800/80 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-5"
                    >
                      {/* Image fetched dynamically from Item table (google drive parsed) */}
                      <div className="w-28 h-28 bg-[#090b10] border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative group">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name[language]}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                        ) : (
                          <span className="text-zinc-650 text-xs font-mono">NO IMAGE</span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-amber-950/80 text-[8px] text-amber-400 uppercase tracking-widest text-center font-mono">
                          SECURED
                        </div>
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                          <h3 className="text-sm font-bold text-amber-500 font-sans tracking-wide">
                            {item.name[language] || item.name['KR']}
                          </h3>
                          <span className="text-[9px] text-gray-500 font-mono tracking-tighter">
                            {t.evidenceAcquiredAt}: {item.acquiredAt}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed max-w-xl font-sans">
                          {item.description[language] || item.description['KR']}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
