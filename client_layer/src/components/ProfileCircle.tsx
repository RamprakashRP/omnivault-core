"use client";

import { useAuth } from "react-oidc-context";
import { UserCircle, LogOut, Loader2, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

export default function ProfileCircle() {
  const auth = useAuth();
  const [isLinking, setIsLinking] = useState(false);

  const handleSignOut = () => {
    const currentOrigin = window.location.origin;
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    auth.removeUser();

    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(currentOrigin)}`;
  };

  const handleLinkWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    setIsLinking(true);

    try {
      const accounts = await (window.ethereum as any).request({ method: "eth_requestAccounts" });
      const wallet = accounts[0];

      const res = await fetch("/api/link-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth.user?.profile.email,
          walletAddress: wallet
        })
      });

      if (res.ok) alert("Physical Identity Linked to Wallet!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLinking(false);
    }
  };

  if (auth.isLoading) return <Loader2 className="w-6 h-6 animate-spin text-slate-500" />;

  if (auth.isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={handleLinkWallet}
          disabled={isLinking}
          className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 rounded-full hover:bg-emerald-500/20 transition-all"
        >
          {isLinking ? <Loader2 size={10} className="animate-spin" /> : <LinkIcon size={10} />}
          LINK WALLET
        </button>

        <span className="text-[10px] font-mono text-slate-400 hidden md:block">
          {auth.user?.profile.email}
        </span>

        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-red-500 transition-all overflow-hidden group"
        >
          <UserCircle className="text-slate-500 group-hover:hidden" />
          <LogOut className="text-red-500 hidden group-hover:block w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => auth.signinRedirect()}
      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-tighter rounded-full transition-all shadow-lg shadow-indigo-500/20"
    >
      Sign In
    </button>
  );
}