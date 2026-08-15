import React, { useState } from 'react';
import { WeeklyGoal, TaskCategory } from '../../types';
import { X, Target, Tag, Hash } from 'lucide-react';

interface WeeklyGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Omit<WeeklyGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  userId: string;
  weekStart: string;
}

const CATEGORIES: TaskCategory[] = [
  'DSA',
  'Development',
  'GitHub',
  'LinkedIn',
  'College',
  'Project',
  'Personal',
  'Other',
];

export const WeeklyGoalModal: React.FC<WeeklyGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userId,
  weekStart,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('DSA');
  const [targetValue, setTargetValue] = useState<number>(15);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [unit, setUnit] = useState('problems');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        userId,
        weekStart,
        title: title.trim(),
        category,
        targetValue: Number(targetValue) || 1,
        currentValue: Number(currentValue) || 0,
        unit: unit.trim() || 'units',
        completed: Number(currentValue) >= Number(targetValue),
      });
      onClose();
    } catch (err) {
      console.error('Error saving weekly goal:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryPreset = (cat: TaskCategory) => {
    setCategory(cat);
    switch (cat) {
      case 'DSA':
        setTitle('Solve LeetCode Practice Problems');
        setTargetValue(20);
        setUnit('problems');
        break;
      case 'GitHub':
        setTitle('Push Meaningful Commits');
        setTargetValue(7);
        setUnit('commits');
        break;
      case 'LinkedIn':
        setTitle('Publish Technical Engineering Article');
        setTargetValue(1);
        setUnit('post');
        break;
      case 'Development':
        setTitle('Ship Core Product Features');
        setTargetValue(3);
        setUnit('features');
        break;
      case 'College':
        setTitle('Review Lectures & Complete Problem Sets');
        setTargetValue(5);
        setUnit('hours');
        break;
      default:
        setTitle('');
        setUnit('items');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">Set Weekly Accountability Target</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Picker Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => handleCategoryPreset(c)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    category === c
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Target Name / Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 25 LeetCode Medium Problems"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none"
            />
          </div>

          {/* Target Value & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Target Number
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-sm font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Unit (e.g. problems, commits)
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="problems / commits / post"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs outline-none"
              />
            </div>
          </div>

          {/* Starting Progress */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Initial Completed Progress
            </label>
            <input
              type="number"
              min="0"
              value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs font-mono outline-none"
            />
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
              {saving ? 'Saving...' : 'Set Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
