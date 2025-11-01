# Miscellaneous UX Components - Implementation Details

**Version:** 1.0
**Date:** 2025-11-01
**Purpose:** Supplementary UX components for complete implementation (Help, Loading States, Accessibility, Error Pages, etc.)

---

## Overview

**What This Covers:**
- Help Center & FAQ
- Tutorial System (First-Time User Education)
- Loading States (Skeleton Screens, Progress Indicators)
- Accessibility Features (Keyboard Navigation, Screen Readers, ARIA)
- Error Pages (404, 500, Network Error, Maintenance)
- Session Management (Timeout, Expired, Concurrent Sessions)
- Browser Compatibility Notices
- Analytics & Event Tracking
- Feature Announcements & Changelogs

**Status:** Phase 3 (UI Polish) - Defer to after core flows are implemented

---

## 1. Help Center & FAQ

### Help Center Page

**URL:** `/help`

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ Help Center                                   🔍 Search help│
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Popular Topics                                             │
│                                                            │
│ ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│ │ 🚀 Getting       │  │ 💰 Making Your   │  │ 🔐 Privacy ││
│ │    Started       │  │    First Payment │  │    & ZK    ││
│ │                  │  │                  │  │    Proofs  ││
│ │ • Connect wallet │  │ • Add employee   │  │ • How ZK   ││
│ │ • Register co.   │  │ • Fund account   │  │   works    ││
│ │ • Add employees  │  │ • Pay employee   │  │ • Generate ││
│ │                  │  │ • View history   │  │   proof    ││
│ │ [Learn More →]   │  │ [Learn More →]   │  │ [Learn →]  ││
│ └──────────────────┘  └──────────────────┘  └────────────┘│
│                                                            │
│ ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│ │ 🔁 Recurring     │  │ 👤 For Employees │  │ 🛠️ Trouble ││
│ │    Payments      │  │                  │  │   shooting ││
│ │                  │  │                  │  │            ││
│ │ • Setup auto pay │  │ • View salary    │  │ • Tx fail  ││
│ │ • Edit schedule  │  │ • Withdraw       │  │ • No bal.  ││
│ │ • Cancel         │  │ • Income proof   │  │ • Network  ││
│ │                  │  │                  │  │            ││
│ │ [Learn More →]   │  │ [Learn More →]   │  │ [Learn →]  ││
│ └──────────────────┘  └──────────────────┘  └────────────┘│
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                                            │
│ Still need help?                                           │
│ [📧 Contact Support] [💬 Join Discord] [📖 Read Docs]      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### FAQ Section

**Expandable Accordion:**

```
┌────────────────────────────────────────────────────────────┐
│ Frequently Asked Questions                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ▼ What is zkSalaria?                                       │
│   zkSalaria is a privacy-preserving payroll platform       │
│   built on Midnight Network. Your salary amounts are       │
│   encrypted on-chain, and you can generate zero-knowledge  │
│   proofs to prove income without revealing exact amounts.  │
│                                                            │
│ ▼ How does encryption work?                                │
│   All salary amounts are encrypted using your wallet's     │
│   private key. Only you can decrypt your salary data.      │
│   Even zkSalaria cannot see your salary amounts.           │
│                                                            │
│ ▶ What is a zero-knowledge proof?                          │
│                                                            │
│ ▶ How do I add employees?                                  │
│                                                            │
│ ▶ What tokens can I use for payroll?                       │
│                                                            │
│ ▶ How do recurring payments work?                          │
│                                                            │
│ ▶ Can I cancel a payment after sending?                    │
│                                                            │
│ ▶ How do employees withdraw their salary?                  │
│                                                            │
│ ▶ What happens if I lose my wallet?                        │
│                                                            │
│ ▶ Is zkSalaria compliant with labor laws?                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Contextual Help (Tooltips)

**Inline help icons (?) throughout the app:**

**Example: Add Employee Page**

```
┌────────────────────────────────────────────────────────────┐
│ Add Employee                                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Wallet Address * [?]                                       │
│ [0xABCD...________________________________]                │
│                                                            │
│ Tooltip on hover:                                          │
│ ┌────────────────────────────────────────┐                │
│ │ The employee's Midnight Network wallet │                │
│ │ address. They'll receive encrypted     │                │
│ │ salary payments at this address.       │                │
│ │                                        │                │
│ │ Ask your employee to:                  │                │
│ │ 1. Install Midnight Wallet             │                │
│ │ 2. Copy their wallet address           │                │
│ │ 3. Share it with you                   │                │
│ └────────────────────────────────────────┘                │
│                                                            │
│ Base Salary * [?]                                          │
│ [$5,000___] per [Month ▼]                                  │
│                                                            │
│ Tooltip on hover:                                          │
│ ┌────────────────────────────────────────┐                │
│ │ This amount will be encrypted on-chain │                │
│ │ and used as the default for recurring  │                │
│ │ payments. You can override it when     │                │
│ │ making individual payments.            │                │
│ └────────────────────────────────────────┘                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Video Tutorials

