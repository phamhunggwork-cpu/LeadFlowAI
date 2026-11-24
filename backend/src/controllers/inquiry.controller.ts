import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/requireAuth.js';
import {
  buildApproveWf02Payload,
  buildRejectWf02Payload,
  getInquiryDetail,
  listInquiries,
  listWorkflowErrors,
  updateInquiryStatus,
} from '../services/inquiry.service.js';
import { forwardApprovalToWf02 } from '../services/n8n.service.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import {
  parseApproveInquiryBody,
  parseInquiryId,
  parseListInquiriesQuery,
  parseListWorkflowErrorsQuery,
  parseRejectInquiryBody,
  parseUpdateInquiryStatusBody,
} from '../validators/inquiry.validator.js';

function getAuthenticatedUser(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user;
}

export async function listInquiriesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    getAuthenticatedUser(req);
    const query = parseListInquiriesQuery(req.query);
    const result = await listInquiries(query);
    sendSuccess(res, 200, result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function getInquiryDetailController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    getAuthenticatedUser(req);
    const inquiryId = parseInquiryId(req.params.id);
    const detail = await getInquiryDetail(inquiryId);
    sendSuccess(res, 200, detail);
  } catch (err: unknown) {
    next(err);
  }
}

export async function approveInquiryController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);
    const inquiryId = parseInquiryId(req.params.id);
    const body = parseApproveInquiryBody(req.body);

    const wf02Payload = await buildApproveWf02Payload(inquiryId, body, user);
    const upstream = await forwardApprovalToWf02(wf02Payload);

    sendSuccess(res, 202, {
      inquiry_id: wf02Payload.inquiry_id,
      email_message_id: wf02Payload.email_message_id,
      action: 'approve',
      approved_by: user.id,
      status: 'accepted',
      workflow: upstream.workflow,
      received_at: upstream.receivedAt,
      ...(upstream.emailStatus ? { email_status: upstream.emailStatus } : {}),
      ...(upstream.providerMessageId
        ? { provider_message_id: upstream.providerMessageId }
        : {}),
    });
  } catch (err: unknown) {
    next(err);
  }
}

export async function rejectInquiryController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);
    const inquiryId = parseInquiryId(req.params.id);
    const body = parseRejectInquiryBody(req.body);

    const wf02Payload = await buildRejectWf02Payload(inquiryId, body, user);
    const upstream = await forwardApprovalToWf02(wf02Payload);

    sendSuccess(res, 202, {
      inquiry_id: wf02Payload.inquiry_id,
      email_message_id: wf02Payload.email_message_id,
      action: 'reject',
      approved_by: user.id,
      status: 'accepted',
      workflow: upstream.workflow,
      received_at: upstream.receivedAt,
      ...(upstream.emailStatus ? { email_status: upstream.emailStatus } : {}),
    });
  } catch (err: unknown) {
    next(err);
  }
}

export async function updateInquiryStatusController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);
    const inquiryId = parseInquiryId(req.params.id);
    const body = parseUpdateInquiryStatusBody(req.body);

    const result = await updateInquiryStatus(inquiryId, body, user);
    sendSuccess(res, 200, result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function listWorkflowErrorsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    getAuthenticatedUser(req);
    const query = parseListWorkflowErrorsQuery(req.query);
    const result = await listWorkflowErrors(query);
    sendSuccess(res, 200, result);
  } catch (err: unknown) {
    next(err);
  }
}
