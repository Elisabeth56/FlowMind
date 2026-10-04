/**
 * Shared viewport settings for scroll reveals.
 *
 * The positive bottom margin grows the observer's root box downwards, so a
 * section starts animating ~140px before it scrolls into view. Without it the
 * reveal only fires once the element is already on screen, which reads as the
 * page rendering blank and "catching up" a moment later.
 */
export const revealViewport = { once: true, margin: '0px 0px 140px 0px' }
