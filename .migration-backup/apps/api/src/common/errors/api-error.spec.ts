import { toApiErrorPayload, ApiError, NotFoundError } from './api-error';

describe('toApiErrorPayload', () => {
  it('maps ApiError instance fields verbatim', () => {
    const err = new NotFoundError('widget');
    const payload = toApiErrorPayload(err, 'rid-123');
    expect(payload.code).toBe('NOT_FOUND');
    expect(payload.message).toBe('widget not found');
    expect(payload.traceId).toBe('rid-123');
  });

  it('falls back to INTERNAL_ERROR for plain Error', () => {
    const err = new Error('boom');
    const payload = toApiErrorPayload(err);
    expect(payload.code).toBe('INTERNAL_ERROR');
    expect(payload.message).toBe('Internal server error');
  });

  it('handles non-Error throws', () => {
    const payload = toApiErrorPayload('bad');
    expect(payload.code).toBe('INTERNAL_ERROR');
    expect(payload.message).toBe('Internal server error');
    expect(payload.details).toEqual({ cause: 'bad' });
  });

  it('preserves details when present', () => {
    class ValidationErr extends ApiError {
      constructor() {
        super('VALIDATION_ERROR', 'bad', 400, { field: 'name' });
      }
    }
    const payload = toApiErrorPayload(new ValidationErr());
    expect(payload.details).toEqual({ field: 'name' });
  });
});
