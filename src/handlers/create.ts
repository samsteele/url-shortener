import { APIGatewayProxyHandler } from 'aws-lambda';
import { createShortUrlCode } from '../lib/dynamo';
import { ShortCodeCollisionError } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {

    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Request body is required" })
        };
    }

    let longUrl: string;

    try {
        const body = JSON.parse(event.body);
        longUrl = body.longUrl;
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid JSON body" })
            };
        }

        throw error;
    }

    if (!longUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "longUrl is required" })
        };
    }

    try {
        const shortUrlCode = await createShortUrlCode(longUrl);

        return {
            statusCode: 201,
            body: JSON.stringify({ shortUrlCode })
        };
    } catch (error: unknown) {

        if (error instanceof ShortCodeCollisionError) {
            return {
                statusCode: 503,
                body: JSON.stringify({ error: error.message })
            };
        }

        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Unknown error" })
        };
    }
}