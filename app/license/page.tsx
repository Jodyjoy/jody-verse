"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Download, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { getRank } from "../../lib/gameLogic";
import { supabase } from "../../lib/supabaseClient";

export default function LicenseGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // STATE
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Unknown");
  const [xp, setXp] = useState(0);
  const [squad, setSquad] = useState("Squad 7");
  const [ability, setAbility] = useState("Shadow Step"); // Ability is still custom!
  
  // DERIVED STATE: Calculate Rank from XP
  const rank = getRank(xp);

  // SQUAD THEMES (Color + Motto)
  const squadData: Record<string, { color: string, motto: string }> = {
    "Squad 7": { color: "#3b82f6", motto: "SHADOW OPS" },      // Blue
    "Thunder Lord": { color: "#eab308", motto: "HIGH VOLTAGE" }, // Yellow
    "Iron Wall": { color: "#ef4444", motto: "UNBREAKABLE" },   // Red
    "Void Walkers": { color: "#a855f7", motto: "NULL SECTOR" },  // Purple
  };

  // 1. FETCH REAL USER DATA
  useEffect(() => {
    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Get XP and Squad from DB
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) {
                // Use email prefix as name if no display name is set
                setName(user.email?.split('@')[0].toUpperCase() || "AGENT");
                setXp(data.xp);
                // If they have a saved squad, use it, otherwise default
                if (data.squad) setSquad(data.squad);
            }
        }
        setLoading(false);
    };
    fetchProfile();
  }, []);

  // 2. DRAW CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const theme = squadData[squad] || squadData["Squad 7"];
    const accentColor = theme.color;

    // --- BASE LAYER ---
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, "#0f172a"); 
    gradient.addColorStop(1, "#020617"); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // --- TECH GRID ---
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 600; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.stroke();
    }
    for (let i = 0; i < 400; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
    }

    // --- BORDER & GLOW ---
    ctx.shadowBlur = 15;
    ctx.shadowColor = accentColor;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 560, 360);
    
    // Tech Corners
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(20, 80); ctx.lineTo(20, 20); ctx.lineTo(80, 20); // Top Left
    ctx.moveTo(580, 320); ctx.lineTo(580, 380); ctx.lineTo(520, 380); // Bottom Right
    ctx.stroke();
    ctx.shadowBlur = 0; 

    // --- PROFILE IMAGE PLACEHOLDER ---
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(50, 80, 140, 180);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 80, 140, 180);
    
    // Silhouette
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.arc(120, 150, 40, 0, Math.PI * 2); 
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(120, 260, 60, 80, 0, Math.PI, 0); 
    ctx.fill();
    
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 14px Courier New";
    ctx.fillText("NO SIGNAL", 85, 170);

    // --- TEXT DATA ---
    ctx.fillStyle = "#fff";
    
    // Header (Aligned Left to avoid badge overlap)
    ctx.font = "bold italic 30px Arial";
    ctx.fillText("RIFT CONTRACTOR", 200, 70);
    
    ctx.fillStyle = accentColor;
    ctx.font = "bold 12px Courier New";
    ctx.fillText(`// ${theme.motto} // AUTH_KEY_99`, 200, 95);

    // Name
    ctx.fillStyle = "#94a3b8"; 
    ctx.font = "12px Courier New";
    ctx.fillText("OPERATIVE NAME", 200, 140);
    
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 40px Impact"; 
    ctx.fillText(name.substring(0, 12), 200, 180);
    
    // Ability
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Courier New";
    ctx.fillText("SPECIAL ABILITY", 200, 220);
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.fillText(ability, 200, 250);

    // --- RANK BADGE (Dynamic Color) ---
    ctx.beginPath();
    ctx.moveTo(520, 40);
    ctx.lineTo(580, 40);
    ctx.lineTo(560, 100);
    ctx.lineTo(500, 100);
    ctx.closePath();
    ctx.fillStyle = accentColor;
    ctx.fill();
    
    ctx.fillStyle = "#000";
    ctx.font = "bold 36px Arial"; 
    ctx.textAlign = "center";
    ctx.fillText(rank.charAt(0), 540, 82); 
    ctx.textAlign = "left"; 

    // --- BARCODE & FOOTER ---
    ctx.fillStyle = "#fff";
    for(let i=50; i<300; i+=5) {
        ctx.fillRect(i, 320, Math.random() > 0.5 ? 2 : 1, 30);
    }
    
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Courier New";
    ctx.fillText(`ID: 882-${Math.floor(Math.random() * 9999)}-X`, 50, 365);
    ctx.fillText("KENYA / SECTOR 4 / AUTHORIZED PERSONNEL ONLY", 300, 365);

    // --- SCANLINES ---
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    for (let i = 0; i < 400; i += 4) {
        ctx.fillRect(0, i, 600, 2);
    }

  }, [name, squad, rank, ability]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `Rift-License-${name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 animate-pulse font-mono">CONNECTING TO DATABASE...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 flex flex-col items-center justify-center font-sans">
      
      {/* HEADER */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" /> 
            <span className="font-mono">BACK_TO_BASE</span>
        </Link>
        <div className="flex items-center gap-2">
            <Shield className="text-blue-500" />
            <h1 className="text-xl font-bold uppercase tracking-widest">
                License Generator <span className="text-blue-500">v3.0</span>
            </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start w-full max-w-5xl">
        
        {/* INPUT CONTROLS */}
        <div className="bg-gray-900/50 backdrop-blur-md p-8 rounded-3xl border border-gray-800 w-full lg:w-1/3 shadow-2xl">
            <div className="space-y-6">
                
                {/* NAME (READ ONLY) */}
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Operative Name</label>
                    <div className="w-full bg-black/50 border border-gray-700 rounded-lg p-4 text-gray-300 font-bold text-lg uppercase cursor-not-allowed">
                        {name}
                    </div>
                </div>

                {/* RANK & SQUAD */}
                <div className="grid grid-cols-2 gap-4">
                    {/* RANK (READ ONLY - Calculated) */}
                    <div className="bg-black/50 border border-gray-700 rounded-lg p-4 flex flex-col justify-center">
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Rank</label>
                        <div className={`text-3xl font-black uppercase ${rank === 'S-RANK' ? 'text-red-500' : 'text-blue-500'}`}>
                            {rank}
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-1">{xp} XP EARNED</p>
                    </div>

                    {/* SQUAD (EDITABLE - Preference) */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Squad</label>
                        <select 
                            value={squad} onChange={(e) => setSquad(e.target.value)}
                            className="w-full h-full bg-black border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none appearance-none cursor-pointer hover:border-blue-500/50 transition"
                        >
                            <option>Squad 7</option>
                            <option>Thunder Lord</option>
                            <option>Iron Wall</option>
                            <option>Void Walkers</option>
                        </select>
                    </div>
                </div>

                {/* ABILITY (EDITABLE - Creative) */}
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Unique Ability</label>
                    <input 
                        value={ability} onChange={(e) => setAbility(e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white focus:border-blue-500 outline-none transition"
                        maxLength={20}
                        placeholder="e.g. Gravity Bind"
                    />
                </div>
            </div>

            <button 
                onClick={handleDownload}
                className="w-full mt-8 flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 group"
            >
                <Download size={20} className="group-hover:translate-y-1 transition" /> 
                PRINT LICENSE
            </button>
        </div>

        {/* LIVE PREVIEW */}
        <div className="flex-1 flex flex-col items-center">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                
                <div className="relative border border-gray-700 rounded-xl overflow-hidden bg-black shadow-2xl">
                    <canvas 
                        ref={canvasRef}
                        width={600}
                        height={400}
                        className="w-full h-auto max-w-full"
                    />
                </div>
            </div>
            
            <p className="mt-6 text-gray-500 text-sm font-mono flex items-center gap-2">
                <Zap size={14} className="text-yellow-500"/> 
                LIVE DATA FEED // SYNCED
            </p>
        </div>

      </div>
    </div>
  );
}