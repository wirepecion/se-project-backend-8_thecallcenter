const express = require('express');
const { getPayments, getPayment, createPayment, updatePayment, deletePayment } = require('../controllers/payments');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({mergeParams:true});

router.route('/')
    .get(protect, authorize('admin','user','hotelManager'), getPayments)
    .post(protect, authorize('admin','user'), createPayment);

router.route('/:id')
    .get(protect, authorize('admin','user','hotelManager'), getPayment)
    .put(protect, authorize('admin','user','hotelManager'), updatePayment)
    .delete(protect, authorize('admin','user',), deletePayment);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Manage payments for bookings
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - booking
 *         - user
 *         - amount
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated ID of the payment
 *         booking:
 *           type: string
 *           description: Related booking ID
 *         user:
 *           type: string
 *           description: Related user ID
 *         amount:
 *           type: number
 *           description: Total payment amount
 *         status:
 *           type: string
 *           enum: [unpaid, pending, completed, failed, canceled]
 *           default: unpaid
 *         method:
 *           type: string
 *           enum: [Card, Bank, ThaiQR]
 *           description: Payment method
 *         paymentDate:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the payment
 *         canceledAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when payment was canceled
 *       example:
 *         id: 60e9f0f294f2b642b4fa72c1
 *         booking: 60e8f13c7c9a3d001f8e3a56
 *         user: 60e8f0f67c9a3d001f8e3a55
 *         amount: 1500
 *         status: completed
 *         method: Card
 *         paymentDate: 2025-04-18T14:00:00Z
 *         canceledAt: null
 */

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Unauthorized

 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [booking, user, amount, method]
 *             properties:
 *               booking:
 *                 type: string
 *               user:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [Card, Bank, ThaiQR]
 *           example:
 *             booking: 60e8f13c7c9a3d001f8e3a56
 *             user: 60e8f0f67c9a3d001f8e3a55
 *             amount: 2000
 *             method: ThaiQR
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get a specific payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The payment ID
 *     responses:
 *       200:
 *         description: Payment found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Unauthorized

 *   put:
 *     summary: Update a payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Unauthorized

 *   delete:
 *     summary: Delete a payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Unauthorized
 */