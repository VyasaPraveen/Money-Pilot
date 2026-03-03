'use client';

import { useState, useEffect } from 'react';
import PinLogin from '@/components/PinLogin';
import Dashboard from '@/components/Dashboard';
import AddTransaction from '@/components/AddTransaction';
import History from '@/components/History';
import Settings from '@/components/Settings';
import BottomNav from '@/components/BottomNav';
import type { TabId, User } from '@/lib/constants';
import { getUserById } from '@/lib/userService';
import { processRecurringExpenses } from '@/lib/recurringService';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const savedId = sessionStorage.getItem('currentUserId');
    if (savedId) {
      getUserById(savedId)
        .then((u) => {
          if (u) setUser(u);
          else sessionStorage.removeItem('currentUserId');
        })
        .catch(() => {
          sessionStorage.removeItem('currentUserId');
        })
        .finally(() => setRestoring(false));
    } else {
      setRestoring(false);
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem('currentUserId', u.id);
    // Process recurring expenses on login
    if (u.settings.recurringExpenses?.length) {
      processRecurringExpenses(u.id, u.name, u.settings.recurringExpenses).catch(() => {});
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUserId');
    setActiveTab('dashboard');
  };

  if (restoring) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <PinLogin onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {activeTab === 'dashboard' && <Dashboard user={user} onLogout={handleLogout} />}
      {activeTab === 'add' && <AddTransaction user={user} />}
      {activeTab === 'history' && <History />}
      {activeTab === 'settings' && <Settings user={user} onUserUpdate={setUser} />}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
