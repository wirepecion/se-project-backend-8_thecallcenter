const updatePayment = require('../controllers/payments').updatePayment;

const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
jest.mock('../models/Booking');
jest.mock('../models/User');
jest.mock('../models/Payment');
jest.mock('../models/Room');
jest.mock('../models/Hotel'); 

jest.mock('../utils/logCreation', () => ({
    logCreation: jest.fn().mockResolvedValue(undefined)
}));

let req, res;
const saveMock = jest.fn();

const mockBooking = {
    _id: 'mockBookingId',
    user: 'user123',
    hotel: 'mockHotelId',
    status: 'pending',
    checkInDate: new Date('2025-04-24'),
    checkOutDate: new Date('2025-04-25'),
    room: 'room123',
    save: saveMock,
};

const mockHotel = {
    _id: 'mockHotelId',
};

const mockPayment = {
    _id: 'mockPaymentId',
    method: 'Card',
    booking: mockBooking._id,
    user: 'user123',
    amount: 1000,
    status: 'unpaid',
    save: saveMock,
};

const mockHotelManager = {
    _id: 'managerId',
    email: 'manager@example.com',
};

const mockCustomer = {
    _id: 'user123',
    name: 'Test Customer',
};

beforeEach(() => {
    req = {
        params: { id: 'mockPaymentId' },
        user: { id: 'user123', role: 'user', email: 'user@example.com', name: 'Test User' },
        body: {},
    };

    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    Payment.findById.mockResolvedValue(mockPayment);
    Booking.findById.mockResolvedValueOnce(mockBooking);
    Hotel.findById.mockResolvedValue(mockHotel);
    User.findOne.mockResolvedValue(mockHotelManager);
    User.findById.mockResolvedValue(mockCustomer);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('Update Payment', () => {
    it('should return 200 if payment method is updated successfully', async () => {
        req.body.method = 'Bank';

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Payment updated successfully',
            data: expect.objectContaining({
                method: 'Bank',
            }),
        });
    });

    it('should return 400 if payment method is invalid', async () => {
        req.body.method = 'MongoDB';

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid payment method. Allowed values: Card, Bank, ThaiQR.',
        });
    });

    it('should return 404 if payment not found', async () => {
        Payment.findById.mockResolvedValue(null);

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: expect.stringContaining('Payment not found'),
        });
    });

    it('should return 200 if admin tries to set status to unpaid', async () => {
        req.body.status = 'unpaid';
        req.user.role = 'admin';

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Payment updated successfully',
            data: expect.objectContaining({
                status: 'unpaid',
            }),
        });
    });

    it('should return 400 if non-admin user tries to set status to unpaid', async () => {
        req.body.status = 'unpaid';
        req.user.role = 'user';

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: `Cannot update the payment status to 'unpaid' as the user is not an admin.`,
        });
    });

    it('should return 200 if anyone tries to set status to pending', async () => {
        req.body.status = 'pending';

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Payment updated successfully',
            data: expect.objectContaining({
                status: 'pending',
            }),
        });
    });

    it('should return 200 if admin tries to set status to completed', async () => {
        req.body.status = 'completed';
        req.user.role = 'admin';

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Payment updated successfully',
            data: expect.objectContaining({
                status: 'completed',
            }),
        });
    });

    it('should return 400 if non-admin user tries to set status to completed', async () => {
        req.body.status = 'completed';
        req.user.role = 'user';

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: `You are not allowed to update the payment status to 'completed'`,
        });
    });

    it('should return 400 if anyone tries to set status to canceled', async () => {
        req.body.status = 'canceled';

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Cannot cancel a payment directly.Payment must be cancel through refunding booking.',
        });
    });

    it('should return 400 if anyone tries to set an invalid status', async () => {
        req.body.status = 'Banana';

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid payment status. Allowed values: unpaid, pending, completed, failed, canceled.',
        });
    });

    it('should handle errors and return 500 response', async () => {
        Payment.findById.mockRejectedValue(new Error('Some error'));

        await updatePayment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error occurred while updating payment',
        });
    });
});
