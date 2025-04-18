const express = require('express');
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel } = require('../controllers/hotels');
const { protect, authorize } = require('../middleware/auth');

//Incluse other resource routers
const roomsRouter = require('./rooms');

const router = express.Router();

//Re-route into other resource routers
router.use('/:hotelId/rooms', roomsRouter);

router.route('/').get(getHotels).post(protect, authorize('admin'), createHotel);
router.route('/:id').get(getHotel).put(protect, authorize('admin','hotelManager'), updateHotel).delete(protect, authorize('admin'), deleteHotel);

module.exports = router;

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
 *           description: Hotel picture URL
 *       example:
 *         id: 609bda561452242d88d36e37
 *         name: Happy Hotel
 *         address: 121 ถ.สุขุมวิท
 *         tel: 02-2187000
 *         picture: "https://example.com/hotel.jpg"
 */
/**
* @swagger
*   tags:
*     name: Hotels
*     description: The hotels managing API
*/
/**
 * 
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
 */
/**
 * @swagger
 * /hotels:
 *   post:
 *     summary: Create a new hotel
 *     tags: [Hotels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               tel:
 *                 type: string
 *               picture:
 *                 type: string
 *               rooms:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     price:
 *                       type: number
 *             required:
 *               - name
 *               - address
 *               - rooms
 *     responses:
 *       201:
 *         description: Hotel created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /hotels/{id}:
 *   put:
 *     summary: Update a hotel by ID
 *     tags: [Hotels]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               tel:
 *                 type: string
 *               picture:
 *                 type: string
 *               rooms:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     price:
 *                       type: number
 *     responses:
 *       200:
 *         description: Hotel updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /hotels/{id}:
 *   delete:
 *     summary: Delete a hotel by ID
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
 *         description: Hotel deleted
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
