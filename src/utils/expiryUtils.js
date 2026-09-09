export function getDaysRemaining(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const difference = expiry - today;

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

export function getStatus(expiryDate) {
  const days = getDaysRemaining(expiryDate);

  if (days < 0) return "Expired";

  if (days <= 7) return "Expiring Soon";

  return "Safe";
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}