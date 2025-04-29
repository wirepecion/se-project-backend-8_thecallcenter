const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

//@desc     Get all rooms
//@route    GET /api/v1/rooms
//@access   Public
exports.getRooms = async(req,res,next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = {...req.query};

        //Fields to exclude
        const removeFields = ['select','sort','page','limit'];

        //Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);
        //console.log(reqQuery);

        //Create query string
        let queryStr = JSON.stringify(req.query);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        //Finding resource
        query = Room.find(JSON.parse(queryStr)).populate({path: 'hotel', select: 'name'});

        //Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }
        //Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        //Pagination
        const page = parseInt(req.query.page,10) || 1;
        const limit = parseInt(req.query.limit,10) || 25;
        const startIndex = (page-1)*limit;
        const endIndex = page*limit;
        const total = await Room.countDocuments();

        query = query.skip(startIndex).limit(limit);

        //Executing query
        const rooms = await query;

        //Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page+1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page-1,
                limit
            };
        }

        //console.log(req.query);
        res.status(200).json({
            success:true, 
            count:rooms.length, 
            pagination,
            data:rooms});
    } catch (err) {
        console.log(err);
        res.status(400).json({success:false});
    }
};

//@desc     Get single room
//@route    GET /api/v1/rooms/:id
//@access   Public
exports.getRoom= async(req,res,next) => {
    try {

        const room = await Room.findById(req.params.id).populate({path: 'hotel', select: 'name'});

        if (!room) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:room});
    } catch (err) {
        res.status(400).json({success:false});
    }
};

//@desc     Create a room
//@route    POST /api/v1/rooms
//@access   Private
exports.createRoom= async(req,res,next) => {
    try {
        req.body.hotel = req.params.hotelId;

        const { type, number, price, unavailablePeriod } = req.body;

        // Find the hotel by ID
        const hotel = await Hotel.findById(req.params.hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found"
            });
        }

        if (type && !['standard','superior','deluxe','suite'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room type. Allowed values: standard, superior, deluxe, suite.'
            });
        }

        // Create a new room
        const room = new Room({
            hotel: hotel._id,
            type,
            number,
            price,
            unavailablePeriod
        })

        await room.save();

        res.status(201).json({
            success: true,
            data: room
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to add room"
        });
    }
};

//@desc     Update single room
//@route    PUT /api/v1/rooms/:id
//@access   Private
exports.updateRoom = async (req, res) => {
    const roomId = req.params.id;
    const { hotel, type, number, price, unavailablePeriod } = req.body;

    try {

        // Validate the room type (check if type is valid)
        if (type && !['standard','superior','deluxe','suite'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room type. Allowed values: standard, superior, deluxe, suite.'
            });
        }

        // Find the room by ID and update it
        const room = await Room.findByIdAndUpdate(
            roomId,
            { hotel, type, number, price, unavailablePeriod },
            { new: true, runValidators: true } // return updated room and run schema validations
        );

        console.log(room);

        // If no room is found
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found.'
            });
        }

        // Respond with the updated room data
        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
            data: room
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the room.'
        });
    }
};

//@desc     Delete single room
//@route    DELETE /api/v1/rooms/:id
//@access   Private
exports.deleteRoom = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: `Room not found with id of ${req.params.id}`
            });
        }

        // Count rooms in the hotel
        const roomCount = await Room.countDocuments({ hotel: room.hotel });

        // Prevent deletion if only one room is left
        if (roomCount <= 1) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete the only room in the hotel"
            });
        }

        // Delete all bookings related to this room
        await Booking.deleteMany({ room: req.params.id });

        // Delete the room
        await Room.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error: Cannot delete room"
        });
    }
};
