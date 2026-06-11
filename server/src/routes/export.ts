import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { requireActiveUser } from '../middlewares/requireActiveUser';
import * as exportController from '../controllers/exportController';

const router = Router();

router.use(authenticate, requireActiveUser, requireRole(Role.ADMIN));

router.get('/user/:userId', exportController.exportUser);
router.get('/all', exportController.exportAll);

export default router;
