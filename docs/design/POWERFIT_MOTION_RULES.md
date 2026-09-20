# PowerFit Motion Rules

Motion on the PowerFit landing should feel premium, subtle, and lightweight. It should support product comprehension without becoming the visual identity.

## Principles

- Motion is restrained and purposeful.
- Use short durations and low travel distances.
- Animate opacity, transform, and lightweight widths only.
- Avoid effects that compete with product UI or reduce mobile performance.
- Respect `prefers-reduced-motion` by disabling non-essential animation.

## Hero Entrance

- Hero copy can fade in and rise slightly.
- Product frame can fade in with a smaller rise and a slight scale from `0.98` to `1`.
- Ambient glows should not pulse aggressively.
- Recommended duration: `600ms` to `900ms`.
- Recommended easing: `cubic-bezier(0.16, 1, 0.3, 1)` or similar smooth ease-out.

## Scroll Reveal

- Section reveal should be subtle: opacity `0` to `1`, translateY `16px` to `0`.
- If JavaScript scroll observers are not already used, prefer CSS-only static presentation or simple existing classes. Do not add a heavy animation dependency.
- Content should remain readable even if animation does not run.

## Staggered Cards

- Card grids can use small stagger delays between `40ms` and `80ms`.
- Limit total stagger span to under `400ms` per section.
- Stagger should help scanning, not delay content.
- On mobile, reduce or remove stagger.

## Subtle Floating Cards

- Floating cards can move vertically `6px` to `10px` over `5s` to `7s`.
- Use one or two floating cards maximum in the hero.
- Floating motion must stop on mobile where cards become static.
- Avoid rotation, bouncing, springy motion, or parallax-heavy effects.

## AI Message Animation

- AI messages may fade in or slide up slightly.
- Optional typing dots may be used only if static and subtle.
- Do not add looping typing animations that distract from copy.
- Context chips can appear before the message with a slight stagger.

## Metric And Chart Animation

- Bars can animate width from `0` to target width once.
- Keep duration under `900ms`.
- Use orange for primary workout/progress bars and blue/cyan for analytical data.
- Avoid constantly animated charts, blinking numbers, or fake real-time noise.

## Mobile Performance Rules

- Disable or reduce floating animations under `640px`.
- Avoid large blur animations on mobile.
- Keep lazy-loaded photos below the hero unless essential.
- Do not use scroll-jacking, canvas effects, heavy parallax, or animation libraries for the landing.
- Ensure no animation creates horizontal overflow at `375px`, `390px`, or `414px`.

## Animations To Avoid

- Exaggerated bouncing.
- Neon pulsing.
- Infinite chart movement.
- Large rotating gradients.
- Parallax layers that move independently across the viewport.
- Hover-only critical information.
- Motion that introduces green, purple, or non-brand visual effects.
