# PowerFit Design System

This document defines the visual rules for the public PowerFit landing page. The current PowerFit landing is the source of truth for palette and brand. References should influence craft, hierarchy, data density, and product polish only; they must not override the PowerFit colors.

## Brand Feeling

PowerFit should feel like a premium dark fitness SaaS product: focused, data-driven, organized, and trainer-led. The product should look strong enough for personal trainers managing real clients and simple enough for students using it daily.

Reference use:

- WHOOP: premium performance, dark fitness data, wearable-style metrics, strong numerical hierarchy.
- Linear: dark SaaS refinement, restrained depth, soft glows, crisp spacing, polished product surfaces.
- Attio: organized management structure, dense but readable CRM/dashboard patterns.
- Fitness app references: real training imagery only, always inside dark overlays or product story blocks.

## Official Color Palette

Use these colors for the landing. Do not introduce new brand colors unless they are transparent variants of these values.

### Background

- Page black/navy: `#070B14`
- Primary app background: `#0B1120`
- Secondary dark panel: `#111827`
- Card surface: `#1A2332`
- Card hover/elevated: `#1F2B3D`
- Deep elevated panel: `#243044`

### Primary Orange

- Brand orange: `#FF6B35`
- Orange highlight: `#FF8C5A`
- Orange dark: `#E55A25`
- Orange glow: `rgba(255, 107, 53, 0.30)`
- Soft orange surface: `rgba(255, 107, 53, 0.10)` to `rgba(255, 107, 53, 0.18)`

### Secondary Data Blue/Cyan

- Deep navy blue: `#1E3A5F`
- Mid blue: `#2A5080`
- Dark blue: `#0F1F35`
- Data blue: `#3B82F6`
- Cyan-blue highlight: `#60A5FA`
- Blue glow: `rgba(59, 130, 246, 0.15)`

### Text

- Heading white: `#FFFFFF` or `#F1F5F9`
- Body blue-gray: `#94A3B8`
- Secondary body: `#B7C3D4`
- Muted labels: `#64748B`
- Low-contrast structural text: `rgba(255,255,255,0.18)` to `rgba(255,255,255,0.32)`

### Borders

- Default border: `rgba(255,255,255,0.08)` to `rgba(255,255,255,0.12)`
- Active orange border: `rgba(255,107,53,0.28)` to `rgba(255,107,53,0.45)`
- Data blue border: `rgba(59,130,246,0.20)` to `rgba(59,130,246,0.32)`

## Typography Rules

- Use Inter as the primary family.
- Hero heading should be heavy, compressed by letter spacing, and white.
- Recommended hero: `font-weight: 900-950`, `letter-spacing: -0.07em` to `-0.09em`, `line-height: 0.94-1.0`.
- Section headings should be bold and direct, not decorative.
- Body copy should use muted blue-gray, `line-height: 1.65-1.8`.
- Eyebrows should be uppercase, compact, orange, and letter-spaced.
- Product labels and dashboard metadata should be smaller but highly readable.

## Spacing Rules

- Desktop shell: max width around `1180px`, horizontal gutter `40px`.
- Mobile shell: horizontal gutter `28px` or less only when required.
- Hero should have generous vertical space and feel cinematic, not cramped.
- Section padding desktop: `86px` to `110px`.
- Section padding mobile: `52px` to `64px`.
- Card grids should use `14px` to `18px` gaps for dashboard density and `16px` to `24px` for marketing sections.
- Dense dashboard mockups may use tighter spacing, but marketing copy blocks need breathing room.

## Card Rules

- Cards are dark, layered, and slightly translucent.
- Use rounded corners between `18px` and `34px` depending on scale.
- Cards should use subtle internal highlights: `inset 0 1px 0 rgba(255,255,255,0.06)`.
- Do not use pure flat black cards. Use layered navy surfaces.
- Important cards can receive orange borders/glows; data/AI cards can receive blue/cyan accents.
- Avoid overusing gradients. Prefer one controlled radial glow or one subtle linear surface.

## Border, Glow, And Shadow Rules

- Main product frame: large dark shadow plus faint orange/blue edge glow.
- Orange glow should feel warm and soft, not neon.
- Blue glow is secondary and should signal data, AI, or intelligence.
- Use blur glows behind major frames, not around every element.
- Borders should define depth quietly. If everything glows, nothing feels premium.

## Button Rules

- Primary CTA uses orange gradient `#FF6B35` to `#FF8C5A`.
- Primary CTA text is white, bold, and direct.
- Primary hover can lift `1px` and increase orange shadow.
- Secondary CTA uses dark transparent fill, white text, and subtle border.
- Buttons should be full-width on small mobile when grouped in hero.
- Avoid green, purple, white-filled, or random accent buttons.

## Dashboard Mockup Rules

- Dashboard mockups should feel like real product UI, not generic illustrations.
- Use dark app frames with top bars, sidebar/student profile areas, content cards, charts, and status rows.
- Organize data like a trainer would: students, workout status, adherence, measurements, next action.
- Use orange for active workout/primary action and blue/cyan for AI/data insight.
- Use large numbers sparingly for performance emphasis.
- Mockups should show believable PT-BR labels and realistic training context.

## Mobile Mockup Rules

- Mobile UI should feel like a student companion app.
- Use device-like rounded frame only when it supports the story; avoid giant decorative phones that dominate.
- Show daily workout, progress, AI Personal, and body targets.
- Keep mobile cards stacked, readable, and within viewport width at `375px`, `390px`, and `414px`.
- No horizontal overflow. Floating cards must become static on mobile.

## Training Photo Rules

- Photos are supporting atmosphere, not the brand direction.
- Always place training photos inside a dark section/card with strong overlay.
- Photo treatment: low saturation, higher contrast, darker brightness, navy/orange gradient overlay.
- Photos should feel like real training context, not stock template decoration.
- Avoid white fitness layouts, purple/lilac treatments, cheerful generic wellness imagery, and oversized model-focused hero photos.

## AI Chat Visual Rules

- AI Personal should feel contextual and embedded in the product flow.
- Use dark chat cards with orange or blue/cyan accent pills.
- Messages should reference real app context: last measurement, weekly consistency, workout plan, target focus.
- Use a small sparkle/AI icon and compact labels.
- Avoid generic chatbot bubbles floating without product context.
- AI should look like a coach assistant, not a separate novelty feature.

## What To Avoid

- Purple gradients.
- WHOOP green palette.
- White/lilac fitness template style.
- Generic blue/purple SaaS palette.
- Random brand colors outside PowerFit orange and blue/cyan.
- Stock-photo-first fitness hero.
- Excessive glow, glassmorphism, or animation.
- Decorative mockups that do not explain trainer/student value.
- Overcrowded mobile sections or horizontal scroll.
