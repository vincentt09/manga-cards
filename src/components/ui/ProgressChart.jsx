import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";

export default function ProgressChart({ data, title, color = "#8b5cf6", showArea = true }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-bold" style={{ color }}>
            {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-48">
      {showArea ? (
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="label" hide />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fillOpacity={1}
            fill={`url(#gradient-${title})`}
          />
        </AreaChart>
      ) : (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="label" hide />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      )}
    </div>
  );
}

export function TrendIndicator({ value, previousValue }) {
  const diff = value - previousValue;
  const percentChange = previousValue ? ((diff / previousValue) * 100).toFixed(1) : 0;

  if (diff > 0) {
    return (
      <div className="flex items-center gap-1 text-green-400">
        <TrendingUp className="w-3 h-3" />
        <span className="text-xs font-medium">+{percentChange}%</span>
      </div>
    );
  } else if (diff < 0) {
    return (
      <div className="flex items-center gap-1 text-red-400">
        <TrendingDown className="w-3 h-3" />
        <span className="text-xs font-medium">{percentChange}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="w-3 h-3" />
      <span className="text-xs font-medium">0%</span>
    </div>
  );
}