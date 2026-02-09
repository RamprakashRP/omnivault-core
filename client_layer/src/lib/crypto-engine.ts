// Layer A: Client-Side Security Logic
export class OmniVaultCrypto {
  private algorithm = { name: "AES-GCM", length: 256 };

  private async getEncryptionKey(passphrase: string) {
    const encoder = new TextEncoder();
    const pwHash = await crypto.subtle.digest("SHA-256", encoder.encode(passphrase));
    return await crypto.subtle.importKey(
      "raw",
      pwHash,
      this.algorithm.name,
      false,
      ["encrypt", "decrypt"]
    );
  }

  async encryptFile(fileData: string, passphrase: string) {
    const key = await this.getEncryptionKey(passphrase);
    const iv = crypto.getRandomValues(new Uint8Array(12)); 
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(fileData);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    const fileHashBuffer = await crypto.subtle.digest("SHA-256", combined);
    const fileHash = Array.from(new Uint8Array(fileHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // --- CRITICAL CHANGES FOR AWS S3 COMPATIBILITY ---
    return {
      // 1. Change name to 'encryptedData' to match page.tsx
      // 2. Return as a Blob (Actual binary) instead of Base64
      encryptedData: new Blob([combined], { type: "application/octet-stream" }), 
      fileHash,
      timestamp: Date.now()
    };
  }
}

export const cryptoEngine = new OmniVaultCrypto();