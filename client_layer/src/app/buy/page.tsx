"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useAuth } from "react-oidc-context"; // 1. Import Auth for identity linking
import { Search, ShoppingCart, ShieldCheck, Activity, Cpu, Terminal } from "lucide-react";
import { getContract, fetchDocumentDetails, verifyAccess, buyAccess } from "@/lib/blockchain-engine";

export default function MarketplacePage() {
  const auth = useAuth(); // 2. Initialize Auth context
  const [searchHash, setSearchHash] = useState("");
  const [foundDoc, setFoundDoc] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  const [trainingScript, setTrainingScript] = useState('print("Initializing OmniVault Secure Session...")\n# Load data from s3_path\n# Run model.fit()');
  const [trainingResult, setTrainingResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = async () => {
    if (!searchHash) return;
    setIsProcessing(true);
    try {
      const doc = await fetchDocumentDetails(searchHash);
      
      if (!doc.url || doc.url === "") {
        alert("Hash not found on blockchain.");
        setFoundDoc(null);
      } else {
        setFoundDoc({
          fileHash: searchHash,
          url: doc.url,
          price: doc.price, 
          owner: doc.owner
        });

        const contract = await getContract();
        const provider = contract.runner?.provider as ethers.BrowserProvider; 
        if (provider) {
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
          const access = await verifyAccess(searchHash, userAddress);
          setHasAccess(access);
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed. Ensure MetaMask is connected.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = async () => {
    if (!foundDoc) return;
    setIsProcessing(true);
    try {
      // 1. Digital Ledger: Execute Blockchain Purchase
      await buyAccess(foundDoc.fileHash, foundDoc.price);
      
      // 2. Physical Index: Sync to DynamoDB for "My Assets"
      // This ensures the purchase is linked to the Google Account
      const userWallet = (window.ethereum as any)?.selectedAddress;
      const userEmail = auth.user?.profile.email;

      if (userEmail && userWallet) {
        await fetch("/api/link-identity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            walletAddress: userWallet,
            fileName: foundDoc.url, // Using URL as placeholder for name
            fileType: "application/octet-stream",
            sha256: foundDoc.fileHash,
            action: "BOUGHT", // Links it to the Purchases tab
            timestamp: new Date().toISOString()
          }),
        });
      }

      setHasAccess(true);
      alert("✅ Access Rights Granted! Verified in Physical Vault & Digital Ledger.");
    } catch (error: any) {
      alert("Purchase failed: " + (error.reason || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteTraining = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/run-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileKey: foundDoc.url, 
          trainingScript: trainingScript 
        })
      });
      const data = await res.json();
      setTrainingResult(data.results);
    } catch (e) {
      alert("Training failed. Ensure AWS Lambda is active.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
          <Search className="text-emerald-400" /> Marketplace Explorer
        </h1>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Paste SHA-256 Dataset Hash..." 
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 p-4 rounded-2xl text-sm font-mono text-emerald-500 outline-none"
          />
          <button 
            onClick={handleSearch}
            className="px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all"
          >
            {isProcessing ? "Searching..." : "Search Registry"}
          </button>
        </div>
      </div>

      {foundDoc && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] sticky top-28 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-full border border-indigo-500/20">
                  Verified Asset
                </span>
                <span className="text-slate-500 text-[10px] font-mono">
                  {foundDoc.fileHash.substring(0, 10)}...
                </span>
              </div>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Listing Price</label>
                  <p className="text-2xl font-black text-white">{foundDoc.price} ETH</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Cloud Storage Key</label>
                  <p className="text-xs font-mono text-slate-300 break-all">{foundDoc.url}</p>
                </div>
              </div>

              {!hasAccess ? (
                <button 
                  onClick={handlePurchase}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} /> {isProcessing ? "Processing..." : "Purchase Access"}
                </button>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <p className="text-emerald-400 text-xs font-black flex items-center justify-center gap-2 uppercase">
                    <ShieldCheck size={16} /> Access Rights Granted
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!hasAccess ? (
              <div className="h-full min-h-[400px] bg-slate-900/50 border border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-center p-10">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600">
                  <Terminal />
                </div>
                <h3 className="text-xl font-bold text-slate-500 uppercase tracking-tighter">Training Room Locked</h3>
                <p className="text-xs text-slate-600 max-w-xs mt-2">Isolated AWS Clean Room unlocks after purchase verification.</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                    <Cpu className="text-indigo-400" /> Secure AI Clean Room
                  </h3>
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Isolated Environment Active</span>
                  </div>
                </div>

                <textarea 
                  className="w-full h-64 bg-slate-950 border border-slate-800 p-6 rounded-2xl font-mono text-xs text-indigo-300 outline-none focus:ring-1 focus:ring-indigo-500/50"
                  value={trainingScript}
                  onChange={(e) => setTrainingScript(e.target.value)}
                />

                <button 
                  onClick={handleExecuteTraining}
                  disabled={isProcessing}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Activity className="animate-spin" /> : <Terminal size={18} />}
                  Execute Secure Training
                </button>

                {trainingResult && (
                  <div className="mt-6 p-6 bg-black/40 rounded-2xl border border-indigo-500/30 overflow-hidden">
                    <label className="text-[10px] text-indigo-400 font-black uppercase tracking-widest block mb-4">Execution Output</label>
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto italic">
                      {JSON.stringify(trainingResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}