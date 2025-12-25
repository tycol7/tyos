import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
const API_URL = process.env.API_URL || '';
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN || '';

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Validate environment variables
  if (!JWT_SECRET || !API_URL || !API_AUTH_TOKEN) {
    console.error('Missing required environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  // Extract and validate JWT from Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing or invalid authorization header' }),
    };
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    // Verify JWT token
    jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT verification failed:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid or expired session token' }),
    };
  }

  // Extract the API path from the request
  // Path format: /.netlify/functions/api-proxy/albums
  // We want to extract everything after /api-proxy/
  const path = event.path.replace('/.netlify/functions/api-proxy', '') || '/';

  // Build the full API URL
  const apiUrl = `${API_URL}${path}${event.rawQuery ? `?${event.rawQuery}` : ''}`;

  try {
    // Proxy the request to the Fly.io API
    const response = await fetch(apiUrl, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_AUTH_TOKEN}`, // Use the server-side API token
      },
      body: event.body || undefined,
    });

    const data = await response.text();

    // Return the API response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
      body: data,
    };
  } catch (error) {
    console.error('API proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to proxy request to API' }),
    };
  }
};
