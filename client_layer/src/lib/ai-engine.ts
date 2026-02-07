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
        
        // Define patterns with Global (g) flag for multiple matches
        const piiPatterns = [
            { type: "Email Address", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
            { type: "Phone Number", regex: /\b\d{10}\b/g },
            { type: "SSN (PII)", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
            { type: "Medical ID (PHI)", regex: /\bMRN\d{6,9}\b/gi }
        ];

        piiPatterns.forEach(({ type, regex }) => {
            let match;
            // The "Sliding Window": loop through all matches in the text
            while ((match = regex.exec(text)) !== null) {
                found.push({
                    word: match[0],    // The actual sensitive text
                    type: type,        // The category (SSN, Email, etc.)
                    index: match.index // The exact character position for highlighting
                });
            }
        });

        return found;
    }
}

export const aiEngine = new OmniVaultAI();