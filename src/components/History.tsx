'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction, CATEGORY_COLORS, CATEGORY_ICONS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_MODES, ACCOUNTS } from '@/lib/constants';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { exportToCSV } from '@/lib/exportUtils';
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Download,
  Pencil,
  X,
} from 'lucide-react';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { month, year, monthKey, prevMonth, nextMonth } = useMonthNavigation();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Edit state
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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

  const filtered = useMemo(() => {
    let result = filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.category.toLowerCase().includes(q) ||
          (t.customCategory && t.customCategory.toLowerCase().includes(q)) ||
          t.addedBy.toLowerCase().includes(q) ||
          (t.note && t.note.toLowerCase().includes(q)) ||
          (t.paymentMode && t.paymentMode.toLowerCase().includes(q)) ||
          t.amount.toString().includes(q)
      );
    }

    return result;
  }, [transactions, filter, searchQuery]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const openEdit = (t: Transaction) => {
    setEditTx(t);
    setEditAmount(t.amount.toString());
    setEditCategory(t.category);
    setEditNote(t.note || '');
    setEditDate(t.date);
    setEditPaymentMode(t.paymentMode || 'Cash');
    setEditAccount(t.account);
    setEditCustomCategory(t.customCategory || '');
  };

  const handleEditSave = async () => {
    if (!editTx || !editCategory || !editAmount || Number(editAmount) <= 0) return;
    setEditSaving(true);
    try {
      const d = new Date(editDate);
      const newMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const updateData: Record<string, unknown> = {
        amount: Number(editAmount),
        category: editCategory,
        note: editNote,
        date: editDate,
        monthKey: newMonthKey,
        paymentMode: editPaymentMode,
        account: editAccount,
      };
      if (editCategory === 'Other' && editCustomCategory.trim()) {
        updateData.customCategory = editCustomCategory.trim();
      } else {
        updateData.customCategory = '';
      }
      await updateDoc(doc(db, 'transactions', editTx.id), updateData);
      setEditTx(null);
    } catch {
      alert('Failed to update. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const handleExport = () => {
    const label = `${FULL_MONTHS[month]} ${year}`;
    exportToCSV(transactions, label);
  };

  const editCategories = editTx?.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">History</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Search transactions"
          >
            <Search size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
          {transactions.length > 0 && (
            <button
              onClick={handleExport}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              aria-label="Export to CSV"
            >
              <Download size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by category, name, note, amount..."
            className="w-full pl-9 pr-9 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-300"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm mb-4">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Previous month">
          <ChevronLeft size={18} className="dark:text-white" />
        </button>
        <span className="font-semibold text-slate-700 dark:text-white">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Next month">
          <ChevronRight size={18} className="dark:text-white" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4" role="tablist">
        {(['all', 'expense', 'income'] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Result count */}
      {searchQuery && (
        <p className="text-xs text-slate-400 mb-2 px-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''} found</p>
      )}

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.map((t) => {
          const displayName = t.category === 'Other' && t.customCategory ? t.customCategory : t.category;
          const icon = CATEGORY_ICONS[t.category] || (t.type === 'expense' ? '💸' : '💰');

          return (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3"
            >
              {/* Category Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{
                  backgroundColor:
                    (CATEGORY_COLORS[t.category] || '#6366f1') + '20',
                }}
              >
                {icon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-white text-sm">
                  {displayName}
                </p>
                <p className="text-xs text-slate-400">
                  {t.addedBy} &middot; {formatDate(t.date)}
                  {t.type === 'expense' && t.account === 'EM Office' && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded text-[10px] font-medium">
                      EM
                    </span>
                  )}
                  {t.paymentMode && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 rounded text-[10px] font-medium">
                      {t.paymentMode}
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

              {/* Edit */}
              <button
                onClick={() => openEdit(t)}
                className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-300 hover:text-blue-400 transition-colors"
                aria-label={`Edit ${displayName} transaction`}
              >
                <Pencil size={15} />
              </button>

              {/* Delete */}
              <button
                onClick={() => setDeleteId(t.id)}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 hover:text-red-400 transition-colors"
                aria-label={`Delete ${displayName} transaction`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
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
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">{searchQuery ? '🔍' : '📄'}</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {searchQuery ? 'No matching transactions' : 'No transactions found'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-violet-500 text-sm mt-2 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Delete transaction?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-xl mb-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Transaction</h3>
              <button onClick={() => setEditTx(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Amount */}
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Amount (₹)</label>
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full text-2xl font-bold text-slate-800 dark:text-white mt-1 mb-4 outline-none bg-transparent border-b border-slate-200 dark:border-slate-600 pb-2"
            />

            {/* Category */}
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {editCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setEditCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    editCategory === cat
                      ? 'text-white shadow scale-105'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  style={editCategory === cat ? { backgroundColor: CATEGORY_COLORS[cat] || '#6366f1' } : {}}
                >
                  {CATEGORY_ICONS[cat] || ''} {cat}
                </button>
              ))}
            </div>

            {/* Custom Category for Other */}
            {editTx.type === 'expense' && editCategory === 'Other' && (
              <>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">What expense?</label>
                <input
                  type="text"
                  value={editCustomCategory}
                  onChange={(e) => setEditCustomCategory(e.target.value)}
                  placeholder="e.g. Doctor visit"
                  className="w-full text-slate-800 dark:text-white mt-1 mb-4 outline-none bg-transparent border-b border-slate-200 dark:border-slate-600 pb-2"
                />
              </>
            )}

            {/* Date */}
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full text-slate-800 dark:text-white mt-1 mb-4 outline-none bg-transparent border-b border-slate-200 dark:border-slate-600 pb-2"
            />

            {/* Payment Mode */}
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Payment Mode</label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setEditPaymentMode(mode)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    editPaymentMode === mode
                      ? 'bg-violet-500 text-white shadow'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Account */}
            {editTx.type === 'expense' && (
              <>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Account</label>
                <div className="flex gap-2 mb-4">
                  {ACCOUNTS.map((acc) => (
                    <button
                      key={acc}
                      onClick={() => setEditAccount(acc)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        editAccount === acc
                          ? 'bg-blue-500 text-white shadow'
                          : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Note */}
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Note</label>
            <input
              type="text"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full text-slate-800 dark:text-white mt-1 mb-6 outline-none bg-transparent border-b border-slate-200 dark:border-slate-600 pb-2"
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditTx(null)}
                disabled={editSaving}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editCategory || !editAmount || Number(editAmount) <= 0}
                className="flex-1 py-3 rounded-xl bg-violet-500 text-white font-semibold text-sm hover:bg-violet-600 transition-colors disabled:opacity-50"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
