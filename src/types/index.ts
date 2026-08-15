export type TaskCategory = 
  | 'DSA' 
  | 'Development' 
  | 'College' 
  | 'Project' 
  | 'GitHub' 
  | 'LinkedIn' 
  | 'Personal' 
  | 'Other';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export type RecurrenceRule = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  timezone: string;
  inviteCode: string;
  bio?: string;
  githubUsername?: string;
  githubConnected?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Friendship {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterUsername: string;
  receiverUsername: string;
  requesterName: string;
  receiverName: string;
  requesterAvatar: string;
  receiverAvatar: string;
  status: FriendshipStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string | null; // HH:mm
  completed: boolean;
  completedAt?: number;
  recurring: boolean;
  recurrenceRule?: RecurrenceRule;
  estimatedMinutes?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  focus: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlannerItem {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: TaskCategory;
  taskId?: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  mainFocus: string;
  notes?: string;
  reflection?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WeeklyGoal {
  id: string;
  userId: string;
  weeklyPlanId?: string;
  weekStart: string; // YYYY-MM-DD
  title: string;
  category: TaskCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DailyActivity {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  tasksCompleted: number;
  totalTasks: number;
  goalsCompleted: number;
  totalGoals: number;
  plannerItemsCompleted: number;
  totalPlannerItems: number;
  githubCommits: number;
  productivityScore: number; // 0 to 100
  updatedAt: number;
}

export interface GithubConnection {
  id: string;
  userId: string;
  githubUsername: string;
  connectionStatus: 'connected' | 'disconnected' | 'pending';
  lastSyncAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface LinkedinGoal {
  id: string;
  userId: string;
  weekStart: string; // YYYY-MM-DD
  targetPosts: number;
  completedPosts: number;
  status: 'planned' | 'drafted' | 'published';
  topic?: string;
  notes?: string;
  updatedAt: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 
    | 'github_reminder' 
    | 'planner_reminder' 
    | 'weekly_reminder' 
    | 'linkedin_reminder' 
    | 'nudge' 
    | 'friend_request' 
    | 'cheer' 
    | 'achievement';
  title: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  read: boolean;
  scheduledFor?: number;
  createdAt: number;
}

export interface Nudge {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  type: 'nudge' | 'cheer' | 'fire' | 'focus';
  message: string;
  createdAt: number;
}

export interface FriendAccountabilityStats {
  friend: UserProfile;
  friendshipId: string;
  friendshipStatus: FriendshipStatus;
  todayScore: number;
  todayTasksCompleted: number;
  todayTasksTotal: number;
  weeklyGoalCompletionRate: number;
  weeklyGoalsCount: number;
  weeklyGoalsCompleted: number;
  currentStreak: number;
  recentActivity: DailyActivity[];
  recentGoals: WeeklyGoal[];
  githubUsername?: string;
  linkedinWeeklyProgress?: {
    target: number;
    completed: number;
    status: string;
  };
}

export type ViewTab = 
  | 'dashboard' 
  | 'tasks' 
  | 'daily-planner' 
  | 'weekly-planner' 
  | 'calendar' 
  | 'friend' 
  | 'settings';
