'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // If authenticated, navigate to feeds; otherwise go to login
    if (user && user.email) {
      router.replace('/feeds');
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono font-medium tracking-wide text-slate-400">Loading FR8X Workspace...</span>
      </div>
    </div>
  );
}
