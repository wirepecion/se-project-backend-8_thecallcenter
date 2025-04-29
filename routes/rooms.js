const express = require('express');
const { getRooms, getRoom, createRoom, updateRoom, deleteRoom } = require('../controllers/rooms');
const { protect, authorize } = require('../middleware/auth');

const bookingsRouter = require('./bookings');

const router = express.Router({mergeParams:true});

router.use('/:roomId/bookings', bookingsRouter);

router.route('/')
    .get(getRooms)
    .post(protect, authorize('admin','hotelManager'), createRoom);
router.route('/:id')
    .get(getRoom)
    .put(protect, authorize('admin','hotelManager'), updateRoom)
    .delete(protect, authorize('admin','hotelManager'), deleteRoom);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Manage rooms in hotels
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       required:
 *         - hotel
 *         - number
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated room ID
 *         hotel:
 *           type: string
 *           description: ObjectId of the hotel this room belongs to
 *         type:
 *           type: string
 *           enum: [standard, superior, deluxe, suite]
 *           default: standard
 *           description: Type of room
 *         number:
 *           type: number
 *           description: Room number
 *         price:
 *           type: number
 *           description: Room price per night
 *         unavailablePeriod:
 *           type: array
 *           description: List of unavailable date ranges
 *           items:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *       example:
 *         id: 609bda561452242d88d36e37
 *         hotel: 609bd9991452242d88d36e12
 *         type: deluxe
 *         number: 201
 *         price: 3000
 *         unavailablePeriod:
 *           - startDate: '2025-04-20T14:00:00Z'
 *             endDate: '2025-04-22T12:00:00Z'
 */

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: A list of all rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'

 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Get a specific room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The room ID
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found

 *   put:
 *     summary: Update a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Room not found

 *   delete:
 *     summary: Delete a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The room ID
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Room not found
 */