import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

/*
  Hero name interaction
  1. Intro: letters of TJORVEN rise out of a mask, "Florin" is drawn in.
  2. Hover: letters near the cursor stretch upward and turn green, like a wave.
  3. Click/tap a letter to flip it.
  4. "Florin" drifts slightly with the cursor.
*/
export function initHero() {
  const first = document.querySelector('.hero__first');
  const last = document.querySelector('.hero__last');
  if (!first || !last) return;  

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hide the name until fonts are loaded and the letters are split, to avoid a flash
  gsap.set([first, last], { autoAlpha: 0 });

  // Fonts ready (or give up after 2s so the name never stays hidden)
  const fontsReady = Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);

  fontsReady.then(() => {
    // Splitting into separate letters loses the font's kerning, which makes the word wider.
    // Keep a hidden, unsplit copy to measure against and tighten letter-spacing to match it.
    const reference = first.cloneNode(true);
    reference.setAttribute('aria-hidden', 'true');
    Object.assign(reference.style, { position: 'absolute', visibility: 'hidden', pointerEvents: 'none' });
    first.after(reference);

    const split = SplitText.create(first, { type: 'chars', charsClass: 'hero__char' });
    const chars = split.chars;

    const fitWidth = () => {
      first.style.letterSpacing = '';
      const style = getComputedStyle(first);
      const fontSize = parseFloat(style.fontSize);
      const extraPerChar = (textWidth(first) - textWidth(reference)) / chars.length;
      first.style.letterSpacing = `${(parseFloat(style.letterSpacing) - extraPerChar) / fontSize}em`;
    };
    fitWidth();
    document.fonts.ready.then(fitWidth);
    window.addEventListener('resize', fitWidth);

    gsap.set(chars, { transformOrigin: '50% 100%' });
    gsap.set([first, last], { autoAlpha: 1 });

    if (reduceMotion) return;

    // ---------- 1. Intro ----------
    first.classList.add('is-masked');
    const intro = gsap.timeline({
      delay: 0.15,
      onComplete: () => first.classList.remove('is-masked'),
    });
    intro
      .from(chars, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.06 })
      .fromTo(last,
        { clipPath: 'inset(-20% 100% -20% 0)' },
        { clipPath: 'inset(-20% 0% -20% 0)', duration: 1.2, ease: 'expo.inOut' },
        0.45)
      .from(last, { x: -40, duration: 1.2, ease: 'expo.out' }, '<');

    // ---------- 2. Proximity wave ----------
    const state = chars.map(() => ({ current: 0, target: 0 }));
    const setStretch = chars.map((char) => gsap.quickSetter(char, 'scaleY'));
    let pointer = null;

    const onMove = (e) => { pointer = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { pointer = null; });

    gsap.ticker.add(() => {
      if (intro.isActive()) return;

      const firstRect = first.getBoundingClientRect();
      // Influence radius scales with the size of the word
      const radius = firstRect.height * 1.6;

      chars.forEach((char, i) => {
        const s = state[i];
        s.target = 0;

        if (pointer) {
          const r = char.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dist = Math.hypot(pointer.x - cx, (pointer.y - cy) * 1.4);
          s.target = Math.max(0, 1 - dist / radius);
        }

        // Smoothly ease towards the target
        s.current += (s.target - s.current) * 0.12;
        if (Math.abs(s.current) < 0.001) s.current = 0;

        const eased = s.current * s.current * (3 - 2 * s.current); // smoothstep
        char.style.setProperty('--i', eased.toFixed(3));
        setStretch[i](1 + eased * 0.35);
      });
    });

    // ---------- 3. Click / tap a letter to flip it ----------
    chars.forEach((char) => {
      char.addEventListener('click', () => {
        if (gsap.isTweening(char)) return;
        gsap.fromTo(char, { rotationX: 0 }, { rotationX: 360, transformPerspective: 600, duration: 0.9, ease: 'back.out(1.6)' });
      });
    });

    // ---------- 4. "Florin" drifts with the cursor ----------
    const driftX = gsap.quickTo(last, 'x', { duration: 1.2, ease: 'power3.out' });
    const driftY = gsap.quickTo(last, 'y', { duration: 1.2, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => {
      if (intro.isActive()) return;
      driftX((e.clientX / window.innerWidth - 0.5) * 30);
      driftY((e.clientY / window.innerHeight - 0.5) * 16);
    }, { passive: true });
  });
}

// Width of an element's text content (not its box)
function textWidth(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
}
