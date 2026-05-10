'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { StoreData } from '@/lib/analytics'

const STORE_COLORS = [
  '#3ecf8e',
  '#60a5fa',
  '#a78bfa',
  '#fbbf24',
  '#f87171',
  '#38bdf8',
  '#fb923c',
  '#34d399',
]

interface Props {
  data: StoreData[]
}

function formatYen(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`
}

export default function StoreComparisonChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-faint text-sm">
        データがありません
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: d.storeName,
    total: d.total,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatYen}
          tick={{ fontSize: 11, fill: '#707070' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: '#171717' }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip
          formatter={(value) => [formatYen(Number(value)), '集金額']}
          contentStyle={{
            borderRadius: '6px',
            border: '1px solid #dfdfdf',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="total" name="集金額" radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STORE_COLORS[index % STORE_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
