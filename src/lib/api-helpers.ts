import { NextResponse } from "next/server";

/**
 * Helper to create a cached JSON response
 */
export function createCachedResponse(data: unknown, maxAge: number = 60) {
  const response = NextResponse.json(data);
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
  );
  return response;
}

/**
 * Helper to parse pagination parameters from search params
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "100");
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Helper to create paginated response
 */
export function createPaginatedResponse(
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  maxAge: number = 60,
) {
  const response = NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });

  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
  );

  return response;
}

/**
 * Common query options for lean queries
 */
export const LEAN_QUERY_OPTIONS = {
  select: "-__v",
  lean: true,
} as const;

/**
 * Helper to handle API errors
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = "Unknown error",
) {
  const errorMsg = error instanceof Error ? error.message : defaultMessage;
  console.error("API Error:", errorMsg, error);
  return NextResponse.json({ error: errorMsg }, { status: 500 });
}
