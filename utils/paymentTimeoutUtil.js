// utils/paymentTimeoutUtil.js
const Payment = require('../models/Payment'); 

exports.schedulePaymentTimeout = (paymentId, timeout = 30000) => { //30 seconds default timeout (change later)
  setTimeout(async () => {
    try {
      const updatedPayment = await Payment.findById(paymentId);
      if (updatedPayment && updatedPayment.status === 'unpaid') {
        updatedPayment.status = 'failed';
        await updatedPayment.save();
        console.log(`Payment ${paymentId} status updated to 'failed' due to timeout.`);
      }
    } catch (err) {
      console.error(`Failed to update payment ${paymentId} after timeout:`, err);
    }
  }, timeout);
};
