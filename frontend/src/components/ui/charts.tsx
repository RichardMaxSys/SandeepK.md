'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from './base';

export const ScoreChart = ({ score, label, color = '#2563eb', size = 'md' }: { score: number; label: string; color?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  const sizeMap = { sm: 'h-20 w-20', md: 'h-28 w-28', lg: 'h-32 w-32' };
  const fontMap = { sm: 'text-sm', md: 'text-xl', lg: 'text-2xl' };
  const innerMap = { sm: 22, md: 35, lg: 40 };
  const outerMap = { sm: 34, md: 50, lg: 58 };

  return (
    <div className="flex flex-col items-center min-w-[80px]">
      <div className={cn(sizeMap[size], 'relative')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={innerMap[size]}
              outerRadius={outerMap[size]}
              paddingAngle={4}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? color : '#2a3558'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className={cn('absolute inset-0 flex items-center justify-center font-bold', fontMap[size], 'text-white')}>
          {score}%
        </div>
      </div>
      <span className="text-xs font-medium text-gray-400 mt-2">{label}</span>
    </div>
  );
};

export const KeywordChart = ({ present, missing }: { present: number; missing: number }) => {
  const data = [
    { name: 'Keywords', present, missing },
  ];

  return (
    <div className="h-40 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              background: '#1e2746',
              border: '1px solid #2a3558',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="present" stackId="a" fill="#10b981" barSize={28} radius={[4, 0, 0, 4]} />
          <Bar dataKey="missing" stackId="a" fill="#ef4444" barSize={28} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs font-medium text-gray-500 px-1">
        <span className="text-emerald-400">Present: {present}</span>
        <span className="text-red-400">Missing: {missing}</span>
      </div>
    </div>
  );
};
