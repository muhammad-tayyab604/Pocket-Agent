import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Copy, FileText, CheckCircle, Loader2, MoreVertical, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/store/app-store';
import { generateResponse, isContentBlocked } from '@/lib/ai-service';
import { AGENT_TEMPLATES, Message } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Chat() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const agent = useAppStore((s) => s.getAgent(agentId || ''));
  const conversation = useAppStore((s) => s.getConversation(agentId || ''));
  const addMessage = useAppStore((s) => s.addMessage);
  const clearConversation = useAppStore((s) => s.clearConversation);
  const updateAgent = useAppStore((s) => s.updateAgent);
  const addHistoryEntry = useAppStore((s) => s.addHistoryEntry);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messages = conversation?.messages || [];
  const templateInfo = agent ? AGENT_TEMPLATES.find((t) => t.id === agent.template) : null;
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim() || !agent || !agentId) return;
    
    // Content filter check
    if (isContentBlocked(input)) {
      toast({
        title: 'Content blocked',
        description: 'Please ensure your message follows our content guidelines.',
        variant: 'destructive',
      });
      return;
    }
    
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);
    
    // Add user message
    addMessage(agentId, { role: 'user', content: userInput });
    
    try {
      const response = await generateResponse({
        template: agent.template,
        prompt: agent.prompt,
        input: userInput,
        settings: agent.settings,
      });
      
      // Add assistant message
      addMessage(agentId, { role: 'assistant', content: response.content });
      
      // Update agent stats
      updateAgent(agentId, {
        lastRunAt: new Date(),
        runCount: agent.runCount + 1,
      });
      
      // Add to history
      addHistoryEntry({
        agentId,
        agentName: agent.name,
        prompt: userInput,
        response: response.content,
      });
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied to clipboard' });
  };
  
  const handleClear = () => {
    if (agentId) {
      clearConversation(agentId);
      toast({ title: 'Conversation cleared' });
    }
  };
  
  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Agent not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 safe-area-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">
              {templateInfo?.icon || '🤖'}
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{agent.name}</h1>
              <p className="text-xs text-muted-foreground">{templateInfo?.name}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl mx-auto mb-4">
              {templateInfo?.icon || '🤖'}
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">
              Start a conversation
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
              {agent.description || `Use ${agent.name} to help with your tasks`}
            </p>
            
            {/* Quick actions */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Summarize this', 'Quick analysis', 'Help me with'].map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(action + ': ')}
                  className="text-xs"
                >
                  {action}
                </Button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[85%] p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs opacity-70 hover:opacity-100"
                          onClick={() => handleCopy(message.content, message.id)}
                        >
                          {copiedId === message.id ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          {copiedId === message.id ? 'Copied' : 'Copy'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs opacity-70 hover:opacity-100"
                          onClick={() => {
                            const blob = new Blob([message.content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${agent.name}-output.txt`;
                            a.click();
                          }}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <Card className="bg-secondary p-3 rounded-bl-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </Card>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>
      
      {/* Input area */}
      <div className="sticky bottom-0 bg-background border-t border-border/50 p-4 safe-area-bottom">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="bg-secondary border-0 min-h-[48px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 bg-gradient-hero text-primary-foreground"
            >
              <Send className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
