"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

if (typeof window !== "undefined") {
  // We use dummy strings so that if ENV variables are not presented, Posthog won't crash
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_your_key_here";
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  
  if (posthogKey && posthogKey !== "phc_your_key_here") {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "identified_only", // or "always" to capture profiles for all users
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.debug(false);
      },
      capture_pageview: false // we handle this manually below
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