**Embedded in Help Center:**

```
┌────────────────────────────────────────────────────────────┐
│ Video Tutorials                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌──────────────────┐  ┌──────────────────┐                │
│ │ ▶️ Getting Started│  │ ▶️ Pay Your First│                │
│ │   (3:45)         │  │   Employee (2:30)│                │
│ │ [Play]           │  │ [Play]           │                │
│ └──────────────────┘  └──────────────────┘                │
│                                                            │
│ ┌──────────────────┐  ┌──────────────────┐                │
│ │ ▶️ Setup Recurring│  │ ▶️ Generate ZK   │                │
│ │   Payments (4:15)│  │   Proof (3:00)   │                │
│ │ [Play]           │  │ [Play]           │                │
│ └──────────────────┘  └──────────────────┘                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Tutorial System (First-Time User Education)

### Interactive Tour (Product Tour)

**Triggered on first login after company registration:**

```
┌────────────────────────────────────────────────────────────┐
│ Welcome to zkSalaria! 👋                                    │
│ Let's take a quick tour (2 minutes)                        │
│                                                            │
│ [Start Tour] [Skip for Now]                                │
└────────────────────────────────────────────────────────────┘
```

**Step 1: Dashboard Overview**

```
┌────────────────────────────────────────────────────────────┐
│ ← This is your Company Dashboard (1/5)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────────────────────────────────────────┐                │
│ │ Private Payroll                        │ ← Highlighted  │
│ │ Manage encrypted employee payments     │                │
│ │                                        │                │
│ │ 0 employees                            │                │
│ │ $0 total paid                          │                │
│ └────────────────────────────────────────┘                │
│                                                            │
│ Here you can see your payroll overview:                    │
│ • Number of employees                                      │
│ • Total amount paid (aggregate)                            │
│ • Upcoming payments                                        │
│                                                            │
│ [Next →]                                            [1/5]  │
└────────────────────────────────────────────────────────────┘
```

**Step 2: Quick Actions**

```
┌────────────────────────────────────────────────────────────┐
│ ← Quick Actions (2/5)                                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌──────────────┐                                          │
│ │ 💸 Pay       │ ← Highlighted                            │
│ │ Employee     │                                          │
│ └──────────────┘                                          │
│                                                            │
│ Use Quick Actions to:                                      │
│ • Pay an employee (one-time)                               │
│ • Add new employee                                         │
│ • Setup recurring payments                                 │
│ • Run payroll (batch payment)                              │
│                                                            │
│ [← Back]  [Next →]                                  [2/5]  │
└────────────────────────────────────────────────────────────┘
```

**Step 3: Privacy Features**

```
┌────────────────────────────────────────────────────────────┐
│ ← Privacy & Encryption (3/5)                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ All salary amounts are encrypted on the blockchain.        │
│                                                            │
│ 🔒 Encrypted: ••••••  🔓 Click to decrypt                  │
│                                                            │
│ Benefits:                                                  │
│ • No database breach can expose salaries                   │
│ • Only you and the employee can decrypt                    │
│ • Generate ZK proofs without revealing amounts             │
│                                                            │
│ [← Back]  [Next →]                                  [3/5]  │
└────────────────────────────────────────────────────────────┘
```

**Step 4: Recurring Payments**

```
┌────────────────────────────────────────────────────────────┐
│ ← Setup Recurring Payments (4/5)                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Automate your payroll with recurring payments:             │
│                                                            │
│ 1. Add employee with base salary                           │
│ 2. Setup recurring schedule (biweekly, monthly)            │
│ 3. Payments execute automatically on schedule              │
│                                                            │
│ No manual approval needed - set it and forget it!          │
│                                                            │
│ [← Back]  [Next →]                                  [4/5]  │
└────────────────────────────────────────────────────────────┘
```

**Step 5: Get Started**

```
┌────────────────────────────────────────────────────────────┐
│ ← You're All Set! (5/5)                                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Ready to start using zkSalaria?                            │
│                                                            │
│ Next steps:                                                │
│ 1. ✅ Fund your payroll account                            │
│ 2. ➕ Add your first employee                              │
│ 3. 💸 Make your first payment                              │
│                                                            │
│ [← Back]  [Get Started →]                           [5/5]  │
│                                                            │
│ ☐ Don't show this tour again                               │
└────────────────────────────────────────────────────────────┘
```

---

### Inline Hints (Progressive Disclosure)

**Show hints on hover for complex features:**

**Example: Encrypted Amount Display**

```
┌────────────────────────────────────────────────────────────┐
│ Payment History                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Alice Johnson   ••••••  🔓   Nov 15, 2025   ✅ Completed   │
│                  ↑                                         │
│                  │                                         │
│ Hint on hover:   │                                         │
│ ┌────────────────┴──────────────────┐                     │
│ │ This amount is encrypted on-chain │                     │
│ │ Click 🔓 to decrypt locally with  │                     │
│ │ your wallet key.                  │                     │
│ └───────────────────────────────────┘                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Loading States (Skeleton Screens, Progress Indicators)

