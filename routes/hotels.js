const express = require('express');
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel } = require('../controllers/hotels');
const { protect, authorize } = require('../middleware/auth');

//Incluse other resource routers
const bookingsRouter = require('./bookings');

const router = express.Router();

//Re-route into other resource routers
router.use('/:hotelId/bookings', bookingsRouter);

router.route('/').get(getHotels).post(protect, authorize('admin'), createHotel);
router.route('/:id').get(getHotel).put(protect, authorize('admin'), updateHotel).delete(protect, authorize('admin'), deleteHotel);

module.exports = router;