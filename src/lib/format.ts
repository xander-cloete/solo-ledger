// Formats a number as money using the user's chosen currency symbol.
// Example: formatMoney(1234.5, 'N$') -> "N$ 1,234.50"
export function formatMoney(amount: number, symbol: string): string {
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${sign}${symbol} ${abs}`
}
