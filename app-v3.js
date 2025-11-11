// Preact components for Systems, Metrics, Roadmap (minimal, no network)
import { h, render } from 'https://unpkg.com/preact@10.19.3/dist/preact.mjs';

const Section = ({ id, title, children }) => (
  h('section', { id, class: 'section neo section-v3' },
    h('div', { class: 'container' },
      h('div', { class: 'title-wrap' }, [
        h('h1', { class: 'section-title' }, title),
        h('div', { class: 'runes' }, 'ᚠᚢᚦ')
      ]),
      children
    )
  )
);

const HoloCard = ({ title, text }) => (
  h('div', { class: 'card reveal' }, [
    h('h3', null, title),
    h('p', null, text)
  ])
);

function Systems() {
  return h(Section, { id: 'systems-v3', title: 'Systems' },
    h('div', { class: 'grid grid-3' }, [
      h(HoloCard, { title: 'AI Agent Core', text: 'Autonomous media, ops, and quests.' }),
      h(HoloCard, { title: 'On-Chain Execution', text: 'Solana-speed UX and settlement.' }),
      h(HoloCard, { title: 'Norse Metagame', text: 'Relics, runes, and seasonal events.' })
    ])
  );
}

function Metrics() {
  const M = ({ k, v }) => h('div', { class: 'metric card reveal' }, [
    h('div', { class: 'k' }, k),
    h('div', { class: 'v' }, v)
  ]);
  return h(Section, { id: 'metrics-v3', title: 'Network Pulse' },
    h('div', { class: 'metrics' }, [
      h(M, { k: 'Price', v: '—' }),
      h(M, { k: 'Market Cap', v: '—' }),
      h(M, { k: 'Liquidity', v: '—' }),
      h(M, { k: 'Supply', v: '—' })
    ])
  );
}

function Roadmap() {
  const P = ({ q, items }) => h('div', { class: 'card reveal' }, [
    h('h3', null, q),
    h('ul', null, items.map(i => h('li', null, i)))
  ]);
  return h(Section, { id: 'roadmap-v3', title: 'Roadmap' },
    h('div', { class: 'grid grid-3' }, [
      h(P, { q: 'Now', items: ['Token + Alpha live', 'Media Bot shipped', 'NFTs on Magic Eden'] }),
      h(P, { q: 'Next', items: ['AR encounters', 'Quest seasons', 'DEX integrations'] }),
      h(P, { q: 'Beyond', items: ['Guild wars', 'Upgradeable relics', 'Community votes'] })
    ])
  );
}

const mount = (id, node) => { const el = document.getElementById(id); if (el) render(node, el); };

mount('app-systems', h(Systems));
mount('app-metrics', h(Metrics));
mount('app-roadmap', h(Roadmap));

// simple reveal on mount
requestAnimationFrame(() => {
  document.querySelectorAll('.reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('on'), 60 + i * 60);
  });
});

