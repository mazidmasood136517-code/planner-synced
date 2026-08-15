import React, { useState } from 'react';
import {
  UserProfile,
  Friendship,
  FriendAccountabilityStats,
} from '../../types';
import {
  findUserByUsernameOrCode,
  sendFriendRequest,
  respondToFriendRequest,
  sendNudgeToFriend,
} from '../../services/db';
import {
  Users2,
  Search,
  UserPlus,
  Flame,
  Target,
  Sparkles,
  CheckCircle2,
  Check,
  X,
  Copy,
  Linkedin,
  Github,
  Lock,
  Send,
  Heart,
  Zap,
  Share2,
  UserCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FriendViewProps {
  currentUser: UserProfile;
  friendStats: FriendAccountabilityStats | null;
  allFriendships: Friendship[];
  onRefresh: () => Promise<void>;
  onSwitchDemoUser?: (target: 'friend1' | 'friend2') => void;
}

export const FriendView: React.FC<FriendViewProps> = ({
  currentUser,
  friendStats,
  allFriendships,
  onRefresh,
  onSwitchDemoUser,
}) => {
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  const pendingReceived = allFriendships.filter(
    (f) => f.receiverId === currentUser.id && f.status === 'pending'
  );
  const pendingSent = allFriendships.filter(
    (f) => f.requesterId === currentUser.id && f.status === 'pending'
  );

  const handleSearchAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = inviteCodeInput.trim();
    if (!cleanInput) return;

    setSearching(true);
    setStatusMessage(null);
    setSearchResult(null);

    try {
      const foundUser = await findUserByUsernameOrCode(cleanInput);
      if (foundUser) {
        if (foundUser.id === currentUser.id) {
          setStatusMessage({ type: 'info', text: "That's your own invite code! Share it with a friend instead." });
        } else {
          setSearchResult(foundUser);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: `No buddy found matching code or username "${cleanInput}". Double check the spelling or ask your friend to resend their invite code.`,
        });
      }
    } catch (err) {
      console.error('Error finding user:', err);
      setStatusMessage({ type: 'error', text: 'Error searching for user. Please try again.' });
    } finally {
      setSearching(false);
    }
  };

  const handleInstantConnect = async (targetUser: UserProfile) => {
    try {
      // Direct instant connection since code was explicitly provided
      const res = await sendFriendRequest(currentUser, targetUser, true);
      setStatusMessage({
        type: res.success ? 'success' : 'info',
        text: res.message,
      });
      setSearchResult(null);
      setInviteCodeInput('');
      if (res.success) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
      await onRefresh();
    } catch (err) {
      console.error('Error connecting friend:', err);
      setStatusMessage({ type: 'error', text: 'Could not connect with friend.' });
    }
  };

  const handleResponse = async (friendshipId: string, accept: boolean) => {
    try {
      await respondToFriendRequest(friendshipId, accept, currentUser.id);
      if (accept) {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
      await onRefresh();
    } catch (err) {
      console.error('Error responding to friend request:', err);
    }
  };

  const handleSendNudge = async (type: 'nudge' | 'cheer' | 'fire' | 'focus') => {
    if (!friendStats?.friend) return;
    try {
      await sendNudgeToFriend(currentUser, friendStats.friend.id, type);
      setNudgeMessage(
        type === 'fire' ? 'Streak Flame Sent! 🔥' : type === 'cheer' ? 'Cheer Sent! 🎉' : 'Focus Nudge Sent! ⚡'
      );
      if (type === 'cheer' || type === 'fire') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
      setTimeout(() => setNudgeMessage(null), 3000);
    } catch (err) {
      console.error('Error sending nudge:', err);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(currentUser.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bento Banner */}
      <div className="bento-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 rounded-2xl bg-[#F3E8FF] text-[#7C3AED] border border-[#7C3AED]/20">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#172033] tracking-tight">
                Two-Friend Accountability Hub
              </h2>
              <p className="font-friendly text-xs text-[#64748B]">
                Stay mutually accountable in real time. Compare consistency streaks, daily productivity scores, and weekly targets with complete task-title privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Share Invite Code Pill */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={copyInviteCode}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F8FAFC] border-2 border-[#E0F2FE] text-xs font-friendly font-bold text-[#172033] transition-all shadow-xs cursor-pointer group"
          >
            <span className="text-[#64748B]">Your Invite Code:</span>
            <span className="font-mono font-bold text-[#3B82F6] text-sm tracking-wider">{currentUser.inviteCode}</span>
            {copiedCode ? (
              <span className="text-xs text-[#15803D] font-bold flex items-center gap-1">
                <Check className="w-4 h-4 text-[#34D399]" /> Copied!
              </span>
            ) : (
              <Copy className="w-4 h-4 text-[#3B82F6] group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* JOIN A FRIEND WITH CODE - TOP PROMINENT CARD */}
      <div className="bento-card p-6 bg-gradient-to-br from-[#FFFDF8] to-[#F3E8FF]/30 border-2 border-[#7C3AED]/20">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] font-friendly font-bold text-xs mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join a Friend with Shared Code</span>
          </div>

          <h3 className="font-display font-bold text-xl text-[#172033] mb-1.5">
            Connect Accountability Buddy
          </h3>
          <p className="font-friendly text-xs text-[#64748B] mb-5">
            Paste the 6-character invite code (e.g. <strong className="text-[#7C3AED] font-mono">SAM88</strong>, <strong className="text-[#7C3AED] font-mono">ALEX99</strong>) or username your friend shared with you.
          </p>

          <form onSubmit={handleSearchAndJoin} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              placeholder="Enter Friend's Invite Code or Username..."
              className="flex-1 px-4 py-3 rounded-2xl bg-white border-2 border-[#172033]/10 focus:border-[#7C3AED] text-[#172033] text-xs font-friendly placeholder:text-[#94A3B8] outline-none shadow-xs uppercase tracking-wider"
            />
            <button
              type="submit"
              disabled={searching || !inviteCodeInput.trim()}
              className="py-3 px-5 rounded-2xl btn-primary-purple text-xs font-friendly font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>{searching ? 'Finding...' : 'Join Buddy'}</span>
            </button>
          </form>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`mt-4 p-3 rounded-2xl text-xs font-friendly font-bold max-w-md mx-auto animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-[#DCFCE7] text-[#15803D] border border-[#34D399]/40'
                  : statusMessage.type === 'error'
                  ? 'bg-[#FFE4E6] text-[#E11D48] border border-[#FB7185]/40'
                  : 'bg-[#E0F2FE] text-[#0284C7] border border-[#38BDF8]/40'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Search Result Card - Instant 1-Click Connect */}
          {searchResult && (
            <div className="mt-5 p-4 rounded-3xl bg-white border-2 border-[#7C3AED]/30 max-w-md mx-auto shadow-lg flex items-center justify-between gap-3 text-left animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={searchResult.avatarUrl}
                  alt={searchResult.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-[#F3E8FF] bg-white shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-sm text-[#172033] truncate">
                    {searchResult.name}
                  </h4>
                  <p className="font-mono text-xs text-[#64748B]">@{searchResult.username}</p>
                  <p className="text-[11px] font-friendly text-[#15803D] font-bold">
                    Invite Code: {searchResult.inviteCode}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleInstantConnect(searchResult)}
                className="py-2.5 px-4 rounded-2xl btn-primary-purple text-xs font-friendly font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Connect Now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending Incoming Requests */}
      {pendingReceived.length > 0 && (
        <div className="bento-card p-5 bg-[#FEF9C3]/60 border-2 border-[#FACC15]">
          <h3 className="text-xs font-friendly font-bold uppercase tracking-wider text-[#B45309] mb-3 flex items-center gap-2">
            <span>Incoming Accountability Partner Requests</span>
          </h3>
          <div className="space-y-2.5">
            {pendingReceived.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#172033]/5 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.requesterAvatar}
                    alt={req.requesterName}
                    className="w-11 h-11 rounded-2xl object-cover border-2 border-[#F3E8FF] bg-white"
                  />
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#172033]">{req.requesterName}</h4>
                    <p className="font-mono text-[11px] text-[#64748B]">@{req.requesterUsername}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResponse(req.id, true)}
                    className="px-4 py-2 rounded-xl btn-primary-green text-xs font-friendly font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleResponse(req.id, false)}
                    className="px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] text-xs font-friendly font-semibold transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content: Linked Partner or Two-Friend Live View */}
      {friendStats && friendStats.friend ? (
        /* PARTNER IS LINKED */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Friend Profile & Interaction */}
          <div className="space-y-6">
            <div className="bento-card p-6 text-center relative overflow-hidden">
              <div className="relative inline-block mb-3">
                <img
                  src={friendStats.friend.avatarUrl}
                  alt={friendStats.friend.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-[#F3E8FF] bg-white mx-auto shadow-md"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#34D399] text-white border-2 border-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>

              <h3 className="font-display font-bold text-lg text-[#172033]">{friendStats.friend.name}</h3>
              <p className="font-mono text-xs text-[#64748B]">@{friendStats.friend.username}</p>
              <p className="font-friendly text-xs text-[#64748B] mt-2 leading-relaxed px-2">
                {friendStats.friend.bio || 'Accountability Partner'}
              </p>

              {/* Timezone */}
              <div className="mt-4 pt-3 border-t border-[#172033]/5 flex items-center justify-center gap-2 text-xs font-mono text-[#64748B]">
                <span>Timezone: {friendStats.friend.timezone}</span>
              </div>

              {/* Action Nudges */}
              <div className="mt-5 space-y-2">
                <span className="text-[11px] font-friendly font-bold uppercase tracking-wider text-[#64748B] block mb-2">
                  Send Accountability Signal
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendNudge('fire')}
                    className="p-3 rounded-2xl bg-[#FEF9C3] hover:bg-[#FEF08A] text-[#FB923C] font-friendly font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Streak Flame</span>
                  </button>

                  <button
                    onClick={() => handleSendNudge('cheer')}
                    className="p-3 rounded-2xl bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] font-friendly font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Heart className="w-4 h-4" />
                    <span>Cheer 🎉</span>
                  </button>
                </div>
              </div>

              {nudgeMessage && (
                <div className="mt-3 p-2.5 rounded-2xl bg-[#DCFCE7] text-[#15803D] text-xs font-friendly font-bold border border-[#34D399]/40 animate-in fade-in">
                  {nudgeMessage}
                </div>
              )}
            </div>

            {/* Privacy Guarantee Card */}
            <div className="bento-card p-4 bg-[#F8FAFC] text-xs font-friendly text-[#64748B] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#172033] block mb-0.5">Privacy Boundary Active</span>
                Your individual quest descriptions, daily private reflections, and secret sub-tasks are hidden. Only aggregate consistency scores and weekly target percentages are synchronized.
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Friend Consistency Stats & Weekly Targets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Metrics Comparison */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bento-card p-4 text-center">
                <span className="text-[10px] font-friendly uppercase font-bold text-[#64748B] block mb-1">
                  Today's Score
                </span>
                <span className="text-2xl font-black text-[#15803D] font-mono">{friendStats.todayScore}%</span>
                <span className="text-[10px] font-friendly text-[#64748B] block mt-1">
                  {friendStats.todayTasksCompleted} / {friendStats.todayTasksTotal} quests done
                </span>
              </div>

              <div className="bento-card p-4 text-center">
                <span className="text-[10px] font-friendly uppercase font-bold text-[#64748B] block mb-1">
                  Weekly Goals
                </span>
                <span className="text-2xl font-black text-[#0284C7] font-mono">{friendStats.weeklyGoalCompletionRate}%</span>
                <span className="text-[10px] font-friendly text-[#64748B] block mt-1">
                  {friendStats.weeklyGoalsCompleted} / {friendStats.weeklyGoalsCount} targets met
                </span>
              </div>

              <div className="bento-card p-4 text-center">
                <span className="text-[10px] font-friendly uppercase font-bold text-[#64748B] block mb-1">
                  Streak
                </span>
                <div className="text-2xl font-black text-[#FB923C] font-mono flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5" />
                  <span>{friendStats.currentStreak}d</span>
                </div>
                <span className="text-[10px] font-friendly text-[#64748B] block mt-1">Active consistency</span>
              </div>
            </div>

            {/* Friend's Current Weekly Goals */}
            <div className="bento-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#7C3AED]" />
                <h3 className="font-display font-bold text-lg text-[#172033]">
                  {friendStats.friend.name}'s Weekly Targets
                </h3>
              </div>

              {friendStats.recentGoals.length === 0 ? (
                <div className="py-8 text-center bg-[#FFFDF8] rounded-2xl border border-dashed border-[#172033]/10">
                  <p className="text-xs font-friendly text-[#64748B]">
                    Your buddy hasn't established weekly targets yet for this sprint.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friendStats.recentGoals.map((goal) => {
                    const isComplete = goal.completed || goal.currentValue >= goal.targetValue;
                    const pct = Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));

                    return (
                      <div
                        key={goal.id}
                        className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#172033]/5 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs font-friendly">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#172033]">{goal.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#64748B] font-mono font-medium">
                              {goal.category}
                            </span>
                          </div>
                          <span className="font-mono text-[#64748B]">
                            {goal.currentValue} / {goal.targetValue} {goal.unit} ({pct}%)
                          </span>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-[#34D399]' : 'bg-[#7C3AED]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LinkedIn & GitHub Accountability Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* GitHub */}
              <div className="bento-card p-4 flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-[#F1F5F9] text-[#172033]">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-[#172033]">GitHub Commits</h4>
                  <p className="text-xs font-mono text-[#15803D] font-bold mt-0.5">
                    @{friendStats.friend.githubUsername || 'connected'}
                  </p>
                  <span className="text-[11px] font-friendly text-[#64748B] block mt-0.5">
                    Live commits synced into consistency score
                  </span>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="bento-card p-4 flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-[#E0F2FE] text-[#0284C7]">
                  <Linkedin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-[#172033]">LinkedIn Technical Post</h4>
                  <p className="text-xs font-friendly text-[#172033] mt-0.5">
                    Status:{' '}
                    <strong className="text-[#15803D] uppercase font-mono text-[11px]">
                      {friendStats.linkedinWeeklyProgress?.status || 'Planned'}
                    </strong>
                  </p>
                  <span className="text-[11px] font-friendly text-[#64748B] block mt-0.5">
                    {friendStats.linkedinWeeklyProgress?.completed || 0} / {friendStats.linkedinWeeklyProgress?.target || 1} post completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* NO PARTNER LINKED YET - QUICK DEMO PAIR SWITCHER */
        <div className="bento-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-display font-bold text-base text-[#172033]">
              Need Instant Two-Friend Preview?
            </h4>
            <p className="font-friendly text-xs text-[#64748B] mt-0.5">
              Toggle between Alex Rivera and Sam Chen to preview live real-time synchronization between two separate buddy accounts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSwitchDemoUser && onSwitchDemoUser('friend1')}
              className="px-4 py-2 rounded-2xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] text-xs font-friendly font-bold transition-colors cursor-pointer"
            >
              Switch to Alex
            </button>
            <button
              onClick={() => onSwitchDemoUser && onSwitchDemoUser('friend2')}
              className="px-4 py-2 rounded-2xl bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] text-xs font-friendly font-bold transition-colors cursor-pointer"
            >
              Switch to Sam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
