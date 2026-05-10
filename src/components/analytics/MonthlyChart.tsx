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
  data: MonthlyData[]
  storeNames: string[]
}

function formatYen(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`
}

export default function MonthlyChart({ data, storeNames }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-faint text-sm">
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
          tick={{ fontSize: 12, fill: '#707070' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYen}
          tick={{ fontSize: 11, fill: '#707070' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          formatter={(value, name) => [formatYen(Number(value)), String(name)]}
          contentStyle={{
            borderRadius: '6px',
            border: '1px solid #dfdfdf',
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
