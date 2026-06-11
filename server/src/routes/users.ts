import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { requireActiveUser } from '../middlewares/requireActiveUser';
import { validate } from '../middlewares/validate';
import { userQuerySchema } from '../schemas/user';
import * as userController from '../controllers/userController';

const router = Router();

router.use(authenticate, requireActiveUser, requireRole(Role.ADMIN));

router.get('/', validate(userQuerySchema, 'query'), userController.listUsers);
router.patch('/:id/approve', userController.approveUser);
router.patch('/:id/reject', userController.rejectUser);

export default router;
