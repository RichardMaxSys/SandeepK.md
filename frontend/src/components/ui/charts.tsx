"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { cn } from "@/components/ui/base";

/* -------------------------------------------------------------------------- */
/*                              Score / Donut                                 */
/* -------------------------------------------------------------------------- */

export const ScoreChart: React.FC<{
  score: number;
  label: string;
  size?: number;
  className?: string;
}> = ({ score, label, size = 112, className }) => {
  const data = [
    { name: "Score", value: score },
    { name: "Remaining", value: Math.max(0, 100 - score) },
  ];
  const ringColor =
    score >= 80 ? "#22c55e" : score >= 60 ? "#14b8a6" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        style={{ width: size, height: size }}
        className="relative"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={ringColor} />
              <Cell fill="rgba(255,255,255,0.06)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-ink tabular-nums">
            {score}
            <span className="text-xs text-ink-subtle">%</span>
          </span>
        </div>
      </div>
      <span className="mt-2 text-2xs font-medium uppercase tracking-wider text-ink-subtle">
        {label}
      </span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                             Keyword bar                                    */
/* -------------------------------------------------------------------------- */

export const KeywordChart: React.FC<{
  present: number;
  missing: number;
}> = ({ present, missing }) => {
  const data = [{ name: "Keywords", present, missing }];
  return (
    <div className="h-32 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" barCategoryGap={20}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              background: "#161c2e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="present"
            stackId="a"
            fill="#22c55e"
            barSize={18}
            radius={[4, 0, 0, 4]}
          />
          <Bar
            dataKey="missing"
            stackId="a"
            fill="#ef4444"
            barSize={18}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="text-2xs text-ink-muted">
            Present <span className="text-ink font-semibold ml-1">{present}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger" />
          <span className="text-2xs text-ink-muted">
            Missing <span className="text-ink font-semibold ml-1">{missing}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                          Activity area chart                               */
/* -------------------------------------------------------------------------- */

export const ActivityAreaChart: React.FC<{
  data: { day: string; apps: number; interviews: number }[];
}> = ({ data }) => {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="appsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="intGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7491", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7491", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: "#161c2e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#9aa3b8" }}
          />
          <Area
            type="monotone"
            dataKey="apps"
            stroke="#14b8a6"
            strokeWidth={2}
            fill="url(#appsGradient)"
          />
          <Area
            type="monotone"
            dataKey="interviews"
            stroke="#818cf8"
            strokeWidth={2}
            fill="url(#intGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
