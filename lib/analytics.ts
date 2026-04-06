import posthog, { PostHog } from "posthog-js"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "ph_placeholder"
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"

export const initPostHog = (): PostHog | null => {
  if (typeof window !== "undefined" && POSTHOG_KEY !== "ph_placeholder") {
    posthog.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, autocapture: true })
    return posthog
  }
  return null
}

export const trackEvent = (event: string, properties?: any) => {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties)
  }
}
