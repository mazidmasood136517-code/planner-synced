import React, { useState } from 'react';
import { FriendAccountabilityStats, UserProfile } from '../../types';
import { sendNudgeToFriend } from '../../services/db';
import {
  ExternalLink,
  Linkedin,
  Github,
  Zap,
  Flame,
  Heart,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FriendAccountabilityCardProps {
  friendStats: FriendAccountabilityStats | null;
  currentUser: UserProfile;
  onNavigateToFriendHub: () => void;
}

export const FriendAccountabilityCard: React.FC<FriendAccountabilityCardProps> = ({
  friendStats,
  currentUser,
  onNavigateToFriendHub,
}) => {
  const [nudgeSent, setNudgeSent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSendNudge = async (type: 'nudge' | 'cheer' | 'fire' | 'focus') => {
    if (!friendStats?.friend) return;
    setSending(true);
    try {
      await sendNudgeToFriend(currentUser, friendStats.friend.id, type);
      setNudgeSent(type);
      if (type === 'cheer' || type === 'fire') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
      setTimeout(() => setNudgeSent(null), 3000);
    } catch (err) {
      console.error('Error sending nudge:', err);
    } finally {
      setSending(false);
    }
  };

  if (!friendStats || !friendStats.friend) {
    return (
      <div className="bento-card p-6 flex flex-col justify-between h-full bg-[#FEF9C3]/50 border-2 border-dashed border-[#FACC15]">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">👯</span>
              <h3 className="font-display font-bold text-lg text-[#172033]">
                Accountability Buddy
              </h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FEF9C3] text-[#856404] font-friendly font-bold border border-[#FACC15]/40">
              Single Mode
            </span>
          </div>
          <p className="text-xs font-friendly text-[#64748B] leading-relaxed mb-4">
            Productivity skyrockets by 85% when you co-track with a partner. Connect your friend to sync daily quests, streaks, and scores in real time!
          </p>
        </div>

        <button
          onClick={onNavigateToFriendHub}
          className="w-full py-2.5 px-4 btn-primary-purple flex items-center justify-center gap-2 cursor-pointer text-xs"
        >
          <Zap className="w-4 h-4" />
          <span>Connect Buddy or Enter Invite Code</span>
        </button>
      </div>
    );
  }

  const {
    friend,
    todayScore,
    currentStreak,
    weeklyGoalCompletionRate,
    linkedinWeeklyProgress,
  } = friendStats;

  return (
    <div className="bento-card p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden h-full">
      <div>
        {/* Header: Friend Avatar, Name, and Quick Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={friend.avatarUrl}
                alt={friend.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-[#F3E8FF] bg-white shadow-xs"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#34D399] border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-bold text-base text-[#172033] leading-none">
                  {friend.name}
                </h4>
                <span className="text-[10px] text-[#64748B] font-mono">@{friend.username}</span>
              </div>
              <p className="text-[11px] font-friendly text-[#64748B] line-clamp-1 mt-0.5">
                {friend.bio || 'Crushing daily targets together 🚀'}
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToFriendHub}
            className="p-2 rounded-xl hover:bg-[#F3E8FF] text-[#64748B] hover:text-[#7C3AED] transition-colors cursor-pointer"
            title="View Full Friend Hub"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Friend Live Metrics */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* Today's Productivity */}
          <div className="p-3 rounded-2xl bg-[#DCFCE7]/60 border border-[#34D399]/30 text-center">
            <span className="text-[10px] font-friendly uppercase font-bold text-[#15803D] block mb-0.5">
              Today's Score
            </span>
            <span className="text-lg font-black text-[#15803D] font-mono">{todayScore}%</span>
          </div>

          {/* Weekly Goals Progress */}
          <div className="p-3 rounded-2xl bg-[#E0F2FE]/60 border border-[#38BDF8]/30 text-center">
            <span className="text-[10px] font-friendly uppercase font-bold text-[#0284C7] block mb-0.5">
              Weekly Quests
            </span>
            <span className="text-lg font-black text-[#0284C7] font-mono">{weeklyGoalCompletionRate}%</span>
          </div>

          {/* Friend Streak */}
          <div className="p-3 rounded-2xl bg-[#FEF9C3]/60 border border-[#FACC15]/30 text-center">
            <span className="text-[10px] font-friendly uppercase font-bold text-[#FB923C] block mb-0.5">
              Streak
            </span>
            <div className="flex items-center justify-center gap-1 text-[#FB923C] font-mono font-bold text-lg">
              <Flame className="w-4 h-4" />
              <span>{currentStreak}d</span>
            </div>
          </div>
        </div>

        {/* Extra Accountability Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px]">
          {friend.githubUsername && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#172033]/5 text-[#172033]">
              <Github className="w-3.5 h-3.5 text-[#172033]" />
              <span className="font-mono text-[10px]">@{friend.githubUsername}</span>
            </div>
          )}

          {linkedinWeeklyProgress && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E0F2FE]/70 border border-[#38BDF8]/30 text-[#0284C7]">
              <Linkedin className="w-3.5 h-3.5 text-[#0284C7]" />
              <span className="font-friendly">
                Posts:{' '}
                <strong className="font-mono font-bold">
                  {linkedinWeeklyProgress.completed}/{linkedinWeeklyProgress.target}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Nudge Toolbar */}
      <div className="pt-3 border-t border-[#172033]/5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-friendly font-bold text-[#64748B]">Live Cheering:</span>
        <div className="flex items-center gap-2">
          <button
            disabled={sending}
            onClick={() => handleSendNudge('fire')}
            className="px-3 py-1.5 rounded-xl bg-[#FEF9C3] hover:bg-[#FEF08A] text-[#FB923C] border border-[#FACC15]/40 text-xs font-friendly font-bold flex items-center gap-1 transition-all cursor-pointer transform hover:scale-105"
            title="Send streak flame"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Nudge 🔥</span>
          </button>

          <button
            disabled={sending}
            onClick={() => handleSendNudge('cheer')}
            className="px-3 py-1.5 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border border-[#34D399]/40 text-xs font-friendly font-bold flex items-center gap-1 transition-all cursor-pointer transform hover:scale-105"
            title="Send congratulations"
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Cheer 🎉</span>
          </button>
        </div>
      </div>

      {nudgeSent && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#7C3AED] text-white text-xs font-friendly font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {nudgeSent === 'fire' ? 'Flame Nudge Sent! 🔥' : 'Cheer Sent to Friend! 🎉'}
        </div>
      )}
    </div>
  );
};
