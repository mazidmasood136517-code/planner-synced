import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { DailyPlannerView } from './components/planner/DailyPlannerView';
import { WeeklyPlannerView } from './components/weekly/WeeklyPlannerView';
import { CalendarHeatmapView } from './components/heatmap/CalendarHeatmapView';
import { FriendView } from './components/friend/FriendView';
import { SettingsView } from './components/settings/SettingsView';
import { TaskModal } from './components/tasks/TaskModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { AuthModal } from './components/auth/AuthModal';
import {
  Task,
  PlannerItem,
  WeeklyGoal,
  DailyPlan,
  WeeklyPlan,
  DailyActivity,
  LinkedinGoal,
  Friendship,
  AppNotification,
  FriendAccountabilityStats,
  UserProfile,
} from './types';
import {
  subscribeToUserTasks,
  subscribeToPlannerItems,
  subscribeToWeeklyGoals,
  subscribeToDailyActivities,
  subscribeToNotifications,
  subscribeToFriendships,
  getDailyPlan,
  saveDailyPlan,
  getWeeklyPlan,
  saveWeeklyPlan,
  getLinkedinGoal,
  saveLinkedinGoal,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  createPlannerItem,
  updatePlannerItem,
  deletePlannerItem,
  togglePlannerItemCompletion,
  createWeeklyGoal,
  updateWeeklyGoal,
  deleteWeeklyGoal,
  incrementWeeklyGoal,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendNudgeToFriend,
  getFriendAccountabilityStats,
  updateUserProfile,
  recalculateAndSaveDailyActivity,
  rolloverRecurringTasks,
} from './services/db';
import { calculateProductivityScore, calculateStreak } from './services/productivity';
import { format, startOfWeek } from 'date-fns';
import confetti from 'canvas-confetti';

