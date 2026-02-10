"use client";
import { useAuth } from "react-oidc-context";

export default function ProfilePage() {
  const auth = useAuth();

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-slate-900 border border-slate-800 rounded-2xl">
      <h1 className="text-2xl font-black mb-6 bg-gradient-to-r from-emerald-400 to-indigo-500 bg-clip-text text-transparent">
        IDENTITY PASSPORT
      </h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Physical Identity (Google)</p>
          <p className="text-emerald-400 font-mono">{auth.user?.profile.email || "Not Logged In"}</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Digital Identity (MetaMask)</p>
          <p className="text-indigo-400 font-mono">Linked Wallet Address Will Appear Here</p>
        </div>
      </div>
    </div>
  );
}