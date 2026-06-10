import { z } from 'zod';

// If the user omits a scheme (e.g. "google.com"), assume https.
// Anything that already carries a scheme is left untouched so that
// non-http(s) schemes (javascript:, data:, file:, ...) fail validation below.
const withDefaultScheme = (val: unknown): unknown => {
    if (typeof val !== 'string') return val;
    const trimmed = val.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const CreateRequestSchema = z.object({
    // Restrict to http/https, then normalise via the URL parser so the stored
    // value can't contain CR/LF or other characters that survive raw input.
    longUrl: z.preprocess(withDefaultScheme, z.url({ protocol: /^https?$/ }))
        .transform((val) => new URL(val).href)
});

export type CreateRequest = z.infer<typeof CreateRequestSchema>;

export interface UrlItem {
    shortCode: string;
    longUrl: string;
    createdAt: number;
    ttl: number
}

export class ShortCodeCollisionError extends Error {
    constructor() {
        super('Failed to generate a unique short code');
        this.name = 'ShortCodeCollisionError';
    }
}