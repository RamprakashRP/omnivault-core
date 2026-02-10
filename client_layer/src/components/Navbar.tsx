"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown, Wallet } from "lucide-react";

export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Sync with MetaMask to show the connected "Account"
  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
        if (accounts.length > 0) setWalletAddress(accounts[0]);
      }
    };
    checkWallet();
  }, []);

  return (
    <nav className="flex items-center gap-6">
      {/* Navigation Links */}
      <Link href="/buy" className="text-sm font-bold text-slate-400 hover:text-emerald-400">Buy</Link>
      <Link href="/list" className="text-sm font-bold text-slate-400 hover:text-emerald-400">List</Link>
      <Link href="/assets" className="text-sm font-bold text-slate-400 hover:text-indigo-400">My Assets</Link>

      {/* Profile Circle Wrapper */}
      <div className="relative">
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-emerald-500 transition-all overflow-hidden p-1"
        >
          {/* If logged in with Google/AWS, we can put their image here */}
          <User className="text-slate-500" />
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Physical Identity</p>
                <p className="text-sm font-bold text-slate-200">user@gmail.com</p>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                  <Wallet size={10} /> Linked Wallet
                </p>
                <p className="text-[10px] font-mono text-emerald-500 truncate mt-1">
                  {walletAddress || "Not Connected"}
                </p>
              </div>

              <button className="w-full mt-2 flex items-center gap-2 text-xs font-bold text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}