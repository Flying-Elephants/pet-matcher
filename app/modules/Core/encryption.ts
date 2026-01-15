import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;


export function encrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    // If key is provided as hex string, it should be 64 chars for 32 bytes
    // In production, we'd want a strict error here.
    return text; // Fallback to plain text if no key is configured (dev safety)
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, "hex"), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * Decrypts a string using AES-256-GCM.
 */
export function decrypt(encryptedText: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64 || !encryptedText.includes(":")) {
    return encryptedText;
  }

  try {
    const [ivHex, tagHex, ciphertextHex] = encryptedText.split(":");
    
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, "hex"), iv);
    
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedText; // Return original if decryption fails
  }
}
