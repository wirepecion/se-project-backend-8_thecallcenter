const express = require('express');

const {getBookings, getBooking, addBooking, updateBooking, deleteBooking} = require('../controllers/bookings');

//Incluse other resource routers
const paymentsRouter = require('./payments');

const router = express.Router({mergeParams:true});

const {protect, authorize} = require('../middleware/auth');

//Re-route into other resource routers
router.use('/:bookingId/payments', paymentsRouter);

router.route('/')
    .get(protect, getBookings)
    .post(protect, authorize('admin','user'), addBooking);

router.route('/:id')
    .get(protect, getBooking)
    .put(protect, authorize('admin','user','hotelManager'), updateBooking)
    .delete(protect, authorize('admin','user','hotelManager'), deleteBooking);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: API for managing bookings
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - user
 *         - room
 *         - hotel
 *         - checkInDate
 *         - checkOutDate
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated booking ID
 *         user:
 *           type: string
 *           description: The user who made the booking
 *         room:
 *           type: string
 *           description: The room being booked
 *         hotel:
 *           type: string
 *           description: The hotel where the booking is made
 *         checkInDate:
 *           type: string
 *           format: date-time
 *           description: The check-in date for the booking
 *         checkOutDate:
 *           type: string
 *           format: date-time
 *           description: The check-out date for the booking
 *         status:
 *           type: string
 *           enum: ['pending', 'confirmed', 'canceled', 'checkedIn', 'completed']
 *           description: The current status of the booking
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the booking was created
 *       example:
 *         id: 609bda561452242d88d36e37
 *         user: 609bd9991452242d88d36e12
 *         room: 609bd9991452242d88d36e14
 *         hotel: 609bd9991452242d88d36e15
 *         checkInDate: '2025-05-01T15:00:00Z'
 *         checkOutDate: '2025-05-07T12:00:00Z'
 *         status: confirmed
 *         createdAt: '2025-04-18T10:00:00Z'
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized - Token required
 * 
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad Request - Invalid data
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - Not authorized
 */

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Booking found by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 * 
 *   put:
 *     summary: Update a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - Not authorized
 * 
 *   delete:
 *     summary: Delete a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - Not authorized
 */