import { buildPaginationMeta, SortOrder } from './pagination.dto';

describe('buildPaginationMeta', () => {
  it('returns the correct totalPages, hasPrev/hasNext', () => {
    const meta = buildPaginationMeta(2, 10, 25, SortOrder.Asc);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasPrev).toBe(true);
    expect(meta.hasNext).toBe(true);
  });

  it('returns hasPrev=false on first page', () => {
    const meta = buildPaginationMeta(1, 10, 5);
    expect(meta.hasPrev).toBe(false);
    expect(meta.hasNext).toBe(false);
  });

  it('returns totalPages=1 when total <= limit', () => {
    const meta = buildPaginationMeta(1, 50, 3);
    expect(meta.totalPages).toBe(1);
  });

  it('handles zero / negative limit safely', () => {
    const meta = buildPaginationMeta(1, 0, 10);
    expect(meta.totalPages).toBe(1);
  });
});
