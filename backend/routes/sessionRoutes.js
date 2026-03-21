import { Router } from 'express';
import { getSessions, getSessionById, completeSession, deleteSession, toggleBookmark, viewSolution } from '../controllers/sessionController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getSessions);
router.get('/:id', getSessionById);
router.patch('/:id/complete', completeSession);
router.patch('/:id/bookmark', toggleBookmark);
router.patch('/:id/view-solution', viewSolution);
router.delete('/:id', deleteSession);

export default router;
