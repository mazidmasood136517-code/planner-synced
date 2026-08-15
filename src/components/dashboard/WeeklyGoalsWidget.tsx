import React from 'react';
import { WeeklyGoal } from '../../types';
import { Plus } from 'lucide-react';

interface WeeklyGoalsWidgetProps {
  goals: WeeklyGoal[];
  onIncrementGoal: (goalId: string) => void;
  onOpenGoalModal: () => void;
  onNavigateToWeekly: () => void;
}

export const WeeklyGoalsWidget: React.FC<WeeklyGoalsWidgetProps> = ({
  goals,
  onIncrementGoal,
  onOpenGoalModal,
  onNavigateToWeekly,
}) => {
  const completedGoals = goals.filter((g) => g.completed || g.currentValue >= g.targetValue);
  const totalGoals = goals.length;
  const overallPercentage = totalGoals > 0 ? Math.round((completedGoals.length / totalGoals) * 100) : 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'DSA':
        return 'bg-[#7C3AED]';
      case 'Development':
        return 'bg-[#34D399]';
      case 'GitHub':
        return 'bg-[#4F46E5]';
      case 'LinkedIn':
        return 'bg-[#3B82F6]';
      default:
        return 'bg-[#FB923C]';
    }
  };

  return (
    <div className="bento-card p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-[#172033]">
              Weekly Targets
            </h3>
            <span className="text-[11px] font-friendly font-semibold text-[#64748B]">
              {completedGoals.length} / {totalGoals} targets met ({overallPercentage}%)
            </span>
          </div>

          <button
            onClick={onOpenGoalModal}
            className="text-xs font-friendly font-bold text-[#7C3AED] hover:text-[#6D28D9] bg-[#F3E8FF] px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Target</span>
          </button>
        </div>

        {/* Goals Progress Bars */}
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
          {goals.length === 0 ? (
            <div className="py-8 text-center bg-[#FFFDF8] rounded-2xl border-2 border-dashed border-[#172033]/10">
              <span className="text-2xl mb-1 block">🎯</span>
              <p className="text-xs font-friendly text-[#64748B] mb-2">No weekly targets established yet.</p>
              <button
                onClick={onOpenGoalModal}
                className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-friendly font-bold cursor-pointer"
              >
                + Define your DSA, Dev or GitHub target
              </button>
            </div>
          ) : (
            goals.map((goal) => {
              const isComplete = goal.completed || goal.currentValue >= goal.targetValue;
              const pct = Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));

              return (
                <div
                  key={goal.id}
                  className="p-3 rounded-2xl bg-[#FFFDF8] border border-[#172033]/5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs sm:text-sm font-friendly font-bold text-[#172033] truncate">
                        {goal.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#64748B] font-mono font-medium">
                        {goal.category}
                      </span>
                    </div>

                    {/* Quick +1 increment button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono">
                        <strong className={isComplete ? 'text-[#15803D]' : 'text-[#172033]'}>
                          {goal.currentValue}
                        </strong>
                        <span className="text-[#64748B]"> / {goal.targetValue} {goal.unit}</span>
                      </span>

                      <button
                        onClick={() => onIncrementGoal(goal.id)}
                        className="p-1 rounded-lg bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] transition-colors cursor-pointer"
                        title="Increment progress by 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-[#34D399]' : getCategoryColor(goal.category)
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Navigation link */}
      <div className="pt-3.5 mt-3 border-t border-[#172033]/5 flex items-center justify-between">
        <span className="text-[11px] font-friendly font-medium text-[#64748B]">
          Weekly Sync Active
        </span>
        <button
          onClick={onNavigateToWeekly}
          className="text-xs font-friendly font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer"
        >
          View weekly planner →
        </button>
      </div>
    </div>
  );
};
