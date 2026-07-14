// ── TYPES ─────────────────────────────────────────────────────────────────────
type PushMessage = {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  };
  
  // ── SEND ──────────────────────────────────────────────────────────────────────
  export async function sendPushNotification(
    message: PushMessage
  ): Promise<void> {
    try {
      const response = await fetch("https://exp.host/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("push: send failed", data);
      }
    } catch (err) {
      console.error("push: network error", err);
    }
  }
  
  // ── BATCH SEND ────────────────────────────────────────────────────────────────
  export async function sendPushNotifications(
    messages: PushMessage[]
  ): Promise<void> {
    if (messages.length === 0) return;
  
    try {
      const response = await fetch("https://exp.host/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("push: batch send failed", data);
      }
    } catch (err) {
      console.error("push: batch network error", err);
    }
  }
  