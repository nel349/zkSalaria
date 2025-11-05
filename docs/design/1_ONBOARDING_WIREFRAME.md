# zkSalaria Onboarding Page - Wireframe Specification

**Version:** 2.0
**Date:** 2025-11-05
**Purpose:** Structural and content specification for zkSalaria landing page

---

## Design System Reference

**Theme Source of Truth:** `/payroll-ui/src/theme/`
- **Colors:** `themes/midnight-dark.ts` and `themes/midnight-light.ts`
- **Typography:** Defined in theme files (Inter font family)
- **Spacing:** Theme spacing system
- **Utilities:** `utils.ts` - Pre-built patterns (gradients, glass morphism, shadows, etc.)

**Key Theme Features:**
- Teal/Cyan primary accent colors for modern fintech feel
- Dark navy backgrounds (not pure black) for depth
- Glass morphism effects with backdrop blur
- Multi-layer shadows with teal accents
- Animated gradient text effects
- Mesh gradient backgrounds

---

## Page Structure

### Navigation Bar
**Height:** 80px
**Background:** Glass morphism effect (use `createGlassMorphism()` utility)
**Position:** Sticky top, z-index: 1000

**Layout:**
```
[Logo]                                [Nav Links]                    [Open App Button]

Left (240px):                         Center:                        Right (160px):
- zkSalaria Logo (icon + text)        - Use Cases                    - "Open App" button
  Teal glow effect                    - Features                       Use createPrimaryCTA()
                                      - Developers
                                      - Docs
```

**Logo Specifications:**
- Icon: 32px × 32px shield with lock symbol
- Text: "zkSalaria" - Typography h6 variant
- Glow: Teal accent shadow (use `createTextShadow()`)

**Nav Links:**
- Typography: subtitle2
- Color: theme.text.secondary
- Hover: theme.text.primary with underline animation
- Spacing: lg (24px) between links

---

## Section 1: Hero Section

**Height:** 100vh (full viewport)
**Background:**
- Mesh gradient background (use `createMeshGradient()` utility)
- Grid pattern overlay (use `createGridPattern()` utility)

### Content Layout

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                         [Navigation Bar]                       │
│                                                                │
│    ┌────────────────────────────────────────────────────┐    │
│    │                                                    │    │
│    │              Private Payroll,                      │    │
│    │              Verified On-Chain.                    │    │
│    │                                                    │    │
│    │    Pay employees with encrypted balances, ZK      │    │
│    │    proofs, and compliance built-in.               │    │
│    │                                                    │    │
│    │    [Open App Button]  [View Documentation →]      │    │
│    │                                                    │    │
│    │            🔒 552,800+ Private Payments            │    │
│    │            👥 297,500+ Verified Employees          │    │
│    │                                                    │    │
│    └────────────────────────────────────────────────────┘    │
│                                                                │
│                    [Scroll Indicator ↓]                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Content Specifications

**Main Headline:**
- Text: "Private Payroll, Verified On-Chain."
- Typography: h1 variant
- Effect: Animated gradient text (use `createGradientText()` utility)
- Text shadow: use `createTextShadow()` with 'md' intensity
- Max-width: 800px
- Center-aligned

**Subheadline:**
- Text: "Pay employees with encrypted balances, ZK proofs, and compliance built-in."
- Typography: h5 variant
- Color: theme.text.secondary
- Max-width: 640px
- Center-aligned
- Margin-top: spacing.lg

**Primary CTA - "Open App":**
- Component: Button with `createPrimaryCTA()` utility
- Text: "Open App"
- Include glow effect wrapper (use `createGlowEffect()`)
- Margin-top: spacing.2xl

**Secondary CTA - "View Documentation":**
- Component: Button variant="outlined"
- Text: "View Documentation →"
- Color: theme.primary (teal)
- Border: 2px solid theme.primary
- Border-radius: 9999px
- Hover: Background rgba(0, 217, 255, 0.1)
- Margin-left: 16px

