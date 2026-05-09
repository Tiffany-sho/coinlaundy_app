'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyData } from '@/lib/analytics'

// Indigo/blue palette for stores
const STORE_COLORS = [
  '#4f46e5', // indigo-600
  '#0284c7', // sky-600
  '#0891b2', // cyan-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#dc2626', // red-600
]

interface Props {
  data: MonthlyData[]
  storeNames: string[]
}

function formatYen(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`
}

export default function MonthlyChart({ data, storeNames }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        データがありません
      </div>
    )
  }

  // Flatten data for recharts: each item has { label, [storeName]: amount, ... }
  const chartData = data.map((d) => ({
    label: d.label,
    ...d.byStore,
  }))

  // Show per-store bars if ≤ 6 stores, else show total only
  const showPerStore = storeNames.length <= 6

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
        barCategoryGap="25%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYen}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          formatter={(value, name) => [formatYen(Number(value)), String(name)]}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
          }}
        />
        {showPerStore ? (
          <>
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
            {storeNames.map((name, i) => (
              <Bar
                key={name}
                dataKey={name}
                name={name}
                stackId="a"
                fill={STORE_COLORS[i % STORE_COLORS.length]}
                radius={i === storeNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </>
        ) : (
          <Bar
            dataKey="total"
            name="合計"
            fill={STORE_COLORS[0]}
            radius={[4, 4, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}
