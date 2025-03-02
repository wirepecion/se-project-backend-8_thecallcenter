const express = require('express');
const { getPayments, getPayment, createPayment, updatePayment, cancelPayment, deletePayment } = require('../controllers/payments');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({mergeParams:true});

router.route('/')
    .get(protect, authorize('admin'), getPayments)
    .post(protect, authorize('admin','user'), createPayment);

router.route('/:id')
    .get(protect, getPayment)
    .put(protect, authorize('admin'), updatePayment)
    .delete(protect, authorize('admin'), deletePayment);

router.route('/:id/cancel')
    .put(protect, authorize('admin','user'), cancelPayment);

module.exports = router;