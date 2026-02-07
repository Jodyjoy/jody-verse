"use client";

import Link from "next/link";
import { ArrowLeft, ImageIcon } from "lucide-react";

export default function MangaIndex() {
  // Hardcoded for now until we make a 'chapters' table
  // You can add more chapters to this list manually as you finish them!
  const chapters = [
    { id: 1, title: "The Spark", pages: 3 },
    { id: 2, title: "Velocity", pages: 0 }, // Placeholder
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto mb-12 flex items-center gap-4">
        <Link href="/" className="p-3 bg-gray-900 rounded-full hover:bg-gray-800 transition">
            <ArrowLeft size={24} />
        </Link>
        <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                PROJECT RIFT: MANGA
            </h1>
            <p className="text-gray-400 mt-2">Visualizing the flow.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid gap-4">
        {chapters.map((chapter) => (
            <Link 
                key={chapter.id} 
                href={`/read/${chapter.id}`}
                className="group flex items-center justify-between p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-300"
            >
                <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                        {chapter.id}
                    </span>
                    <span className="text-xl font-medium group-hover:text-blue-400 transition">
                        {chapter.title}
                    </span>
                </div>
                <ImageIcon size={20} className="text-gray-600 group-hover:text-white transition" />
            </Link>
        ))}
      </div>
    </div>
  );
}