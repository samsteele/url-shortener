import { APIGatewayProxyHandler } from "aws-lambda";
import { getUrlFromShortCode } from "../lib/dynamo";

export const handler: APIGatewayProxyHandler = async (event) => {
    const shortCode = event.pathParameters?.shortCode;

  if (!shortCode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing short code" }),
    };
  }

  try {
    const longUrl = await getUrlFromShortCode(shortCode);

    if (!longUrl) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Short code not found" }),
      };
    }

    return {
      statusCode: 301,
      headers: { Location: longUrl },
      body: '',
    };

  } catch (err: unknown) {

    console.error(err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unknown error" }),
    };
  }
}