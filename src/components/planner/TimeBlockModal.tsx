import React, { useState, useEffect } from 'react';
import { PlannerItem, TaskCategory } from '../../types';
import { X, Clock, Tag, AlignLeft } from 'lucide-react';

interface TimeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<PlannerItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (itemId: string, updates: Partial<PlannerItem>) => Promise<void>;
  editingItem?: PlannerItem | null;
  userId: string;
  selectedDate: string;
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

export const TimeBlockModal: React.FC<TimeBlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingItem,
  userId,
  selectedDate,
}) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [category, setCategory] = useState<TaskCategory>('DSA');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setStartTime(editingItem.startTime);
      setEndTime(editingItem.endTime);
      setCategory(editingItem.category);
    } else {
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:30');
      setCategory('DSA');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (editingItem && onUpdate) {
        await onUpdate(editingItem.id, {
          title: title.trim(),
          startTime,
          endTime,
          category,
        });
      } else {
        await onSave({
          userId,
          date: selectedDate,
          title: title.trim(),
          startTime,
          endTime,
          category,
          completed: false,
        });
      }
      onClose();
    } catch (err) {
      console.error('Error saving time block:', err);
    } finally {
      setSaving(false);
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
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">
              {editingItem ? 'Edit Time Block' : 'Schedule Focus Block'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Block Title / Activity <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DSA: Binary Trees & Graphs"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-teal-500 text-zinc-200 text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-teal-500 text-zinc-200 text-xs font-mono outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-teal-500 text-zinc-200 text-xs font-mono outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Quick presets */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-semibold block mb-2">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { title: 'Morning DSA Problem Solving', start: '08:00', end: '09:30', cat: 'DSA' as TaskCategory },
                { title: 'College Classes / Lectures', start: '10:00', end: '13:00', cat: 'College' as TaskCategory },
                { title: 'Development Sprint', start: '15:00', end: '17:30', cat: 'Development' as TaskCategory },
                { title: 'GitHub Commit & Review', start: '19:30', end: '20:30', cat: 'GitHub' as TaskCategory },
              ].map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setTitle(p.title);
                    setStartTime(p.start);
                    setEndTime(p.end);
                    setCategory(p.cat);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors"
                >
                  {p.title.split(':')[0]} ({p.start}-{p.end})
                </button>
              ))}
            </div>
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
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow-lg shadow-teal-950/50 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingItem ? 'Update Block' : 'Save Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
