'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Store, Lock, Mail, Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function DashboardLoginPage() {
  const router = useRouter();
  const { login, demoLogin, brandColor } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = useState('owner@spicegarden.demo');
  const [password, setPassword] = useState('demo123456');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Please fill in both email and password');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toastSuccess('Signed in successfully');
      router.push('/dashboard');
    } else {
      toastError(res.error || 'Authentication failed');
    }
  };

  const handleQuickDemo = () => {
    demoLogin();
    toastSuccess('Signed in as Demo Owner');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col items-center justify-center p-4 selection:bg-[var(--brand,#E23744)] selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-sm mb-3"
            style={{ backgroundColor: 'var(--brand, #E23744)' }}
          >
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-[26px] font-bold text-[#111111] tracking-tight">
            Owner Dashboard
          </h1>
          <p className="text-[14px] text-[#555555]">
            Sign in to manage live orders, menu, and QR codes
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#ECECEC] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input with label ABOVE */}
            <div className="space-y-1.5">
              <label className="block text-[14px] font-bold text-[#111111]">
                Owner Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@spicegarden.demo"
                  className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl pl-10 pr-4 text-[15px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)] transition-colors"
                />
              </div>
            </div>

            {/* Password input with label ABOVE */}
            <div className="space-y-1.5">
              <label className="block text-[14px] font-bold text-[#111111]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 bg-white border border-[#ECECEC] rounded-xl pl-10 pr-4 text-[15px] text-[#111111] placeholder-[#555555] focus:outline-none focus:border-[var(--brand,#E23744)] transition-colors"
                />
              </div>
            </div>

            {/* Submit button: 52px tall */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] rounded-xl text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 hover:brightness-105"
              style={{ backgroundColor: 'var(--brand, #E23744)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#ECECEC]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#555555] uppercase font-bold text-[11px] tracking-wider">
                Instant Evaluation
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full h-12 rounded-xl bg-[#F7F7F8] border border-[#ECECEC] text-[#111111] hover:bg-[#EAEAEA] active:scale-[0.98] transition-all font-bold text-[14px] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[var(--brand,#E23744)]" />
            <span>One-Tap Demo Login</span>
          </button>
        </div>

        <div className="text-center">
          <a
            href="/r/spice-garden?table=1"
            className="text-[14px] font-semibold text-[#555555] hover:text-[#111111] transition-colors underline underline-offset-4"
          >
            Browse customer menu instead →
          </a>
        </div>
      </div>
    </div>
  );
}
