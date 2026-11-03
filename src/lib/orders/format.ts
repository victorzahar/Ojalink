const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const lagosDateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
});

const lagosDateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export function formatNaira(kobo: number) {
  return nairaFormatter.format(kobo / 100);
}

export function formatDateLagos(date: Date) {
  return lagosDateFormatter.format(date);
}

export function formatDateTimeLagos(date: Date) {
  return lagosDateTimeFormatter.format(date);
}