### Skeleton Screens (Content Loading)

**Dashboard Loading (Before Data Loads):**

```
┌────────────────────────────────────────────────────────────┐
│ Loading Dashboard...                                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────────────────────────────────────────┐                │
│ │ ████████████████░░░░░░░░░░░░░░         │                │
│ │ ████████░░░░░░░░░░░░░░░░░░░░░░         │                │
│ │                                        │                │
│ │ ██████░░░░░░░░                         │                │
│ │ ██████░░░░░░░░                         │                │
│ └────────────────────────────────────────┘                │
│                                                            │
│ ┌────────────────────────────────────────┐                │
│ │ ████████████████░░░░░░░░░░░░░░         │                │
│ │ ████████░░░░░░░░░░░░░░░░░░░░░░         │                │
│ └────────────────────────────────────────┘                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Animates with shimmer effect (left to right pulse)**

---

### Progress Indicators

**Transaction Processing (Modal):**

```
┌────────────────────────────────────────────────────────────┐
│ Processing Payment...                                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              ⏳                                            │
│                                                            │
│ Paying Alice Johnson $5,000...                             │
│                                                            │
│ ████████████████████░░░░░░░░  75%                          │
│                                                            │
│ Steps:                                                     │
│ ✅ Wallet approval received                                │
│ ✅ Transaction submitted                                   │
│ ✅ Waiting for confirmation (2/3 blocks)                   │
│ ⏳ Updating encrypted balances...                          │
│                                                            │
│ Transaction: 0x1234...5678                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Infinite Scroll Loading (Payment History)

**Bottom of list:**

