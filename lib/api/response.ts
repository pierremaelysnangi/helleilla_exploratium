import { NextResponse } from "next/server";
import { z } from "zod";

export const ErrorCode = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  RATE_LIMIT: 429,
  INTERNAL: 500,
} as const;

export type ErrorCodeKey = keyof typeof ErrorCode;

export class ApiError extends Error {
  constructor(
    public code: ErrorCodeKey,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function okPaginated<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number,
) {
  return NextResponse.json({
    data: items,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  });
}

export function fail(code: ErrorCodeKey, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status: ErrorCode[code] },
  );
}

export function failZod(err: z.ZodError) {
  return fail("VALIDATION", "Validation échouée", z.treeifyError(err));
}
