import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import * as hourEntryService from '../services/hourEntryService';
import { HourEntryQueryInput } from '../schemas/hourEntry';

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function listHourEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, startDate, endDate, page, limit } =
      (req.validated?.query as HourEntryQueryInput) ?? {};

    const result = await hourEntryService.listHourEntries({
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      userId,
      startDate,
      endDate,
      page,
      limit,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createHourEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await hourEntryService.createHourEntry(req.user!.userId, req.body);
    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId ? paramId(req.params.userId) : req.user!.userId;

    if (req.user!.role === Role.USER && userId !== req.user!.userId) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    const summary = await hourEntryService.getSummary(userId);
    res.json({ userId, ...summary });
  } catch (error) {
    next(error);
  }
}

export async function approveHourEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await hourEntryService.approveHourEntry(paramId(req.params.id), req.user!.userId);
    res.json({ entry });
  } catch (error) {
    next(error);
  }
}

export async function rejectHourEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await hourEntryService.rejectHourEntry(paramId(req.params.id), req.user!.userId);
    res.json({ entry });
  } catch (error) {
    next(error);
  }
}
