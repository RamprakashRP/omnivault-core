// Layer A: Client-Side Security Logic
export class OmniVaultCrypto {
  private algorithm = { name: "AES-GCM", length: 256 };

  // Derive a cryptographic key from a user passphrase
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

  // Encrypt the document locally
  async encryptFile(fileData: string, passphrase: string) {
    const key = await this.getEncryptionKey(passphrase);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit unique IV
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(fileData);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    // Concatenate IV + Ciphertext for storage
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Generate SHA-256 Hash for the Blockchain (Layer B)
    const fileHashBuffer = await crypto.subtle.digest("SHA-256", combined);
    const fileHash = Array.from(new Uint8Array(fileHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      encryptedBlob: btoa(String.fromCharCode(...combined)), // Base64 for cloud
      fileHash,
      timestamp: Date.now()
    };
  }
}

export const cryptoEngine = new OmniVaultCrypto();