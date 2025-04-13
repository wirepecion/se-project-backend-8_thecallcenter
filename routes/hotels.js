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
 *         - tel
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the hotel
 *           example: d290f1ee-6c54-4b01-90e6-d701748f0851
 *         name:
 *           type: string
 *           description: Hotel name
 *         address:
 *           type: string
 *           description: House No., Street, Road
 *         tel:
 *           type: string
 *           description: Telephone number
 *         picture:
 *           type: string
 *           description: hotel picture
 *       example:
 *         id: 609bda561452242d88d36e37
 *         name: Happy Hotel
 *         address: 121 ถ.สุขุมวิท
 *         tel: 02-2187000
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
 *     summary: Returns the list of all the hotels
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: The list of the hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 */
/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get the hotel by id
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The hotel id
 *     responses:
 *       200:
 *         description: The hotel description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: The hotel was not found
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
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       201:
 *         description: The hotel was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       500:
 *         description: Some server error
 */
/**
 * @swagger
 * /hotels/{id}:
 *   put:
 *     summary: Update the hotel by the id
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The hotel id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200:
 *         description: The hotel was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: The hotel was not found
 *       500:
 *         description: Some error happened
 */
/**
 * @swagger
 * /hotels/{id}:
 *   delete:
 *     summary: Remove the hotel by id
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The hotel id
 *     responses:
 *       200:
 *         description: The hotel was deleted
 *       404:
 *         description: The hotel was not found
 */
