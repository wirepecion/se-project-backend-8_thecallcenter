const express = require('express');
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel } = require('../controllers/hotels');
const { protect, authorize } = require('../middleware/auth');

const roomsRouter = require('./rooms');

const router = express.Router();

router.use('/:hotelId/rooms', roomsRouter);

router.route('/')
    .get(getHotels)
    .post(protect, authorize('admin'), createHotel);
router.route('/:id')
    .get(getHotel)
    .put(protect, authorize('admin','hotelManager'), updateHotel)
    .delete(protect, authorize('admin'), deleteHotel);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: The hotels management API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Hotel:
 *       type: object
 *       required:
 *         - name
 *         - address
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the hotel
 *         name:
 *           type: string
 *           description: Hotel name
 *         address:
 *           type: string
 *           description: Street address
 *         tel:
 *           type: string
 *           description: Telephone number
 *         picture:
 *           type: string
 *           format: uri
 *           description: Hotel image URL
 *         rooms:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               price:
 *                 type: number
 *       example:
 *         id: 609bda561452242d88d36e37
 *         name: Happy Hotel
 *         address: 121 ถ.สุขุมวิท
 *         tel: 02-2187000
 *         picture: "https://example.com/hotel.jpg"
 */

/**
 * @swagger
 * /hotels:
 *   get:
 *     summary: Get all hotels
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: List of hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *
 *   post:
 *     summary: Create a new hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       201:
 *         description: Hotel created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Validation or bad request error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get a single hotel by ID
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Hotel not found
 *
 *   put:
 *     summary: Update a hotel by ID
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200:
 *         description: Hotel updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Hotel not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 *   delete:
 *     summary: Delete a hotel by ID
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel deleted successfully
 *       404:
 *         description: Hotel not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */