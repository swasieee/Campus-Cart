export const DEPARTMENTS = [
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "ME",
  "CE",
  "AIML",
  "Data Science",
  "Other",
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const CATEGORIES = [
  "Books",
  "Notes",
  "Electronics",
  "Lab Equipment",
  "Stationery",
  "Hostel & Daily",
  "Other",
];

export const LISTING_TYPES = ["SELL", "EXCHANGE"];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatPriceRange({ price, priceMin, priceMax, listingType }) {
  const min = Number(priceMin ?? price ?? 0);
  const max = priceMax !== undefined && priceMax !== null && priceMax !== "" ? Number(priceMax) : min;

  if (listingType === "EXCHANGE") {
    if (min > 0 && max > min) return `Swap · ₹${min}–₹${max}`;
    if (min > 0) return `Swap · ~₹${min}`;
    return "Swap";
  }

  if (min <= 0 && max <= 0) return "Free";
  if (max > min) return `₹${min} – ₹${max}`;
  return `₹${min}`;
}
