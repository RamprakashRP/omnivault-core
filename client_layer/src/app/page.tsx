"use client";

import Link from "next/link";
import { Shield, ShoppingBag, PlusSquare, Database, Lock, Cpu, Search } from "lucide-react";

export default function OmniVaultDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 animate-in fade-in duration-1000">
      
      {/* --- HERO SECTION --- */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
          <Shield size={12} /> Milestone 2: Hybrid Web3 Enabled
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
          Secure Data. <br />
          <span className="bg-gradient-to-r from-emerald-400 to-indigo-500 bg-clip-text text-transparent">
            Sovereign AI.
          </span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          The first decentralized marketplace that allows AI models to train on private data 
          without the data ever leaving the owner's vault.
        </p>
      </section>

      {/* --- MAIN NAVIGATION CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/list" className="group">
          <div className="h-full p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all duration-500 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PlusSquare className="text-emerald-500" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">List Assets</h2>
              <p className="text-slate-500 text-sm">Scan for PII, encrypt locally, and notarize your dataset on the blockchain.</p>
            </div>
            <div className="mt-8 text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              Start Listing <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </Link>

        <Link href="/buy" className="group">
          <div className="h-full p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all duration-500 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag className="text-indigo-500" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Marketplace</h2>
              <p className="text-slate-500 text-sm">Explore verified data hashes and purchase secure access rights for AI training.</p>
            </div>
            <div className="mt-8 text-indigo-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              Explore Market <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </Link>

        <Link href="/assets" className="group">
          <div className="h-full p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-amber-500/50 hover:bg-slate-800/50 transition-all duration-500 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="text-amber-500" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">My Vault</h2>
              <p className="text-slate-500 text-sm">Manage your listed datasets and access your purchased AI training environments.</p>
            </div>
            <div className="mt-8 text-amber-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              View Assets <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </Link>
      </div>

      <footer className="text-center py-10">
        <p className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">
          OmniVault Architecture v1.1 • Powered by AWS & Ethereum
        </p>
      </footer>
    </div>
  );
}