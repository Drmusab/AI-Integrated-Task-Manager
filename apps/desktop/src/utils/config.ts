// @ts-nocheck
// In production (nginx), use empty string to make API calls relative to the same origin
// Nginx will proxy /api/* requests to the backend container
// In development, use the full URL to the backend
export const API_URL = process.env.REACT_APP_API_URL || '';
