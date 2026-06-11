import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { UserQueryInput } from '../schemas/user';

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = (req.validated?.query as UserQueryInput) ?? {};
    const users = await userService.listUsers(status);
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function approveUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.approveUser(paramId(req.params.id));
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function rejectUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.rejectUser(paramId(req.params.id));
    res.json({ user });
  } catch (error) {
    next(error);
  }
}
