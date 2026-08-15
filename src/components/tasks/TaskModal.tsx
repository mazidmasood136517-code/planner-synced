import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, TaskPriority, RecurrenceRule } from '../../types';
import { X, Calendar, Clock, Tag, AlertTriangle, Repeat, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  editingTask?: Task | null;
  userId: string;
}

const CATEGORIES: TaskCategory[] = [
  'DSA',
  'Development',
  'College',
  'Project',
  'GitHub',
  'LinkedIn',
  'Personal',
  'Other',
];

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingTask,
  userId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('DSA');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueTime, setDueTime] = useState('12:00');
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>('daily');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategory(editingTask.category);
      setPriority(editingTask.priority);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime || '12:00');
      setRecurring(editingTask.recurring);
      setRecurrenceRule(editingTask.recurrenceRule || 'daily');
      setEstimatedMinutes(editingTask.estimatedMinutes || 45);
    } else {
      setTitle('');
      setDescription('');
      setCategory('DSA');
      setPriority('High');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setDueTime('12:00');
      setRecurring(false);
      setRecurrenceRule('daily');
      setEstimatedMinutes(45);
    }
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (editingTask && onUpdate) {
        await onUpdate(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          dueDate,
          dueTime: dueTime || null,
          recurring,
          recurrenceRule: recurring ? recurrenceRule : null,
          estimatedMinutes: Number(estimatedMinutes) || null,
        });
      } else {
        await onSave({
          userId,
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          dueDate,
          dueTime: dueTime || null,
          completed: false,
          recurring,
          recurrenceRule: recurring ? recurrenceRule : null,
          estimatedMinutes: Number(estimatedMinutes) || null,
        });
      }
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <h3 className="text-base font-bold text-zinc-100">
            {editingTask ? 'Edit Task' : 'Create New Focus Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solve 3 Graph DFS/BFS Problems on LeetCode"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-zinc-500" />
              Notes / Sub-steps
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key notes, links, or specific test cases..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-zinc-100 text-xs placeholder:text-zinc-600 outline-none resize-none"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-200 text-xs font-mono outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-200 text-xs outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-200 text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-200 text-xs font-mono outline-none"
              />
            </div>
          </div>

          {/* Estimated minutes & Recurring */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                Recurring Task (Daily / Weekly)
              </label>
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-emerald-500"
              />
            </div>

            {recurring && (
              <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                <span className="text-xs text-zinc-400">Frequency:</span>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Every Weekday</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
