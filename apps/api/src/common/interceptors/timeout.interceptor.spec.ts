import { TIMEOUT_MS_KEY, TimeoutInterceptor } from './timeout.interceptor';
import { of, throwError } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

type AnyCtx = ExecutionContext;

const mockedReflector = (lookup: Record<string, unknown>): Reflector =>
  ({
    getAllAndOverride: (key: string) => lookup[key],
  }) as unknown as Reflector;

const makeCtx = (): AnyCtx =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  }) as unknown as AnyCtx;

describe('TimeoutInterceptor', () => {
  it('uses reflector-provided timeout', async () => {
    const interceptor = new TimeoutInterceptor(mockedReflector({ [TIMEOUT_MS_KEY]: 25 }));
    const handle = (async () => {
      await new Promise((r) => setTimeout(r, 80));
      return 1;
    })();
    const obs = interceptor.intercept(makeCtx(), { handle: () => handle as never });
    await expect(new Promise<unknown>((resolve, reject) => {
      obs.subscribe({ next: resolve, error: reject });
    })).rejects.toThrow(/Request exceeded 25ms/);
  });

  it('falls back to default when no decorator is set', async () => {
    const interceptor = new TimeoutInterceptor(mockedReflector({}));
    const obs = interceptor.intercept(makeCtx(), {
      handle: () => Promise.resolve(1) as never,
    });
    await new Promise<void>((resolve, reject) => {
      obs.subscribe({ next: () => resolve(), error: reject });
    });
  });

  it('passes non-TimeoutError errors through unchanged', () => {
    const interceptor = new TimeoutInterceptor(mockedReflector({}));
    const obs = interceptor.intercept(makeCtx(), {
      handle: () => throwError(() => new Error('boom')),
    });
    return new Promise<void>((resolve, reject) => {
      obs.subscribe({ next: () => reject(new Error('expected error')), error: (err) => {
        expect(err.message).toBe('boom');
        resolve();
      } });
    });
  });
});