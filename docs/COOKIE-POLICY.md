# Cookie Policy

**Last Updated: January 2, 2026**

---

## 1. Introduction

This Cookie Policy explains how Space Child Dream and the broader Space Child ecosystem use cookies and similar tracking technologies. We believe in transparency about data collection—cookies help us power your command center experience while respecting your privacy choices.

This policy should be read in conjunction with our [Privacy Policy](./PRIVACY-POLICY.md) and [Terms of Service](./TERMS-OF-SERVICE.md).

## 2. What Are Cookies

Cookies are small text files stored on your device when you visit websites. They help websites remember your preferences, maintain your sessions, and understand how you interact with the platform.

## 3. Types of Cookies We Use

### 3.1 Essential Cookies

**Purpose:** Required for authentication, session management, and security across the Space Child ecosystem.

**Details:**
- Authentication tokens for Single Sign-On (SSO)
- Session identifiers for maintaining logged-in state
- Security tokens for CSRF protection
- User preference storage (theme, language, accessibility settings)

**Cannot be disabled:** These are necessary for the command center and connected applications to function properly. Disabling these cookies will break your login experience across the Space Child ecosystem.

**Storage Key:** `scd-auth-*`, `scd-session-*`, `scd-preferences`

### 3.2 Analytics Cookies

**Purpose:** Help us understand how explorers navigate the command center and connected applications.

**Details:**
- Google Analytics (GA ID: G-CMEBRPNPGG)
- Page views, session duration, user journeys
- Geographic and demographic insights
- Behavior patterns and feature usage

**Third-party provider:** Google Analytics may use this data for behavioral advertising and cross-platform tracking.

**Can be disabled:** You can opt-out via our cookie consent banner or browser settings.

**Storage Key:** `_ga`, `_ga_*`, `_gid`, `_gat`

## 4. Cookie Consent Mechanism

### 4.1 First Visit Experience

When you first visit Space Child Dream, you'll see our cookie consent banner with these options:

- **Accept All:** Enables both essential and analytics cookies
- **Reject All:** Enables only essential cookies, disables analytics
- **Manage Preferences:** Granular control over cookie categories

### 4.2 Preference Management

You can change your cookie preferences at any time by:

- Revisiting the cookie banner (if available)
- Adjusting browser settings to block/delete cookies
- Contacting us at info@spacechild.love for assistance

### 4.3 Consent Storage

Your cookie preferences are stored locally in your browser using:
- **Storage Key:** `scd-cookie-consent`
- **Data Stored:** Essential (always true), Analytics (true/false), timestamp, GPC status
- **Duration:** Persistent until you change preferences or clear browser data

## 5. Global Privacy Control (GPC) Support

### 5.1 Automatic Opt-Out

We recognize and honor **Global Privacy Control (GPC)** signals as valid opt-out requests under applicable privacy laws including CCPA and state privacy statutes.

**When GPC is detected:**
- Analytics cookies are automatically disabled
- We set `analytics: false` in your consent record
- GPC status is logged as `gpcApplied: true`
- You can still manually adjust preferences if desired

### 5.2 GPC Implementation

```javascript
// Technical implementation reference
const gpcSignal = navigator.globalPrivacyControl;
if (gpcSignal) {
  const gpcConsent = {
    essential: true,
    analytics: false,
    timestamp: new Date().toISOString(),
    gpcApplied: true,
  };
  localStorage.setItem("scd-cookie-consent", JSON.stringify(gpcConsent));
}
```

### 5.3 Browser Support

GPC is supported by browsers including:
- Brave Browser
- Firefox (via extensions)
- DuckDuckGo Browser
- Other privacy-focused browsers

## 6. Third-Party Cookies

### 6.1 Google Analytics

**Provider:** Google LLC
**Purpose:** Website analytics and user behavior insights
**Data Collected:** 
- IP address (anonymized)
- Browser and device information
- Pages visited and time spent
- Geographic location (city/region level)
- Demographic data (when available)

**Privacy Controls:**
- Google's privacy policy: https://policies.google.com/privacy
- Opt-out tools: https://tools.google.com/dlpage/gaoptout
- Analytics opt-out through our cookie banner

**Retention:** Per Google Analytics settings (default: 14 months)

## 7. Managing Your Cookie Preferences

### 7.1 Browser-Level Controls

**Chrome:**
1. Go to Settings → Privacy and Security → Cookies and other site data
2. Choose "Block all cookies" or "Block third-party cookies"
3. Manage exceptions for specific sites

**Firefox:**
1. Go to Settings → Privacy & Security
2. Under "Cookies and Site Data," choose your blocking level
3. Use "Manage Exceptions" for site-specific controls

**Safari:**
1. Go to Settings → Privacy
2. Choose "Block all cookies" or "Block cross-site tracking"
3. Use "Manage Website Data" for site-specific controls

**Edge:**
1. Go to Settings → Cookies and site permissions → Cookies and site data
2. Choose blocking level and manage exceptions

### 7.2 Platform-Specific Controls

**Space Child Dream:**
- Cookie consent banner (first visit)
- Contact info@spacechild.love for preference changes
- Clear browser data to reset preferences

## 8. Cookie Retention and Deletion

### 8.1 Automatic Expiration

- **Essential cookies:** Session-based (expire when you close browser) or 30 days maximum
- **Analytics cookies:** Per Google Analytics settings (typically 14 months)
- **Consent preferences:** Persistent until manually changed or browser data cleared

### 8.2 Manual Deletion

You can delete cookies at any time through:
- Browser settings (Clear browsing data)
- Individual cookie management tools
- Third-party privacy tools

Deleting cookies will reset your preferences and may require you to log in again across the Space Child ecosystem.

## 9. Updates to This Policy

We may update this Cookie Policy to reflect changes in our practices, legal requirements, or third-party integrations. When we make material changes:

- We'll update the "Last Updated" date
- Notify you via our website or email (if you have an account)
- Request renewed consent if required by law

Continued use after changes constitutes acceptance of the updated policy.

## 10. Legal Basis for Processing

### 10.1 Essential Cookies
**Legal Basis:** Legitimate interest for website functionality and security
**GDPR Article 6(1)(f):** Necessary for legitimate interests in providing secure authentication services

### 10.2 Analytics Cookies
**Legal Basis:** Consent
**GDPR Article 6(1)(a):** Your explicit consent via cookie banner or GPC signal compliance

### 10.3 Withdrawal of Consent
You can withdraw consent at any time by:
- Changing cookie preferences in your browser
- Enabling Global Privacy Control
- Contacting us at info@spacechild.love

## 11. International Data Transfers

Cookies may involve international data transfers, particularly for:
- **Google Analytics:** Data processed in the United States
- **Authentication services:** Data may be processed where our infrastructure operates

We ensure appropriate safeguards are in place for international transfers, including Standard Contractual Clauses (SCCs) for GDPR compliance.

## 12. Contact Information

Questions about our cookie practices?

**Space Child, LLC**
Email: info@spacechild.love

**For cookie-specific inquiries:**
- Technical implementation questions
- Preference management assistance  
- GPC signal troubleshooting
- Privacy rights under cookie laws

---

*This Cookie Policy reflects our commitment to transparent data practices and user choice. We're building technology with intention—and that includes being intentional about how we handle every piece of data that flows through the system.*

**✧ Transparent practices ✧ User choice ✧ Conscious data handling ✧**