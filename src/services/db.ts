import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  UserProfile,
  Friendship,
  Task,
  DailyPlan,
  PlannerItem,
  WeeklyPlan,
  WeeklyGoal,
  DailyActivity,
  LinkedinGoal,
  AppNotification,
  Nudge,
  FriendAccountabilityStats,
  TaskCategory,
  TaskPriority,
} from '../types';
import { format, startOfWeek, endOfWeek, subDays, addDays, addWeeks, addMonths, isBefore, isWeekend, parseISO } from 'date-fns';
import { calculateDailyProductivityScore, calculateStreak, calculateWeeklyGoalStats } from './productivity';

// ================= USER PROFILES =================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    return null;
  }
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  const docRef = doc(db, 'users', user.id);
  await setDoc(docRef, {
    ...user,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function findUserByUsernameOrCode(identifier: string): Promise<UserProfile | null> {
  const clean = identifier.trim();
  if (!clean) return null;
  const cleanLower = clean.toLowerCase();
  const cleanUpper = clean.toUpperCase();
  
  const usersRef = collection(db, 'users');

  try {
    // 1. Try exact invite code (case-insensitive checks)
    const qCodeUpper = query(usersRef, where('inviteCode', '==', cleanUpper), limit(1));
    const snapCodeUpper = await getDocs(qCodeUpper);
    if (!snapCodeUpper.empty) {
      return snapCodeUpper.docs[0].data() as UserProfile;
    }

    const qCode = query(usersRef, where('inviteCode', '==', clean), limit(1));
    const snapCode = await getDocs(qCode);
    if (!snapCode.empty) {
      return snapCode.docs[0].data() as UserProfile;
    }

    // 2. Try by username
    const qUsername = query(usersRef, where('username', '==', cleanLower), limit(1));
    const snapUsername = await getDocs(qUsername);
    if (!snapUsername.empty) {
      return snapUsername.docs[0].data() as UserProfile;
    }

    // 3. Try by email
    const qEmail = query(usersRef, where('email', '==', cleanLower), limit(1));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      return snapEmail.docs[0].data() as UserProfile;
    }

    // 4. Fallback scan across all users for partial or casing matches
    const allUsersSnap = await getDocs(query(usersRef, limit(100)));
    for (const d of allUsersSnap.docs) {
      const u = d.data() as UserProfile;
      if (
        (u.inviteCode && u.inviteCode.toUpperCase() === cleanUpper) ||
        (u.username && u.username.toLowerCase() === cleanLower) ||
        (u.email && u.email.toLowerCase() === cleanLower)
      ) {
        return u;
      }
    }
  } catch (err) {
    console.error('Error finding user:', err);
  }

  return null;
}

// ================= FRIENDSHIPS =================

export async function getFriendshipsForUser(userId: string): Promise<Friendship[]> {
  try {
    const friendshipsRef = collection(db, 'friendships');
    
    // Requester query
    const q1 = query(friendshipsRef, where('requesterId', '==', userId));
    const snap1 = await getDocs(q1);

    // Receiver query
    const q2 = query(friendshipsRef, where('receiverId', '==', userId));
    const snap2 = await getDocs(q2);

    const list: Friendship[] = [];
    const seen = new Set<string>();

    snap1.forEach((d) => {
      seen.add(d.id);
      list.push({ id: d.id, ...d.data() } as Friendship);
    });

    snap2.forEach((d) => {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        list.push({ id: d.id, ...d.data() } as Friendship);
      }
    });

    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('Error fetching friendships:', err);
    return [];
  }
}

