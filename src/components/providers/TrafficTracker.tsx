"use client";

import { useEffect } from "react";

export function TrafficTracker() {
  useEffect(() => {
    // Only run once per session
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("um_traffic_tracked")) return;

    // Generate a simple random session ID
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        url: window.location.href,
        referrer: document.referrer || "",
      })
    })
    .then(res => {
      if (res.ok) {
        sessionStorage.setItem("um_traffic_tracked", "1");
      }
    })
    .catch(() => {});
  }, []);

  return null;
}
