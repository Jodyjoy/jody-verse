"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { getRank } from "../../lib/gameLogic";
import { supabase } from "../../lib/supabaseClient";

const SQUAD_META: Record<string, { color: string; hex: string; motto: string }> = {
  "Squad 7":      { color: "#3B82F6", hex: "3B82F6", motto: "SHADOW OPS" },
  "Thunder Lord": { color: "#F59E0B", hex: "F59E0B", motto: "HIGH VOLTAGE" },
  "Iron Wall":    { color: "#EF4444", hex: "EF4444", motto: "UNBREAKABLE" },
  "Void Walkers": { color: "#8B5CF6", hex: "8B5CF6", motto: "NULL SECTOR" },
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b };
}

export default function LicenseGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [name, setName]       = useState("Unknown");
  const [xp, setXp]           = useState(0);
  const [squad, setSquad]     = useState("Squad 7");
  const [ability, setAbility] = useState("Shadow Step");

  const rank = getRank(xp);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) {
          setName(user.email?.split("@")[0].toUpperCase() || "READER");
          setXp(data.xp || 0);
          if (data.squad) setSquad(data.squad);
        }
      }
      setLoading(false);
    })();
  }, []);

  // ── Canvas draw ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const theme   = SQUAD_META[squad] || SQUAD_META["Squad 7"];
    const accent  = theme.color;
    const { r, g, b } = hexToRgb(theme.hex);
    const W = 600, H = 380;

    // ── Background ────────────────────────────────────────────────────────────
    ctx.fillStyle = "#03010C";
    ctx.fillRect(0, 0, W, H);

    // Subtle squad glow in top-right
    const glow = ctx.createRadialGradient(W, 0, 0, W, 0, 260);
    glow.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Halftone dots (hand-drawn)
    ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
    for (let x = 0; x < W; x += 18) {
      for (let y = 0; y < H; y += 18) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Outer border + angular corner accents ─────────────────────────────────
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // Corner brackets
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    const cs = 24; // corner size
    [[18,18,1,1],[W-18,18,-1,1],[18,H-18,1,-1],[W-18,H-18,-1,-1]].forEach(([x,y,dx,dy]) => {
      ctx.beginPath();
      ctx.moveTo(x + dx*cs, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy*cs);
      ctx.stroke();
    });

    // ── Left photo placeholder ────────────────────────────────────────────────
    const imgX = 38, imgY = 60, imgW = 130, imgH = 200;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(imgX, imgY, imgW, imgH);

    // Silhouette shape
    ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
    ctx.beginPath();
    ctx.arc(imgX + imgW / 2, imgY + 70, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(imgX + imgW / 2, imgY + 200, 50, 70, 0, Math.PI, 0);
    ctx.fill();

    // Photo placeholder label
    ctx.fillStyle = `rgba(${r},${g},${b},0.45)`;
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PHOTO", imgX + imgW / 2, imgY + imgH - 10);
    ctx.textAlign = "left";

    // ── Header text ───────────────────────────────────────────────────────────
    // "JODY-VERSE" label
    ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
    ctx.font = "bold 9px Arial";
    ctx.letterSpacing = "0.4em";
    ctx.fillText("JODY-VERSE", 185, 44);

    // Accent line under header
    ctx.fillStyle = accent;
    ctx.fillRect(185, 50, 60, 1);

    // Squad motto badge
    ctx.fillStyle = `rgba(${r},${g},${b},0.18)`;
    ctx.fillRect(280, 36, 100, 18);
    ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(280, 36, 100, 18);
    ctx.fillStyle = accent;
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.fillText(theme.motto, 330, 48);
    ctx.textAlign = "left";

    // ── Name ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px Arial";
    ctx.fillText("NAME", 185, 80);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px Impact";
    ctx.fillText(name.substring(0, 12), 185, 126);

    // Underline
    const nameWidth = Math.min(ctx.measureText(name.substring(0, 12)).width, 320);
    ctx.fillStyle = accent;
    ctx.fillRect(185, 132, nameWidth, 2);

    // ── Rank badge ────────────────────────────────────────────────────────────
    // Rank label
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px Arial";
    ctx.fillText("RANK", 185, 162);

    // Badge box
    ctx.fillStyle = `rgba(${r},${g},${b},0.2)`;
    ctx.fillRect(185, 168, 72, 32);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(185, 168, 72, 32);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Impact";
    ctx.textAlign = "center";
    ctx.fillText(rank, 221, 189);
    ctx.textAlign = "left";

    // XP sub-label
    ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
    ctx.font = "9px Arial";
    ctx.fillText(`${xp} XP`, 265, 188);

    // ── Squad ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px Arial";
    ctx.fillText("SQUAD", 185, 222);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText(squad.toUpperCase(), 185, 244);

    // ── Ability ───────────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px Arial";
    ctx.fillText("ABILITY", 185, 272);

    ctx.fillStyle = accent;
    ctx.font = "bold 22px Arial";
    ctx.fillText(ability, 185, 294);

    // ── Barcode + footer ──────────────────────────────────────────────────────
    for (let i = 38; i < 260; i += 4) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() > 0.5 ? 0.7 : 0.35})`;
      ctx.fillRect(i, H - 58, Math.random() > 0.6 ? 2 : 1, 22);
    }

    ctx.fillStyle = `rgba(${r},${g},${b},0.5)`;
    ctx.font = "8px monospace";
    ctx.fillText(`JV-${Math.floor(Math.random() * 90000 + 10000)}`, 38, H - 28);

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = "8px Arial";
    ctx.fillText("jody-verse.vercel.app", W - 38 - ctx.measureText("jody-verse.vercel.app").width, H - 28);

    // ── Scanline overlay ──────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    for (let i = 0; i < H; i += 4) {
      ctx.fillRect(0, i, W, 2);
    }
  }, [name, squad, rank, ability, xp]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `jody-verse-card-${name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#03010C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: "0.35em", color: "#8B5CF6" }}>Loading…</div>
    </div>
  );

  const accentColor = SQUAD_META[squad]?.color || "#3B82F6";

  return (
    <div style={{ minHeight: "100vh", background: "#03010C", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .bb { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .halftone { background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 20px 20px; }
        .field-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 2;
          padding: 10px 14px; color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.2s;
        }
        .field-input:focus { border-color: rgba(255,255,255,0.28); }
        .field-select {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 10px 14px; color: #fff; font-size: 13px; font-family: 'DM Sans', sans-serif;
          outline: none; cursor: pointer; appearance: none; border-radius: 0;
          transition: border-color 0.2s;
        }
        .field-select:focus { border-color: rgba(255,255,255,0.28); }
        .field-select option { background: #0D0D1A; }
      `}</style>

      {/* Backgrounds */}
      <div className="halftone" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(3,1,12,0.94)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "13px 0",
      }}>
        <div style={{ maxWidth: 1020, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/account" style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
            borderRadius: 2, color: "rgba(255,255,255,0.55)",
          }}>
            <ArrowLeft size={17} />
          </Link>
          <div>
            <div className="bb" style={{ fontSize: 19, letterSpacing: "0.08em", color: "#fff", lineHeight: 1 }}>Reader Card</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.26)", marginTop: 2 }}>Jody-Verse · Your collectible card</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "44px 1.5rem 80px", position: "relative", zIndex: 1 }}>

        <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* ── Controls ── */}
          <div style={{
            width: 260, flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            padding: "24px 20px", borderRadius: 2,
          }}>
            <div className="bb" style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.28)", marginBottom: 22 }}>
              Customise
            </div>

            {/* Name — read only */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 7 }}>Name</div>
              <div style={{
                padding: "10px 14px", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2,
                fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)",
              }}>
                {name}
              </div>
            </div>

            {/* Rank — read only */}
            <div style={{ marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 7 }}>Rank</div>
                <div style={{
                  padding: "10px 14px", background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${accentColor}44`,
                  borderRadius: 2, fontSize: 14, fontWeight: 700, color: accentColor,
                }}>
                  {rank}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 7 }}>XP</div>
                <div style={{
                  padding: "10px 14px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 2, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.45)",
                }}>
                  {xp.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Squad — editable */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 7 }}>Squad</div>
              <select className="field-select" value={squad} onChange={e => setSquad(e.target.value)}>
                <option>Squad 7</option>
                <option>Thunder Lord</option>
                <option>Iron Wall</option>
                <option>Void Walkers</option>
              </select>
            </div>

            {/* Ability — editable */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 7 }}>
                Ability
              </div>
              <input
                className="field-input"
                value={ability}
                onChange={e => setAbility(e.target.value)}
                maxLength={22}
                placeholder="e.g. Gravity Bind"
                style={{ borderRadius: 2 }}
              />
              <div style={{ marginTop: 4, fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{ability.length}/22</div>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 0", borderRadius: 2,
                background: "#fff", color: "#000",
                fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: "0.18em",
                border: "none", cursor: "pointer",
                boxShadow: `4px 4px 0 ${accentColor}55`,
                transition: "all 0.2s",
              }}
            >
              <Download size={15} /> Download Card
            </button>
          </div>

          {/* ── Canvas preview ── */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="bb" style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.28)", marginBottom: 16 }}>
              Live Preview
            </div>

            <div style={{
              position: "relative",
              border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: 2, overflow: "hidden",
              boxShadow: `6px 6px 0 ${accentColor}22`,
            }}>
              <canvas
                ref={canvasRef}
                width={600}
                height={380}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>

            <div style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
              Card updates live as you edit · Downloads as PNG
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