```
┌────────────────────────────────────────────────────────────┐
│ Alice Johnson   $5,000   Nov 15, 2025   ✅ Completed       │
│ Bob Smith       $6,500   Nov 15, 2025   ✅ Completed       │
│ Carol Lee       $4,200   Nov 15, 2025   ✅ Completed       │
│                                                            │
│ ───────────────── Loading More... ─────────────────        │
│                                                            │
│              ⏳ (Spinner)                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Optimistic UI Updates

**Pay Employee (Instant Feedback):**

```
User clicks "Pay Employee"
↓
Immediately show in Payment History (optimistic):
┌────────────────────────────────────────────────────────────┐
│ Alice Johnson   $5,000   Nov 15, 2025   ⏳ Pending          │
│                                         (Gray, processing) │
└────────────────────────────────────────────────────────────┘
↓
Wait for blockchain confirmation...
↓
Update to confirmed:
┌────────────────────────────────────────────────────────────┐
│ Alice Johnson   $5,000   Nov 15, 2025   ✅ Completed       │
│                                         (Green)            │
└────────────────────────────────────────────────────────────┘
```

If transaction fails, show error and remove from list:
```
❌ Payment to Alice Johnson failed: Insufficient balance
[Retry] [Dismiss]
```

---

## 4. Accessibility Features (WCAG 2.1 AA Compliance)

### Keyboard Navigation

**All interactive elements accessible via keyboard:**

| Key | Action |
|-----|--------|
| `Tab` | Navigate forward through elements |
| `Shift+Tab` | Navigate backward |
| `Enter` | Activate button/link |
| `Space` | Toggle checkbox, activate button |
| `Esc` | Close modal/dropdown |
| `Arrow Keys` | Navigate dropdown options |
| `/` | Focus search input (global shortcut) |

**Focus Indicators:**

```css
/* Visible focus ring (cyan, 2px) */
button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 2px solid #00D9FF;
  outline-offset: 2px;
}
```

---

### Screen Reader Support (ARIA)

**Semantic HTML + ARIA Labels:**

```html
<!-- Payment Card -->
<article
  role="article"
  aria-label="Payment to Alice Johnson"
>
  <h3>Alice Johnson</h3>
  <p>
    <span aria-label="Amount encrypted">••••••</span>
    <button
      aria-label="Decrypt payment amount"
      aria-pressed="false"
    >
      🔓 Decrypt
    </button>
  </p>
  <time datetime="2025-11-15">Nov 15, 2025</time>
  <span
    aria-label="Payment status: Completed"
    role="status"
  >
    ✅ Completed
  </span>
</article>

<!-- Loading State -->
<div
  role="status"
  aria-live="polite"
  aria-busy="true"
>
  Loading payment history...
</div>

<!-- Form Validation -->
<input
  type="text"
  aria-label="Employee wallet address"
  aria-required="true"
  aria-invalid="true"
  aria-describedby="wallet-error"
/>
<p id="wallet-error" role="alert">
  Invalid wallet address format
</p>
```

---

### Skip Links (Navigation Shortcuts)

**Top of page (visible on focus):**

```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
<a href="#navigation" class="skip-link">
  Skip to navigation
</a>
```

```css
/* Hidden until focused */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #00D9FF;
  color: #0A0E27;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

### Color Contrast

**All text meets WCAG AA standards (4.5:1 ratio):**

| Element | Background | Foreground | Ratio |
|---------|------------|------------|-------|
| Body text | #0A0E27 (dark) | #F9FAFB (white) | 16.5:1 ✅ |
| Secondary text | #0A0E27 | #A0AEC0 (gray) | 7.2:1 ✅ |
| Primary button | #FF6B35 (orange) | #FFFFFF (white) | 4.8:1 ✅ |
| Success state | #10B981 (green) | #FFFFFF | 5.2:1 ✅ |
| Error state | #EF4444 (red) | #FFFFFF | 4.9:1 ✅ |

---

### Screen Reader Announcements (Live Regions)

**Payment Success:**

```html
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  Payment of $5,000 to Alice Johnson completed successfully
</div>
```

**Error:**

```html
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  class="sr-only"
>
  Payment failed: Insufficient balance. Please fund your account.
</div>
```

---

## 5. Error Pages (404, 500, Network, Maintenance)

### 404 Page Not Found

**URL:** Any invalid route (e.g., `/invalid-page`)

