"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { UploadCloud, Loader2, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function LocalScanner({ onAnalysisComplete }: { onAnalysisComplete: (data: any) => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMasking, setIsMasking] = useState(true);
  const [rawText, setRawText] = useState("");
  const [activeFileName, setActiveFileName] = useState("");
  const [activeFileType, setActiveFileType] = useState("");

  const PII_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    aadhar: /[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}/g,
    secretKey: /(password|secret|api_key|token|private_key)["']?\s*[:=]\s*["']?([a-zA-Z0-9\-._~+/]{8,})/gi
  };

  const processText = (text: string, maskingActive: boolean) => {
    let display = text;
    let findings: string[] = [];

    if (text.match(PII_PATTERNS.email)) {
      findings.push("Email Addresses");
      if (maskingActive) display = display.replace(PII_PATTERNS.email, "[MASKED EMAIL]");
    }
    if (text.match(PII_PATTERNS.aadhar)) {
      findings.push("Aadhar Numbers");
      if (maskingActive) display = display.replace(PII_PATTERNS.aadhar, "[MASKED AADHAR]");
    }
    
    return { display, findings };
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setActiveFileName(file.name); // Capture the real name
    setActiveFileType(file.type); // Capture the real type
    
    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;
        
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
        extractedText = text;
      } else if (file.type.includes("image")) {
        const { data: { text } } = await Tesseract.recognize(URL.createObjectURL(file), 'eng');
        extractedText = text;
      } else {
        extractedText = await file.text();
      }

      setRawText(extractedText);
      const result = processText(extractedText, isMasking);
      
      // Pass the real name and type back to the parent page
      onAnalysisComplete({ 
        raw: extractedText, 
        ...result, 
        isMasking, 
        fileName: file.name, 
        fileType: file.type 
      });
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const toggleMasking = () => {
    const newState = !isMasking;
    setIsMasking(newState);
    const result = processText(rawText, newState);
    onAnalysisComplete({ 
      raw: rawText, 
      ...result, 
      isMasking: newState, 
      fileName: activeFileName, 
      fileType: activeFileType 
    });
  };

  return (
    <div className="w-full space-y-4">
      <input type="file" id="vault-upload" hidden onChange={handleFile} accept=".txt,.json,.pdf,image/*" />
      <label htmlFor="vault-upload" className="flex flex-col items-center justify-center w-full p-12 border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-900/40 hover:bg-indigo-500/5 transition-all cursor-pointer group">
        {isAnalyzing ? (
          <div className="text-center space-y-3">
            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
            <p className="text-[10px] font-black uppercase text-indigo-400">Deep Privacy Scan...</p>
          </div>
        ) : (
          <div className="text-center">
            <UploadCloud className="text-slate-600 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" size={40} />
            <p className="text-sm font-bold text-slate-200">Upload to Physical Vault</p>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">PDF, Text, and Images Supported</p>
          </div>
        )}
      </label>

      {rawText && (
        <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
          <div className="ml-2">
            <span className="text-[10px] font-black uppercase text-slate-500 block">Current File</span>
            <span className="text-[11px] font-bold text-slate-300">{activeFileName}</span>
          </div>
          <button 
            onClick={toggleMasking}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${isMasking ? 'bg-indigo-600 text-white' : 'bg-red-600/20 text-red-500 border border-red-500/50'}`}
          >
            {isMasking ? <EyeOff size={12} /> : <Eye size={12} />}
            {isMasking ? "Masking Enabled" : "Masking Disabled"}
          </button>
        </div>
      )}
    </div>
  );
}