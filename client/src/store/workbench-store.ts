import { create } from 'zustand';
import { logger } from '@/lib/safe-logger';

const FAV_KEY = 'ctf_favorites';
const RECENT_KEY = 'ctf_recent_tools';
const MAX_RECENT = 20;

export type ViewMode = 'tool' | 'smart-codec' | 'operation-chain' | 'ai-assistant';

export interface HistoryEntry {
  action: string; input: string; output: string; timestamp: number;
}
export interface AITrigger {
  content: string;
  context: { toolId: string | null; toolInput: string | null; toolOutput: string | null };
  agentMode: boolean;
}
export interface TabState {
  toolId: string; toolName: string; input: string; output: string;
  params: Record<string, unknown>; history: HistoryEntry[]; historyIndex: number;
}

interface WorkbenchState {
  tabs: TabState[]; activeTabId: string | null;
  favorites: string[]; recentTools: string[];
  selectedCategory: string | null; searchQuery: string;
  viewMode: ViewMode; setViewMode: (mode: ViewMode) => void;
  aiTrigger: AITrigger | null;
  triggerAI: (content: string, context: { toolId: string | null; toolInput: string | null; toolOutput: string | null }, agentMode?: boolean) => void;
  clearAITrigger: () => void;
  openTool: (toolId: string, toolName: string) => void;
  closeTab: (tabId: string) => void; switchTab: (tabId: string) => void;
  updateInput: (input: string) => void; updateOutput: (output: string) => void;
  updateParams: (params: Record<string, unknown>) => void;
  addToHistory: (entry: HistoryEntry) => void;
  undo: () => void; redo: () => void; jumpToHistory: (index: number) => void;
  toggleFavorite: (toolId: string) => void; addRecent: (toolId: string) => void;
  setCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  swapInputOutput: () => void; clearInput: () => void;
  getActiveTab: () => TabState | null;
}

function loadArr(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as string[]; }
  catch { return []; }
}
function saveArr(key: string, val: string[]): void {
  try { localStorage.setItem(key, JSON.stringify(val)); }
  catch (e) { logger.error('localStorage save failed', e); }
}
function updTab(tabs: TabState[], id: string | null, fn: (t: TabState) => TabState): TabState[] {
  return tabs.map((t) => (t.toolId === id ? fn(t) : t));
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  tabs: [], activeTabId: null,
  favorites: loadArr(FAV_KEY), recentTools: loadArr(RECENT_KEY),
  selectedCategory: null, searchQuery: '',
  viewMode: 'tool', setViewMode: (mode) => set({ viewMode: mode }),
  aiTrigger: null,
  triggerAI: (content, context, agentMode = false) => set({ aiTrigger: { content, context, agentMode }, viewMode: 'ai-assistant' }),
  clearAITrigger: () => set({ aiTrigger: null }),

  openTool: (toolId, toolName) => {
    const { tabs, recentTools } = get();
    if (tabs.some((t) => t.toolId === toolId)) { set({ activeTabId: toolId, viewMode: 'tool' }); return; }
    const newTab: TabState = {
      toolId, toolName, input: '', output: '', params: {}, history: [], historyIndex: -1,
    };
    const newRecent = [toolId, ...recentTools.filter((id) => id !== toolId)].slice(0, MAX_RECENT);
    saveArr(RECENT_KEY, newRecent);
    set({ tabs: [...tabs, newTab], activeTabId: toolId, recentTools: newRecent, viewMode: 'tool' });
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex((t) => t.toolId === tabId);
    if (idx === -1) return;
    const newTabs = tabs.filter((t) => t.toolId !== tabId);
    const newActive = activeTabId === tabId
      ? (newTabs.length ? newTabs[Math.min(idx, newTabs.length - 1)].toolId : null)
      : activeTabId;
    set({ tabs: newTabs, activeTabId: newActive });
  },

  switchTab: (tabId) => set({ activeTabId: tabId }),
  updateInput: (input) => set((s) => ({ tabs: updTab(s.tabs, s.activeTabId, (t) => ({ ...t, input })) })),
  updateOutput: (output) => set((s) => ({ tabs: updTab(s.tabs, s.activeTabId, (t) => ({ ...t, output })) })),
  updateParams: (params) => set((s) => ({ tabs: updTab(s.tabs, s.activeTabId, (t) => ({ ...t, params: { ...t.params, ...params } })) })),

  addToHistory: (entry) => set((s) => ({ tabs: updTab(s.tabs, s.activeTabId, (t) => {
    const h = [...t.history.slice(0, t.historyIndex + 1), entry];
    return { ...t, history: h, historyIndex: h.length - 1, input: entry.input, output: entry.output };
  }) })),

  undo: () => set((s) => ({ tabs: updTab(s.tabs, s.activeTabId, (t) => {
    if (t.historyIndex <= 0) return t;
    const e = t.history[t.historyIndex - 1];
    return { ...t, historyIndex: t.historyIndex - 1, input: e.input, output: e.output };
  }) })),

  redo: () => set((s) => ({ tabs: updTab(s.tabs, s.activeTabId, (t) => {
    if (t.historyIndex >= t.history.length - 1) return t;
    const e = t.history[t.historyIndex + 1];
    return { ...t, historyIndex: t.historyIndex + 1, input: e.input, output: e.output };
  }) })),

  jumpToHistory: (index) => set((s) => ({ tabs: updTab(s.tabs, s.activeTabId, (t) => {
    if (index < 0 || index >= t.history.length) return t;
    const e = t.history[index];
    return { ...t, historyIndex: index, input: e.input, output: e.output };
  }) })),

  toggleFavorite: (toolId) => {
    const favs = get().favorites;
    const newFavs = favs.includes(toolId)
      ? favs.filter((id) => id !== toolId) : [...favs, toolId];
    saveArr(FAV_KEY, newFavs);
    set({ favorites: newFavs });
  },

  addRecent: (toolId) => {
    const newR = [toolId, ...get().recentTools.filter((id) => id !== toolId)].slice(0, MAX_RECENT);
    saveArr(RECENT_KEY, newR);
    set({ recentTools: newR });
  },

  setCategory: (category) => set({ selectedCategory: category, viewMode: 'tool', activeTabId: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  swapInputOutput: () => set((s) => ({ tabs: updTab(s.tabs, s.activeTabId, (t) => ({ ...t, input: t.output, output: t.input })) })),
  clearInput: () => set((s) => ({ tabs: updTab(s.tabs, s.activeTabId, (t) => ({ ...t, input: '' })) })),
  getActiveTab: () => get().tabs.find((t) => t.toolId === get().activeTabId) ?? null,
}));
