const refundCalculation = require('../utils/refundCalculation').refundCalculation;

describe('Refund Calculation | Before Check-In Date', () => {
    const CheckInDate = new Date('2025-04-25');
    const CheckOutDate = new Date('2025-04-26');
    const paymentAmount = 1000;

    test('Cancel more than 3 days before check-in date', () => {
        const CancellationDate = new Date('2025-04-21');
        
        // 90% refund
        const expectedRefund = 0.90 * paymentAmount; 
        expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
    });

    test('Cancel within 3 days before check-in date', () => {
        const CancellationDate = new Date('2025-04-22');
        
        // 50% refund
        const expectedRefund = 0.50 * paymentAmount; 
        expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
    });

});


describe('Refund Calculation | During Stay', () => {
    const paymentAmount = 1000;
    const CheckInDate = new Date('2025-04-25');

    describe('1 Night Booking', () => {
        const CheckOutDate = new Date('2025-04-26');

        test('1 Night Booking', () => {
            const CancellationDate = new Date('2025-04-25');
            
            // 0% refund
            const expectedRefund = 0.00 * paymentAmount; 
            expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
        });

    });


    describe('2 Nights Booking', () => {
        const CheckOutDate = new Date('2025-04-27');

        test('2 Nights Booking | Stay less than 24 hours', () => {
            const CancellationDate = new Date('2025-04-25');
            
            // 25% refund
            const expectedRefund = 0.25 * paymentAmount; 
            expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
        });

        test('2 Nights Booking | Stay more than (or equal to) 24 hours', () => {
            const CancellationDate = new Date('2025-04-26');
            
            // 0% refund
            const expectedRefund = 0.00 * paymentAmount; 
            expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
        });

    });


    describe('3 Nights Booking', () => {
        const CheckOutDate = new Date('2025-04-28');

        test('3 Nights Booking | Stay less than 24 hours', () => {
            const CancellationDate = new Date('2025-04-25');
            
            // 36.5% refund
            const expectedRefund = 0.365 * paymentAmount; 
            expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
        });

        test('3 Nights Booking | Stay more than (or equal to) 1 day but less than 2 days', () => {
            const CancellationDate = new Date('2025-04-26');
            
            // 12% refund
            const expectedRefund = 0.12 * paymentAmount; 
            expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
        });

        test('3 Nights Booking | Stay more than (or equal to) 2 days', () => {
            const CancellationDate = new Date('2025-04-27');
            
            // 0% refund
            const expectedRefund = 0.00 * paymentAmount; 
            expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
        });

    });


    describe('4 Nights Booking (invalid)', () => {
        const CheckOutDate = new Date('2025-04-29');

        test('4 Night Booking', () => {
            const CancellationDate = new Date('2025-04-25');
            
            // 0% refund
            const expectedRefund = -1 * paymentAmount; 
            expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
        });

    });

});

describe('Refund Calculation | After Check-Out Date', () => {
    const CheckInDate = new Date('2025-04-25');
    const CheckOutDate = new Date('2025-04-26');
    const paymentAmount = 1000;

    test('Cancel after check-out date', () => {
        const CancellationDate = new Date('2025-04-27');
        
        // 0% refund
        const expectedRefund = 0.00 * paymentAmount; 
        expect(refundCalculation(CheckInDate, CheckOutDate, CancellationDate, paymentAmount)).toBe(expectedRefund);
    });

});