'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const ScoreChart = ({ score, label }: { score: number; label: string }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];
  const COLORS = ['#2563eb', '#f3f4f6'];

  return (
    <div className="flex flex-col items-center">
      <div className="h-32 w-32 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={35}
              outerRadius={50}
              paddingAngle={5}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
          {score}%
        </div>
      </div>
      <span className="text-sm font-medium text-gray-500 mt-2">{label}</span>
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
          <Tooltip cursor={{fill: 'transparent'}} />
          <Bar dataKey="present" stackId="a" fill="#10b981" barSize={30} radius={[4, 0, 0, 4]} />
          <Bar dataKey="missing" stackId="a" fill="#ef4444" barSize={30} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs font-medium text-gray-500 px-1">
        <span className="text-green-600">Present: {present}</span>
        <span className="text-red-600">Missing: {missing}</span>
      </div>
    </div>
  );
};
