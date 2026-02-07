"use client";

import { useState } from "react";
import { aiEngine } from "../lib/ai-engine";
import { cryptoEngine } from "../lib/crypto-engine";
import { notarizeOnChain } from "../lib/blockchain-engine";
import Highlighter from "react-highlight-words";

export default function OmniVaultDashboard() {
  // State Management
  const [fileContent, setFileContent] = useState<string>("");
  const [passphrase, setPassphrase] = useState<string>("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [encryptionDetails, setEncryptionDetails] = useState<any>(null);
  const [txHash, setTxHash] = useState<string>("");
  
  // Status Flags
  const [isScanning, setIsScanning] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isNotarizing, setIsNotarizing] = useState(false);

  // 1. Universal AI Scanning Logic (Handles TXT and PDF)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        try {
          // 1. Import modules as namespaced objects
          const pdfjsModule = await import('pdfjs-dist/build/pdf');
          const pdfjsWorkerModule = await import('pdfjs-dist/build/pdf.worker.entry');
          
          // 2. Safely extract the library and worker paths
          const pdfjs = pdfjsModule.default || pdfjsModule;
          const pdfjsWorker = pdfjsWorkerModule.default || pdfjsWorkerModule;

          // 3. Set the worker source
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

  // 2. Encryption Logic (Layer A)
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

  // 3. Blockchain Notarization Logic (Layer B)
  const handleNotarization = async () => {
    if (!encryptionDetails?.fileHash) return;

    setIsNotarizing(true);
    try {
      const receipt = await notarizeOnChain(encryptionDetails.fileHash);
      setTxHash(receipt.hash);
      alert("Success! Document Fingerprint anchored to Blockchain.");
    } catch (error: any) {
      console.error(error);
      alert("Blockchain Transaction Failed. Ensure MetaMask is connected.");
    } finally {
      setIsNotarizing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold text-indigo-700 tracking-tight">OmniVault</h1>
          <p className="text-slate-500 mt-3 text-lg">AI-Powered Privacy & Blockchain Governance Framework</p>
        </header>

        <div className="space-y-6">
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
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">AI Verdict</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${scanResult.isSensitive ? "bg-red-200 text-red-800" : "bg-emerald-200 text-emerald-800"}`}>
                    {scanResult.isSensitive ? "Sensitive Data Found" : "Safe Content"}
                  </span>
                </div>
                <p className="text-lg font-medium text-slate-800 mb-2">Sector: {scanResult.sector}</p>
                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-600 mb-2">Security Preview (On-Device):</p>
                  <div className="p-4 bg-white border border-slate-200 rounded-lg max-h-60 overflow-y-auto font-mono text-sm leading-relaxed shadow-inner">
                    <Highlighter
                      highlightClassName="bg-yellow-200 text-red-800 px-1 rounded font-bold"
                      searchWords={scanResult.entities?.map((e: any) => e.word) || []}
                      autoEscape={true}
                      textToHighlight={fileContent}
                    />
                  </div>
                  {scanResult.entities && scanResult.entities.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      {scanResult.entities.map((entity: any, i: number) => (
                        <div key={i} className="text-xs bg-white/70 p-2 rounded border border-red-100 flex justify-between shadow-sm">
                          <span className="font-bold text-red-600">{entity.type}</span>
                          <span className="text-slate-400 font-mono">Index: {entity.index}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Zero-Knowledge Encryption
            </h2>
            <div className="space-y-4">
              <input 
                type="password"
                placeholder="Enter private passphrase..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button 
                onClick={handleEncrypt}
                disabled={!fileContent || isEncrypting}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-100"
              >
                {isEncrypting ? "Encrypting Locally..." : "Generate Secure Hash"}
              </button>
            </div>
            {encryptionDetails && (
              <div className="mt-6 p-5 bg-slate-900 rounded-xl">
                <p className="text-indigo-400 font-mono text-[10px] uppercase tracking-widest mb-2 font-bold">SHA-256 Digital Fingerprint</p>
                <p className="text-slate-300 font-mono text-xs break-all leading-relaxed">{encryptionDetails.fileHash}</p>
              </div>
            )}
          </section>

          {encryptionDetails && (
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                Immutable Governance
              </h2>
              <button 
                onClick={handleNotarization}
                disabled={isNotarizing || txHash !== ""}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:bg-slate-300 transition-all shadow-lg shadow-emerald-100"
              >
                {isNotarizing ? "Awaiting Block Confirmation..." : txHash ? "Successfully Notarized" : "Anchor to Hardhat Network"}
              </button>
              {txHash && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-blue-800 text-xs font-bold uppercase mb-1">Blockchain Transaction ID</p>
                  <p className="text-blue-600 font-mono text-[10px] break-all">{txHash}</p>
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="mt-12 text-center text-slate-400 text-xs">
          OmniVault v1.0.0 • Local-First Architecture • No Data Ever Leaves Your Device
        </footer>
      </div>
    </main>
  );
}