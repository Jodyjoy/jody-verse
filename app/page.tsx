import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Shield } from "lucide-react"; // <--- Add Shield

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500 selection:text-white">
      
      {/* 1. HERO SECTION (Project Rift Focus) */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Gradient & Placeholder Image */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a] z-10" />
        <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/1e1e2e/FFF?text=Project+Rift+Art')] bg-cover bg-center opacity-40" />
        
        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-10">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-600/20 text-blue-400 text-sm font-bold tracking-widest mb-6 border border-blue-600/30 backdrop-blur-md">
                LATEST CHAPTER RELEASED
            </span>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-2xl">
                PROJECT RIFT
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                In a world where flow dictates power, one punch changes everything. 
                Experience the raw energy of Kenya's first infinite-canvas manga.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                    href="/read" 
                    className="group flex items-center gap-3 px-8 py-4 bg-blue-600 rounded-full font-bold text-lg hover:bg-blue-500 transition-all hover:scale-105 shadow-[0_0_40px_rgba(37,99,235,0.3)]"
                >
                    <BookOpen className="group-hover:rotate-12 transition-transform" /> 
                    Start Reading
                </Link>
               <Link 
  href="/wiki" 
  className="px-8 py-4 rounded-full border border-gray-700 font-bold hover:bg-gray-800 transition"
>
  View Characters
</Link>
            </div>
        </div>
      </section>

      {/* 2. TRENDING SECTION (Urithi) */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
            <Sparkles className="text-yellow-400" />
            <h2 className="text-3xl font-bold tracking-tight">Trending on Jody-verse</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* CARD 1: URITHI (Links to /novel) */}
            <Link href="/novel" className="group block relative h-[450px] rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-gray-600 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-900/20">
                {/* Card Background Image */}
                <div className="absolute inset-0 bg-[url('https://placehold.co/600x800/2a2a2a/FFF?text=Urithi+Cover')] bg-cover bg-center opacity-60 group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                
                {/* Card Text */}
                <div className="absolute bottom-0 left-0 p-8 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3 block">Novel • Sci-Fi</span>
                    <h3 className="text-4xl font-bold mb-3 text-white group-hover:text-yellow-400 transition-colors">URITHI</h3>
                    <p className="text-gray-400 line-clamp-2 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        The awakening has begun. In the heart of Nairobi, ancient bloodlines clash with modern tech.
                    </p>
                    <div className="flex items-center text-sm font-bold text-white">
                        Read Now <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                </div>
            </Link>

           <Link
            href="/license" 
            className="group px-8 py-4 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500 hover:text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 flex items-center gap-2"
          >
            <Shield size={20} className="group-hover:rotate-12 transition-transform" /> 
            <span>Get License</span>
          </Link>

            {/* CARD 2: COMING SOON */}
             <div className="group relative h-[450px] rounded-3xl overflow-hidden bg-[#0f0f0f] border border-gray-800 border-dashed flex items-center justify-center hover:bg-[#161616] transition">
                <div className="text-center p-8 opacity-50">
                    <h3 className="text-2xl font-bold text-gray-400 mb-2">Coming Soon</h3>
                    <p className="text-gray-600 text-sm">More stories loading...</p>
                </div>
            </div>

        </div>
      </section>

      {/* 3. FOOTER */}
      <footer className="border-t border-gray-800 py-12 text-center text-gray-600 text-sm">
        <p>&copy; 2026 Jody-verse. Crafted in Kenya. 🇰🇪</p>
      </footer>

    </main>
  );
}