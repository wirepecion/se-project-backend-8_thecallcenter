const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Payment = require('../models/Payment');
const Room = require('../models/Room');
const { checkout } = require('../routes/auth');

//@desc     Get all bookings
//@route    GET /api/v1/bookings
//@access   Public
exports.getBookings= async(req,res,next) => {
    let query;
    
    //General users can see only their bookings!
    if (req.user.role !== 'admin') {
        query = Booking.find({user:req.user.id})
            .populate({
                path: 'payments',
                select: 'amount method status createdAt' // select fields you want from Payment
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

            console.log(req.params.hotelId);

            query = Booking.find({hotel:req.params.hotelId})
                .populate({
                    path: 'payments',
                    select: 'amount method status createdAt' // select fields you want from Payment
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

            query = Booking.find()
                .populate({
                    path: 'payments',
                    select: 'amount method status' // select fields you want from Payment
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
    try {
        const bookings = await query;

        res.status(200).json({
            success:true, 
            count:bookings.length, 
            data:bookings
        });
    } catch (error) {
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
exports.getBooking= async(req,res,next) => {
    try {
        const booking = await Booking.findById(req.params.id)
        .populate({
            path: 'payments',
            select: 'amount method status createdAt' // select fields you want from Payment
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
        const maxNights = 3 * 24 * 60 * 60 * 1000; 
        if (newCheckOutDate - newCheckInDate > maxNights && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `User can only book up to 3 nights.`,
            });
        }

        // Payment method validation
        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required.',
            });
        }

        // Step 2: Fetch room and check availability
        const room = await Room.findById(roomId);

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

        // Step 3: Create the booking
        const booking = new Booking({
            user: userId,
            room: roomId,
            hotel: room.hotel,
            checkInDate: newCheckInDate,
            checkOutDate: newCheckOutDate,
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
            amount: room.price,
            status: 'unpaid',
            method: paymentMethod,
        });
        await payment.save(); // Save payment

        // Respond with the success response
        res.status(201).json({
            success: true,
            message: 'Booking successfully created',
            data: booking,
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

        if (!booking) {
            return res.status(404).json({
                success:false,
                message: `No booking with the id of ${req.params.id}`
            });
        }

        //Make sure the user is the booking owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success:false,
                message: `User ${req.user.id} is not authorized to update this booking`
            });
        }

        //Check if check-in or check-out dates are being updated
        const { checkInDate, checkOutDate, status } = req.body;
        const user = req.user;

        if (status !== undefined && (checkInDate !== undefined || checkOutDate !== undefined)) {
            console.log(`[VALIDATION] ${user.role} ['${user.id}'] attempted to update 'status' together with '${checkInDate ? 'amount' : ''}${checkInDate && checkOutDate ? ' and ' : ''}${checkOutDate ? 'method' : ''}' in the same request. Not allowed. Booking ID: ${req.params.id}`);

            return res.status(400).json({
              error: "InvalidRequest",
              message: "Cannot update 'status' together with 'checkInDate' or 'checkOutDate' in the same request."
            });
        }

        if (status && status === 'pending') {
            if(user.role !== 'admin') {
                console.warn(`[SECURITY] ${user.role} ['${user.id}'] attempted to set booking status to 'pending' (not allowed). Booking ID: ${req.params.id}`);

                return res.status(400).json({
                    success: false,
                    message: `Cannot update the booking status to 'pending' as the user is not an admin.`
                });
                
            } else {
                booking.status = status;
                console.log(`[BOOKING] Admin['${user.id}'] successfully set booking status to 'unpaid'. Booking ID: ${req.params.id}`);
            }
        } else if (status && status === 'canceled') {

            //FOR TEST
            console.log(`[REFUND] Refund processed successfully for Booking ID: ${req.params.id}. Amount refunded: 2000 THB`);

            //TODO US2-3 - BE - Create: implement refund logic
            
            //TODO US2-3 - BE - Create: update booking status on cancellation

            //TODO US2-3 - BE - Create: process refund payment and store result

            //TODO US2-3 - BE - Create: log refund attempt and outcome

            //TODO US2-3 - BE - Create: add alert to display deny message when refund is failed

            //TODO US2-3 - BE - Create: send email/notification when refund is processed

        } else if (status && [ 'confirmed', 'checkedIn', 'completed'].includes(status)){
            if (user.role === 'user') {

                console.warn(`[SECURITY] Customer ['${user.id}'] attempted to update booking status to '${status}' (not allowed). Booking ID: ${req.params.id}`);

                return res.status(403).json({
                    success: false,
                    message: `You are not allowed to update the booking status to '${status}'`
                });
            }

            booking.status = status;
            console.log(`[BOOKING] ${user.role} ['${user.id}'] successfully updated booking status to '${status}'. Booking ID: ${req.params.id}`);
        } else if (status) {
            console.warn(`[VALIDATION] ${user.role} ['${user.id}'] attempted to set invalid booking status to '${status}'. Booking ID: ${req.params.id}`);

            return res.status(400).json({
                success: false,
                message: 'Invalid booking status. Allowed values: pending, confirmed, canceled, checkedIn, completed.'
            });
        }


        if (checkInDate && checkOutDate) {
            const newCheckInDate = new Date(checkInDate);
            const newCheckOutDate = new Date(checkOutDate);

            //Check-out date must be after the check-in date
            if (newCheckOutDate <= newCheckInDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-out date must be after check-in date.'
                });
            }

            //If the user is not an admin, they can only book up to 3 nights
            if (newCheckOutDate - newCheckInDate > 3 * 24 * 60 * 60 * 1000 && req.user.role !== 'admin') {
                return res.status(400).json({
                    success: false,
                    message: 'User can only book up to 3 nights.'
                });
            }

            booking.checkInDate = newCheckInDate;
            booking.checkOutDate = newCheckOutDate;
        } else if (checkInDate && !checkOutDate) {
            const newCheckInDate = new Date(checkInDate);

            //Check-out date must be after the check-in date
            if (booking.checkOutDate <= newCheckInDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-out date must be after check-in date.'
                });
            }

            //If the user is not an admin, they can only book up to 3 nights
            if (booking.checkOutDate - newCheckInDate > 3 * 24 * 60 * 60 * 1000 && req.user.role !== 'admin') {
                return res.status(400).json({
                    success: false,
                    message: 'User can only book up to 3 nights.'
                });
            }
            booking.checkInDate = newCheckInDate;
        } else if (!checkInDate && checkOutDate) {
            const newCheckOutDate = new Date(checkOutDate);

            //Check-out date must be after the check-in date
            if (newCheckOutDate <= booking.checkInDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-out date must be after check-in date.'
                });
            }

            //If the user is not an admin, they can only book up to 3 nights
            if (newCheckOutDate - booking.checkInDate > 3 * 24 * 60 * 60 * 1000 && req.user.role !== 'admin') {
                return res.status(400).json({
                    success: false,
                    message: 'User can only book up to 3 nights.'
                });
            }

            booking.checkOutDate = newCheckOutDate;
        }

        await booking.save(); //change from findbyID to save directly becuase we alreay find it leaw.

        // Step 1: Find the associated Room
        const room = await Room.findById(booking.room);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found for this booking.',
            });
        }

        // Step 2: Remove the previous unavailable period for the booking
        const oldUnavailablePeriodIndex = room.unavailablePeriod.findIndex((period) =>
            period.startDate <= booking.checkOutDate && period.endDate >= booking.checkInDate
        );

        if (oldUnavailablePeriodIndex > -1) {
            room.unavailablePeriod.splice(oldUnavailablePeriodIndex, 1);
        }

        // Step 3: Add the new unavailable period
        room.unavailablePeriod.push({
            startDate: new Date(booking.checkInDate),
            endDate: new Date(booking.checkOutDate),
        });

        // Step 4: Save the room with the updated unavailablePeriod
        await room.save();

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

        // User must delete the booking at least 7 days before the check-in date
        if (booking.bookingDate - Date.now() < 7 * 24 * 60 * 60 * 1000 && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'The user must cancel the booking at least 7 days before the check-in date',
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
