import { DailyActivity, Task, PlannerItem, WeeklyGoal } from '../types';
import { format, subDays, parseISO } from 'date-fns';

export interface ProductivityScoreWeights {
  taskCompletion: number; // default 0.50 (50%)
  weeklyGoals: number;    // default 0.25 (25%)
  githubActivity: number; // default 0.15 (15%)
  plannerItems: number;   // default 0.10 (10%)
}

export const DEFAULT_WEIGHTS: ProductivityScoreWeights = {
  taskCompletion: 0.50,
  weeklyGoals: 0.25,
  githubActivity: 0.15,
  plannerItems: 0.10,
};

/**
 * Calculates a 0-100 productivity score for a day.
 */
export function calculateDailyProductivityScore(params: {
  tasksCompleted: number;
  totalTasks: number;
  goalsCompleted: number;
  totalGoals: number;
  plannerItemsCompleted: number;
  totalPlannerItems: number;
  githubCommits: number;
  weights?: ProductivityScoreWeights;
}): number {
  const {
    tasksCompleted,
    totalTasks,
    goalsCompleted,
    totalGoals,
    plannerItemsCompleted,
    totalPlannerItems,
    githubCommits,
    weights = DEFAULT_WEIGHTS,
  } = params;

  // Task score: if no tasks scheduled, default to 100% only if other positive activity exists, or 0%
  let taskRatio = 0;
  if (totalTasks > 0) {
    taskRatio = Math.min(1, tasksCompleted / totalTasks);
  } else if (tasksCompleted > 0) {
    taskRatio = 1;
  }

  // Weekly goals contribution
  let goalsRatio = 0;
  if (totalGoals > 0) {
    goalsRatio = Math.min(1, goalsCompleted / totalGoals);
  } else if (goalsCompleted > 0) {
    goalsRatio = 1;
  }

  // Planner schedule adherence
  let plannerRatio = 0;
  if (totalPlannerItems > 0) {
    plannerRatio = Math.min(1, plannerItemsCompleted / totalPlannerItems);
  } else if (plannerItemsCompleted > 0) {
    plannerRatio = 1;
  }

  // GitHub activity (1 commit = 0.5, 2+ commits = 1.0)
  const githubRatio = Math.min(1, githubCommits / 2);

  const rawScore =
    taskRatio * weights.taskCompletion * 100 +
    goalsRatio * weights.weeklyGoals * 100 +
    plannerRatio * weights.plannerItems * 100 +
    githubRatio * weights.githubActivity * 100;

  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

/**
 * Convenience helper for dashboard calculation
 */
export function calculateProductivityScore(params: {
  totalTasks: number;
  completedTasks: number;
  totalPlannerBlocks?: number;
  completedPlannerBlocks?: number;
  weeklyGoalRate?: number;
  hasLinkedinActivity?: boolean;
}): number {
  const {
    totalTasks,
    completedTasks,
    totalPlannerBlocks = 0,
    completedPlannerBlocks = 0,
    weeklyGoalRate = 0,
    hasLinkedinActivity = false,
  } = params;

  let taskRatio = totalTasks > 0 ? completedTasks / totalTasks : completedTasks > 0 ? 1 : 0;
  let plannerRatio = totalPlannerBlocks > 0 ? completedPlannerBlocks / totalPlannerBlocks : completedPlannerBlocks > 0 ? 1 : 0;
  let goalRatio = weeklyGoalRate / 100;
  let linkedinBonus = hasLinkedinActivity ? 0.1 : 0;

  const score = (taskRatio * 0.45 + plannerRatio * 0.25 + goalRatio * 0.20 + linkedinBonus) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculates current streak in days based on an array of daily activity records.
 */
export function calculateStreak(activities: DailyActivity[]): number {
  if (!activities || activities.length === 0) return 0;

  // Create a fast map: YYYY-MM-DD -> isProductive
  const activityMap = new Map<string, boolean>();
  for (const act of activities) {
    const isProductive = 
      act.productivityScore >= 25 || 
      act.tasksCompleted > 0 || 
      act.plannerItemsCompleted > 0 ||
      act.githubCommits > 0;
    activityMap.set(act.date, isProductive);
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  let streak = 0;
  let checkDate = new Date();

  // If today is not yet productive, start checking from yesterday so we don't break today's streak mid-day
  if (!activityMap.get(todayStr)) {
    // If yesterday was productive, streak is active
    if (activityMap.get(yesterdayStr)) {
      checkDate = subDays(new Date(), 1);
    } else {
      return 0;
    }
  }

  while (true) {
    const dateKey = format(checkDate, 'yyyy-MM-dd');
    if (activityMap.get(dateKey)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates weekly completion stats.
 */
export function calculateWeeklyGoalStats(goals: WeeklyGoal[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  if (!goals || goals.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const completed = goals.filter((g) => g.completed || g.currentValue >= g.targetValue).length;
  const total = goals.length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}
