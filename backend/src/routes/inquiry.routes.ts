import { Router } from 'express';
import {
  approveInquiryController,
  getInquiryDetailController,
  listInquiriesController,
  rejectInquiryController,
  updateInquiryStatusController,
} from '../controllers/inquiry.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const inquiryRouter = Router();

inquiryRouter.use(requireAuth);

inquiryRouter.get('/', listInquiriesController);
inquiryRouter.get('/:id', getInquiryDetailController);
inquiryRouter.post('/:id/approve', approveInquiryController);
inquiryRouter.post('/:id/reject', rejectInquiryController);
inquiryRouter.patch('/:id/status', updateInquiryStatusController);
