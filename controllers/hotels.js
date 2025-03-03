const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

//@desc     Get all hotels
//@route    GET /api/v1/hotels
//@access   Public
exports.getHotels = async(req,res,next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = {...req.query};

        //Fields to exclude
        const removeFields = ['select','sort','page','limit'];

        //Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);
        console.log(reqQuery);

        //Create query string
        let queryStr = JSON.stringify(req.query);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        //Finding resource
        query = Hotel.find(JSON.parse(queryStr)).populate({path: 'bookings'}).populate({path: 'rooms'});

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
        const total = await Hotel.countDocuments();

        query = query.skip(startIndex).limit(limit);

        //Executing query
        const hotels = await query;

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

        console.log(req.query);
        res.status(200).json({
            success:true, 
            count:hotels.length, 
            pagination,
            data:hotels});
    } catch (err) {
        res.status(400).json({success:false});
    }
};

//@desc     Get single hotel
//@route    GET /api/v1/hotels/:id
//@access   Public
exports.getHotel= async(req,res,next) => {
    try {
        const hotel = await Hotel.findById(req.params.id).populate({path: 'bookings'}).populate({path: 'rooms'});

        if (!hotel) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:hotel});
    } catch (err) {
        res.status(400).json({success:false});
    }
};

//@desc     Create a hotel
//@route    POST /api/v1/hotels
//@access   Private
exports.createHotel= async(req,res,next) => {
    try {
        const { name, address, rooms } = req.body;

        // Check if at least one room is provided
        if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one room must be created when adding a hotel."
            });
        }

        // Create the hotel
        const hotel = await Hotel.create({ name, address });

        // Add hotel reference to each room and create rooms
        const createdRooms = await Room.insertMany(
            rooms.map(room => ({
                ...room,
                hotel: hotel._id // Associate room with the hotel
            }))
        );

        res.status(201).json({
            success: true,
            data: {
                hotel,
                rooms: createdRooms
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Cannot create hotel"
        });
    }
};

//@desc     Update single hotel
//@route    PUT /api/v1/hotels/:id
//@access   Private
exports.updateHotel= async (req,res,next) => {
    try {
        const { rooms, ...hotelData } = req.body; // Separate rooms from hotel data

        // Find the hotel
        let hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: `Hotel not found with id of ${req.params.id}`
            });
        }

        // Update hotel details
        hotel = await Hotel.findByIdAndUpdate(req.params.id, hotelData, {
            new: true,
            runValidators: true
        });

        // If rooms are provided, update them
        if (rooms && Array.isArray(rooms) && rooms.length > 0) {
            // Remove all existing rooms of this hotel
            await Room.deleteMany({ hotel: hotel._id });

            // Insert new rooms
            await Room.insertMany(
                rooms.map(room => ({
                    ...room,
                    hotel: hotel._id
                }))
            );
        }

        res.status(200).json({
            success: true,
            data: hotel
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Cannot update hotel"
        });
    }
};

//@desc     Delete single hotel
//@route    DELETE /api/v1/hotels/:id
//@access   Private
exports.deleteHotel= async(req,res,next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: `Hotel not found with id of ${req.params.id}`
            });
        }

        // Delete all bookings linked to this hotel
        await Booking.deleteMany({ hotel: hotel._id });

        // Delete all rooms associated with this hotel
        await Room.deleteMany({ hotel: hotel._id });

        // Delete the hotel itself
        await hotel.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Cannot delete hotel"
        });
    }
};