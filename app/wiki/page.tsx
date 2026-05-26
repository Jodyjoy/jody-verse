"use client";

import Link from "next/link";
import { ArrowLeft, X, ChevronRight, Zap, Activity } from "lucide-react";
import { characters } from "../../lib/wikiData";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SR_COLOR   = "#8B5CF6";
const SR_RGB     = "139,92,246";

export default function WikiPage() {
  const [activeChar, setActiveChar] = useState<typeof characters[0] | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#03010C", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .bb { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .halftone { background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 20px 20px; }

        .char-card { transition: transform 0.32s cubic-bezier(0.16,1,0.3,1), box-shadow 0.32s; }
        .char-card:hover { transform: translateY(-5px); box-shadow: 0 10px 32px rgba(139,92,246,0.22); }
        .char-card:hover .card-tint { opacity: 0.55 !important; }
        .char-card:hover .card-footer-hint { opacity: 1 !important; transform: translateY(0px) !important; }

        .stat-bar { height: 3px; background: rgba(255,255,255,0.06); overflow: hidden; border-radius: 0; }

        /* Modal responsive */
        .modal-inner { display: flex; flex-direction: row; }
        .modal-img   { width: 38%; flex-shrink: 0; min-height: 380px; }
        .modal-body  { flex: 1; padding: 32px 28px; overflow-y: auto; }
        @media (max-width: 640px) {
          .modal-inner { flex-direction: column; }
          .modal-img   { width: 100%; min-height: 240px; max-height: 240px; }
          .modal-body  { padding: 22px 18px; }
        }
      `}</style>

      {/* ── Backgrounds ── */}
      <div className="halftone" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(${SR_RGB},0.08) 0%, transparent 60%)`,
      }} />

      {/* ── Sticky top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(3,1,12,0.94)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "13px 0",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/" style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
            borderRadius: 2, color: "rgba(255,255,255,0.55)", transition: "all 0.2s",
          }}>
            <ArrowLeft size={17} />
          </Link>
          <div>
            <div className="bb" style={{ fontSize: 19, letterSpacing: "0.08em", color: "#fff", lineHeight: 1 }}>Character Archive</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.26)", marginTop: 2 }}>Jody-Verse · Spectral Rift</div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 1.5rem 80px", position: "relative", zIndex: 1 }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ marginBottom: 40 }}
        >
          <div className="bb" style={{ fontSize: 9, letterSpacing: "0.42em", color: SR_COLOR, marginBottom: 8, opacity: 0.85 }}>
            Spectral Rift
          </div>
          <h1 className="bb" style={{
            fontSize: "clamp(34px,7vw,68px)", letterSpacing: "0.04em",
            color: "#fff", lineHeight: 0.88, marginBottom: 14,
          }}>
            Characters
          </h1>
          <div style={{
            width: 64, height: 2, background: SR_COLOR, marginBottom: 14,
            boxShadow: `0 0 14px rgba(${SR_RGB},0.7)`,
          }} />
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", fontWeight: 300 }}>
            {characters.length} characters · Spectral Rift universe
          </p>
        </motion.div>

        {/* ── Character grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}>
          {characters.map((char, idx) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: idx * 0.065 }}
              className="char-card"
              onClick={() => setActiveChar(char)}
              style={{
                position: "relative", borderRadius: 2, overflow: "hidden",
                border: `1px solid rgba(${SR_RGB},0.14)`,
                cursor: "pointer", height: 340,
                background: "#0A0A14",
              }}
            >
              {/* Character image */}
              <img
                src={char.image}
                alt={char.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />

              {/* Gradient overlay */}
              <div
                className="card-tint"
                style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(3,1,12,0.95) 0%, rgba(3,1,12,0.35) 50%, transparent 100%)",
                  opacity: 0.88, transition: "opacity 0.3s",
                }}
              />

              {/* Role tag */}
              <div style={{
                position: "absolute", top: 12, left: 12,
                padding: "3px 9px", borderRadius: 2,
                border: `1px solid rgba(${SR_RGB},0.3)`,
                background: `rgba(${SR_RGB},0.12)`,
                fontSize: 8, letterSpacing: "0.18em", fontWeight: 600,
                color: SR_COLOR, textTransform: "uppercase" as const,
                backdropFilter: "blur(8px)",
              }}>
                {char.role.split("/")[0].trim()}
              </div>

              {/* Bottom info */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px 18px", zIndex: 2 }}>
                <div className="bb" style={{ fontSize: 28, letterSpacing: "0.04em", color: "#fff", lineHeight: 1, marginBottom: 3 }}>
                  {char.name}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", letterSpacing: "0.05em", lineHeight: 1.4 }}>
                  {char.ability}
                </div>
                <div
                  className="card-footer-hint"
                  style={{
                    display: "flex", alignItems: "center", gap: 4, marginTop: 9,
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
                    color: SR_COLOR, textTransform: "uppercase" as const,
                    opacity: 0, transform: "translateY(5px)", transition: "all 0.26s",
                  }}
                >
                  View Profile <ChevronRight size={11} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Character modal ── */}
      <AnimatePresence>
        {activeChar && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveChar(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(3,1,12,0.93)", backdropFilter: "blur(18px)" }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="modal-inner"
              style={{
                position: "relative", zIndex: 10,
                width: "100%", maxWidth: 900,
                background: "#08080F",
                border: `1px solid rgba(${SR_RGB},0.22)`,
                borderRadius: 2, overflow: "hidden",
                maxHeight: "90vh",
                boxShadow: `0 0 80px rgba(${SR_RGB},0.12), 5px 5px 0 rgba(${SR_RGB},0.08)`,
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setActiveChar(null)}
                style={{
                  position: "absolute", top: 14, right: 14, zIndex: 50,
                  width: 32, height: 32, borderRadius: 2,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <X size={16} />
              </button>

              {/* Left — image */}
              <div className="modal-img" style={{ position: "relative", background: "#05050C" }}>
                <img
                  src={activeChar.image}
                  alt={activeChar.fullName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* fade to right for desktop / fade down for mobile */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to right, transparent 55%, #08080F 100%)",
                }} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, #08080F 0%, transparent 40%)",
                }} />
              </div>

              {/* Right — info */}
              <div className="modal-body">

                {/* Role badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14,
                  padding: "3px 11px", borderRadius: 2,
                  border: `1px solid rgba(${SR_RGB},0.35)`,
                  background: `rgba(${SR_RGB},0.1)`,
                  fontSize: 8, letterSpacing: "0.24em", fontWeight: 700,
                  color: SR_COLOR, textTransform: "uppercase" as const,
                }}>
                  {activeChar.role}
                </div>

                {/* Name */}
                <h2 className="bb" style={{
                  fontSize: "clamp(26px,4vw,42px)", letterSpacing: "0.03em",
                  color: "#fff", lineHeight: 0.9, marginBottom: 8,
                }}>
                  {activeChar.fullName}
                </h2>
                <div style={{
                  width: 44, height: 2, background: SR_COLOR, marginBottom: 20,
                  boxShadow: `0 0 10px rgba(${SR_RGB},0.65)`,
                }} />

                {/* Age */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 18 }}>
                  <span style={{
                    padding: "4px 12px", borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em",
                  }}>
                    Age {activeChar.age}
                  </span>
                </div>

                {/* Ability */}
                <div style={{
                  padding: "13px 15px", borderRadius: 2, marginBottom: 18,
                  border: `1px solid rgba(${SR_RGB},0.22)`,
                  background: `rgba(${SR_RGB},0.07)`,
                }}>
                  <div style={{
                    fontSize: 8, letterSpacing: "0.28em", fontWeight: 700,
                    color: `rgba(${SR_RGB},0.7)`, textTransform: "uppercase" as const,
                    marginBottom: 7, display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <Zap size={10} /> Ability
                  </div>
                  <div className="bb" style={{ fontSize: 17, letterSpacing: "0.04em", color: "#fff" }}>
                    {activeChar.ability}
                  </div>
                </div>

                {/* Biography */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 8, letterSpacing: "0.28em", fontWeight: 700,
                    color: "rgba(255,255,255,0.25)", textTransform: "uppercase" as const, marginBottom: 9,
                  }}>
                    Biography
                  </div>
                  <p style={{
                    fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.52)",
                    lineHeight: 1.82,
                    borderLeft: `2px solid rgba(${SR_RGB},0.4)`, paddingLeft: 13,
                  }}>
                    {activeChar.bio}
                  </p>
                </div>

                {/* Stats */}
                <div style={{
                  padding: "16px 16px", borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}>
                  <div style={{
                    fontSize: 8, letterSpacing: "0.28em", fontWeight: 700,
                    color: "rgba(255,255,255,0.25)", textTransform: "uppercase" as const,
                    marginBottom: 16, display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <Activity size={10} /> Stats
                  </div>

                  {/* Strength */}
                  <div style={{ marginBottom: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", letterSpacing: "0.2em" }}>STRENGTH</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{activeChar.stats.strength}/10</span>
                    </div>
                    <div className="stat-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${activeChar.stats.strength * 10}%` }}
                        transition={{ duration: 0.72, delay: 0.15 }}
                        style={{ height: "100%", background: "linear-gradient(to right, #EF4444, #F87171)" }}
                      />
                    </div>
                  </div>

                  {/* Intelligence */}
                  <div style={{ marginBottom: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#06B6D4", letterSpacing: "0.2em" }}>INTELLIGENCE</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{activeChar.stats.intelligence}/10</span>
                    </div>
                    <div className="stat-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${activeChar.stats.intelligence * 10}%` }}
                        transition={{ duration: 0.72, delay: 0.27 }}
                        style={{ height: "100%", background: "linear-gradient(to right, #06B6D4, #67E8F9)" }}
                      />
                    </div>
                  </div>

                  {/* Speed */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: SR_COLOR, letterSpacing: "0.2em" }}>SPEED</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{activeChar.stats.speed}/10</span>
                    </div>
                    <div className="stat-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${activeChar.stats.speed * 10}%` }}
                        transition={{ duration: 0.72, delay: 0.39 }}
                        style={{ height: "100%", background: `linear-gradient(to right, ${SR_COLOR}, #A78BFA)` }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
