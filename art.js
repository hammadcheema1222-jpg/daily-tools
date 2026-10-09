/* Hand-drawn style illustrations for Favorable Chicken – Daily tools.
   Plain SVG strings so they work offline. Colours follow styles.css. */
'use strict';
const INK = '#21322C';
const HILLS = `<path d="M0 120 C38 92 84 94 122 104 C160 114 188 98 220 90 V120Z" fill="#C6DCCE"/><path d="M0 120 C50 106 96 112 140 116 C176 119 200 110 220 108 V120Z" fill="#B3D0BF"/>`;
const coin = (y) => `<path d="M138 ${y}v7a21 7 0 0 0 42 0v-7" fill="#D7A13A" stroke="${INK}" stroke-width="2"/><ellipse cx="159" cy="${y}" rx="21" ry="7" fill="#F2C766" stroke="${INK}" stroke-width="2"/>`;

const ART = {
  hen: `<svg class="hen" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="31" fill="#DCEBE4"/>
    <path d="M14 46h36" stroke="#B3D0BF" stroke-width="4" stroke-linecap="round"/>
    <path d="M27 49v5M37 49v5" stroke="#D7A13A" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="35" cy="38" rx="16" ry="12" fill="#FBFCF9" stroke="${INK}" stroke-width="2.2"/>
    <path d="M49 34c5-3 7-8 5-12-3 3-6 5-9 6" fill="#FBFCF9" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="24" cy="25" r="9" fill="#FBFCF9" stroke="${INK}" stroke-width="2.2"/>
    <path d="M18 17c0-4 3-5 5-2 1-3 5-3 5 1 2-1 4 1 2 3" fill="#C9675F" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M15.5 25.5 10 27.5l5.5 2z" fill="#E7B44C" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M16.5 30.5c0 3 2 4 3 2" fill="#C9675F"/>
    <circle cx="22" cy="23.5" r="1.7" fill="${INK}"/>
    <path d="M30 39c4-5 11-5 14 0-4 2-10 2-14 0z" fill="#CFE2D6" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`,

  sales: `<svg class="art" viewBox="0 0 220 120" aria-hidden="true">
    <circle cx="196" cy="26" r="15" fill="#F6DFA0"/>
    ${HILLS}
    <g transform="rotate(-7 106 60)">
      <path d="M82 14h50v80l-6.25-5-6.25 5-6.25-5-6.25 5-6.25-5-6.25 5-6.25-5-6.25 5z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M91 28h32M91 38h22M91 48h28M91 58h18" stroke="#A9C1B5" stroke-width="3" stroke-linecap="round"/>
      <path d="M91 72h12M111 72h12" stroke="#3F7566" stroke-width="3.2" stroke-linecap="round"/>
    </g>
    ${coin(100)}${coin(91)}${coin(82)}
    <path d="M196 106c-2-10 2-18 10-22-1 9-4 16-10 22zM196 106c-6-6-14-7-20-4 6 5 13 6 20 4z" fill="#7FAE92" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`,

  food: `<svg class="art" viewBox="0 0 220 120" aria-hidden="true">
    <circle cx="200" cy="22" r="13" fill="#F6DFA0"/>
    ${HILLS}
    <circle cx="116" cy="62" r="13" fill="#8DBE98" stroke="${INK}" stroke-width="2"/>
    <circle cx="104" cy="58" r="10" fill="#A4CDA9" stroke="${INK}" stroke-width="2"/>
    <path d="M108 62c4-4 9-5 13-3" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M128 64a17 13 0 0 1 34 0z" fill="#EBC170" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M137 56l2-1M146 53l2 0M154 56l2 1" stroke="#FBF4DF" stroke-width="2" stroke-linecap="round"/>
    <circle cx="178" cy="60" r="11" fill="#D9786D" stroke="${INK}" stroke-width="2"/>
    <path d="M173 50c3 1 7 1 10-1-1 3-4 4-5 4" fill="#7FAE92" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="92" y="66" width="104" height="44" rx="5" fill="#DDBE8E" stroke="${INK}" stroke-width="2"/>
    <path d="M92 81h104M92 95h104" stroke="#B8955F" stroke-width="2"/>
    <path d="M104 66v44M184 66v44" stroke="${INK}" stroke-width="2"/>
    <path d="M60 110c-2-12 3-22 13-27-1 11-5 20-13 27z" fill="#7FAE92" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`,

  shifts: `<svg class="art" viewBox="0 0 220 120" aria-hidden="true">
    <circle cx="96" cy="26" r="12" fill="#F6DFA0"/>
    <path d="M206 16a13 13 0 1 0 6 22 11 11 0 1 1-6-22z" fill="#C5DAE2" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="190" cy="48" r="1.8" fill="#9DBFCB"/><circle cx="178" cy="26" r="1.4" fill="#9DBFCB"/>
    ${HILLS}
    <circle cx="150" cy="66" r="36" fill="#fff" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="150" cy="66" r="29" fill="none" stroke="#DCEBE4" stroke-width="6"/>
    <g stroke="${INK}" stroke-width="2.4" stroke-linecap="round">
      <path d="M150 36v5M150 91v5M120 66h5M175 66h5"/>
      <path d="M150 66V48M150 66l12 8" stroke="#3F7566" stroke-width="3.2"/>
    </g>
    <circle cx="150" cy="66" r="3.4" fill="${INK}"/>
    <path d="M128 31l-6-6M172 31l6-6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`,

  order: `<svg class="art" viewBox="0 0 220 120" aria-hidden="true">
    <circle cx="202" cy="20" r="12" fill="#F6DFA0"/>
    ${HILLS}
    <g transform="rotate(5 132 60)">
      <rect x="100" y="16" width="62" height="86" rx="7" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <rect x="118" y="10" width="26" height="12" rx="4" fill="#3F7566" stroke="${INK}" stroke-width="2"/>
      <g stroke-linecap="round" stroke-linejoin="round">
        <rect x="109" y="34" width="9" height="9" rx="2" fill="#DCEBE4" stroke="${INK}" stroke-width="1.6"/>
        <path d="M111 38l2 2 4-5" stroke="#3F7566" stroke-width="2.2" fill="none"/>
        <path d="M124 38.5h28" stroke="#A9C1B5" stroke-width="3"/>
        <rect x="109" y="52" width="9" height="9" rx="2" fill="#DCEBE4" stroke="${INK}" stroke-width="1.6"/>
        <path d="M111 56l2 2 4-5" stroke="#3F7566" stroke-width="2.2" fill="none"/>
        <path d="M124 56.5h22" stroke="#A9C1B5" stroke-width="3"/>
        <rect x="109" y="70" width="9" height="9" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
        <path d="M124 74.5h26" stroke="#A9C1B5" stroke-width="3"/>
      </g>
    </g>
    <path d="M172 82a17 17 0 0 1 34 0" fill="none" stroke="${INK}" stroke-width="2.2"/>
    <rect x="186" y="66" width="8" height="20" rx="3" fill="#9DBFCB" stroke="${INK}" stroke-width="1.6"/>
    <path d="M166 82h46l-6 26h-34z" fill="#DDBE8E" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M170 92h38M172 100h34" stroke="#B8955F" stroke-width="2"/>
  </svg>`,
};
