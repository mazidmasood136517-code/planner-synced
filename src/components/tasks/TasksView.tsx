import React, { useState, useMemo } from 'react';
import { Task, TaskCategory, TaskPriority } from '../../types';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  Circle,
  Sparkles,
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  userId: string;
  onToggleTask: (task: Task) => Promise<void> | void;
  onCreateTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void> | void;
  onDeleteTask: (taskOrId: Task | string) => Promise<void> | void;
}

const CATEGORIES: ('All' | TaskCategory)[] = [
  'All',
  'DSA',
  'Development',
  'College',
  'Project',
  'GitHub',
  'LinkedIn',
  'Personal',
  'Other',
];

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  userId,
  onToggleTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | TaskCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'newest'>('dueDate');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const priorityOrder: Record<TaskPriority, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  // Filter & Sort
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Category filter
        if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;

        // Status filter
        if (statusFilter === 'pending' && t.completed) return false;
        if (statusFilter === 'completed' && !t.completed) return false;

        // Priority filter
        if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesDesc = t.description?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        if (sortBy === 'newest') {
          return b.createdAt - a.createdAt;
        }
        // default: due date
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks, selectedCategory, statusFilter, priorityFilter, searchQuery, sortBy]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-100">Tasks & To-Do Engine</h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-lg">
            Manage your daily problem sets, dev sprints, college assignments, and personal targets with real-time Firestore persistence.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Progress Pill */}
          <div className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Overall Done</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {completedCount} / {totalCount} ({progressPct}%)
              </span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-emerald-400 flex items-center justify-center font-mono text-[11px] font-bold text-zinc-200">
              {progressPct}%
            </div>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const count = cat === 'All' ? tasks.length : tasks.filter((t) => t.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-emerald-500/30 text-emerald-200' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, problems, tickets..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs placeholder:text-zinc-500 outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'all' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'pending' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'completed' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Done
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'All' | TaskPriority)}
            className="bg-transparent text-zinc-200 text-xs outline-none flex-1 font-medium"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'newest')}
            className="bg-transparent text-zinc-200 text-xs outline-none flex-1 font-medium"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Task List Items */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto mb-3 text-zinc-500">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-200 mb-1">No tasks match your filters</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Try adjusting your search query, clearing filters, or adding a new task to your roadmap.
            </p>
            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/50"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onEdit={(t) => {
                setEditingTask(t);
                setIsModalOpen(true);
              }}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={onCreateTask}
        onUpdate={onUpdateTask}
        editingTask={editingTask}
        userId={userId}
      />
    </div>
  );
};
