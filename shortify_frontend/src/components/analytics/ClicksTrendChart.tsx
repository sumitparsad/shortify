import React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ClicksByDate } from "../../types/analytics"

interface ClicksTrendChartProps {
  data: ClicksByDate[]
}

export const ClicksTrendChart: React.FC<ClicksTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center border border-border rounded-xl bg-surface/40 text-xs text-text-faint">
        No click activity recorded in this period yet.
      </div>
    )
  }

  return (
    <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-medium text-sm text-text-primary">Click Traffic Trend</h3>
        <span className="text-xs font-mono text-text-faint">Daily Clicks</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D96B27" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#D96B27" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#54575F"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#54575F"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1B1D22",
                borderColor: "#23262B",
                borderRadius: "8px",
                color: "#F5F6F7",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#D96B27"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#clickGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