**Social Proof Stats:**
- Container: Flex row, gap: spacing.2xl, center-aligned
- Margin-top: spacing.3xl
- Each stat:
  - Icon: 24px × 24px (lock for payments, users for employees)
  - Icon color: theme.success[500]
  - Typography: body2
  - Color: theme.text.secondary

**Scroll Indicator:**
- Animated bouncing arrow (optional enhancement)
- Color: theme.primary with opacity
- Position: Absolute bottom spacing.xl

---

## Section 2: Use Cases

**Background:** theme.background.default
**Padding:** spacing.5xl 0
**Container:** Max-width lg, centered

### Section Header

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                      Built for Privacy                         │
│                                                                │
│          zkSalaria brings zero-knowledge proofs to             │
│          payroll, enabling private verification without        │
│          revealing sensitive salary data.                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Title:**
- Text: "Built for Privacy"
- Typography: h2 variant
- Color: theme.text.primary
- Center-aligned

**Description:**
- Typography: h6 or body1
- Color: theme.text.secondary
- Max-width: 640px
- Center-aligned
- Margin-top: spacing.md

### Use Case Cards (4-Column Grid)

**Grid Layout:**
- Display: Grid
- Columns: 4 (responsive: 2 on tablet, 1 on mobile)
- Gap: spacing.lg
- Margin-top: spacing.3xl

**Card Design (each card):**

```
┌─────────────────────────────────────┐
│                                     │
│         [Icon - 64px × 64px]        │
│                                     │
│         Card Title (h5)             │
│                                     │
│    Card description explaining      │
│    the use case in 2-3 lines of    │
│    text with benefits.             │
│                                     │
│         [Learn More →]              │
│                                     │
└─────────────────────────────────────┘
```

**Card Specifications:**
- Component: MUI Card
- Background: theme.background.paper
- Border: theme.border.default
- Border-radius: borderRadius.lg
- Padding: spacing.xl
- Hover: Border color changes to theme.primary, translateY(-4px), shadow with createAccentShadow()
- Transition: all 0.3s ease

**Card 1: Private Payroll**
- Icon: Shield with lock (use theme.primary gradient)
- Title: "Private Payroll" (Typography h5)
- Description: "Pay employees with fully encrypted balances. No one can see salaries, not even the blockchain validator." (Typography body2)
- CTA: "Learn More →" (Link with theme.primary color)

**Card 2: Credit Scoring**
- Icon: Graph trending up with checkmark (use theme.primary gradient)
- Title: "ZK Credit Scoring"
- Description: "Employees generate verifiable credit scores using ZKML proofs, without revealing actual income amounts."
- CTA: "Learn More →"

**Card 3: Compliance Audits**
- Icon: Document with checkmark (use theme.primary + theme.success gradient)
- Title: "Compliance Audits"
- Description: "AI-powered audits detect pay equity issues, tax irregularities, and fraud with zero-knowledge proofs."
- CTA: "Learn More →"

**Card 4: AI Reports**
- Icon: Brain with circuits (use theme.primary gradient)
- Title: "Natural Language Reports"
- Description: "Ask questions in plain English. Get audit reports, compliance summaries, and insights from LLM."
- CTA: "Learn More →"

---

## Section 3: Features (Expandable Accordion)

**Background:** theme.background.surface (alternate background)
**Padding:** spacing.5xl 0
**Container:** Max-width lg, centered

### Section Header

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    Privacy-First Features                      │
│                                                                │
│          Everything you need for compliant, private,           │
│          and verifiable payroll operations.                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Title:** Typography h2, color theme.text.primary, center-aligned
**Description:** Typography h6, color theme.text.secondary, center-aligned

### Accordion Layout

**Structure:** 2-column layout
- Left: Feature list (accordion items)
- Right: Visual representation (changes based on selected feature)

**Left Column (40% width):**

```
┌────────────────────────────────────┐
│  ▼ Encrypted Balances              │
│    Zero-knowledge salary privacy   │
│                                    │
│  ▷ ZKML Verification               │
│    AI-powered proofs               │
│                                    │
│  ▷ Tax & Benefits                  │
│    Automated compliance            │
│                                    │
│  ▷ Recurring Payments              │
│    Scheduled salary streams        │
│                                    │
│  ▷ Multi-Currency                  │
│    Global payroll support          │
│                                    │
└────────────────────────────────────┘
```

