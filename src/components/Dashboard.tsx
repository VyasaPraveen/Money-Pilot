'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/constants';
import { Transaction, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/constants';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
  ChevronLeft, ChevronRight, LogOut,
  TrendingUp, TrendingDown, Wallet,
  Users, Calendar, AlertTriangle,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const { month, year, monthKey, prevMonth, nextMonth, setMonth, setYear } = useMonthNavigation();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [splitByUser, setSplitByUser] = useState(false);
  const [yearlyData, setYearlyData] = useState<Transaction[]>([]);
  const [yearlyLoading, setYearlyLoading] = useState(false);

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

  // Fetch yearly data when yearly view is active
  useEffect(() => {
    if (viewMode !== 'yearly') return;
    setYearlyLoading(true);
    const yearKeys = Array.from({ length: 12 }, (_, i) =>
      `${year}-${String(i + 1).padStart(2, '0')}`
    );
    const q = query(
      collection(db, 'transactions'),
      where('monthKey', 'in', yearKeys)
    );
    const unsub = onSnapshot(q, (snap) => {
      setYearlyData(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction))
      );
      setYearlyLoading(false);
    });
    return () => unsub();
  }, [viewMode, year]);

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

  const monthlyBudget = user.settings.monthlyBudget || 0;
  const categoryBudgets = user.settings.categoryBudgets || {};

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

  // Split by user
  const expenseByUser = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      map[t.addedBy] = (map[t.addedBy] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const incomeByUser = useMemo(() => {
    const map: Record<string, number> = {};
    incomes.forEach((t) => {
      map[t.addedBy] = (map[t.addedBy] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [incomes]);

  // Yearly overview data
  const yearlyChartData = useMemo(() => {
    return SHORT_MONTHS.map((m, i) => {
      const mk = `${year}-${String(i + 1).padStart(2, '0')}`;
      const monthTx = yearlyData.filter((t) => t.monthKey === mk);
      const exp = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const inc = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      return { name: m, Expense: exp, Income: inc };
    });
  }, [yearlyData, year]);

  const yearlyTotalExpense = yearlyData.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const yearlyTotalIncome = yearlyData.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  // Monthly summary insights
  const summaryInsights = useMemo(() => {
    const insights: string[] = [];
    if (expenseByCategory.length > 0) {
      const top = expenseByCategory[0];
      const pct = totalExpense > 0 ? Math.round((top.value / totalExpense) * 100) : 0;
      insights.push(`${CATEGORY_ICONS[top.name] || ''} ${top.name} is your top spend at ${pct}%`);
    }
    if (monthlyBudget > 0) {
      const pct = Math.round((totalExpense / monthlyBudget) * 100);
      if (pct >= 100) insights.push(`You've exceeded your monthly budget by ${fmt(totalExpense - monthlyBudget)}`);
      else if (pct >= 80) insights.push(`You've used ${pct}% of your monthly budget`);
      else insights.push(`${fmt(monthlyBudget - totalExpense)} remaining in your budget`);
    }
    if (balance > 0) {
      insights.push(`You saved ${fmt(balance)} this month`);
    } else if (balance < 0) {
      insights.push(`You spent ${fmt(Math.abs(balance))} more than you earned`);
    }
    return insights;
  }, [expenseByCategory, totalExpense, monthlyBudget, balance]);

  // Savings goals progress
  const savingsGoals = user.settings.savingsGoals || [];
  const savingsProgress = useMemo(() => {
    return savingsGoals.map((goal) => {
      const spent = expenses
        .filter((t) => t.category === goal.category)
        .reduce((s, t) => s + t.amount, 0);
      return { ...goal, current: spent, pct: goal.monthlyTarget > 0 ? Math.min(100, Math.round((spent / goal.monthlyTarget) * 100)) : 0 };
    });
  }, [savingsGoals, expenses]);

  const changeYear = (delta: number) => {
    setYear((y: number) => y + delta);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{user.name}</h1>
          </div>
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Log out"
          >
            <LogOut size={20} className="text-slate-600 dark:text-slate-300" />
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
          <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{user.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSplitByUser(!splitByUser)}
            className={`p-2.5 rounded-xl transition-colors ${splitByUser ? 'bg-violet-100 dark:bg-violet-900 text-violet-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            aria-label="Split by user"
          >
            <Users size={20} />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'monthly' ? 'yearly' : 'monthly')}
            className={`p-2.5 rounded-xl transition-colors ${viewMode === 'yearly' ? 'bg-violet-100 dark:bg-violet-900 text-violet-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            aria-label="Toggle yearly view"
          >
            <Calendar size={20} />
          </button>
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Log out"
          >
            <LogOut size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* YEARLY VIEW */}
      {viewMode === 'yearly' && (
        <>
          {/* Year Selector */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
            <button onClick={() => changeYear(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Previous year">
              <ChevronLeft size={20} className="dark:text-white" />
            </button>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-white">{year}</h2>
            <button onClick={() => changeYear(1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Next year">
              <ChevronRight size={20} className="dark:text-white" />
            </button>
          </div>

          {/* Yearly Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-3 text-white">
              <TrendingUp size={18} className="mb-1 opacity-80" />
              <p className="text-[10px] uppercase opacity-80 tracking-wide">Income</p>
              <p className="text-base font-bold mt-0.5">{fmt(yearlyTotalIncome)}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-3 text-white">
              <TrendingDown size={18} className="mb-1 opacity-80" />
              <p className="text-[10px] uppercase opacity-80 tracking-wide">Expense</p>
              <p className="text-base font-bold mt-0.5">{fmt(yearlyTotalExpense)}</p>
            </div>
            <div className={`bg-gradient-to-br ${yearlyTotalIncome - yearlyTotalExpense >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-amber-600'} rounded-2xl p-3 text-white`}>
              <Wallet size={18} className="mb-1 opacity-80" />
              <p className="text-[10px] uppercase opacity-80 tracking-wide">Saved</p>
              <p className="text-base font-bold mt-0.5">{fmt(Math.abs(yearlyTotalIncome - yearlyTotalExpense))}</p>
            </div>
          </div>

          {/* Yearly Chart */}
          {yearlyLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yearlyChartData} barGap={2}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><div className="w-3 h-3 rounded bg-emerald-500" /> Income</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><div className="w-3 h-3 rounded bg-red-500" /> Expense</div>
              </div>
            </div>
          )}

          {/* Month-by-month table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Month-by-Month</h3>
            <div className="space-y-1">
              {yearlyChartData.map((m, i) => {
                if (m.Income === 0 && m.Expense === 0) return null;
                const saved = m.Income - m.Expense;
                return (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-50 dark:border-slate-700 last:border-0">
                    <span className="text-slate-600 dark:text-slate-300 font-medium w-10">{m.name}</span>
                    <span className="text-emerald-500 text-xs">{fmt(m.Income)}</span>
                    <span className="text-rose-500 text-xs">{fmt(m.Expense)}</span>
                    <span className={`font-semibold text-xs ${saved >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                      {saved >= 0 ? '+' : '-'}{fmt(Math.abs(saved))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setViewMode('monthly')}
            className="w-full py-3 rounded-2xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 font-semibold text-sm mb-6 hover:bg-violet-100 transition-colors"
          >
            Back to Monthly View
          </button>
        </>
      )}

      {/* MONTHLY VIEW */}
      {viewMode === 'monthly' && (
        <>
          {/* Month Selector */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Previous month">
              <ChevronLeft size={20} className="dark:text-white" />
            </button>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-white">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Next month">
              <ChevronRight size={20} className="dark:text-white" />
            </button>
          </div>

          {/* Monthly Summary Insights */}
          {summaryInsights.length > 0 && (
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl p-4 mb-6 border border-violet-100 dark:border-violet-800">
              <h3 className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-2">Monthly Insights</h3>
              {summaryInsights.map((insight, i) => (
                <p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {insight}
                </p>
              ))}
            </div>
          )}

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

          {/* Budget Progress */}
          {monthlyBudget > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Budget</h3>
                <span className="text-xs font-medium text-slate-500">{fmt(totalExpense)} / {fmt(monthlyBudget)}</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalExpense / monthlyBudget >= 1
                      ? 'bg-red-500'
                      : totalExpense / monthlyBudget >= 0.8
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (totalExpense / monthlyBudget) * 100)}%` }}
                />
              </div>
              {totalExpense > monthlyBudget && (
                <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs">
                  <AlertTriangle size={14} />
                  <span>Over budget by {fmt(totalExpense - monthlyBudget)}</span>
                </div>
              )}
            </div>
          )}

          {/* Category Budget Breakdown */}
          {Object.keys(categoryBudgets).length > 0 && expenseByCategory.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Category Budgets</h3>
              <div className="space-y-3">
                {expenseByCategory.map((item) => {
                  const budget = categoryBudgets[item.name];
                  if (!budget) return null;
                  const pct = Math.min(100, (item.value / budget) * 100);
                  const over = item.value > budget;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {CATEGORY_ICONS[item.name] || ''} {item.name}
                        </span>
                        <span className={`text-xs font-semibold ${over ? 'text-red-500' : 'text-slate-500'}`}>
                          {fmt(item.value)} / {fmt(budget)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Savings Goals */}
          {savingsProgress.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Savings Goals</h3>
              <div className="space-y-3">
                {savingsProgress.map((goal) => (
                  <div key={goal.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {CATEGORY_ICONS[goal.category] || ''} {goal.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {fmt(goal.current)} / {fmt(goal.monthlyTarget)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${goal.pct >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                        style={{ width: `${goal.pct}%` }}
                      />
                    </div>
                    {goal.pct >= 100 && (
                      <p className="text-[10px] text-emerald-500 mt-1">Goal reached!</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Split by User */}
          {splitByUser && (expenseByUser.length > 0 || incomeByUser.length > 0) && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">By User</h3>
              {expenseByUser.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase text-slate-400 tracking-wide mb-2">Expenses</p>
                  <div className="space-y-2">
                    {expenseByUser.map((item) => {
                      const pct = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                      return (
                        <div key={item.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                            <span className="text-xs font-semibold text-rose-500">{fmt(item.value)} ({Math.round(pct)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-rose-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {incomeByUser.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-slate-400 tracking-wide mb-2">Income</p>
                  <div className="space-y-2">
                    {incomeByUser.map((item) => {
                      const pct = totalIncome > 0 ? (item.value / totalIncome) * 100 : 0;
                      return (
                        <div key={item.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                            <span className="text-xs font-semibold text-emerald-500">{fmt(item.value)} ({Math.round(pct)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Breakdown */}
          {totalExpense > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Account Breakdown</h3>
              <div className="flex gap-3">
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Personal</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{fmt(personalExpense)}</p>
                </div>
                <div className="flex-1 bg-purple-50 dark:bg-purple-900/30 rounded-xl p-3">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">EM Office</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{fmt(emOfficeExpense)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Mode Breakdown */}
          {expenseByPaymentMode.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Payment Modes</h3>
              <div className="space-y-2">
                {expenseByPaymentMode.map((item) => {
                  const pct = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-white">{fmt(item.value)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: MODE_COLORS[item.name] || '#94a3b8' }}
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Top Spending Areas</h3>
              <p className="text-xs text-slate-400 mb-3">
                Highest: {CATEGORY_ICONS[expenseByCategory[0]?.name] || ''} {expenseByCategory[0]?.name} ({fmt(expenseByCategory[0]?.value)})
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {expenseByCategory.map((e) => (
                      <Cell key={e.name} fill={CATEGORY_COLORS[e.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                {expenseByCategory.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <span>{CATEGORY_ICONS[item.name] || ''}</span>
                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Income Chart */}
          {incomeByCategory.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Income Sources</h3>
              <p className="text-xs text-slate-400 mb-3">
                Highest: {CATEGORY_ICONS[incomeByCategory[0]?.name] || ''} {incomeByCategory[0]?.name} ({fmt(incomeByCategory[0]?.value)})
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={incomeByCategory} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {incomeByCategory.map((e) => (
                      <Cell key={e.name} fill={CATEGORY_COLORS[e.name] || '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Empty State */}
          {transactions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No transactions this month</p>
              <p className="text-slate-400 text-sm mt-1">Tap + to add your first entry</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
