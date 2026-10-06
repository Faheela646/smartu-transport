export const VIOLATION_TYPES = [
  { value: "without_ticket", label: "Without ticket" },
  { value: "not_registered", label: "Not registered" },
  { value: "misbehaviour", label: "Misbehaviour" },
  { value: "damage_to_bus", label: "Damage to bus property" },
  { value: "safety_violation", label: "Safety violation" },
];

export const ROLL_RE = /^\d{2}[A-Z]{1,4}-\d{4}$/;

export function formatRoll(raw) {
  const clean = String(raw || "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const digits = clean.match(/^\d{0,2}/)?.[0] || "";
  const letters = clean.slice(digits.length).replace(/-/g, "").match(/^[A-Z]{0,4}/)?.[0] || "";
  const suffix = clean.slice(digits.length + (clean.slice(digits.length).startsWith("-") ? 1 : 0) + letters.length)
    .replace(/\D/g, "").slice(0, 4);
  return `${digits}${letters}${suffix ? `-${suffix}` : ""}`;
}

export function penaltyFor(count) {
  if (count === 1) return { amount: 1000, label: "Rs. 1,000" };
  if (count === 2) return { amount: 5000, label: "Rs. 5,000" };
  return { amount: 0, label: "Referred to Disciplinary Committee (DDC)" };
}
