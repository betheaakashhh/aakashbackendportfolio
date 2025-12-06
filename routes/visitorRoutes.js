import express from 'express';
import { trackVisitor, getVisitorCount, getUniqueVisitors } from '../controllers/visitorController.js';

const router = express.Router();

// POST - Track a new visitor (increments count)
router.post('/visitor', trackVisitor);

// GET - Get current visitor count (optional)
router.get('/visitor', getVisitorCount);

// GET - Get unique visitors (optional)
router.get('/visitor/unique', getUniqueVisitors);

export default router;