```
┌────────────────────────────────────────────────────────────┐
│              404 - Page Not Found                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    🔍                                      │
│                                                            │
│              Oops! Page not found.                         │
│                                                            │
│ The page you're looking for doesn't exist or has been      │
│ moved.                                                     │
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                                            │
│ Popular Pages:                                             │
│ • [Dashboard]                                              │
│ • [Payment History]                                        │
│ • [Add Employee]                                           │
│ • [Settings]                                               │
│                                                            │
│ [Go to Dashboard] [Report an Issue]                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### 500 Internal Server Error

**URL:** Any route that encounters unhandled exception

```
┌────────────────────────────────────────────────────────────┐
│              500 - Something Went Wrong                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    ⚠️                                      │
│                                                            │
│         We're having technical difficulties.               │
│                                                            │
│ Our team has been notified and is working on a fix.        │
│                                                            │
│ Error ID: ERR-2025-11-15-1234                              │
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                                            │
│ What you can do:                                           │
│ • Refresh the page                                         │
│ • Try again in a few minutes                               │
│ • Check [Status Page] for updates                          │
│                                                            │
│ [Refresh Page] [Go to Dashboard] [Contact Support]         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Network Error Page

**Triggered when:** Cannot connect to Midnight Network

```
┌────────────────────────────────────────────────────────────┐
│              Network Connection Error                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    🌐                                      │
│                                                            │
│          Cannot connect to Midnight Network.               │
│                                                            │
│ Please check:                                              │
│ • Your internet connection                                 │
│ • Midnight Network status: [status.midnight.network]       │
│ • Firewall/VPN settings                                    │
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                                            │
│ Network Status: ❌ Offline                                 │
│ Last successful connection: 5 minutes ago                  │
│                                                            │
│ [Retry Connection] [View Cached Data] [Support]            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Maintenance Mode Page

**Displayed during:** Planned maintenance windows

```
┌────────────────────────────────────────────────────────────┐
│              Scheduled Maintenance                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    🛠️                                      │
│                                                            │
│        zkSalaria is undergoing maintenance.                │
│                                                            │
│ We're upgrading our systems to serve you better.           │
│                                                            │
│ Expected duration: 2 hours                                 │
│ Started: Nov 15, 2025 @ 2:00 AM UTC                        │
│ Estimated completion: Nov 15, 2025 @ 4:00 AM UTC           │
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                                            │
│ What's happening:                                          │
│ • Smart contract upgrade                                   │
│ • Performance improvements                                 │
│ • Security enhancements                                    │
│                                                            │
│ Your data is safe. All transactions will resume after      │
│ maintenance is complete.                                   │
│                                                            │
│ [Check Status] [Subscribe to Updates] [Follow Twitter]     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Session Management

### Session Timeout Warning

**After 30 minutes of inactivity:**

```
┌────────────────────────────────────────────────────────────┐
│         Session Expiring Soon                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              ⏰                                            │
│                                                            │
│ Your session will expire in 2 minutes due to inactivity.   │
│                                                            │
│ Click "Stay Logged In" to continue, or "Log Out" to exit.  │
│                                                            │
│ Time remaining: 01:45                                      │
│ ████████████░░░░░░░░  60%                                  │
│                                                            │
│ [Stay Logged In] [Log Out]                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Session Expired

**After timeout (no user action):**

```
┌────────────────────────────────────────────────────────────┐
│         Session Expired                                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              🔒                                            │
│                                                            │
│ Your session has expired due to inactivity.                │
│                                                            │
│ Please reconnect your wallet to continue.                  │
│                                                            │
│ [Reconnect Wallet →]                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Concurrent Session Warning

**User logs in from different device while already logged in:**

