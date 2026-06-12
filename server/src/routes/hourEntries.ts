import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { requireActiveUser } from '../middlewares/requireActiveUser';
import { validate } from '../middlewares/validate';
import { createEntrySchema, hourEntryQuerySchema } from '../schemas/hourEntry';
import * as hourEntryController from '../controllers/hourEntryController';

const router = Router();

router.use(authenticate, requireActiveUser);

router.get('/summary/:userId', requireRole(Role.ADMIN), hourEntryController.getSummary);
router.get('/summary', hourEntryController.getSummary);
router.get('/', validate(hourEntryQuerySchema, 'query'), hourEntryController.listHourEntries);
router.post(
  '/',
  requireRole(Role.USER),
  validate(createEntrySchema),
  hourEntryController.createHourEntry,
);
router.patch('/:id/approve', requireRole(Role.ADMIN), hourEntryController.approveHourEntry);
router.patch('/:id/reject', requireRole(Role.ADMIN), hourEntryController.rejectHourEntry);

export default router;
