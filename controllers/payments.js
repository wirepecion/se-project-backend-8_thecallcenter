const User = require('../models/User');
const Hotel = require('../models/Hotel')
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { schedulePaymentTimeout } = require('../utils/paymentTimeoutUtil');
const { sendTOHotelManager, sendNewPayment } = require("../utils/sendEmails");
const { logCreation } = require('../utils/logCreation');

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
        const payments = await query.populate({
            path: 'booking',
            populate: [
              { path: 'room' },
              { path: 'hotel' },
              { path: 'user' }
            ]
          });

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
        const payment = await Payment.findById(req.params.id).populate({
            path: 'booking',
            populate: [
              { path: 'room' },
              { path: 'hotel' },
              { path: 'user' }
            ]
          });

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
        //log for new payment
        console.log(`[PAYMENT] ${user.role} ['${user.id}'] successfully create new payment (Payment ID: ${payment.id}) for booking ID: ${payment.booking}`);
        logCreation(user.id, 'PAYMENT', `${user.role !== 'user' ?`[${user.role}]`:""}Created new payment for booking ID: ${payment.booking}`);
         
        
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
        
        /*if (status !== undefined && (amount !== undefined || method !== undefined)) {
            console.log(`[VALIDATION] ${user.role} ['${user.id}'] attempted to update 'status' together with '${amount ? 'amount' : ''}${amount && method ? ' and ' : ''}${method ? 'method' : ''}' in the same request. Not allowed. Payment ID: ${payment.id}`);

            return res.status(400).json({
              error: "InvalidRequest",
              message: "Cannot update 'status' together with 'amount' or 'method' in the same request."
            });
        }*/

        if (status && status === 'unpaid') {
            if(user.role !== 'admin') {
                // log for unauthorized access
                console.warn(`[SECURITY] ${user.role} ['${user.id}'] attempted to set payment status to 'unpaid' (not allowed). Payment ID: ${payment.id}`);
                logCreation(user.id,'WARNING', `Warning, [${user.role}] attempted to set payment status to 'unpaid' for booking ID: ${payment.booking} `)
                return res.status(400).json({
                    success: false,
                    message: `Cannot update the payment status to 'unpaid' as the user is not an admin.`
                });
                
            } else {
                payment.status = status;
                //log for setting payment status to unpaid
                console.log(`[PAYMENT] Admin['${user.id}'] successfully set payment status to 'unpaid'. Payment ID: ${payment.id}`);
                sendTOHotelManager(hotelManager.email,customer.name,payment.booking,payment.status,status,user.id);
                logCreation(user.id,'PAYMENT', `[${user.role}] set payment status to 'unpaid' for booking ID: ${payment.booking} `)

            }
        } else if (status && status === 'pending') {
            payment.status = status;
            sendNewPayment(user.email, user.name, payment.booking);
            console.log(`[PAYMENT] ${user.role} ['${user.id}'] successfully set payment status to 'pending'. Payment ID: ${payment.id}`);

        } else if (status && ['completed', 'failed'].includes(status)) {
            if (user.role === 'user') {
                // log for unauthorized access
                console.warn(`[SECURITY] User '${user.id}' with role '${user.role}' attempted to update payment status to '${status}' (not allowed). Payment ID: ${payment.id}`);
                logCreation(user.id,'WARNING', `Warning [${user.role}] attempted to set payment status to '${status}' for booking ID: ${payment.booking} `)
                return res.status(403).json({
                    success: false,
                    message: `You are not allowed to update the payment status to '${status}'`
                });
            }
            const booking = await Booking.findById(payment.booking)
            if (user.role === 'admin') {
                
                console.log(`[NOTIFY] Admin '${user.id}' updated payment to '${status}'. A notification should be sent to the hotel manager. Payment ID: ${payment.id}`);
                const booking = await Booking.findById(payment.booking)
                const hotel = await Hotel.findById(booking.hotel)
                const hotelManager = await User.findOne({ responsibleHotel: hotel._id });
                const customer = await User.findById(payment.user)
                sendTOHotelManager(hotelManager.email,customer.name,payment.booking,payment.status,status,user.id);
            }
            
            
            payment.status = status; // both admin and manager run here
            if(status === 'completed') booking.status = 'confirmed'; 
            await booking.save();
            // log for setting payment status to completed/failed
            console.log(`[PAYMENT] ${user.role} ['${user.id}'] successfully updated payment status to '${status}'. Payment ID: ${payment.id}`);
            logCreation(user.id, 'PAYMENT', `[${user.role}]Payment processed set payment status to '${status}' for booking ID: ${payment.booking}`)
        } else if (status && status === 'canceled') {
            console.warn(`[VALIDATION] ${user.id} attempted to set payment status to 'canceled' (not allowed). Payment ID: ${payment.id}`);
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a payment directly.Payment must be cancel through refunding booking.'
            })

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

        }
        
        payment.amount = amount || payment.amount;
        payment.method = method || payment.method;  
          
        await payment.save(); 

        res.status(200).json({
            success: true,
            message: 'Payment updated successfully',
            data: payment,
        });
    } catch (error) {
        console.error(error.message),
         console.log(error)
        res.status(500).json({
            success: false,
            message: 'Error occurred while updating payment',
        });
    }
};

// @desc    Delete a payment (permanent delete)
// @route   DELETE /api/v1/payments/:id
// @access  Private
exports.deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        const user = req.user;

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }
        console.log(`[PAYMENT] ${user.role} ['${user.id}'] successfully delete payment. Payment ID: ${payment.id}`);
        logCreation(user.id, 'PAYMENT', `[${user.role}]Permanent deleted payment(Payment ID: ${payment.id}) for booking ID: ${payment.booking}`)
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