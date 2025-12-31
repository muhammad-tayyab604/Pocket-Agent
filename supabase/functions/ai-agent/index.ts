import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompts for different agent templates
const TEMPLATE_PROMPTS: Record<string, string> = {
  'summarizer': 'You are a concise summarizer. Take the user input and summarize it into 3-5 clear bullet points. Focus on the most important information. Use markdown formatting.',
  'email-draft': 'You are a professional email writer. Draft a polite, professional email based on the context provided. Keep it concise (3-5 sentences) and friendly. Include a subject line.',
  'research': 'You are a research assistant. Provide 5 quick, accurate facts about the topic with reliable sources. Use numbered format with source citations.',
  'meeting-notes': 'You are a meeting notes organizer. Structure the input into: Key Decisions, Discussion Summary, Action Items (with checkboxes), and Next Steps. Use markdown formatting.',
  'task-planner': 'You are a task planning expert. Break down the goal into 5 prioritized tasks with deadlines. Use priority levels (High/Medium/Low) with emojis.',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, userPrompt, input, temperature = 0.5, maxTokens = 500 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service is not configured');
    }

    // Content safety check
    const blockedPatterns = [
      /\b(hack|exploit|illegal|harmful)\b/i,
      /\b(hate|violence|discriminat)/i,
    ];
    
    if (blockedPatterns.some(pattern => pattern.test(input))) {
      return new Response(
        JSON.stringify({ error: 'Content blocked: Please ensure your request follows our content guidelines.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = TEMPLATE_PROMPTS[template] || 'You are a helpful AI assistant.';
    const fullPrompt = userPrompt ? `${systemPrompt}\n\nAdditional instructions: ${userPrompt}` : systemPrompt;

    console.log(`Processing ${template} agent request...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: input },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits in Settings.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated';
    const tokensUsed = data.usage?.total_tokens || 0;

    console.log(`Successfully processed request, used ${tokensUsed} tokens`);

    return new Response(
      JSON.stringify({ content, tokensUsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-agent function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});