import { readFileSync } from 'fs';
const dreamer = readFileSync('public/dreamer.css', 'utf8');
const html    = readFileSync('public/dreamer.html', 'utf8');

const checks = [
  ['pulse class conflict fixed',        !html.includes('class="pulse"')],
  ['dreamer-pulse class used',          html.includes('dreamer-pulse')],
  ['chat max-height overridden',        dreamer.includes('max-height: none !important')],
  ['msg scoped via .dreamer-shell',     dreamer.includes('.dreamer-shell .chat-wrap .msg')],
  ['stage padding !important override', dreamer.includes('!important')],
  ['identity-preview-col align-start',  dreamer.includes('align-content: start')],
  ['node-card pointer-events: auto',    dreamer.includes('pointer-events: auto')],
  ['select has custom arrow',           dreamer.includes('background-image: url')],
  ['chat height uses calc',             dreamer.includes('calc(100vh - 220px)')],
  ['modal footer flex-wrap',            dreamer.includes('flex-wrap: wrap')],
  ['aria-label on whyOverlay',          html.includes('aria-label="Why these results?"')],
];
checks.forEach(([name, ok]) => console.log((ok ? '✅' : '❌') + ' ' + name));
