import { Router } from 'express';
import { 
    createQuestion, 
    getQuestions, 
    getQuestionById,
    uploadMaterial,
    processMaterial,
    getSubjects,
    getTopics,
    getPrerequisitesForTopic
} from '../controllers/questionController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { upload } from '../services/fileUploadService.js';

const router = Router();

router.use(verifyJWT); // Protect all question routes

router.route('/').post(createQuestion).get(getQuestions);
router.route('/subjects').get(getSubjects);
router.route('/topics').get(getTopics);
router.route('/prerequisites/:topic').get(getPrerequisitesForTopic);
router.route('/upload').post(upload.array('files', 10), uploadMaterial);
router.route('/process').post(processMaterial);
router.route('/:id').get(getQuestionById);

export default router;
