const express = require('express');
const { getHospitals, getHospital, createHospital, updateHospital, deleteHospital } = require('../controllers/hospitals');
const { protect, authorize } = require('../middleware/auth');

//Incluse other resource routers
const appointmentsRouter = require('./appointments');

const router = express.Router();

//Re-route into other resource routers
router.use('/:hospitalId/appointments', appointmentsRouter);

router.route('/').get(getHospitals).post(protect, authorize('admin'), createHospital);
router.route('/:id').get(getHospital).put(protect, authorize('admin'), updateHospital).delete(protect, authorize('admin'), deleteHospital);

module.exports = router;