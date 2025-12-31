import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Trash2, RotateCcw, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useAppStore } from '@/store/app-store';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
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

export default function History() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);
  
  const history = useAppStore((s) => s.history);
  const deleteHistoryEntry = useAppStore((s) => s.deleteHistoryEntry);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const getAgent = useAppStore((s) => s.getAgent);
  
  const filteredHistory = history.filter(
    (entry) =>
      entry.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.response.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDelete = () => {
    if (entryToDelete) {
      deleteHistoryEntry(entryToDelete);
      setEntryToDelete(null);
      toast({ title: 'Entry deleted' });
    }
  };
  
  const handleClearAll = () => {
    clearHistory();
    setShowClearAll(false);
    toast({ title: 'History cleared' });
  };
  
  const handleRerun = (entry: typeof history[0]) => {
    const agent = getAgent(entry.agentId);
    if (agent) {
      navigate(`/chat/${entry.agentId}`);
    } else {
      toast({
        title: 'Agent not found',
        description: 'The original agent has been deleted',
        variant: 'destructive',
      });
    }
  };
  
  const handleExport = (entry: typeof history[0]) => {
    const content = `Agent: ${entry.agentName}\nDate: ${format(new Date(entry.timestamp), 'PPpp')}\n\n--- Input ---\n${entry.prompt}\n\n--- Output ---\n${entry.response}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.agentName}-${format(new Date(entry.timestamp), 'yyyy-MM-dd')}.txt`;
    a.click();
    toast({ title: 'Exported successfully' });
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 safe-area-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">History</h1>
              <p className="text-sm text-muted-foreground">
                {history.length} {history.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
            
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearAll(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          {history.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-0"
              />
            </div>
          )}
        </div>
      </header>
      
      {/* Content */}
      <main className="px-4 py-4">
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No history yet
            </h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Your agent runs will appear here for easy reference and re-use
            </p>
          </motion.div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No entries match your search</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredHistory.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 bg-card">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {entry.agentName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
                        <p className="text-sm text-foreground line-clamp-2">{entry.prompt}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                        <p className="text-sm text-foreground line-clamp-3">{entry.response}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRerun(entry)}
                        className="h-8 text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Re-run
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport(entry)}
                        className="h-8 text-xs"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEntryToDelete(entry.id)}
                        className="h-8 text-xs text-destructive hover:text-destructive ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
      
      {/* Delete entry dialog */}
      <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Clear all dialog */}
      <AlertDialog open={showClearAll} onOpenChange={setShowClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {history.length} entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <BottomNav />
    </div>
  );
}
