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
  try {
    const bytes = crypto.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(crypto.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
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