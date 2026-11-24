import express from 'express';
import {
  getAdminDashboard,
  getAdminUsers,
  updateUserRoleOrStatus,
  getAdminReviews,
  deleteAdminReview,
  getAdminAuditLogs,
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAdminDashboard);
router.get('/users', getAdminUsers);
router.put('/users/:id/role', updateUserRoleOrStatus);
router.get('/reviews', getAdminReviews);
router.delete('/reviews/:id', deleteAdminReview);
router.get('/audit-logs', getAdminAuditLogs);

export default router;
