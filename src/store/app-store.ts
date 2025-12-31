import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Agent, Conversation, HistoryEntry, Message, AgentTemplate } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

interface AppState {
  // User
  userId: string | null;
  setUserId: (id: string | null) => void;
  
  // Agents
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'runCount'>) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  getAgent: (id: string) => Agent | undefined;
  syncAgentsFromCloud: () => Promise<void>;
  
  // Conversations (local only)
  conversations: Conversation[];
  getConversation: (agentId: string) => Conversation | undefined;
  addMessage: (agentId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearConversation: (agentId: string) => void;
  
  // History
  history: HistoryEntry[];
  setHistory: (history: HistoryEntry[]) => void;
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => Promise<void>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  syncHistoryFromCloud: () => Promise<void>;
  
  // Settings
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  
  // Export data
  exportData: () => string;
  clearAllData: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      userId: null,
      setUserId: (id) => set({ userId: id }),
      
      // Agents
      agents: [],
      setAgents: (agents) => set({ agents }),
      
      addAgent: async (agentData) => {
        const { userId, cloudSyncEnabled } = get();
        
        const newAgent: Agent = {
          ...agentData,
          id: generateId(),
          createdAt: new Date(),
          runCount: 0,
        };
        
        // Save to cloud if user is logged in and sync is enabled
        if (userId && cloudSyncEnabled) {
          const { data, error } = await supabase
            .from('agents')
            .insert({
              user_id: userId,
              name: newAgent.name,
              description: newAgent.description,
              template: newAgent.template,
              prompt: newAgent.prompt,
              temperature: newAgent.settings.temperature,
              max_tokens: newAgent.settings.maxTokens,
              run_count: 0,
            })
            .select()
            .single();
          
          if (!error && data) {
            newAgent.id = data.id;
            newAgent.createdAt = new Date(data.created_at);
          }
        }
        
        set((state) => ({ agents: [...state.agents, newAgent] }));
        return newAgent;
      },
      
      updateAgent: async (id, updates) => {
        const { userId, cloudSyncEnabled, agents } = get();
        
        // Update in cloud if user is logged in
        if (userId && cloudSyncEnabled) {
          const updateData: Record<string, unknown> = {};
          if (updates.name) updateData.name = updates.name;
          if (updates.description) updateData.description = updates.description;
          if (updates.prompt) updateData.prompt = updates.prompt;
          if (updates.settings?.temperature !== undefined) updateData.temperature = updates.settings.temperature;
          if (updates.settings?.maxTokens !== undefined) updateData.max_tokens = updates.settings.maxTokens;
          if (updates.runCount !== undefined) updateData.run_count = updates.runCount;
          if (updates.lastRunAt) updateData.last_run_at = updates.lastRunAt;
          
          await supabase.from('agents').update(updateData).eq('id', id).eq('user_id', userId);
        }
        
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, ...updates } : agent
          ),
        }));
      },
      
      deleteAgent: async (id) => {
        const { userId, cloudSyncEnabled } = get();
        
        if (userId && cloudSyncEnabled) {
          await supabase.from('agents').delete().eq('id', id).eq('user_id', userId);
        }
        
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
          conversations: state.conversations.filter((c) => c.agentId !== id),
        }));
      },
      
      getAgent: (id) => get().agents.find((agent) => agent.id === id),
      
      syncAgentsFromCloud: async () => {
        const { userId } = get();
        if (!userId) return;
        
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          const agents: Agent[] = data.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description || '',
            template: row.template as AgentTemplate,
            prompt: row.prompt,
            settings: {
              temperature: Number(row.temperature) || 0.5,
              maxTokens: row.max_tokens || 500,
            },
            createdAt: new Date(row.created_at),
            lastRunAt: row.last_run_at ? new Date(row.last_run_at) : undefined,
            runCount: row.run_count || 0,
          }));
          set({ agents });
        }
      },
      
      // Conversations (local only for now)
      conversations: [],
      
      getConversation: (agentId) =>
        get().conversations.find((c) => c.agentId === agentId),
      
      addMessage: (agentId, messageData) => {
        const newMessage: Message = {
          ...messageData,
          id: generateId(),
          timestamp: new Date(),
        };
        
        set((state) => {
          const existingConv = state.conversations.find((c) => c.agentId === agentId);
          
          if (existingConv) {
            return {
              conversations: state.conversations.map((c) =>
                c.agentId === agentId
                  ? { ...c, messages: [...c.messages, newMessage] }
                  : c
              ),
            };
          }
          
          return {
            conversations: [
              ...state.conversations,
              {
                id: generateId(),
                agentId,
                messages: [newMessage],
                createdAt: new Date(),
              },
            ],
          };
        });
      },
      
      clearConversation: (agentId) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.agentId !== agentId),
        }));
      },
      
      // History
      history: [],
      setHistory: (history) => set({ history }),
      
      addHistoryEntry: async (entryData) => {
        const { userId, cloudSyncEnabled } = get();
        
        const newEntry: HistoryEntry = {
          ...entryData,
          id: generateId(),
          timestamp: new Date(),
        };
        
        if (userId && cloudSyncEnabled) {
          const { data, error } = await supabase
            .from('history')
            .insert({
              user_id: userId,
              agent_id: entryData.agentId,
              agent_name: entryData.agentName,
              prompt: entryData.prompt,
              response: entryData.response,
            })
            .select()
            .single();
          
          if (!error && data) {
            newEntry.id = data.id;
            newEntry.timestamp = new Date(data.created_at);
          }
        }
        
        set((state) => ({ history: [newEntry, ...state.history] }));
      },
      
      deleteHistoryEntry: async (id) => {
        const { userId, cloudSyncEnabled } = get();
        
        if (userId && cloudSyncEnabled) {
          await supabase.from('history').delete().eq('id', id).eq('user_id', userId);
        }
        
        set((state) => ({
          history: state.history.filter((entry) => entry.id !== id),
        }));
      },
      
      clearHistory: async () => {
        const { userId, cloudSyncEnabled } = get();
        
        if (userId && cloudSyncEnabled) {
          await supabase.from('history').delete().eq('user_id', userId);
        }
        
        set({ history: [] });
      },
      
      syncHistoryFromCloud: async () => {
        const { userId } = get();
        if (!userId) return;
        
        const { data, error } = await supabase
          .from('history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (!error && data) {
          const history: HistoryEntry[] = data.map((row) => ({
            id: row.id,
            agentId: row.agent_id || '',
            agentName: row.agent_name,
            prompt: row.prompt,
            response: row.response,
            timestamp: new Date(row.created_at),
          }));
          set({ history });
        }
      },
      
      // Settings
      cloudSyncEnabled: false,
      setCloudSyncEnabled: (enabled) => set({ cloudSyncEnabled: enabled }),
      
      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      
      // Export/Clear
      exportData: () => {
        const state = get();
        return JSON.stringify({
          agents: state.agents,
          conversations: state.conversations,
          history: state.history,
          exportedAt: new Date().toISOString(),
        }, null, 2);
      },
      
      clearAllData: () => {
        set({
          agents: [],
          conversations: [],
          history: [],
          cloudSyncEnabled: false,
        });
      },
    }),
    {
      name: 'pocketagent-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        agents: state.agents,
        conversations: state.conversations,
        history: state.history,
        cloudSyncEnabled: state.cloudSyncEnabled,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

// Demo agents for first-time users
export function createDemoAgents() {
  const store = useAppStore.getState();
  
  if (store.agents.length === 0) {
    store.addAgent({
      name: 'Quick Summarizer',
      description: 'Summarize any text into key bullet points',
      template: 'summarizer',
      prompt: 'Summarize the following text into 3-5 concise bullet points, focusing on the most important information.',
      settings: { temperature: 0.3, maxTokens: 500 },
    });
    
    store.addAgent({
      name: 'Email Assistant',
      description: 'Draft professional emails in seconds',
      template: 'email-draft',
      prompt: 'Draft a professional, friendly email based on the following context. Keep it concise (3-5 sentences).',
      settings: { temperature: 0.7, maxTokens: 400 },
    });
  }
}