import { errorMessage } from './errorMessage';

it('does not expose server traces or network request secrets', () => {
    expect(errorMessage({ response: { status: 500, data: { errors: [{ detail: '/var/www/.env password=secret' }] } } })).not.toContain('secret');
    expect(errorMessage({ message: 'https://example.test?token=secret' })).not.toContain('secret');
});
it.each([401, 419])('explains expired sessions (%s)', (status) => {
    expect(errorMessage({ response: { status } })).toContain('session a expiré');
});
it('preserves explicit recovery advice from the catalogue', () => {
    expect(errorMessage({ response: { status: 500, data: { code: 'VINUS_CATALOG', errors: [{ detail: 'Récupérez les fichiers dans /vinus-test.' }] } } })).toContain('/vinus-test');
});
it('explains permissions and request limits', () => {
    expect(errorMessage({ response: { status: 403 } })).toContain('permissions');
    expect(errorMessage({ response: { status: 429 } })).toContain('Patientez');
});
