import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Target,
  Calendar,
  Users2,
  Settings,
  Flame,
  Sparkles,
  Zap,
  Plus,
  X,
  Menu,
} from 'lucide-react';

export type AppTabType =
  | 'dashboard'
  | 'tasks'
  | 'planner'
  | 'weekly'
  | 'heatmap'
  | 'friend'
  | 'settings';

interface SidebarProps {
  currentTab: string;
  onSelectTab?: (tab: 'dashboard' | 'tasks' | 'planner' | 'weekly' | 'heatmap' | 'friend' | 'settings') => void;
  onTabChange?: (tab: 'dashboard' | 'tasks' | 'planner' | 'weekly' | 'heatmap' | 'friend' | 'settings') => void;
  streakCount?: number;
  todayScore?: number;
  friendName?: string;
  hasFriend?: boolean;
  onOpenNewTask?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onTabChange,
  streakCount = 0,
  todayScore = 0,
  friendName,
  hasFriend = false,
  onOpenNewTask,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const handleTab = (id: 'dashboard' | 'tasks' | 'planner' | 'weekly' | 'heatmap' | 'friend' | 'settings') => {
    if (onSelectTab) onSelectTab(id);
    if (onTabChange) onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems: { id: 'dashboard' | 'tasks' | 'planner' | 'weekly' | 'heatmap' | 'friend' | 'settings'; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks & Sprints', icon: CheckSquare },
    { id: 'planner', label: 'Daily Planner', icon: Clock },
    { id: 'weekly', label: 'Weekly Goals', icon: Target },
    { id: 'heatmap', label: 'Consistency Matrix', icon: Calendar },
    {
      id: 'friend',
      label: 'Partner Sync',
      icon: Users2,
      badge: hasFriend ? (friendName ? `@${friendName}` : 'Synced') : 'Invite',
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full select-none p-5 bg-white">
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#F472B6] flex items-center justify-center text-white text-lg shadow-md shadow-purple-500/30">
            🚀
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-tight text-[#7C3AED] leading-none">
              DuoTrack
            </h1>
            <p className="font-friendly text-[11px] text-[#64748B] font-medium mt-0.5">Productivity Playground</p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Metrics Capsule */}
      <div className="px-3.5 py-2.5 mb-4 rounded-2xl bg-[#F8FAFC] border border-[#172033]/5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#FEF9C3] text-[#FB923C] border border-[#FACC15]/30">
            <Flame className="w-3.5 h-3.5 animate-pulse text-[#FB923C]" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-friendly uppercase tracking-wider font-semibold block">Streak</span>
            <span className="text-xs font-bold text-[#172033] font-mono">{streakCount} Days</span>
          </div>
        </div>

        <div className="h-6 w-px bg-[#172033]/10" />

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#DCFCE7] text-[#34D399] border border-[#34D399]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-friendly uppercase tracking-wider font-semibold block">Score</span>
            <span className="text-xs font-bold text-[#34D399] font-mono">{todayScore}%</span>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      {onOpenNewTask && (
        <button
          onClick={() => {
            onOpenNewTask();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 mb-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-friendly font-semibold shadow-md shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Task</span>
        </button>
      )}

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-friendly font-bold uppercase tracking-wider text-[#64748B]">
          Workspaces
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (currentTab === 'daily-planner' && item.id === 'planner') ||
            (currentTab === 'weekly-planner' && item.id === 'weekly') ||
            (currentTab === 'calendar' && item.id === 'heatmap');
          return (
            <button
              key={item.id}
              onClick={() => handleTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group cursor-pointer ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-500/25 font-bold'
                  : 'text-[#64748B] hover:text-[#7C3AED] hover:bg-[#F3E8FF]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#7C3AED]'
                  }`}
                />
                <span className="font-friendly text-[13px]">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F3E8FF] text-[#7C3AED] group-hover:bg-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Friend Pair Status / Buddy Sync Card */}
      <div className="p-3.5 mt-3 rounded-3xl bg-[#FEF9C3] border-2 border-dashed border-[#FACC15]">
        <div className="flex items-center justify-between mb-1">
          <span className="font-friendly text-xs font-bold text-[#856404] flex items-center gap-1.5">
            👯 Buddy Sync
          </span>
          <span className="text-[10px] font-mono font-bold text-[#856404] bg-[#FACC15]/20 px-1.5 py-0.5 rounded-md">
            {hasFriend ? '2/2 Synced' : 'Single'}
          </span>
        </div>
        <p className="font-friendly text-[11px] text-[#856404] font-medium leading-relaxed">
          {hasFriend
            ? `Syncing live goals with ${friendName || 'partner'}! 🚀`
            : "Your friend hasn't joined yet! Share your code to unlock co-tracking."}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r-2 border-[#172033]/5 h-full shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#172033]/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
