import React from 'react';
import { AppNotification } from '../../types';
import {
  Bell,
  X,
  Check,
  Flame,
  Heart,
  Target,
  Clock,
  Github,
  Sparkles,
  Users2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'cheer':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'nudge':
      case 'achievement':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'friend_request':
        return <Users2 className="w-4 h-4 text-emerald-400" />;
      case 'github_reminder':
        return <Github className="w-4 h-4 text-zinc-300" />;
      case 'planner_reminder':
        return <Clock className="w-4 h-4 text-teal-400" />;
      case 'weekly_reminder':
        return <Target className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div
        className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">Notifications & Signals</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="p-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-20 text-center text-zinc-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No notifications yet.</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Friend nudges, streak alerts, and sprint reminders will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onMarkAsRead(n.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-zinc-950/40 border-zinc-800/40 opacity-70'
                      : 'bg-zinc-950/90 border-zinc-800 hover:border-zinc-700 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs font-bold ${n.read ? 'text-zinc-300' : 'text-zinc-100'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-500 font-mono">
            DuoTrack • Two-Friend Realtime Accountability
          </p>
        </div>
      </div>
    </div>
  );
};
