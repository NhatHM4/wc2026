import CryptoJS from 'crypto-js';

const PASSWORD = "tatcavianhchiemthanyeu";

export const decryptData = (encryptedBase64: string): string | null => {
  try {
    const hash = CryptoJS.SHA256(PASSWORD);
    const key = hash;
    const iv = CryptoJS.lib.WordArray.create(hash.words.slice(0, 4));

    const decrypted = CryptoJS.AES.decrypt(encryptedBase64, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      throw new Error("Empty decryption output");
    }
    return decryptedText;
  } catch (error) {
    console.error("Giải mã dữ liệu thất bại:", error);
    return null;
  }
};
