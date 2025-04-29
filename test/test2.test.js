const { updateBooking } = require('../controllers/bookings'); // Adjust the path
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Room = require('../models/Room');

jest.mock('../models/Booking');
jest.mock('../models/Payment');
jest.mock('../models/User');
jest.mock('../models/Room');

describe('updateBooking', () => {
    let req, res, next, booking, user, room, payment;

    beforeEach(() => {
        booking = {
            id: 'booking-id',
            user: 'user-id',
            hotel: 'hotel-id',
            status: 'confirmed',
            checkInDate: new Date(),
            checkOutDate: new Date(),
            room: 'room-id',
            save: jest.fn(),
        };
        
        user = {
            id: 'user-id',
            role: 'admin',
            responsibleHotel: 'hotel-id',
        };
        
        room = {
            id: 'room-id',
            unavailablePeriod: [],
            save: jest.fn(),
        };
        
        payment = {
            booking: 'booking-id',
            status: 'completed',
            amount: 500,
            save: jest.fn(),
        };

        req = {
            params: { id: 'booking-id' },
            user: user,
            body: {},
        };
        
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        
        next = jest.fn();

        Booking.findById.mockResolvedValue(booking);
        User.findById.mockResolvedValue(user);
        Room.findById.mockResolvedValue(room);
        Payment.findOne.mockResolvedValue(payment);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 404 if booking not found', async () => {
        Booking.findById.mockResolvedValue(null);
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'No booking with the id of booking-id',
        });
    });

    it('should return 401 if user is not authorized to update the booking', async () => {
        user.role = 'user';
        booking.user = 'other-user-id';
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'User user-id is not authorized to update this booking',
        });
    });

    it('should return 400 if status is updated with checkInDate or checkOutDate', async () => {
        req.body = { status: 'confirmed', checkInDate: '2025-05-01' };
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'InvalidRequest',
            message: "Cannot update 'status' together with 'checkInDate' in the same request.",
        });
    });

    it('should return 400 if invalid status is provided', async () => {
        req.body = { status: 'invalid-status' };
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid booking status. Allowed values: pending, confirmed, canceled, checkedIn, completed.',
        });
    });

    it('should return 400 if booking cannot be canceled', async () => {
        booking.status = 'completed';
        
        req.body = { status: 'canceled' };
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Booking cannot be canceled at this stage.',
        });
    });

    it('should return 400 if no completed payment is found for refund', async () => {
        Payment.findOne.mockResolvedValue(null);
        
        req.body = { status: 'canceled' };
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'No completed payment found for refund.',
        });
    });

    it('should return 400 if refund amount is invalid', async () => {
        req.body = { status: 'canceled' };
        
        payment.amount = 0;
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Refund failed. No refundable amount available.',
        });
    });

    it('should update booking status to canceled and process refund', async () => {
        req.body = { status: 'canceled' };
        
        await updateBooking(req, res, next);
        
        expect(payment.save).toHaveBeenCalled();
        expect(user.save).toHaveBeenCalled();
        expect(room.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: booking,
        });
    });

    it('should update booking status to completed and update membership points', async () => {
        req.body = { status: 'completed' };
        
        await updateBooking(req, res, next);
        
        expect(user.membershipPoints).toBeGreaterThan(0);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: booking,
        });
    });

    it('should return 400 if check-out date is before check-in date', async () => {
        req.body = { checkInDate: '2025-05-01', checkOutDate: '2025-04-30' };
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Check-out date must be after check-in date.',
        });
    });

    it('should return 400 if duration is more than 3 nights', async () => {
        req.body = { checkInDate: '2025-05-01', checkOutDate: '2025-05-05' };
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'User can only book up to 3 nights.',
        });
    });

    it('should return 404 if room not found', async () => {
        Room.findById.mockResolvedValue(null);
        
        req.body = { checkInDate: '2025-05-01', checkOutDate: '2025-05-03' };
        
        await updateBooking(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Room not found for this booking.',
        });
    });
});
