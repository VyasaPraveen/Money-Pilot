import type { Transaction } from './constants';

export function exportToCSV(transactions: Transaction[], monthLabel: string) {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Account', 'Payment Mode', 'Added By', 'Note'];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category === 'Other' && t.customCategory ? `Other - ${t.customCategory}` : t.category,
    t.amount.toString(),
    t.account,
    t.paymentMode || '',
    t.addedBy,
    t.note || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `money-pilot-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
