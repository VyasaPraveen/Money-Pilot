'use client';

import { LayoutDashboard, PlusCircle, History as HistoryIcon } from 'lucide-react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'add', label: 'Add', icon: PlusCircle },
  { id: 'history', label: 'History', icon: HistoryIcon },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-violet-600' : 'text-slate-400'
            }`}
          >
            <tab.icon
              size={activeTab === tab.id ? 24 : 22}
              strokeWidth={activeTab === tab.id ? 2.5 : 1.5}
            />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
