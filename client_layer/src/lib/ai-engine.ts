import * as tf from '@tensorflow/tfjs';
import * as toxicity from '@tensorflow-models/toxicity';

// New Interface for Detailed Reporting
export interface DetectedEntity {
    word: string;
    type: string;
    index: number;
}

export class OmniVaultAI {
    private model: toxicity.ToxicityClassifier | null = null;

    async init() {
        if (this.model) return;
        console.log("OmniVault: Optimizing AI Engine...");
        try {
            this.model = await toxicity.load(0.9, []);
            console.log("OmniVault: AI Privacy Engine Optimized & Ready.");
            await this.model.classify(["Warmup check"]);
        } catch (error) {
            console.error("AI Initialization failed:", error);
        }
    }

    async scanText(text: string) {
        if (!this.model) await this.init();

        const startTime = performance.now();

        const sector = this.classifySector(text);
        // UPGRADED: Now returns detailed objects instead of just strings
        const entities = this.detectDetailedPII(text);

        const endTime = performance.now();
        console.log(`Scan completed in ${(endTime - startTime).toFixed(2)}ms`);

        return {
            sector,
            entities, // This list contains the "What" and "Where"
            isSensitive: entities.length > 0 || sector !== "General",
            summary: entities.length > 0
                ? `Found ${entities.length} sensitive items in a ${sector} document.`
                : "Document appears safe.",
            latency: endTime - startTime
        };
    }

    private classifySector(text: string): string {
        const doc = text.toLowerCase();
        if (doc.includes("patient") || doc.includes("diagnosis") || doc.includes("clinic")) return "Medical (PHI)";
        if (doc.includes("contract") || doc.includes("agreement") || doc.includes("court")) return "Legal";
        if (doc.includes("policy") || doc.includes("premium") || doc.includes("claim")) return "Insurance";
        if (doc.includes("invoice") || doc.includes("balance") || doc.includes("payment")) return "Financial";
        return "General";
    }

    private detectDetailedPII(text: string): DetectedEntity[] {
        const found: DetectedEntity[] = [];

        // Comprehensive Sensitive Data Patterns
        const piiPatterns = [
            // --- Personal Identifiable Information (PII) ---
            { type: "Email Address", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
            { type: "Phone Number (US)", regex: /\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g },
            { type: "SSN (US)", regex: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g },
            { type: "Passport Number", regex: /\b[A-Z]{1,2}[0-9]{6,9}\b/g },
            { type: "Date of Birth", regex: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g },
            { type: "Aadhar Number (IN)", regex: /\b[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}\b/g },

            // --- Financial Data ---
            { type: "Credit Card (Visa/Master)", regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/g },
            { type: "Amex Card", regex: /\b3[47][0-9]{13}\b/g },
            { type: "IBAN", regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/g },
            { type: "Bitcoin Address", regex: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/g },

            // --- Medical & Health (PHI) ---
            { type: "Medical Record Number (MRN)", regex: /\bMRN\d{6,9}\b/gi },
            { type: "ICD-10 Code", regex: /\b[A-TV-Z][0-9][0-9AB]\.?[0-9A-TV-Z]{0,4}\b/g },
            { type: "DEA Number", regex: /\b[A-Z]{2}[0-9]{7}\b/g },

            // --- Technical Secrets ---
            { type: "AWS Access Key", regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g },
            { type: "Private Key Block", regex: /-----BEGIN PRIVATE KEY-----/g },
            { type: "IPv4 Address", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
            { type: "MAC Address", regex: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g },

            // --- Legal Markers ---
            { type: "Confidentiality Marker", regex: /\b(CONFIDENTIAL|DO NOT DISCLOSE|PRIVILEGED)\b/gi }
        ];

        piiPatterns.forEach(({ type, regex }) => {
            let match;
            // The "Sliding Window": loop through all matches in the text
            while ((match = regex.exec(text)) !== null) {
                // Determine the classification confidence or categorize further if needed
                found.push({
                    word: match[0],    // The actual sensitive text
                    type: type,        // The category (SSN, Email, etc.)
                    index: match.index // The exact character position for highlighting
                });
            }
        });

        // Deduplication: Remove nested matches (e.g. "123" inside "123-456")
        // Simple distinct filter for now based on index
        return found.filter((item, index, self) =>
            index === self.findIndex((t) => (
                t.index === item.index && t.type === item.type
            ))
        );
    }
}

export const aiEngine = new OmniVaultAI();