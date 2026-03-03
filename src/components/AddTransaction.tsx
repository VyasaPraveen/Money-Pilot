'use client';

import { useState, useMemo } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ACCOUNTS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  PAYMENT_MODES,
} from '@/lib/constants';
import type { User } from '@/lib/constants';
import { Check, AlertCircle, MinusCircle, PlusCircle } from 'lucide-react';

export default function AddTransaction({ user }: { user: User }) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('Personal');
  const [customCategory, setCustomCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [savedInfo, setSavedInfo] = useState({ amount: '', category: '' });

  const enabledExpenseCategories = useMemo(
    () => EXPENSE_CATEGORIES.filter((c) => !user.settings.disabledExpenseCategories.includes(c)),
    [user.settings.disabledExpenseCategories]
  );
  const enabledIncomeCategories = useMemo(
    () => INCOME_CATEGORIES.filter((c) => !user.settings.disabledIncomeCategories.includes(c)),
    [user.settings.disabledIncomeCategories]
  );
  const enabledPaymentModes = useMemo(
    () => PAYMENT_MODES.filter((m) => !user.settings.disabledPaymentModes.includes(m)),
    [user.settings.disabledPaymentModes]
  );

  const categories = type === 'expense' ? enabledExpenseCategories : enabledIncomeCategories;

  const [paymentMode, setPaymentMode] = useState(() => enabledPaymentModes[0] || 'Cash');

  const isOtherExpense = type === 'expense' && category === 'Other';

  const handleSubmit = async () => {
    if (!category || !amount || Number(amount) <= 0) return;
    if (isOtherExpense && !customCategory.trim()) return;

    setSaving(true);
    setError('');
    try {
      const d = new Date(date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const txData: Record<string, unknown> = {
        type,
        category,
        amount: Number(amount),
        account: type === 'expense' ? account : 'Personal',
        addedBy: user.name,
        date,
        note,
        monthKey,
        createdAt: Date.now(),
        paymentMode,
      };
      if (isOtherExpense) {
        txData.customCategory = customCategory.trim();
      }

      await addDoc(collection(db, 'transactions'), txData);

      setSavedInfo({ amount, category: isOtherExpense ? customCategory.trim() : category });
      setSuccess(true);

      setTimeout(() => {
        setCategory('');
        setCustomCategory('');
        setAmount('');
        setNote('');
        setAccount('Personal');
        setPaymentMode(enabledPaymentModes[0] || 'Cash');
        setDate(new Date().toISOString().split('T')[0]);
        setSuccess(false);
      }, 1500);
    } catch {
      setError('Failed to save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-24 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={40} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Added!</h2>
        <p className="text-slate-500 mt-1">
          ₹{Number(savedInfo.amount).toLocaleString('en-IN')} — {savedInfo.category}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Add Transaction</h1>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Type Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6">
        <button
          onClick={() => {
            setType('expense');
            setCategory('');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
            type === 'expense'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
              : 'text-slate-500'
          }`}
        >
          <MinusCircle size={18} /> Expense
        </button>
        <button
          onClick={() => {
            setType('income');
            setCategory('');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
            type === 'income'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
              : 'text-slate-500'
          }`}
        >
          <PlusCircle size={18} /> Income
        </button>
      </div>

      {/* Amount */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Amount (₹)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full text-3xl font-bold text-slate-800 dark:text-white mt-1 outline-none bg-transparent"
        />
      </div>

      {/* Category Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 block">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat
                  ? 'text-white shadow-lg scale-105'
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
              style={
                category === cat
                  ? { backgroundColor: CATEGORY_COLORS[cat] || '#6366f1' }
                  : {}
              }
            >
              {CATEGORY_ICONS[cat] || ''} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Category Input — "Other" expense */}
      {isOtherExpense && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            What is this expense?
          </label>
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="e.g. Doctor visit, Gift..."
            maxLength={40}
            className="w-full text-slate-800 dark:text-white mt-1 outline-none text-lg bg-transparent"
            autoFocus
          />
        </div>
      )}

      {/* Account Selection — Expenses only */}
      {type === 'expense' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 block">
            Paid From
          </label>
          <div className="flex gap-3">
            {ACCOUNTS.map((acc) => (
              <button
                key={acc}
                onClick={() => setAccount(acc)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  account === acc
                    ? acc === 'Personal'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                      : 'bg-purple-500 text-white shadow-lg shadow-purple-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {acc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Mode */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 block">
          Payment Mode
        </label>
        <div className="flex flex-wrap gap-2">
          {enabledPaymentModes.map((mode) => (
            <button
              key={mode}
              onClick={() => setPaymentMode(mode)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                paymentMode === mode
                  ? 'bg-violet-500 text-white shadow-lg scale-105'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full text-slate-800 dark:text-white mt-1 outline-none text-lg bg-transparent"
        />
      </div>

      {/* Note */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full text-slate-800 dark:text-white mt-1 outline-none bg-transparent"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!category || !amount || Number(amount) <= 0 || (isOtherExpense && !customCategory.trim()) || saving}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
          !category || !amount || Number(amount) <= 0 || (isOtherExpense && !customCategory.trim())
            ? 'bg-slate-200 text-slate-400'
            : type === 'expense'
              ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-200 active:scale-[0.98]'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200 active:scale-[0.98]'
        }`}
      >
        {saving ? 'Saving...' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}
      </button>
    </div>
  );
}
