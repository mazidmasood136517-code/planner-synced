import React, { useState, useMemo, useEffect } from 'react';
import { DailyActivity, Task, PlannerItem } from '../../types';
import {
  Calendar as CalendarIcon,
  Flame,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  X,
  Target,
  RefreshCw,
  Zap,
  TrendingUp,
} from 'lucide-react';
import {
  format,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
} from 'date-fns';
import { getPlannerItemsForDate } from '../../services/db';

interface CalendarHeatmapViewProps {
  activities: DailyActivity[];
  tasks: Task[];
  plannerItems: PlannerItem[];
  streakCount: number;
  currentUserId?: string;
  onRefresh?: () => void;
}

export const CalendarHeatmapView: React.FC<CalendarHeatmapViewProps> = ({
  activities,
  tasks,
  plannerItems,
  streakCount,
  currentUserId,
  onRefresh,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [dayPlannerItems, setDayPlannerItems] = useState<PlannerItem[]>(plannerItems);
  const [loadingDayItems, setLoadingDayItems] = useState<boolean>(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const startDate = subDays(today, 364);

  // Group activities by date
  const activityMap = useMemo(() => {
    const map = new Map<string, DailyActivity>();
    for (const act of activities) {
      map.set(act.date, act);
    }
    return map;
  }, [activities]);

  // Compute live score for today if needed
  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === todayStr), [tasks, todayStr]);
  const todayCompletedTasks = useMemo(() => todayTasks.filter((t) => t.completed).length, [todayTasks]);
  const todayPlannerCompleted = useMemo(() => plannerItems.filter((i) => i.completed).length, [plannerItems]);

  const liveTodayScore = useMemo(() => {
    const existing = activityMap.get(todayStr);
    if (existing && existing.productivityScore > 0) {
      return existing.productivityScore;
    }
    const taskScore = todayTasks.length > 0 ? (todayCompletedTasks / todayTasks.length) * 60 : todayCompletedTasks > 0 ? 60 : 0;
    const plannerScore = plannerItems.length > 0 ? (todayPlannerCompleted / plannerItems.length) * 40 : todayPlannerCompleted > 0 ? 40 : 0;
    return Math.min(100, Math.round(taskScore + plannerScore));
  }, [activityMap, todayStr, todayTasks, todayCompletedTasks, plannerItems, todayPlannerCompleted]);

  // Build full 365 days
  const allDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: today }).map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const act = activityMap.get(dateStr);
      let score = act?.productivityScore ?? 0;
      if (dateStr === todayStr && liveTodayScore > score) {
        score = liveTodayScore;
      }
      return {
        date,
        dateStr,
        dayOfWeek: date.getDay(),
        score,
        tasksDone: act?.tasksCompleted ?? (dateStr === todayStr ? todayCompletedTasks : 0),
        totalTasks: act?.totalTasks ?? (dateStr === todayStr ? todayTasks.length : 0),
        plannerDone: act?.plannerItemsCompleted ?? (dateStr === todayStr ? todayPlannerCompleted : 0),
      };
    });
  }, [activityMap, startDate, today, todayStr, liveTodayScore, todayCompletedTasks, todayTasks.length, todayPlannerCompleted]);

  // Split into 52 weekly columns
  const weeks = useMemo(() => {
    const list: (typeof allDays)[] = [];
    let currentWeek: typeof allDays = [];

    allDays.forEach((day) => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6 || day.dateStr === todayStr) {
        list.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) list.push(currentWeek);
    return list;
  }, [allDays, todayStr]);

  // When selected day changes, fetch planner items for that specific day if not today
  useEffect(() => {
    if (selectedDay === todayStr) {
      setDayPlannerItems(plannerItems);
      return;
    }

    if (currentUserId) {
      let active = true;
      setLoadingDayItems(true);
      getPlannerItemsForDate(currentUserId, selectedDay)
        .then((items) => {
          if (active) {
            setDayPlannerItems(items);
            setLoadingDayItems(false);
          }
        })
        .catch(() => {
          if (active) setLoadingDayItems(false);
        });
      return () => {
        active = false;
      };
    }
  }, [selectedDay, todayStr, plannerItems, currentUserId]);

  const getHeatmapColor = (score: number) => {
    if (score >= 80) return 'bg-[#34D399] shadow-xs shadow-[#34D399]/40 border-[#10B981]';
    if (score >= 60) return 'bg-[#6EE7B7] border-[#34D399]';
    if (score >= 35) return 'bg-[#A7F3D0] border-[#6EE7B7]';
    if (score > 0) return 'bg-[#DCFCE7] border-[#A7F3D0]';
    return 'bg-[#F1F5F9] border-[#E2E8F0]';
  };

  // Selected Day Details
  const selectedActivity = activityMap.get(selectedDay);
  const selectedDayTasks = tasks.filter((t) => t.dueDate === selectedDay);
  const selectedDayScore = selectedDay === todayStr ? (liveTodayScore || selectedActivity?.productivityScore || 0) : (selectedActivity?.productivityScore ?? 0);

  // Overall Statistics
  const productiveDaysCount = allDays.filter((a) => a.score >= 25).length;
  const activeScores = allDays.map((a) => a.score).filter((s) => s > 0);
  const avgScore = activeScores.length > 0
    ? Math.round(activeScores.reduce((acc, s) => acc + s, 0) / activeScores.length)
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bento Banner */}
      <div className="bento-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 rounded-2xl bg-[#DCFCE7] text-[#15803D] border border-[#34D399]/40">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#172033] tracking-tight">
                Consistency Heatmap & History
              </h2>
              <p className="font-friendly text-xs text-[#64748B]">
                365-day matrix computed directly from your completed quests, daily timeline flow, and weekly milestones.
              </p>
            </div>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="p-3 rounded-2xl bg-[#FFFDF8] border border-[#172033]/5 text-center min-w-[95px] shadow-xs">
            <span className="text-[10px] font-friendly uppercase font-bold text-[#64748B] block">Current Streak</span>
            <div className="text-base font-bold text-[#FB923C] font-mono flex items-center justify-center gap-1">
              <Flame className="w-4 h-4" />
              <span>{streakCount} Days</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#FFFDF8] border border-[#172033]/5 text-center min-w-[95px] shadow-xs">
            <span className="text-[10px] font-friendly uppercase font-bold text-[#64748B] block">Active Days</span>
            <span className="text-base font-bold text-[#15803D] font-mono">{productiveDaysCount} / 365</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FFFDF8] border border-[#172033]/5 text-center min-w-[95px] shadow-xs">
            <span className="text-[10px] font-friendly uppercase font-bold text-[#64748B] block">Avg Score</span>
            <span className="text-base font-bold text-[#7C3AED] font-mono">{avgScore}%</span>
          </div>
        </div>
      </div>

      {/* 52-Week Full Heatmap Card */}
      <div className="bento-card p-6 overflow-x-auto">
        <div className="min-w-[780px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-[#172033]">
                365-Day Productivity Frequency
              </h3>
              <p className="font-friendly text-xs text-[#64748B]">
                Click on any tile to inspect that day's quests and timeline blocks.
              </p>
            </div>

            {/* Intensity Scale Legend */}
            <div className="flex items-center gap-2 text-xs font-friendly font-semibold text-[#64748B]">
              <span>Less</span>
              <div className="w-3.5 h-3.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0]" title="0% Score" />
              <div className="w-3.5 h-3.5 rounded-md bg-[#DCFCE7] border border-[#A7F3D0]" title="1-35% Score" />
              <div className="w-3.5 h-3.5 rounded-md bg-[#A7F3D0] border border-[#6EE7B7]" title="35-60% Score" />
              <div className="w-3.5 h-3.5 rounded-md bg-[#6EE7B7] border border-[#34D399]" title="60-80% Score" />
              <div className="w-3.5 h-3.5 rounded-md bg-[#34D399] border border-[#10B981]" title="80-100% Score" />
              <span>More</span>
            </div>
          </div>

          {/* Grid of Weeks */}
          <div className="flex gap-1.5 pt-2 pb-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((d) => (
                  <div
                    key={d.dateStr}
                    onClick={() => setSelectedDay(d.dateStr)}
                    className={`w-3.5 h-3.5 rounded-md cursor-pointer transition-all border ${getHeatmapColor(
                      d.score
                    )} ${
                      selectedDay === d.dateStr
                        ? 'ring-3 ring-[#7C3AED] scale-125 z-10 shadow-md'
                        : 'hover:scale-110 hover:ring-2 hover:ring-[#7C3AED]/40'
                    }`}
                    title={`${format(d.date, 'MMM d, yyyy')} • Score: ${d.score}% (${d.tasksDone} quests done)`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs font-friendly font-bold text-[#64748B] mt-4 pt-3 border-t border-[#172033]/5">
            <span>{format(startDate, 'MMMM yyyy')}</span>
            <span>{format(subDays(today, 180), 'MMMM yyyy')}</span>
            <span className="text-[#7C3AED] font-bold">{format(today, 'MMMM yyyy')} (Today)</span>
          </div>
        </div>
      </div>

      {/* Selected Day Inspector */}
      <div className="bento-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#172033]/5 mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F3E8FF] text-[#7C3AED] border border-[#7C3AED]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#172033]">
                Activity Inspector for {format(parseISO(selectedDay), 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="font-friendly text-xs text-[#64748B]">
                Productivity Score:{' '}
                <strong className="text-[#15803D] font-mono text-sm font-bold">
                  {selectedDayScore}%
                </strong>
                {selectedDay === todayStr && (
                  <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                    Today Live
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDay(todayStr)}
              className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-friendly font-bold text-[#172033] border border-[#172033]/5 transition-colors cursor-pointer"
            >
              Jump to Today
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Day's Tasks */}
          <div className="space-y-3">
            <h4 className="text-xs font-friendly font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Quests Scheduled ({selectedDayTasks.length})</span>
              <span className="font-mono text-[#15803D] font-bold">
                {selectedDayTasks.filter((t) => t.completed).length} / {selectedDayTasks.length} Done
              </span>
            </h4>

            {selectedDayTasks.length === 0 ? (
              <div className="py-6 text-center bg-[#FFFDF8] rounded-2xl border border-dashed border-[#172033]/10">
                <span className="text-2xl mb-1 block">📝</span>
                <p className="text-xs font-friendly text-[#64748B]">No quests recorded for this date.</p>
              </div>
            ) : (
              selectedDayTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-[#FFFDF8] border border-[#172033]/5 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-friendly font-bold truncate ${t.completed ? 'text-[#94A3B8] line-through' : 'text-[#172033]'}`}>
                      {t.title}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#64748B] font-mono shrink-0">
                    {t.category}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Day's Planner Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-friendly font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Timeline Blocks ({dayPlannerItems.length})</span>
              <span className="font-mono text-[#7C3AED] font-bold">
                {dayPlannerItems.filter((i) => i.completed).length} / {dayPlannerItems.length} Done
              </span>
            </h4>

            {loadingDayItems ? (
              <div className="py-6 text-center text-xs font-friendly text-[#64748B]">
                Loading schedule blocks...
              </div>
            ) : dayPlannerItems.length === 0 ? (
              <div className="py-6 text-center bg-[#FFFDF8] rounded-2xl border border-dashed border-[#172033]/10">
                <span className="text-2xl mb-1 block">⏰</span>
                <p className="text-xs font-friendly text-[#64748B]">No schedule blocks logged for this date.</p>
              </div>
            ) : (
              dayPlannerItems.map((i) => (
                <div
                  key={i.id}
                  className="p-3 rounded-2xl bg-[#FFFDF8] border border-[#172033]/5 flex items-center justify-between gap-2 shadow-xs"
                >
                  <span className={`text-xs font-friendly font-bold truncate ${i.completed ? 'text-[#94A3B8] line-through' : 'text-[#172033]'}`}>
                    {i.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md shrink-0">
                    {i.startTime} - {i.endTime}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
