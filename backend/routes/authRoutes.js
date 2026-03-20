import { Router } from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser,
    updateAccountDetails
} from '../controllers/authController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { upload } from '../services/fileUploadService.js';

const router = Router();

router.route('/register').post(upload.single('avatar'), registerUser);
router.route('/login').post(loginUser);

// secured routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/update-account').patch(verifyJWT, upload.single('avatar'), updateAccountDetails);

export default router;
