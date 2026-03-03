'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_MODES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  ACCOUNTS,
} from '@/lib/constants';
import type { User, UserSettings, RecurringExpense, SavingsGoal } from '@/lib/constants';
import { updateUserSettings } from '@/lib/userService';
import { Check, Loader2, Plus, Trash2, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface Props {
  user: User;
  onUserUpdate: (user: User) => void;
}

export default function Settings({ user, onUserUpdate }: Props) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(user.settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { dark, toggle: toggleDark } = useDarkMode();

  // Budget states
  const [budgetInput, setBudgetInput] = useState(String(user.settings.monthlyBudget || ''));
  const [catBudgetCategory, setCatBudgetCategory] = useState('');
  const [catBudgetAmount, setCatBudgetAmount] = useState('');

  // Recurring expense states
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [recCategory, setRecCategory] = useState(EXPENSE_CATEGORIES[0] as string);
  const [recAmount, setRecAmount] = useState('');
  const [recPaymentMode, setRecPaymentMode] = useState('Cash');
  const [recAccount, setRecAccount] = useState('Personal');
  const [recDay, setRecDay] = useState('1');
  const [recNote, setRecNote] = useState('');
  const [recCustomCategory, setRecCustomCategory] = useState('');

  // Savings goal states
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalCategory, setGoalCategory] = useState('Gold Savings');
  const [goalTarget, setGoalTarget] = useState('');

  // Auto-save with 1s debounce
  useEffect(() => {
    if (JSON.stringify(localSettings) === JSON.stringify(user.settings)) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      setError('');
      try {
        await updateUserSettings(user.id, localSettings);
        onUserUpdate({ ...user, settings: localSettings });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError('Failed to save. Try again.');
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [localSettings, user, onUserUpdate]);

  const toggleItem = useCallback(
    (
      list: 'disabledExpenseCategories' | 'disabledIncomeCategories' | 'disabledPaymentModes',
      item: string,
      allItems: readonly string[]
    ) => {
      setLocalSettings((prev) => {
        const current = prev[list];
        const isDisabled = current.includes(item);

        if (!isDisabled) {
          const enabledCount = allItems.length - current.length;
          if (enabledCount <= 1) return prev;
        }

        const updated = isDisabled
          ? current.filter((i) => i !== item)
          : [...current, item];

        return { ...prev, [list]: updated };
      });
    },
    []
  );

  const isEnabled = (list: keyof UserSettings, item: string) =>
    !(localSettings[list] as string[]).includes(item);

  const saveMonthlyBudget = () => {
    const val = Number(budgetInput);
    if (isNaN(val) || val < 0) return;
    setLocalSettings((prev) => ({ ...prev, monthlyBudget: val || undefined }));
  };

  const addCategoryBudget = () => {
    if (!catBudgetCategory || !catBudgetAmount || Number(catBudgetAmount) <= 0) return;
    setLocalSettings((prev) => ({
      ...prev,
      categoryBudgets: { ...(prev.categoryBudgets || {}), [catBudgetCategory]: Number(catBudgetAmount) },
    }));
    setCatBudgetCategory('');
    setCatBudgetAmount('');
  };

  const removeCategoryBudget = (cat: string) => {
    setLocalSettings((prev) => {
      const budgets = { ...(prev.categoryBudgets || {}) };
      delete budgets[cat];
      return { ...prev, categoryBudgets: budgets };
    });
  };

  const addRecurring = () => {
    if (!recAmount || Number(recAmount) <= 0) return;
    const newItem: RecurringExpense = {
      id: Date.now().toString(),
      category: recCategory,
      amount: Number(recAmount),
      paymentMode: recPaymentMode,
      account: recAccount,
      dayOfMonth: Number(recDay) || 1,
      note: recNote,
      ...(recCategory === 'Other' && recCustomCategory ? { customCategory: recCustomCategory } : {}),
    };
    setLocalSettings((prev) => ({
      ...prev,
      recurringExpenses: [...(prev.recurringExpenses || []), newItem],
    }));
    setRecAmount('');
    setRecNote('');
    setRecCustomCategory('');
    setShowAddRecurring(false);
  };

  const removeRecurring = (id: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).filter((r) => r.id !== id),
    }));
  };

  const addSavingsGoal = () => {
    if (!goalCategory || !goalTarget || Number(goalTarget) <= 0) return;
    const newGoal: SavingsGoal = {
      category: goalCategory,
      monthlyTarget: Number(goalTarget),
    };
    setLocalSettings((prev) => ({
      ...prev,
      savingsGoals: [...(prev.savingsGoals || []).filter((g) => g.category !== goalCategory), newGoal],
    }));
    setGoalTarget('');
    setShowAddGoal(false);
  };

  const removeSavingsGoal = (cat: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      savingsGoals: (prev.savingsGoals || []).filter((g) => g.category !== cat),
    }));
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* User Card */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 shadow-sm mb-6 text-white">
        <p className="text-xs uppercase opacity-80 tracking-wide">Logged in as</p>
        <p className="text-lg font-bold mt-1">{user.name}</p>
      </div>

      {/* Save Status */}
      <div className="h-6 mb-4 flex items-center justify-center">
        {saving && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Loader2 size={14} className="animate-spin" />
            Saving...
          </div>
        )}
        {saved && !saving && (
          <div className="flex items-center gap-1.5 text-emerald-500 text-xs">
            <Check size={14} />
            Saved
          </div>
        )}
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>

      {/* Dark Mode Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dark ? <Moon size={18} className="text-violet-500" /> : <Sun size={18} className="text-amber-500" />}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {dark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <button
            onClick={toggleDark}
            className={`w-11 h-6 rounded-full transition-all relative ${dark ? 'bg-violet-500' : 'bg-slate-200'}`}
            role="switch"
            aria-checked={dark}
            aria-label="Toggle dark mode"
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Monthly Budget */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Monthly Budget</h3>
        <p className="text-xs text-slate-400 mb-3">Set a spending limit to track on Dashboard</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            placeholder="e.g. 50000"
            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
          />
          <button
            onClick={saveMonthlyBudget}
            className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-colors"
          >
            Set
          </button>
        </div>
        {localSettings.monthlyBudget ? (
          <p className="text-xs text-emerald-500 mt-2">Current: ₹{localSettings.monthlyBudget.toLocaleString('en-IN')}</p>
        ) : null}
      </div>

      {/* Category Budgets */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Category Budgets</h3>
        <p className="text-xs text-slate-400 mb-3">Set limits per category</p>

        {/* Existing */}
        {Object.entries(localSettings.categoryBudgets || {}).map(([cat, amt]) => (
          <div key={cat} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-300">{CATEGORY_ICONS[cat] || ''} {cat}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">₹{(amt as number).toLocaleString('en-IN')}</span>
              <button onClick={() => removeCategoryBudget(cat)} className="text-red-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Add new */}
        <div className="flex gap-2 mt-3">
          <select
            value={catBudgetCategory}
            onChange={(e) => setCatBudgetCategory(e.target.value)}
            className="flex-1 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-xs outline-none"
          >
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            value={catBudgetAmount}
            onChange={(e) => setCatBudgetAmount(e.target.value)}
            placeholder="Amount"
            className="w-24 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-xs outline-none"
          />
          <button onClick={addCategoryBudget} className="p-2 rounded-xl bg-violet-500 text-white hover:bg-violet-600">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Savings Goals */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Savings Goals</h3>
        <p className="text-xs text-slate-400 mb-3">Track monthly savings targets (e.g. Gold Savings)</p>

        {(localSettings.savingsGoals || []).map((goal) => (
          <div key={goal.category} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-300">{CATEGORY_ICONS[goal.category] || ''} {goal.category}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">₹{goal.monthlyTarget.toLocaleString('en-IN')}/mo</span>
              <button onClick={() => removeSavingsGoal(goal.category)} className="text-red-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {showAddGoal ? (
          <div className="mt-3 space-y-2">
            <select
              value={goalCategory}
              onChange={(e) => setGoalCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
            >
              {EXPENSE_CATEGORIES.filter((c) => c === 'Gold Savings' || c === 'SIP Savings').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              {EXPENSE_CATEGORIES.filter((c) => c !== 'Gold Savings' && c !== 'SIP Savings').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              placeholder="Monthly target amount"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAddGoal(false)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">Cancel</button>
              <button onClick={addSavingsGoal} className="flex-1 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold">Add</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddGoal(true)}
            className="mt-3 flex items-center gap-1.5 text-violet-500 text-sm font-medium hover:text-violet-600"
          >
            <Plus size={16} /> Add savings goal
          </button>
        )}
      </div>

      {/* Recurring Expenses */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Recurring Expenses</h3>
        <p className="text-xs text-slate-400 mb-3">Auto-add monthly bills on a set day</p>

        {(localSettings.recurringExpenses || []).map((rec) => (
          <div key={rec.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700">
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {CATEGORY_ICONS[rec.category] || ''} {rec.category === 'Other' && rec.customCategory ? rec.customCategory : rec.category}
              </span>
              <p className="text-[10px] text-slate-400">Day {rec.dayOfMonth} · {rec.paymentMode} · {rec.account}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">₹{rec.amount.toLocaleString('en-IN')}</span>
              <button onClick={() => removeRecurring(rec.id)} className="text-red-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {showAddRecurring ? (
          <div className="mt-3 space-y-2">
            <select
              value={recCategory}
              onChange={(e) => setRecCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {recCategory === 'Other' && (
              <input
                type="text"
                value={recCustomCategory}
                onChange={(e) => setRecCustomCategory(e.target.value)}
                placeholder="What expense?"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
              />
            )}
            <input
              type="number"
              value={recAmount}
              onChange={(e) => setRecAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={recDay}
                onChange={(e) => setRecDay(e.target.value)}
                min="1"
                max="28"
                placeholder="Day"
                className="w-20 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
              />
              <select
                value={recPaymentMode}
                onChange={(e) => setRecPaymentMode(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={recAccount}
                onChange={(e) => setRecAccount(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={recNote}
              onChange={(e) => setRecNote(e.target.value)}
              placeholder="Note (optional)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAddRecurring(false)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">Cancel</button>
              <button onClick={addRecurring} className="flex-1 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold">Add</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddRecurring(true)}
            className="mt-3 flex items-center gap-1.5 text-violet-500 text-sm font-medium hover:text-violet-600"
          >
            <Plus size={16} /> Add recurring expense
          </button>
        )}
      </div>

      {/* Expense Categories */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Expense Categories</h3>
        <p className="text-xs text-slate-400 mb-3">Toggle categories visible in Add Transaction</p>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {EXPENSE_CATEGORIES.map((cat) => (
            <ToggleRow
              key={cat}
              label={cat}
              icon={CATEGORY_ICONS[cat]}
              color={CATEGORY_COLORS[cat]}
              enabled={isEnabled('disabledExpenseCategories', cat)}
              onToggle={() => toggleItem('disabledExpenseCategories', cat, EXPENSE_CATEGORIES)}
            />
          ))}
        </div>
      </div>

      {/* Income Categories */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Income Categories</h3>
        <p className="text-xs text-slate-400 mb-3">Toggle income sources</p>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {INCOME_CATEGORIES.map((cat) => (
            <ToggleRow
              key={cat}
              label={cat}
              icon={CATEGORY_ICONS[cat]}
              color={CATEGORY_COLORS[cat]}
              enabled={isEnabled('disabledIncomeCategories', cat)}
              onToggle={() => toggleItem('disabledIncomeCategories', cat, INCOME_CATEGORIES)}
            />
          ))}
        </div>
      </div>

      {/* Payment Modes */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Payment Modes</h3>
        <p className="text-xs text-slate-400 mb-3">Toggle payment options</p>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {PAYMENT_MODES.map((mode) => (
            <ToggleRow
              key={mode}
              label={mode}
              enabled={isEnabled('disabledPaymentModes', mode)}
              onToggle={() => toggleItem('disabledPaymentModes', mode, PAYMENT_MODES)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  icon,
  color,
  enabled,
  onToggle,
}: {
  label: string;
  icon?: string;
  color?: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {icon && <span className="text-base">{icon}</span>}
        {!icon && color && (
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className={`text-sm font-medium ${enabled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
          {label}
        </span>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-all relative ${
          enabled ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-600'
        }`}
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
