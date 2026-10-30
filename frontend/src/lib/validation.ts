/**
 * Validation utilities for Indian mobile numbers and authentic email addresses.
 */

const FAKE_OR_DISPOSABLE_DOMAINS = new Set([
  "fake.com",
  "test.com",
  "dummy.com",
  "sample.com",
  "invalid.com",
  "tempmail.com",
  "mailinator.com",
  "throwawaymail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "yopmail.com",
  "10minutemail.com",
  "trashmail.com",
  "dispostable.com",
  "getairmail.com",
  "mohmal.com",
  "burnermail.io",
  "nada.ltd",
]);

/**
 * Sanitizes phone number input by stripping all non-digits and capping to 10 digits.
 * Prevents typing alphabets, punctuation, or spaces.
 */
export function sanitizeMobileInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

/**
 * Validates a 10-digit Indian mobile number according to the National Numbering Plan.
 * Rule: Exactly 10 digits, starting with 6, 7, 8, or 9, and not all identical digits.
 */
export function validateIndianMobile(raw: string): {
  valid: boolean;
  error?: string;
  cleanDigits: string;
} {
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return { valid: false, error: "Mobile number is required.", cleanDigits: "" };
  }

  if (digits.length !== 10) {
    return {
      valid: false,
      error: `Mobile number must be exactly 10 digits (currently ${digits.length}).`,
      cleanDigits: digits,
    };
  }

  if (!/^[6-9]/.test(digits)) {
    return {
      valid: false,
      error: "Indian mobile numbers must start with 6, 7, 8, or 9.",
      cleanDigits: digits,
    };
  }

  // Check for repeated identical digits like 9999999999 or 0000000000
  if (/^(\d)\1{9}$/.test(digits)) {
    return {
      valid: false,
      error: "Mobile number cannot consist of identical repeated digits.",
      cleanDigits: digits,
    };
  }

  return { valid: true, cleanDigits: digits };
}

/**
 * Validates an email address against RFC 5322, verifies TLD, blocks known disposable/test domains,
 * and checks for gibberish keyboard-mashing (e.g. 0 vowels in 5+ alpha chars or 6+ consecutive consonants).
 */
export function validateAuthenticEmail(raw: string): {
  valid: boolean;
  error?: string;
  cleanEmail: string;
} {
  const email = raw.trim().toLowerCase();

  if (!email) {
    return { valid: false, error: "Email address is required.", cleanEmail: "" };
  }

  // RFC 5322 simplified pattern
  const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcRegex.test(email)) {
    return {
      valid: false,
      error: "Please enter a valid email address (e.g. doctor@hospital.org).",
      cleanEmail: email,
    };
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid email address format.", cleanEmail: email };
  }

  const [localPart, domain] = parts;

  // Domain checks
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return {
      valid: false,
      error: "Email has an invalid domain extension (must be at least 2 letters, e.g. .com, .in).",
      cleanEmail: email,
    };
  }

  if (FAKE_OR_DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: "Disposable, fake, or temporary email domains are not accepted.",
      cleanEmail: email,
    };
  }

  // Check local-part for gibberish / keyboard mash
  // Strip special characters and digits to check alpha structure
  const alphaChars = localPart.replace(/[^a-z]/g, "");

  // If local part has 5+ letters, ensure it contains at least one vowel
  if (alphaChars.length >= 5) {
    const vowelCount = (alphaChars.match(/[aeiouy]/g) || []).length;
    if (vowelCount === 0) {
      return {
        valid: false,
        error: "Please enter a valid, non-gibberish email address (avoid keyboard mashing).",
        cleanEmail: email,
      };
    }
  }

  // 6 or more consecutive consonants (e.g. 'gcjhljstsh')
  if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(localPart)) {
    return {
      valid: false,
      error: "Please enter a realistic email address (unusual consonant sequence detected).",
      cleanEmail: email,
    };
  }

  // 4 or more identical consecutive characters (e.g. 'aaaa@...')
  if (/(.)\1{3,}/.test(localPart)) {
    return {
      valid: false,
      error: "Please enter a valid email address without excessive repeated characters.",
      cleanEmail: email,
    };
  }

  return { valid: true, cleanEmail: email };
}

/**
 * Formats a doctor's display name with a single "Dr. " prefix,
 * cleanly stripping duplicate titles like "Dr. Dr.", "dr.", "Doctor", etc.
 */
export function formatDoctorDisplayName(rawName?: string | null): string {
  if (!rawName) return "Dr. Practitioner";
  const cleaned = rawName.trim().replace(/^(?:(?:dr\b\.?|doctor\b)\s*)+/gi, "").trim();
  if (!cleaned) return "Dr. Practitioner";
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return `Dr. ${capitalized}`;
}


