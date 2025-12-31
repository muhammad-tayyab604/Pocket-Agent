/**
 * AI Service - Connected to Lovable AI Gateway
 * Uses real AI models via backend edge function
 */

import { supabase } from '@/integrations/supabase/client';
import { AgentTemplate, AgentSettings } from './types';

interface AIRequest {
  template: AgentTemplate;
  prompt: string;
  input: string;
  settings: AgentSettings;
}

interface AIResponse {
  content: string;
  tokensUsed: number;
}

// Content filter - blocks harmful content (client-side pre-check)
const BLOCKED_PATTERNS = [
  /\b(hack|exploit|illegal|harmful)\b/i,
  /\b(hate|violence|discriminat)/i,
];

export function isContentBlocked(text: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Main AI generation function - calls the edge function
 */
export async function generateResponse(request: AIRequest): Promise<AIResponse> {
  // Client-side content safety check
  if (isContentBlocked(request.input)) {
    throw new Error('Content blocked: Please ensure your request follows our content guidelines.');
  }
  
  const { data, error } = await supabase.functions.invoke('ai-agent', {
    body: {
      template: request.template,
      userPrompt: request.prompt,
      input: request.input,
      temperature: request.settings.temperature,
      maxTokens: request.settings.maxTokens,
    },
  });

  if (error) {
    console.error('AI service error:', error);
    throw new Error('AI service temporarily unavailable. Please try again.');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    content: data.content,
    tokensUsed: data.tokensUsed || 0,
  };
}