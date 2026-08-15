import React, { useState, useEffect } from 'react';
import { WeeklyPlan, WeeklyGoal, LinkedinGoal, TaskCategory } from '../../types';
import { WeeklyGoalModal } from './WeeklyGoalModal';
import {
  Target,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Linkedin,
  Github,
  Code2,
  BookOpen,
  PlusCircle,
  MinusCircle,
  Trash2,
  Save,
  Check,
  Award,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO } from 'date-fns';
import confetti from 'canvas-confetti';

interface WeeklyPlannerViewProps {
  userId: string;
  weeklyPlan: WeeklyPlan | null;
  weeklyGoals: WeeklyGoal[];
  linkedinGoal: LinkedinGoal | null;
  currentWeekStart: string;
  onWeekChange: (weekStart: string) => void;
  onSaveWeeklyPlan: (mainFocus: string, notes?: string, reflection?: string) => Promise<void>;
  onCreateGoal: (goal: Omit<WeeklyGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateGoal: (goalId: string, updates: Partial<WeeklyGoal>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onIncrementGoal: (goalId: string, amount: number) => Promise<void>;
  onSaveLinkedinGoal: (goal: LinkedinGoal) => Promise<void>;
}

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  userId,
  weeklyPlan,
  weeklyGoals,
  linkedinGoal,
  currentWeekStart,
  onWeekChange,
  onSaveWeeklyPlan,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onIncrementGoal,
  onSaveLinkedinGoal,
}) => {
  const [mainFocus, setMainFocus] = useState('');
  const [notes, setNotes] = useState('');
  const [reflection, setReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // LinkedIn local state
  const [linkedinTopic, setLinkedinTopic] = useState('');
  const [linkedinStatus, setLinkedinStatus] = useState<'planned' | 'drafted' | 'published'>('planned');
  const [linkedinPostsTarget, setLinkedinPostsTarget] = useState(1);
  const [linkedinPostsDone, setLinkedinPostsDone] = useState(0);

  const weekStartDate = parseISO(currentWeekStart);
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });

  useEffect(() => {
    if (weeklyPlan) {
      setMainFocus(weeklyPlan.mainFocus || '');
      setNotes(weeklyPlan.notes || '');
      setReflection(weeklyPlan.reflection || '');
    } else {
      setMainFocus('');
      setNotes('');
      setReflection('');
    }
  }, [weeklyPlan, currentWeekStart]);

  useEffect(() => {
    if (linkedinGoal) {
      setLinkedinTopic(linkedinGoal.topic || '');
      setLinkedinStatus(linkedinGoal.status || 'planned');
      setLinkedinPostsTarget(linkedinGoal.targetPosts || 1);
      setLinkedinPostsDone(linkedinGoal.completedPosts || 0);
    } else {
      setLinkedinTopic('');
      setLinkedinStatus('planned');
      setLinkedinPostsTarget(1);
      setLinkedinPostsDone(0);
    }
  }, [linkedinGoal, currentWeekStart]);

  const handleSavePlan = async () => {
    setIsSaving(true);
    try {
      await onSaveWeeklyPlan(mainFocus, notes, reflection);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving weekly plan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLinkedin = async (status: 'planned' | 'drafted' | 'published', completed: number) => {
    setLinkedinStatus(status);
    setLinkedinPostsDone(completed);
    await onSaveLinkedinGoal({
      userId,
      weekStart: currentWeekStart,
      targetPosts: linkedinPostsTarget,
      completedPosts: completed,
      status,
      topic: linkedinTopic,
      updatedAt: Date.now(),
    });

    if (status === 'published' && completed >= linkedinPostsTarget) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
      });
    }
  };

  const completedGoalsCount = weeklyGoals.filter((g) => g.completed || g.currentValue >= g.targetValue).length;
  const totalGoalsCount = weeklyGoals.length;
  const completionPercentage = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  const getCategoryIcon = (cat: TaskCategory) => {
    switch (cat) {
      case 'DSA':
        return Code2;
      case 'GitHub':
        return Github;
      case 'LinkedIn':
        return Linkedin;
      case 'College':
        return BookOpen;
      default:
        return Target;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Week Navigator Header */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Weekly Targets & Accountability Sprint
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              {format(weekStartDate, 'MMM d')} – {format(weekEndDate, 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Week controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => onWeekChange(format(subWeeks(weekStartDate, 1), 'yyyy-MM-dd'))}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-semibold text-zinc-300 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
            Sprint: {format(weekStartDate, 'dd MMM')}
          </span>

          <button
            onClick={() => onWeekChange(format(addWeeks(weekStartDate, 1), 'yyyy-MM-dd'))}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Target</span>
          </button>
        </div>
      </div>

      {/* Main Focus / North Star Card */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">Sprint Objective & North Star</h3>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={mainFocus}
            onChange={(e) => setMainFocus(e.target.value)}
            placeholder="e.g. Ship Full Auth Stack + 20 DSA Graph Questions + 7 GitHub Commits"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none font-medium"
          />

          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Accountability agreements with friend, milestone deadlines..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-300 text-xs placeholder:text-zinc-600 outline-none"
            />
            <button
              onClick={handleSavePlan}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Sprint'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Progress Overview Strip */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Weekly Target Progress Cards</h3>
            <p className="text-xs text-zinc-400">
              Hold yourself and your partner accountable to quantitative benchmarks.
            </p>
          </div>
          <div className="text-xs font-mono text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
            Completed: <strong className="text-emerald-400">{completedGoalsCount}</strong> / {totalGoalsCount} ({completionPercentage}%)
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeklyGoals.map((goal) => {
            const Icon = getCategoryIcon(goal.category);
            const isComplete = goal.completed || goal.currentValue >= goal.targetValue;
            const pct = Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isComplete
                    ? 'bg-zinc-950/70 border-emerald-500/30'
                    : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 shrink-0">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-200 truncate">{goal.title}</h4>
                      <span className="text-[10px] font-mono text-zinc-400">{goal.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">
                      <strong className={isComplete ? 'text-emerald-400 font-bold' : 'text-zinc-100'}>
                        {goal.currentValue}
                      </strong>{' '}
                      / {goal.targetValue} {goal.unit}
                    </span>
                    <span className={`font-bold ${isComplete ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      {pct}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-400' : 'bg-emerald-500/80'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Increment / Decrement controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onIncrementGoal(goal.id, -1)}
                        className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[11px] font-mono transition-colors"
                        title="Decrement by 1"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => onIncrementGoal(goal.id, 1)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-500/20 text-emerald-400 border border-zinc-800 hover:border-emerald-500/30 text-[11px] font-mono font-bold transition-all"
                        title="Increment by 1"
                      >
                        +1 {goal.unit}
                      </button>
                      <button
                        onClick={() => onIncrementGoal(goal.id, 5)}
                        className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[11px] font-mono transition-colors"
                        title="Increment by 5"
                      >
                        +5
                      </button>
                    </div>

                    {isComplete && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Target Met!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LinkedIn Technical Accountability Module */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Linkedin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">LinkedIn Technical Post Target</h3>
            <p className="text-xs text-zinc-400">
              Build your technical presence publicly and verify posts with your accountability partner.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2 space-y-3">
            <input
              type="text"
              value={linkedinTopic}
              onChange={(e) => setLinkedinTopic(e.target.value)}
              placeholder="Post Topic (e.g. Distributed Consensus or Dynamic Programming Patterns)"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-sky-500 text-zinc-100 text-xs placeholder:text-zinc-600 outline-none font-medium"
            />

            {/* Status Steps */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Status:</span>
              <button
                onClick={() => handleSaveLinkedin('planned', 0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  linkedinStatus === 'planned'
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                1. Planned
              </button>
              <button
                onClick={() => handleSaveLinkedin('drafted', 0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  linkedinStatus === 'drafted'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                2. Drafted
              </button>
              <button
                onClick={() => handleSaveLinkedin('published', 1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  linkedinStatus === 'published'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                3. Published 🎉
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col justify-between">
            <span className="text-[11px] uppercase font-semibold text-zinc-400">Sprint Goal</span>
            <div className="text-sm font-bold text-zinc-200">
              {linkedinPostsDone} / {linkedinPostsTarget} Published
            </div>
            <span className="text-[10px] text-zinc-400">
              Synced with your friend's accountability card.
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Reflection Card */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl">
        <h3 className="text-sm font-bold text-zinc-100 mb-2">Weekly Reflection & Retrospective</h3>
        <p className="text-xs text-zinc-400 mb-3">
          What went well this sprint? Where did momentum slow down?
        </p>
        <textarea
          rows={3}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Reflect on your DSA problem speed, consistency challenges, and targets for next sprint..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-200 text-xs placeholder:text-zinc-600 outline-none resize-none mb-3"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSavePlan}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Reflection</span>
          </button>
        </div>
      </div>

      {/* Goal Modal */}
      <WeeklyGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={onCreateGoal}
        userId={userId}
        weekStart={currentWeekStart}
      />
    </div>
  );
};
