// Client-safe risk keyword regex. Conservative — surfaces resources, never gates content.
// We intentionally match a broad set rather than a precise classifier; false positives are fine here.
const RISK_PATTERNS: RegExp[] = [
  /\bsuicid(?:e|al)\b/i,
  /\bkill\s+myself\b/i,
  /\bend\s+(?:my|it\s+all)\b/i,
  /\bdon'?t\s+want\s+to\s+(?:live|be\s+here|exist)\b/i,
  /\bself[\s-]?harm\b/i,
  /\b(?:cut|cutting|hurt)\s+myself\b/i,
  /\boverdose\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bbetter\s+off\s+(?:dead|without\s+me)\b/i,
];

export function detectRisk(text: string): boolean {
  if (!text) return false;
  return RISK_PATTERNS.some((re) => re.test(text));
}

export const CRISIS_RESOURCES = [
  { region: "US", label: "988 Suicide & Crisis Lifeline", href: "tel:988", detail: "Call or text 988 · 24/7" },
  { region: "US", label: "Crisis Text Line", href: "sms:741741?body=HOME", detail: "Text HOME to 741741" },
  { region: "UK & ROI", label: "Samaritans", href: "tel:116123", detail: "Call 116 123 · free, 24/7" },
  { region: "EU", label: "Mental Health Europe directory", href: "https://www.mhe-sme.org/library/helplines/", detail: "Country-by-country helplines" },
  { region: "Global", label: "Find a Helpline", href: "https://findahelpline.com", detail: "200+ countries · free & confidential" },
];
