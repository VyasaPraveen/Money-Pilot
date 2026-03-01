'use client';

import { useState, useEffect } from 'react';
import PinLogin from '@/components/PinLogin';
import Dashboard from '@/components/Dashboard';
import AddTransaction from '@/components/AddTransaction';
import History from '@/components/History';
import BottomNav from '@/components/BottomNav';

export default function Home() {
  const [user, setUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const saved = sessionStorage.getItem('currentUser');
    if (saved) setUser(saved);
  }, []);

  const handleLogin = (name: string) => {
    setUser(name);
    sessionStorage.setItem('currentUser', name);
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
  };

  if (!user) return <PinLogin onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {activeTab === 'dashboard' && <Dashboard user={user} onLogout={handleLogout} />}
      {activeTab === 'add' && <AddTransaction user={user} />}
      {activeTab === 'history' && <History />}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
