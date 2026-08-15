import React from 'react';
import { PlannerItem, DailyPlan } from '../../types';
import { Plus, Sparkles, Check } from 'lucide-react';

interface DailyPlannerWidgetProps {
  plan: DailyPlan | null;
  items: PlannerItem[];
  onToggleItem: (item: PlannerItem) => void;
  onOpenItemModal: () => void;
  onNavigateToPlanner: () => void;
}

export const DailyPlannerWidget: React.FC<DailyPlannerWidgetProps> = ({
  plan,
  items,
  onToggleItem,
  onOpenItemModal,
  onNavigateToPlanner,
}) => {
  const getBlockStyle = (category: string, completed: boolean) => {
    if (completed) {
      return 'bg-[#DCFCE7] text-[#15803D] border-2 border-[#34D399] opacity-80';
    }
    switch (category) {
      case 'DSA':
        return 'bg-[#F3E8FF] text-[#7C3AED] border-2 border-transparent hover:border-[#7C3AED]/30';
      case 'Development':
        return 'bg-[#DCFCE7] text-[#15803D] border-2 border-[#34D399]/40';
      case 'College':
        return 'bg-[#E0F2FE] text-[#0284C7] border-2 border-transparent hover:border-[#38BDF8]/40';
      case 'LinkedIn':
      case 'Writing':
        return 'bg-[#FEF9C3] text-[#856404] border-2 border-transparent hover:border-[#FACC15]/40';
      default:
        return 'bg-[#F8FAFC] text-[#172033] border-2 border-[#172033]/5';
    }
  };

  const getEmoji = (category: string) => {
    switch (category) {
      case 'DSA':
        return '🧠';
      case 'Development':
        return '💻';
      case 'College':
        return '📚';
      case 'LinkedIn':
      case 'Writing':
        return '✍️';
      case 'Fitness':
        return '🏃';
      default:
        return '⚡';
    }
  };

  return (
    <div className="bento-card p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg sm:text-xl text-[#172033]">
            Today's Flow
          </h3>
          <button
            onClick={onOpenItemModal}
            className="text-xs font-friendly font-bold text-[#7C3AED] hover:text-[#6D28D9] bg-[#F3E8FF] px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Block</span>
          </button>
        </div>

        {/* Daily Focus Callout */}
        {plan?.focus && (
          <div className="mb-3.5 p-3 rounded-2xl bg-[#F3E8FF]/60 border border-[#7C3AED]/20 text-xs text-[#7C3AED] flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-friendly uppercase font-bold text-[#7C3AED] tracking-wider block">
                Today's Core Focus
              </span>
              <p className="truncate font-semibold text-[#172033]">{plan.focus}</p>
            </div>
          </div>
        )}

        {/* Timeline Schedule Blocks */}
        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="py-8 text-center bg-[#FFFDF8] rounded-2xl border-2 border-dashed border-[#172033]/10">
              <span className="text-2xl mb-1 block">⏳</span>
              <p className="text-xs font-friendly text-[#64748B] mb-2">No timeline blocks scheduled.</p>
              <button
                onClick={onOpenItemModal}
                className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-friendly font-bold cursor-pointer"
              >
                + Plan a morning or evening flow
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => onToggleItem(item)}
                className="flex items-center gap-3 group cursor-pointer"
              >
                {/* Time Tag */}
                <div className="font-mono text-xs font-semibold text-[#64748B] w-12 text-right shrink-0">
                  {item.startTime}
                </div>

                {/* Timeline Block */}
                <div
                  className={`flex-1 flex items-center justify-between p-3 rounded-2xl font-friendly font-bold text-xs sm:text-sm transition-all shadow-xs ${getBlockStyle(
                    item.category,
                    item.completed
                  )}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{getEmoji(item.category)}</span>
                    <span className={`truncate ${item.completed ? 'line-through' : ''}`}>
                      {item.title}
                    </span>
                  </div>

                  {item.completed ? (
                    <span className="shrink-0 p-1 rounded-full bg-[#15803D] text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-current opacity-70 shrink-0">
                      {item.endTime}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Navigation link */}
      <div className="pt-3.5 mt-3 border-t border-[#172033]/5 flex items-center justify-between">
        <span className="text-[11px] font-friendly font-medium text-[#64748B]">
          Visual 24h Flow
        </span>
        <button
          onClick={onNavigateToPlanner}
          className="text-xs font-friendly font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer"
        >
          Open 24h Planner →
        </button>
      </div>
    </div>
  );
};
