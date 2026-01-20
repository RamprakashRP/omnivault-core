"use client";

import { useState } from "react";
import { aiEngine } from "@/lib/ai-engine";
import { cryptoEngine } from "@/lib/crypto-engine"; // Importing our Layer A logic

export default function OmniVaultDashboard() {
  const [fileContent, setFileContent] = useState<string>("");
  const [passphrase, setPassphrase] = useState<string>(""); // New state for privacy
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [encryptionDetails, setEncryptionDetails] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      
      setIsScanning(true);
      const result = await aiEngine.scanText(text);
      setScanResult(result);
      setIsScanning(false);
    };
    reader.readAsText(file);
  };

  // The function that triggers Layer A Encryption
  const handleEncrypt = async () => {
    if (!fileContent || !passphrase) return alert("Please upload a file and enter a passphrase!");

    const result = await cryptoEngine.encryptFile(fileContent, passphrase);
    console.log("Encrypted Blob:", result.encryptedBlob);
    console.log("SHA-256 Hash:", result.fileHash);
    
    setEncryptionDetails(result);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b pb-6">
          <h1 className="text-4xl font-bold text-indigo-700">OmniVault</h1>
          <p className="text-slate-500 mt-2">Hybrid Cloud-Blockchain Data Governance Framework</p>
        </header>

        <section className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">Step 1 & 2: Privacy Scan & Key Derivation</h2>
          <div className="flex flex-col gap-6">
            <input 
              type="file" 
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            
            {/* Passphrase Input: This ensures Layer A security */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Encryption Passphrase (Stored Locally)</label>
              <input 
                type="password"
                placeholder="Enter a strong passphrase..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {isScanning && <p className="text-indigo-600 animate-pulse">AI Classifier analyzing privacy...</p>}

            {scanResult && (
              <div className={`p-4 rounded-lg border ${scanResult.isSensitive ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <h3 className="font-bold mb-1">AI Verdict: {scanResult.isSensitive ? "Sensitive" : "Safe"}</h3>
                <p className="text-sm">Sector: <span className="font-mono font-bold">{scanResult.sector}</span></p>
              </div>
            )}
          </div>
        </section>

        {/* Action Button: Triggers Encryption */}
        <button 
          onClick={handleEncrypt}
          disabled={!scanResult || !passphrase}
          className="mt-8 w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg disabled:bg-slate-300 hover:bg-indigo-700 transition-all"
        >
          Secure File & Generate Hash
        </button>

        {/* Display the Result for Verification */}
        {encryptionDetails && (
          <div className="mt-8 p-6 bg-slate-800 text-slate-200 rounded-xl font-mono text-xs break-all">
            <p className="text-emerald-400 mb-2 font-bold">DIGITAL FINGERPRINT (SHA-256):</p>
            {encryptionDetails.fileHash}
            <p className="text-indigo-400 mt-4 mb-2 font-bold">ENCRYPTED BLOB (BASE64):</p>
            {encryptionDetails.encryptedBlob.substring(0, 100)}...
          </div>
        )}
      </div>
    </main>
  );
}