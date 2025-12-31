export interface Agent {
  id: string;
  name: string;
  description: string;
  template: AgentTemplate;
  prompt: string;
  settings: AgentSettings;
  createdAt: Date;
  lastRunAt?: Date;
  runCount: number;
}

export type AgentTemplate = 
  | 'summarizer'
  | 'email-draft'
  | 'research'
  | 'meeting-notes'
  | 'task-planner';

export interface AgentSettings {
  temperature: number;
  maxTokens: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  agentId: string;
  messages: Message[];
  createdAt: Date;
}

export interface HistoryEntry {
  id: string;
  agentId: string;
  agentName: string;
  prompt: string;
  response: string;
  timestamp: Date;
}

export interface AgentTemplateInfo {
  id: AgentTemplate;
  name: string;
  description: string;
  icon: string;
  samplePrompt: string;
  sampleOutput: string;
}

export const AGENT_TEMPLATES: AgentTemplateInfo[] = [
  {
    id: 'summarizer',
    name: 'Summarizer',
    description: 'Condense long content into key bullet points',
    icon: '📝',
    samplePrompt: 'Summarize this into 3 bullets',
    sampleOutput: '• Main point one\n• Key insight two\n• Important takeaway three',
  },
  {
    id: 'email-draft',
    name: 'Email Draft',
    description: 'Draft professional emails quickly',
    icon: '✉️',
    samplePrompt: 'Draft a polite follow-up email in 3 sentences',
    sampleOutput: 'Subject: Following Up\n\nHi [Name],\n\nI wanted to follow up on our conversation...',
  },
  {
    id: 'research',
    name: 'Quick Research',
    description: 'Get quick facts with sources',
    icon: '🔍',
    samplePrompt: 'Give 5 quick facts with sources',
    sampleOutput: '1. Fact one (Source: example.com)\n2. Fact two (Source: research.org)...',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Organize meeting discussions into structured notes',
    icon: '📋',
    samplePrompt: 'Turn this into structured meeting notes with action items',
    sampleOutput: '## Meeting Summary\n\n**Attendees:** ...\n\n**Key Decisions:** ...\n\n**Action Items:**\n- [ ] Task 1',
  },
  {
    id: 'task-planner',
    name: 'Task Planner',
    description: 'Break down goals into actionable tasks',
    icon: '✅',
    samplePrompt: 'Break this goal into 5 actionable tasks with priorities',
    sampleOutput: '**Priority Tasks:**\n\n1. 🔴 High: First task\n2. 🟡 Medium: Second task...',
  },
];
