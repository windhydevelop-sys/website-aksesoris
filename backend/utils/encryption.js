const crypto = require('crypto-js');

// Encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_not_secure_change_this';

// Encrypt sensitive data
const encrypt = (text) => {
  try {
    return crypto.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt sensitive data
const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText;
  }

  try {
    const bytes = crypto.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(crypto.enc.Utf8);

    // If the result is an empty string but the input was not, 
    // it's likely not a valid ciphertext or wrong key
    if (!decrypted && encryptedText) {
      return encryptedText;
    }

    return decrypted;
  } catch (error) {
    // If decryption fails, return the original text (might be plain text)
    return encryptedText;
  }
};

// Hash sensitive data (one-way encryption for PINs/passwords)
const hashSensitive = (text) => {
  try {
    return crypto.SHA256(text).toString();
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
};

module.exports = {
  encrypt,
  decrypt,
  hashSensitive
};