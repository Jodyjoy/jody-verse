"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Shield, Zap, Users,
  ChevronRight, Play, Menu, X, Flame, Sparkles, Star
} from "lucide-react";
import UserBadge from "../components/UserBadge";
import { supabase } from "../lib/supabaseClient"; 
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

interface ReadingHistory {
  [key: string]: {
    chapter: string;
    page?: number;
    timestamp: number;
    title: string;
  };
}

const STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } },
  item: { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } } },
};

export default function Home() {
  const [history, setHistory] = useState<ReadingHistory | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null); 
  
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("user_reading_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);

    const checkUserSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUserSession();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLatestRead = () => {
    if (!history) return null;
    const items = Object.entries(history).map(([mangaId, data]) => ({ mangaId, ...data }));
    if (items.length === 0) return null;
    return items.sort((a, b) => b.timestamp - a.timestamp)[0];
  };

  const latestRead = getLatestRead();

  return (
    <main
      className="min-h-screen text-white overflow-x-hidden font-sans relative"
      style={{ background: "linear-gradient(160deg, #05030f 0%, #080618 40%, #060412 100%)" }}
    >
      {/* ============================================================
          GLOBAL STYLES
      ============================================================ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --royal:    #6C3BFF;
          --royal-lt: #8B63FF;
          --sapphire: #1E3AFF;
          --cerulean: #0EA5E9;
          --gold:     #C9973A;
          --gold-lt:  #F0C060;
          --cream:    #F5F0E8;
          --void:     #05030f;
          --surface:  rgba(255,255,255,0.04);
          --border:   rgba(255,255,255,0.07);
          --border-gold: rgba(201,151,58,0.3);
          --border-royal: rgba(108,59,255,0.35);
        }

        * { box-sizing: border-box; }
        body { background: var(--void); }

        .font-display  { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .font-serif    { font-family: 'Cinzel', serif; }
        .font-body     { font-family: 'DM Sans', sans-serif; }

        /* Animated gradient border */
        .border-animate {
          position: relative;
          background: var(--surface);
          border: 1px solid transparent;
          background-clip: padding-box;
        }
        .border-animate::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, var(--royal) 0%, transparent 50%, var(--cerulean) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .border-animate:hover::before { opacity: 1; }

        .border-animate-gold::before {
          background: linear-gradient(135deg, var(--gold) 0%, transparent 50%, #8b0000 100%);
        }

        /* Noise grain overlay */
        .grain::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          mix-blend-mode: overlay;
          border-radius: inherit;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.02); }
        }
        .pulse-bg { animation: pulse-slow 7s ease-in-out infinite; }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--sapphire) 30%, var(--royal) 70%, transparent);
          opacity: 0.4;
        }
      `}</style>

      {/* ============================================================
          BACKGROUND — Deep ambient orbs
      ============================================================ */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div style={{
          position:"absolute", top:"-15%", left:"-10%",
          width:"55vw", height:"55vw", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(108,59,255,0.18) 0%, transparent 70%)",
          filter:"blur(60px)"
        }} />
        <div style={{
          position:"absolute", top:"25%", right:"-15%",
          width:"50vw", height:"50vw", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
          filter:"blur(80px)"
        }} />
        <div style={{
          position:"absolute", bottom:"5%", left:"20%",
          width:"40vw", height:"25vw", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(30,58,255,0.1) 0%, transparent 70%)",
          filter:"blur(70px)"
        }} />
      </div>

      {/* ============================================================
          NAVBAR
      ============================================================ */}
      <nav style={{
        position:"fixed", top:0, left:0, width:"100%", zIndex:50,
        transition:"all 0.4s ease",
        background: scrolled ? "rgba(5,3,15,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        padding: scrolled ? "14px 0" : "22px 0",
      }}>
        <div style={{ maxWidth:"1400px", margin:"0 auto", padding:"0 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          <Link href="/" style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:"10px", zIndex:60 }}>
            <div style={{
              width:38, height:38, borderRadius:10,
              background:"linear-gradient(135deg, var(--royal) 0%, var(--sapphire) 100%)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Cinzel', serif", fontWeight:900, fontSize:18, color:"#fff",
              boxShadow:"0 0 20px rgba(108,59,255,0.5)"
            }}>J</div>
            <span style={{ fontFamily:"'Cinzel', serif", fontWeight:700, fontSize:15, letterSpacing:"0.15em", color:"#fff", textTransform:"uppercase" }}>Jody-Verse</span>
          </Link>

          <div className="hidden md:flex" style={{ gap:"2.5rem", alignItems:"center" }}>
            {[["Manga", "/read"], ["Novels", "/novel"], ["Database", "/wiki"]].map(([label, href]) => (
              <Link key={label} href={href} style={{
                fontFamily:"'DM Sans', sans-serif", fontWeight:600, fontSize:11,
                letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)",
                textDecoration:"none", transition:"color 0.3s"
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              >{label}</Link>
            ))}
          </div>

          <div className="hidden md:block" style={{ zIndex:60 }}>
            <UserBadge />
          </div>

          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", zIndex:60, padding:8 }}>
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity:0, x:"100%" }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:"100%" }}
            transition={{ type:"spring", damping:30, stiffness:300 }}
            style={{
              position:"fixed", inset:0, zIndex:40,
              background:"rgba(5,3,15,0.97)",
              backdropFilter:"blur(30px)",
              paddingTop:100, paddingLeft:24, paddingRight:24,
              display:"flex", flexDirection:"column", gap:8
            }}
          >
            <div style={{ marginBottom:24 }}>
              <p style={{ fontFamily:"'DM Sans'", fontSize:10, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:16 }}>Navigation</p>
              {[["Manga", "/read"], ["Novels", "/novel"], ["Wiki Database", "/wiki"]].map(([label, href]) => (
                <Link key={label} href={href} onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"20px 0", borderBottom:"1px solid rgba(255,255,255,0.06)",
                    fontFamily:"'Bebas Neue', sans-serif", fontSize:32, letterSpacing:"0.06em",
                    color:"#fff", textDecoration:"none"
                  }}>
                  {label}
                  <ChevronRight style={{ color:"var(--royal)" }} size={20} />
                </Link>
              ))}
            </div>
            <div style={{ marginTop:24, transform:"scale(1.1)", transformOrigin:"left center" }}>
              <UserBadge />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          HERO — Clean Center-Aligned Wide-Screen Screen Setup
      ============================================================ */}
      <section ref={heroRef} style={{ position:"relative", width:"100%", minHeight:"100vh", display:"flex", alignItems:"center", overflow:"hidden" }}>

        <motion.div style={{ y: heroBgY, opacity: heroOpacity, position:"absolute", inset:0, zIndex:0 }}>
          {/* Animated gradient mesh */}
          <motion.div 
            animate={{ opacity: [0.08, 0.14, 0.08] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(14,165,233,0.08) 25%, rgba(99,102,241,0.08) 50%, rgba(124,58,237,0.1) 75%, rgba(14,165,233,0.06) 100%)" }} 
          />
          {/* Dynamic orb glow */}
          <motion.div 
            animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 25% 45%, rgba(124,58,237,0.16) 0%, transparent 45%), radial-gradient(circle at 75% 25%, rgba(14,165,233,0.12) 0%, transparent 40%)" }} 
          />
          {/* Dark overlay gradient */}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(5,3,15,1) 0%, rgba(5,3,15,0.8) 45%, rgba(5,3,15,0.4) 100%)" }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(5,3,15,1) 0%, transparent 68%)" }} />
        </motion.div>

        <div style={{ position:"absolute", top:0, left:"5%", bottom:0, width:1, background:"linear-gradient(to bottom, transparent, rgba(14,165,233,0.2) 30%, rgba(14,165,233,0.2) 70%, transparent)", zIndex:1 }} />
        <div style={{ position:"absolute", top:0, right:"10%", bottom:0, width:1, background:"linear-gradient(to bottom, transparent, rgba(108,59,255,0.2) 30%, rgba(108,59,255,0.2) 70%, transparent)", zIndex:1 }} className="hidden md:block" />

        <div style={{
          position:"absolute", left:"4%", top:"50%",
          transform:"translateY(-50%) rotate(-90deg)",
          fontFamily:"'DM Sans'", fontSize:9, letterSpacing:"0.35em",
          textTransform:"uppercase", color:"rgba(14,165,233,0.6)",
          zIndex:5
        }} className="hidden lg:block">
          Chapter Archives — Vol. 1
        </div>

        <div style={{ position:"relative", zIndex:10, maxWidth:1400, margin:"0 auto", padding:"0 1.5rem", paddingTop:120, paddingBottom:80, width:"100%" }}>
          <motion.div variants={STAGGER.container} initial="hidden" animate="show">

            <motion.div variants={STAGGER.item} style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:28, flexWrap: "wrap" }}>
              <div style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"8px 16px", borderRadius:100,
                border:"1px solid rgba(14,165,233,0.4)",
                background:"rgba(14,165,233,0.08)",
                backdropFilter:"blur(12px)"
              }}>
                <Flame size={12} style={{ color:"var(--cerulean)" }} />
                <span style={{ fontFamily:"'DM Sans'", fontWeight:700, fontSize:10, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--cerulean)" }}>New Chapter Available</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4, padding:"8px 14px", borderRadius:100, border:"1px solid rgba(108,59,255,0.3)", background:"rgba(108,59,255,0.08)" }}>
                <Star size={10} style={{ color:"var(--royal-lt)" }} fill="currentColor" />
                <span style={{ fontFamily:"'DM Sans'", fontWeight:700, fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--royal-lt)" }}>Top Rated</span>
              </div>
            </motion.div>

            <motion.div variants={STAGGER.item}>
              <h1 style={{
                fontFamily:"'Bebas Neue', sans-serif",
                fontSize:"clamp(56px, 13vw, 180px)",
                lineHeight:0.88,
                letterSpacing:"0.03em",
                margin:0, marginBottom:"0.1em",
                color:"#fff",
                textShadow:"0 0 80px rgba(108,59,255,0.2)"
              }}>
                READ.<br />
                <span style={{ filter:"drop-shadow(0 0 40px rgba(14,165,233,0.4))", display: "inline-block" }}>
                  <span style={{
                    background:"linear-gradient(135deg, var(--cerulean) 0%, var(--royal-lt) 50%, #fff 100%)",
                    WebkitBackgroundClip:"text", backgroundClip:"text",
                    WebkitTextFillColor:"transparent",
                    display:"inline-block"
                  }}>SURVIVE.</span>
                </span>
              </h1>
              <div style={{ width:120, height:3, background:"linear-gradient(90deg, var(--cerulean) 0%, transparent 100%)", marginTop:16, marginBottom:32, borderRadius:2 }} />
            </motion.div>

            <motion.p variants={STAGGER.item} style={{
              fontFamily:"'DM Sans'", fontWeight:300, fontSize:"clamp(13px, 1.5vw, 18px)",
              color:"rgba(255,255,255,0.55)", maxWidth:520, lineHeight:1.75,
              marginBottom:48
            }}>
              The exclusive digital home of <strong style={{ color:"#fff", fontWeight:600 }}>Spectral Rift</strong> and{" "}
              <strong style={{ color:"#fff", fontWeight:600 }}>Urithi</strong>. 
              Immerse yourself in the lore, track your journey, and join a community of dedicated readers.
            </motion.p>

            <motion.div variants={STAGGER.item} style={{ display:"flex", flexWrap:"wrap", gap:14, alignItems:"center" }}>
              <Link href="/read" style={{ textDecoration:"none" }}>
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:10,
                  padding:"16px 32px", borderRadius:100,
                  background:"linear-gradient(135deg, var(--royal) 0%, var(--sapphire) 100%)",
                  color:"#fff", fontFamily:"'DM Sans'", fontWeight:700,
                  fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase",
                  boxShadow:"0 0 40px rgba(108,59,255,0.5)",
                  cursor:"pointer", transition:"all 0.3s ease"
                }}>
                  <Play size={14} fill="currentColor" /> Enter Library
                </div>
              </Link>
              <Link href="/wiki" style={{ textDecoration:"none" }}>
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:10,
                  padding:"15px 28px", borderRadius:100,
                  border:"1px solid rgba(14,165,233,0.5)",
                  background:"rgba(14,165,233,0.07)",
                  color:"var(--cerulean)", fontFamily:"'DM Sans'", fontWeight:700,
                  fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase",
                  cursor:"pointer", transition:"all 0.3s ease", backdropFilter:"blur(10px)"
                }}>
                  View Characters <ArrowRight size={14} />
                </div>
              </Link>
            </motion.div>

            <motion.div variants={STAGGER.item} style={{ display:"flex", gap:32, marginTop:60, paddingTop:36, borderTop:"1px solid rgba(255,255,255,0.07)", flexWrap: "wrap" }}>
              {[["2", "Ongoing Series"], ["47+", "Chapters"], ["∞", "Pages of Lore"]].map(([num, label]) => (
                <div key={label}>
                  <div style={{ fontFamily:"'Bebas Neue'", fontSize:36, lineHeight:1, color:"#fff", letterSpacing:"0.04em" }}>{num}</div>
                  <div style={{ fontFamily:"'DM Sans'", fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginTop:4 }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5 }}
          style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:8, zIndex:10 }}
        >
          <span style={{ fontFamily:"'DM Sans'", fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)" }}>Scroll</span>
          <motion.div animate={{ y:[0,8,0] }} transition={{ repeat:Infinity, duration:1.8 }}
            style={{ width:1, height:40, background:"linear-gradient(to bottom, rgba(14,165,233,0.6), transparent)" }} />
        </motion.div>
      </section>

      {/* ============================================================
          RESUME READING WIDGET
      ============================================================ */}
      <AnimatePresence>
        {latestRead && (
          <motion.div initial={{ opacity:0, y:-30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}
            style={{ maxWidth:1400, margin:"0 auto", padding:"0 1.5rem", marginTop:-40, position:"relative", zIndex:20 }}
          >
            <Link href={`/read/${latestRead.chapter}?manga=${latestRead.mangaId}&page=${latestRead.page || 0}`} style={{ textDecoration:"none" }}>
              <div style={{
                display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between",
                gap:20, padding:"20px 24px", borderRadius:20,
                border:"1px solid rgba(108,59,255,0.35)",
                background:"linear-gradient(135deg, rgba(108,59,255,0.12) 0%, rgba(30,58,255,0.08) 100%)",
                backdropFilter:"blur(24px)",
                position:"relative", overflow:"hidden",
                boxShadow:"0 8px 40px rgba(108,59,255,0.15)",
                cursor:"pointer"
              }}>
                <div style={{ position:"absolute", right:0, top:0, bottom:0, width:300, background:"linear-gradient(to left, rgba(108,59,255,0.15), transparent)", pointerEvents:"none" }} />
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{
                    width:48, height:48, borderRadius:"50%",
                    background:"linear-gradient(135deg, rgba(108,59,255,0.8) 0%, rgba(30,58,255,0.8) 100%)",
                    display:"flex", alignItems:"center", justifyContent:"center"
                  }}>
                    <Play size={16} fill="white" color="white" style={{ marginLeft:2 }} />
                  </div>
                  <div>
                    <span style={{ fontFamily:"'DM Sans'", fontWeight:700, fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", color:"var(--cerulean)", display:"block", marginBottom:4 }}>Continue Reading</span>
                    <h4 style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:"0.05em", color:"#fff", margin:0 }}>
                      {latestRead.title} <span style={{ color:"rgba(255,255,255,0.4)", fontSize:14, fontFamily:"'DM Sans'", fontWeight:400, letterSpacing:0 }}>Ch. {latestRead.chapter}</span>
                    </h4>
                  </div>
                </div>
                <div style={{
                  display:"flex", alignItems:"center", gap:8, padding:"10px 20px",
                  borderRadius:100, border:"1px solid rgba(255,255,255,0.1)",
                  background:"rgba(255,255,255,0.05)",
                  fontFamily:"'DM Sans'", fontWeight:700, fontSize:9,
                  letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.7)"
                }}>
                  Jump In <ChevronRight size={12} />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth:1400, margin:"60px auto 0", padding:"0 1.5rem" }}>
        <div className="divider" />
      </div>

      {/* ============================================================
          SECTION HEADER
      ============================================================ */}
      <section style={{ maxWidth:1400, margin:"0 auto", padding:"60px 1.5rem 40px" }}>
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"flex-end", justifyContent:"space-between", gap:20, marginBottom:40 }}>
          <div>
            <p style={{ fontFamily:"'DM Sans'", fontWeight:700, fontSize:10, letterSpacing:"0.35em", textTransform:"uppercase", color:"var(--cerulean)", marginBottom:8 }}>The Library</p>
            <h2 style={{ fontFamily:"'Bebas Neue'", fontSize:"clamp(40px, 6vw, 80px)", letterSpacing:"0.04em", lineHeight:0.9, color:"#fff", margin:0 }}>The Archives</h2>
          </div>
          <Link href="/license" style={{
            display:"flex", alignItems:"center", gap:8, textDecoration:"none",
            fontFamily:"'DM Sans'", fontWeight:700, fontSize:10,
            letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)",
          }}>
            <Shield size={12} /> Licensing & Terms
          </Link>
        </div>

        {/* ============================================================
            BENTO GRID (MOBILE OPTIMIZED: NO FIXED ASPECT RATIOS)
        ============================================================ */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(12, 1fr)", gridTemplateRows:"auto", gap:20 }}>

          {/* ── SPECTRAL RIFT — Flagship Feature Card ── */}
          <motion.div
            initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}
            style={{ gridColumn:"span 12", gridRow:1 }}
            className="md:col-span-8"
          >
            <Link href="/read?manga=1" style={{ textDecoration:"none", display:"block" }}>
              <div className="border-animate grain" style={{
                position:"relative", borderRadius:28, overflow:"hidden",
                minHeight: 460, /* 👈 Mobile height fix: Removed aspectRatio 16/9 */
                cursor:"pointer", transition:"transform 0.5s ease"
              }}>
                <div style={{
                  position:"absolute", inset:0,
                  backgroundImage:"url('/spectral_rift_cover.jpeg')",
                  backgroundSize:"cover", backgroundPosition:"center",
                  opacity:0.55, transition:"all 0.8s ease"
                }} className="group-hover:opacity-50 group-hover:scale-105" />
                
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(3,2,10,1) 0%, rgba(3,2,10,0.7) 45%, rgba(3,2,10,0.2) 100%)" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(3,2,10,1) 0%, rgba(3,2,10,0.4) 50%, transparent 100%)" }} />

                {/* Badges: Using flexWrap so they don't break the layout on small phones */}
                <div style={{ position:"absolute", top:24, left:24, right:24, display:"flex", flexWrap:"wrap", gap:8, zIndex:10 }}>
                  <span style={{ padding:"6px 12px", borderRadius:8, background:"rgba(14,165,233,0.9)", fontFamily:"'DM Sans'", fontWeight:800, fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase", color:"#000" }}>Flagship Release</span>
                  <span style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.1)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.15)", fontFamily:"'DM Sans'", fontWeight:700, fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.7)" }}>Supernatural</span>
                  <div style={{ display:"flex", alignItems:"center", gap:2, marginLeft:"auto" }}>
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="var(--cerulean)" color="var(--cerulean)" />)}
                  </div>
                </div>

                {/* Content: Reduced padding to fit mobile screens */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"28px", zIndex:10 }}>
                  <p style={{ fontFamily:"'DM Sans'", fontWeight:600, fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", color:"var(--cerulean)", marginBottom:8, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>ID: 01 · Flagship Series</p>
                  <h3 style={{ fontFamily:"'Bebas Neue'", fontSize:"clamp(42px, 10vw, 88px)", letterSpacing:"0.04em", lineHeight:0.85, color:"#fff", marginBottom:12, textShadow:"0 2px 10px rgba(0,0,0,0.95), 0 4px 30px rgba(0,0,0,0.95)" }}>SPECTRAL RIFT</h3>
                  <p style={{ fontFamily:"'DM Sans'", fontWeight:300, fontSize:13, color:"rgba(255,255,255,0.7)", maxWidth:460, lineHeight:1.6, marginBottom:24, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                    Shadows leak into Nairobi. Squad 7 is out of time. Dive into the core timeline.
                  </p>
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    padding:"12px 24px", borderRadius:100,
                    background:"linear-gradient(135deg, var(--cerulean) 0%, var(--sapphire) 100%)",
                    fontFamily:"'DM Sans'", fontWeight:800, fontSize:10,
                    letterSpacing:"0.15em", textTransform:"uppercase", color:"#fff",
                    boxShadow:"0 0 30px rgba(14,165,233,0.4)"
                  }}>
                    Read Manga <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ── TALES OF 47 — Tall card ── */}
          <motion.div
            initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.1 }}
            style={{ gridColumn:"span 12" }}
            className="md:col-span-4"
          >
            <Link href="/novel" style={{ textDecoration:"none", display:"block", height:"100%" }}>
              <div className="border-animate grain" style={{
                position:"relative", borderRadius:28, overflow:"hidden",
                minHeight:460, cursor:"pointer",
                background:"linear-gradient(160deg, rgba(201,151,58,0.08) 0%, rgba(5,3,15,0) 60%)",
                border:"1px solid rgba(201,151,58,0.2)"
              }}>
                <div style={{ position:"absolute", top:"-20%", right:"-20%", width:"200%", height:"200%", background:"radial-gradient(circle at 70% 30%, rgba(201,151,58,0.08) 0%, transparent 60%)", pointerEvents:"none" }} />
                <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(45deg, rgba(201,151,58,0.03) 0px, rgba(201,151,58,0.03) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(-45deg, rgba(201,151,58,0.03) 0px, rgba(201,151,58,0.03) 1px, transparent 1px, transparent 24px)" }} />

                <div style={{ padding:28, display:"flex", flexDirection:"column", height:"100%", minHeight:460, justifyContent:"space-between", position:"relative", zIndex:2 }}>
                  <div>
                    <div style={{ display:"inline-flex", padding:12, borderRadius:14, border:"1px solid rgba(201,151,58,0.3)", background:"rgba(201,151,58,0.08)", marginBottom:24 }}>
                      <BookOpen size={20} style={{ color:"var(--gold)" }} />
                    </div>
                    <p style={{ fontFamily:"'DM Sans'", fontWeight:600, fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(201,151,58,0.8)", marginBottom:8 }}>Light Novel · Ongoing</p>
                    <h3 style={{ fontFamily:"'Bebas Neue'", fontSize:46, letterSpacing:"0.04em", lineHeight:0.85, color:"#fff", marginBottom:12 }}>Tales of<br />the 47</h3>
                    <p style={{ fontFamily:"'DM Sans'", fontWeight:300, fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>Folk legends reimagined. The forty-seven whose stories were never told.</p>
                  </div>
                  <div>
                    <div style={{ height:1, background:"linear-gradient(90deg, rgba(201,151,58,0.3), transparent)", marginBottom:20 }} />
                    <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--gold)" }}>
                      Read Folklore <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ── URITHI ── */}
          <motion.div
            initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.15 }}
            style={{ gridColumn:"span 12" }}
            className="md:col-span-5"
          >
            <Link href="/read?manga=2" style={{ textDecoration:"none", display:"block" }}>
              <div className="border-animate-gold grain" style={{
                position:"relative", borderRadius:28, overflow:"hidden",
                minHeight:420, cursor:"pointer",
                border:"1px solid rgba(201,151,58,0.2)",
                background:"linear-gradient(160deg, rgba(201,151,58,0.06) 0%, rgba(5,3,15,0) 60%)"
              }}>
                <div style={{ position:"absolute", inset:0, backgroundImage:"url('/urithi_cover.jpeg')", backgroundSize:"cover", backgroundPosition:"center", opacity:0.45 }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(3,2,10,1) 0%, rgba(3,2,10,0.6) 50%, transparent 100%)" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(3,2,10,0.9) 0%, transparent 60%)" }} />

                <div style={{ position:"absolute", top:24, right:24, display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--gold)", boxShadow:"0 0 12px rgba(201,151,58,1)", animation:"pulse 2s infinite" }} />
                  <span style={{ fontFamily:"'DM Sans'", fontWeight:700, fontSize:8, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--gold)" }}>Live Series</span>
                </div>

                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"28px", zIndex:2 }}>
                  <p style={{ fontFamily:"'DM Sans'", fontWeight:600, fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", color:"var(--gold-lt)", marginBottom:8 }}>ID: 02 · Dark Fantasy</p>
                  <h3 style={{ fontFamily:"'Bebas Neue'", fontSize:46, letterSpacing:"0.04em", color:"#fff", marginBottom:10, lineHeight:0.9 }}>URITHI</h3>
                  <p style={{ fontFamily:"'DM Sans'", fontWeight:300, fontSize:13, color:"rgba(255,255,255,0.7)", maxWidth:280, lineHeight:1.6, marginBottom:20 }}>Ancient bloodlines. A modern reckoning.</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--gold)" }}>
                    Read Manga <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ── INFO GRID ── */}
          <motion.div
            initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.2 }}
            style={{ gridColumn:"span 12", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}
            className="md:col-span-7"
          >
            <Link href="/wiki" style={{ textDecoration:"none" }}>
              <div className="border-animate grain" style={{
                position:"relative", borderRadius:24, overflow:"hidden",
                minHeight:160, cursor:"pointer", padding:24,
                display:"flex", flexDirection:"column", justifyContent:"space-between",
                border:"1px solid rgba(255,255,255,0.07)",
                background:"rgba(255,255,255,0.03)"
              }}>
                <Users size={24} style={{ color:"rgba(255,255,255,0.3)", marginBottom:16 }} />
                <div>
                  <h4 style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:"0.04em", color:"#fff", marginBottom:2 }}>World Bible</h4>
                  <p style={{ fontFamily:"'DM Sans'", fontWeight:600, fontSize:8, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)" }}>Character Database</p>
                </div>
              </div>
            </Link>

            <div style={{
              position:"relative", borderRadius:24, overflow:"hidden",
              minHeight:160, padding:24, cursor:"not-allowed", opacity:0.5,
              display:"flex", flexDirection:"column", justifyContent:"space-between",
              border:"1px solid rgba(255,255,255,0.05)",
              background:"rgba(255,255,255,0.02)"
            }}>
              <div style={{ position:"absolute", top:12, right:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 8px", borderRadius:6, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(0,0,0,0.3)" }}>
                  <Shield size={8} style={{ color:"rgba(255,255,255,0.4)" }} />
                  <span style={{ fontFamily:"'DM Sans'", fontWeight:700, fontSize:7, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)" }}>Classified</span>
                </div>
              </div>
              <Zap size={24} style={{ color:"rgba(255,255,255,0.2)", marginBottom:16 }} />
              <div>
                <h4 style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:"0.04em", color:"#fff", marginBottom:2 }}>One-Shots</h4>
                <p style={{ fontFamily:"'DM Sans'", fontWeight:600, fontSize:8, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)" }}>Coming Soon</p>
              </div>
            </div>

            {/* Join Community CTA - Automatically hides when user logs in! */}
            <AnimatePresence>
              {!user && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  style={{ gridColumn:"span 2" }}
                >
                  <div style={{
                    borderRadius:24, padding:"24px",
                    background:"linear-gradient(135deg, rgba(108,59,255,0.15) 0%, rgba(30,58,255,0.1) 100%)",
                    border:"1px solid rgba(108,59,255,0.25)",
                    display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:16
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:"rgba(108,59,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Sparkles size={18} style={{ color:"var(--royal-lt)" }} />
                      </div>
                      <div>
                        <h4 style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:"0.04em", color:"#fff", margin:0, marginBottom:2 }}>Join the Reading Faction</h4>
                        <p style={{ fontFamily:"'DM Sans'", fontWeight:400, fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>Track progress, unlock lore.</p>
                      </div>
                    </div>
                    <Link href="/login" style={{ textDecoration:"none", width: "100%" }}>
                      <div style={{
                        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                        padding:"12px 20px", borderRadius:100, width: "100%",
                        background:"rgba(108,59,255,0.3)", border:"1px solid rgba(108,59,255,0.5)",
                        fontFamily:"'DM Sans'", fontWeight:700, fontSize:9,
                        letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--royal-lt)",
                      }}>
                        Create Account <ArrowRight size={12} />
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </section>

      {/* ============================================================
          MARQUEE TICKER
      ============================================================ */}
      <div style={{ overflow:"hidden", padding:"40px 0", borderTop:"1px solid rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.05)", marginTop:60 }}>
        <motion.div
          animate={{ x:["0%", "-50%"] }} transition={{ repeat:Infinity, duration:30, ease:"linear" }}
          style={{ display:"flex", gap:60, whiteSpace:"nowrap" }}
        >
          {Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ display:"flex", gap:60, alignItems:"center" }}>
              {["Spectral Rift", "Urithi", "Tales of the 47", "Cyberpunk", "Supernatural", "Crafted in Kenya", "New Chapter Out"].map(t => (
                <span key={t} style={{ fontFamily:"'Bebas Neue'", fontSize:16, letterSpacing:"0.2em", color:"rgba(255,255,255,0.15)" }}>
                  {t} <span style={{ color:"var(--cerulean)", opacity:0.4, marginLeft:20 }}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ============================================================
          FOOTER
      ============================================================ */}
      <footer style={{ padding:"60px 1.5rem 40px", borderTop:"1px solid rgba(255,255,255,0.05)", position:"relative", zIndex:10 }}>
        <div style={{ maxWidth:1400, margin:"0 auto" }}>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:40, marginBottom:48 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{
                  width:38, height:38, borderRadius:10,
                  background:"linear-gradient(135deg, var(--royal) 0%, var(--sapphire) 100%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"'Cinzel'", fontWeight:900, fontSize:18, color:"#fff",
                }}>J</div>
                <span style={{ fontFamily:"'Cinzel'", fontWeight:700, fontSize:15, letterSpacing:"0.15em", textTransform:"uppercase", color:"#fff" }}>Jody-Verse</span>
              </div>
              <p style={{ fontFamily:"'DM Sans'", fontWeight:300, fontSize:12, color:"rgba(255,255,255,0.35)", maxWidth:280, lineHeight:1.7 }}>A world built in Kenya. Stories that transcend borders.</p>
            </div>

            <div style={{ display:"flex", gap:40, flexWrap:"wrap" }}>
              <div>
                <p style={{ fontFamily:"'DM Sans'", fontWeight:700, fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:16 }}>Library</p>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[["Manga", "/read"], ["Novels", "/novel"], ["Wiki", "/wiki"]].map(([l,h]) => (
                    <Link key={l} href={h} style={{ fontFamily:"'DM Sans'", fontWeight:400, fontSize:12, color:"rgba(255,255,255,0.4)", textDecoration:"none" }}>{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontFamily:"'DM Sans'", fontWeight:700, fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:16 }}>Account</p>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[["Command Center", "/account"], ["Licensing", "/license"]].map(([l,h]) => (
                    <Link key={l} href={h} style={{ fontFamily:"'DM Sans'", fontWeight:400, fontSize:12, color:"rgba(255,255,255,0.4)", textDecoration:"none" }}>{l}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="divider" style={{ marginBottom:28 }} />
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:16, alignItems:"center" }}>
            <p style={{ fontFamily:"'DM Sans'", fontWeight:400, fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em" }}>
              &copy; {new Date().getFullYear()} Jody-verse. All rights reserved.
            </p>
            <p style={{ fontFamily:"'DM Sans'", fontWeight:600, fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em" }}>
              Crafted in Kenya 🇰🇪
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}