export async function sendFriendRequest(
  requester: UserProfile, 
  receiver: UserProfile,
  autoAccept: boolean = false
): Promise<{ success: boolean; message: string; friendship?: Friendship }> {
  if (requester.id === receiver.id) {
    return { success: false, message: 'You cannot send a friend request to yourself.' };
  }

  // Check if friendship already exists
  const existing = await getFriendshipsForUser(requester.id);
  const found = existing.find(
    (f) =>
      (f.requesterId === requester.id && f.receiverId === receiver.id) ||
      (f.requesterId === receiver.id && f.receiverId === requester.id)
  );

  if (found) {
    if (found.status === 'accepted') {
      return { success: true, message: `You are already accountability partners with ${receiver.name}!`, friendship: found };
    }
    if (autoAccept) {
      await updateDoc(doc(db, 'friendships', found.id), {
        status: 'accepted',
        updatedAt: Date.now(),
      });
      return { success: true, message: `Successfully linked with ${receiver.name} as accountability partners! 🎉`, friendship: { ...found, status: 'accepted' } };
    }
    if (found.status === 'pending') {
      if (found.receiverId === requester.id) {
        // Automatically accept if there was a pending request from them
        await updateDoc(doc(db, 'friendships', found.id), {
          status: 'accepted',
          updatedAt: Date.now(),
        });
        return { success: true, message: `Accepted friend request! You and ${receiver.name} are now accountability partners! 🎉`, friendship: { ...found, status: 'accepted' } };
      }
      return { success: false, message: 'A pending friend request is already awaiting response.' };
    }
  }

  const friendshipId = `friend_${[requester.id, receiver.id].sort().join('_')}`;
  const friendshipDoc: Friendship = {
    id: friendshipId,
    requesterId: requester.id,
    receiverId: receiver.id,
    requesterUsername: requester.username,
    receiverUsername: receiver.username,
    requesterName: requester.name,
    receiverName: receiver.name,
    requesterAvatar: requester.avatarUrl,
    receiverAvatar: receiver.avatarUrl,
    status: autoAccept ? 'accepted' : 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, 'friendships', friendshipId), friendshipDoc);

  // Send in-app notification to receiver
  await createNotification({
    userId: receiver.id,
    type: 'friend_request',
    title: autoAccept ? 'New Accountability Partner!' : 'New Accountability Request',
    message: autoAccept
      ? `${requester.name} (@${requester.username}) connected with your invite code! You are now accountability partners! 🔥`
      : `${requester.name} (@${requester.username}) sent you an accountability partner request!`,
    fromUserId: requester.id,
    fromUserName: requester.name,
  });

  return {
    success: true,
    message: autoAccept
      ? `Successfully linked with ${receiver.name}! You are now accountability partners! 🎉`
      : `Friend request sent to @${receiver.username}!`,
    friendship: friendshipDoc,
  };
}

export async function respondToFriendRequest(
  friendshipId: string, 
  accept: boolean, 
  currentUserId: string
): Promise<void> {
  const ref = doc(db, 'friendships', friendshipId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const f = snap.data() as Friendship;

  const newStatus = accept ? 'accepted' : 'rejected';
  await updateDoc(ref, {
    status: newStatus,
    updatedAt: Date.now(),
  });

  // Notify requester if accepted
  if (accept && f.receiverId === currentUserId) {
    await createNotification({
      userId: f.requesterId,
      type: 'achievement',
      title: 'Accountability Request Accepted! 🎉',
      message: `${f.receiverName} accepted your request. You are now accountability partners!`,
      fromUserId: currentUserId,
      fromUserName: f.receiverName,
    });
  }
}

export async function getFriendAccountabilityStats(
  friendIdOrUserId: string, 
  currentUserIdParam?: string,
  friendshipParam?: Friendship
): Promise<FriendAccountabilityStats | null> {
  try {
    let targetFriendId = friendIdOrUserId;
    let actualFriendship = friendshipParam;

    // If called with single userId, find the active friendship
    if (!currentUserIdParam || !friendshipParam) {
      const friendships = await getFriendshipsForUser(friendIdOrUserId);
      const accepted = friendships.find((f) => f.status === 'accepted');
      if (!accepted) return null;
      actualFriendship = accepted;
      targetFriendId = accepted.requesterId === friendIdOrUserId ? accepted.receiverId : accepted.requesterId;
    }

    const friendProfile = await getUserProfile(targetFriendId);
    if (!friendProfile || !actualFriendship) return null;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Fetch friend's daily activity for heatmap & score
    const activitiesRef = collection(db, 'dailyActivity');
    const qAct = query(activitiesRef, where('userId', '==', targetFriendId), limit(90));
    const snapAct = await getDocs(qAct);
    const recentActivity: DailyActivity[] = [];
    snapAct.forEach((d) => recentActivity.push(d.data() as DailyActivity));

    const todayAct = recentActivity.find((a) => a.date === todayStr);

    // Fetch friend's weekly goals
    const goalsRef = collection(db, 'weeklyGoals');
    const qGoals = query(goalsRef, where('userId', '==', targetFriendId), where('weekStart', '==', weekStartStr));
    const snapGoals = await getDocs(qGoals);
    const recentGoals: WeeklyGoal[] = [];
    snapGoals.forEach((d) => recentGoals.push(d.data() as WeeklyGoal));

    // Calculate stats
    const goalStats = calculateWeeklyGoalStats(recentGoals);
    const currentStreak = calculateStreak(recentActivity);

    // LinkedIn goal
    const linkedinRef = doc(db, 'linkedinGoals', `${targetFriendId}_${weekStartStr}`);
    const snapLinkedin = await getDoc(linkedinRef);
    let linkedinWeeklyProgress;
    if (snapLinkedin.exists()) {
      const data = snapLinkedin.data() as LinkedinGoal;
      linkedinWeeklyProgress = {
        target: data.targetPosts || 1,
        completed: data.completedPosts || 0,
        status: data.status || 'planned',
      };
    }

    return {
      friend: friendProfile,
      friendshipId: actualFriendship.id,
      friendshipStatus: actualFriendship.status,
      todayScore: todayAct?.productivityScore ?? 0,
      todayTasksCompleted: todayAct?.tasksCompleted ?? 0,
      todayTasksTotal: todayAct?.totalTasks ?? 0,
      weeklyGoalCompletionRate: goalStats.percentage,
      weeklyGoalsCount: goalStats.total,
      weeklyGoalsCompleted: goalStats.completed,
      currentStreak,
      recentActivity,
      recentGoals,
      githubUsername: friendProfile.githubUsername,
      linkedinWeeklyProgress,
    };
  } catch (err) {
    console.error('Error fetching friend stats:', err);
    return null;
  }
}

// ================= REAL-TIME LISTENERS =================

export function subscribeToFriendships(userId: string, callback: (friendships: Friendship[]) => void): () => void {
  const friendshipsRef = collection(db, 'friendships');
  const q = query(friendshipsRef);
  return onSnapshot(q, (snapshot) => {
    const list: Friendship[] = [];
    const seen = new Set<string>();
    snapshot.forEach((d) => {
      const data = d.data() as Friendship;
      if (data.requesterId === userId || data.receiverId === userId) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          list.push({ id: d.id, ...data });
        }
      }
    });
    callback(list.sort((a, b) => b.updatedAt - a.updatedAt));
  }, (err) => {
    console.error('Error subscribing to friendships:', err);
  });
}

