const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Payment = require('../models/Payment');
const Room = require('../models/Room');
const { checkout } = require('../routes/auth');
const { schedulePaymentTimeout } = require('../utils/paymentTimeoutUtil');
const { refundCalculation } = require('../utils/refundCalculation');
const { logCreation } = require('../utils/logCreation');
const User = require('../models/User');
const { sendRefund } = require('../utils/sendEmails');
const { register } = require('./auth');
const { checkTier } = require('../utils/checkMembershipTier');
const nights = 24 * 60 * 60 * 1000;

//@desc     Get all bookings
//@route    GET /api/v1/bookings
//@access   Public
/* istanbul ignore next */
exports.getBookings= async(req,res,next) => {
    let query;
    const reqQuery = {...req.query};
    //Fields to exclude from query
    const removeFields = ['select','sort','page','limit','filter'];
    removeFields.forEach(param => delete reqQuery[param]);
    
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    let queryFilter = JSON.parse(queryStr);
    
    if (req.query.filter) {
        const filters = req.query.filter.split(",");
        queryFilter.status = { $in: filters }; // Case-insensitive search
        //console.log(queryFilter.status)
         
    }
    queryObj = Booking.find(queryFilter)
    
    //General users can see only their bookings!
    if (req.user.role === 'user') {
        query = queryObj.find({user:req.user.id})
            .populate({
                path: 'payments',
                select: 'amount method status canceledAt paymentDate' // select fields you want from Payment
            })
            .populate({
                path:'room',
                select: 'number type price'
            })
            .populate({
                path:'hotel',
                select: 'name address tel'
            })
            .populate({
                path:'user',
                select:'name'
            });
    } else if (req.user.role === 'hotelManager') {
        query = queryObj.find({hotel:req.user.responsibleHotel})
            .populate({
                path: 'payments',
                select: 'amount method status canceledAt paymentDate' // select fields you want from Payment
            })
            .populate({
                path:'room',
                select: 'number type price'
            })
            .populate({
                path:'hotel',
                select: 'name address tel'
            })
            .populate({
                path:'user',
                select:'name'
            });
    
    } else { //If you are an admin, you can see all!
        if (req.params.hotelId) {

            //console.log(req.params.hotelId);

            query = queryObj.find({hotel:req.params.hotelId})
                .populate({
                    path: 'payments',
                    select: 'amount method status canceledAt paymentDate' // select fields you want from Payment
                })
                .populate({
                    path:'room',
                    select: 'number type price'
                })
                .populate({
                    path:'hotel',
                    select: 'name address tel'
                })
                .populate({
                    path:'user',
                    select: 'name'
                });

        } else {

            query = queryObj.find()
                .populate({
                    path: 'payments',
                    select: 'amount method status canceledAt paymentDate' // select fields you want from Payment
                })
                .populate({
                    path:'room',
                    select: 'number type price'
                })
                .populate({
                    path:'hotel',
                    select: 'name address tel'
                })
                .populate({
                    path:'user',
                    select: 'name'
                });

        }
    }
    
   

    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    try {
        //pagination
        const total = await query.clone().countDocuments();
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        if(startIndex > total) {
            return res.status(400).json({
                success:false,
                message: 'This page does not exist'
            });
        }
        query = query.skip(startIndex).limit(limit).exec();
        const bookings = await query;
        const pagination = {};
            if (endIndex < total) {
                pagination.next = { page: page + 1, count: (endIndex+limit)>total?total-(startIndex+limit):limit };
            }
            
            if (startIndex > 0) {
                pagination.prev = { page: page - 1, count:limit };
            }
        res.status(200).json({
            success:true,
            count:bookings.length,
            total: total,
            totalPages: Math.ceil(total / limit),
            nowPage: page,
            pagination,
            data:bookings,
            
        });
        
    
    } catch (error) {
        console.log(error.message);
        console.log(error);
        res.status(500).json({
            success:false,
            message: "Cannot find Booking"
        });
    }

};

