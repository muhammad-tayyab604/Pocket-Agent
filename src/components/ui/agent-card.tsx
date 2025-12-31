import { Agent, AGENT_TEMPLATES } from '@/lib/types';
import { Card } from './card';
import { Button } from './button';
import { Play, MoreVertical, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface AgentCardProps {
  agent: Agent;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
}

export function AgentCard({ agent, onRun, onEdit, onDelete, index = 0 }: AgentCardProps) {
  const template = AGENT_TEMPLATES.find((t) => t.id === agent.template);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card className="p-4 hover:shadow-card transition-all duration-300 group cursor-pointer bg-card border-border/50">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
            {template?.icon || '🤖'}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">{agent.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {agent.description}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Agent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-secondary">
                  {template?.name || 'Custom'}
                </span>
                {agent.lastRunAt && (
                  <span>
                    Last run {formatDistanceToNow(new Date(agent.lastRunAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRun();
                  }}
                  className="bg-gradient-hero text-primary-foreground hover:opacity-90"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Run
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
