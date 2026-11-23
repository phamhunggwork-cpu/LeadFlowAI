import type { NextFunction, Request, Response } from 'express';
import { forwardLeadToWf01 } from '../services/n8n.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parseLeadIntakePayload } from '../validators/lead.validator.js';

export async function submitLeadController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const normalizedPayload = parseLeadIntakePayload(req.body);
    const upstream = await forwardLeadToWf01(normalizedPayload);

    sendSuccess(res, 202, {
      submission_id: normalizedPayload.submission_id,
      status: 'accepted',
      workflow: upstream.workflow,
      received_at: upstream.receivedAt,
      ...(upstream.contactId ? { contact_id: upstream.contactId } : {}),
      ...(upstream.inquiryId ? { inquiry_id: upstream.inquiryId } : {}),
    });
  } catch (err: unknown) {
    next(err);
  }
}
