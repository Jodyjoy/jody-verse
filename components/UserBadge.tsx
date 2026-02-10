"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { User, Loader2 } from "lucide-react";

export default function UserBadge() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  // 1. LOADING STATE (Small Spinner)
  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center animate-pulse">
        <Loader2 size={16} className="text-gray-500 animate-spin" />
      </div>
    );
  }

  // 2. LOGGED IN STATE (Avatar)
  if (user) {
    const initial = user.email ? user.email[0].toUpperCase() : "A";
    
    return (
      <Link href="/account" title="My Profile">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 border-2 border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-110 transition-transform cursor-pointer group relative">
          
          {/* The Initial */}
          <span className="text-white font-bold text-lg drop-shadow-md">{initial}</span>
          
          {/* Online Dot */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
        </div>
      </Link>
    );
  }

  // 3. LOGGED OUT STATE (Login Icon)
  return (
    <Link 
      href="/login" 
      className="w-12 h-12 rounded-full border border-gray-700 bg-black/50 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10 flex items-center justify-center transition-all duration-300"
      title="Contractor Login"
    >
      <User size={20} />
    </Link>
  );
}