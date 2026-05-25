import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ShortCodeCollisionError, UrlItem } from '../types';
import { generateShortCode } from './shortCodeGenerator';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export async function createShortUrlCode(longUrl: string, attempts: number = 0): Promise<string> {
    
    if (attempts >= 5) {
        throw new ShortCodeCollisionError();
    }

    const item: UrlItem = {
        shortCode: generateShortCode(),
        longUrl,
        createdAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days
    }

    try {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: 'attribute_not_exists(shortCode)'
        }));
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
            return createShortUrlCode(longUrl, ++attempts);
        }
        throw error;
    }

    return item.shortCode;    
}

export async function getUrlFromShortCode(shortCode: string): Promise<string | null> {
    const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { shortCode }
    }))

    const longUrl = result.Item?.longUrl;
    return typeof longUrl === 'string' ? longUrl : null;
}