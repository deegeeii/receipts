"use client";

import { useEffect } from "react";

// TimezoneSync — silently syncs the browser's IANA timezone to the user's profile on load
export default function TimezoneSync() {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    async function syncTimezone() {
      try {
        const response = await fetch("/api/users/timezone", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ timezone }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error("TimezoneSync: sync failed", data);
        }
      } catch (error) {
        console.error("TimezoneSync: sync failed", error);
      }
    }

    syncTimezone();
  }, []);

  return null;
}
