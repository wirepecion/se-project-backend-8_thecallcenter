const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { schedulePaymentTimeout } = require('../utils/paymentTimeoutUtil');
const { sendEmail } = require('../utils/sendmail')
// @desc    Get all payments
// @route   GET /api/v1/payments
// @access  Private
exports.getPayments = async (req, res) => {
    let query;
        
    //General users can see only their bookings!
    if (req.user.role !== 'admin') {
        query = Payment.find({user:req.user.id});
    } else {
        query = Payment.find({});
    }

    try {
        const payments = await query;

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error occurred while retrieving payments',
        });
    }
};

// @desc    Get single payment
// @route   GET /api/v1/payments/:id
// @access  Public
exports.getPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success:false,
                message: `User ${req.user.id} is not authorized to access this payment`
            });
        }

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error occurred while retrieving payment',
        });
    }
};

// @desc    Create a new payment
// @route   POST /api/v1/bookings/:bookingId/payments
// @access  Private
exports.createPayment = async (req, res) => {
    try {
        req.body.booking = req.params.bookingId;

        const { user, amount, method, status } = req.body;

        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success:false,
                message: `No booking with the id of ${req.params.bookingId}`
            });
        }

        if (method && !['Card', 'Bank', 'ThaiQR'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Allowed values: Card, Bank, ThaiQR.'
            });
        }

        if (status && !['unpaid', 'pending', 'completed', 'failed', 'canceled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status. Allowed values: unpaid, pending, completed, failed.'
            });
        }

        // Create a new payment document
        const payment = new Payment({
            booking: booking._id,
            user,
            amount,
            method,
            status
        });

        // Save the payment to the database
        await payment.save();

        schedulePaymentTimeout(payment._id); 
        
        res.status(201).json({
            success: true,
            message: 'Payment created successfully',
            data: payment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error occurred while creating payment',
        });
    }
};

// @desc    Update payment details
// @route   PUT /api/v1/payments/:id
// @access  Public
exports.updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        const { amount, method, status } = req.body;
        const user = req.user;
        
        if (status !== undefined && (amount !== undefined || method !== undefined)) {
            console.log(`[VALIDATION] ${user.role} ['${user.id}'] attempted to update 'status' together with '${amount ? 'amount' : ''}${amount && method ? ' and ' : ''}${method ? 'method' : ''}' in the same request. Not allowed. Payment ID: ${payment.id}`);

            return res.status(400).json({
              error: "InvalidRequest",
              message: "Cannot update 'status' together with 'amount' or 'method' in the same request."
            });
        }

        if (status && status === 'unpaid') {
            if(user.role !== 'admin') {
                console.warn(`[SECURITY] ${user.role} ['${user.id}'] attempted to set payment status to 'unpaid' (not allowed). Payment ID: ${payment.id}`);

                return res.status(400).json({
                    success: false,
                    message: `Cannot update the payment status to 'unpaid' as the user is not an admin.`
                });
                
            } else {
                payment.status = status;
                console.log(`[PAYMENT] Admin['${user.id}'] successfully set payment status to 'unpaid'. Payment ID: ${payment.id}`);

            }
        } else if (status && status === 'pending') {
            payment.status = status;

            //TO DO (US2-1) : BE - Create: implement logging for payment activity

            //TO DO (US2-1) : BE - Create: confirmation email

            sendEmail({
                from: process.env.SMPT_MAIL,
                to: user.email,
                subject: "[No-reply] New Payment",
                html: `
                <h2>ถึงคุณ ${user.name} </h2>
                <h3>ขอบคุณสำหรับการชำระเงิน BOOKID : ${payment.booking}</h3>
                <p>ระบบได้รับการชำระเงินขอท่านเรียบร้อยแล้ว กรุณารอระบบตรวจสอบเพื่อทำการยืนยันการชำระเงินนี้</p>`,
            });

        } else if (status && ['completed', 'failed'].includes(status)) {
            if (user.role === 'user') {

                console.warn(`[SECURITY] User '${user.id}' with role '${user.role}' attempted to update payment status to '${status}' (not allowed). Payment ID: ${payment.id}`);

                return res.status(403).json({
                    success: false,
                    message: `You are not allowed to update the payment status to '${status}'`
                });
            }

            if (user.role === 'admin') {
                //TO DO (US2-5) : BE - Create: send notification to hotel manager when admin updates a payment

                console.log(`[NOTIFY] Admin '${user.id}' updated payment to '${status}'. A notification should be sent to the hotel manager. Payment ID: ${payment.id}`);
            }
            
            payment.status = status; // both admin and manager run here

            console.log(`[PAYMENT] ${user.role} ['${user.id}'] successfully updated payment status to '${status}'. Payment ID: ${payment.id}`);

        } else if (status && status === 'canceled') {
            payment.status = status;
            
            //TO DO (US2-3) : BE - Create: log refund attempt and outcome

            //TO DO (US2-3) : BE - Create: send email/notification when refund is processed


        } else if (status) {
            console.warn(`[VALIDATION] ${user.role} ['${user.id}'] attempted to set invalid payment status '${status}'. Payment ID: ${payment.id}`);

            return res.status(400).json({
                success: false,
                message: 'Invalid payment status. Allowed values: unpaid, pending, completed, failed, canceled.'
            });
        }

        if (!status){
            
            if (method && !['Card', 'Bank', 'ThaiQR'].includes(method)) {
                console.warn(`[VALIDATION] User '${user.id}' attempted to set invalid payment method '${method}'. Payment ID: ${payment.id}`);

                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment method. Allowed values: Card, Bank, ThaiQR.'
                });
            }

            payment.amount = amount || payment.amount;
            payment.method = method || payment.method;    
        }

        await payment.save(); 

        res.status(200).json({
            success: true,
            message: 'Payment updated successfully',
            data: payment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error occurred while updating payment',
        });
    }
};

// @desc    Cancel a payment (soft delete)
// @route   PUT /api/v1/payments/:id/cancel
// @access  Private
exports.cancelPayment = async (req, res) => {
    try {
        // Find the payment by ID
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        // check if the user is the owner of this payment
        if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success:false,
                message: `User ${req.user.id} is not authorized to cancel this payment`
            });
        }

        // Check if the payment status is 'booked' or 'checkedIn' before allowing cancellation
        if (!['booked', 'checkedIn'].includes(payment.status) && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Payment can only be canceled if it is in booked or checkedIn status',
            });
        }

        // Mark the payment as canceled (soft delete)
        payment.status = 'canceled';
        payment.canceledAt = new Date();

        // Save the updated payment
        await payment.save();

        res.status(200).json({
            success: true,
            message: 'Payment has been successfully canceled',
            data: payment,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Error occurred while canceling payment',
        });
    }
};

// @desc    Delete a payment (permanent delete)
// @route   DELETE /api/v1/payments/:id
// @access  Private
exports.deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        const booking = await Booking.findById(payment.booking);
        if (booking) {
            await Booking.findByIdAndDelete(payment.booking);
        }

        await Payment.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Payment deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error occurred while deleting payment',
        });
    }
};
