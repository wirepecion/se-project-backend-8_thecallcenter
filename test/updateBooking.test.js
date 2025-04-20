const updateBooking = require('../controllers/bookings').updateBooking;

const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Room = require('../models/Room');

jest.mock('../models/Booking');
jest.mock('../models/User');
jest.mock('../models/Payment');
jest.mock('../models/Room');

let req, res;

beforeEach(() => {
    req = {
        params: { id: 'mockBookingId' },
        user: { id: 'user123', role: 'user' },
        body: {},
    };

    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('Update Booking Controller | No booking in body', () => {

    it('should return 404 if booking not found', async () => {
        Booking.findById.mockResolvedValue(null);

        await updateBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: expect.stringContaining('No booking with the id'),
        });
    });

});


describe('Update Booking Controller | No booking status in body', () => {

    it('should return 200 if booking status not found in booking', async () => {
        const saveMock = jest.fn();
        const mockBooking = {
            user: 'user123',
            hotel: 'hotel456',
            status: 'pending',
            checkInDate: new Date('2025-04-24'),
            checkOutDate: new Date('2025-04-25'),
            room: 'room123',
            save: saveMock,
        };

        const mockRoom = {
            unavailablePeriod: [],
            save: saveMock,
        };

        Booking.findById.mockResolvedValue(mockBooking);
        Room.findById.mockResolvedValue(mockRoom);

        req.body.checkInDate = new Date('2025-04-25');
        req.body.checkOutDate = new Date('2025-04-26');
        
        await updateBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: expect.objectContaining({
                status: 'pending', // Default status
                checkInDate: new Date('2025-04-25'),
                checkOutDate: new Date('2025-04-26'),
            }),
        });
    });

});