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
//@route    POST /api/v1/hotels/:hotelId/bookings
//@access   Private
exports.addBooking = async(req,res,next) => {
    try {

        const roomId = req.params.roomId;
        const userId = req.user.id;

        // Step 1: Validate check-in and check-out dates
        const { checkInDate, checkOutDate, paymentMethod } = req.body;

        const newCheckInDate = new Date(checkInDate);
        const newCheckOutDate = new Date(checkOutDate);

        
        //Check-out date must be after the check-in date
        if (checkOutDate <= checkInDate) {
            return res.status(400).json({
                success:false,
                message: `Please choose a check-out date that is after the check-in date`
            });
        }

        //If the user is not an admin, they can only book up to 3 nights
        if (checkOutDate - checkInDate > 3 * 24 * 60 * 60 * 1000 && req.user.role !== 'admin') {
            return res.status(400).json({
                success:false,
                message: `User can only book up to 3 nights`
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required.'
            });
        }

        const room = await Room.findById(roomId);

        // Step 2: Check room availability (you can add your custom logic here)
        const isUnavailable = room.availablePeriod.some(period => {
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);

            // Check if the booking dates overlap with any available period
            return (
                (checkIn >= new Date(period.startDate) && checkIn <= new Date(period.endDate)) ||
                (checkOut >= new Date(period.startDate) && checkOut <= new Date(period.endDate)) ||
                (checkIn <= new Date(period.startDate) && checkOut >= new Date(period.endDate))
            );
        });

        if (isUnavailable) {
            return res.status(400).json({
                success: false,
                message: 'Room not available for booking.'
            });
        }

        // Step 3: Create a booking
        const booking = new Booking({
            user: userId,
            room: roomId,
            hotel: room.hotel,
            checkInDate: newCheckInDate,
            checkOutDate: newCheckOutDate,
        });
        await booking.save(); // Save booking

        // Step 4: Update room availability (deduct the booking dates from available periods)
        room.availablePeriod = room.availablePeriod.map(period => {
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);

            // If booking dates overlap with any period, remove it from availablePeriod
            if (checkIn <= new Date(period.endDate) && checkOut >= new Date(period.startDate)) {
                // If the booking period is completely inside the available period
                if (checkIn > new Date(period.startDate) && checkOut < new Date(period.endDate)) {
                    // Split the period into two new available periods
                    return [
                        { startDate: period.startDate, endDate: new Date(checkIn).toISOString() },
                        { startDate: new Date(checkOut).toISOString(), endDate: period.endDate }
                    ];
                } else {
                    // If the period is fully booked, remove it
                    return null;
                }
            }
            return period;
        }).filter(Boolean); // Remove any `null` periods

        await room.save(); // Save updated room

        // Step 5: Process payment
        const payment = new Payment({
            booking: booking._id,
            user: userId,
            amount: room.price,
            status: 'unpaid',
            method: paymentMethod,
        });
        await payment.save(); // Save payment within the transaction

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
        const { checkInDate, checkOutDate } = req.body;

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
        }

        if (checkInDate && !checkOutDate) {
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
        }

        if (!checkInDate && checkOutDate) {
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
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new:true,
            runValidators:true
        });

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
exports.deleteBooking = async(req,res,next) => {
    try {
        const booking = await Booking.findById(req.params.id);

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
                message: `User ${req.user.id} is not authorized to delete this booking`
            });
        }

        //User must delete the booking at least 7 days before the check-in date
        if (booking.bookingDate - Date.now() < 7 * 24 * 60 * 60 * 1000 && req.user.role !== 'admin') {
            return res.status(400).json({
                success:false,
                message: "The user must cancel the booking at least 7 days before the check-in date"
            });
        }

        await booking.deleteOne();

        res.status(200).json({
            success:true, 
            data:{}
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message: "Cannot delete Booking"
        });
    }

};