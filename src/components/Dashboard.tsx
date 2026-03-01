'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/constants';
import { Transaction, CATEGORY_COLORS } from '@/lib/constants';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import { ChevronLeft, ChevronRight, LogOut, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MODE_COLORS: Record<string, string> = {
  'Cash': '#64748b',
  'PhonePe': '#6366f1',
  'Google Pay': '#3b82f6',
  'Bank Transfer': '#8b5cf6',
  'Credit Card': '#ec4899',
  'Other': '#78716c',
  'Unknown': '#94a3b8',
};

interface Props {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { month, year, monthKey, prevMonth, nextMonth } = useMonthNavigation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'transactions'),
      where('monthKey', '==', monthKey)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [monthKey]);

  const expenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense'),
    [transactions]
  );
  const incomes = useMemo(
    () => transactions.filter((t) => t.type === 'income'),
    [transactions]
  );
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    incomes.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [incomes]);

  const personalExpense = expenses
    .filter((t) => t.account === 'Personal')
    .reduce((s, t) => s + t.amount, 0);
  const emOfficeExpense = expenses
    .filter((t) => t.account === 'EM Office')
    .reduce((s, t) => s + t.amount, 0);

  const expenseByPaymentMode = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      const mode = t.paymentMode || 'Unknown';
      map[mode] = (map[mode] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-500 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-slate-800">{user.name}</h1>
          </div>
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            aria-label="Log out"
          >
            <LogOut size={20} className="text-slate-600" />
          </button>
        </div>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-3 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-500 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold text-slate-800">{user.name}</h1>
        </div>
        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          aria-label="Log out"
        >
          <LogOut size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm mb-6">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-slate-700">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-3 text-white">
          <TrendingUp size={18} className="mb-1 opacity-80" />
          <p className="text-[10px] uppercase opacity-80 tracking-wide">Income</p>
          <p className="text-base font-bold mt-0.5">{fmt(totalIncome)}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-3 text-white">
          <TrendingDown size={18} className="mb-1 opacity-80" />
          <p className="text-[10px] uppercase opacity-80 tracking-wide">Expense</p>
          <p className="text-base font-bold mt-0.5">{fmt(totalExpense)}</p>
        </div>
        <div
          className={`bg-gradient-to-br ${
            balance >= 0
              ? 'from-blue-500 to-indigo-600'
              : 'from-orange-500 to-amber-600'
          } rounded-2xl p-3 text-white`}
        >
          <Wallet size={18} className="mb-1 opacity-80" />
          <p className="text-[10px] uppercase opacity-80 tracking-wide">Balance</p>
          <p className="text-base font-bold mt-0.5">
            {balance < 0 ? '-' : ''}
            {fmt(Math.abs(balance))}
          </p>
        </div>
      </div>

      {/* Account Breakdown */}
      {totalExpense > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">
            Account Breakdown
          </h3>
          <div className="flex gap-3">
            <div className="flex-1 bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-medium">Personal</p>
              <p className="text-lg font-bold text-blue-700">
                {fmt(personalExpense)}
              </p>
            </div>
            <div className="flex-1 bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-purple-600 font-medium">EM Office</p>
              <p className="text-lg font-bold text-purple-700">
                {fmt(emOfficeExpense)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Mode Breakdown */}
      {expenseByPaymentMode.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">
            Payment Modes
          </h3>
          <div className="space-y-2">
            {expenseByPaymentMode.map((item) => {
              const pct = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">{item.name}</span>
                    <span className="text-xs font-semibold text-slate-800">{fmt(item.value)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: MODE_COLORS[item.name] || '#94a3b8',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spending Chart */}
      {expenseByCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">
            Top Spending Areas
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Highest: {expenseByCategory[0]?.name} ({fmt(expenseByCategory[0]?.value)})
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {expenseByCategory.map((e) => (
                  <Cell
                    key={e.name}
                    fill={CATEGORY_COLORS[e.name] || '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
            {expenseByCategory.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: CATEGORY_COLORS[item.name] || '#94a3b8',
                  }}
                />
                <span className="text-slate-600">{item.name}</span>
                <span className="font-semibold text-slate-800">
                  {fmt(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income Chart */}
      {incomeByCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">
            Income Sources
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Highest: {incomeByCategory[0]?.name} ({fmt(incomeByCategory[0]?.value)})
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={incomeByCategory} barCategoryGap="30%">
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {incomeByCategory.map((e) => (
                  <Cell
                    key={e.name}
                    fill={CATEGORY_COLORS[e.name] || '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="No data">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">No transactions this month</p>
          <p className="text-slate-400 text-sm mt-1">Tap + to add your first entry</p>
        </div>
      )}
    </div>
  );
}
