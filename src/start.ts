import { createStart, createMiddleware } from "@tanstack/react-start";

import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Global session-expiry handler: when any server fn throws an Unauthorized
// error, redirect to /login with the current path as the redirect param.
const handleUnauthorized = createMiddleware({ type: "function" }).client(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (typeof window !== "undefined" && /unauthorized|401/i.test(msg)) {
      const here = window.location.pathname + window.location.search;
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace(`/login?redirect=${encodeURIComponent(here)}`);
      }
    }
    throw err;
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachSupabaseAuth, handleUnauthorized],
}));
