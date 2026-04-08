'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, Users, Zap } from 'lucide-react';
import { signInWithGoogle, signOut } from '@/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface LandingPageProps {
  user: { email: string | null } | null;
}

export default function LandingPage({ user }: LandingPageProps) {
  const [show403Modal, setShow403Modal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (currentUser?.email && !currentUser.email.endsWith('@vitbhopal.ac.in')) {
      if (!process.env.NEXT_PUBLIC_DEV_MODE) {
        setShow403Modal(true);
        return;
      }
    }
    
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-[#030712] to-[#030712]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtMS4xIDAtMiAuOS0yIDJzLjkgMiAyIDIgMiAuOSAyIDItLjkgMi0yIDItMi0uOXptMCAzMmMtMS4xIDAtMiAuOS0yIDJyLjkgMiAyIDIgMiAuOSAyIDItLjkgMi0yIDItMi0uOXoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30" />

      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
            StudyFlare
          </span>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center gap-6"
        >
          {!user ? (
            <button
              onClick={handleSignIn}
              className="px-5 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white font-medium hover:bg-white/20 transition-all duration-300"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white font-medium hover:bg-white/20 transition-all duration-300"
            >
              Sign Out
            </button>
          )}
        </motion.nav>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm">
              <Zap className="w-4 h-4" />
              Your gateway to collaborative learning
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-7xl font-bold mb-8 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
              Ignite Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent animate-gradient">
              Learning Journey
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-12"
          >
            Connect with fellow students, share resources, and accelerate your academic success with StudyFlare&apos;s powerful collaboration tools.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!user && (
              <button
                onClick={handleSignIn}
                className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Sign in with Google
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: BookOpen, title: 'Study Materials', desc: 'Access shared notes and resources from peers' },
              { icon: Users, title: 'Study Groups', desc: 'Join or create groups for collaborative learning' },
              { icon: Zap, title: 'Real-time Updates', desc: 'Stay sync with instant notifications' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {show403Modal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShow403Modal(false)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md p-8 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-red-500/30 shadow-2xl"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-4">Access Denied</h2>
            <p className="text-gray-400 text-center mb-6">
              Only <span className="text-violet-400 font-semibold">@vitbhopal.ac.in</span> emails are authorized to access StudyFlare.
            </p>
            <button
              onClick={() => {
                setShow403Modal(false);
                handleSignOut();
              }}
              className="w-full py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
            >
              Try Another Account
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}