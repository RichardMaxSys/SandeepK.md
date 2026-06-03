'use client';

import React from 'react';
import { Card, Button, Input } from '@/components/ui/base';
import { Save, Key, Globe, Bell, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function SettingsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl pb-8"
    >
      {/* API Configuration */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
            <Key size={20} className="text-teal" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">API Configuration</h3>
            <p className="text-xs text-gray-500">Manage your API keys and integrations</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">OpenRouter API Key</label>
            <Input type="password" placeholder="sk-..." defaultValue="sk-or-v1-••••••••••••" />
            <p className="text-xs text-gray-500 mt-1">Used for AI-powered resume analysis and job matching</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Adzuna API Key (optional)</label>
            <Input type="password" placeholder="Enter your API key" />
            <p className="text-xs text-gray-500 mt-1">Enables real job search results</p>
          </div>
          <Button className="mt-2">
            <Save size={16} />
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Bell size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Notifications</h3>
            <p className="text-xs text-gray-500">Configure your notification preferences</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: 'New job matches', desc: 'Get notified when new jobs match your profile' },
            { label: 'Application updates', desc: 'Receive updates on your application status' },
            { label: 'ATS score changes', desc: 'Weekly report on your resume ATS readiness' },
            { label: 'Interview reminders', desc: 'Reminders for upcoming interviews' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-gray-300">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-10 h-5 bg-surface-lighter peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal" />
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <User size={20} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Profile</h3>
            <p className="text-xs text-gray-500">Your personal information</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
            <Input defaultValue="Sandeep K." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
            <Input type="email" defaultValue="sandeep@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Target Role</label>
            <Input defaultValue="Senior Software Engineer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Location</label>
            <Input defaultValue="Remote" />
          </div>
        </div>
        <Button className="mt-4">
          <Save size={16} />
          Update Profile
        </Button>
      </Card>
    </motion.div>
  );
}
