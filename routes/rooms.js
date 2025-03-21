const express = require('express');
const { getRooms, getRoom, createRoom, updateRoom, deleteRoom } = require('../controllers/rooms');
const { protect, authorize } = require('../middleware/auth');

//Incluse other resource routers
const bookingsRouter = require('./bookings');

const router = express.Router({mergeParams:true});

//Re-route into other resource routers
router.use('/:roomId/bookings', bookingsRouter);

router.route('/').get(getRooms).post(protect, authorize('admin'), createRoom);
router.route('/:id').get(getRoom).put(protect, authorize('admin'), updateRoom).delete(protect, authorize('admin'), deleteRoom);

module.exports = router;

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
 *         - unavailablePeriod
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the room
 *           example: d290f1ee-6c54-4b01-90e6-d701748f0851
 *         hotel:
 *           type: mongoose.Schema.ObjectId
 *           description: Room hotel
 *         type:
 *           type: string
 *           description: Type of room
 *           enum: 
 *             - standard
 *             - superior
 *             - deluxe
 *             - suite
 *         number:
 *           type: number
 *           description: Room number
 *         price:
 *           type: number
 *           description: Room price
 *         unavailablePeriod:
 *           type: array
 *           description: Array of startDate and endDate of unaailable periods
 *           items:
 *             type: string
 *             format: date-time
 *       example:
 *         id: 609bda561452242d88d36e37
 *         hotel: Happy Hotel
 *         type: standard
 *         price: 1000
 *         unavailablePeriod:
 *           - '2025-03-22T15:30:00Z'
 *           - '2025-03-24T10:00:00Z'
 */
/**
* @swagger
*   tags:
*     name: Rooms
*     description: The rooms managing API
*/
/**
 * 
 * @swagger
 * /rooms:
 *   get:
 *     summary: Returns the list of all the rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: The list of the rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Get the room by id
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The room id
 *     responses:
 *       200:
 *         description: The room description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: The room was not found
 */
/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       201:
 *         description: The room was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       500:
 *         description: Some server error
 */
/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     summary: Update the room by the id
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The room id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       200:
 *         description: The room was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: The room was not found
 *       500:
 *         description: Some error happened
 */
/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Remove the room by id
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The room id
 *     responses:
 *       200:
 *         description: The room was deleted
 *       404:
 *         description: The room was not found
 */
