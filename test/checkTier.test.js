const checkTier = require('../utils/checkMembershipTier').checkTier;

describe('Test Diamond Tier', () => {
    test('Test min', () => {
        expect(checkTier(750)).toBe('diamond');
    });

    test('Test at min+', () => {
        expect(checkTier(751)).toBe('diamond');
    });
}); 

describe('Test Platinum Tier', () => {
    test('Test at min', () => {
        expect(checkTier(500)).toBe('platinum');
    });

    test('Test at min+', () => {
        expect(checkTier(501)).toBe('platinum');
    });

    test('Test at nom', () => {
        expect(checkTier(625)).toBe('platinum');
    });

    test('Test at max-', () => {
        expect(checkTier(749)).toBe('platinum');
    });
});

describe('Test Gold Tier', () => {
    test('Test at min', () => {
        expect(checkTier(250)).toBe('gold');
    });

    test('Test at min+', () => {
        expect(checkTier(251)).toBe('gold');
    });

    test('Test at nom', () => {
        expect(checkTier(375)).toBe('gold');
    });

    test('Test at max-', () => {
        expect(checkTier(499)).toBe('gold');
    });
});

describe('Test Silver Tier', () => {
    test('Test at min', () => {
        expect(checkTier(125)).toBe('silver');
    });

    test('Test at min+', () => {
        expect(checkTier(126)).toBe('silver');
    });

    test('Test at nom', () => {
        expect(checkTier(188)).toBe('silver');
    });

    test('Test at max-', () => {
        expect(checkTier(249)).toBe('silver');
    });
});

describe('Test Bronze Tier', () => {
    test('Test at min', () => {
        expect(checkTier(50)).toBe('bronze');
    });

    test('Test at min+', () => {
        expect(checkTier(51)).toBe('bronze');
    });

    test('Test at nom', () => {
        expect(checkTier(86)).toBe('bronze');
    });

    test('Test at max-', () => {
        expect(checkTier(124)).toBe('bronze');
    });
});

describe('Test None membership', () => {
    test('Test at min', () => {
        expect(checkTier(0)).toBe('none');
    });

    test('Test at min+', () => {
        expect(checkTier(1)).toBe('none');
    });

    test('Test at nom', () => {
        expect(checkTier(25)).toBe('none');
    });

    test('Test at max-', () => {
        expect(checkTier(49)).toBe('none');
    });
});

describe('Test Invalid Test', () => {
    test('Test point < 0', () => {
        expect(checkTier(-1)).toBe(null);
    });

    test('Test point < 0', () => {
        expect(checkTier(-200)).toBe(null);
    });
});