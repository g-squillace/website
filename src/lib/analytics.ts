type EventParams = Record<string, string | number | boolean>;
type Gtag = (command: 'event', eventName: string, params?: EventParams) => void;

function isGtag(value: unknown): value is Gtag {
  return typeof value === 'function';
}

export function trackEvent(eventName: string, params?: EventParams): void {
  const gtag: unknown = Reflect.get(window, 'gtag');
  if (isGtag(gtag)) gtag('event', eventName, params);
}
