---
name: privacy-compliance-auditor
description: Audit and enforce legal, privacy, and regulatory compliance (COPPA age checks, GDPR Munich font self-hosting, CIPA session replay mask, CAN-SPAM email footers, California ARL subscription disclosures, DMCA safe harbor) across web and mobile applications.
---

# Privacy & Legal Compliance Auditor

This skill provides automated checks and design patterns to ensure applications comply with international privacy, consumer protection, and cybersecurity laws.

## 7 Mandatory Compliance Checks

### 1. COPPA / GDPR-K (Age Verification)
- [ ] Any user registration form must include age verification or a mandatory checkbox confirming majority of age (18+ or 13+/16+ with parental consent).
- [ ] No minor profiling or telemetry without parental consent.

### 2. GDPR Font & CDN Privacy (Munich Court Case 3 O 17493/20)
- [ ] Self-host all fonts (`public/fonts/*.woff2`) using `@font-face` or `next/font/local`.
- [ ] Prohibit client-side runtime calls to `fonts.googleapis.com` or `fonts.gstatic.com` to prevent unconsented visitor IP leakage.

### 3. CIPA / Anti-Wiretap (Session Recording & Keystroke Tracking)
- [ ] Session replay scripts (Hotjar, FullStory, etc.) must NEVER run by default without explicit user consent.
- [ ] All sensitive inputs (`password`, `credit card`, `PIN`, `bank token`, `identity ID`) must have masking attributes (`data-private`, `data-mask-input`, `type="password"`).

### 4. CAN-SPAM & Anti-Spam Email Rules
- [ ] Every automated or marketing email must include a 1-click `Unsubscribe` link.
- [ ] Every email must contain a valid, verifiable physical postal address in the footer.
- [ ] Subject lines must accurately reflect the email content.

### 5. California ARL (Auto-Renewal Subscription Transparency)
- [ ] Renewal terms (price, frequency, cancellation method) must be prominently displayed adjacent to the subscribe/pay button.
- [ ] Provide 1-click self-service cancellation without deceptive dark patterns.

### 6. DMCA Safe Harbor (User Uploads)
- [ ] User upload forms must declare that the user owns or holds the rights to uploaded media.
- [ ] App must provide a DMCA notice contact endpoint.

### 7. GDPR Rights & Cookie Privacy
- [ ] Prior consent banner before loading non-essential tracking cookies.
- [ ] Provide user data export (JSON/CSV) and full database reset/erasure.