//@desc     Get single booking
//@route    GET /api/v1/bookings/:id
//@access   Public
/* istanbul ignore next */
exports.getBooking= async(req,res,next) => {
    try {
        const booking = await Booking.findById(req.params.id)
        .populate({
            path: 'payments',
            select: 'amount method status canceledAt paymentDate' // select fields you want from Payment
        })
        .populate({
            path:'room',
            select: 'number type price'
        })
        .populate({
            path:'hotel',
            select: 'name address tel'
        })
        .populate({
            path:'user',
            select:'name'
        });

        if (!booking) {
            return res.status(400).json({
                success:false,
                message: `No booking with the id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success:true, 
            data:booking
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message: "Cannot find Booking"
        });
    }

};

//@desc     Add booking
//@route    POST /api/v1/rooms/:roomId/bookings
//@access   Private
/* istanbul ignore next */
exports.addBooking = async (req, res, next) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.user.id;

        // Step 1: Validate check-in and check-out dates
        const { checkInDate, checkOutDate, paymentMethod } = req.body;

        // Ensure that dates are valid Date objects
        const newCheckInDate = new Date(checkInDate);
        const newCheckOutDate = new Date(checkOutDate);

        // Ensure check-out date is after check-in date
        if (newCheckOutDate <= newCheckInDate) {
            return res.status(400).json({
                success: false,
                message: `Please choose a check-out date that is after the check-in date.`,
            });
        }

        // Users can book up to 3 nights, but admins can book more
        const maxNights = 3 * nights; 
        if (newCheckOutDate - newCheckInDate > maxNights && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `User can only book up to 3 nights.`,
            });
        }

        // Step 2: Fetch room and check availability
        const room = await Room.findById(roomId);
        console.log(room);
        // Check if the room exists
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found.',
            });
        }

        // Check if the room is available during the requested dates
        const isUnavailable = room.unavailablePeriod.some((period) => {
            const periodStart = new Date(period.startDate);
            const periodEnd = new Date(period.endDate);

            // Check for overlap with any unavailable period
            return (
                (newCheckInDate >= periodStart && newCheckInDate < periodEnd) ||
                (newCheckOutDate > periodStart && newCheckOutDate <= periodEnd) ||
                (newCheckInDate <= periodStart && newCheckOutDate >= periodEnd)
            );
        });

        if (isUnavailable) {
            return res.status(400).json({
                success: false,
                message: 'Room is not available for booking.',
            });
        }

        const user = await User.findById(userId);

        // Step 3: Create the booking
        const booking = new Booking({
            user: userId,
            room: roomId,
            hotel: room.hotel,
            checkInDate: newCheckInDate,
            checkOutDate: newCheckOutDate,
            tierAtBooking: user.membershipTier,
        });
        await booking.save(); // Save booking

        // Step 4: Add the booking period to the unavailablePeriod array
        room.unavailablePeriod.push({
            startDate: newCheckInDate.toISOString(),
            endDate: newCheckOutDate.toISOString(),
        });

        // Save the updated room with the new unavailable period
        await room.save();

        

        // Step 5: Process payment
        const payment = new Payment({
            booking: booking._id,
            user: userId,
            amount: room.price* (newCheckOutDate - newCheckInDate) / (1000 * 60 * 60 * 24), 
            status: 'unpaid',
            
        });
        await payment.save(); // Save payment

        // Respond with the success response
        const parsedBooking = booking.toObject();
        const parsedPayment = payment.toObject();
        
        res.status(201).json({
            success: true,
            message: 'Booking successfully created',
            data: {
                booking: parsedBooking,
                payment: parsedPayment,
            },
        });



    } catch (error) {
        console.error('Transaction failed:', error);
        res.status(500).json({
            success: false,
            message: 'Transaction failed. Please try again.',
        });
    }
};

//@desc     Update booking
//@route    PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking = async(req,res,next) => {
    try {
        let booking = await Booking.findById(req.params.id);
        const user = req.user;

        if (!booking) {
            return res.status(404).json({
                success:false,
                message: `No booking with the id of ${req.params.id}`
            });
        }

        // Make sure the user is the booking owner or the hotel manager is the booking hotel owner
        if ((user.role === 'user' && booking.user.toString() !== user.id )
            || (user.role === 'hotelManager' && booking.hotel.toString() !== user.responsibleHotel.toString() )) {

            console.warn(`[SECURITY] User ['${user.id}'] attempted to update booking ID: ${req.params.id} (not allowed).`);
            logCreation( user.id, 'SECURITY', `${user.role} ['${user.id}'] attempted to update booking ID: ${req.params.id} (not allowed).`);

            return res.status(401).json({
                success:false,
                message: `User ${user.id} is not authorized to update this booking`
            });
        }

        const { checkInDate, checkOutDate, status } = req.body;

        if (status && (checkInDate || checkOutDate)) {
            console.log(`[VALIDATION] ${user.role} ['${user.id}'] attempted to update 'status' together with '${checkInDate ? 'amount' : ''}${checkInDate && checkOutDate ? ' and ' : ''}${checkOutDate ? 'method' : ''}' in the same request. Not allowed. Booking ID: ${req.params.id}`);

            return res.status(400).json({
              error: "InvalidRequest",
              message: "Cannot update 'status' together with 'checkInDate' or 'checkOutDate' in the same request."
            });
        }

        if (status) {

            if (status === 'pending') {

                if (user.role !== 'admin') {
                    console.warn(`[SECURITY] ${user.role} ['${user.id}'] attempted to set booking status to 'pending' (not allowed). Booking ID: ${req.params.id}`);

                    return res.status(400).json({
                        success: false,
                        message: `Cannot update the booking status to 'pending' as the user is not an admin.`
                    });
                    
                } else {
                    booking.status = status;
                    console.log(`[BOOKING] Admin['${user.id}'] successfully set booking status to 'pending'. Booking ID: ${req.params.id}`);
                }

            } else if (status === 'canceled') {

                try {

                    //TODO US2-3 - BE - Create: implement refund logic
                    if (![ 'confirmed', 'checkedIn' ].includes(booking.status)){
                        return res.status(400).json({
                            success: false,
                            message: 'Booking cannot be canceled at this stage.'
                        });
                    }
                    
                    const payment = await Payment.findOne({
                        booking: req.params.id,
                        status: 'completed'
                    });
    
                    if (!payment) {
                        console.warn(`[PAYMENT] No completed payment found for Booking ID: ${req.params.id}`);
                        return res.status(400).json({
                            success: false,
                            message: 'No completed payment found for refund.'
                        });
                    }
            
                    const paymentPrice = payment.amount;
    
                    let refund = refundCalculation(booking.checkInDate, booking.checkOutDate, new Date(), paymentPrice); 
                    
                    //TODO US2-3 - BE - Create: add alert to display deny message when refund is failed
                    if (refund <= 0) {
                        
                        const messages = {
                            negative: 'Refund denied. Stay duration does not meet our policy.',
                            zero: 'Refund failed. No refundable amount available.'
                        };
                        
                        const logMessages = {
                            negative: `[REFUND] Refund rejected for Booking ID: ${req.params.id}. Stay duration does not meet our policy — only exactly 1, 2, or 3 nights are eligible.`,
                            zero: `[REFUND] Refund failed for Booking ID: ${req.params.id}. No refundable amount available.`
                        };
                        
                        const type = refund < 0 ? 'negative' : 'zero';
                        console.warn(logMessages[type]);
                        
                        return res.status(400).json({
                            success: false,
                            message: messages[type]
                        });
                        
                    }
                    
                    //TODO US2-3 - BE - Create: update booking status on cancellation
                    booking.status = status;

                    payment.status = 'canceled';
                    await payment.save();

                    await User.findByIdAndUpdate(
                        booking.user,
                        { $inc: { credit: refund } }
                    );
                
                    //TODO US2-3 - BE - Create: log refund attempt and outcome
                    console.log(`[REFUND] Refund processed successfully for Booking ID: ${req.params.id}. Amount refunded: ${refund} THB`);
                    logCreation( user.id, 'REFUND', `Refund processed for Booking ID: ${req.params.id}. Amount refunded: ${refund} THB`,);

                    // Update room's unavailablePeriod
                    const room = await Room.findById(booking.room)

                    const checkInDate = new Date(booking.checkInDate).toISOString
                    const checkOutDate = new Date(booking.checkOutDate).toISOString

                    // Remove the period from unavailablePeriod array if it matches the booking's dates
                    room.unavailablePeriod = room.unavailablePeriod.filter((period) => {
                        return !(
                            new Date(period.startDate).toISOString === checkInDate &&
                            new Date(period.endDate).toISOString === checkOutDate
                        );
                    });

                    // Save the updated room document
                    await room.save();

                    //TODO US2-3 - BE - Create: send email/notification when refund is processed
                    const userInfo = await User.findById(user.id)
                    sendRefund(userInfo.email, userInfo.name, req.params.id, refund)
    
                } catch (err) {
                    console.error(`[ERROR] Refund process failed for Booking ID: ${req.params.id}.`, err);
                    return res.status(500).json({
                        success: false,
                        message: 'An error occurred during the refund process.'
                    });
                }

            } else if ([ 'confirmed', 'checkedIn', 'completed' ].includes(status)) {
                
                if (user.role === 'user') {

                    console.warn(`[SECURITY] Customer ['${user.id}'] attempted to update booking status to '${status}' (not allowed). Booking ID: ${req.params.id}`);
    
                    return res.status(403).json({
                        success: false,
                        message: `You are not allowed to update the booking status to '${status}'`
                    });
                }
    
                booking.status = status;
                console.log(`[BOOKING] ${user.role} ['${user.id}'] successfully updated booking status to '${status}'. Booking ID: ${req.params.id}`);
    
                if (status === 'completed') {
                    const room = await Room.findById(booking.room);
                    const point = room.price/100*((booking.checkOutDate - booking.checkInDate)/nights);
                    const user = await User.findById(booking.user).select('+password');
                    user.membershipPoints += point;
                    console.log(`[MEMBERSHIP] ${user.role} ['${user.id}'] successfully updated membership points to '${user.membershipPoints}'. Booking ID: ${req.params.id}`);                    
                    await user.save();

                    if(checkTier(user.membershipPoints) !== user.membershipTier) {
                        user.membershipTier = checkTier(user.membershipPoints);
                        await user.save();

                        console.log(`[MEMBERSHIP] ${user.role} ['${user.id}'] successfully updated membership tier to '${user.membershipTier}'. Booking ID: ${req.params.id}`);
                        logCreation( user.id, 'MEMBERSHIP', `Membership tier updated to '${user.membershipTier}'`);
                    }
                    
                }

            } else { // status is invalid

                console.warn(`[VALIDATION] ${user.role} ['${user.id}'] attempted to set invalid booking status to '${status}'. Booking ID: ${req.params.id}`);
    
                return res.status(400).json({
                    success: false,
                    message: 'Invalid booking status. Allowed values: pending, confirmed, canceled, checkedIn, completed.'
                });

            }

        } else if (checkInDate || checkOutDate) {

            let newCheckInDate = checkInDate ? new Date(checkInDate) : booking.checkInDate;
            let newCheckOutDate = checkOutDate ? new Date(checkOutDate) : booking.checkOutDate;

            // Check-out date must be after the check-in date
            if (newCheckOutDate <= newCheckInDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-out date must be after check-in date.'
                });
            }

            // Max 3-night limit
            const duration = newCheckOutDate - newCheckInDate;
            if (duration > 3 * nights) {
                return res.status(400).json({
                    success: false,
                    message: 'User can only book up to 3 nights.'
                });
            }

            // Find the associated Room
            const room = await Room.findById(booking.room);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found for this booking.',
                });
            }

            // Remove the previous unavailable period for the booking
            const oldUnavailablePeriodIndex = room.unavailablePeriod.findIndex((period) =>
                period.startDate <= booking.checkOutDate && period.endDate >= booking.checkInDate
            );

            if (oldUnavailablePeriodIndex > -1) {
                room.unavailablePeriod.splice(oldUnavailablePeriodIndex, 1);
            }

            // Add the new unavailable period
            room.unavailablePeriod.push({
                startDate: new Date(newCheckInDate),
                endDate: new Date(newCheckOutDate),
            });

            // Save the room with the updated unavailablePeriod
            await room.save();

            // Apply changes
            booking.checkInDate = newCheckInDate;
            booking.checkOutDate = newCheckOutDate;

        } 

        await booking.save();
        
        res.status(200).json({
            success:true, 
            data:booking
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message: "Cannot update Booking"
        });
    }

};

//@desc     Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
/* istanbul ignore next */
exports.deleteBooking = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await Booking.findById(req.params.id).session(session);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.id}`,
            });
        }

        // Make sure the user is the booking owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this booking`,
            });
        }

        // User must delete the booking at least 7 nights before the check-in date
        if (booking.bookingDate - Date.now() < 7 * nights && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'The user must cancel the booking at least 7 nights before the check-in date',
            });
        }

        // Delete all associated payments
        await Payment.deleteMany({ booking: req.params.id }).session(session);

        // Update room's unavailablePeriod
        const room = await Room.findById(booking.room).session(session);

        const checkInDate = new Date(booking.checkInDate).toISOString
        const checkOutDate = new Date(booking.checkOutDate).toISOString

        // Remove the period from unavailablePeriod array if it matches the booking's dates
        room.unavailablePeriod = room.unavailablePeriod.filter((period) => {
            return !(
                new Date(period.startDate).toISOString === checkInDate &&
                new Date(period.endDate).toISOString === checkOutDate
            );
        });

        // Save the updated room document
        const savedRoom = await room.save({ session });

        // Delete the booking
        await booking.deleteOne({ session });

        // Commit the transaction
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        await session.abortTransaction();
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Cannot delete Booking',
        });
    } finally {
        session.endSession();
    }
};
