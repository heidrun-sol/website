document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav
  const burger = document.getElementById('burger');
  const links = document.getElementById('navLinks');
  function openMenu(){
    links.style.display = 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.left = '0'; links.style.right = '0'; links.style.top = '60px';
    links.style.background = 'rgba(10,14,22,.95)';
    links.style.padding = '10px 12px';
    if (burger){ burger.textContent = 'X'; burger.setAttribute('aria-expanded','true'); burger.setAttribute('aria-label','Close menu'); }
  }
  function closeMenu(){
    links.removeAttribute('style');
    if (burger){ burger.textContent = '☰'; burger.setAttribute('aria-expanded','false'); burger.setAttribute('aria-label','Menu'); }
  }
  burger?.addEventListener('click', () => {
    const isOpen = links.style.display === 'flex';
    if (isOpen) closeMenu(); else openMenu();
  });
  // Close on nav click (mobile)
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 900) closeMenu();
  }));
  // Reset on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });

  // 3D ring placement
  const ring = document.getElementById('ring');
  if (ring) {
    const items = Array.from(ring.querySelectorAll('.item'));
    const count = items.length;
    const radius = Math.min(ring.clientWidth, 800) / 2.4; // responsive radius
    items.forEach((el, i) => {
      const angle = (360 / count) * i;
      el.style.transform = `translate(-50%,-50%) rotateY(${angle}deg) translateZ(${radius}px)`;
    });
  }

  // Footer year
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();

  // Preloader hide + initial nudge
  const site = document.getElementById('siteContent');
  const pre = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(()=>{
      pre?.classList.add('hide');
      pre && (pre.style.opacity = '0');
      setTimeout(()=> pre?.remove(), 300);
      // Gentle nudge to suggest scroll
      site?.classList.add('nudge');
      setTimeout(()=> site?.classList.remove('nudge'), 1600);
    }, 250);
  });

  // =====================
  // Network Pulse (live)
  // =====================
  const priceEl = document.getElementById('pulsePrice');
  const mcapEl = document.getElementById('pulseMcap');
  const liqEl = document.getElementById('pulseLiq');
  const supplyEl = document.getElementById('pulseSupply');
  const updatedEl = document.getElementById('pulseUpdated');
  const HEIDRUN_MINT = 'DdyoGjgQVT8UV8o7DoyVrBt5AfjrdZr32cfBMvbbPNHM';

  function fmtUsd(x){
    const n = Number(x);
    if (!isFinite(n)) return '—';
    return n >= 1000 ? `$${n.toLocaleString(undefined,{maximumFractionDigits:0})}` : `$${n.toFixed(4)}`;
  }
  function fmtNum(x){
    const n = Number(x);
    if (!isFinite(n)) return '—';
    if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
    if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
    if (n >= 1e3) return (n/1e3).toFixed(2)+'K';
    return n.toLocaleString();
  }
  async function fetchPulse(){
    try{
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${HEIDRUN_MINT}`);
      const data = await res.json();
      const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
      const solPairs = pairs.filter(p=>p.chainId === 'solana');
      const best = (solPairs.length?solPairs:pairs).sort((a,b)=> (b?.liquidity?.usd||0) - (a?.liquidity?.usd||0))[0];
      if (!best) return;
      const price = Number(best.priceUsd||best.priceUsdString||best.price||0);
      const liq = Number(best?.liquidity?.usd||0);
      const fdv = Number(best?.fdv||0); // fully diluted valuation
      const supply = price>0 && fdv>0 ? fdv/price : NaN;
      if (priceEl) priceEl.textContent = fmtUsd(price);
      if (mcapEl) mcapEl.textContent = fdv? fmtUsd(fdv) : '—';
      if (liqEl) liqEl.textContent = fmtUsd(liq);
      if (supplyEl) supplyEl.textContent = fmtNum(supply);
      if (updatedEl){
        const ts = new Date();
        updatedEl.textContent = ts.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
      }
    }catch(e){
      // leave placeholders on failure
      console.warn('Pulse fetch failed', e);
    }
  }
  if (priceEl || mcapEl || liqEl || supplyEl){
    fetchPulse();
    setInterval(fetchPulse, 60_000);
  }

  // =====================
  // Rune mist (liveliness)
  // =====================
  const matrixCanvas = null; // matrix effect disabled per request
  // Hero-only rune mist (slow & rare)
  const heroMist = document.getElementById('runeMistHero');

  // =====================
  // Matrix-style rune rain
  // =====================
  if (matrixCanvas){
    const ctx = matrixCanvas.getContext('2d');
    const glyphs = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ'];
    const baseSpeed = 0.12; // very slow
    let columns, drops, width, height;

    function size(){
      width = matrixCanvas.width = window.innerWidth;
      height = matrixCanvas.height = window.innerHeight;
      const fs = Math.max(14, Math.min(22, Math.round(width/80)));
      ctx.font = fs + "px Space Grotesk, monospace";
      columns = Math.floor(width / fs);
      // Start all columns inactive (negative = offscreen)
      drops = Array(columns).fill(-100);
    }
    size();
    window.addEventListener('resize', size);

    // Respect reduced motion
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches){ matrixCanvas.style.display = 'none'; }

    let last = performance.now();
    function draw(now){
      const dt = (now - last) / 16.67; // frames at ~60hz
      last = now;
      ctx.fillStyle = 'rgba(5,7,11,0.07)';
      ctx.fillRect(0,0,width,height);
      const step = baseSpeed * dt; // very slow progress
      const colWidth = parseInt(ctx.font);
      for (let i=0;i<columns;i++){
        // Rarely start a new drop
        if (drops[i] < 0 && Math.random() < 0.003){ drops[i] = 0; }
        if (drops[i] >= 0){
          const char = glyphs[Math.floor(Math.random()*glyphs.length)];
          const t = (i/columns);
          const r = Math.floor(255*(1-t));
          const g = Math.floor(229*t);
          const b = 255;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`; // softer
          const x = i * colWidth;
          const y = drops[i] * colWidth;
          ctx.fillText(char, x, y);
          // advance slowly
          drops[i] += step;
          // when off bottom, go inactive with high probability
          if (y > height){
            drops[i] = Math.random() > 0.85 ? 0 : - (20 + Math.random()*120);
          }
        }
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // Hero rune mist (slow & rare)
  if (heroMist){
    const glyphs = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ'];
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!media.matches){
      let active = 0;
      const maxActive = 10;
      function spawn(){
        if (active >= maxActive) return;
        const span = document.createElement('span');
        span.className = 'r';
        span.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
        const size = 10 + Math.random()*12; // 10–22px
        const left = 8 + Math.random()*84; // avoid extreme edges
        const dur = 16 + Math.random()*18; // 16–34s
        span.style.left = left + 'vw';
        span.style.bottom = '-4vh';
        span.style.fontSize = size + 'px';
        span.style.animationDuration = dur + 's';
        heroMist.appendChild(span);
        active++;
        setTimeout(()=>{ span.remove(); active--; }, dur*1000);
      }
      function loop(){ spawn(); setTimeout(loop, 5000 + Math.random()*4000); }
      for(let i=0;i<4;i++) setTimeout(spawn, i*1200);
      setTimeout(loop, 4000);
    }
  }

  // Scroll cue behavior
  const scrollCue = document.getElementById('scrollCue');
  scrollCue?.addEventListener('click', ()=>{
    document.getElementById('relics')?.scrollIntoView({behavior:'smooth'});
  });

  // Agent button compact panel
  const agentBtn = document.getElementById('agentBtn');
  const agentPanel = document.getElementById('agentPanel');
  const agentClose = document.getElementById('agentClose');
  function openAgent(){ agentPanel?.classList.add('show'); agentPanel?.setAttribute('aria-hidden','false'); }
  function closeAgent(){ agentPanel?.classList.remove('show'); agentPanel?.setAttribute('aria-hidden','true'); }
  agentBtn?.addEventListener('click', ()=>{
    if (agentPanel?.classList.contains('show')) closeAgent(); else openAgent();
  });
  agentClose?.addEventListener('click', closeAgent);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAgent(); });
  document.addEventListener('click', (e)=>{
    if (!agentPanel || !agentBtn) return;
    if (!agentPanel.classList.contains('show')) return;
    const t = e.target;
    if (!agentPanel.contains(t) && t !== agentBtn){ closeAgent(); }
  });

  // =====================
  // Random rune words (1s, whole page)
  // =====================
  const wordsLayer = document.getElementById('runeWords');
  if (wordsLayer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const map = {A:'ᚨ',B:'ᛒ',C:'ᚲ',D:'ᛞ',E:'ᛖ',F:'ᚠ',G:'ᚷ',H:'ᚺ',I:'ᛁ',J:'ᛃ',K:'ᚲ',L:'ᛚ',M:'ᛗ',N:'ᚾ',O:'ᛟ',P:'ᛈ',R:'ᚱ',S:'ᛊ',T:'ᛏ',U:'ᚢ',V:'ᚹ',W:'ᚹ',Y:'ᛇ'};
    const baseWords = ['HEIDRUN','VALHALLA','NORSE','ASGARD','VALKYRIE','RUNES','CRYPTO','SOLANA','RELICS','GOAT'];
    function toRunes(w){
      return w.toUpperCase().split('').map(ch=> map[ch]||'').join(' ');
    }
    function spawnWord(){
      const el = document.createElement('span');
      el.className = 'rune-word';
      const w = baseWords[Math.floor(Math.random()*baseWords.length)];
      el.textContent = toRunes(w) || 'ᚠ ᚢ ᚦ';
      const rect = wordsLayer.getBoundingClientRect();
      const top = (0.12 + Math.random()*0.76) * rect.height; // 12%..88%
      const left = (0.08 + Math.random()*0.84) * rect.width; // 8%..92%
      const size = 12 + Math.random()*10;
      el.style.top = top + 'px';
      el.style.left = left + 'px';
      el.style.fontSize = size + 'px';
      wordsLayer.appendChild(el);
      setTimeout(()=> el.remove(), 5200);
      // cap children to avoid buildup
      while (wordsLayer.childElementCount > 24){ wordsLayer.firstElementChild?.remove(); }
    }
    setInterval(spawnWord, 1000); // one per second
  }
});
  // Buy modal open/close
  const buyBtn = document.getElementById('buyBtn');
  const buyLink = document.getElementById('buyLink');
  const buyModal = document.getElementById('buyModal');
  const buyClose = document.getElementById('buyClose');
  function openBuy(){ buyModal?.classList.add('show'); buyModal?.setAttribute('aria-hidden','false'); }
  function closeBuy(){ buyModal?.classList.remove('show'); buyModal?.setAttribute('aria-hidden','true'); }
  buyBtn?.addEventListener('click', (e)=>{ e.preventDefault(); openBuy(); });
  buyLink?.addEventListener('click', (e)=>{ e.preventDefault(); openBuy(); closeMenu(); });
  buyClose?.addEventListener('click', closeBuy);
  buyModal?.addEventListener('click', (e)=>{ if (e.target === buyModal) closeBuy(); });
