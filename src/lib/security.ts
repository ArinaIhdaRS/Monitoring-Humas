/**
 * Security helper utilities for input sanitization, SSRF prevention, and PII masking
 */

// Check if a URL is safe against SSRF attacks before server-side fetching
export function isSafeOutboundUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    
    // Only allow HTTP/HTTPS
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and loopback
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    // Block AWS / Cloud metadata endpoints
    if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") {
      return false;
    }

    // Block private RFC 1918 IPv4 ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const b1 = parseInt(match[1], 10);
      const b2 = parseInt(match[2], 10);
      // 10.0.0.0/8
      if (b1 === 10) return false;
      // 172.16.0.0/12
      if (b1 === 172 && b2 >= 16 && b2 <= 31) return false;
      // 192.168.0.0/16
      if (b1 === 192 && b2 === 168) return false;
      // 127.0.0.0/8
      if (b1 === 127) return false;
      // 169.254.0.0/16
      if (b1 === 169 && b2 === 254) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Sanitize attachment URL to prevent Stored XSS via javascript: or data:text/html
export function sanitizeAttachmentUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Disallow javascript:, vbscript:, data:text/html
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:text/html") ||
    lower.startsWith("data:text/javascript") ||
    lower.startsWith("data:application/x-javascript") ||
    lower.startsWith("data:image/svg+xml")
  ) {
    return null;
  }

  // Allow relative upload path on this server (/uploads/...) with safe image/pdf extensions
  if (lower.startsWith("/uploads/")) {
    if (lower.includes("..") || lower.includes("\\")) {
      return null;
    }
    const hasSafeExtension = /\.(jpg|jpeg|png|webp|gif|bmp|pdf)(\?.*)?$/i.test(lower);
    if (hasSafeExtension) {
      return trimmed;
    }
    return null;
  }

  // Allow standard web URLs
  if (lower.startsWith("https://") || lower.startsWith("http://")) {
    return trimmed;
  }

  // Allow safe data URIs for images (JPEG, JPG, PNG, WEBP, GIF, BMP) and PDF only
  const isSafeDataUri =
    lower.startsWith("data:image/jpeg;") ||
    lower.startsWith("data:image/jpeg,") ||
    lower.startsWith("data:image/jpg;") ||
    lower.startsWith("data:image/jpg,") ||
    lower.startsWith("data:image/pjpeg;") ||
    lower.startsWith("data:image/png;") ||
    lower.startsWith("data:image/x-png;") ||
    lower.startsWith("data:image/webp;") ||
    lower.startsWith("data:image/gif;") ||
    lower.startsWith("data:image/bmp;") ||
    lower.startsWith("data:application/pdf;") ||
    lower.startsWith("data:application/pdf,") ||
    lower.startsWith("data:image/");

  // Explicitly block SVG in data URIs to prevent embedded XML/SVG script execution
  if (lower.startsWith("data:image/svg+xml")) {
    return null;
  }

  if (isSafeDataUri) {
    return trimmed;
  }

  return null;
}

// Mask citizen / personal contact information (PII protection)
export function maskContact(contact: string | null | undefined): string {
  if (!contact) return "Kontak Terverifikasi";
  const trimmed = contact.trim();
  if (!trimmed) return "Kontak Terverifikasi";

  // If email
  if (trimmed.includes("@")) {
    const [user, domain] = trimmed.split("@");
    if (!domain) return "***@***";
    const maskedUser = user.length > 2 ? `${user.slice(0, 2)}***` : `${user.slice(0, 1)}***`;
    return `${maskedUser}@${domain}`;
  }

  // If phone number
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 8) {
    const start = digits.slice(0, 4);
    const end = digits.slice(-3);
    return `${start}****${end}`;
  }

  return "Kontak Terverifikasi";
}
