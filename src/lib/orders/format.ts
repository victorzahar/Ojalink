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

export function formatNaira(kobo: number) {
  return nairaFormatter.format(kobo / 100);
}

export function formatDateLagos(date: Date) {
  return lagosDateFormatter.format(date);
}
