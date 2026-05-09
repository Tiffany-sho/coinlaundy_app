export function formatAmount(yen: number): string {
  return `¥${yen.toLocaleString('ja-JP')}`
}

export function formatDateJST(date: string | Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