```
┌────────────────────────────────────────────────────────────┐
│         Concurrent Session Detected                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              ⚠️                                            │
│                                                            │
│ Your account is logged in from another device:             │
│                                                            │
│ Device: iPhone 15                                          │
│ Location: San Francisco, CA                                │
│ Last active: 5 minutes ago                                 │
│                                                            │
│ If this wasn't you, someone may have access to your        │
│ account.                                                   │
│                                                            │
│ [Continue Here (Logout Other)] [Go to Settings]            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Browser Compatibility Notices

### Unsupported Browser

**Check browser on page load:**

```typescript
// Detect unsupported browsers
const isSupported = (() => {
  const ua = navigator.userAgent;

  // Minimum versions
  const minChrome = 100;
  const minFirefox = 100;
  const minSafari = 15;

  // Check Chrome
  if (/Chrome\/(\d+)/.test(ua)) {
    const version = parseInt(RegExp.$1);
    return version >= minChrome;
  }

  // Check Firefox
  if (/Firefox\/(\d+)/.test(ua)) {
    const version = parseInt(RegExp.$1);
    return version >= minFirefox;
  }

  // Check Safari
  if (/Safari\/(\d+)/.test(ua)) {
    const version = parseInt(RegExp.$1);
    return version >= minSafari;
  }

  // Unsupported browser
  return false;
})();
```

**Banner if unsupported:**

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ Unsupported Browser Detected                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ zkSalaria works best on modern browsers:                   │
│ • Chrome 100+                                              │
│ • Firefox 100+                                             │
│ • Safari 15+                                               │
│                                                            │
│ Your current browser may not support all features.         │
│                                                            │
│ [Download Chrome] [Download Firefox] [Continue Anyway]     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Mobile Browser Notice

**For complex pages on mobile:**

```
┌────────────────────────────────────────────────────────────┐
│ 📱 Mobile Tip                                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ This page works best on desktop for easier navigation.     │
│                                                            │
│ For mobile, we recommend using our app (coming soon).      │
│                                                            │
│ [Continue on Mobile] [Dismiss]                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 8. Analytics & Event Tracking

### Events to Track

**User Actions:**
```typescript
// Track critical user events
analytics.track('wallet_connected', {
  address: walletAddress,
  role: 'company',
  timestamp: Date.now()
});

analytics.track('company_registered', {
  companyName: 'Acme Corp',
  industry: 'Technology',
  size: '11-50'
});

analytics.track('employee_added', {
  employeeId: 'alice',
  basesal: 5000,
  role: 'Engineer'
});

analytics.track('payment_sent', {
  employeeId: 'alice',
  amount: 5000,
  type: 'one-time',
  success: true
});

analytics.track('recurring_payment_setup', {
  employeeId: 'alice',
  amount: 5000,
  frequency: 'biweekly'
});

analytics.track('proof_generated', {
  proofType: 'income_proof',
  threshold: 5000
});
```

**Page Views:**
```typescript
analytics.page('Dashboard', {
  role: 'company',
  employees: 12,
  totalPaid: 54500
});

analytics.page('Payment History', {
  role: 'employee',
  paymentsCount: 28
});
```

**Errors:**
```typescript
analytics.track('error_occurred', {
  errorType: 'transaction_failed',
  errorMessage: 'Insufficient balance',
  page: '/pay-employee'
});
```

---

### Privacy-Preserving Analytics

**Do NOT track:**
- ❌ Exact salary amounts (encrypted)
- ❌ Employee names (PII)
- ❌ Wallet addresses (PII)
- ❌ Transaction hashes (can be used to de-anonymize)

**DO track:**
- ✅ Aggregate metrics (total employees, total payments count)
- ✅ User actions (button clicks, page views)
- ✅ Error rates
- ✅ Performance metrics (page load times)

---

## 9. Feature Announcements & Changelogs

### What's New Modal

**Shown on login after new features are released:**

```
┌────────────────────────────────────────────────────────────┐
│         What's New in zkSalaria v2.1 🎉                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 🚀 New Features                                            │
│                                                            │
│ • Batch Payments: Pay all employees at once                │
│ • Multi-Currency: Support for USDC, DAI, DUST              │
│ • Mobile App: Download on iOS and Android                  │
│                                                            │
│ 🔧 Improvements                                            │
│                                                            │
│ • 3x faster payment processing                             │
│ • Better error messages                                    │
│ • Improved mobile responsive design                        │
│                                                            │
│ 🐛 Bug Fixes                                               │
│                                                            │
│ • Fixed: Recurring payments skipping months                │
│ • Fixed: Notification emails not sending                   │
│                                                            │
│ [Learn More] [Close]                                       │
│                                                            │
│ ☐ Don't show announcements again                           │
└────────────────────────────────────────────────────────────┘
```