function AppContent() {
  const { user, isDemoMode, logout, switchDemoUser } = useAuth();

  // Navigation
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'tasks' | 'planner' | 'weekly' | 'heatmap' | 'friend' | 'settings'
  >('dashboard');

  // Dates
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );

  // Firestore Real-Time Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [linkedinGoal, setLinkedinGoal] = useState<LinkedinGoal | null>(null);
  const [friendStats, setFriendStats] = useState<FriendAccountabilityStats | null>(null);

  // Modals & Drawers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch / Sync Friend Stats
  const refreshFriendStats = useCallback(async () => {
    if (!user) return;
    try {
      const stats = await getFriendAccountabilityStats(user.id);
      setFriendStats(stats);
    } catch (err) {
      console.error('Error fetching friend stats:', err);
    }
  }, [user]);

  // Roll over recurring tasks (reset completed + advance dueDate) once per app load
  useEffect(() => {
    if (!user) return;
    rolloverRecurringTasks(user.id);
  }, [user]);

  // Real-Time Subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubTasks = subscribeToUserTasks(user.id, (data) => setTasks(data));
    const unsubPlanner = subscribeToPlannerItems(user.id, selectedDate, (data) =>
      setPlannerItems(data)
    );
    const unsubWeekly = subscribeToWeeklyGoals(user.id, selectedWeekStart, (data) =>
      setWeeklyGoals(data)
    );
    const unsubActivities = subscribeToDailyActivities(user.id, (data) =>
      setDailyActivities(data)
    );
    const unsubNotifs = subscribeToNotifications(user.id, (data) =>
      setNotifications(data)
    );
    const unsubFriendships = subscribeToFriendships(user.id, (data) => {
      setFriendships(data);
      refreshFriendStats();
    });

    return () => {
      unsubTasks();
      unsubPlanner();
      unsubWeekly();
      unsubActivities();
      unsubNotifs();
      unsubFriendships();
    };
  }, [user, selectedDate, selectedWeekStart, refreshFriendStats]);

  // Load Daily & Weekly Single Documents
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function loadPlans() {
      try {
        const [dPlan, wPlan, lGoal] = await Promise.all([
          getDailyPlan(user!.id, selectedDate),
          getWeeklyPlan(user!.id, selectedWeekStart),
          getLinkedinGoal(user!.id, selectedWeekStart),
        ]);
        if (mounted) {
          setDailyPlan(dPlan);
          setWeeklyPlan(wPlan);
          setLinkedinGoal(lGoal);
        }
      } catch (err) {
        console.error('Error loading plans:', err);
      }
    }

    loadPlans();
    return () => {
      mounted = false;
    };
  }, [user, selectedDate, selectedWeekStart]);

  // Calculate Today's Stats & Streaks
  const todayTasks = tasks.filter((t) => t.dueDate === selectedDate);
  const todayPlanner = plannerItems.filter((i) => i.date === selectedDate);
  const currentStreak = calculateStreak(dailyActivities);

  const todayScore = calculateProductivityScore({
    totalTasks: todayTasks.length,
    completedTasks: todayTasks.filter((t) => t.completed).length,
    totalPlannerBlocks: todayPlanner.length,
    completedPlannerBlocks: todayPlanner.filter((i) => i.completed).length,
    weeklyGoalRate:
      weeklyGoals.length > 0
        ? (weeklyGoals.filter((g) => g.completed || g.currentValue >= g.targetValue).length /
            weeklyGoals.length) *
          100
        : 0,
    hasLinkedinActivity: (linkedinGoal?.completedPosts ?? 0) > 0,
  });

  // Task Actions
  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    await createTask(taskData);
    await recalculateAndSaveDailyActivity(user.id, taskData.dueDate);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    await updateTask(taskId, updates);
    if (updates.dueDate) {
      await recalculateAndSaveDailyActivity(user.id, updates.dueDate);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    await deleteTask(taskId);
    await recalculateAndSaveDailyActivity(user.id, selectedDate);
  };

  const handleToggleTask = async (task: Task) => {
    if (!user) return;
    await toggleTaskCompletion(task);
    await recalculateAndSaveDailyActivity(user.id, task.dueDate);

    if (!task.completed) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  // Planner Actions
  const handleCreatePlannerItem = async (
    itemData: Omit<PlannerItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;
    await createPlannerItem(itemData);
    await recalculateAndSaveDailyActivity(user.id, itemData.date);
  };

  const handleUpdatePlannerItem = async (itemId: string, updates: Partial<PlannerItem>) => {
    if (!user) return;
    await updatePlannerItem(itemId, updates);
    await recalculateAndSaveDailyActivity(user.id, selectedDate);
  };

  const handleDeletePlannerItem = async (itemId: string) => {
    if (!user) return;
    await deletePlannerItem(itemId);
    await recalculateAndSaveDailyActivity(user.id, selectedDate);
  };

  const handleTogglePlannerItem = async (item: PlannerItem) => {
    if (!user) return;
    await togglePlannerItemCompletion(item);
    await recalculateAndSaveDailyActivity(user.id, item.date);
  };

  const handleSaveDailyPlan = async (focus: string, notes?: string) => {
    if (!user) return;
    await saveDailyPlan(user.id, selectedDate, focus, notes);
    setDailyPlan({
      id: `${user.id}_${selectedDate}`,
      userId: user.id,
      date: selectedDate,
      focus,
      notes,
      updatedAt: Date.now(),
    });
  };

  // Weekly Goal Actions
  const handleCreateWeeklyGoal = async (
    goalData: Omit<WeeklyGoal, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;
    await createWeeklyGoal(goalData);
    await recalculateAndSaveDailyActivity(user.id, selectedDate);
  };

  const handleUpdateWeeklyGoal = async (goalId: string, updates: Partial<WeeklyGoal>) => {
    if (!user) return;
    await updateWeeklyGoal(goalId, updates);
    await recalculateAndSaveDailyActivity(user.id, selectedDate);
  };

  const handleDeleteWeeklyGoal = async (goalId: string) => {
    if (!user) return;
    await deleteWeeklyGoal(goalId);
    await recalculateAndSaveDailyActivity(user.id, selectedDate);
  };

  const handleIncrementGoal = async (goalId: string, amount: number) => {
    if (!user) return;
    await incrementWeeklyGoal(goalId, amount);
    await recalculateAndSaveDailyActivity(user.id, selectedDate);
  };

  const handleSaveWeeklyPlan = async (mainFocus: string, notes?: string, reflection?: string) => {
    if (!user) return;
    await saveWeeklyPlan(user.id, selectedWeekStart, mainFocus, notes, reflection);
    setWeeklyPlan({
      id: `${user.id}_${selectedWeekStart}`,
      userId: user.id,
      weekStart: selectedWeekStart,
      mainFocus,
      notes,
      reflection,
      updatedAt: Date.now(),
    });
  };

  const handleSaveLinkedinGoal = async (goal: LinkedinGoal) => {
    if (!user) return;
    await saveLinkedinGoal(goal);
    setLinkedinGoal(goal);
    await recalculateAndSaveDailyActivity(user.id, selectedDate);
  };

  // Nudge Action
  const handleSendNudge = async (type: 'nudge' | 'cheer' | 'fire' | 'focus') => {
    if (!user || !friendStats?.friend) return;
    await sendNudgeToFriend(user, friendStats.friend.id, type);
  };

  // Notification Actions
  const handleMarkNotifRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllNotifsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
  };

  // Profile Update
  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await updateUserProfile(user.id, updates);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <AuthModal isOpen={true} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-zinc-950">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onOpenNewTask={() => {
          setIsTaskModalOpen(true);
          setIsMobileMenuOpen(false);
        }}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        streakCount={currentStreak}
        todayScore={todayScore}
        friendName={friendStats?.friendName}
        hasFriend={Boolean(friendStats?.hasFriend)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header
          user={user}
          isDemoMode={isDemoMode}
          unreadCount={unreadNotifCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSwitchDemoUser={switchDemoUser}
          onLogout={logout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              user={user}
              tasks={tasks}
              plannerItems={plannerItems}
              weeklyGoals={weeklyGoals}
              activities={dailyActivities}
              dailyPlan={dailyPlan}
              friendStats={friendStats}
              streakCount={currentStreak}
              onNavigate={setCurrentTab}
              onToggleTask={handleToggleTask}
              onTogglePlannerItem={handleTogglePlannerItem}
              onIncrementGoal={handleIncrementGoal}
              onSendNudge={handleSendNudge}
              onOpenNewTask={() => setIsTaskModalOpen(true)}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              userId={user.id}
              tasks={tasks}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
            />
          )}

          {currentTab === 'planner' && (
            <DailyPlannerView
              userId={user.id}
              dailyPlan={dailyPlan}
              plannerItems={plannerItems}
              tasks={tasks}
              currentDate={selectedDate}
              onDateChange={setSelectedDate}
              onSaveDailyPlan={handleSaveDailyPlan}
              onCreateItem={handleCreatePlannerItem}
              onUpdateItem={handleUpdatePlannerItem}
              onDeleteItem={handleDeletePlannerItem}
              onToggleItem={handleTogglePlannerItem}
              onCreateTask={handleCreateTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {currentTab === 'weekly' && (
            <WeeklyPlannerView
              userId={user.id}
              weeklyPlan={weeklyPlan}
              weeklyGoals={weeklyGoals}
              linkedinGoal={linkedinGoal}
              currentWeekStart={selectedWeekStart}
              onWeekChange={setSelectedWeekStart}
              onSaveWeeklyPlan={handleSaveWeeklyPlan}
              onCreateGoal={handleCreateWeeklyGoal}
              onUpdateGoal={handleUpdateWeeklyGoal}
              onDeleteGoal={handleDeleteWeeklyGoal}
              onIncrementGoal={handleIncrementGoal}
              onSaveLinkedinGoal={handleSaveLinkedinGoal}
            />
          )}

          {currentTab === 'heatmap' && (
            <CalendarHeatmapView
              activities={dailyActivities}
              tasks={tasks}
              plannerItems={plannerItems}
              streakCount={currentStreak}
              currentUserId={user.id}
              onRefresh={refreshFriendStats}
            />
          )}

          {currentTab === 'friend' && (
            <FriendView
              currentUser={user}
              friendStats={friendStats}
              allFriendships={friendships}
              onRefresh={refreshFriendStats}
              onSwitchDemoUser={switchDemoUser}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView user={user} onUpdateProfile={handleUpdateProfile} />
          )}
        </main>
      </div>

      {/* Quick Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleCreateTask}
        userId={user.id}
        defaultDate={selectedDate}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotifRead}
        onMarkAllAsRead={handleMarkAllNotifsRead}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

