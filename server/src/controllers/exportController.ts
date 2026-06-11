import { Request, Response, NextFunction } from 'express';
import * as exportService from '../services/exportService';

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function exportUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { csv, filename } = await exportService.exportUserCsv(paramId(req.params.userId));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    next(error);
  }
}

export async function exportAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { csv, filename } = await exportService.exportAllCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    next(error);
  }
}
