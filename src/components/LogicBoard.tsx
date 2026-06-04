/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { ClueNode, Language, TranslationSet } from '../types';
import { gameAudio } from '../utils/audio';
import { X, RefreshCw, Layers, Check, HelpCircle } from 'lucide-react';

interface LogicBoardProps {
  discoveredClues: ClueNode[];
  language: Language;
  t: TranslationSet;
  connections: [string, string][];
  onAddConnection: (id1: string, id2: string) => void;
  onRunDeduction: (selectedIds: string[]) => void;
  onClose?: () => void;
}

export default function LogicBoard({
  discoveredClues,
  language,
  t,
  connections,
  onAddConnection,
  onRunDeduction,
  onClose
}: LogicBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Track node position offsets relative to canvas
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  
  // Track minimized deduction card IDs
  const [minimizedClues, setMinimizedClues] = useState<string[]>([]);

  // Identify high-energy deduction result clues
  const isDeductionClue = (id: string) => {
    return ['water_cover', 'theft_partners', 'chemical_theft'].includes(id);
  };

  // Arrange on a grid separating original clues (left) vs deductions (right)
  const handleArrangeGrid = () => {
    gameAudio.playPencilWrite();
    const snap: Record<string, { x: number; y: number }> = {};
    
    // Split into original clues and deduction results
    const originalClues = discoveredClues.filter(c => !isDeductionClue(c.id));
    const deductionClues = discoveredClues.filter(c => isDeductionClue(c.id));

    // Place original clues horizontally on Row 1 (y: 40)
    originalClues.forEach((clue, idx) => {
      snap[clue.id] = {
        x: 35 + idx * 245,
        y: 40
      };
    });

    // Place deduction results horizontally on Row 2 (y: 220)
    deductionClues.forEach((clue, idx) => {
      snap[clue.id] = {
        x: 35 + idx * 245,
        y: 220
      };
    });

    setPositions(snap);
  };

  // Initialize coordinates on mount / discovery changes
  useEffect(() => {
    const newPositions: Record<string, { x: number; y: number }> = { ...positions };
    let changed = false;
    
    const originalClues = discoveredClues.filter(c => !isDeductionClue(c.id));
    const deductionClues = discoveredClues.filter(c => isDeductionClue(c.id));

    originalClues.forEach((clue, idx) => {
      if (!newPositions[clue.id]) {
        newPositions[clue.id] = {
          x: 35 + idx * 245,
          y: 40
        };
        changed = true;
      }
    });

    deductionClues.forEach((clue, idx) => {
      if (!newPositions[clue.id]) {
        newPositions[clue.id] = {
          x: 35 + idx * 245,
          y: 220
        };
        changed = true;
      }
    });

    if (changed) {
      setPositions(newPositions);
    }
  }, [discoveredClues]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (draggingNodeId) return;
    const current = positions[id] || { x: 0, y: 0 };
    setDraggingNodeId(id);
    setDragOffset({
      x: e.clientX - current.x,
      y: e.clientY - current.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Bounds check to keep within arena boundaries
    const newX = Math.max(0, Math.min(rect.width - 200, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(rect.height - 100, e.clientY - dragOffset.y));
    
    setPositions(prev => ({
      ...prev,
      [draggingNodeId]: { x: newX, y: newY }
    }));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Handle clue click to select / connect paths
  const handleNodeClick = (nodeId: string) => {
    gameAudio.playFootstep();
    setSelectedNodeIds(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      }
      if (prev.length >= 2) {
        return [prev[1], nodeId];
      }
      return [...prev, nodeId];
    });
  };

  // Execute logic deduction combination
  const handleDeduct = () => {
    if (selectedNodeIds.length !== 2) return;
    onRunDeduction(selectedNodeIds);
    setSelectedNodeIds([]);
  };

  // Toggle minimized state of a deduction card
  const toggleMinimize = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    gameAudio.playPencilWrite();
    setMinimizedClues(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Render SVG links overlay
  const renderLines = () => {
    return connections.map(([id1, id2], idx) => {
      const p1 = positions[id1] || { x: 0, y: 0 };
      const p2 = positions[id2] || { x: 0, y: 0 };

      // Base nodes dimensions (approx 215px width, 100px height)
      // If either node is minimized, make connector link center on the compact badge dimensions
      const isP1Minimized = minimizedClues.includes(id1);
      const isP2Minimized = minimizedClues.includes(id2);

      const x1 = p1.x + (isP1Minimized ? 30 : 107);
      const y1 = p1.y + (isP1Minimized ? 25 : 50);
      const x2 = p2.x + (isP2Minimized ? 30 : 107);
      const y2 = p2.y + (isP2Minimized ? 25 : 50);

      return (
        <g key={`line-${idx}`}>
          {/* Thick fluorescent crimson outline shadow */}
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#ef4444"
            strokeWidth="4.5"
            strokeLinecap="round"
            className="drop-shadow-[0_0_12px_rgba(239,68,68,0.95)] animate-pulse opacity-85"
          />
          {/* Inner hot thread */}
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#fff1f2"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      );
    });
  };

  // Help descriptors
  const helpTipsMap = {
    KR: "💡 논리 연결법: 증거 두 개를 클릭하여 선택(원형 테두리 확인) 후, 상단 [논리 결합]을 누르면 강력해진 가문 수사가 이어집니다.",
    CN: "💡 推理指南：任意选择两个线索卡片（使其发红发亮），按上方的 [线索关联] 即可拉出红色物理关系线并获得结论！",
    EN: "💡 Guide: Click two suspicious clues to focus, then press the top [Connect Deduce] button to draw links of logic."
  };

  return (
    <div id="logical-pinboard" className="bg-[#0b0d12] border-2 border-red-900/60 rounded-3xl p-4 md:p-5 shadow-2xl relative overflow-hidden flex flex-col h-full">
      {/* Structural layout background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f1414_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-65 pointer-events-none" />

      {/* Control panel header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-900 mb-4 gap-3 relative z-10">
        <div>
          <h3 className="text-sm md:text-base font-serif font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
            📌 {t.pinboardTitle}
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1 max-w-xl font-sans tracking-wide">
            {t.pinboardSubtitle}
          </p>
        </div>
        
        {/* Actions buttons Container */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-arrange-grid"
            onClick={handleArrangeGrid}
            className="px-3.5 py-2 bg-[#12141c] hover:bg-zinc-800 border-2 border-zinc-800 hover:border-zinc-700 text-gray-300 rounded-xl text-[10px] transition duration-200 uppercase font-mono tracking-wider font-extrabold active:scale-95 flex items-center gap-1 cursor-pointer shadow-md"
            title="Snap entire whiteboard clean"
          >
            <RefreshCw className="w-3 h-3 text-red-400" />
            {t.pinboardArrange}
          </button>
          
          <button
            id="btn-combine-deduce"
            onClick={handleDeduct}
            disabled={selectedNodeIds.length !== 2}
            className={`px-4 py-2 rounded-xl text-[10px] transition duration-200 font-extrabold uppercase tracking-widest flex items-center gap-1 cursor-pointer ${
              selectedNodeIds.length === 2
                ? 'bg-gradient-to-r from-red-700 to-red-550 border-2 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-[1.03] active:scale-95'
                : 'bg-zinc-900 text-zinc-650 cursor-not-allowed border-2 border-zinc-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t.pinboardDeduct}
          </button>

          {onClose && (
            <button
              id="btn-close-pinboard-top"
              onClick={onClose}
              className="p-1.5 bg-[#12141c] hover:bg-red-950/40 border border-zinc-800 hover:border-red-900 rounded-lg text-zinc-400 hover:text-red-500 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {minimizedClues.length > 0 && (
        <div className="mb-2 relative z-10 flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">MINIMIZED DEDUCTIONS:</span>
          {minimizedClues.map(mId => {
            const clue = discoveredClues.find(c => c.id === mId);
            if (!clue) return null;
            return (
              <button
                key={mId}
                onClick={(e) => toggleMinimize(mId, e)}
                className="px-2 py-0.5 bg-amber-950/30 border border-amber-600/50 text-amber-500 text-[9px] rounded font-mono hover:bg-amber-900/40 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>➕ {clue.title[language]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main interactive draggable card canvas area */}
      <div className="w-full overflow-x-auto overflow-y-hidden border border-zinc-900 rounded-2xl bg-[#050608] shadow-inner pb-1 custom-scrollbar">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: discoveredClues.length === 0
              ? '100%'
              : `${Math.max(1050, Math.max(
                  discoveredClues.filter(c => !isDeductionClue(c.id)).length,
                  discoveredClues.filter(c => isDeductionClue(c.id)).length
                ) * 250 + 80)}px`
          }}
          className="h-[410px] relative select-none cursor-crosshair"
        >
        {/* Dynamic linking strings render overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {renderLines()}
        </svg>

        {/* Empty placeholder if no clues obtained currently */}
        {discoveredClues.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-650 text-xs font-mono tracking-wider z-10 text-center p-6 space-y-2">
            <span>[ 🔍 NO CLUES CURRENTLY UNCOVERED ]</span>
            <span className="text-[10px] text-zinc-700 max-w-sm">Move rooms and inspect glowing hotspots ? in the villa to gather evidence data!</span>
          </div>
        )}

        {/* Clue Node items */}
        {discoveredClues.map(clue => {
          const pos = positions[clue.id] || { x: 30, y: 30 };
          const isSelected = selectedNodeIds.includes(clue.id);
          const isDeduction = isDeductionClue(clue.id);
          const isMinimized = minimizedClues.includes(clue.id);

          // Render minimized/collapsed badge if user closed it
          if (isMinimized) {
            return (
              <div
                key={clue.id}
                id={`clue-node-collapsed-${clue.id}`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  touchAction: 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, clue.id)}
                onClick={(e) => toggleMinimize(clue.id, e)}
                className={`absolute w-14 h-14 rounded-full border-2 flex items-center justify-center cursor-pointer select-none transition-transform z-30 ${
                  isSelected 
                    ? 'bg-red-950 border-red-500 animate-pulse' 
                    : 'bg-amber-950/90 border-amber-500 hover:scale-105'
                }`}
                title={`Collapsed deduction: ${clue.title[language]}. Click to expand!`}
              >
                <span className="text-base">🧠</span>
                {/* Floating small tag */}
                <div className="absolute -bottom-5 bg-black/85 border border-amber-800 text-[7px] text-amber-500 px-1 py-0.5 rounded whitespace-nowrap font-bold tracking-tight">
                  {clue.title[language] ? clue.title[language].substring(0, 5) : clue.id}...
                </div>
              </div>
            );
          }

          return (
            <div
              key={clue.id}
              id={`clue-node-${clue.id}`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                touchAction: 'none'
              }}
              onMouseDown={(e) => handleMouseDown(e, clue.id)}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={`absolute w-[215px] p-3 rounded-xl border text-left cursor-grab transition-shadow z-20 ${
                isDeduction
                  ? 'bg-gradient-to-br from-[#1d1512] to-[#120a09] border-amber-500/80 shadow-[0_0_15px_rgba(217,119,6,0.3)]'
                  : 'bg-zinc-950/90 border-zinc-800'
              } ${
                isSelected
                  ? 'border-red-500 ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.45)]'
                  : 'hover:border-zinc-700'
              }`}
            >
              {/* Node meta flag */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className={`text-[8px] font-mono tracking-widest font-extrabold px-1.5 py-0.5 rounded leading-none ${
                  isDeduction 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-red-955 text-red-400 border border-red-950'
                }`}>
                  {isDeduction ? 'DEDUCTION' : 'CRIME SPECS'}
                </span>
                
                <div className="flex items-center gap-1.5">
                  {/* Select button indicator */}
                  <button
                    id={`btn-select-clue-${clue.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeClick(clue.id);
                    }}
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-600 to-red-500 border-red-500 text-white shadow-inner animate-[pulse_1.5s_infinite]'
                        : 'border-zinc-700 hover:border-zinc-500 bg-black/60 text-transparent'
                    }`}
                  >
                    <Check className={`w-2.5 h-2.5 text-white ${isSelected ? 'block' : 'hidden'}`} />
                  </button>

                  {/* Deduction close button */}
                  {isDeduction && (
                    <button
                      onClick={(e) => toggleMinimize(clue.id, e)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-0.5 rounded hover:bg-zinc-800"
                      title="Collapse deduction (retaining paths)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <h4 className="text-[11px] font-extrabold text-gray-100 tracking-tight leading-normal mb-1">
                {clue.title[language] || clue.title['KR']}
              </h4>
              
              <p className="text-[9px] text-zinc-400 leading-relaxed font-sans max-h-16 overflow-y-auto pr-0.5 line-clamp-3">
                {clue.description[language] || clue.description['KR']}
              </p>
            </div>
          );
        })}
        </div>
      </div>

      <div className="p-2.5 mt-3 rounded-xl bg-zinc-950/70 border border-zinc-900 border-dashed text-left text-[10px] text-zinc-400 leading-relaxed font-sans z-10 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <span>
          {helpTipsMap[language] || helpTipsMap['KR']}
        </span>
      </div>
    </div>
  );
}