**Accordion Item Specifications:**
- Component: MUI Accordion or custom
- Background: Transparent (inactive), theme.background.elevated (active)
- Border-left: 4px solid transparent (inactive), theme.primary (active)
- Padding: spacing.lg
- Cursor: pointer
- Hover: Background theme.action.hover

**Accordion Item Content:**
- Icon: ChevronDown/ChevronRight (32px)
- Title: Typography h6, color theme.text.primary
- Description: Typography body2, color theme.text.secondary
- Transition: all 0.3s ease

**Right Column (60% width):**

Visual representation changes based on selected feature:

**Feature 1: Encrypted Balances (Default Open)**
- Visual: Diagram showing:
  - Employee wallet → Encrypted balance → Company ledger
  - Padlock icons on each balance
  - Arrows showing flow
  - Code snippet:
    ```
    encrypted_employee_balances: Map<Bytes<32>, Bytes<32>>
    balance_mappings: Map<Bytes<32>, Uint<64>>
    ```
- Caption: "Salaries are encrypted on-chain. Only authorized parties can decrypt with ZK proofs."

**Feature 2: ZKML Verification**
- Visual: Flow diagram:
  - Employee data → EZKL ML model → ZK proof → Verifier
  - Icons for XGBoost, Isolation Forest
- Caption: "Machine learning models generate zero-knowledge proofs for credit scoring and fraud detection."

**Feature 3: Tax & Benefits**
- Visual: Table showing:
  - Tax brackets
  - Withholding calculations
  - 401k contributions
  - Health insurance deductions
- Caption: "Automated tax withholding and benefits tracking with encrypted reporting."

**Feature 4: Recurring Payments**
- Visual: Timeline showing:
  - Monthly salary streams
  - Automated execution
  - Pause/resume controls
- Caption: "Set up recurring salary payments with cryptographic guarantees."

**Feature 5: Multi-Currency**
- Visual: Map with currency symbols:
  - USD, EUR, GBP, JPY tokens
  - Exchange rate oracle
  - Settlement layer
- Caption: "Pay employees globally with automatic currency conversion."

---

## Section 4: Developer Section

**Background:** #0A0E27
**Padding:** 128px 0
**Container:** Max-width 1280px, centered

### Section Header

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    Built for Developers                        │
│                                                                │
│          Integrate private payroll into your application       │
│          with our comprehensive SDK and documentation.         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3-Column Layout

**Grid:**
- Columns: 3 equal width
- Gap: 32px
- Margin-top: 64px

**Column Design:**

```
┌─────────────────────────────────────┐
│                                     │
│    [Icon - 48px × 48px]             │
│                                     │
│    Column Title (24px)              │
│                                     │
│    • Feature 1                      │
│    • Feature 2                      │
│    • Feature 3                      │
│    • Feature 4                      │
│                                     │
│    [Action Button]                  │
│                                     │
└─────────────────────────────────────┘
```

