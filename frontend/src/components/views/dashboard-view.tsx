'use client';

import React from 'react';
import { KpiCard, Card, cn } from '@/components/ui/base';
import { Briefcase, FileText, Target, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const chartData = [
  { name: 'Mon', applications: 2, interviews: 0 },
  { name: 'Tue', applications: 5, interviews: 1 },
  { name: 'Wed', applications: 3, interviews: 2 },
  { name: 'Thu', applications: 7, interviews: 1 },
  { name: 'Fri', applications: 4, interviews: 3 },
  { name: 'Sat', applications: 1, interviews: 0 },
  { name: 'Sun', applications: 2, interviews: 0 },
];

const activities = [
  { text: 'Resume tailored for Senior Python Developer at TechCorp', time: '2 hours ago', type: 'success' },
  { text: 'ATS score improved to 87% for DevOps Engineer', time: '4 hours ago', type: 'info' },
  { text: 'New job match: Lead Backend Engineer at DataFlow', time: '6 hours ago', type: 'teal' },
  { text: 'Application package approved for Frontend Role', time: '1 day ago', type: 'success' },
  { text: '3 new keyword gaps identified in your resume', time: '1 day ago', type: 'warning' },
];

const typeStyles: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-400',
  info: 'bg-blue-500/10 text-blue-400',
  teal: 'bg-teal/10 text-teal',
  warning: 'bg-amber-500/10 text-amber-400',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-lg px-4 py-3 shadow-elevated">
        <p className="text-sm font-medium text-gray-300 mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardView() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <KpiCard
            title="Jobs Found"
            value="147"
            icon={<Briefcase size={20} />}
            trend={{ value: "12%", positive: true }}
            color="teal"
          />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard
            title="Avg. ATS Score"
            value="82%"
            icon={<Target size={20} />}
            trend={{ value: "5%", positive: true }}
            color="blue"
          />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard
            title="Applications"
            value="24"
            icon={<FileText size={20} />}
            trend={{ value: "8%", positive: true }}
            color="emerald"
          />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard
            title="Interviews"
            value="7"
            icon={<TrendingUp size={20} />}
            trend={{ value: "3", positive: true }}
            color="amber"
          />
        </motion.div>
      </div>

      {/* Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-white">Weekly Activity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal" />
                  <span className="text-xs text-gray-400">Applications</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">Interviews</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3558" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#00d4aa"
                    strokeWidth={2}
                    fill="url(#colorApps)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interviews"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    fill="url(#colorInterviews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="text-base font-semibold text-white mb-6">Recent Activity</h3>
            <div className="space-y-5">
              {activities.map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', typeStyles[activity.type])}>
                      <Clock size={14} />
                    </div>
                    {i < activities.length - 1 && (
                      <div className="w-px flex-1 bg-surface-border mt-2" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm text-gray-300 leading-relaxed">{activity.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-teal hover:bg-teal/5 transition-colors">
              View All Activity <ArrowRight size={14} />
            </button>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