export function subscribeToUserTasks(userId: string, callback: (tasks: Task[]) => void): () => void {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const list: Task[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Task));
    callback(list.sort((a, b) => b.createdAt - a.createdAt));
  }, (err) => {
    console.error('Error subscribing to tasks:', err);
  });
}

export function subscribeToPlannerItems(userId: string, date: string, callback: (items: PlannerItem[]) => void): () => void {
  const ref = collection(db, 'plannerItems');
  const q = query(ref, where('userId', '==', userId), where('date', '==', date));
  return onSnapshot(q, (snapshot) => {
    const list: PlannerItem[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as PlannerItem));
    callback(list.sort((a, b) => a.startTime.localeCompare(b.startTime)));
  }, (err) => {
    console.error('Error subscribing to planner items:', err);
  });
}

export function subscribeToWeeklyGoals(userId: string, weekStart: string, callback: (goals: WeeklyGoal[]) => void): () => void {
  const ref = collection(db, 'weeklyGoals');
  const q = query(ref, where('userId', '==', userId), where('weekStart', '==', weekStart));
  return onSnapshot(q, (snapshot) => {
    const list: WeeklyGoal[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as WeeklyGoal));
    callback(list.sort((a, b) => a.createdAt - b.createdAt));
  }, (err) => {
    console.error('Error subscribing to weekly goals:', err);
  });
}

export function subscribeToDailyActivities(userId: string, callback: (activities: DailyActivity[]) => void): () => void {
  const ref = collection(db, 'dailyActivity');
  const q = query(ref, where('userId', '==', userId), limit(365));
  return onSnapshot(q, (snapshot) => {
    const list: DailyActivity[] = [];
    snapshot.forEach((d) => list.push(d.data() as DailyActivity));
    callback(list.sort((a, b) => a.date.localeCompare(b.date)));
  }, (err) => {
    console.error('Error subscribing to daily activities:', err);
  });
}

export function subscribeToNotifications(userId: string, callback: (notifications: AppNotification[]) => void): () => void {
  const ref = collection(db, 'notifications');
  const q = query(ref, where('userId', '==', userId), limit(30));
  return onSnapshot(q, (snapshot) => {
    const list: AppNotification[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as AppNotification));
    callback(list.sort((a, b) => b.createdAt - a.createdAt));
  }, (err) => {
    console.error('Error subscribing to notifications:', err);
  });
}

// ================= TASKS CRUD =================

export async function getTasksForUser(userId: string): Promise<Task[]> {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: Task[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Task));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error in getTasksForUser:', err);
    return [];
  }
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const newTask: Task = {
    ...task,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'tasks', id), newTask);
  await recalculateAndSaveDailyActivity(task.userId, task.dueDate);
  return newTask;
}

