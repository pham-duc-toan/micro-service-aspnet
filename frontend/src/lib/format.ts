const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('vi-VN');

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCurrency(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '0 ₫';
  return vndFormatter.format(value);
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '0';
  return numberFormatter.format(value);
}

export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';
  return dateFormatter.format(date);
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
