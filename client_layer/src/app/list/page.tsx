"use client";

import { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { cryptoEngine } from "@/lib/crypto-engine";
import { notarizeOnChain } from "@/lib/blockchain-engine";
import { 
  Lock, 
  Database, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2 
} from "lucide-react";
import LocalScanner from "@/components/LocalScanner";

// Reusable Copy Button Component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={doCopy} 
      className="p-2.5 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-all"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-500" />}
    </button>
  );
}

export default function ListDataPage() {
  const auth = useAuth();
  const [fileData, setFileData] = useState<any>(null);
  const [passphrase, setPassphrase] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [dataPrice, setDataPrice] = useState("0.05");
  const [encryptionDetails, setEncryptionDetails] = useState<any>(null);
  const [txHash, setTxHash] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);

  // Auto-generate strong passphrase using browser crypto
  const generatePassphrase = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    const pass = Array.from(crypto.getRandomValues(new Uint32Array(16)))
      .map((x) => chars[x % chars.length]).join("");
    setPassphrase(pass);
  };

  // Generate initial passphrase on mount
  useEffect(() => { generatePassphrase(); }, []);

  const handleFinalize = async () => {
    if (!fileData || !passphrase) return;
    setIsFinishing(true);
    try {
      // 1. Encrypt the specific content selected by the user
      const content = fileData.isMasking ? fileData.display : fileData.raw;
      const result = await cryptoEngine.encryptFile(content, passphrase);
      setEncryptionDetails(result);
      
      // 2. Upload to S3 with REAL filename
      const response = await fetch("/api/upload-url", { 
        method: "POST", 
        body: JSON.stringify({ fileName: fileData.fileName }) 
      });
      const { url, fileKey } = await response.json();
      await fetch(url, { method: "PUT", body: result.encryptedData });
      
      // 3. Blockchain Notarization
      const receipt = await notarizeOnChain(result.fileHash, fileKey, dataPrice);
      setTxHash(receipt.hash);

      // 4. Sync REAL metadata to DynamoDB
      const userWallet = (window.ethereum as any)?.selectedAddress;
      if (auth.user?.profile.email && userWallet) {
        await fetch("/api/link-identity", {
          method: "POST",
          body: JSON.stringify({
            email: auth.user.profile.email,
            walletAddress: userWallet,
            fileName: fileData.fileName, // NOW DYNAMIC
            fileType: fileData.fileType,
            sha256: result.fileHash,
            action: "LISTED"
          }),
        });
      }
      
      alert("🚀 Process Success: " + fileData.fileName + " listed!");
    } catch (e: any) { 
      console.error(e);
      alert(e.message); 
    } finally { 
      setIsFinishing(false); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-700">
      
      {/* LEFT COLUMN: Local AI Scanner & Preview */}
      <div className="space-y-6">
        <LocalScanner onAnalysisComplete={setFileData} />
        
        {fileData && (
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-4 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> Local Scrutiny Preview
            </h3>
            <div className="bg-black/60 p-5 rounded-2xl font-mono text-[11px] text-slate-400 h-64 overflow-y-auto border border-slate-800 leading-relaxed italic scrollbar-thin scrollbar-thumb-slate-700">
              {fileData.display}
            </div>
            {fileData.findings && fileData.findings.length > 0 && (
              <div className="text-[10px] font-bold text-amber-500 uppercase bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 flex items-center gap-2">
                <Database size={12} /> AI Detected: {fileData.findings.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Security Settings & Marketplace Notarization */}
      <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[3rem] space-y-8 shadow-inner">
        
        {/* Passphrase Section */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase flex justify-between items-center">
            Vault Passphrase
            <button 
              onClick={generatePassphrase} 
              className="text-indigo-400 hover:rotate-180 transition-all duration-500 flex items-center gap-1"
            >
              <RefreshCw size={12} /> Regenerate
            </button>
          </label>
          <div className="relative group">
            <input 
              type={showPass ? "text" : "password"} 
              value={passphrase} 
              readOnly
              className="w-full bg-black/40 border border-slate-800 p-5 rounded-2xl text-sm font-mono text-indigo-400 pr-28 outline-none focus:border-indigo-500/50 transition-colors" 
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                onClick={() => setShowPass(!showPass)} 
                className="p-2 text-slate-500 hover:text-white transition-colors"
                title={showPass ? "Hide Passphrase" : "Show Passphrase"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <CopyButton text={passphrase} />
            </div>
          </div>
        </div>

        {/* Pricing and SHA-256 Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Market Price (ETH)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={dataPrice} 
                  onChange={(e) => setDataPrice(e.target.value)} 
                  className="w-full bg-black/40 border border-slate-800 p-4 rounded-2xl text-xl font-bold text-white mt-1 outline-none focus:ring-1 focus:ring-indigo-500" 
                />
            </div>
            {encryptionDetails && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
                    <div className="overflow-hidden">
                        <p className="text-[9px] font-black text-emerald-500 uppercase">SHA-256 Fingerprint</p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">{encryptionDetails.fileHash}</p>
                    </div>
                    <CopyButton text={encryptionDetails.fileHash} />
                </div>
            )}
        </div>

        {/* Finalize Button */}
        <button 
          onClick={handleFinalize} 
          disabled={!fileData || isFinishing} 
          className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl shadow-2xl shadow-indigo-500/30 transition-all uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed group"
        >
          {isFinishing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Notarizing...</span>
            </>
          ) : (
            <>
              <Lock size={20} className="group-hover:scale-110 transition-transform" />
              <span>Finalize & List on Chain</span>
            </>
          )}
        </button>

        {/* Success Transaction Hash */}
        {txHash && (
          <div className="p-5 bg-black/60 border border-slate-800 rounded-3xl flex items-center justify-between group animate-in slide-in-from-top-2">
            <div className="overflow-hidden">
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Digital Ledger Hash</p>
              <p className="text-[10px] font-mono text-slate-500 truncate">{txHash}</p>
            </div>
            <CopyButton text={txHash} />
          </div>
        )}
      </div>
    </div>
  );
}