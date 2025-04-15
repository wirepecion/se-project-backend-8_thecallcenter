const express = require('express');
const { getPayments, getPayment, createPayment, updatePayment, deletePayment } = require('../controllers/payments');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({mergeParams:true});

router.route('/')
    .get(protect, authorize('admin','user','hotelManager'), getPayments)
    .post(protect, authorize('admin','user'), createPayment);

router.route('/:id')
    .get(protect, authorize('admin','user','hotelManager'), getPayment)
    .put(protect, authorize('admin','user','hotelManager'), updatePayment)
    .delete(protect, authorize('admin','user',), deletePayment);


module.exports = router;