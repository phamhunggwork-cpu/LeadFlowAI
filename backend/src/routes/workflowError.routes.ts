import { Router } from 'express';
import { listWorkflowErrorsController } from '../controllers/inquiry.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const workflowErrorRouter = Router();

workflowErrorRouter.use(requireAuth);
workflowErrorRouter.get('/', listWorkflowErrorsController);
