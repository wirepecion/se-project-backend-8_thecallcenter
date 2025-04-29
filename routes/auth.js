const express= require('express');
const { register, login, getMe, logout, getUser, getUsers, reduceCredit } = require('../controllers/auth');
const { protect, authorize } = require('../middleware/auth');

const router=express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.post('/reduceCredit', protect, reduceCredit);
router.get('/users', protect, authorize('admin'), getUsers);
router.get('/users/:id', protect , authorize('admin'), getUser);

module.exports = router;

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
 
 * /auth/reduceCredit:
 *   post:
 *     summary: Reduce a user's credit balance
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *               user:
 *                 type: string
 *                 description: Optional user ID to reduce credit for (admin only)
 *                 example: 609bda561452242d88d36e37
 *     responses:
 *       200:
 *         description: Credit reduced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or insufficient credit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Amount must be greater than zero
 *       403:
 *         description: Forbidden if non-admin tries to act on another user
 *       404:
 *         description: User not found

 * /auth/users:
 *   get:
 *     summary: Get all users
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                   description: Number of users returned
 *                 statistic:
 *                   type: array
 *                   description: Aggregated user data by membership tier
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Membership tier
 *                       totalUsers:
 *                         type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 
 * /auth/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */