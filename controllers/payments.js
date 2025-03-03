const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

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

        if (method && !['credit card', 'debit card', 'bank transfer'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Allowed values: credit card, debit card, bank transfer.'
            });
        }

        if (status && !['unpaid', 'pending', 'completed', 'failed'].includes(status)) {
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
        const { amount, method, status } = req.body;

        if (method && !['credit card', 'debit card', 'bank transfer'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Allowed values: credit card, debit card, bank transfer.'
            });
        }

        if (status && status !== 'pending' && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `User is allowed to update the payment to 'pending' status only.`
            });
        }

        if (status && !['pending', 'completed', 'failed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status. Allowed values: pending, completed, failed.'
            });
        }

        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { amount, method, status },
            { new: true, runValidators: true }
        );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

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

        if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success:false,
                message: `User ${req.user.id} is not authorized to cancel this payment`
            });
        }

        // Check if the payment status is 'pending' before allowing cancellation
        if (payment.status !== 'pending' && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Payment can only be canceled if it is in pending status',
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
        const payment = await Payment.findByIdAndDelete(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

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
