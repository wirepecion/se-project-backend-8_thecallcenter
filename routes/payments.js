const express = require('express');
const { getPayments, getPayment, createPayment, updatePayment, cancelPayment, deletePayment } = require('../controllers/payments');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({mergeParams:true});

router.route('/')
    .get(protect, authorize('admin','user'), getPayments)
    .post(protect, authorize('admin'), createPayment);

router.route('/:id')
    .get(protect, authorize('admin','user'), getPayment)
    .put(protect, authorize('admin','user'), updatePayment)
    .delete(protect, authorize('admin','user'), deletePayment);

router.route('/:id/cancel')
    .put(protect, authorize('admin','user'), cancelPayment);

module.exports = router;