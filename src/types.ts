import { z } from 'zod';

export const CreateRequestSchema = z.object({
    longUrl: z.url()
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