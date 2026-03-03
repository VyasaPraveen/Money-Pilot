import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { RecurringExpense } from './constants';

export async function processRecurringExpenses(
  userId: string,
  userName: string,
  recurring: RecurringExpense[]
) {
  if (!recurring || recurring.length === 0) return 0;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Check which recurring entries already exist this month
  const q = query(
    collection(db, 'transactions'),
    where('monthKey', '==', monthKey),
    where('addedBy', '==', userName),
    where('isRecurring', '==', true)
  );
  const existing = await getDocs(q);
  const existingIds = new Set(existing.docs.map((d) => d.data().recurringId));

  let added = 0;
  for (const item of recurring) {
    if (existingIds.has(item.id)) continue;

    // Only auto-add if we're past the day of month
    if (now.getDate() < item.dayOfMonth) continue;

    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(item.dayOfMonth).padStart(2, '0')}`;

    await addDoc(collection(db, 'transactions'), {
      type: 'expense',
      category: item.category,
      amount: item.amount,
      account: item.account,
      addedBy: userName,
      date,
      note: item.note || 'Auto-added recurring',
      monthKey,
      createdAt: Date.now(),
      paymentMode: item.paymentMode,
      isRecurring: true,
      recurringId: item.id,
      ...(item.customCategory ? { customCategory: item.customCategory } : {}),
    });
    added++;
  }

  return added;
}
