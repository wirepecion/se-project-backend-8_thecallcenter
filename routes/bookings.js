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
 *   description: API for managing hotel room bookings
 *
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
 *           format: uuid
 *           description: The user who made the booking
 *         room:
 *           type: string
 *           format: uuid
 *           description: The room being booked
 *         hotel:
 *           type: string
 *           format: uuid
 *           description: The hotel associated with the booking
 *         checkInDate:
 *           type: string
 *           format: date-time
 *           description: Check-in date
 *         checkOutDate:
 *           type: string
 *           format: date-time
 *           description: Check-out date
 *         status:
 *           type: string
 *           enum: [pending, confirmed, canceled, checkedIn, completed]
 *           default: pending
 *           description: Current status of the booking
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date the booking was created
 *       example:
 *         id: "609bda561452242d88d36e37"
 *         user: "609bd9991452242d88d36e12"
 *         room: "609bd9991452242d88d36e14"
 *         hotel: "609bd9991452242d88d36e15"
 *         checkInDate: "2025-05-01T15:00:00Z"
 *         checkOutDate: "2025-05-07T12:00:00Z"
 *         status: confirmed
 *         createdAt: "2025-04-18T10:00:00Z"
 *
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized - Token missing or invalid
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
 *             type: object
 *             required:
 *               - user
 *               - room
 *               - hotel
 *               - checkInDate
 *               - checkOutDate
 *             properties:
 *               user:
 *                 type: string
 *               room:
 *                 type: string
 *               hotel:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date-time
 *               checkOutDate:
 *                 type: string
 *                 format: date-time
 *           example:
 *             user: "609bd9991452242d88d36e12"
 *             room: "609bd9991452242d88d36e14"
 *             hotel: "609bd9991452242d88d36e15"
 *             checkInDate: "2025-05-01T15:00:00Z"
 *             checkOutDate: "2025-05-07T12:00:00Z"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error or bad input
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Not enough permissions
 *
 * /bookings/{id}:
 *   get:
 *     summary: Get a specific booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Booking found
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
 *       - name: id
 *         in: path
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
 *         description: Invalid input
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not enough permissions
 *
 *   delete:
 *     summary: Delete a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not enough permissions
 */