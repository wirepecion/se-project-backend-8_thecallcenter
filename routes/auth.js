const express= require('express');
const {register, login, getMe, logout, getUser, getUsers}=require('../controllers/auth');

const router=express.Router();

const {protect, authorize}=require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.get('/users', protect, authorize('admin'), getUsers);
router.get('/users/:id', protect , authorize('admin'), getUser);

module.exports=router;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - tel
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: Full name of the user
 *         tel:
 *           type: string
 *           pattern: '^[0-9]{10}$'
 *           description: 10-digit Thai phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         role:
 *           type: string
 *           enum: [user, admin, hotelManager]
 *           default: user
 *         credit:
 *           type: number
 *           default: 0
 *           description: User’s credit balance
 *         responsibleHotel:
 *           type: string
 *           format: uuid
 *           description: Hotel the user manages (if hotelManager)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *       example:
 *         id: 609bda561452242d88d36e37
 *         name: John Doe
 *         tel: "0987654321"
 *         email: johndoe@example.com
 *         role: user
 *         credit: 500
 *         responsibleHotel: "60a775d13b1f8b001f8d6f9c"
 *         createdAt: "2025-04-18T10:00:00Z"

 * tags:
 *   name: Auth
 *   description: User authentication & account management

 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, tel, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               tel:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *           example:
 *             name: Jane Smith
 *             tel: "0812345678"
 *             email: jane@example.com
 *             password: mySecurePass123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error

 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *           example:
 *             email: jane@example.com
 *             password: mySecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials

 * /auth/me:
 *   get:
 *     summary: Get current logged-in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized

 * /auth/logout:
 *   get:
 *     summary: Logout current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */