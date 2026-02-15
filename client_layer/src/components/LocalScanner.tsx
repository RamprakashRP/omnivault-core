"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { UploadCloud, Loader2, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { aiEngine } from "@/lib/ai-engine";

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function LocalScanner({ onAnalysisComplete }: { onAnalysisComplete: (data: any) => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMasking, setIsMasking] = useState(true);
  const [rawText, setRawText] = useState("");
  const [activeFileName, setActiveFileName] = useState("");
  const [activeFileType, setActiveFileType] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);

  const performMasking = (text: string, entities: any[], mask: boolean) => {
    if (!mask) return text;
    let masked = text;
    // naive replacement - for production, use index slicing
    // specific entities might be caught multiple times or overlap, so we start with specific high-value replacements
    const uniqueEntities = Array.from(new Set(entities.map(e => e.word))) as string[];
    uniqueEntities.forEach(word => {
      // Escape regex special characters in the word
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'g');
      masked = masked.replace(regex, "████████");
    });
    return masked;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setActiveFileName(file.name);
    setActiveFileType(file.type);

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

      // --- OMNIVAULT AI ENGINE ---
      const analysis = await aiEngine.scanText(extractedText);
      setAiResult(analysis);

      const display = performMasking(extractedText, analysis.entities, isMasking);
      // Get unique types found
      const findings = Array.from(new Set(analysis.entities.map((e: any) => e.type))) as string[];

      onAnalysisComplete({
        raw: extractedText,
        display,
        findings,
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
    if (!aiResult) return;

    const display = performMasking(rawText, aiResult.entities, newState);
    const findings = Array.from(new Set(aiResult.entities.map((e: any) => e.type))) as string[];

    onAnalysisComplete({
      raw: rawText,
      display,
      findings,
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