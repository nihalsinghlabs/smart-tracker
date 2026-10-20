
function parseDate(dateValue) {
  if (!dateValue) return null;

  // Parse YYYY-MM-DD as a local calendar date.
  if (typeof dateValue === "string") {
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const date = new Date(year, month - 1, day);

      // Reject invalid dates such as 2026-02-30.
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return null;
      }

      return date;
    }
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

export function getDaysRemaining(expiryDate) {
  const expiry = parseDate(expiryDate);

  if (!expiry) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const difference = expiry.getTime() - today.getTime();

  return Math.round(difference / (1000 * 60 * 60 * 24));
}

export function getStatus(expiryDate) {
  const days = getDaysRemaining(expiryDate);

  if (days === null) return "Unknown";
  if (days < 0) return "Expired";
  if (days <= 7) return "Expiring Soon";

  return "Safe";
}

export function formatDate(dateValue) {
  const date = parseDate(dateValue);

  if (!date) return "Unknown";

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
