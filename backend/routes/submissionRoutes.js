import { Router } from 'express';
import { 
    submitAnswer, 
    getSubmissionHistory,
    uploadAnswer,
    getSubmissionById
} from '../controllers/submissionController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { upload } from '../services/fileUploadService.js';

const router = Router();

router.use(verifyJWT);

router.route('/').post(submitAnswer).get(getSubmissionHistory);
router.route('/my').get(getSubmissionHistory);
router.route('/upload').post(upload.single('file'), uploadAnswer);
router.route('/:id').get(getSubmissionById);

export default router;
