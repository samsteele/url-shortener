export interface UrlItem {
    shortCode: string;
    longUrl: string;
    createdAt: number;
    ttl: number
}

export class ShortCodeCollisionError extends Error {
    constructor() {
        super("Failed to generate a unique short code");
        this.name = "ShortCodeCollisionError";
    }
}