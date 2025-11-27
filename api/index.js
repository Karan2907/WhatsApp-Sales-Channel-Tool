/**
 * Vercel Serverless Function Entry Point
 * Wraps the Express app for Vercel deployment
 */

const app = require('../saas/firebase-server');

// Export the Express app as a Vercel serverless function
module.exports = app;
