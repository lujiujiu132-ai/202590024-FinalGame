/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'KR' | 'CN' | 'EN';

export interface TranslationSet {
  title: string;
  subtitle: string;
  tagline: string;
  startBtn: string;
  // Rooms
  LivingRoom: string;
  Hallway: string;
  Kitchen: string;
  Bedroom: string;
  WineCellar: string;
  // Sidebar/Footer Nav
  navTitle: string;
  goTo: string;
  presentEvidence: string;
  askNPC: string;
  askPlaceholder: string;
  // Hand Book
  notebookTitle: string;
  notebookTabClues: string;
  notebookTabEvidence: string;
  evidenceEmptyList: string;
  evidenceAcquiredAt: string;
  // Whiteboard
  pinboardTitle: string;
  pinboardSubtitle: string;
  pinboardArrange: string;
  pinboardDeduct: string;
  pinboardAlertLink: string;
  pinboardInferenceFound: string;
  // Accusation
  accuseBtn: string;
  accuseConfirm: string;
  accuseTitle: string;
  accuseNPC: string;
  accuseSelect: string;
  accuseWarning: string;
  // Game state UI
  foundItemTitle: string;
  closeBtn: string;
  restartBtn: string;
  gavelObjection: string;
  stressLevel: string;
  outburstActive: string;
  // Hotspots
  hotspotInvestigate: string;
  hotspotFoundClue: string;
}

export type LocationKey = 'LivingRoom' | 'Hallway' | 'Kitchen' | 'Bedroom' | 'WineCellar';

export interface GPSheetRow {
  state: string;
  link: string;
  minimum_value?: string;
  maximum_value?: string;
}

export interface ClueNode {
  id: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  isDiscovered: boolean;
  x?: number;
  y?: number;
}

export interface EvidenceItem {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  image: string;
  acquiredAt: string;
}

export interface DeductionRule {
  id: string;
  clueIds: string[]; // required inputs
  resultClueId: string; // clue unlocked
  alertMessage: Record<Language, string>;
}

export interface NPC {
  id: string;
  name: Record<Language, string>;
  occupation: Record<Language, string>;
  avatar: string;
  outburstAvatar: string;
  emotion: number; // 0 to 100
  isOutburst: boolean;
  location: LocationKey;
  profile: Record<Language, string>;
  testimony: Record<Language, string>;
  contradictionClueId: string; // The clue that cracks their lie
  gavelSuccessText: Record<Language, string>; // Gavel match response
}

export type PlayerAvatarState = 'StandAvatar' | 'WalkAvatar' | 'ThinkAvatar' | 'ConfidentAvatar';

export interface GameState {
  language: Language;
  playerLocation: LocationKey;
  playerAvatar: PlayerAvatarState;
  discoveredClues: string[]; // clue ids
  evidenceInventory: EvidenceItem[];
  npcEmotions: Record<string, number>; // npcId -> 0..100
  npcOutbursts: Record<string, boolean>; // npcId -> bool
  pinboardNodes: { id: string; x: number; y: number }[];
  pinboardConnections: [string, string][]; // Pairs of connected clue IDs
  deducedResults: string[]; // rule ids completed
  necklaceFound: boolean;
  activeDialogueNpcId: string | null;
  dialogueHistory: { speaker: string; text: string; isAi: boolean }[];
  accusationAttempts: number;
  isGameOver: boolean;
  endingType: 'perfect' | 'hidden' | 'ordinary' | 'failed' | 'misjudgment' | 'allsuspect' | null;
}
