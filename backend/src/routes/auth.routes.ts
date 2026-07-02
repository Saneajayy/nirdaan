import { Router } from 'express';
import { signup, login, refresh, logout } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
