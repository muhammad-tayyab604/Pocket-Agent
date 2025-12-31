import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AgentCard } from '@/components/ui/agent-card';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useAppStore } from '@/store/app-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  
  const agents = useAppStore((s) => s.agents);
  const deleteAgent = useAppStore((s) => s.deleteAgent);
  
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleRunAgent = (agentId: string) => {
    navigate(`/chat/${agentId}`);
  };
  
  const handleDeleteAgent = () => {
    if (agentToDelete) {
      deleteAgent(agentToDelete);
      setAgentToDelete(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 safe-area-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">PocketAgent</h1>
              <p className="text-sm text-muted-foreground">Your AI assistants</p>
            </div>
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bot className="w-5 h-5 text-primary-foreground" />
            </motion.div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-0"
            />
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="px-4 py-4">
        {agents.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No agents yet
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              Create your first AI agent to start automating micro-tasks
            </p>
            <Button
              onClick={() => navigate('/create')}
              className="bg-gradient-hero text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Agent
            </Button>
          </motion.div>
        ) : (
          /* Agent list */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
              </h2>
            </div>
            
            {filteredAgents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No agents match your search</p>
              </div>
            ) : (
              filteredAgents.map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  index={index}
                  onRun={() => handleRunAgent(agent.id)}
                  onEdit={() => navigate(`/create?edit=${agent.id}`)}
                  onDelete={() => setAgentToDelete(agent.id)}
                />
              ))
            )}
          </div>
        )}
      </main>
      
      {/* Delete confirmation */}
      <AlertDialog open={!!agentToDelete} onOpenChange={() => setAgentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The agent and its conversation history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <BottomNav />
    </div>
  );
}
