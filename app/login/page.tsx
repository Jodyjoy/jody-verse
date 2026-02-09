"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Shield, Zap, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // New: To prevent flash of form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [msg, setMsg] = useState("");

  // 1. AUTO-REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is already logged in, send them to dashboard
        router.replace("/account");
      } else {
        // User is guest, show the form
        setPageLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setMsg(error.message);
      else setMsg("Success! Check your email (or just login).");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setMsg(error.message);
      else {
        router.push("/account");
        router.refresh(); // Force refresh to update UI elsewhere
      }
    }
    setLoading(false);
  };

  // 2. SHOW LOADING SCREEN WHILE CHECKING
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-blue-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
      <div className="absolute bottom-10 right-10 opacity-20 animate-pulse">
        <Shield size={200} />
      </div>

      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-md border border-gray-800 p-8 rounded-2xl shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-600/20 rounded-full mb-4">
                <Lock size={32} className="text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-widest">
                {isSignUp ? "New Contractor" : "System Access"}
            </h1>
            <p className="text-gray-500 text-sm mt-2 font-mono">
                SECURE CONNECTION // SECTOR 4
            </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                <input 
                    type="email" 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none transition mt-1"
                    placeholder="agent@rift.com"
                    required
                />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                <input 
                    type="password" 
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none transition mt-1"
                    placeholder="••••••••"
                    required
                />
            </div>

            {msg && <p className="text-red-400 text-xs font-bold bg-red-900/20 p-2 rounded border border-red-500/50">{msg}</p>}

            <button 
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition flex items-center justify-center gap-2"
            >
                {loading ? "Processing..." : (isSignUp ? "Register Identity" : "Authorize Login")}
                {!loading && <ArrowRight size={18} />}
            </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
            <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-gray-500 text-sm hover:text-white transition underline decoration-gray-700 underline-offset-4"
            >
                {isSignUp ? "Already have an account? Login" : "Need access? Create Account"}
            </button>
        </div>

      </div>
    </div>
  );
}