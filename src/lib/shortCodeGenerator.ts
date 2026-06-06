import { randomBytes } from "crypto";

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

export function generateShortCode(): string {
    const bytes = randomBytes(CODE_LENGTH);

    return Array.from(bytes)
        .map(byte => CHARSET[byte % CHARSET.length])
        .join('');
}