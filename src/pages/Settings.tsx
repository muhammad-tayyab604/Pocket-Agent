import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Shield, 
  Download, 
  Trash2, 
  Mail, 
  FileText, 
  Info,
  ExternalLink,
  ChevronRight,
  LogIn,
  LogOut,
  User,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/hooks/use-auth';
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
import { supabase } from '@/integrations/supabase/client';

const APP_VERSION = '1.0.0';

export default function Settings() {
  const navigate = useNavigate();
  const [showClearData, setShowClearData] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const { user, signOut } = useAuth();
  
  const cloudSyncEnabled = useAppStore((s) => s.cloudSyncEnabled);
  const setCloudSyncEnabled = useAppStore((s) => s.setCloudSyncEnabled);
  const exportData = useAppStore((s) => s.exportData);
  const clearAllData = useAppStore((s) => s.clearAllData);
  const agents = useAppStore((s) => s.agents);
  const history = useAppStore((s) => s.history);
  const syncAgentsFromCloud = useAppStore((s) => s.syncAgentsFromCloud);
  const syncHistoryFromCloud = useAppStore((s) => s.syncHistoryFromCloud);
  
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketagent-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast({ title: 'Data exported successfully' });
  };
  
  const handleClearData = () => {
    clearAllData();
    setShowClearData(false);
    toast({ title: 'All data cleared' });
  };
  
  const handleDeleteAccount = async () => {
  if (!user) return;

  setIsDeletingAccount(true);

  try {
    // 1. Get the current session (THIS is what you were missing)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('User is not authenticated');
    }

    const accessToken = session.access_token;

    // 2. Call edge function WITH Authorization header
    const { data, error } = await supabase.functions.invoke('delete-user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        reason: 'user requested deletion',
      },
    });

    if (error) throw error;

    // 3. Sign out locally AFTER deletion
    await supabase.auth.signOut();

    clearAllData();
    navigate('/');

    toast({
      title: 'Account deleted',
      description: 'Your account has been permanently deleted.',
    });
  } catch (err) {
    console.error(err);
    toast({
      title: 'Delete failed',
      description: 'Something went wrong deleting your account.',
      variant: 'destructive',
    });
  } finally {
    setIsDeletingAccount(false);
  }
};

  
  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out successfully' });
  };
  
  const handleSyncToggle = async (enabled: boolean) => {
    if (enabled && !user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to enable cloud sync',
      });
      navigate('/auth');
      return;
    }
    
    setCloudSyncEnabled(enabled);
    
    if (enabled && user) {
      setIsSyncing(true);
      try {
        await syncAgentsFromCloud();
        await syncHistoryFromCloud();
        toast({ title: 'Cloud sync enabled', description: 'Your data is now synced' });
      } catch (error) {
        toast({ title: 'Sync failed', variant: 'destructive' });
      } finally {
        setIsSyncing(false);
      }
    }
  };
  
  const handleManualSync = async () => {
    if (!user || !cloudSyncEnabled) return;
    
    setIsSyncing(true);
    try {
      await syncAgentsFromCloud();
      await syncHistoryFromCloud();
      toast({ title: 'Sync complete' });
    } catch (error) {
      toast({ title: 'Sync failed', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 safe-area-top">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your app preferences</p>
        </div>
      </header>
      
      {/* Content */}
      <main className="px-4 py-4 space-y-6">
        {/* Account */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Account
          </h2>
          <Card className="divide-y divide-border/50">
            {user ? (
              <>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Signed In</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-foreground">Sign In</h3>
                    <p className="text-sm text-muted-foreground">
                      Sync agents across devices
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </Card>
        </section>
        
        {/* Cloud Sync */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Sync & Storage
          </h2>
          <Card className="divide-y divide-border/50">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Cloud Sync</h3>
                  <p className="text-sm text-muted-foreground">
                    {user ? 'Sync agents across devices' : 'Sign in to enable'}
                  </p>
                </div>
              </div>
              <Switch
                checked={cloudSyncEnabled}
                onCheckedChange={handleSyncToggle}
                disabled={!user}
              />
            </div>
            
            {cloudSyncEnabled && user && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </motion.div>
            )}
          </Card>
        </section>
        
        {/* Data Management */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Data Management
          </h2>
          <Card className="divide-y divide-border/50">
            <button
              onClick={handleExport}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Download className="w-5 h-5 text-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground">Export Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Download as JSON ({agents.length} agents, {history.length} entries)
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <button
              onClick={() => setShowClearData(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-destructive">Clear All Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Delete all agents and history
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            {user && (
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Delete your account and all associated data
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </Card>
        </section>
        
        {/* Privacy & Legal */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Privacy & Legal
          </h2>
          <Card className="divide-y divide-border/50">
            <a
              href="/privacy.html"
              className="block p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground">
                    How we handle your data
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
            </a>
            
            <a
              href="/terms.html"
              className="block p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground">Terms of Service</h3>
                  <p className="text-sm text-muted-foreground">
                    Usage terms and conditions
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
            </a>
          </Card>
        </section>
        
        {/* Support */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Support
          </h2>
          <Card>
            <a
              href="mailto:tayyab@floopy.store"
              className="block p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Mail className="w-5 h-5 text-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground">Contact Support</h3>
                  <p className="text-sm text-muted-foreground">
                    tayyab@floopy.store
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
            </a>
          </Card>
        </section>
        
        {/* About */}
        <section>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
                <Info className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">PocketAgent</h3>
                <p className="text-sm text-muted-foreground">Version {APP_VERSION}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Lightweight AI agents for micro-tasks. Built with privacy in mind.
              Your data stays on your device unless you enable cloud sync.
            </p>
          </Card>
        </section>
        
        {/* Data Safety Info */}
        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground text-sm">Data Safety</h4>
              <p className="text-xs text-muted-foreground mt-1">
                • No personal data collected by default<br />
                • All processing happens on-device<br />
                • Cloud sync is opt-in only<br />
                • Only INTERNET permission required
              </p>
            </div>
          </div>
        </Card>
      </main>
      
      {/* Clear data dialog */}
      <AlertDialog open={showClearData} onOpenChange={setShowClearData}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your agents, conversations, and history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete account dialog */}
      <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data from our servers.
              This action cannot be undone. You will be signed out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Confirm Account Deletion'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <BottomNav />
    </div>
  );
}