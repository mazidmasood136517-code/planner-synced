import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import {
  Bell,
  Copy,
  Check,
  LogOut,
  User,
  Users,
  Sparkles,
  ChevronDown,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  unreadCount?: number;
  onOpenAuthModal: () => void;
  user?: UserProfile;
  isDemoMode?: boolean;
  onSwitchDemoUser?: (target: 'friend1' | 'friend2') => Promise<void>;
  onLogout?: () => Promise<void>;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  unreadNotificationsCount,
  unreadCount,
  onOpenAuthModal,
  user: propUser,
  isDemoMode: propIsDemoMode,
  onSwitchDemoUser,
  onLogout,
  onOpenMobileMenu,
}) => {
  const auth = useAuth();
  const profile = propUser || auth?.profile || auth?.user;
  const isDemo = propIsDemoMode ?? auth?.isDemoMode ?? true;
  const logout = onLogout || auth?.logout;
  const switchDemoUser = onSwitchDemoUser || auth?.switchDemoUser;

  const actualUnreadCount = unreadNotificationsCount ?? unreadCount ?? 0;

  const [copiedCode, setCopiedCode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const copyInviteCode = () => {
    if (profile?.inviteCode) {
      navigator.clipboard.writeText(profile.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <header className="bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#172033]/5 px-4 sm:px-6 py-3.5 flex items-center justify-between z-10 select-none sticky top-0">
      {/* Left: Hamburger & Greeting & Current Date */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl bg-white border border-[#172033]/5 hover:bg-[#F3E8FF] text-[#64748B] hover:text-[#7C3AED] transition-colors shadow-xs cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-[#172033] tracking-tight leading-tight">
              Hey {profile?.name.split(' ')[0] || 'Friend'}! 👋
            </h1>
          </div>
          <p className="font-friendly text-xs text-[#64748B] font-medium hidden sm:block">
            Ready to crush your targets today? • {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
      </div>

      {/* Right: Quick Switcher, Invite Code, Notifications & User Menu */}
      <div className="flex items-center gap-2.5">
        {/* Quick Two-Friend Switcher for live testing */}
        {isDemo && switchDemoUser && (
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-white border border-[#172033]/5 shadow-xs">
            <button
              onClick={() => switchDemoUser('friend1')}
              className={`px-2.5 py-1 rounded-lg text-xs font-friendly font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                profile?.id === 'demo_user_alex'
                  ? 'bg-[#F3E8FF] text-[#7C3AED]'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <span className="text-xs">🧑‍💻</span>
              Alex
            </button>
            <button
              onClick={() => switchDemoUser('friend2')}
              className={`px-2.5 py-1 rounded-lg text-xs font-friendly font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                profile?.id === 'demo_user_sam'
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <span className="text-xs">⚡</span>
              Sam
            </button>
          </div>
        )}

        {/* Invite Code Quick Pill */}
        {profile?.inviteCode && (
          <button
            onClick={copyInviteCode}
            title="Click to copy your friend invite code"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F0F9FF] border-2 border-[#E0F2FE] transition-colors text-xs font-mono text-[#3B82F6] shadow-xs group cursor-pointer"
          >
            <span className="text-[#64748B] text-[11px] font-friendly font-medium">Invite Code:</span>
            <strong className="font-bold text-[#3B82F6]">{profile.inviteCode}</strong>
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-[#34D399]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
            )}
          </button>
        )}

        {/* Demo Badge */}
        {isDemo && (
          <div className="hidden md:flex items-center gap-1 bg-[#DCFCE7] text-[#15803D] px-3 py-1 rounded-full font-friendly font-bold text-xs border border-[#34D399]/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-ping" />
            Demo Mode
          </div>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-white hover:bg-[#F3E8FF] border border-[#172033]/5 text-[#64748B] hover:text-[#7C3AED] transition-colors shadow-xs cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {actualUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7C3AED] text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
              {actualUnreadCount}
            </span>
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-0.5 rounded-2xl bg-white hover:bg-[#F8FAFC] border border-[#172033]/5 transition-colors cursor-pointer"
          >
            <img
              src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={profile?.name || 'User'}
              className="w-9 h-9 rounded-xl object-cover bg-white border-2 border-[#F3E8FF]"
              referrerPolicy="no-referrer"
            />
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] mr-1" />
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-3xl bg-white border border-[#172033]/10 shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="p-3 border-b border-[#172033]/5 mb-1.5">
                <p className="font-display text-sm font-bold text-[#172033]">{profile?.name}</p>
                <p className="font-mono text-[11px] text-[#64748B]">@{profile?.username}</p>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">{profile?.email}</p>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenAuthModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-friendly font-semibold text-[#172033] hover:bg-[#F3E8FF] hover:text-[#7C3AED] transition-colors"
                >
                  <User className="w-4 h-4 text-[#7C3AED]" />
                  Sign In with Firebase Account
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    copyInviteCode();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-friendly font-semibold text-[#172033] hover:bg-[#F0F9FF] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#3B82F6]" />
                    Share Invite Code
                  </span>
                  <span className="font-mono text-[#3B82F6] font-bold">{profile?.inviteCode}</span>
                </button>

                <div className="h-px bg-[#172033]/5 my-1" />

                {logout && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-friendly font-semibold text-[#FB7185] hover:bg-[#FCE7F3] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out / Reset Session
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
