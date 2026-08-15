import React from 'react';
import { DailyActivity } from '../../types';
import { Sparkles, CheckCircle2, Flame, Clock } from 'lucide-react';

interface TodayProgressCardProps {
  todayActivity: DailyActivity | null;
  streakCount: number;
  userName: string;
  onActionClick?: () => void;
}

export const TodayProgressCard: React.FC<TodayProgressCardProps> = ({
  todayActivity,
  streakCount,
  userName,
  onActionClick,
}) => {
  const score = todayActivity?.productivityScore ?? 0;
  const tasksCompleted = todayActivity?.tasksCompleted ?? 0;
  const totalTasks = todayActivity?.totalTasks ?? 0;
  const plannerCompleted = todayActivity?.plannerItemsCompleted ?? 0;
  const totalPlanner = todayActivity?.totalPlannerItems ?? 0;

  // Circumference for r=54 circle is 2 * PI * 54 = ~339.29
  const circumference = 339;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStatusText = () => {
    if (score >= 80) return 'Dominating today’s goals! 🌟';
    if (score >= 50) return 'More than halfway there! Keep pushing 🚀';
    if (score > 0) return 'Great start! Build momentum now ⚡';
    return 'Ready to crush your targets today? 🎯';
  };

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white p-6 sm:p-7 shadow-lg shadow-purple-500/20">
      {/* Decorative background sparkle */}
      <span className="absolute right-5 top-5 text-3xl opacity-25 select-none pointer-events-none">
        ✨
      </span>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
        {/* Left: Mission Info & Call to Action */}
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-friendly font-semibold mb-2.5 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            Today's Mission
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white mb-1">
            {score >= 100 ? 'Mission Accomplished! 🎉' : `${score}% Complete`}
          </h2>
          <p className="font-friendly text-white/90 text-sm sm:text-base mb-4 font-normal">
            {getStatusText()}
          </p>

          {/* Quick KPI stats row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-friendly font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              <span>
                {tasksCompleted}/{totalTasks} Tasks
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-friendly font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#FEF08A]" />
              <span>
                {plannerCompleted}/{totalPlanner} Timeline
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-friendly font-semibold">
              <Flame className="w-3.5 h-3.5 text-[#FB923C]" />
              <span>{streakCount}d Streak</span>
            </div>
          </div>
        </div>

        {/* Right: Circular Gauge */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center self-center sm:self-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="white"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-white font-mono leading-none tracking-tight">
              {score}%
            </span>
            <span className="text-[10px] uppercase font-friendly font-bold text-white/80 mt-0.5">
              Score
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
