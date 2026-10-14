import cors, { type CorsOptions } from 'cors';
import { config } from '../config/env.js';

export const corsOptions: CorsOptions = {
  origin(requestOrigin, callback) {
    // Allow non-browser tools (e.g. curl, postman) or matching origin
    if (!requestOrigin) {
      return callback(null, true);
    }

    const isAllowed =
      config.frontendOrigins.includes('*') ||
      config.frontendOrigins.includes(requestOrigin) ||
      (config.env === 'development' && requestOrigin.startsWith('http://localhost:'));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${requestOrigin} not permitted by CORS policy.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);
