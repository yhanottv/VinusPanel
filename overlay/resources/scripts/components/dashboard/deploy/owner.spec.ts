import { pickOwnerId } from './owner';

const users = [
    { id: 1, email: 'first@example.com' },
    { id: 7, email: 'Admin@Example.com' },
];

describe('pickOwnerId', () => {
    it('selects the signed-in administrator instead of the first account', () => {
        expect(pickOwnerId(users, 'admin@example.com')).toBe(7);
    });

    it('ignores case and surrounding spaces in the e-mail address', () => {
        expect(pickOwnerId(users, ' ADMIN@example.COM ')).toBe(7);
    });

    it('falls back to the first account when nothing matches', () => {
        expect(pickOwnerId(users, 'unknown@example.com')).toBe(1);
        expect(pickOwnerId(users, undefined)).toBe(1);
    });

    it('returns 0 when there are no accounts', () => {
        expect(pickOwnerId([], 'admin@example.com')).toBe(0);
    });
});
