"use client";

import { useState } from "react";
import { aiEngine } from "../lib/ai-engine";
import { cryptoEngine } from "../lib/crypto-engine";
import Highlighter from "react-highlight-words";
import { ethers } from "ethers";
import { notarizeOnChain, buyAccess, fetchDocumentDetails, CONTRACT_ADDRESS, ABI } from "../lib/blockchain-engine";

export default function OmniVaultDashboard() {
  // --- State Management ---
  const [fileContent, setFileContent] = useState<string>("");
  const [passphrase, setPassphrase] = useState<string>("");
  const [dataPrice, setDataPrice] = useState<string>("0.01"); 
  const [scanResult, setScanResult] = useState<any>(null);
  const [encryptionDetails, setEncryptionDetails] = useState<any>(null);
  const [txHash, setTxHash] = useState<string>("");
  
  // --- Marketplace States ---
  const [searchHash, setSearchHash] = useState("");
  const [foundDoc, setFoundDoc] = useState<any>(null);
  const [isBuying, setIsBuying] = useState(false);

  // --- Status Flags ---
  const [isScanning, setIsScanning] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isNotarizing, setIsNotarizing] = useState(false);

  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const [trainingScript, setTrainingScript] = useState("");
  const [trainingResult, setTrainingResult] = useState<any>(null);

  // --- 1. Universal AI Scanning Logic (Handles TXT and PDF) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        try {
          const pdfjsModule: any = await import('pdfjs-dist/build/pdf');
          const pdfjsWorkerModule: any = await import('pdfjs-dist/build/pdf.worker.entry');
          
          const pdfjs = pdfjsModule.default || pdfjsModule;
          const pdfjsWorker = pdfjsWorkerModule.default || pdfjsWorkerModule;

          pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map((item: any) => item.str);
            fullText += strings.join(" ") + "\n";
          }
          extractedText = fullText;
        } catch (err) {
          console.error("PDF Scan Error:", err);
          alert("Could not read PDF correctly.");
        }
      } else {
        extractedText = await file.text();
      }

      if (extractedText) {
        setFileContent(extractedText);
        const result = await aiEngine.scanText(extractedText);
        setScanResult(result);
      }
    } catch (err) {
      console.error("General Scan Error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // --- 2. Encryption Logic (Layer A) ---
  const handleEncrypt = async () => {
    if (!fileContent || !passphrase) {
      alert("Please upload a file and enter a security passphrase.");
      return;
    }

    setIsEncrypting(true);
    try {
      const result = await cryptoEngine.encryptFile(fileContent, passphrase);
      setEncryptionDetails(result);
    } catch (error) {
      console.error("Encryption failed", error);
    } finally {
      setIsEncrypting(false);
    }
  };

  // --- 3. Blockchain Marketplace Logic (Layer B) ---
  const handleNotarization = async () => {
    if (!encryptionDetails?.fileHash || !encryptionDetails?.encryptedData) {
      console.error("❌ Missing Hash or Encrypted Data. Details:", encryptionDetails);
      return;
    }

    setIsNotarizing(true);
    console.log("🚀 Starting Notarization Process...");

    try {
      // STEP A: REQUEST PRESIGNED URL
      console.log("☁️ Requesting AWS Presigned URL...");
      const response = await fetch(`${window.location.origin}/api/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "secure-data.enc",
          fileType: "application/octet-stream",
        }),
      });
      
      if (!response.ok) throw new Error("API call to /api/upload-url failed");
      const { url, fileKey } = await response.json();
      console.log("✅ Received URL. File Key:", fileKey);

      // STEP B: UPLOAD TO S3
      console.log("📤 Uploading encrypted blob to S3...");
      const upload = await fetch(url, {
        method: "PUT",
        body: encryptionDetails.encryptedData,
        headers: { "Content-Type": "application/octet-stream" },
      });

      if (!upload.ok) throw new Error("AWS S3 Upload Failed");
      console.log("✅ Cloud Upload Successful!");

      // STEP C: BLOCKCHAIN REGISTRATION
      console.log("🔗 Notarizing on Blockchain...");
      const receipt = await notarizeOnChain(
        encryptionDetails.fileHash, 
        fileKey, 
        dataPrice
      );

      console.log("✅ Blockchain Receipt:", receipt.hash);
      setTxHash(receipt.hash);
      alert(`Success! Data secure in AWS. TX: ${receipt.hash}`);

    } catch (error: any) {
      console.error("💥 PROCESS FAILED:", error);
      alert("Process failed: " + (error.reason || error.message || "Unknown Error"));
    } finally {
      setIsNotarizing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold text-indigo-700 tracking-tight">OmniVault</h1>
          <p className="text-slate-500 mt-3 text-lg">AI-Powered Privacy & Marketplace Governance</p>
        </header>

        <div className="space-y-6">
          
          {/* Step 1: AI Analysis */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Local Privacy Analysis
            </h2>
            <input 
              type="file" 
              accept=".txt,.pdf"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {isScanning && <p className="mt-4 text-indigo-600 animate-pulse font-medium">AI is classifying document sensitivity...</p>}
            {scanResult && (
              <div className={`mt-6 p-4 rounded-xl border-2 ${scanResult.isSensitive ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <p className="text-lg font-medium text-slate-800 mb-2">Sector: {scanResult.sector}</p>
                <div className="mt-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-lg max-h-60 overflow-y-auto font-mono text-sm leading-relaxed shadow-inner">
                    <Highlighter
                      highlightClassName="bg-yellow-200 text-red-800 px-1 rounded font-bold"
                      searchWords={scanResult.entities?.map((e: any) => e.word) || []}
                      autoEscape={true}
                      textToHighlight={fileContent}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Encryption & Pricing */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Encryption & Marketplace Setup
            </h2>
            <div className="space-y-4">
              <input 
                type="password"
                placeholder="Enter private passphrase..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 mb-1 block">Data Market Price (ETH)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={dataPrice}
                    onChange={(e) => setDataPrice(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button 
                  onClick={handleEncrypt}
                  disabled={!fileContent || isEncrypting}
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-lg"
                >
                  {isEncrypting ? "Securing..." : "Generate Secure Hash"}
                </button>
              </div>
            </div>
            {encryptionDetails && (
              <div className="mt-6 p-5 bg-slate-900 rounded-xl">
                <p className="text-indigo-400 font-mono text-[10px] uppercase tracking-widest mb-2 font-bold">SHA-256 Digital Fingerprint</p>
                <p className="text-slate-300 font-mono text-[10px] break-all leading-relaxed">{encryptionDetails.fileHash}</p>
              </div>
            )}
          </section>

          {/* Step 3: Blockchain Notarization */}
          {encryptionDetails && (
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                Governance & Monetization
              </h2>
              <button 
                onClick={handleNotarization}
                disabled={isNotarizing || txHash !== ""}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:bg-slate-300 transition-all shadow-lg"
              >
                {isNotarizing ? "Awaiting Block..." : txHash ? "Successfully Listed" : `List for ${dataPrice} ETH`}
              </button>
              {txHash && (
                <button 
                  onClick={() => {
                    setFileContent(""); setScanResult(null); setEncryptionDetails(null); setTxHash("");
                  }}
                  className="mt-4 w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold uppercase"
                >
                  Scan Another Document
                </button>
              )}
            </section>
          )}

          {/* --- MODULE 2: MARKETPLACE EXPLORER (OUTSIDE CONDITIONAL) --- */}
          <hr className="my-12 border-slate-200" />
          <section className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <span className="bg-indigo-500 px-2 py-1 rounded text-[10px] tracking-widest font-black uppercase">AI TRAINER VIEW</span>
                Marketplace Explorer
              </h2>
              <p className="text-slate-400 text-sm">Search the blockchain for secure datasets using SHA-256 hashes.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                type="text" placeholder="Paste File Hash (SHA-256)..." value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button 
                onClick={async () => {
                  try {
                    const details = await fetchDocumentDetails(searchHash);
                    setFoundDoc({
                      hash: searchHash, url: details[0], owner: details[1],
                      price: ethers.formatEther(details[3]), isForSale: details[4]
                    });
                  } catch (e) { alert("Document not found on-chain."); }
                }}
                className="px-8 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition-all py-4 md:py-0"
              >
                Search Registry
              </button>
            </div>
            {foundDoc && (
              <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700 rounded-2xl border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Status: Listed for Sale</p>
                    <p className="text-3xl font-black text-white">{foundDoc.price} <span className="text-sm font-normal text-slate-400 uppercase">ETH</span></p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    setIsBuying(true);
                    try {
                      await buyAccess(foundDoc.hash, foundDoc.price);
                      alert("Transaction Confirmed! Access permissions updated on-chain.");
                    } catch (e: any) { alert("Purchase failed: " + e.message); }
                    finally { setIsBuying(false); }
                  }}
                  disabled={isBuying}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl"
                >
                  {isBuying ? "Confirming..." : "Purchase Access Rights"}
                </button>
                <button 
                  onClick={async () => {
                    // 1. Ensure ethereum exists
                    if (!window.ethereum) return alert("MetaMask not found");

                    // 2. Use 'as any' to fix the Eip1193Provider type error
                    const provider = new ethers.BrowserProvider(window.ethereum as any);
                    const signer = await provider.getSigner();
                    
                    // 3. CONTRACT_ADDRESS and ABI are now imported from your lib
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
                    
                    const authorized = await contract.checkAccess(foundDoc.hash, await signer.getAddress());
                    setHasAccess(authorized);
                  }}
                  className="mt-4 w-full py-2 bg-slate-700 text-white rounded-lg text-xs font-bold"
                >
                  Verify My Access Status
                </button>

                {hasAccess !== null && (
                  <p className={`mt-2 text-center text-xs font-bold ${hasAccess ? 'text-emerald-400' : 'text-red-400'}`}>
                    {hasAccess ? "✅ ACCESS GRANTED: You are an authorized trainer." : "❌ ACCESS DENIED: Purchase required."}
                  </p>
                )}

                {hasAccess && (
                  <div className="mt-8 p-6 bg-indigo-900/30 border border-indigo-500/50 rounded-2xl animate-in fade-in zoom-in duration-500">
                    <h3 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2">
                      🛡️ Secure AI Training Room
                    </h3>
                    <p className="text-[10px] text-slate-400 mb-4 italic">
                      Your code will be executed in an isolated AWS Lambda "Clean Room" without internet access.
                    </p>
                    <textarea 
                      placeholder="Paste your Python training script here (e.g., model.fit(data)...)"
                      className="w-full h-32 bg-slate-900 border border-slate-700 p-4 rounded-xl font-mono text-xs text-emerald-400 outline-none mb-4 focus:ring-1 focus:ring-indigo-500"
                      value={trainingScript}
                      onChange={(e) => setTrainingScript(e.target.value)}
                    />
                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/run-training", { // Ensure this matches folder name
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
                          alert("Training failed: Check your AWS Lambda configuration.");
                        }
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2"
                    >
                      🚀 Execute Secure Training
                    </button>
                    
                    {trainingResult && (
                      <div className="mt-6 p-4 bg-black/50 rounded-lg border border-emerald-500/30">
                        <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">Model Weights & Metrics Output:</p>
                        <pre className="text-xs text-slate-300 mt-2 font-mono leading-relaxed overflow-x-auto">
                          {JSON.stringify(trainingResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

        </div>
        <footer className="mt-12 text-center text-slate-400 text-[10px]">
          OmniVault v1.1.0 • Module 2 Marketplace Enabled • Local-First Architecture
        </footer>
      </div>
    </main>
  );
}