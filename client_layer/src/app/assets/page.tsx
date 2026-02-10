"use client";

import { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { Database, Download, Cpu, ShieldCheck, Lock, Clock, Hash, Loader2, FileSpreadsheet } from "lucide-react";
import VaultNotification, { NotificationType } from "@/components/VaultNotification";

export default function MyAssetsPage() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<"LISTED" | "BOUGHT">("LISTED");
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Notification State
  const [notification, setNotification] = useState<{msg: string, type: NotificationType} | null>(null);

  const showNotify = (msg: string, type: NotificationType) => setNotification({ msg, type });

  useEffect(() => {
    const fetchAssets = async () => {
      if (!auth.user?.profile.email) return;
      try {
        const res = await fetch(`/api/link-identity?email=${auth.user.profile.email}`);
        const data = await res.json();
        if (data.success) {
          setAssets(data.assets || []);
        }
      } catch (e) { showNotify("Failed to fetch vault index", "critical"); }
      finally { setIsLoading(false); }
    };
    fetchAssets();
  }, [auth.user]);

  // FEATURE 1: CSV Export Logic
  const exportAuditTrail = () => {
    if (assets.length === 0) return showNotify("No assets to export", "moderate");

    const headers = ["File Name", "SHA-256 Hash", "Wallet Address", "Action", "Timestamp"];
    const rows = assets.map(a => [
      `"${a.fileName}"`, `"${a.assetId}"`, `"${a.walletAddress}"`, a.action, `"${new Date(a.timestamp).toISOString()}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `OmniVault_Audit_${auth.user?.profile.email}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotify("Audit Trail Exported Successfully", "important");
  };

  const filteredAssets = assets.filter(a => a.action === activeTab);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      {notification && (
        <VaultNotification 
          message={notification.msg} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Vault Assets</h1>
          <p className="text-slate-500 text-sm italic">Audit trail of physical-digital identity links.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={exportAuditTrail}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase rounded-xl border border-slate-700 transition-all"
          >
            <FileSpreadsheet size={14} /> Export Audit
          </button>

          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-2xl">
            <button onClick={() => setActiveTab("LISTED")} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === "LISTED" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500"}`}>My Listings</button>
            <button onClick={() => setActiveTab("BOUGHT")} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === "BOUGHT" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500"}`}>Purchases</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin text-indigo-500 mx-auto" size={40} /></div>
        ) : filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => (
            <div key={asset.assetId} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between group hover:border-slate-600 transition-all gap-8">
              <div className="flex items-center gap-6 w-full">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${activeTab === 'LISTED' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                  {activeTab === 'LISTED' ? <Lock className="text-emerald-500" size={28} /> : <ShieldCheck className="text-indigo-500" size={28} />}
                </div>

                <div className="space-y-3 flex-1 min-w-0">
                  <h3 className="font-bold text-slate-200 text-xl truncate tracking-tight">{asset.fileName}</h3>
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800">
                      <Clock size={12} className="text-indigo-400" /> {new Date(asset.timestamp).toLocaleString()}
                    </span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(asset.sha256); showNotify("Hash Copied to Clipboard", "moderate"); }}
                      className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-indigo-500 transition-all"
                    >
                      <Hash size={12} className="text-emerald-400" /> {asset.assetId.substring(0, 16)}...
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full lg:w-auto">
                {activeTab === "LISTED" ? (
                  <button className="w-full lg:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-slate-800 hover:bg-emerald-600 text-white text-[10px] font-black uppercase rounded-2xl transition-all shadow-lg group">
                    <Download size={18} /> Download
                  </button>
                ) : (
                  <button onClick={() => window.location.href='/buy'} className="w-full lg:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-2xl transition-all shadow-xl shadow-indigo-900/40">
                    <Cpu size={18} /> Open Training Room
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
            <Database className="mx-auto text-slate-800 mb-6 opacity-50" size={64} />
            <p className="text-slate-600 font-black uppercase text-sm tracking-[0.2em]">Vault Records Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}