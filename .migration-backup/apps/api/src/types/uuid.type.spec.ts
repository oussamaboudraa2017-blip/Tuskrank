import { isUuid, asUuid } from './uuid.type';

describe('Uuid helpers', () => {
  it('isUuid() validates RFC-4122-ish UUIDs', () => {
    expect(isUuid('4f8d3c4c-67c7-4f56-9a8b-d1d6f6c2d6b5')).toBe(true);
    expect(isUuid('00000000-0000-4000-8000-000000000000')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid(123)).toBe(false);
  });

  it('asUuid() throws on invalid input', () => {
    expect(() => asUuid('bad')).toThrow(TypeError);
    expect(() => asUuid('4f8d3c4c-67c7-4f56-9a8b-d1d6f6c2d6b5')).not.toThrow();
  });
});
