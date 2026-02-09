"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Download, RefreshCw, Shield, Zap, User } from "lucide-react";
import Link from "next/link";

export default function LicenseGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState("JODY");
  const [squad, setSquad] = useState("Squad 7");
  const [rank, setRank] = useState("S-RANK");
  const [ability, setAbility] = useState("Shadow Step");
  
  // SQUAD THEMES (Color + Motto)
  const squadData: Record<string, { color: string, motto: string }> = {
    "Squad 7": { color: "#3b82f6", motto: "SHADOW OPS" },      // Blue
    "Thunder Lord": { color: "#eab308", motto: "HIGH VOLTAGE" }, // Yellow
    "Iron Wall": { color: "#ef4444", motto: "UNBREAKABLE" },   // Red
    "Void Walkers": { color: "#a855f7", motto: "NULL SECTOR" },  // Purple
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const theme = squadData[squad] || squadData["Squad 7"];
    const accentColor = theme.color;

    // --- 1. BASE LAYER (Dark Metal) ---
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, "#0f172a"); 
    gradient.addColorStop(1, "#020617"); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // --- 2. TECH GRID PATTERN ---
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 600; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.stroke();
    }
    for (let i = 0; i < 400; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
    }

    // --- 3. GLOWING BORDER & CORNERS ---
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

    // --- 4. PROFILE IMAGE PLACEHOLDER ---
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(50, 80, 140, 180);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 80, 140, 180);
    
    // Silhouette Icon
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

    // --- 5. TEXT DATA (Refined Layout) ---
    ctx.fillStyle = "#fff";
    
    // Header (MOVED LEFT to x=200 to avoid badge)
    ctx.font = "bold italic 30px Arial"; // Slightly smaller font
    ctx.fillText("RIFT CONTRACTOR", 200, 70);
    
    ctx.fillStyle = accentColor;
    ctx.font = "bold 12px Courier New";
    ctx.fillText(`// ${theme.motto} // AUTH_KEY_99`, 200, 95);

    // Main Stats
    ctx.fillStyle = "#94a3b8"; 
    ctx.font = "12px Courier New";
    ctx.fillText("OPERATIVE NAME", 200, 140);
    
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 40px Impact"; 
    ctx.fillText(name.toUpperCase().substring(0, 12), 200, 180);
    
    // Ability Section
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Courier New";
    ctx.fillText("SPECIAL ABILITY", 200, 220);
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.fillText(ability, 200, 250);

    // --- 6. RANK BADGE (MOVED RIGHT & RESIZED) ---
    // Moved closer to the edge (520 start instead of 500)
    ctx.beginPath();
    ctx.moveTo(520, 40);
    ctx.lineTo(580, 40);
    ctx.lineTo(560, 100);
    ctx.lineTo(500, 100);
    ctx.closePath();
    ctx.fillStyle = accentColor;
    ctx.fill();
    
    ctx.fillStyle = "#000";
    ctx.font = "bold 36px Arial"; // Smaller font for rank letter
    ctx.textAlign = "center";
    ctx.fillText(rank.charAt(0), 540, 82); // Centered in new badge shape
    ctx.textAlign = "left"; 

    // --- 7. BARCODE & FOOTER ---
    ctx.fillStyle = "#fff";
    for(let i=50; i<300; i+=5) {
        ctx.fillRect(i, 320, Math.random() > 0.5 ? 2 : 1, 30);
    }
    
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Courier New";
    ctx.fillText(`ID: 882-${Math.floor(Math.random() * 9999)}-X`, 50, 365);
    ctx.fillText("KENYA / SECTOR 4 / AUTHORIZED PERSONNEL ONLY", 300, 365);

    // --- 8. SCANLINES ---
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
                License Generator <span className="text-blue-500">v2.0</span>
            </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start w-full max-w-5xl">
        
        {/* INPUT CONTROLS */}
        <div className="bg-gray-900/50 backdrop-blur-md p-8 rounded-3xl border border-gray-800 w-full lg:w-1/3 shadow-2xl">
            <div className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-blue-500 mb-2 block uppercase tracking-wider">Operative Name</label>
                    <input 
                        value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white font-bold text-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition uppercase"
                        maxLength={12}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Squad</label>
                        <select 
                            value={squad} onChange={(e) => setSquad(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                        >
                            <option>Squad 7</option>
                            <option>Thunder Lord</option>
                            <option>Iron Wall</option>
                            <option>Void Walkers</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Rank</label>
                        <select 
                            value={rank} onChange={(e) => setRank(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                        >
                            <option>S-RANK</option>
                            <option>A-RANK</option>
                            <option>B-RANK</option>
                            <option>F-RANK</option>
                        </select>
                    </div>
                </div>

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
                {/* Glowing Effect behind canvas */}
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
                SYSTEM READY // INSTANT ISSUE
            </p>
        </div>

      </div>
    </div>
  );
}