export async function updateTask(taskId: string, updates: Partial<Task>, userId?: string): Promise<void> {
  const ref = doc(db, 'tasks', taskId);
  const now = Date.now();
  await updateDoc(ref, {
    ...updates,
    updatedAt: now,
  });

  const snap = await getDoc(ref);
  if (snap.exists()) {
    const task = snap.data() as Task;
    const uid = userId || task.userId;
    await recalculateAndSaveDailyActivity(uid, task.dueDate);
  }
}

export async function deleteTask(taskOrId: string | Task, userId?: string, dueDate?: string): Promise<void> {
  const taskId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  const uid = typeof taskOrId === 'string' ? userId : taskOrId.userId;
  const date = typeof taskOrId === 'string' ? dueDate : taskOrId.dueDate;
  
  await deleteDoc(doc(db, 'tasks', taskId));
  if (uid && date) {
    await recalculateAndSaveDailyActivity(uid, date);
  }
}

export async function toggleTaskCompleted(taskId: string, completed: boolean, userId?: string): Promise<void> {
  const ref = doc(db, 'tasks', taskId);
  const now = Date.now();
  await updateDoc(ref, {
    completed,
    completedAt: completed ? now : null,
    updatedAt: now,
  });

  const snap = await getDoc(ref);
  if (snap.exists()) {
    const task = snap.data() as Task;
    const uid = userId || task.userId;
    await recalculateAndSaveDailyActivity(uid, task.dueDate);
  }
}

export async function toggleTaskCompletion(taskOrId: Task | string): Promise<void> {
  if (typeof taskOrId === 'string') {
    const snap = await getDoc(doc(db, 'tasks', taskOrId));
    if (snap.exists()) {
      const task = snap.data() as Task;
      await toggleTaskCompleted(taskOrId, !task.completed, task.userId);
    }
  } else {
    await toggleTaskCompleted(taskOrId.id, !taskOrId.completed, taskOrId.userId);
  }
}

// ================= RECURRING TASK ROLLOVER =================

/**
 * Finds recurring tasks whose dueDate has passed and rolls them forward
 * to the correct next occurrence, resetting completed to false.
 * Safe to call every time the app loads - tasks that are already
 * up to date are left untouched.
 */
export async function rolloverRecurringTasks(userId: string): Promise<void> {
  try {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('userId', '==', userId), where('recurring', '==', true));
    const snap = await getDocs(q);

    const updates: Promise<void>[] = [];

    snap.forEach((docSnap) => {
      const task = docSnap.data() as Task;
      if (!task.dueDate || task.dueDate >= todayStr) return; // already current or no date

      let nextDate = parseISO(task.dueDate);
      const today = parseISO(todayStr);

      switch (task.recurrenceRule) {
        case 'weekly':
          while (isBefore(nextDate, today)) {
            nextDate = addWeeks(nextDate, 1);
          }
          break;
        case 'monthly':
          while (isBefore(nextDate, today)) {
            nextDate = addMonths(nextDate, 1);
          }
          break;
        case 'weekdays': {
          nextDate = today;
          while (isWeekend(nextDate)) {
            nextDate = addDays(nextDate, 1);
          }
          break;
        }
        case 'daily':
        default:
          nextDate = today;
          break;
      }

      const newDueDate = format(nextDate, 'yyyy-MM-dd');
      if (newDueDate !== task.dueDate) {
        updates.push(
          updateDoc(doc(db, 'tasks', docSnap.id), {
            dueDate: newDueDate,
            completed: false,
            completedAt: null,
            updatedAt: Date.now(),
          })
        );
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  } catch (err) {
    console.error('Error rolling over recurring tasks:', err);
  }
}

// ================= DAILY PLANNER =================

export async function getDailyPlan(userId: string, date: string): Promise<DailyPlan | null> {
  try {
    const planId = `${userId}_${date}`;
    const snap = await getDoc(doc(db, 'dailyPlans', planId));
    if (snap.exists()) {
      return snap.data() as DailyPlan;
    }
    return null;
  } catch (err) {
    console.error('Error in getDailyPlan:', err);
    return null;
  }
}

export async function saveDailyPlan(userId: string, date: string, focus: string, notes?: string): Promise<DailyPlan> {
  const planId = `${userId}_${date}`;
  const now = Date.now();
  const plan: DailyPlan = {
    id: planId,
    userId,
    date,
    focus,
    notes: notes || '',
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'dailyPlans', planId), plan, { merge: true });
  return plan;
}

export async function getPlannerItemsForDate(userId: string, date: string): Promise<PlannerItem[]> {
  try {
    const ref = collection(db, 'plannerItems');
    const q = query(ref, where('userId', '==', userId), where('date', '==', date));
    const snap = await getDocs(q);
    const items: PlannerItem[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() } as PlannerItem));
    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  } catch (err) {
    console.error('Error in getPlannerItemsForDate:', err);
    return [];
  }
}

