import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitLeadController } from '../controllers/lead.controller.js';

const leadSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      ok: false,
      data: null,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many lead submissions. Please try again in a minute.',
      },
    });
  },
});

export const leadRouter = Router();

leadRouter.post('/', leadSubmissionLimiter, submitLeadController);
