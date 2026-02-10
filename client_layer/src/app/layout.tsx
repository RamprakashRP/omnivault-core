import "./globals.css";
import Link from "next/link";
import { UserCircle, Search, ShoppingBag, PlusSquare, Database } from "lucide-react";
import { OmniAuthProvider } from "@/components/AuthProvider";
import ProfileCircle from "@/components/ProfileCircle"; // We will create this next

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {/* Step 1: Wrap everything in the AWS Auth Provider */}
        <OmniAuthProvider>
          
          {/* TOP NAVBAR */}
          <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center gap-8">
              
              {/* Logo */}
              <Link href="/" className="text-2xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-indigo-500 bg-clip-text text-transparent">
                OMNIVAULT
              </Link>

              {/* Global Search */}
              <div className="flex-1 max-w-xl relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search dataset hash..." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                />
              </div>

              {/* Nav Links */}
              <div className="flex items-center gap-6 text-sm font-bold text-slate-400">
                <Link href="/buy" className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <ShoppingBag size={18} /> Buy
                </Link>
                <Link href="/list" className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <PlusSquare size={18} /> List
                </Link>
                <Link href="/assets" className="hover:text-indigo-400 transition-colors flex items-center gap-2 text-indigo-300">
                  <Database size={18} /> My Assets
                </Link>
                
                {/* Profile Circle Component (Handles Google Login/Logout) */}
                <ProfileCircle />
              </div>
            </div>
          </nav>

          <main className="p-8">{children}</main>

        </OmniAuthProvider>
      </body>
    </html>
  );
}