export async function createPlannerItem(item: Omit<PlannerItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlannerItem> {
  const id = `planitem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const newItem: PlannerItem = {
    ...item,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'plannerItems', id), newItem);
  await recalculateAndSaveDailyActivity(item.userId, item.date);
  return newItem;
}

export async function updatePlannerItem(itemId: string, updates: Partial<PlannerItem>, userId?: string, date?: string): Promise<void> {
  const ref = doc(db, 'plannerItems', itemId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: Date.now(),
  });
  
  if (userId && date) {
    await recalculateAndSaveDailyActivity(userId, date);
  } else {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const item = snap.data() as PlannerItem;
      await recalculateAndSaveDailyActivity(item.userId, item.date);
    }
  }
}

export async function deletePlannerItem(itemOrId: string | PlannerItem, userId?: string, date?: string): Promise<void> {
  const itemId = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
  const uid = typeof itemOrId === 'string' ? userId : itemOrId.userId;
  const itemDate = typeof itemOrId === 'string' ? date : itemOrId.date;

  await deleteDoc(doc(db, 'plannerItems', itemId));
  if (uid && itemDate) {
    await recalculateAndSaveDailyActivity(uid, itemDate);
  }
}

export async function togglePlannerItemCompleted(itemId: string, completed: boolean, userId?: string, date?: string): Promise<void> {
  const ref = doc(db, 'plannerItems', itemId);
  await updateDoc(ref, {
    completed,
    updatedAt: Date.now(),
  });
  if (userId && date) {
    await recalculateAndSaveDailyActivity(userId, date);
  } else {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const item = snap.data() as PlannerItem;
      await recalculateAndSaveDailyActivity(item.userId, item.date);
    }
  }
}

export async function togglePlannerItemCompletion(itemOrId: PlannerItem | string): Promise<void> {
  if (typeof itemOrId === 'string') {
    const snap = await getDoc(doc(db, 'plannerItems', itemOrId));
    if (snap.exists()) {
      const item = snap.data() as PlannerItem;
      await togglePlannerItemCompleted(itemOrId, !item.completed, item.userId, item.date);
    }
  } else {
    await togglePlannerItemCompleted(itemOrId.id, !itemOrId.completed, itemOrId.userId, itemOrId.date);
  }
}

// ================= WEEKLY PLANNER & GOALS =================

export async function getWeeklyPlan(userId: string, weekStart: string): Promise<WeeklyPlan | null> {
  try {
    const planId = `${userId}_${weekStart}`;
    const snap = await getDoc(doc(db, 'weeklyPlans', planId));
    if (snap.exists()) {
      return snap.data() as WeeklyPlan;
    }
    return null;
  } catch (err) {
    console.error('Error in getWeeklyPlan:', err);
    return null;
  }
}

export async function saveWeeklyPlan(
  userId: string, 
  weekStart: string, 
  weekEnd: string, 
  mainFocus: string, 
  notes?: string,
  reflection?: string
): Promise<WeeklyPlan> {
  const planId = `${userId}_${weekStart}`;
  const now = Date.now();
  const plan: WeeklyPlan = {
    id: planId,
    userId,
    weekStart,
    weekEnd,
    mainFocus,
    notes: notes || '',
    reflection: reflection || '',
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'weeklyPlans', planId), plan, { merge: true });
  return plan;
}

export async function getWeeklyGoals(userId: string, weekStart: string): Promise<WeeklyGoal[]> {
  try {
    const ref = collection(db, 'weeklyGoals');
    const q = query(ref, where('userId', '==', userId), where('weekStart', '==', weekStart));
    const snap = await getDocs(q);
    const goals: WeeklyGoal[] = [];
    snap.forEach((d) => goals.push({ id: d.id, ...d.data() } as WeeklyGoal));
    return goals.sort((a, b) => a.createdAt - b.createdAt);
  } catch (err) {
    console.error('Error in getWeeklyGoals:', err);
    return [];
  }
}

export async function createWeeklyGoal(goal: Omit<WeeklyGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyGoal> {
  const id = `wgoal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const newGoal: WeeklyGoal = {
    ...goal,
    id,
    completed: goal.currentValue >= goal.targetValue,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'weeklyGoals', id), newGoal);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  await recalculateAndSaveDailyActivity(goal.userId, todayStr);
  return newGoal;
}

