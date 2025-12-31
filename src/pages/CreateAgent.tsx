import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/store/app-store';
import { AGENT_TEMPLATES, AgentTemplate } from '@/lib/types';
import { generateResponse } from '@/lib/ai-service';
import { toast } from '@/hooks/use-toast';

const STEPS = ['Template', 'Details', 'Settings', 'Review'];

export default function CreateAgent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const addAgent = useAppStore((s) => s.addAgent);
  const updateAgent = useAppStore((s) => s.updateAgent);
  const getAgent = useAppStore((s) => s.getAgent);
  
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState([0.5]);
  const [maxTokens, setMaxTokens] = useState([500]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  // Load existing agent for editing
  useEffect(() => {
    if (editId) {
      const agent = getAgent(editId);
      if (agent) {
        setSelectedTemplate(agent.template);
        setName(agent.name);
        setDescription(agent.description);
        setPrompt(agent.prompt);
        setTemperature([agent.settings.temperature]);
        setMaxTokens([agent.settings.maxTokens]);
        setStep(1); // Start at details step
      }
    }
  }, [editId, getAgent]);
  
  const selectedTemplateInfo = AGENT_TEMPLATES.find((t) => t.id === selectedTemplate);
  
  const handleSelectTemplate = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    const info = AGENT_TEMPLATES.find((t) => t.id === template);
    if (info && !editId) {
      setPrompt(info.samplePrompt);
    }
  };
  
  const handleTestAgent = async () => {
    if (!selectedTemplate) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await generateResponse({
        template: selectedTemplate,
        prompt,
        input: 'This is a test input to verify the agent is working correctly.',
        settings: { temperature: temperature[0], maxTokens: maxTokens[0] },
      });
      setTestResult(response.content);
      toast({
        title: 'Test successful!',
        description: 'Your agent is working correctly.',
      });
    } catch (error) {
      toast({
        title: 'Test failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleSave = () => {
    if (!selectedTemplate) return;
    
    const agentData = {
      name: name || `My ${selectedTemplateInfo?.name}`,
      description: description || selectedTemplateInfo?.description || '',
      template: selectedTemplate,
      prompt,
      settings: { temperature: temperature[0], maxTokens: maxTokens[0] },
    };
    
    if (editId) {
      updateAgent(editId, agentData);
      toast({ title: 'Agent updated!' });
    } else {
      addAgent(agentData);
      toast({ title: 'Agent created!' });
    }
    
    navigate('/');
  };
  
  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedTemplate;
      case 1: return !!prompt.trim();
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };
  
  const nextStep = () => {
    if (step < STEPS.length - 1 && canProceed()) {
      setStep(step + 1);
    } else if (step === STEPS.length - 1) {
      handleSave();
    }
  };
  
  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 safe-area-top">
        <div className="px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={prevStep}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">
              {editId ? 'Edit Agent' : 'Create Agent'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <motion.div
            className="h-full bg-gradient-hero"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>
      
      {/* Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Choose a template
                </h2>
                <p className="text-muted-foreground">
                  Pick a starting point for your agent
                </p>
              </div>
              
              <div className="space-y-3">
                {AGENT_TEMPLATES.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {template.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Customize your agent
                </h2>
                <p className="text-muted-foreground">
                  Give it a name and adjust the prompt
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Agent Name
                  </label>
                  <Input
                    placeholder={`My ${selectedTemplateInfo?.name}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-0"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Description (optional)
                  </label>
                  <Input
                    placeholder="What does this agent do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-secondary border-0"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Prompt / Instructions
                  </label>
                  <Textarea
                    placeholder="Enter the instructions for your agent..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-secondary border-0 min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    This tells the AI what to do with user input
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Fine-tune settings
                </h2>
                <p className="text-muted-foreground">
                  Adjust how creative and verbose the agent is
                </p>
              </div>
              
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-foreground">
                      Creativity Level
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {temperature[0].toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-foreground">
                      Response Length
                    </label>
                    <span className="text-sm text-muted-foreground">
                      ~{maxTokens[0]} words
                    </span>
                  </div>
                  <Slider
                    value={maxTokens}
                    onValueChange={setMaxTokens}
                    min={100}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Brief</span>
                    <span>Detailed</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Review & Save
                </h2>
                <p className="text-muted-foreground">
                  Test your agent before saving
                </p>
              </div>
              
              {/* Summary card */}
              <Card className="p-4 bg-secondary/50">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                    {selectedTemplateInfo?.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {name || `My ${selectedTemplateInfo?.name}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplateInfo?.name} template
                    </p>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Creativity: {temperature[0].toFixed(1)}</p>
                  <p>Max length: ~{maxTokens[0]} words</p>
                </div>
              </Card>
              
              {/* Privacy notice */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm">
                      Privacy & Data
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      This agent runs locally. Your prompts and inputs are not shared
                      unless you enable cloud sync in settings.
                    </p>
                  </div>
                </div>
              </Card>
              
              {/* Test button */}
              <Button
                variant="outline"
                onClick={handleTestAgent}
                disabled={isTesting}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isTesting ? 'Testing...' : 'Run Test'}
              </Button>
              
              {/* Test result */}
              {testResult && (
                <Card className="p-4 bg-success/10 border-success/20">
                  <h4 className="font-medium text-sm text-foreground mb-2">
                    Test Output
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                    {testResult}
                  </p>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Bottom action */}
      <div className="p-4 pb-8 border-t border-border/50 safe-area-bottom">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="w-full h-14 text-lg bg-gradient-hero text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {step === STEPS.length - 1 ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                {editId ? 'Save Changes' : 'Create Agent'}
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
