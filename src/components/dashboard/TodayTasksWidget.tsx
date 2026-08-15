import React from 'react';
import { Task } from '../../types';
import { Plus, Check, Clock } from 'lucide-react';

interface TodayTasksWidgetProps {
  tasks: Task[];
  onToggleTask: (task: Task) => void;
  onOpenTaskModal: () => void;
  onNavigateToTasks: () => void;
}

export const TodayTasksWidget: React.FC<TodayTasksWidgetProps> = ({
  tasks,
  onToggleTask,
  onOpenTaskModal,
  onNavigateToTasks,
}) => {
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const getPriorityTag = (p: Task['priority']) => {
    switch (p) {
      case 'Critical':
      case 'High':
        return 'bg-[#FCE7F3] text-[#FB7185] border border-[#FB7185]/20';
      case 'Medium':
        return 'bg-[#FEF9C3] text-[#856404] border border-[#FACC15]/20';
      default:
        return 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]/40';
    }
  };

  const getCategoryTag = (c: Task['category']) => {
    switch (c) {
      case 'DSA':
        return 'bg-[#F3E8FF] text-[#7C3AED] border border-[#7C3AED]/20';
      case 'Development':
        return 'bg-[#DCFCE7] text-[#15803D] border border-[#34D399]/30';
      case 'GitHub':
        return 'bg-[#EEF2FF] text-[#4F46E5] border border-[#6366F1]/20';
      case 'LinkedIn':
        return 'bg-[#E0F2FE] text-[#0284C7] border border-[#38BDF8]/30';
      case 'College':
        return 'bg-[#FEF9C3] text-[#856404] border border-[#FACC15]/30';
      default:
        return 'bg-[#FCE7F3] text-[#DB2777] border border-[#F472B6]/30';
    }
  };

  return (
    <div className="bento-card p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg sm:text-xl text-[#172033]">
            Main Quests
          </h3>
          <span className="text-[11px] font-friendly font-bold text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-1 rounded-full">
            {completedTasks.length} / {tasks.length} DONE
          </span>
        </div>

        {/* Task List */}
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <div className="py-8 text-center bg-[#FFFDF8] rounded-2xl border-2 border-dashed border-[#172033]/10">
              <span className="text-2xl mb-1 block">🎯</span>
              <p className="text-xs font-friendly text-[#64748B] mb-2">No tasks scheduled yet!</p>
              <button
                onClick={onOpenTaskModal}
                className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-friendly font-bold cursor-pointer"
              >
                + Add your first quest
              </button>
            </div>
          ) : (
            <>
              {/* Pending Tasks */}
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task)}
                  className="group flex items-start gap-3 p-3 rounded-2xl bg-[#FFFDF8] hover:bg-white border-2 border-transparent hover:border-[#F3E8FF] transition-all cursor-pointer shadow-xs"
                >
                  <div className="w-5 h-5 rounded-md border-2 border-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#F3E8FF] transition-colors" />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-[#172033] leading-snug truncate">
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md ${getCategoryTag(
                          task.category
                        )}`}
                      >
                        {task.category}
                      </span>
                      <span
                        className={`text-[10px] font-friendly font-bold px-2 py-0.5 rounded-md ${getPriorityTag(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      {task.dueTime && (
                        <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {task.dueTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Completed Tasks */}
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task)}
                  className="group flex items-start gap-3 p-3 rounded-2xl bg-[#DCFCE7]/70 border border-[#34D399]/30 transition-all cursor-pointer opacity-80 hover:opacity-100"
                >
                  <div className="w-5 h-5 rounded-md bg-[#34D399] border-2 border-[#34D399] flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-[#172033]/70 line-through leading-snug truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/60 text-[#15803D] font-bold">
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Footer Action Button */}
      <button
        onClick={onOpenTaskModal}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mt-4 btn-primary-purple cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>+ Add Task</span>
      </button>
    </div>
  );
};
