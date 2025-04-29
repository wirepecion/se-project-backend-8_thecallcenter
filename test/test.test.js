const { updateBooking } = require('../controllers/bookings');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Room = require('../models/Room');
const { refundCalculation } = require('../utils/refundCalculation');
const { checkTier } = require('../utils/checkMembershipTier');
const { logCreation } = require('../utils/logCreation');

// Mock necessary models and utilities
jest.mock('../models/Booking');
jest.mock('../models/Payment');
jest.mock('../models/User');
jest.mock('../models/Room');
jest.mock('../utils/refundCalculation');
jest.mock('../utils/checkMembershipTier');
jest.mock('../utils/logCreation');

const mockBookingWithCancelableStatus = {
    _id: 'bookingId',
    user: 'userId',
    hotel: 'hotelId',
    room: 'roomId',
    status: 'confirmed', // important: confirmed allows cancelation
    checkInDate: new Date('2025-06-01'),
    checkOutDate: new Date('2025-06-03'),
    save: jest.fn()
};

const mockBooking = {
    _id: 'bookingId',
    user: 'userId',
    hotel: 'hotelId',
    room: 'roomId',
    status: 'pending',
    checkInDate: new Date('2025-06-01'),
    checkOutDate: new Date('2025-06-02'),
    save: jest.fn()
};

const mockRoom = {
    _id: 'roomId',
    unavailablePeriod: [],
    save: jest.fn()
};

const mockRoomWithPeriods = {
    _id: 'roomId',
    unavailablePeriod: [
        { startDate: new Date('2025-06-01'), endDate: new Date('2025-06-03') }
    ],
    save: jest.fn()
};

const mockPayment = {
    _id: 'paymentId',
    amount: 1000,
    status: 'completed',
    save: jest.fn()
};

const mockUser = {
    _id: 'userId',
    email: 'test@example.com',
    name: 'Test User',
    membershipPoints: 0,
    membershipTier: 'Bronze',
    save: jest.fn()
};

const mockAdminUser = {
    _id: 'adminId',
    role: 'admin'
};

const mockNormalUser = {
    _id: 'userId',
    role: 'user'
};

const mockUnauthorizedUser = {
    _id: 'unauthorizedUserId',
    role: 'user', // or 'hotelManager' depending on what you want to test
    responsibleHotel: 'someHotelId'
  };

const req = createMockRequest(
{ _id: 'bookingId' }, // req.params
{ status: 'confirmed' }, // req.body (what you send)
mockUnauthorizedUser    // req.user
);

const mockCheckTier = jest.fn(() => 'gold');
  

// Helper to mock req object
function createMockRequest(params = {}, body = {}, user = {}) {
    return {
      params,
      body,
      user
    };
  }
  
  // Helper to mock res object
  function createMockResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  


