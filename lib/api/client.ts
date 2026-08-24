import { z } from "zod";
import { ApiError } from "./response";

type FetchOpts = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  revalidate?: number | false;
  tags?: string[];
  signal?: AbortSignal;
};

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function apiFetch<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  opts: FetchOpts = {},
): Promise<z.infer<S>> {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE);

  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: opts.body ? { "content-type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    next:
      opts.revalidate !== undefined || opts.tags
        ? { revalidate: opts.revalidate, tags: opts.tags }
        : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      json?.error?.code ?? "INTERNAL",
      json?.error?.message ?? res.statusText,
      json?.error?.details,
    );
  }

  return schema.parse(json);
}

export { ApiError };
