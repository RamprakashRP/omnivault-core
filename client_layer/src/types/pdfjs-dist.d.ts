// client_layer/src/types/pdfjs-dist.d.ts

declare module 'pdfjs-dist/build/pdf' {
    export * from 'pdfjs-dist';
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {
    const worker: any;
    export default worker;
}

// Add these for the legacy/minified versions
declare module 'pdfjs-dist/legacy/build/pdf.min.mjs';
declare module 'pdfjs-dist/legacy/build/pdf.worker.min.mjs';