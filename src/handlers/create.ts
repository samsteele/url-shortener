import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { createShortUrlCode } from '../lib/dynamo';
import { CreateRequestSchema, ShortCodeCollisionError } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {

    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Request body is required' })
        };
    }

    let parsed: z.infer<typeof CreateRequestSchema>;

    try {
        parsed = CreateRequestSchema.parse(JSON.parse(event.body));
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid JSON body' })
            };
        }
        if (error instanceof z.ZodError) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: error.issues[0].message })
            };
        }
        throw error;
    }

    try {
        const shortUrlCode = await createShortUrlCode(parsed.longUrl);

        return {
            statusCode: 201,
            body: JSON.stringify({ shortUrl: `${process.env.BASE_URL}/${shortUrlCode}` })
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
            body: JSON.stringify({ error: 'Unknown error' })
        };
    }
}
