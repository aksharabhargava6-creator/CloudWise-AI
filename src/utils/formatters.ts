const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const monthYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount || 0);
}

export function formatCompactCurrency(amount: number): string {
  return compactCurrencyFormatter.format(amount || 0);
}

export function formatPercent(decimalOrHundred: number, isHundred: boolean = true): string {
  const value = isHundred ? decimalOrHundred / 100 : decimalOrHundred;
  return percentFormatter.format(value || 0);
}

export function formatInteger(num: number): string {
  return integerFormatter.format(num || 0);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return dateFormatter.format(d);
  } catch {
    return dateString;
  }
}

export function formatMonthYear(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return monthYearFormatter.format(d);
  } catch {
    return dateString;
  }
}
