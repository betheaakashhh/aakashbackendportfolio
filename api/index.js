import app from '../server.js';

// Export the Express app as a standard handler. Vercel's Node runtime can
// invoke this default export directly without `serverless-http`.
export default function handler(req, res) {
	return app(req, res);
}
