import { useState, useMemo, useCallback } from 'react';

export function useMonthNavigation() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const monthKey = useMemo(
    () => `${year}-${String(month + 1).padStart(2, '0')}`,
    [month, year]
  );

  const prevMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

  return { month, year, monthKey, prevMonth, nextMonth, setMonth, setYear };
}
