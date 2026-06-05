const validStatuses = ["pending", "completed"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function validateEmail(email) {
  return emailPattern.test(normalizeEmail(email));
}

export function validateStatus(status, options = {}) {
  const { allowAll = false } = options;

  if (allowAll && status === "all") {
    return true;
  }

  return validStatuses.includes(status);
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
