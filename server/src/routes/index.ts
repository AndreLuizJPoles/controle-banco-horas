import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import hourEntryRoutes from './hourEntries';
import exportRoutes from './export';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/hour-entries', hourEntryRoutes);
router.use('/export', exportRoutes);

export default router;
