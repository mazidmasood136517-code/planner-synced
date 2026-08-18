import React from 'react';
import { Task } from '../../types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Repeat,
  Trash2,
  Edit3,
  AlertCircle,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskOrId: Task | string) => void;
  /** Optional short label shown when a pending task was completed on a
   * different date than it was assigned, e.g. "Completed Jun 12". */
  completedDateNote?: string | null;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  completedDateNote,
}) => {
  const getPriorityStyle = (p: Task['priority']) => {
    switch (p) {
      case 'Critical':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'High':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-zinc-400 bg-zinc-800/80 border-zinc-700/80';
    }
  };

  const getCategoryStyle = (c: Task['category']) => {
    switch (c) {
      case 'DSA':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'Development':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'GitHub':
        return 'text-zinc-200 bg-zinc-800 border-zinc-700';
      case 'LinkedIn':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'College':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Project':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      default:
        return 'text-zinc-400 bg-zinc-800/80 border-zinc-700/80';
    }
  };

  return (
    <div
      className={`group relative flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all ${
        task.completed
          ? 'bg-[#121212]/50 border-white/5 opacity-60 hover:opacity-100'
          : 'bg-[#121212] hover:bg-[#161616] border-white/5 hover:border-white/15 shadow-md'
      }`}
    >
      {/* Left: Checkbox & Info */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
            task.completed ? 'text-emerald-400' : 'text-zinc-500 hover:text-emerald-400'
          }`}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-semibold leading-snug transition-all ${
                task.completed ? 'text-zinc-400 line-through' : 'text-zinc-100'
              }`}
            >
              {task.title}
            </h4>
            {task.recurring && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                <Repeat className="w-3 h-3 text-emerald-400" />
                {task.recurrenceRule || 'recurring'}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Badges and metadata */}
          <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border font-mono ${getCategoryStyle(
                task.category
              )}`}
            >
              {task.category}
            </span>

            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${getPriorityStyle(
                task.priority
              )}`}
            >
              {task.priority}
            </span>

            {task.dueDate && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-zinc-500" />
                {task.dueDate}
              </span>
            )}

            {task.dueTime && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-zinc-500" />
                {task.dueTime}
              </span>
            )}

            {task.estimatedMinutes && (
              <span className="text-[10px] text-zinc-400 font-mono">
                ~{task.estimatedMinutes}m
              </span>
            )}

            {completedDateNote && (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold border text-amber-300 bg-amber-500/10 border-amber-500/30">
                {completedDateNote}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Edit task"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
