import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Session token expires in 7 days
const TOKEN_EXPIRY = '7d';

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Validate environment variables
  if (!JWT_SECRET || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error('Missing required environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  try {
    const { username, password } = JSON.parse(event.body || '{}');

    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create JWT token
      const token = jwt.sign(
        {
          username,
          iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          token,
          expiresIn: TOKEN_EXPIRY,
        }),
      };
    }

    // Invalid credentials
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid credentials' }),
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
