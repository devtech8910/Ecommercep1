import { Router } from 'express';
import * as controller from '../controller/auth.controller.js';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/check-phone', controller.checkPhone);
router.get('/check-email', controller.checkEmail);

export default router;