**Column 1: Explore**
- Icon: Compass (gradient #00D9FF)
- Title: "Explore"
- Features:
  - • Midnight Network zkApps
  - • ZKML with EZKL
  - • LLM Integration APIs
  - • Smart Contract Patterns
- Button: "Browse Examples →" (Border: #00D9FF, Text: #00D9FF)

**Column 2: Validate**
- Icon: Shield with checkmark (gradient #10B981)
- Title: "Validate"
- Features:
  - • Test Payroll Circuits
  - • Verify ZK Proofs
  - • Run Compliance Audits
  - • Simulate Transactions
- Button: "Try Sandbox →" (Border: #10B981, Text: #10B981)

**Column 3: Integrate**
- Icon: Code brackets (gradient #7B61FF)
- Title: "Integrate"
- Features:
  - • TypeScript SDK
  - • REST API Documentation
  - • GraphQL Queries
  - • React Components
- Button: "Read Docs →" (Border: #7B61FF, Text: #7B61FF)

### Code Example Section

**Below 3-column grid:**

**Title:** "Get started in minutes"
**Margin-top:** 96px

**Code Block:**

```typescript
import { PayrollContract, createEmployeePayment } from '@zksalaria/sdk';

// Initialize private payroll contract
const payroll = new PayrollContract({
  companyId: 'acme-corp',
  encryption: true, // Enable encrypted balances
});

// Add employee with encrypted balance
await payroll.addEmployee({
  employeeId: 'alice',
  initialBalance: 0n,
});

// Pay employee (balance stays encrypted on-chain)
await payroll.payEmployee({
  employeeId: 'alice',
  amount: 5000n, // $50.00 (in cents)
  encrypted: true,
});

// Employee generates ZK proof of income (ZKML)
const creditProof = await payroll.generateCreditProof({
  employeeId: 'alice',
  model: 'xgboost-v1',
});

// Third party verifies proof WITHOUT seeing actual salary
const isVerified = await payroll.verifyCreditProof({
  employeeId: 'alice',
  proof: creditProof,
  verifierId: 'bank-xyz',
});
```

**Code Block Styling:**
- Background: #1A1F3A
- Border: 1px solid #2D3748
- Border-radius: 12px
- Padding: 32px
- Font: JetBrains Mono 14px
- Syntax highlighting: VSCode Dark+ theme
- Copy button: Top-right corner

---

## Section 5: Social Proof / Metrics

**Background:** Linear gradient from #1A1F3A to #0A0E27
**Padding:** 96px 0
**Container:** Max-width 1280px, centered

### Metrics Grid (4 Columns)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│    $12.5M           552,800+         297,500+        99.9%    │
│    Total Paid       Payments         Employees      Uptime    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Each Metric:**
- Number: Inter Bold 48px, gradient #00D9FF to #7B61FF
- Label: Inter Regular 16px, #A0AEC0
- Animated count-up on scroll into view

---

## Section 6: CTA Section

**Background:** #0A0E27
**Padding:** 128px 0
**Container:** Max-width 800px, centered

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                 Ready to go private?                           │
│                                                                │
│    Start paying employees with encrypted balances and          │
│    zero-knowledge proofs today.                                │
│                                                                │
│              [Open App] [Schedule Demo →]                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Title:**
- Text: "Ready to go private?"
- Font: Inter Bold 48px
- Color: White
- Center-aligned

**Description:**
- Font: Inter Regular 20px
- Color: #A0AEC0
- Margin-top: 16px

**Buttons:**
- Primary: "Open App" (Orange #FF6B35, same style as hero)
- Secondary: "Schedule Demo →" (Border #00D9FF, same style as hero secondary)
- Margin-top: 48px

---

## Section 7: Footer

**Background:** #1A1F3A
**Padding:** 64px 0 32px 0
**Border-top:** 1px solid #2D3748

### Footer Layout (4 Columns)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  zkSalaria          Product         Developers      Company   │
│                                                                │
│  Private payroll    Features        Documentation   About     │
│  powered by         Pricing         SDK             Blog      │
│  zero-knowledge     Use Cases       API             Careers   │
│  proofs.            Roadmap         GitHub          Contact   │
│                                                                │
│  ────────────────────────────────────────────────────────────  │
│                                                                │
│  © 2025 zkSalaria                    [Twitter] [GitHub] [Discord] │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Column 1: Brand**
- Logo: Same as nav (32px)
- Tagline: Inter Regular 14px, #A0AEC0
- Max-width: 240px

**Columns 2-4: Links**
- Header: Inter Semibold 14px, White
- Links: Inter Regular 14px, #A0AEC0
- Hover: #00D9FF
- Spacing: 12px between links

**Bottom Bar:**
- Copyright: Inter Regular 14px, #A0AEC0
- Social Icons: 24px × 24px, #A0AEC0
- Hover: #00D9FF with scale(1.1)

---

## Responsive Breakpoints

```
Desktop:  1280px+ (default)
Laptop:   1024px - 1279px (scale down spacing)
Tablet:   768px - 1023px (2-column grids, smaller fonts)
Mobile:   < 768px (1-column, stack everything)
```

**Mobile Adjustments:**
- Hero H1: 48px (down from 72px)
- Hero subheadline: 18px (down from 24px)
- Section padding: 64px 0 (down from 128px)
- Use case cards: Stack vertically
- Features: Stack accordion and visual
- Developer columns: Stack vertically
- Footer: Stack all columns

---

## Animations & Interactions

### Page Load
1. Hero text fades in from bottom (0.6s ease-out, stagger 0.1s per line)
2. Background particles start floating
3. Nav bar slides down from top (0.4s ease-out)

### Scroll Animations
- Sections fade in when 20% visible
- Metrics count up when scrolled into view
- Cards lift on hover with shadow

### Hover States
- All buttons: scale(1.05) + shadow increase
- Cards: lift 4px + border glow
- Links: underline animation (left to right)

### Transitions
- All interactions: 0.3s ease
- Background changes: 0.5s ease
- Shadow changes: 0.3s ease

---

## Accessibility

### Keyboard Navigation
- All interactive elements focusable
- Focus ring: 2px solid #00D9FF with 4px offset
- Tab order matches visual hierarchy

### Screen Readers
- All images have alt text
- ARIA labels on icon buttons
- Semantic HTML (header, nav, main, section, footer)
- Skip to main content link

### Color Contrast
- All text meets WCAG AA (4.5:1 minimum)
- Interactive elements meet AAA (7:1)
- Focus indicators highly visible

---

## Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Total page size: < 500KB (excluding code examples)
- Lighthouse score: 95+ for all categories

---

## Assets Needed

### Icons (SVG)
- [ ] Shield with lock (zkSalaria logo)
- [ ] Lock (private payroll)
- [ ] Graph trending up (credit scoring)
- [ ] Document with checkmark (compliance)
- [ ] Brain with circuits (AI reports)
- [ ] Compass (explore)
- [ ] Shield with checkmark (validate)
- [ ] Code brackets (integrate)
- [ ] Twitter, GitHub, Discord logos

### Illustrations
- [ ] Encrypted balance flow diagram
- [ ] ZKML verification flow
- [ ] Tax withholding table
- [ ] Recurring payment timeline
- [ ] Multi-currency map

### Background Elements
- [ ] Floating encrypted particles (animated SVG or canvas)
- [ ] Gradient overlays
- [ ] Grid pattern (subtle)

---

## Development Notes

### Tech Stack Recommendation
- Framework: Next.js 14+ (App Router)
- Styling: Tailwind CSS
- Animations: Framer Motion
- Icons: Lucide React
- Code highlighting: Shiki
- Analytics: Vercel Analytics

### Component Structure
```
components/
├── layout/
│   ├── Navigation.tsx
│   ├── Footer.tsx
├── sections/
│   ├── Hero.tsx
│   ├── UseCases.tsx
│   ├── Features.tsx
│   ├── Developers.tsx
│   ├── SocialProof.tsx
│   ├── CTA.tsx
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── CodeBlock.tsx
│   ├── Accordion.tsx
```

### Environment Variables
```
NEXT_PUBLIC_APP_URL=https://app.zksalaria.com
NEXT_PUBLIC_DOCS_URL=https://docs.zksalaria.com
NEXT_PUBLIC_GITHUB_URL=https://github.com/zksalaria
```

---

## Success Metrics

### User Engagement
- Time on page: Target > 2 minutes
- Scroll depth: Target > 70%
- CTA click rate: Target > 5%

### Conversions
- "Open App" clicks: Primary KPI
- "Schedule Demo" requests: Secondary KPI
- Documentation visits: Tertiary KPI

### Technical
- Bounce rate: Target < 40%
- Page load time: Target < 2s
- Mobile traffic: Target > 50%

---

## Future Enhancements (Post-V1)

- [ ] Interactive demo (sandbox in browser)
- [ ] Video walkthrough of features
- [ ] Customer testimonials section
- [ ] Live transaction feed (privacy-preserving)
- [ ] Comparison table (zkSalaria vs Sablier vs traditional)
- [ ] Blog integration
- [ ] Multilingual support
