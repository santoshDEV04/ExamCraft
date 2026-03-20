import { Router } from 'express';
import { 
    getUserAnalytics, 
    updateAnalytics,
    getRiskPrediction,
    getWeakTopics,
    getRecommendations
} from '../controllers/analyticsController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').get(getUserAnalytics);
router.route('/update').post(updateAnalytics);
router.route('/risk-prediction').get(getRiskPrediction);
router.route('/weak-topics').get(getWeakTopics);
router.route('/recommendations').get(getRecommendations);

export default router;
