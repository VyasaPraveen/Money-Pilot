'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_MODES,
  CATEGORY_COLORS,
} from '@/lib/constants';
import type { User, UserSettings } from '@/lib/constants';
import { updateUserSettings } from '@/lib/userService';
import { Check, Loader2 } from 'lucide-react';

interface Props {
  user: User;
  onUserUpdate: (user: User) => void;
}

export default function Settings({ user, onUserUpdate }: Props) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(user.settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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
      list: keyof UserSettings,
      item: string,
      allItems: readonly string[]
    ) => {
      setLocalSettings((prev) => {
        const current = prev[list];
        const isDisabled = current.includes(item);

        // Prevent disabling the last item
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
    !localSettings[list].includes(item);

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
        {error && (
          <p className="text-red-500 text-xs">{error}</p>
        )}
      </div>

      {/* Expense Categories */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 mb-1">Expense Categories</h3>
        <p className="text-xs text-slate-400 mb-3">Toggle categories visible in Add Transaction</p>
        <div className="divide-y divide-slate-100">
          {EXPENSE_CATEGORIES.map((cat) => (
            <ToggleRow
              key={cat}
              label={cat}
              color={CATEGORY_COLORS[cat]}
              enabled={isEnabled('disabledExpenseCategories', cat)}
              onToggle={() => toggleItem('disabledExpenseCategories', cat, EXPENSE_CATEGORIES)}
            />
          ))}
        </div>
      </div>

      {/* Income Categories */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 mb-1">Income Categories</h3>
        <p className="text-xs text-slate-400 mb-3">Toggle income sources</p>
        <div className="divide-y divide-slate-100">
          {INCOME_CATEGORIES.map((cat) => (
            <ToggleRow
              key={cat}
              label={cat}
              color={CATEGORY_COLORS[cat]}
              enabled={isEnabled('disabledIncomeCategories', cat)}
              onToggle={() => toggleItem('disabledIncomeCategories', cat, INCOME_CATEGORIES)}
            />
          ))}
        </div>
      </div>

      {/* Payment Modes */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-600 mb-1">Payment Modes</h3>
        <p className="text-xs text-slate-400 mb-3">Toggle payment options</p>
        <div className="divide-y divide-slate-100">
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
  color,
  enabled,
  onToggle,
}: {
  label: string;
  color?: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {color && (
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className={`text-sm font-medium ${enabled ? 'text-slate-700' : 'text-slate-400'}`}>
          {label}
        </span>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-all relative ${
          enabled ? 'bg-violet-500' : 'bg-slate-200'
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
