import { loadStripe } from "@stripe/stripe-js";

// singleton — loadStripe must not be called inside a render
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
