import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Lock,
  Mail,
  User,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    switchDemoUser,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim() || !username.trim()) {
          setError('Full name and unique username are required to create your account.');
          setLoading(false);
          return;
        }
        await signupWithEmail(email.trim(), password, name.trim(), username.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (target: 'friend1' | 'friend2') => {
    setLoading(true);
    await switchDemoUser(target);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#172033]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl bg-[#FFFDF8] border-2 border-[#172033] shadow-2xl p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] border border-[#7C3AED]/30 flex items-center justify-center shadow-xs">
            <Zap className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-[#172033] leading-tight">
              {mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
            </h3>
            <p className="font-friendly text-xs text-[#64748B]">
              DuoTrack • Co-tracking Productivity Playground
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-[#FFE4E6] border border-[#FB7185]/40 text-xs font-friendly font-bold text-[#E11D48] mb-4">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#F8FAFC] border-2 border-[#172033]/10 text-[#172033] text-xs font-friendly font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs mb-4 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-3">
          <div className="h-px bg-[#172033]/10 flex-1" />
          <span className="text-[10px] text-[#64748B] uppercase font-bold font-friendly">or email</span>
          <div className="h-px bg-[#172033]/10 flex-1" />
        </div>

        {/* Email Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-[11px] font-friendly font-bold text-[#172033] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-white border-2 border-[#172033]/10 focus:border-[#7C3AED] text-[#172033] text-xs font-friendly placeholder:text-[#94A3B8] outline-none shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-friendly font-bold text-[#172033] mb-1">
                  Unique Username (for friend code & lookups)
                </label>
                <div className="relative">
                  <span className="text-[#94A3B8] text-xs font-mono font-bold absolute left-3.5 top-1/2 -translate-y-1/2">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="johndev"
                    className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-white border-2 border-[#172033]/10 focus:border-[#7C3AED] text-[#172033] text-xs font-mono placeholder:text-[#94A3B8] outline-none shadow-xs"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-friendly font-bold text-[#172033] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-white border-2 border-[#172033]/10 focus:border-[#7C3AED] text-[#172033] text-xs font-friendly placeholder:text-[#94A3B8] outline-none shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-friendly font-bold text-[#172033] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-white border-2 border-[#172033]/10 focus:border-[#7C3AED] text-[#172033] text-xs font-friendly placeholder:text-[#94A3B8] outline-none shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl btn-primary-purple text-xs font-friendly font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
            className="text-xs font-friendly font-bold text-[#7C3AED] hover:underline cursor-pointer"
          >
            {mode === 'login'
              ? "Don't have an account? Sign up with new username"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Quick Testing Demo Switcher Box */}
        <div className="mt-5 pt-4 border-t border-[#172033]/10">
          <span className="text-[10px] uppercase font-friendly font-bold text-[#64748B] block mb-2 text-center">
            Instant Demo Two-Friend Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoSwitch('friend1')}
              className="px-3 py-2 rounded-2xl bg-[#F3E8FF]/60 hover:bg-[#F3E8FF] border border-[#7C3AED]/20 text-xs font-friendly font-bold text-[#172033] text-left transition-colors cursor-pointer"
            >
              <span className="text-[#7C3AED] block">Friend 1 (Alex)</span>
              <span className="text-[10px] text-[#64748B] font-mono">Code: ALEX99</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('friend2')}
              className="px-3 py-2 rounded-2xl bg-[#DCFCE7]/60 hover:bg-[#DCFCE7] border border-[#34D399]/30 text-xs font-friendly font-bold text-[#172033] text-left transition-colors cursor-pointer"
            >
              <span className="text-[#15803D] block">Friend 2 (Sam)</span>
              <span className="text-[10px] text-[#64748B] font-mono">Code: SAM88</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