describe('updateBooking', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'bookingId' },
            user: { id: 'userId', role: 'user', responsibleHotel: 'hotelId' },
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should return 404 if booking not found', async () => {
        Booking.findById.mockResolvedValue(null);

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if user is unauthorized', async () => {
        Booking.findById.mockResolvedValue({ user: 'anotherUserId', hotel: 'anotherHotelId' });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if trying to update status and checkInDate/checkOutDate together', async () => {
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId' });
        req.body = { status: 'confirmed', checkInDate: '2025-06-01' };

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if non-admin tries to set status to pending', async () => {
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId' });
        req.body = { status: 'pending' };

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should allow admin to set pending status', async () => {
        req.user.role = 'admin';
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId', save: jest.fn() });
        req.body = { status: 'pending' };

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if booking cannot be canceled (wrong status)', async () => {
        req.body = { status: 'canceled' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId', status: 'pending' });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if no completed payment found', async () => {
        req.body = { status: 'canceled' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId', status: 'confirmed' });
        Payment.findOne.mockResolvedValue(null);

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if refundCalculation <= 0', async () => {
        req.body = { status: 'canceled' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId', status: 'confirmed', checkInDate: new Date(), checkOutDate: new Date(), room: 'roomId' });
        Payment.findOne.mockResolvedValue({ amount: 100, status: 'completed' });
        refundCalculation.mockReturnValue(0);

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should successfully refund if eligible', async () => {
        req.body = { status: 'canceled' };
        Booking.findById.mockResolvedValue({ 
            user: req.user.id, 
            hotel: 'hotelId', 
            status: 'confirmed', 
            checkInDate: new Date(), 
            checkOutDate: new Date(),
            room: 'roomId',
            save: jest.fn()
        });
        Payment.findOne.mockResolvedValue({ amount: 100, status: 'completed', save: jest.fn() });
        refundCalculation.mockReturnValue(50);
        Room.findById.mockResolvedValue({ unavailablePeriod: [], save: jest.fn() });
        User.findById.mockResolvedValue({ email: 'test@example.com', name: 'Test User' });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle error during refund process', async () => {
        req.body = { status: 'canceled' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId', status: 'confirmed' });
        Payment.findOne.mockImplementation(() => { throw new Error('Refund error'); });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should return 403 if user tries to update booking to confirmed/checkedIn/completed', async () => {
        req.body = { status: 'confirmed' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId' });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should update status to confirmed/checkedIn/completed by manager', async () => {
        req.user.role = 'hotelManager';
        req.body = { status: 'confirmed' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId', save: jest.fn() });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid status', async () => {
        req.body = { status: 'invalidStatus' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId' });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if check-out before check-in', async () => {
        req.body = { checkInDate: '2025-06-05', checkOutDate: '2025-06-01' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId' });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if duration exceeds 3 nights', async () => {
        req.body = { checkInDate: '2025-06-01', checkOutDate: '2025-06-10' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId' });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if room not found', async () => {
        req.body = { checkInDate: '2025-06-01', checkOutDate: '2025-06-02' };
        Booking.findById.mockResolvedValue({ user: req.user.id, hotel: 'hotelId', room: 'roomId' });
        Room.findById.mockResolvedValue(null);

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update checkIn/checkOut successfully', async () => {
        req.body = { checkInDate: '2025-06-01', checkOutDate: '2025-06-02' };
        Booking.findById.mockResolvedValue({ 
            user: req.user.id, 
            hotel: 'hotelId', 
            room: 'roomId', 
            save: jest.fn(),
            checkInDate: new Date(),
            checkOutDate: new Date()
        });
        Room.findById.mockResolvedValue({ unavailablePeriod: [], save: jest.fn() });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should catch and return 500 error on exception', async () => {
        Booking.findById.mockImplementation(() => { throw new Error('Unexpected error'); });

        await updateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle error during refund process', async () => {
        Booking.findById.mockResolvedValue(mockBookingWithCancelableStatus);
        Payment.findOne.mockResolvedValue(mockPayment);
        Payment.findOne = jest.fn(() => { throw new Error('DB FindOne error'); });
      
        const req = createMockRequest({ id: 'bookingId' }, { status: 'canceled' }, mockAdminUser);
        const res = createMockResponse();
        
        await updateBooking(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      });

      it('should update checkInDate and checkOutDate correctly', async () => {
        Booking.findById.mockResolvedValue(mockBooking);
        Room.findById.mockResolvedValue(mockRoomWithPeriods);
      
        const req = createMockRequest(
          { id: 'bookingId' },
          { checkInDate: '2025-06-01', checkOutDate: '2025-06-03' },
          mockUser
        );
        const res = createMockResponse();
      
        await updateBooking(req, res);
      
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      });
      
      
      it('should remove old unavailablePeriod correctly', async () => {
        Booking.findById.mockResolvedValue(mockBooking);
        Room.findById.mockResolvedValue({
          ...mockRoomWithPeriods,
          unavailablePeriod: [
            { startDate: new Date('2025-06-01'), endDate: new Date('2025-06-03') },
          ],
          save: jest.fn()
        });
      
        const req = createMockRequest(
          { id: 'bookingId' },
          { checkInDate: '2025-06-02', checkOutDate: '2025-06-04' },
          mockUser
        );
        const res = createMockResponse();
      
        await updateBooking(req, res);
      
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      });

      ///////////

      it('should update membership points and tier when status is completed', async () => {
        // Mock the initial setup
        const mockUserCopy = { ...mockUser, membershipPoints: 200, membershipTier: 'silver', save: jest.fn() };
      
        const mockRoom = {
          price: 5000, // Set the room price to 50000, which should give 500 / 100 = 500 points
        };
      
        const req = createMockRequest({ id: mockBooking._id }, { status: 'completed' }, mockUserCopy)

        const res = createMockResponse()
      
        // Mock Room.findById and User.findById
        Room.findById.mockResolvedValue(mockRoom);
        User.findById.mockResolvedValue(mockUserCopy);
        checkTier.mockReturnValue('gold'); // Return 'gold' for the new tier when membership points reach 250
      
        // Call the function
        await updateBooking(req, res);
      
        // Check if the user's membership points were updated correctly
        // expect(mockUser.membershipPoints).toBe(250); // 200 + (50000 / 100) = 250
      
        expect(mockUserCopy.membershipPoints).toBe(250); // 200 + (50000 / 100) = 250
        expect(mockUser.membershipTier).toBe('gold'); // Tier should change to 'gold'
      
        // Ensure user.save is called twice (once for updating points and once for tier update)
        expect(mockUser.save).toHaveBeenCalledTimes(2);
      
        // Check if the checkTier function was called
        expect(checkTier).toHaveBeenCalledWith(250);
      
        // Check if logCreation was called for tier update
        expect(logCreation).toHaveBeenCalledWith(
          mockUser.id,
          'MEMBERSHIP',
          `Membership tier updated to 'gold'`
        );
      
        // Optionally check the console logs for updates
        const consoleSpy = jest.spyOn(console, 'log');
        expect(consoleSpy).toHaveBeenCalledWith(
          `[MEMBERSHIP] ${mockUser.role} ['${mockUser.id}'] successfully updated membership points to '250'. Booking ID: bookingId`
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          `[MEMBERSHIP] ${mockUser.role} ['${mockUser.id}'] successfully updated membership tier to 'gold'. Booking ID: bookingId`
        );
      });
      
       
});
