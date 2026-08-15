import React, { useState } from 'react';
import { UserProfile } from '../../types';
import {
  Settings,
  User,
  Github,
  Bell,
  Clock,
  Shield,
  Save,
  Check,
  Sparkles,
  Copy,
} from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [timezone, setTimezone] = useState(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [githubUsername, setGithubUsername] = useState(user.githubUsername || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Notification states
  const [notifGithub, setNotifGithub] = useState(true);
  const [notifDailyPlan, setNotifDailyPlan] = useState(true);
  const [notifWeeklyGoals, setNotifWeeklyGoals] = useState(true);
  const [notifNudges, setNotifNudges] = useState(true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateProfile({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        timezone,
        githubUsername: githubUsername.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(user.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">Account & Accountability Preferences</h2>
            <p className="text-xs text-zinc-400">
              Customize your profile, invite codes, GitHub handles, and notification signals.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <Check className="w-4 h-4" /> Preferences Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            Public Profile (Visible to Partner)
          </h3>

          {/* Avatar preset selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Profile Avatar
            </label>
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl || user.avatarUrl}
                alt="Avatar Preview"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 bg-zinc-800"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                      avatarUrl === preset ? 'border-emerald-400 scale-105' : 'border-zinc-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Username (@ handle)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Bio / Focus Motto
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. 100 Days of Code • Crushing DSA • Daily Consistency"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                GitHub Username
              </label>
              <div className="relative">
                <Github className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="alexrivera-dev"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs font-mono outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invite Code & Friendship Link */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-zinc-100">Invite Code Sharing</h3>
          <p className="text-xs text-zinc-400">
            Share this code with your friend so they can easily link with your profile from their device.
          </p>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono font-bold text-emerald-400 tracking-wider text-sm">
              {user.inviteCode}
            </div>
            <button
              type="button"
              onClick={copyInviteCode}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Notification Signals */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            Productivity Signals & Reminders
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Friend Nudges & Cheers</span>
                <span className="text-[11px] text-zinc-400">
                  Notify when your accountability partner sends a flame nudge or cheering signal.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifNudges}
                onChange={(e) => setNotifNudges(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Daily Planning Prompt (09:00 AM)</span>
                <span className="text-[11px] text-zinc-400">
                  Reminder to define today's focus intention and time blocks.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifDailyPlan}
                onChange={(e) => setNotifDailyPlan(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Evening GitHub & Reflection Check (20:00)</span>
                <span className="text-[11px] text-zinc-400">
                  Reminder to push code commits and review completed tasks before the day closes.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifGithub}
                onChange={(e) => setNotifGithub(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
