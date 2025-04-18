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
 *           description: The auto-generated payment ID
 *         booking:
 *           type: string
 *           description: Booking ID
 *         user:
 *           type: string
 *           description: User ID
 *         amount:
 *           type: number
 *           description: Total amount of the payment
 *         status:
 *           type: string
 *           enum: [unpaid, pending, completed, failed, canceled]
 *         method:
 *           type: string
 *           enum: [Card, Bank, ThaiQR]
 *         paymentDate:
 *           type: string
 *           format: date-time
 *         canceledAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 60e9f0f294f2b642b4fa72c1
 *         booking: 60e8f13c7c9a3d001f8e3a56
 *         user: 60e8f0f67c9a3d001f8e3a55
 *         amount: 1500
 *         status: completed
 *         method: Card
 *         paymentDate: 2025-04-18T14:00:00Z

 * tags:
 *   name: Payments
 *   description: Manage payments for bookings

 * /payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *
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
 *         description: Payment created

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
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found

 *   put:
 *     summary: Update a payment
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
 *         description: Payment updated

 *   delete:
 *     summary: Delete a payment
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
 *         description: Payment deleted
 */