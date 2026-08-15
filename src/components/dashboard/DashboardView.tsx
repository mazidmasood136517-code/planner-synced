import React from 'react';
import {
  UserProfile,
  DailyActivity,
  Task,
  PlannerItem,
  DailyPlan,
  WeeklyGoal,
  FriendAccountabilityStats,
} from '../../types';
import { TodayProgressCard } from './TodayProgressCard';
import { FriendAccountabilityCard } from './FriendAccountabilityCard';
import { TodayTasksWidget } from './TodayTasksWidget';
import { DailyPlannerWidget } from './DailyPlannerWidget';
import { WeeklyGoalsWidget } from './WeeklyGoalsWidget';
import { Calendar, Flame, Zap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DashboardViewProps {
  user: UserProfile;
  todayActivity?: DailyActivity | null;
  activities?: DailyActivity[];
  streakCount?: number;
  tasks?: Task[];
  dailyPlan?: DailyPlan | null;
  plannerItems?: PlannerItem[];
  weeklyGoals?: WeeklyGoal[];
  friendStats?: FriendAccountabilityStats | null;
  onToggleTask?: (task: Task) => void;
  onTogglePlannerItem?: (item: PlannerItem) => void;
  onIncrementGoal?: (goalId: string, amount: number) => void;
  onIncrementWeeklyGoal?: (goalId: string) => void;
  onOpenTaskModal?: () => void;
  onOpenPlannerModal?: () => void;
  onOpenGoalModal?: () => void;
  onOpenNewTask?: () => void;
  onNavigate?: (tab: any) => void;
  onNavigateTab?: (tab: any) => void;
  onSendNudge?: (type: 'nudge' | 'cheer' | 'fire' | 'focus') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  todayActivity,
  activities = [],
  streakCount = 0,
  tasks = [],
  dailyPlan = null,
  plannerItems = [],
  weeklyGoals = [],
  friendStats = null,
  onToggleTask = () => {},
  onTogglePlannerItem = () => {},
  onIncrementGoal,
  onIncrementWeeklyGoal,
  onOpenTaskModal,
  onOpenPlannerModal,
  onOpenGoalModal,
  onOpenNewTask,
  onNavigate,
  onNavigateTab,
  onSendNudge,
}) => {
  const navigate = onNavigate || onNavigateTab || (() => {});
  const openTaskModal = onOpenTaskModal || onOpenNewTask || (() => navigate('tasks'));
  const openPlannerModal = onOpenPlannerModal || (() => navigate('planner'));
  const openGoalModal = onOpenGoalModal || (() => navigate('weekly'));

  const handleIncrement = (id: string) => {
    if (onIncrementGoal) onIncrementGoal(id, 1);
    else if (onIncrementWeeklyGoal) onIncrementWeeklyGoal(id);
  };

  // Find today's activity or compute fallback
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentActivity =
    todayActivity ||
    activities.find((a) => a.date === todayStr) || {
      id: `act_${user.id}_${todayStr}`,
      userId: user.id,
      date: todayStr,
      tasksCompleted: tasks.filter((t) => t.completed).length,
      totalTasks: tasks.length,
      goalsCompleted: weeklyGoals.filter((g) => g.completed).length,
      totalGoals: weeklyGoals.length,
      plannerItemsCompleted: plannerItems.filter((i) => i.completed).length,
      totalPlannerItems: plannerItems.length,
      githubCommits: 0,
      productivityScore:
        tasks.length + plannerItems.length > 0
          ? Math.round(
              ((tasks.filter((t) => t.completed).length +
                plannerItems.filter((i) => i.completed).length) /
                (tasks.length + plannerItems.length)) *
                100
            )
          : 0,
      updatedAt: Date.now(),
    };

  // Build last 28 days mini heatmap for bento ribbon
  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const d = subDays(new Date(), 27 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const act = activities.find((a) => a.date === dateStr);
    let score = act?.productivityScore ?? 0;
    let tasksDone = act?.tasksCompleted ?? 0;
    if (dateStr === todayStr && currentActivity.productivityScore > score) {
      score = currentActivity.productivityScore;
      tasksDone = currentActivity.tasksCompleted;
    }
    return {
      date: dateStr,
      dayNum: format(d, 'd'),
      dayName: format(d, 'EEE'),
      score,
      tasksDone,
    };
  });

  const getHeatmapColor = (score: number) => {
    if (score >= 80) return 'bg-[#34D399] shadow-xs shadow-[#34D399]/40 text-white font-bold';
    if (score >= 60) return 'bg-[#6EE7B7] text-[#065F46] font-bold';
    if (score >= 35) return 'bg-[#A7F3D0] text-[#065F46]';
    if (score > 0) return 'bg-[#DCFCE7] text-[#15803D]';
    return 'bg-[#F1F5F9] border border-[#172033]/5 text-[#94A3B8]';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ================= BENTO GRID ROW 1: PRIMARY OVERVIEW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bento Tile 1 (Span 7): Personal Productivity Progress & Score */}
        <div className="lg:col-span-7">
          <TodayProgressCard
            todayActivity={currentActivity}
            streakCount={streakCount}
            userName={user.name}
          />
        </div>

        {/* Bento Tile 2 (Span 5): Two-Friend Live Accountability */}
        <div className="lg:col-span-5">
          <FriendAccountabilityCard
            friendStats={friendStats}
            currentUser={user}
            onNavigateToFriendHub={() => navigate('friend')}
          />
        </div>
      </div>

      {/* ================= BENTO GRID ROW 2: CORE WORKFLOW MODULES ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bento Tile 3: Today's Tasks */}
        <div className="flex flex-col">
          <TodayTasksWidget
            tasks={tasks}
            onToggleTask={onToggleTask}
            onOpenTaskModal={openTaskModal}
            onNavigateToTasks={() => navigate('tasks')}
          />
        </div>

        {/* Bento Tile 4: Daily Schedule Time-Blocks */}
        <div className="flex flex-col">
          <DailyPlannerWidget
            plan={dailyPlan}
            items={plannerItems}
            onToggleItem={onTogglePlannerItem}
            onOpenItemModal={openPlannerModal}
            onNavigateToPlanner={() => navigate('planner')}
          />
        </div>

        {/* Bento Tile 5: Weekly Goals & Milestones */}
        <div className="flex flex-col md:col-span-2 lg:col-span-1">
          <WeeklyGoalsWidget
            goals={weeklyGoals}
            onIncrementGoal={handleIncrement}
            onOpenGoalModal={openGoalModal}
            onNavigateToWeekly={() => navigate('weekly')}
          />
        </div>
      </div>

      {/* ================= BENTO GRID ROW 3: CONSISTENCY MATRIX ================= */}
      <div className="bento-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div
            onClick={() => navigate('heatmap')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-2.5 rounded-2xl bg-[#DCFCE7] text-[#15803D] border border-[#34D399]/40 group-hover:bg-[#34D399] group-hover:text-white transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#172033] group-hover:text-[#7C3AED] transition-colors">
                  Consistency Matrix
                </h3>
                <span className="text-[11px] font-friendly font-bold px-2.5 py-0.5 rounded-full bg-[#FEF9C3] text-[#FB923C] border border-[#FACC15]/40 font-mono">
                  {streakCount} Day Streak 🔥
                </span>
              </div>
              <p className="text-xs font-friendly text-[#64748B]">
                28-day combined activity score across tasks, timeline commitments, and weekly milestones
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('heatmap')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-xs font-friendly font-bold text-[#7C3AED] transition-colors shrink-0 group cursor-pointer shadow-xs"
          >
            <span>Full 365-Day Matrix</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mini 28-Tile Grid */}
        <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-28 gap-2 pt-1">
          {last28Days.map((day) => (
            <div
              key={day.date}
              className="group relative flex flex-col items-center cursor-pointer"
              onClick={() => navigate('heatmap')}
            >
              <div
                className={`w-full aspect-square rounded-xl transition-all ${getHeatmapColor(
                  day.score
                )} hover:ring-2 hover:ring-[#7C3AED] hover:scale-110 flex items-center justify-center`}
              >
                <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100">
                  {day.score > 0 ? `${day.score}` : ''}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#64748B] mt-1.5 hidden sm:block">
                {day.dayNum}
              </span>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <div className="px-3 py-2 rounded-2xl bg-[#172033] text-white text-[11px] shadow-xl whitespace-nowrap text-center">
                  <p className="font-semibold text-white">{day.date}</p>
                  <p className="text-[#34D399] font-mono font-bold">Score: {day.score}%</p>
                  <p className="text-[#94A3B8]">{day.tasksDone} quests done (Click to inspect)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
