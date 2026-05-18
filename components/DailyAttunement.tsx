"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Zap, Sparkles, Feather, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DailyAttunement() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Immersive Comic Metrics
  const [streak, setStreak] = useState(0);
  const [hasAttunedToday, setHasAttunedToday] = useState(false);
  const [showXpPopup, setShowXpPopup] = useState(false);

  useEffect(() => {
    const syncDossierData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Fetch user profile metrics
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak, last_check_in")
        .eq("id", user.id)
        .single();

      if (profile) {
        setStreak(profile.streak || 0);
        
        if (profile.last_check_in) {
          const lastCheckInDate = new Date(profile.last_check_in).toDateString();
          const todayDate = new Date().toDateString();
          if (lastCheckInDate === todayDate) {
            setHasAttunedToday(true);
          }
        }
      }
      setLoading(false);
    };

    syncDossierData();
  }, []);

  const handleAttunement = async () => {
    if (!userId || hasAttunedToday) return;

    setHasAttunedToday(true);
    setShowXpPopup(true);
    
    const newStreak = streak + 1;
    setStreak(newStreak);

    // Calculate dynamic shonen rewards
    const isWeeklyMilestone = newStreak % 7 === 0;
    const xpReward = isWeeklyMilestone ? 150 : 25; // 25 XP normal, 150 XP for completing a week layout

    // Update database profiles via RPC function or clean updates
    await supabase.rpc("process_daily_sync", { 
      user_id: userId, 
      xp_reward: xpReward,
      new_streak: newStreak
    });

    // Hide animation popup after buffer window expires
    setTimeout(() => setShowXpPopup(false), 4000);
  };

  if (loading || !userId) return null;

  // Render a 7-panel blank manga grid structure
  const panels = Array.from({ length: 7 }, (_, i) => i + 1);
  // Track current active index within the current week cycle
  const currentWeekIndex = (streak % 7 === 0 && streak > 0 && hasAttunedToday) ? 7 : (streak % 7);

  return (
    <div className="w-full bg-void-surface border border-void-border rounded-3xl p-6 relative overflow-hidden shadow-2xl">
      
      {/* Dynamic Pop-up alert for anime stat increases */}
      <AnimatePresence>
        {showXpPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute inset-0 bg-void/95 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-4"
          >
            <Sparkles className="text-heritage-gold animate-bounce mb-2" size={32} />
            <h4 className="text-xl font-black text-white uppercase tracking-tighter">Resonance Increased!</h4>
            <p className="text-xs font-mono text-gray-400 mt-1">
              +{streak % 7 === 0 ? "150 CRITICAL" : "25"} XP ADDED TO CORE ID
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title block formatted like an index ledger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-void-border">
        <div>
          <h3 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
            <Feather size={16} className="text-rift-primary" /> Serialization Progress
          </h3>
          <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mt-0.5">
            Ink consecutive chapters to stabilize synchronization // Streak: {streak} Days
          </p>
        </div>

        <button
          disabled={hasAttunedToday}
          onClick={handleAttunement}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
            hasAttunedToday 
              ? 'bg-void border border-void-border text-gray-500 cursor-default' 
              : 'bg-linear-to-r from-rift-primary to-tech-cyan text-white hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
          }`}
        >
          {hasAttunedToday ? (
            <><Check size={14} /> Layout Saved</>
          ) : (
            <><Zap size={14} fill="currentColor" /> Ink Today's Panel</>
          )}
        </button>
      </div>

      {/* --- ASYMMETRICAL STORYBOARD GRID LAYOUT --- */}
      {/* This renders blocks to look like dynamic comic strip pages */}
      <div className="grid grid-cols-12 gap-3 auto-rows-[80px]">
        {panels.map((panelIndex) => {
          const isCurrentTarget = panelIndex === currentWeekIndex + 1 && !hasAttunedToday;
          const isCompleted = panelIndex <= currentWeekIndex;
          const isWeeklyFinal = panelIndex === 7;

          return (
            <div
              key={panelIndex}
              className={`
                relative rounded-xl border p-3 flex flex-col justify-between transition-all duration-500
                ${isWeeklyFinal ? 'col-span-6 sm:col-span-4' : 'col-span-3 sm:col-span-2'}
                ${isCompleted ? 'bg-rift-primary/5 border-rift-primary/40 text-rift-primary' : 'bg-void border-void-border text-gray-600'}
                ${isCurrentTarget ? 'border-dashed border-tech-cyan animate-pulse bg-tech-cyan/5 text-tech-cyan' : ''}
              `}
            >
              <span className="text-[9px] font-mono font-bold tracking-widest block opacity-50">
                P.{String(panelIndex).padStart(2, '0')}
              </span>

              {isCompleted ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-2 right-2 text-rift-primary">
                  <Feather size={14} fill="currentColor" className="rotate-45" />
                </motion.div>
              ) : isWeeklyFinal ? (
                <span className="text-[9px] font-black text-heritage-gold tracking-widest uppercase absolute bottom-2 right-3 flex items-center gap-1">
                  <Sparkles size={10} /> Bonus
                </span>
              ) : null}

              <span className={`text-xs font-black tracking-tighter uppercase self-end ${isCompleted ? 'text-white' : ''} ${isCurrentTarget ? 'text-tech-cyan' : ''}`}>
                {isWeeklyFinal ? 'Finish' : isCompleted ? 'Inked' : 'Draft'}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}