'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction, CATEGORY_COLORS } from '@/lib/constants';
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [loading, setLoading] = useState(true);

  const monthKey = useMemo(
    () => `${year}-${String(month + 1).padStart(2, '0')}`,
    [month, year]
  );

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'transactions'),
      where('monthKey', '==', monthKey)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Transaction)
      );
      data.sort((a, b) => b.createdAt - a.createdAt);
      setTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, [monthKey]);

  const filtered =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filter);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this transaction?')) {
      await deleteDoc(doc(db, 'transactions', id));
    }
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">History</h1>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm mb-4">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-slate-700">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
        {(['all', 'expense', 'income'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
          >
            {/* Category Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor:
                  (CATEGORY_COLORS[t.category] || '#6366f1') + '20',
              }}
            >
              {t.type === 'expense' ? (
                <ArrowUpRight
                  size={18}
                  style={{
                    color: CATEGORY_COLORS[t.category] || '#6366f1',
                  }}
                />
              ) : (
                <ArrowDownLeft
                  size={18}
                  style={{
                    color: CATEGORY_COLORS[t.category] || '#10b981',
                  }}
                />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">
                {t.category}
              </p>
              <p className="text-xs text-slate-400">
                {t.addedBy} &middot; {formatDate(t.date)}
                {t.type === 'expense' && t.account === 'EM Office' && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px] font-medium">
                    EM
                  </span>
                )}
              </p>
              {t.note && (
                <p className="text-xs text-slate-400 truncate">{t.note}</p>
              )}
            </div>

            {/* Amount */}
            <p
              className={`font-bold text-sm whitespace-nowrap ${
                t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              {t.type === 'expense' ? '-' : '+'}₹
              {t.amount.toLocaleString('en-IN')}
            </p>

            {/* Delete */}
            <button
              onClick={() => handleDelete(t.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">No transactions found</p>
        </div>
      )}
    </div>
  );
}
