import React, { useState, useEffect } from 'react';
import { PlannerItem, DailyPlan, TaskCategory } from '../../types';
import { TimeBlockModal } from './TimeBlockModal';
import {
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Flame,
  Save,
  Check,
} from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';

interface DailyPlannerViewProps {
  userId: string;
  dailyPlan: DailyPlan | null;
  plannerItems: PlannerItem[];
  currentDate: string;
  onDateChange: (date: string) => void;
  onSaveDailyPlan: (focus: string, notes?: string) => Promise<void>;
  onCreateItem: (item: Omit<PlannerItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateItem: (itemId: string, updates: Partial<PlannerItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onToggleItem: (item: PlannerItem) => Promise<void>;
}

export const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({
  userId,
  dailyPlan,
  plannerItems,
  currentDate,
  onDateChange,
  onSaveDailyPlan,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onToggleItem,
}) => {
  const [focusText, setFocusText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlannerItem | null>(null);

  useEffect(() => {
    if (dailyPlan) {
      setFocusText(dailyPlan.focus || '');
      setNotesText(dailyPlan.notes || '');
    } else {
      setFocusText('');
      setNotesText('');
    }
  }, [dailyPlan, currentDate]);

  const handleSavePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPlan(true);
    try {
      await onSaveDailyPlan(focusText, notesText);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving plan:', err);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const completedCount = plannerItems.filter((i) => i.completed).length;
  const totalCount = plannerItems.length;
  const adherencePct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getCategoryColor = (cat: TaskCategory) => {
    switch (cat) {
      case 'DSA':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Development':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'GitHub':
        return 'bg-zinc-800 text-zinc-200 border-zinc-700';
      case 'LinkedIn':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'College':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Project':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const isToday = currentDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation & Date Bar */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Daily Time-Block Planner
              {isToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold font-mono">
                  TODAY
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400">
              Schedule your deep work blocks to protect your time and maintain high momentum.
            </p>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => onDateChange(format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd'))}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-semibold text-zinc-200 focus:border-teal-500 outline-none"
          />

          <button
            onClick={() => onDateChange(format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd'))}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => onDateChange(format(new Date(), 'yyyy-MM-dd'))}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
            >
              Today
            </button>
          )}

          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-teal-950/50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Block</span>
          </button>
        </div>
      </div>

      {/* Daily Focus & Intentions Card */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-zinc-100">Primary Focus & Intention for the Day</h3>
          </div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Plan Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSavePlan} className="space-y-3">
          <input
            type="text"
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
            placeholder="e.g. Master Tree Traversal Algorithms & Finish Backend Auth Security"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-teal-500 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none font-medium"
          />

          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Extra notes, reminder for sync with friend, or reflection..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-teal-500 text-zinc-300 text-xs placeholder:text-zinc-600 outline-none"
            />
            <button
              type="submit"
              disabled={isSavingPlan}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingPlan ? 'Saving...' : 'Save Focus'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Schedule Adherence Header & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Time Blocks Sequence */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <span>Time Blocks Timeline</span>
              <span className="text-xs text-zinc-400 font-mono">
                ({plannerItems.length} blocks)
              </span>
            </h3>

            <div className="text-xs font-mono text-zinc-400">
              Adherence: <strong className="text-teal-400">{adherencePct}%</strong>
            </div>
          </div>

          {plannerItems.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-8">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-200 mb-1">No time blocks for this date</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                Structure your day into deliberate chunks to maximize flow state and accountability.
              </p>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-md shadow-teal-950/50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Time Block</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {plannerItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    item.completed
                      ? 'bg-zinc-950/40 border-zinc-800/40 opacity-60 hover:opacity-100'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleItem(item)}
                      className={`shrink-0 transition-transform active:scale-90 ${
                        item.completed ? 'text-teal-400' : 'text-zinc-500 hover:text-teal-400'
                      }`}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            item.completed ? 'text-zinc-400 line-through' : 'text-zinc-100'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold border ${getCategoryColor(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        {item.startTime} - {item.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pl-3">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="Edit block"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Delete block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Column: Schedule Summary & Best Practices */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl">
            <h3 className="text-sm font-bold text-zinc-100 mb-3">Time-Blocking Rhythm</h3>
            <div className="space-y-3 text-xs text-zinc-400">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-semibold text-zinc-200 block mb-1">Morning Peak: 08:00 - 11:00</span>
                <p>Reserve for high-cognitive load tasks like DSA problem solving or core architecture design.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-semibold text-zinc-200 block mb-1">Afternoon Flow: 14:00 - 17:30</span>
                <p>Ideal for deep coding sprints, feature implementation, and college lectures.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-semibold text-zinc-200 block mb-1">Evening Review: 19:30 - 21:00</span>
                <p>Push GitHub commits, review tomorrow's plan, and sync status with your friend.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Block Modal */}
      <TimeBlockModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={onCreateItem}
        onUpdate={onUpdateItem}
        editingItem={editingItem}
        userId={userId}
        selectedDate={currentDate}
      />
    </div>
  );
};