export async function updateWeeklyGoal(goalId: string, updates: Partial<WeeklyGoal>, userId?: string): Promise<void> {
  const ref = doc(db, 'weeklyGoals', goalId);
  const completed = updates.currentValue !== undefined && updates.targetValue !== undefined
    ? updates.currentValue >= updates.targetValue
    : updates.completed;

  await updateDoc(ref, {
    ...updates,
    ...(completed !== undefined ? { completed } : {}),
    updatedAt: Date.now(),
  });
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const goal = snap.data() as WeeklyGoal;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await recalculateAndSaveDailyActivity(userId || goal.userId, todayStr);
  }
}

export async function deleteWeeklyGoal(goalId: string, userId?: string): Promise<void> {
  const ref = doc(db, 'weeklyGoals', goalId);
  let uid = userId;
  if (!uid) {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      uid = (snap.data() as WeeklyGoal).userId;
    }
  }
  await deleteDoc(ref);
  if (uid) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await recalculateAndSaveDailyActivity(uid, todayStr);
  }
}

export async function incrementWeeklyGoalProgress(goalId: string, amount: number = 1, userId?: string): Promise<void> {
  const ref = doc(db, 'weeklyGoals', goalId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const goal = snap.data() as WeeklyGoal;
  const newCurrent = Math.max(0, goal.currentValue + amount);
  const completed = newCurrent >= goal.targetValue;
  await updateDoc(ref, {
    currentValue: newCurrent,
    completed,
    updatedAt: Date.now(),
  });
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  await recalculateAndSaveDailyActivity(userId || goal.userId, todayStr);
}

export const incrementWeeklyGoal = incrementWeeklyGoalProgress;

// ================= LINKEDIN ACCOUNTABILITY =================

export async function getLinkedinGoal(userId: string, weekStart: string): Promise<LinkedinGoal | null> {
  try {
    const docId = `${userId}_${weekStart}`;
    const snap = await getDoc(doc(db, 'linkedinGoals', docId));
    if (snap.exists()) {
      return snap.data() as LinkedinGoal;
    }
    return null;
  } catch (err) {
    console.error('Error in getLinkedinGoal:', err);
    return null;
  }
}

export async function saveLinkedinGoal(goal: Partial<LinkedinGoal> & { userId: string; weekStart: string }): Promise<void> {
  const docId = `${goal.userId}_${goal.weekStart}`;
  const now = Date.now();
  const data: LinkedinGoal = {
    id: goal.id || docId,
    userId: goal.userId,
    weekStart: goal.weekStart,
    targetPosts: goal.targetPosts ?? 1,
    completedPosts: goal.completedPosts ?? 0,
    status: goal.status || 'planned',
    topic: goal.topic || '',
    notes: goal.notes || '',
    updatedAt: now,
  };
  await setDoc(doc(db, 'linkedinGoals', docId), data, { merge: true });
}

// ================= DAILY ACTIVITY & PRODUCTIVITY SCORE =================

export async function getDailyActivities(userId: string, daysLimit = 180): Promise<DailyActivity[]> {
  try {
    const ref = collection(db, 'dailyActivity');
    const q = query(ref, where('userId', '==', userId), limit(daysLimit));
    const snap = await getDocs(q);
    const list: DailyActivity[] = [];
    snap.forEach((d) => list.push(d.data() as DailyActivity));
    return list.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('Error fetching daily activities:', err);
    return [];
  }
}

export async function recalculateAndSaveDailyActivity(userId: string, date: string): Promise<DailyActivity> {
  try {
    // 1. Tasks for this date
    const tasksRef = collection(db, 'tasks');
    const qTasks = query(tasksRef, where('userId', '==', userId), where('dueDate', '==', date));
    const snapTasks = await getDocs(qTasks);
    let tasksCompleted = 0;
    let totalTasks = 0;
    snapTasks.forEach((d) => {
      totalTasks++;
      if ((d.data() as Task).completed) tasksCompleted++;
    });

    // 2. Planner items for this date
    const plannerItems = await getPlannerItemsForDate(userId, date);
    const plannerItemsCompleted = plannerItems.filter((i) => i.completed).length;
    const totalPlannerItems = plannerItems.length;

    // 3. Weekly goals for the week containing this date
    const dateObj = new Date(date + 'T00:00:00');
    const weekStartStr = format(startOfWeek(dateObj, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weeklyGoals = await getWeeklyGoals(userId, weekStartStr);
    const goalsCompleted = weeklyGoals.filter((g) => g.completed || g.currentValue >= g.targetValue).length;
    const totalGoals = weeklyGoals.length;

    // 4. Calculate score
    const productivityScore = calculateDailyProductivityScore({
      tasksCompleted,
      totalTasks,
      goalsCompleted,
      totalGoals,
      plannerItemsCompleted,
      totalPlannerItems,
      githubCommits: 0,
    });

    const activityId = `${userId}_${date}`;
    const activityDoc: DailyActivity = {
      id: activityId,
      userId,
      date,
      tasksCompleted,
      totalTasks,
      goalsCompleted,
      totalGoals,
      plannerItemsCompleted,
      totalPlannerItems,
      githubCommits: 0,
      productivityScore,
      updatedAt: Date.now(),
    };

    await setDoc(doc(db, 'dailyActivity', activityId), activityDoc, { merge: true });
    return activityDoc;
  } catch (err) {
    console.error('Error calculating daily activity:', err);
    return {
      id: `${userId}_${date}`,
      userId,
      date,
      tasksCompleted: 0,
      totalTasks: 0,
      goalsCompleted: 0,
      totalGoals: 0,
      plannerItemsCompleted: 0,
      totalPlannerItems: 0,
      githubCommits: 0,
      productivityScore: 0,
      updatedAt: Date.now(),
    };
  }
}

// ================= NOTIFICATIONS & NUDGES =================

export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const ref = collection(db, 'notifications');
    const q = query(ref, where('userId', '==', userId), limit(20));
    const snap = await getDocs(q);
    const list: AppNotification[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AppNotification));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error in getUserNotifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const ref = doc(db, 'notifications', notificationId);
  await updateDoc(ref, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const ref = collection(db, 'notifications');
    const q = query(ref, where('userId', '==', userId), where('read', '==', false));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
}

export async function createNotification(notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await setDoc(doc(db, 'notifications', id), {
    ...notif,
    id,
    read: false,
    createdAt: Date.now(),
  });
}

export async function sendNudgeToFriend(
  fromUser: UserProfile, 
  toUserId: string, 
  type: 'nudge' | 'cheer' | 'fire' | 'focus',
  customMessage?: string
): Promise<void> {
  const nudgeId = `nudge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const defaultMessages = {
    nudge: `${fromUser.name} sent you a gentle productivity nudge! Keep crushing it! 🔥`,
    cheer: `${fromUser.name} is cheering for you! Great consistency! 👏🎉`,
    fire: `${fromUser.name} sent a streak fire! Stay focused today! ⚡🔥`,
    focus: `${fromUser.name} is in deep work mode. Join the focus session! 🎯`,
  };

  const message = customMessage || defaultMessages[type];

  const nudgeDoc: Nudge = {
    id: nudgeId,
    fromUserId: fromUser.id,
    toUserId,
    fromUserName: fromUser.name,
    fromUserAvatar: fromUser.avatarUrl,
    type,
    message,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, 'nudges', nudgeId), nudgeDoc);

  // Also create a notification for the recipient
  await createNotification({
    userId: toUserId,
    type: type === 'cheer' ? 'cheer' : 'nudge',
    title: type === 'fire' ? 'Streak Fire Received! 🔥' : type === 'cheer' ? 'Accountability Cheer! 🌟' : 'Productivity Nudge ⚡',
    message,
    fromUserId: fromUser.id,
    fromUserName: fromUser.name,
  });
}

// ================= SEED INITIAL DATA =================

export async function seedInitialUserDataIfNew(user: UserProfile): Promise<void> {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('userId', '==', user.id), limit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    // User already has data, no seeding required
    return;
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEndStr = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // 1. Initial Tasks
  const defaultTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      userId: user.id,
      title: 'Solve 2 LeetCode Tree Problems (DSA)',
      description: 'Focus on Lowest Common Ancestor & Binary Tree Maximum Path Sum',
      category: 'DSA',
      priority: 'High',
      dueDate: todayStr,
      dueTime: '10:00',
      completed: true,
      completedAt: Date.now() - 3600000,
      recurring: true,
      recurrenceRule: 'daily',
      estimatedMinutes: 60,
    },
    {
      userId: user.id,
      title: 'Implement Firebase Auth & Firestore Rules',
      description: 'Full-stack production setup with real security rules and test verification',
      category: 'Development',
      priority: 'Critical',
      dueDate: todayStr,
      dueTime: '14:30',
      completed: true,
      completedAt: Date.now() - 1800000,
      recurring: false,
      estimatedMinutes: 90,
    },
    {
      userId: user.id,
      title: 'Review Distributed Systems Lecture 4 (College)',
      description: 'Prepare notes for Raft Consensus Algorithm presentation',
      category: 'College',
      priority: 'Medium',
      dueDate: todayStr,
      dueTime: '18:00',
      completed: false,
      recurring: false,
      estimatedMinutes: 45,
    },
    {
      userId: user.id,
      title: 'Push Clean Commit to Main Branch',
      description: 'Verify all TypeScript types pass cleanly and no unused imports remain',
      category: 'GitHub',
      priority: 'High',
      dueDate: todayStr,
      dueTime: '20:00',
      completed: false,
      recurring: true,
      recurrenceRule: 'daily',
      estimatedMinutes: 20,
    },
    {
      userId: user.id,
      title: 'Draft Weekly Tech Learning Post (LinkedIn)',
      description: 'Write key takeaways about state management and backend architecture',
      category: 'LinkedIn',
      priority: 'Medium',
      dueDate: tomorrowStr,
      dueTime: '12:00',
      completed: false,
      recurring: false,
      estimatedMinutes: 30,
    },
  ];

  for (const t of defaultTasks) {
    await createTask(t);
  }

  // 2. Initial Daily Plan & Planner Items
  await saveDailyPlan(
    user.id,
    todayStr,
    'Master Tree Traversal Algorithms & Finish Backend Auth Security',
    'Morning high-energy block for DSA, afternoon for full-stack development, evening review.'
  );

  const defaultPlannerItems: Omit<PlannerItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      userId: user.id,
      date: todayStr,
      title: 'DSA Deep Work: Binary Trees',
      startTime: '08:30',
      endTime: '10:00',
      category: 'DSA',
      completed: true,
    },
    {
      userId: user.id,
      date: todayStr,
      title: 'College Lecture & Systems Discussion',
      startTime: '10:30',
      endTime: '12:30',
      category: 'College',
      completed: true,
    },
    {
      userId: user.id,
      date: todayStr,
      title: 'Core Development & API Design',
      startTime: '14:00',
      endTime: '16:30',
      category: 'Development',
      completed: false,
    },
    {
      userId: user.id,
      date: todayStr,
      title: 'GitHub Commit & Code Review',
      startTime: '19:30',
      endTime: '20:30',
      category: 'GitHub',
      completed: false,
    },
  ];

  for (const item of defaultPlannerItems) {
    await createPlannerItem(item);
  }

  // 3. Initial Weekly Plan & Goals
  await saveWeeklyPlan(
    user.id,
    weekStartStr,
    weekEndStr,
    'Consistency Across DSA, GitHub Commits, and Project Milestone',
    'Hold daily 5-minute sync with accountability friend.'
  );

  const defaultWeeklyGoals: Omit<WeeklyGoal, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      userId: user.id,
      weekStart: weekStartStr,
      title: 'DSA Practice Problems',
      category: 'DSA',
      targetValue: 15,
      currentValue: 8,
      unit: 'problems',
      completed: false,
    },
    {
      userId: user.id,
      weekStart: weekStartStr,
      title: 'GitHub Meaningful Commits',
      category: 'GitHub',
      targetValue: 7,
      currentValue: 5,
      unit: 'commits',
      completed: false,
    },
    {
      userId: user.id,
      weekStart: weekStartStr,
      title: 'LinkedIn Engineering Post',
      category: 'LinkedIn',
      targetValue: 1,
      currentValue: 1,
      unit: 'post',
      completed: true,
    },
    {
      userId: user.id,
      weekStart: weekStartStr,
      title: 'Full-Stack Feature Releases',
      category: 'Development',
      targetValue: 3,
      currentValue: 2,
      unit: 'features',
      completed: false,
    },
  ];

  for (const wg of defaultWeeklyGoals) {
    await createWeeklyGoal(wg);
  }

  // 4. Initial LinkedIn Goal
  await saveLinkedinGoal({
    userId: user.id,
    weekStart: weekStartStr,
    targetPosts: 1,
    completedPosts: 1,
    status: 'published',
    topic: 'Building Scalable Accountability Architecture with Firestore',
    updatedAt: Date.now(),
  });

  // 5. Seed historical daily activities for heatmap richness (past 14 days)
  for (let i = 14; i >= 1; i--) {
    const historicalDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const tasksDone = Math.floor(Math.random() * 3) + 2;
    const totalT = tasksDone + Math.floor(Math.random() * 2);
    const score = Math.floor(Math.random() * 35) + 65; // 65-100 score
    const actDoc: DailyActivity = {
      id: `${user.id}_${historicalDate}`,
      userId: user.id,
      date: historicalDate,
      tasksCompleted: tasksDone,
      totalTasks: totalT,
      goalsCompleted: 2,
      totalGoals: 4,
      plannerItemsCompleted: 3,
      totalPlannerItems: 4,
      githubCommits: Math.floor(Math.random() * 3) + 1,
      productivityScore: score,
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, 'dailyActivity', `${user.id}_${historicalDate}`), actDoc);
  }

  // Calculate today
  await recalculateAndSaveDailyActivity(user.id, todayStr);
}
