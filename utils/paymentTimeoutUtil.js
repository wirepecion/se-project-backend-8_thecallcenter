// utils/paymentTimeoutUtil.js
const Payment = require('../models/Payment'); 
const logCreation = require('./logCreation'); 
exports.schedulePaymentTimeout = (paymentId, timeout = 30000) => { //30 seconds default timeout (change later)
  setTimeout(async () => {
    try {
      const updatedPayment = await Payment.findById(paymentId);
      if (updatedPayment && updatedPayment.status === 'unpaid') {
        updatedPayment.status = 'failed';
        await updatedPayment.save();
        //log for payment failure
        console.log(`Payment ${paymentId} status updated to 'failed' due to timeout.`);
        logCreation(user.id, 'PAYMENT', `[Timeout] Payment ID: ${updatedPayment._id} for booking ID: ${updatedPayment.booking}`)
      }
    } catch (err) {
      console.error(`Failed to update payment ${paymentId} after timeout:`, err);
    }
  }, timeout);
};
