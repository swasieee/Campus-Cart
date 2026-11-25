// wa.me needs digits only, with country code (e.g. 919876543210).
export function buildWhatsAppUrl({ sellerPhone, sellerName, itemTitle }) {
  const phone = String(sellerPhone ?? "").replace(/\D/g, "");
  const text = `Hi ${sellerName}, I am interested in purchasing your "${itemTitle}" listed on Campus Exchange.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
