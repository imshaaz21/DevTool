/**
 * Encoder/Decoder and Hash utility functions
 */
import CryptoJS from 'crypto-js';

// Base64 encoding/decoding
export function encodeBase64(text: string): string {
    try {
        return btoa(unescape(encodeURIComponent(text)));
    } catch (error) {
        throw new Error('Failed to encode Base64');
    }
}

export function decodeBase64(encoded: string): string {
    try {
        return decodeURIComponent(escape(atob(encoded)));
    } catch (error) {
        throw new Error('Invalid Base64 string');
    }
}

// MD5 Hash using crypto-js
export function hashMD5(text: string): string {
    return CryptoJS.MD5(text).toString();
}

// Hash functions using Web Crypto API
async function hashText(text: string, algorithm: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashSHA1(text: string): Promise<string> {
    return hashText(text, 'SHA-1');
}

export async function hashSHA256(text: string): Promise<string> {
    return hashText(text, 'SHA-256');
}

export async function hashSHA512(text: string): Promise<string> {
    return hashText(text, 'SHA-512');
}
