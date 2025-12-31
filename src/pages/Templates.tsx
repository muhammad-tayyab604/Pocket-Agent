import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/ui/bottom-nav';
import { AGENT_TEMPLATES, AgentTemplateInfo } from '@/lib/types';
import { useAppStore } from '@/store/app-store';
import { toast } from '@/hooks/use-toast';

export default function Templates() {
  const navigate = useNavigate();
  const addAgent = useAppStore((s) => s.addAgent);
  
  const handleUseTemplate = (template: AgentTemplateInfo) => {
    addAgent({
      name: `My ${template.name}`,
      description: template.description,
      template: template.id,
      prompt: template.samplePrompt,
      settings: { temperature: 0.5, maxTokens: 500 },
    });
    
    toast({
      title: 'Agent created!',
      description: `${template.name} agent added to your dashboard`,
    });
    
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 safe-area-top">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Templates</h1>
              <p className="text-sm text-muted-foreground">Ready-to-use agent blueprints</p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="px-4 py-4">
        <div className="space-y-4">
          {AGENT_TEMPLATES.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                {/* Template header */}
                <div className="p-4 bg-gradient-to-r from-secondary to-secondary/50">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-card flex items-center justify-center text-3xl shadow-sm">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground">
                        {template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Sample content */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Sample Prompt
                    </p>
                    <p className="text-sm text-foreground bg-secondary px-3 py-2 rounded-lg">
                      "{template.samplePrompt}"
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Sample Output
                    </p>
                    <p className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg whitespace-pre-wrap line-clamp-4">
                      {template.sampleOutput}
                    </p>
                  </div>
                </div>
                
                {/* Action */}
                <div className="px-4 pb-4">
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                    >
                      Use This Template
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Info card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Card className="p-4 bg-primary/5 border-primary/20">
            <h4 className="font-medium text-foreground text-sm mb-1">
              Want more templates?
            </h4>
            <p className="text-xs text-muted-foreground">
              Create your own custom agents with the Create button. You can customize
              the prompt, settings, and more to fit your specific needs.
            </p>
          </Card>
        </motion.div>
      </main>
      
      <BottomNav />
    </div>
  );
}