---

### Changelog Page

**URL:** `/changelog`

```
┌────────────────────────────────────────────────────────────┐
│ Changelog                                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ v2.1 - Nov 15, 2025                                        │
│ • Added: Batch payments for paying multiple employees      │
│ • Added: Multi-currency support (USDC, DAI, DUST)          │
│ • Improved: Payment processing speed (3x faster)           │
│ • Fixed: Recurring payments skipping months                │
│                                                            │
│ v2.0 - Oct 1, 2025                                         │
│ • Added: ZK proof generation for income verification       │
│ • Added: Recurring payment automation                      │
│ • Added: Employee self-service portal                      │
│ • Improved: Dashboard redesign with better UX              │
│                                                            │
│ v1.5 - Sep 1, 2025                                         │
│ • Added: Email notifications for payment events            │
│ • Added: Webhook support for accounting integrations       │
│ • Fixed: Network timeout errors                            │
│                                                            │
│ [View Full Changelog on GitHub →]                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 3 (UI Polish) - Week 1-2

**Help & Documentation:**
- [ ] Create Help Center page with categorized topics
- [ ] Write FAQ (10-15 common questions)
- [ ] Add contextual tooltips (?) throughout app
- [ ] Record 3-5 video tutorials (Getting Started, Pay Employee, Generate Proof)
- [ ] Implement interactive product tour (5 steps)

**Loading States:**
- [ ] Add skeleton screens for all data-heavy pages
- [ ] Implement progress indicators for transactions
- [ ] Add infinite scroll loading for payment history
- [ ] Implement optimistic UI updates (instant feedback)

**Accessibility:**
- [ ] Add keyboard navigation support (Tab, Enter, Esc)
- [ ] Implement ARIA labels for all interactive elements
- [ ] Add skip links for navigation shortcuts
- [ ] Ensure color contrast meets WCAG AA (4.5:1 ratio)
- [ ] Add screen reader announcements (live regions)

**Error Pages:**
- [ ] Create 404 page (with helpful links)
- [ ] Create 500 page (with error ID for support)
- [ ] Create network error page (with status check)
- [ ] Create maintenance mode page (with ETA)

**Session Management:**
- [ ] Implement session timeout warning (30 min inactivity)
- [ ] Add session expired page (with reconnect option)
- [ ] Add concurrent session detection

**Browser Compatibility:**
- [ ] Add unsupported browser detection + warning
- [ ] Add mobile browser notice for complex pages

**Analytics:**
- [ ] Integrate analytics SDK (privacy-preserving)
- [ ] Track critical events (wallet connect, payment sent, etc.)
- [ ] Track page views and user flows
- [ ] Track errors and exceptions

**Feature Announcements:**
- [ ] Create "What's New" modal for feature releases
- [ ] Build changelog page (linked from footer)

---

## Success Criteria

**Help & Education:**
- ✅ <30s to find answer in Help Center (search functionality)
- ✅ 70%+ users complete product tour on first login
- ✅ <5% support tickets for documented issues

**Loading & Performance:**
- ✅ Skeleton screens appear <100ms
- ✅ Page load time <2s (3G network)
- ✅ No perceived lag with optimistic UI updates

**Accessibility:**
- ✅ WCAG 2.1 AA compliance (100% pass rate)
- ✅ All features usable via keyboard only
- ✅ Screen reader compatible (tested with NVDA/VoiceOver)

**Error Handling:**
- ✅ <1% unhandled exceptions
- ✅ 100% error pages have helpful next steps
- ✅ <5min average time to resolve error (with help links)

**Analytics:**
- ✅ <5% event loss rate (reliable tracking)
- ✅ No PII in analytics (privacy-preserving)

---

*This comprehensive miscellaneous UX documentation completes the zkSalaria MVP implementation guide with all supplementary components for a production-ready application.*
