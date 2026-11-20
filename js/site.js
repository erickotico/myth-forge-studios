(() => {
  /* Idioma: inglês por padrão; português se o navegador estiver em português; a escolha do visitante fica salva */
  let LANG = "en";
  try { const s = localStorage.getItem("mf-lang"); if (s === "pt" || s === "en") LANG = s; else if ((navigator.language || "").toLowerCase().startsWith("pt")) LANG = "pt"; }
  catch (e) { if ((navigator.language || "").toLowerCase().startsWith("pt")) LANG = "pt"; }
  const L = (pt, en) => LANG === "pt" ? pt : en;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Marcas do anel do sigilo */
  const ticks = document.getElementById('ticks');
  let t = '';
  for (let i = 0; i < 72; i++) {
    const a = i * 5 * Math.PI / 180, long = i % 6 === 0;
    const r1 = 168, r2 = long ? 152 : 160;
    t += `<line x1="${200 + r1*Math.cos(a)}" y1="${200 + r1*Math.sin(a)}" x2="${200 + r2*Math.cos(a)}" y2="${200 + r2*Math.sin(a)}" stroke="${long ? 'var(--ember)' : 'var(--rune)'}" stroke-opacity="${long ? .9 : .5}" stroke-width="${long ? 2 : 1}"/>`;
  }
  ticks.innerHTML = t;

  /* Relógio do HUD */
  const clock = document.getElementById('clock');
  const tick = () => { try { clock.textContent = new Date().toLocaleTimeString('pt-BR', {timeZone:'America/Sao_Paulo', hour12:false}); } catch(e) { clock.textContent = new Date().toLocaleTimeString(); } };
  tick(); setInterval(tick, 1000);

  /* Brasas subindo pela página inteira + faíscas do golpe na bigorna */
  function embers(canvas, density, opts = {}) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, parts = [], sparks = [], drift = 0;
    addEventListener('scroll', (() => { let last = scrollY; return () => { drift += (scrollY - last) * .04; last = scrollY; }; })(), {passive:true});
    const make = (fresh) => ({
      x: Math.random() * w, y: fresh ? h + Math.random() * 40 : Math.random() * h,
      r: Math.random() * 1.8 + .4, vy: Math.random() * .6 + .25, vx: (Math.random() - .5) * .3,
      life: Math.random() * Math.PI * 2, hue: Math.random() < (opts.runeRatio || .12) ? 'r' : 'e'
    });
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({length: Math.round(w * h / density)}, () => make(false));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      if (opts.floor) {
        const g = ctx.createRadialGradient(w*.5, h*1.05, 0, w*.5, h*1.05, h*.9);
        g.addColorStop(0, 'rgba(255,122,47,.22)'); g.addColorStop(1, 'rgba(255,122,47,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      drift *= .92;
      for (const p of parts) {
        p.y -= p.vy + drift * p.r * .5; p.x += p.vx + Math.sin(p.life) * .25; p.life += .03;
        if (p.y < -10) Object.assign(p, make(true));
        if (p.y > h + 50) { p.y = -5; }
        if (p.x < -10) p.x = w + 5; else if (p.x > w + 10) p.x = -5;
        const a = .45 + Math.sin(p.life * 2) * .35;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 'r' ? `rgba(98,226,255,${a})` : `rgba(255,${140 + (p.r*30|0)},60,${a})`;
        ctx.shadowBlur = 8; ctx.shadowColor = p.hue === 'r' ? '#62e2ff' : '#ff7a2f';
        ctx.fill();
      }
      // faíscas do golpe: saltam, caem com gravidade e esfriam
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.px = s.x; s.py = s.y;
        s.vy += .18; s.vx *= .985; s.x += s.vx; s.y += s.vy; s.life -= s.decay;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(255,${150 + s.life*90|0},${60 + s.life*120|0},${s.life})`;
        ctx.lineWidth = 1.6; ctx.shadowBlur = 10; ctx.shadowColor = '#ff7a2f';
        ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x, s.y); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      requestAnimationFrame(draw);
    }
    size(); draw();
    addEventListener('resize', size);
    return {
      burst(x, y, n = 70) {
        for (let i = 0; i < n; i++) {
          const a = -Math.PI/2 + (Math.random() - .5) * Math.PI * 1.1, sp = Math.random() * 9 + 3;
          sparks.push({x, y, px:x, py:y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: Math.random() * .015 + .012});
        }
      }
    };
  }
  const forge = embers(document.getElementById('embers'), 9000, {floor: true});

  /* Golpe na bigorna: faíscas + giro acelerado do anel */
  const sigil = document.getElementById('sigil');
  const strike = () => {
    const r = sigil.getBoundingClientRect();
    forge.burst(r.left + r.width * .5, r.top + r.height * .47);
    sigil.classList.remove('strike'); void sigil.offsetWidth; sigil.classList.add('strike');
    sigil.querySelectorAll('.spin').forEach(g => g.classList.add('fast'));
    clearTimeout(strike.t); strike.t = setTimeout(() => { sigil.classList.remove('strike'); sigil.querySelectorAll('.spin').forEach(g => g.classList.remove('fast')); }, 1400);
  };
  sigil.addEventListener('click', strike);
  sigil.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); strike(); } });
  setTimeout(strike, 900); // um golpe de boas-vindas ao abrir

  /* Arte do Empire of Rebirth: coliseu em perspectiva com brasas */
  function drawArena(c) {
    const ctx = c.getContext('2d');
    function paint() {
      const dpr = Math.min(devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0a0c16'); sky.addColorStop(.6, '#2a1208'); sky.addColorStop(1, '#5a1e06');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      // sol/portal
      const cx = w * .5, cy = h * .62;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * .6);
      g.addColorStop(0, 'rgba(255,195,107,.9)'); g.addColorStop(.25, 'rgba(255,122,47,.45)'); g.addColorStop(1, 'rgba(255,122,47,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // anel holográfico
      ctx.strokeStyle = 'rgba(98,226,255,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, h*.32, h*.32, 0, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.ellipse(cx, cy, h*.4, h*.4, 0, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      // arcos do coliseu
      ctx.fillStyle = '#07080d';
      const base = h * .72, n = Math.max(7, Math.round(w / 70));
      ctx.fillRect(0, base, w, h - base);
      for (let i = 0; i <= n; i++) {
        const x = i * w / n, aw = w / n * .62, top = base - h * .26;
        ctx.fillRect(x - w/n*.19, top, w/n*.38 - aw*.0, h*.26);
      }
      ctx.fillStyle = '#07080d'; ctx.fillRect(0, base - h*.3, w, h*.05);
      for (let i = 0; i < n; i++) {
        const x = (i + .5) * w / n, aw = w / n * .31;
        ctx.beginPath(); ctx.arc(x, base - h*.18, aw, Math.PI, 0); ctx.lineTo(x + aw, base); ctx.lineTo(x - aw, base); ctx.closePath();
        ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore();
      }
      // repinta o céu atrás dos arcos recortados
      ctx.save(); ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = sky; ctx.fillRect(0,0,w,h); ctx.restore();
      // silhueta do herói
      ctx.fillStyle = '#05060a';
      const hx = cx, hy = base + h*.02, s = h * .0042;
      ctx.beginPath();
      ctx.moveTo(hx - 9*s, hy); ctx.lineTo(hx - 6*s, hy - 30*s); ctx.lineTo(hx - 11*s, hy - 54*s); ctx.lineTo(hx - 4*s, hy - 62*s);
      ctx.arc(hx, hy - 68*s, 6*s, Math.PI*.8, Math.PI*.2, false);
      ctx.lineTo(hx + 11*s, hy - 54*s); ctx.lineTo(hx + 6*s, hy - 30*s); ctx.lineTo(hx + 9*s, hy); ctx.closePath(); ctx.fill();
      // espada erguida
      ctx.strokeStyle = '#ffc36b'; ctx.lineWidth = 2.2*s; ctx.shadowBlur = 16; ctx.shadowColor = '#ff7a2f';
      ctx.beginPath(); ctx.moveTo(hx + 10*s, hy - 52*s); ctx.lineTo(hx + 30*s, hy - 112*s); ctx.stroke(); ctx.shadowBlur = 0;
      // linhas de scan
      ctx.fillStyle = 'rgba(98,226,255,.04)';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    }
    paint(); addEventListener('resize', () => { if (c.isConnected) paint(); });
  }
  drawArena(document.getElementById('arena'));

  /* Arte do Master Tactician: prancheta tática holográfica, 4-3-3 animado */
  function pitch() {
    const svg = document.getElementById('pitch');
    const LINE = 'rgba(98,226,255,.45)';
    let o = `<rect width="400" height="260" fill="#05070b"/>
      <defs><linearGradient id="turf" x1="0" x2="1"><stop offset="0" stop-color="#0b1a16"/><stop offset="1" stop-color="#0a1320"/></linearGradient></defs>
      <rect x="20" y="20" width="360" height="220" fill="url(#turf)" stroke="${LINE}" stroke-width="1.2"/>`;
    for (let i = 0; i < 9; i++) o += `<rect x="${20 + i*40}" y="20" width="20" height="220" fill="rgba(98,226,255,.025)"/>`;
    o += `<line x1="200" y1="20" x2="200" y2="240" stroke="${LINE}"/><circle cx="200" cy="130" r="30" fill="none" stroke="${LINE}"/>
      <rect x="20" y="75" width="50" height="110" fill="none" stroke="${LINE}"/><rect x="330" y="75" width="50" height="110" fill="none" stroke="${LINE}"/>
      <rect x="20" y="105" width="18" height="50" fill="none" stroke="${LINE}"/><rect x="362" y="105" width="18" height="50" fill="none" stroke="${LINE}"/>`;
    // jogadas desenhadas (setas tracejadas)
    o += `<defs><marker id="ar" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 8 4 0 8z" fill="#ff7a2f"/></marker></defs>
      <path class="run" d="M150 130 Q 190 90 214 100" fill="none" stroke="#ff7a2f" stroke-width="1.6" marker-end="url(#ar)"/>
      <path class="run" d="M214 100 Q 250 118 270 124" fill="none" stroke="#ff7a2f" stroke-width="1.6" marker-end="url(#ar)"/>
      <path class="run" d="M290 70 Q 320 90 330 112" fill="none" stroke="#ffc36b" stroke-width="1.2" marker-end="url(#ar)"/>`;
    // 4-3-3 do nosso time (ciano) e adversários (cinza)
    const us = [[40,130],[90,60],[85,105],[85,155],[90,200],[150,130],[175,85],[175,175],[250,70],[270,130],[250,190]];
    const them = [[360,130],[320,70],[315,110],[315,150],[320,190],[275,95],[280,165],[230,130]];
    them.forEach(([x,y]) => o += `<circle cx="${x}" cy="${y}" r="6" fill="#1a1f2c" stroke="#5b6170"/>`);
    us.forEach(([x,y],i) => o += `<g><circle cx="${x}" cy="${y}" r="9" fill="rgba(98,226,255,.15)"><animate attributeName="r" values="7;11;7" dur="${2 + (i%4)*.4}s" repeatCount="indefinite"/></circle><circle cx="${x}" cy="${y}" r="6" fill="#62e2ff"/><text x="${x}" y="${y+2.6}" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-size="7" font-weight="700" fill="#05070b">${i === 0 ? 1 : i + 1}</text></g>`);
    o += `<circle class="ball" cx="150" cy="136" r="3.2" fill="#ffc36b" style="filter:drop-shadow(0 0 4px #ff7a2f)"/>`;
    o += `<rect class="scan" x="0" y="20" width="40" height="220" fill="rgba(98,226,255,.07)"/>`;
    o += `<text x="28" y="14" font-family="Chakra Petch, sans-serif" font-size="9" letter-spacing="2" fill="#62e2ff">${L("FORMAÇÃO 4-3-3","FORMATION 4-3-3")}</text>
      <text x="372" y="14" text-anchor="end" font-family="Chakra Petch, sans-serif" font-size="9" letter-spacing="2" fill="#ff7a2f">${L("RODADA 07","MATCHDAY 07")}</text>`;
    svg.innerHTML = o;
  }

  /* Arte do Lendas da Resistência: floresta noturna, vaga-lumes, espírito guardião e menu de batalha JRPG */
  function forest() {
    const svg = document.getElementById('forest');
    let o = `<defs>
        <linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a0c"/><stop offset="1" stop-color="#0c2a1e"/></linearGradient>
        <radialGradient id="fglow"><stop offset="0" stop-color="#7dffb5" stop-opacity=".8"/><stop offset="1" stop-color="#7dffb5" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#fsky)"/>
      <circle cx="320" cy="50" r="22" fill="#d9f5e6" opacity=".85"/><circle cx="320" cy="50" r="40" fill="#d9f5e6" opacity=".08"/>`;
    // fumaça/brilho do garimpo ao fundo
    o += `<ellipse cx="70" cy="150" rx="70" ry="30" fill="#ff7a2f" opacity=".14"/>`;
    const trees = (y, col, n, hMin, hMax, seed) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const x = (i + ((seed * (i+3)) % 7) / 10) * 400 / (n - 1), th = hMin + ((seed * (i + 1) * 37) % (hMax - hMin));
        s += `<path class="sway" style="animation-delay:-${i*.7}s" d="M${x} ${y} L${x-16} ${y} L${x-3} ${y-th*.45} L${x-12} ${y-th*.45} L${x} ${y-th} L${x+12} ${y-th*.45} L${x+3} ${y-th*.45} L${x+16} ${y} Z" fill="${col}"/>`;
      }
      return s;
    };
    o += trees(190, '#0d2a20', 12, 70, 120, 3) + trees(215, '#08190f', 9, 90, 150, 5);
    // rio
    o += `<path d="M0 232 Q 120 214 210 230 T 400 226 V260 H0Z" fill="#0b2433"/><path d="M20 240 Q 120 228 200 238" stroke="#62e2ff" stroke-opacity=".35" fill="none"/>`;
    // espírito guardião
    o += `<g class="spirit"><circle cx="205" cy="150" r="34" fill="url(#fglow)"/>
      <path d="M205 128 c10 0 14 10 12 20 c-2 10 -6 18 -12 26 c-6 -8 -10 -16 -12 -26 c-2 -10 2 -20 12 -20z" fill="#bfffe0" opacity=".9"/>
      <circle cx="200" cy="142" r="2" fill="#05070b"/><circle cx="210" cy="142" r="2" fill="#05070b"/></g>`;
    // vaga-lumes
    for (let i = 0; i < 18; i++) {
      const x = (i * 53) % 380 + 10, y = 60 + (i * 71) % 150, d = 3 + (i % 5);
      o += `<circle cx="${x}" cy="${y}" r="1.8" fill="#c6ff8a"><animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="-${i*.4}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;${(i%3-1)*8} -10;0 0" dur="${d*2}s" repeatCount="indefinite"/></circle>`;
    }
    // menu de batalha JRPG
    o += `<g font-family="Chakra Petch, sans-serif" font-size="9" letter-spacing="1.5">
      <rect x="262" y="160" width="124" height="84" fill="rgba(5,7,11,.88)" stroke="#62e2ff" stroke-width="1"/>
      <text x="290" y="180" fill="#ffc36b">${L("ATACAR","ATTACK")}</text><text x="290" y="198" fill="#ece3cf">${L("MAGIA","MAGIC")}</text><text x="290" y="216" fill="#ece3cf">${L("CHAMAR ESPÍRITO","CALL SPIRIT")}</text><text x="290" y="234" fill="#ece3cf">${L("FUGIR","FLEE")}</text>
      <path class="cursor" d="M274 173 l8 3.5 -8 3.5z" fill="#ffc36b"/>
      <rect x="14" y="14" width="120" height="30" fill="rgba(5,7,11,.85)" stroke="#62e2ff"/>
      <text x="22" y="27" fill="#62e2ff">${L("GUARDIÃO  HP","GUARDIAN  HP")}</text><rect x="22" y="33" width="104" height="4" fill="#232a3b"/><rect x="22" y="33" width="78" height="4" fill="#7dffb5"/></g>`;
    svg.innerHTML = o;
  }

  /* Arte do Trivia: placa de pergunta com cronômetro e alternativa revelada */
  function quiz() {
    const svg = document.getElementById('quiz');
    let o = `<rect width="400" height="260" fill="#06070c"/>`;
    for (let i = 0; i < 14; i++) o += `<text x="${(i*67)%400}" y="${20 + (i*41)%240}" font-family="Spectral, serif" font-size="${18 + (i%3)*10}" fill="#62e2ff" opacity=".07">?</text>`;
    o += `<g font-family="Chakra Petch, sans-serif">
      <text x="40" y="38" font-size="9" letter-spacing="2" fill="#62e2ff">${L("PERGUNTA 07 / 10","QUESTION 07 / 10")}</text>
      <text x="360" y="38" text-anchor="end" font-size="9" letter-spacing="2" fill="#ff7a2f">${L("SEQUÊNCIA ×3","STREAK ×3")}</text>
      <rect x="40" y="46" width="320" height="4" fill="#232a3b"/><rect class="timer" x="40" y="46" width="320" height="4" fill="#ff7a2f"/>
      <text x="200" y="84" text-anchor="middle" font-family="Spectral, serif" font-size="17" fill="#ece3cf">${L("Qual metal funde a 1.538 °C?","Which metal melts at 1,538 °C?")}</text>`;
    const opts = [['A','Bronze'],['B',L('Ferro','Iron')],['C',L('Prata','Silver')],['D',L('Ouro','Gold')]];
    opts.forEach(([k, t], i) => {
      const x = 40 + (i % 2) * 165, y = 104 + Math.floor(i / 2) * 58, ok = k === 'B';
      o += `<polygon class="${ok ? 'pick' : ''}" points="${x+10},${y} ${x+155},${y} ${x+155},${y+34} ${x+145},${y+44} ${x},${y+44} ${x},${y+10}" fill="#0e111a" stroke="#232a3b"/>
        <text x="${x+16}" y="${y+27}" font-size="12" font-weight="700" fill="#62e2ff">${k}</text>
        <text class="${ok ? 'pick-t' : ''}" x="${x+38}" y="${y+27}" font-size="13" fill="#ece3cf">${t}</text>`;
    });
    o += `</g>`;
    svg.innerHTML = o;
  }

  /* As configurações (chave do formulário, vídeo, Diário, Discord) ficam em js/config.js */

  /* ---------- IDIOMA ---------- */
  const B = (pt, en) => ({ pt, en });                       // texto nos dois idiomas
  const tx = o => (o && typeof o === 'object' && !Array.isArray(o)) ? (o[LANG] ?? o.pt) : o;
  const p = arr => arr.map(x => `<p>${x}</p>`).join('');

  const UI = {
    update:B('Atualização','Update'), news:B('Notícia','News'),
    all:B('Todos','All'), game:B('Jogo','Game'), type:B('Tipo','Type'),
    updates:B('Atualizações','Updates'), newsP:B('Notícias','News'),
    read:B('Ler publicação →','Read post →'), versions:B('versões','versions'), version:B('versão','version'),
    back:B('← Voltar ao diário','← Back to the journal'), copy:B('Copiar link','Copy link'),
    copied:B('Link copiado.','Link copied.'), copyFail:B('Selecione o link e copie com Ctrl+C.','Select the link and copy it with Ctrl+C.'),
    share:B('Compartilhe esta publicação','Share this post'), newer:B('Mais recente','Newer'), older:B('Mais antiga','Older'),
    empty:B('Nenhuma publicação com esses filtros ainda.','No posts match these filters yet.'),
    diaryTitle:B('Diário da Forja','Forge Journal'),
    backGrim:B('← Voltar ao Grimório','← Back to the Grimoire'), genre:B('Gênero','Genre'), stage:B('Etapa','Stage'),
    engine:B('Motor','Engine'), madeUE:B('Feito na Unreal Engine','Made with Unreal Engine'), price:B('Preço','Price'),
    firstBuild:B('Primeira build a caminho','First build on the way'), guide:B('Abrir o Guia do Jogo','Open the Game Guide'),
    gallery:B('Galeria · Imagens e vídeos','Gallery · Images and videos'), galleryT:B('Veja o mundo por dentro','See the world from within'),
    shotSoon:B('Print em breve','Screenshot coming soon'), shotAlt:B('Imagem de','Screenshot of'),
    watchYT:B('Assistir no YouTube','Watch on YouTube'), video:B('Vídeo','Video'), soon:B('Em breve','Coming soon'),
    journey:B('Jornada · Etapa atual','Journey · Current stage'), journeyT:B('Da forja às suas mãos','From the forge to your hands'),
    current:B('Etapa atual','Current stage'), next:B('Próximos passos','Next steps'), now:B('Disponível agora','Available now'),
    done:B('O jogo está completo e pronto para jogar. Bom jogo!','The game is complete and ready to play. Have fun!'),
    specs:B('Ficha técnica','Tech specs'), specsT:B('Requisitos e controles','Requirements and controls'),
    req:B('Requisitos de PC','PC requirements'), est:B('Estimado','Estimated'), min:B('Mínimo','Minimum'), rec:B('Recomendado','Recommended'),
    controls:B('Controles','Controls'), others:B('Outros mundos','Other worlds'), othersT:B('Mais lendas da forja','More legends from the forge'),
    openMenu:B('Abrir menu','Open menu'), closeMenu:B('Fechar menu','Close menu'),
    beTester:B('Seja um testador','Become a tester'), testers:B('Testadores','Testers'),
    discordJoin:B('Entrar no Discord','Join the Discord'), discordSoon:B('Discord em breve','Discord coming soon'),
    formMail:B('Confira o e-mail: ele precisa ter @ e domínio.','Check the email: it needs an @ and a domain.'),
    formFill:B('Preencha nome, e-mail e mensagem para enviar.','Fill in name, email and message to send.'),
    formOk:B('Corvo enviado. Respondemos em até 3 dias úteis.','Raven sent. We reply within 3 business days.')
  };

  const STAGES = [B('Conceito','Concept'), B('Protótipo','Prototype'), B('Alfa','Alpha'), B('Beta','Beta'), B('Lançamento','Release')];

  /* ---------- REINOS DE EMPIRE OF REBIRTH & RUINS ---------- */
  const F = { cap:B('Capital','Capital'), deity:B('Divindade','Deity'), elite:B('Ordem de elite','Elite order'), fest:B('Festival','Festival'),
    hero:B('Herói da lenda','Legendary hero'), heroes:B('Heróis da lenda','Legendary heroes'), land:B('Paisagem','Landscape'),
    ruler:B('Governante','Ruler'), inst:B('Instituição','Institution'), legend:B('Na lenda','In the legend'), gov:B('Governo','Government'),
    weapon:B('Arma','Weapon'), arenas:B('Arenas','Arenas') };
  const H = { loc:B('Localização','Location'), hist:B('História','History'), cult:B('Cultura e costumes','Culture and customs'),
    soc:B('Sociedade e economia','Society and economy'), today:B('Atualmente','Today') };

  const REALMS = [
    { id:'thalor', name:'Thalor', glyph:'ᛏ', color:'#e6b84f', title:B('O reino da honra','The kingdom of honor'),
      facts:[[F.cap,'Valoria'],[F.deity,B('Eryndor, o deus guerreiro','Eryndor, the warrior god')],[F.elite,B('Ordem dos Lanceiros','Order of Lancers')],[F.fest,B('Festival de Eryndor','Festival of Eryndor')],[F.hero,B('Caine, o lanceiro','Caine, the lancer')],[F.land,B('Planícies verdejantes e montanhas','Green plains and mountains')]],
      summary:B('Terra de lanceiros e cavaleiros de elite, onde coragem, honra e lealdade são as pedras angulares da sociedade. Os feitos de seus guerreiros ecoam em cânticos há gerações.',
                "Land of elite lancers and knights, where courage, honor and loyalty are the cornerstones of society. The deeds of its warriors have echoed in songs for generations."),
      full:[
        [H.loc, B(['Thalor se estende por vastas planícies que vão até onde os olhos alcançam, interrompidas apenas por cadeias de montanhas que se erguem como guardiãs naturais do reino. A capital, Valoria, fica em um vale protegido, onde está o Grande Salão dos Guerreiros, lugar sagrado onde os feitos dos heróis são eternamente honrados.'],
                  ["Thalor stretches across vast plains as far as the eye can see, broken only by mountain ranges that rise like natural guardians of the kingdom. The capital, Valoria, lies in a sheltered valley and holds the Great Hall of Warriors, a sacred place where the deeds of heroes are honored forever."])],
        [H.hist, B(['Em tempos antigos, o deus guerreiro Eryndor desceu dos céus para guiar os primeiros habitantes do reino. Com sua armadura brilhante e sua lança sagrada, trouxe os princípios de coragem, honra e lealdade, e ensinou aos humanos as artes da guerra e da defesa.','Os primeiros reis de Thalor foram guerreiros escolhidos por Eryndor, e suas linhagens defenderam e expandiram o reino com bravura e justiça, fazendo de Thalor um farol de nobreza na região.'],
                   ["In ancient times, the warrior god Eryndor came down from the heavens to guide the kingdom's first people. With his shining armor and sacred spear, he brought the principles of courage, honor and loyalty, and taught humans the arts of war and defense.","Thalor's first kings were warriors chosen by Eryndor, and their bloodlines defended and expanded the realm with bravery and justice, making Thalor a beacon of nobility in the region."])],
        [H.cult, B(['<strong>Festival de Eryndor:</strong> todo ano o reino celebra com torneios, danças guerreiras e oferendas. Os jovens guerreiros recebem ali suas primeiras lanças e entram na irmandade dos defensores de Thalor.','<strong>Grande Salão dos Guerreiros:</strong> no coração de Valoria, tapeçarias de batalhas épicas e as armas dos mais valorosos guardam a memória dos heróis.','<strong>Ordem dos Lanceiros:</strong> a elite de cavaleiros e lanceiros que jura lealdade a Eryndor, com armaduras gravadas com os símbolos sagrados do deus.','<strong>Código de Honra:</strong> princípios que todo guerreiro segue, unindo perícia em batalha, respeito e lealdade à causa justa.'],
                   ["<strong>Festival of Eryndor:</strong> every year the kingdom celebrates with tournaments, war dances and offerings. Young warriors receive their first spears there and join the brotherhood of Thalor's defenders.","<strong>Great Hall of Warriors:</strong> in the heart of Valoria, tapestries of epic battles and the weapons of the bravest keep the heroes' memory alive.","<strong>Order of Lancers:</strong> the elite of knights and lancers sworn to Eryndor, their armor engraved with the god's sacred symbols.","<strong>Code of Honor:</strong> principles every warrior follows, uniting battle skill, respect and loyalty to a just cause."])],
        [H.soc, B(['O Conselho de Valoria, formado pelas principais famílias guerreiras e pelos sábios, governa segundo os princípios de Eryndor. A agricultura farta das planícies sustenta uma vida abundante para todo o povo.'],
                  ["The Council of Valoria, formed by the leading warrior families and the sages, rules by Eryndor's principles. The rich farmland of the plains ensures an abundant life for all."])],
        [H.today, B(['O legado de Eryndor vive em cada lanceiro e cavaleiro. Thalor prospera não só pela força de suas armas, mas pela integridade e pela união de seu povo. Em Thalor, cada amanhecer é um novo capítulo de honra e coragem.'],
                    ["Eryndor's legacy lives on in every lancer and knight. Thalor thrives not only through the strength of its arms, but through the integrity and unity of its people. In Thalor, every dawn is a new chapter of honor and courage."])]
      ]},
    { id:'aurelis', name:'Aurelis', glyph:'ᚠ', color:'#5b9ee8', title:B('O reino do ouro e das rotas','The kingdom of gold and roads'),
      facts:[[F.cap,'Eldoria'],[F.ruler,B('Rei Aldric, o Sábio','King Aldric the Wise')],[F.inst,B('Guilda dos Mercadores',"Merchants' Guild")],[F.fest,B('Feiras de Eldoria','Fairs of Eldoria')],[F.legend,B('Financiou e abasteceu a resistência','Funded and supplied the resistance')],[F.land,B('Portos naturais e terras férteis','Natural harbors and fertile land')]],
      summary:B('O coração comercial do mundo. Seus mercadores são mestres da negociação, sua moeda vale em todos os portos, e seu ouro sustentou a guerra contra Zarek.',
                'The commercial heart of the world. Its merchants are masters of negotiation, its coin is good in every port, and its gold sustained the war against Zarek.'),
      full:[
        [H.loc, B(['Aurelis fica na encruzilhada de rotas comerciais vitais, em uma região de portos naturais e terras férteis, com cidades prósperas ligadas por estradas bem guardadas. A capital, Eldoria, é um centro vibrante de comércio e cultura, à beira de um rio que deságua em um porto movimentado.'],
                  ['Aurelis sits at the crossroads of vital trade routes, in a region of natural harbors and fertile land, with thriving cities linked by well-guarded roads. The capital, Eldoria, is a vibrant center of trade and culture on a river that flows into a busy port.'])],
        [H.hist, B(['Os primeiros colonos descobriram a posição estratégica e as riquezas da região e logo se tornaram mercadores habilidosos, abrindo rotas com terras distantes. Sob reis sábios e visionários, Aurelis virou um centro de comércio e influência.','O auge veio com o Rei Aldric, o Sábio, que incentivou o comércio, a inovação e a segurança, e fundou a Guilda dos Mercadores para regular o comércio e garantir a qualidade.'],
                   ["The first settlers discovered the region's strategic position and riches and soon became skilled merchants, opening routes to distant lands. Under wise and visionary kings, Aurelis became a center of trade and influence.","Its height came under King Aldric the Wise, who encouraged trade, innovation and security, and founded the Merchants' Guild to regulate commerce and guarantee quality."])],
        [H.cult, B(['<strong>Feiras de Eldoria:</strong> todo ano a capital recebe mercadores do mundo inteiro, com produtos exóticos, competições de negociação e festas à prosperidade.','<strong>Guilda dos Mercadores:</strong> treina, define padrões de qualidade e resolve disputas. Seus membros são altamente respeitados.','<strong>Arte da Negociação:</strong> desde cedo os jovens estudam retórica, contabilidade e diplomacia.'],
                   ['<strong>Fairs of Eldoria:</strong> every year the capital welcomes merchants from all over the world, with exotic goods, bargaining contests and celebrations of prosperity.',"<strong>Merchants' Guild:</strong> it trains, sets quality standards and settles disputes. Its members are highly respected.",'<strong>The Art of Negotiation:</strong> from an early age, the young study rhetoric, accounting and diplomacy.'])],
        [H.soc, B(['Comerciantes, artesãos, agricultores e soldados formam uma sociedade movida pelo comércio de especiarias raras, tecidos finos, metais preciosos e artefatos. A moeda de Aurelis é aceita em todo o mundo conhecido.'],
                  ['Merchants, artisans, farmers and soldiers form a society driven by the trade of rare spices, fine fabrics, precious metals and crafted artifacts. The coin of Aurelis is accepted throughout the known world.'])],
        [B('Força militar','Military strength'), B(['Para proteger rotas e fronteiras, Aurelis mantém um exército de mercenários especializados e soldados rigorosamente treinados, disciplinados em tempos de paz e de conflito.'],
                  ['To protect its routes and borders, Aurelis keeps an army of skilled mercenaries and rigorously trained soldiers, disciplined in times of peace and of war.'])],
        [H.today, B(['Riqueza e força militar fazem de Aurelis um pilar de estabilidade na região, onde astúcia, lealdade e prosperidade convivem em harmonia.'],
                    ['Wealth and military strength make Aurelis a pillar of stability in the region, where cunning, loyalty and prosperity live in harmony.'])]
      ]},
    { id:'sylvanor', name:'Sylvanor', glyph:'ᛒ', color:'#6fd39a', title:B('O reino da magia antiga','The kingdom of ancient magic'),
      facts:[[F.cap,'Sylmareth'],[F.deity,B('Aelion, o deus elfo','Aelion, the elven god')],[F.gov,B('Conselho de elfos e druidas','Council of elves and druids')],[F.fest,B('Festival da Lua Cheia','Full Moon Festival')],[F.hero,B('Lorian, o mago','Lorian, the mage')],[F.land,B('Florestas antigas, rios e cachoeiras','Ancient forests, rivers and waterfalls')]],
      summary:B('Uma terra de mistérios ancestrais onde a magia flui como os rios. Elfos e druidas guardam ali tradições dos tempos em que o mundo era jovem.',
                'A land of ancient mysteries where magic flows like its rivers. Elves and druids keep traditions from the days when the world was young.'),
      full:[
        [H.loc, B(['Sylvanor cobre uma vasta região de florestas antigas, com árvores que se erguem até os céus. A capital, Sylmareth, é construída entre as árvores, com passarelas que se integram à paisagem. Rios cristalinos e cachoeiras são comuns, e a luz do sol atravessa as folhas em um ambiente de eterna tranquilidade.'],
                  ['Sylvanor covers a vast region of ancient forests, with trees that reach the sky. The capital, Sylmareth, is built among the trees, with walkways that blend into the landscape. Crystal rivers and waterfalls are everywhere, and sunlight filters through the leaves in an atmosphere of eternal calm.'])],
        [H.hist, B(['Em tempos imemoriais, o deus elfo Aelion desceu dos céus para ensinar aos primeiros elfos e druidas a magia natural e o equilíbrio do mundo. Seus princípios de harmonia, respeito e cuidado com a natureza se tornaram os alicerces do reino.','O conselho de sábios elfos e druidas seguiu preservando e expandindo esse conhecimento, fazendo de Sylvanor um centro de sabedoria.'],
                   ['In time immemorial, the elven god Aelion came down from the heavens to teach the first elves and druids natural magic and the balance of the world. His principles of harmony, respect and care for nature became the foundations of the kingdom.','The council of elven sages and druids has kept preserving and expanding this knowledge, making Sylvanor a center of wisdom.'])],
        [H.cult, B(['<strong>Festivais da Natureza:</strong> danças, canções e rituais honram os espíritos da floresta. O Festival da Lua Cheia marca o momento em que a magia é mais forte.','<strong>Comunicação com os espíritos:</strong> desde cedo, elfos e druidas aprendem a ouvir as árvores, as plantas e os animais.','<strong>Artes da Magia Natural:</strong> ensinadas em clareiras sagradas para curar, proteger e nutrir a terra.'],
                   ['<strong>Nature Festivals:</strong> dances, songs and rituals honor the spirits of the forest. The Full Moon Festival marks the moment when magic is strongest.','<strong>Speaking with spirits:</strong> from an early age, elves and druids learn to listen to the trees, plants and animals.','<strong>Arts of Natural Magic:</strong> taught in sacred clearings to heal, protect and nourish the land.'])],
        [H.soc, B(['O reino vive da abundância das florestas, colhendo apenas o necessário. Joias e tecidos feitos com materiais naturais são muito apreciados.'],
                  ['The kingdom lives off the abundance of the forests, harvesting only what it needs. Jewelry and fabrics made from natural materials are highly prized.'])],
        [B('Aelion, o deus elfo','Aelion, the elven god'), B(['Venerado como guardião de Sylvanor, Aelion tem templos nos lugares de maior beleza natural, onde recebe oferendas de flores, frutas e poções, com cânticos e danças.'],
                  ["Revered as Sylvanor's guardian, Aelion has temples in the most beautiful natural places, where he receives offerings of flowers, fruit and potions, with songs and dances."])],
        [H.today, B(['Sylvanor é a prova de que magia e natureza podem coexistir em perfeita harmonia: uma terra de esplendor e mistérios eternos.'],
                    ['Sylvanor is proof that magic and nature can live in perfect harmony: a land of splendor and eternal mystery.'])]
      ]},
    { id:'dracoria', name:'Dracória', glyph:'ᚦ', color:'#ff6a3d', title:B('O reino do deus-dragão','The kingdom of the dragon god'),
      facts:[[F.cap,'Draconia'],[F.deity,B('Zephyrinox, o deus-dragão','Zephyrinox, the dragon god')],[F.elite,B('Ordem dos Dragões','Order of Dragons')],[F.fest,B('Festival de Zephyrinox','Festival of Zephyrinox')],[F.heroes,B('Ektor, o guerreiro, e Korvath, o bárbaro','Ektor, the warrior, and Korvath, the barbarian')],[F.land,B('Vale entre montanhas de fogo e floresta','A valley between mountains of fire and forest')]],
      summary:B('Um vale místico guardado pelo sábio dragão Zephyrinox, onde os céus se pintam de fogo e o vento sussurra segredos ancestrais. Berço de Ektor e Korvath.',
                'A mystical valley guarded by the wise dragon Zephyrinox, where the skies are painted in fire and the wind whispers ancient secrets. Birthplace of Ektor and Korvath.'),
      full:[
        [H.loc, B(['Dracória ocupa um vale fértil protegido pelas Montanhas Flamejantes ao norte e pela Floresta do Crepúsculo ao sul. A capital, Draconia, fica aos pés do Pico de Zephyrinox, a montanha sagrada onde o grande dragão reside.'],
                  ['Dracória lies in a fertile valley protected by the Flaming Mountains to the north and the Twilight Forest to the south. The capital, Draconia, stands at the foot of Zephyrinox Peak, the sacred mountain where the great dragon dwells.'])],
        [H.hist, B(['Zephyrinox desceu dos céus em um dia de tempestade, iluminando o céu com seu corpo imenso, e se proclamou protetor do vale. Nômades em busca de um lar decidiram ficar e erguer um reino em honra ao dragão divino, e sob sua proteção Dracória floresceu.'],
                   ['Zephyrinox descended from the heavens on a stormy day, lighting up the sky with his immense body, and proclaimed himself protector of the valley. Nomads in search of a home chose to stay and raise a kingdom in honor of the divine dragon, and under his protection Dracória flourished.'])],
        [H.cult, B(['<strong>Festival de Zephyrinox:</strong> uma semana de danças, oferendas e competições de bravura e sabedoria, que termina com uma grande oferenda no Pico de Zephyrinox.','<strong>Ordem dos Dragões:</strong> cavaleiros treinados na guerra e na magia, com armaduras forjadas com escamas doadas pelo próprio dragão.','<strong>Magia Dracônica:</strong> os Dracomantes estudam na Escola de Magia Dracônica, em Draconia.','<strong>Arquitetura:</strong> edifícios adornados com dragões e formas curvas; pinturas e tapeçarias narram as proezas de Zephyrinox.'],
                   ['<strong>Festival of Zephyrinox:</strong> a week of dances, offerings and contests of bravery and wisdom, ending with a great offering on Zephyrinox Peak.','<strong>Order of Dragons:</strong> knights trained in war and magic, wearing armor forged from scales given by the dragon himself.','<strong>Draconic Magic:</strong> the Dracomancers study at the School of Draconic Magic in Draconia.',"<strong>Architecture:</strong> buildings adorned with dragons and curved forms; paintings and tapestries tell of Zephyrinox's deeds."])],
        [H.soc, B(['O Conselho de Draconia, formado pelas principais famílias e líderes religiosos, governa segundo os ensinamentos do dragão. Terras férteis e a mineração de metais preciosos nas montanhas garantem a prosperidade.'],
                  ["The Council of Draconia, formed by the leading families and religious leaders, rules by the dragon's teachings. Fertile land and the mining of precious metals in the mountains ensure prosperity."])],
        [H.today, B(['Sob a proteção de Zephyrinox, o Sábio, Dracória vive em paz há gerações. Sua história é a prova do poder da união entre humanos e seres mágicos.'],
                    ['Under the protection of Zephyrinox the Wise, Dracória has lived in peace for generations. Its history is proof of the power of the union between humans and magical beings.'])]
      ]},
    { id:'ventharis', name:'Ventharis', glyph:'ᛉ', color:'#a9dcf0', title:B('O reino dos ventos','The kingdom of the winds'),
      facts:[[F.cap,'Lyrahn'],[F.deity,B('Vaelith, a Senhora dos Ventos','Vaelith, the Lady of the Winds')],[F.elite,B('Caçadores de Asas','Wing Hunters')],[F.fest,B('Festival das Mil Flechas','Festival of a Thousand Arrows')],[F.hero,B('Kael, o arqueiro','Kael, the archer')],[F.land,B('Terras altas, falésias e ninhos de dragões','Highlands, cliffs and dragon nests')]],
      summary:B('Nas terras altas onde o vento nunca dorme, um povo de arqueiros aprendeu a ler o ar antes de soltar a flecha. Foram eles que derrubaram os dragões de Zarek.',
                "In the highlands where the wind never sleeps, a people of archers learned to read the air before loosing an arrow. They were the ones who brought down Zarek's dragons."),
      full:[
        [H.loc, B(['Ventharis ocupa as terras altas acima das nuvens, um labirinto de falésias, desfiladeiros e platôs varridos por ventos que nunca cessam. Nas escarpas mais altas, dragões selvagens fazem seus ninhos. A capital, Lyrahn, é escavada na face de um penhasco, com pontes suspensas e torres de vigia que dominam o horizonte.'],
                  ['Ventharis occupies the highlands above the clouds, a maze of cliffs, canyons and plateaus swept by winds that never cease. On the highest crags, wild dragons build their nests. The capital, Lyrahn, is carved into a cliff face, with hanging bridges and watchtowers overlooking the horizon.'])],
        [H.hist, B(['Os primeiros habitantes subiram às alturas fugindo de guerras nas planícies. O vento cortante quase os destruiu, até que Vaelith, a Senhora dos Ventos, se revelou a eles e ensinou a ouvir o ar: de onde ele vem, para onde vai e como carrega uma flecha.','Viver entre dragões selvagens forjou o povo de Ventharis. Ao longo de gerações, aprenderam a defender seus vales das feras aladas, e dessa necessidade nasceu a ordem dos Caçadores de Asas.'],
                   ['The first settlers climbed to the heights fleeing wars in the plains. The cutting wind nearly destroyed them, until Vaelith, the Lady of the Winds, revealed herself and taught them to listen to the air: where it comes from, where it goes and how it carries an arrow.','Living among wild dragons forged the people of Ventharis. Over generations they learned to defend their valleys from the winged beasts, and from that need the order of the Wing Hunters was born.'])],
        [H.cult, B(['<strong>Festival das Mil Flechas:</strong> todo ano os jovens disparam contra o vento do penhasco para provar a mira. Quem acerta o alvo além do abismo recebe a pena prateada dos Caçadores.','<strong>Caçadores de Asas:</strong> a elite de arqueiros treinada para abater dragões. Kael, herói da lenda, foi o maior de todos.','<strong>A leitura do vento:</strong> toda criança aprende a sentir o vento no rosto antes de aprender a escrever. Dizem que Vaelith sussurra a trajetória certa a quem sabe ouvir.'],
                   ['<strong>Festival of a Thousand Arrows:</strong> every year the young shoot against the cliff wind to prove their aim. Whoever hits the target beyond the abyss receives the silver feather of the Hunters.','<strong>Wing Hunters:</strong> the elite of archers trained to bring down dragons. Kael, hero of the legend, was the greatest of them all.','<strong>Reading the wind:</strong> every child learns to feel the wind on their face before learning to write. They say Vaelith whispers the right path to those who know how to listen.'])],
        [H.soc, B(['Ventharis é governada pelo Conselho das Torres, com um representante de cada vigia do reino. A economia vive do pastoreio nas encostas, do comércio de penas e escamas e da fabricação dos melhores arcos e flechas do mundo conhecido.'],
                  ["Ventharis is ruled by the Council of Towers, with one representative from each of the kingdom's watchtowers. Its economy lives on herding along the slopes, the trade of feathers and scales and the crafting of the finest bows and arrows in the known world."])],
        [B('A tensão com Dracória','The tension with Dracória'), B(['Dracória venera um deus-dragão; Ventharis caça dragões. Por séculos, os dois reinos se olharam com desconfiança. A aliança só foi possível quando os dragões de Zarek surgiram corrompidos pelas trevas: diante de um inimigo comum, Dracomantes e Caçadores de Asas lutaram lado a lado.'],
                  ["Dracória worships a dragon god; Ventharis hunts dragons. For centuries the two kingdoms eyed each other with distrust. The alliance only became possible when Zarek's dragons appeared, corrupted by darkness: facing a common enemy, Dracomancers and Wing Hunters fought side by side."])],
        [H.today, B(['A paz é frágil, mas a lembrança da aliança persiste. Em Lyrahn, as torres continuam vigiando o céu, e cada flecha disparada carrega uma prece a Vaelith.'],
                    ['The peace is fragile, but the memory of the alliance endures. In Lyrahn, the towers keep watching the sky, and every arrow loosed carries a prayer to Vaelith.'])]
      ]},
    { id:'malakar', name:'Malakar', enemy:true, glyph:'ᚺ', color:'#b07cff', title:B('O domínio das trevas','The dominion of darkness'),
      facts:[[F.cap,'Noxarus'],[F.ruler,B('Zarek, o Lorde Demônio','Zarek, the Demon Lord')],[F.weapon,B('Lança do Abismo','Spear of the Abyss')],[F.fest,B('Festival das Chamas Negras','Festival of Black Flames')],[F.arenas,B('Arenas de Sangue','Blood Arenas')],[F.land,B('Vulcões, rios de lava e desertos de cinzas','Volcanoes, lava rivers and ash deserts')]],
      summary:B('Um plano sombrio onde a escuridão reina suprema. Governado pelo impiedoso Zarek, Malakar é um domínio de terror onde demônios se alimentam do medo dos mortais.',
                'A shadow plane where darkness reigns supreme. Ruled by the merciless Zarek, Malakar is a dominion of terror where demons feed on the fear of mortals.'),
      full:[
        [H.loc, B(['Malakar existe em um plano sombrio e distorcido, separado do mundo dos mortais por um véu de trevas e magia negra: vulcões em erupção, rios de lava e desertos de cinzas. A capital, Noxarus, é uma fortaleza de ossos e pedra negra, iluminada apenas por chamas infernais.'],
                  ['Malakar exists on a dark, twisted plane, separated from the mortal world by a veil of darkness and black magic: erupting volcanoes, rivers of lava and deserts of ash. The capital, Noxarus, is a fortress of bone and black stone, lit only by infernal flames.'])],
        [H.hist, B(['Há milênios, Zarek, o mais poderoso dos demônios, tomou o trono após uma guerra cataclísmica contra os outros lordes demoníacos e unificou os clãs sob seu domínio. Ergueu Noxarus sobre as ruínas de reinos destruídos e governa por terror absoluto: a traição é punida com tormentos eternos e a lealdade, recompensada com poder corrupto.'],
                   ['Millennia ago, Zarek, the mightiest of demons, seized the throne after a cataclysmic war against the other demon lords and united the clans under his rule. He raised Noxarus on the ruins of destroyed kingdoms and rules through absolute terror: betrayal is punished with eternal torment, and loyalty rewarded with corrupt power.'])],
        [H.cult, B(['<strong>Festivais de Agonia:</strong> celebrações do sofrimento. O Festival das Chamas Negras é o mais importante, com rituais para invocar poder das profundezas.','<strong>Arenas de Sangue:</strong> demônios lutam até a morte para conquistar o favor de Zarek.','<strong>Culto ao Caos:</strong> altares e templos dedicados a Zarek, onde sacerdotes canalizam a energia caótica do reino.'],
                   ['<strong>Festivals of Agony:</strong> celebrations of suffering. The Festival of Black Flames is the most important, with rituals to summon power from the depths.',"<strong>Blood Arenas:</strong> demons fight to the death to win Zarek's favor.","<strong>Cult of Chaos:</strong> altars and temples dedicated to Zarek, where priests channel the realm's chaotic energy."])],
        [H.soc, B(['Uma hierarquia rígida em que os mais fortes dominam os mais fracos pelo medo. A economia vive da pilhagem e da escravidão: mortais capturados trabalham nas minas de enxofre e forjam armas de destruição.'],
                  ['A rigid hierarchy in which the strongest dominate the weakest through fear. The economy lives on plunder and slavery: captured mortals toil in the sulfur mines and forge weapons of destruction.'])],
        [B('Zarek, o Lorde Demônio','Zarek, the Demon Lord'), B(['Pele vermelho-profundo, olhos como carvões em brasa e chifres retorcidos. Zarek empunha a Lança do Abismo, forjada nas profundezas, capaz de consumir almas. É adorado como um deus em Malakar.'],
                  ['Deep red skin, eyes like burning coals and twisted horns. Zarek wields the Spear of the Abyss, forged in the depths and able to consume souls. In Malakar he is worshipped as a god.'])],
        [H.today, B(['Malakar segue sendo terra de sofrimento e poder sombrio. Relíquias de magia negra são símbolos de prestígio, e o terror é a única lei.'],
                    ['Malakar remains a land of suffering and dark power. Relics of black magic are symbols of prestige, and terror is the only law.'])]
      ]}
  ];

  const HEROES = [
    ['Lorian', B('Mago','Mage'), 'Sylvanor', 'ᛚ', B('Mestre da proteção e da cura. Suas barreiras guardaram cidades e fortalezas da magia de Zarek.',"Master of protection and healing. His barriers shielded cities and fortresses from Zarek's magic.")],
    ['Ektor', B('Guerreiro','Warrior'), 'Dracória', 'ᛏ', B('Força e espada inigualáveis. Sua presença na linha de frente era sinal de esperança.','Unmatched strength and swordsmanship. His presence on the front line was a sign of hope.')],
    ['Korvath', B('Bárbaro','Barbarian'), 'Dracória', 'ᚦ', B('A Fúria da Montanha. Lutava ao lado de Ektor, rompendo as linhas onde o inimigo era mais forte.',"The Mountain's Fury. He fought beside Ektor, breaking the lines where the enemy was strongest.")],
    ['Kael', B('Arqueiro','Archer'), 'Ventharis', 'ᛉ', B('Mira certeira. Com os Caçadores de Asas, abateu os dragões corrompidos de Zarek.',"Deadly aim. With the Wing Hunters, he brought down Zarek's corrupted dragons.")],
    ['Caine', B('Lanceiro','Lancer'), 'Thalor', 'ᛜ', B('Lança lendária e estrategista brilhante. Suas cargas de cavalaria rompiam qualquer formação.','Legendary spear and brilliant strategist. His cavalry charges broke any formation.')]
  ];

  const CLASSES = [
    [B('Guerreiro','Warrior'), B('Espada e espada grande','Sword and greatsword'), true],
    [B('Lanceiro','Lancer'), B('Lança','Spear'), true],
    [B('Arqueiro','Archer'), B('Arco','Bow'), true],
    [B('Espadachim','Swordsman'), B('Espada','Sword'), false],
    [B('Bárbaro','Barbarian'), B('Machado e espada grande','Axe and greatsword'), false],
    [B('Feiticeiro','Sorcerer'), B('Cajado','Staff'), false]
  ];

  const R = { os:B('Sistema','OS'), cpu:B('Processador','Processor'), ram:B('Memória','Memory'), gpu:B('Placa de vídeo','Graphics'), disk:B('Armazenamento','Storage') };
  const ssd = gb => B(`${gb} GB em SSD`, `${gb} GB SSD`);
  const REQ_UE = {
    min:[[R.os,'Windows 10 64-bit'],[R.cpu,'Intel Core i5-8400 / AMD Ryzen 5 2600'],[R.ram,'8 GB'],[R.gpu,'GTX 1060 6 GB / RX 580'],[R.disk,'20 GB']],
    rec:[[R.os,'Windows 10/11 64-bit'],[R.cpu,'Intel Core i7-10700 / AMD Ryzen 7 3700X'],[R.ram,'16 GB'],[R.gpu,'RTX 2070 / RX 6700 XT'],[R.disk,ssd(20)]]
  };
  const REQ_MID = {
    min:[[R.os,'Windows 10 64-bit'],[R.cpu,'Intel Core i5-6500 / AMD Ryzen 3 1300X'],[R.ram,'8 GB'],[R.gpu,'GTX 960 / RX 470'],[R.disk,'10 GB']],
    rec:[[R.os,'Windows 10/11 64-bit'],[R.cpu,'Intel Core i5-10400 / AMD Ryzen 5 3600'],[R.ram,'16 GB'],[R.gpu,'GTX 1660 / RX 5600'],[R.disk,ssd(10)]]
  };
  const C = { move:B('Mover','Move'), confirm:B('Confirmar','Confirm'), menu:B('Menu','Menu'), click:B('Clique','Click') };

  /* ---------- JOGOS ----------
     shots: coloque aqui os caminhos das imagens quando existirem, ex.: ['img/empire-1.jpg'].
     Até lá, aparecem espaços "Print em breve". */
  const GAMES = {
    'empire-of-rebirth': {
      short:'Empire of Rebirth &amp; Ruins', art:'arena', genre:'Action RPG', stage:2,
      stageLabel:B('Alfa disponível','Alpha available'), price:B('Preço a definir','Price TBA'),
      itch:'https://erickotico-dev.itch.io/empire-of-rebirth', itchLabel:B('Jogar a alfa no itch.io','Play the alpha on itch.io'),
      guide:'https://erickotico.github.io/EmpireofRebithandRuins/',
      intro:B('Há eras, cinco heróis uniram os reinos contra Zarek, o Lorde Demônio de Malakar, e seus dragões corrompidos. Hoje eles são lenda, e as sombras voltaram a se mover. Escolha seu caminho e lute. Se cair, renasça e vença o mal, continue a lenda.',
              'Ages ago, five heroes united the kingdoms against Zarek, the Demon Lord of Malakar, and his corrupted dragons. Today they are legend, and the shadows are stirring again. Choose your path and fight. If you fall, be reborn, defeat evil, carry on the legend.'),
      blocks:['reinos','herois','renascer','classes'], shots:[],
      video:{ id:'iSpMMIvV2m0', label:B('Bastidores','Behind the scenes'), title:B('Testes de gameplay','Gameplay tests') },
      next:[B('Save Game e checkpoints','Save game and checkpoints'),B('Classes Espadachim, Bárbaro e Feiticeiro','Swordsman, Barbarian and Sorcerer classes'),B('Árvores de talento para todas as armas','Talent trees for every weapon'),B('Build para download','Downloadable build')],
      reqs:REQ_UE,
      controls:[[C.move,'W A S D'],[B('Câmera','Camera'),'Mouse'],[B('Ataque','Attack'),B('Botão esquerdo','Left click')],[B('Esquiva / Dash','Dodge / Dash'),'Shift'],[B('Guarda','Guard'),B('Segurar Z','Hold Z')],[B('Habilidades','Skills'),'1 – 4'],[B('Travar alvo','Lock on'),B('Botão do meio','Middle click')]]
    },
    'master-tactician': {
      short:'Master Tactician', art:'pitch', genre:B('Gerenciamento de futebol','Football management'), stage:1,
      stageLabel:B('Em desenvolvimento','In development'), price:B('Preço a definir','Price TBA'),
      intro:B('Você é o técnico. Monte a escalação, desenhe a tática na prancheta e conduza seu clube rodada a rodada até a glória.',
              'You are the coach. Pick the lineup, draw the tactics on the board and lead your club match by match to glory.'),
      blocks:['mt'], shots:[], video:null,
      next:[B('Primeira build jogável','First playable build'),B('Prints e vídeo de uma partida','Screenshots and a match video')],
      reqs:REQ_MID,
      controls:[[B('Menus e escalação','Menus and lineup'),'Mouse'],[C.confirm,B('Clique / Enter','Click / Enter')],[B('Voltar','Back'),'Esc'],[B('Acelerar partida','Speed up match'),B('Espaço','Space')]]
    },
    'lendas-da-resistencia': {
      short:'Lendas da Resistência', art:'forest', genre:B('JRPG · Exploração e aventura','JRPG · Exploration and adventure'), stage:2,
      stageLabel:B('Alfa disponível','Alpha available'), price:B('Preço a definir','Price TBA'),
      itch:'https://erickotico-dev.itch.io/lendas-da-resistencia', itchLabel:B('Jogar a alfa no itch.io','Play the alpha on itch.io'),
      intro:B('A floresta está sangrando. Garimpeiros ilegais envenenam os rios e derrubam as matas, e os seres que a protegem estão sendo caçados. Um jovem guerreiro indígena se levanta para lutar ao lado deles.',
              'The forest is bleeding. Illegal miners poison the rivers and tear down the woods, and the beings who protect it are being hunted. A young Indigenous warrior rises to fight beside them.'),
      blocks:['lendas'], shots:[], video:null,
      next:[B('Abertura da beta','Beta opening'),B('Lançamento','Release')],
      reqs:REQ_MID,
      controls:[[C.move,'W A S D'],[B('Interagir','Interact'),'E'],[C.confirm,B('Enter / Espaço','Enter / Space')],[C.menu,'Esc']]
    },
    'trivia': {
      short:'Trivia', art:'quiz', genre:B('Perguntas e respostas','Quiz'), stage:4,
      stageLabel:B('Lançado · Gratuito','Released · Free'), price:B('Gratuito','Free'),
      itch:'https://erickotico-dev.itch.io/trivia-game', itchLabel:B('Jogar grátis no itch.io','Play free on itch.io'),
      intro:B('Escolha seu tema, enfrente o relógio e prove o quanto você sabe.','Pick your subject, beat the clock and prove what you know.'),
      blocks:['temas'], shots:[], video:null,
      next:[],
      reqs:{ min:[[R.os,'Windows 10 64-bit'],[R.cpu,'Intel Core i3 / AMD Ryzen 3'],[R.ram,'4 GB'],[R.gpu,B('Vídeo integrado (Intel UHD 620)','Integrated graphics (Intel UHD 620)')],[R.disk,'2 GB']],
             rec:[[R.os,'Windows 10/11 64-bit'],[R.cpu,'Intel Core i5 / AMD Ryzen 5'],[R.ram,'8 GB'],[R.gpu,B('GTX 750 Ti ou superior','GTX 750 Ti or better')],[R.disk,'2 GB']] },
      controls:[[B('Escolher tema e resposta','Pick subject and answer'),'Mouse'],[C.confirm,C.click],[C.menu,'Esc']]
    }
  };

  /* ---------- MONTAGEM DAS PÁGINAS DOS JOGOS ---------- */
  const sec = (rune, eyebrow, title) => `<div class="sec-head"><span class="rune" aria-hidden="true">${rune}</span><span class="hud">${tx(eyebrow)}</span><h2>${tx(title)}</h2></div>`;
  const wrapSec = (inner, cls = '') => `<section class="${cls}"><div class="wrap">${inner}</div></section>`;
  const tiles = list => list.map(([g, n, t]) => `<article class="tile plate"><span class="rune" aria-hidden="true">${g}</span><h3>${tx(n)}</h3><p>${tx(t)}</p></article>`).join('');
  const banner = (t, b) => `<div class="banner plate"><span>${tx(t)}</span><b>${tx(b)}</b></div>`;

  const BLOCKS = {
    reinos: () => wrapSec(`${sec('ᚱ', B('Os Reinos · Escolha um reino','The Kingdoms · Choose a kingdom'), B('Cinco reinos, um inimigo','Five kingdoms, one enemy'))}
      <div class="realm-pick"><label class="hud" for="realm">${tx(B('Reino','Kingdom'))}</label>
        <select id="realm">${REALMS.map(r => `<option value="${r.id}">${r.name}${r.enemy ? tx(B(' · reino inimigo',' · enemy kingdom')) : ''}</option>`).join('')}</select></div>
      <article class="realm plate" id="realm-panel" aria-live="polite"></article>`),
    herois: () => wrapSec(`${sec('ᛟ', B('Heróis da Lenda · Os que uniram os reinos','Heroes of Legend · Those who united the kingdoms'), B('Cinco nomes que viraram lenda','Five names that became legend'))}
      <div class="heroes">${HEROES.map(([n, c, k, g, t]) => `<article class="hero-card plate"><span class="rune" aria-hidden="true">${g}</span><h3>${n}</h3><span class="hud">${tx(c)} · ${k}</span><p>${tx(t)}</p></article>`).join('')}</div>`),
    renascer: () => wrapSec(`<div class="rebirth plate">
        <div><span class="hud" style="color:var(--rune)">${tx(B('A mecânica do Renascer','The Rebirth mechanic'))}</span><h2>${tx(B('Morra. Renasça. Continue a lenda.','Die. Be reborn. Carry on the legend.'))}</h2></div>
        <ol class="rebirth-steps">${[
          ['I', B('A queda','The fall'), B('A morte cobra tudo: nível, inventário e conquistas ficam para trás.','Death takes everything: level, inventory and achievements are left behind.')],
          ['II', B('Os anos passam','The years go by'), B('O mundo não espera por você. Anos se passam até o seu retorno.',"The world doesn't wait for you. Years pass before your return.")],
          ['III', B('Uma nova vida','A new life'), B('Volte do zero, com a mesma classe ou com um novo caminho.','Start over from zero, with the same class or a new path.')]
        ].map(([n, h, t]) => `<li><span class="num">${n}</span><h3>${tx(h)}</h3><p>${tx(t)}</p></li>`).join('')}</ol></div>`),
    classes: () => wrapSec(`${sec('ᚷ', B('Classes · Escolha seu caminho','Classes · Choose your path'), B('Seis caminhos de combate','Six paths of combat'))}
      <div class="class-grid">${CLASSES.map(([n, w, on]) => `<div class="class-card plate"><h3>${tx(n)}<small>${tx(w)}</small></h3><span class="state hud ${on ? '' : 'forge'}">${tx(on ? B('Jogável','Playable') : B('Na forja','In the forge'))}</span></div>`).join('')}</div>`),
    lendas: () => wrapSec(`${sec('ᛒ', B('A história · O chamado da mata','The story · The call of the forest'), B('Quem defende a floresta','Who defends the forest'))}
      <div class="tiles">${tiles([
        ['ᛉ', B('O herói','The hero'), B('Um jovem guerreiro indígena, nascido entre os rios, que ouve o chamado da floresta ferida.','A young Indigenous warrior, born among the rivers, who hears the call of the wounded forest.')],
        ['ᛟ', B('Os seres da mata','The forest beings'), B('Guardiões mitológicos que protegem as matas há séculos e agora precisam de um aliado.','Mythical guardians who have protected the woods for centuries and now need an ally.')],
        ['ᚺ', B('A ameaça','The threat'), B('Garimpeiros ilegais que envenenam os rios e abrem feridas na terra em busca de ouro.','Illegal miners who poison the rivers and tear wounds into the land in search of gold.')]
      ])}</div>
      ${banner(B('Batalhas no estilo JRPG, exploração livre e uma aventura pela floresta.','JRPG-style battles, free exploration and an adventure through the forest.'), B('Alfa disponível','Alpha available'))}`),
    temas: () => wrapSec(`${sec('ᚨ', B('Temas · Escolha o seu desafio','Subjects · Choose your challenge'), B('Cinco temas para dominar','Five subjects to master'))}
      <div class="tiles five">${tiles([
        ['ᚨ', B('Português','Portuguese'), B('Gramática, ortografia e interpretação.','Grammar, spelling and reading comprehension.')],
        ['ᛗ', B('Matemática','Math'), B('Contas, lógica e raciocínio.','Arithmetic, logic and reasoning.')],
        ['ᛞ', B('História','History'), B('Povos, guerras e grandes acontecimentos.','Peoples, wars and great events.')],
        ['ᛟ', B('Conhecimentos Gerais','General Knowledge'), B('Um pouco de tudo para quem sabe muito.','A little of everything for those who know a lot.')],
        ['ᛒ', B('Biologia','Biology'), B('A vida em todas as suas formas.','Life in all its forms.')]
      ])}</div>
      ${banner(B('Single player. Escolha o tema e jogue no seu ritmo.','Single player. Pick your subject and play at your own pace.'), B('Gratuito','Free'))}`),
    mt: () => wrapSec(`${sec('ᛏ', B('O jogo · A prancheta é sua','The game · The board is yours'), B('Do vestiário ao apito final','From the locker room to the final whistle'))}
      <div class="tiles">${tiles([
        ['ᛏ', B('Escalação e formação','Lineup and formation'), B('Escolha os titulares e a formação ideal para cada adversário.','Pick your starters and the ideal formation for each opponent.')],
        ['ᚱ', B('Táticas na prancheta','Tactics on the board'), B('Desenhe as jogadas e ajuste o time durante a partida.','Draw the plays and adjust the team during the match.')],
        ['ᛞ', B('Rodada a rodada','Match by match'), B('Conduza o clube pela temporada e responda pelos resultados.','Lead the club through the season and answer for the results.')]
      ])}</div>
      ${banner(B('O jogo já está em campo nos nossos testes internos.','The game is already on the pitch in our internal tests.'), UI.firstBuild)}`)
  };

  function mountArt(el, kind) {
    if (kind === 'arena') { const c = document.createElement('canvas'); el.appendChild(c); drawArena(c); return; }
    const src = document.getElementById(kind);
    const svg = src.cloneNode(false); svg.removeAttribute('id');
    svg.innerHTML = src.innerHTML.replace(/id="([\w-]+)"/g, 'id="$1-gv"').replace(/url\(#([\w-]+)\)/g, 'url(#$1-gv)');
    el.appendChild(svg);
  }

  function renderRealm(id) {
    const r = REALMS.find(x => x.id === id) || REALMS[0];
    const panel = document.getElementById('realm-panel'); if (!panel) return;
    panel.style.setProperty('--realm', r.color);
    panel.innerHTML = `
      <div class="realm-head"><div class="realm-glyph rune" aria-hidden="true"><span>${r.glyph}</span></div>
        <div><span class="hud">${tx(r.enemy ? B('Reino inimigo','Enemy kingdom') : B('Reino aliado','Allied kingdom'))}</span><h3>${r.name}</h3><p class="realm-sub">${tx(r.title)}</p></div></div>
      <dl class="realm-facts">${r.facts.map(([k, v]) => `<div><dt class="hud">${tx(k)}</dt><dd>${tx(v)}</dd></div>`).join('')}</dl>
      <p class="realm-sum">${tx(r.summary)}</p>
      <details><summary class="hud">${tx(B('Ler a história completa','Read the full story'))}</summary>
        <div class="realm-full">${r.full.map(([h, t]) => `<h4>${tx(h)}</h4>${p(tx(t))}`).join('')}</div></details>`;
  }

  let currentRealm = 'thalor';
  function renderGame(slug) {
    const g = GAMES[slug], view = document.getElementById('game-view');
    const shots = Array.from({length: Math.max(6, g.shots.length)}, (_, i) => g.shots[i]
      ? `<figure class="slot filled"><img src="${g.shots[i]}" alt="${tx(UI.shotAlt)} ${g.short}"></figure>`
      : `<figure class="slot"><span class="rune" aria-hidden="true">ᛜ</span><figcaption class="hud">${tx(UI.shotSoon)}</figcaption></figure>`).join('');
    const video = g.video
      ? (CONFIG.EMBED_YOUTUBE
          ? `<div class="video embed plate"><iframe src="https://www.youtube-nocookie.com/embed/${g.video.id}" title="${tx(g.video.label)}: ${tx(g.video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" loading="lazy" allowfullscreen></iframe></div>`
          : `<a class="video plate" href="https://youtu.be/${g.video.id}" target="_blank" rel="noopener"><span class="playbtn" aria-hidden="true"></span><span class="hud">${tx(g.video.label)}</span><strong>${tx(g.video.title)}</strong><span class="hud" style="color:var(--ash)">${tx(UI.watchYT)}</span></a>`)
      : `<div class="video soon plate"><span class="playbtn" aria-hidden="true"></span><span class="hud">${tx(UI.video)}</span><strong>${tx(UI.soon)}</strong></div>`;
    const others = Object.entries(GAMES).filter(([k]) => k !== slug)
      .map(([k, o]) => `<a class="other plate" href="#${k}"><span class="hud">${tx(o.stageLabel)}</span><b>${o.short}</b><span>${tx(o.genre)}</span></a>`).join('');

    view.innerHTML = `
      <section class="gv-hero"><div class="wrap gv-grid">
        <div class="gv-copy">
          <a class="back hud" href="#jogos">${tx(UI.backGrim)}</a>
          <span class="tag hud">${tx(g.stageLabel)}</span>
          <h1 class="gv-title">${g.short}</h1>
          <p class="gv-intro">${tx(g.intro)}</p>
          <dl class="facts">
            <div><dt class="hud">${tx(UI.genre)}</dt><dd>${tx(g.genre)}</dd></div>
            <div><dt class="hud">${tx(UI.stage)}</dt><dd>${tx(STAGES[g.stage])}</dd></div>
            <div><dt class="hud">${tx(UI.engine)}</dt><dd>${tx(UI.madeUE)}</dd></div>
            <div><dt class="hud">${tx(UI.price)}</dt><dd>${tx(g.price)}</dd></div>
          </dl>
          <div class="cta">
            ${g.itch ? `<a class="btn" href="${g.itch}" target="_blank" rel="noopener">${tx(g.itchLabel)}</a>` : `<span class="btn off">${tx(UI.firstBuild)}</span>`}
            ${g.guide ? `<a class="btn ghost" href="${g.guide}" target="_blank" rel="noopener">${tx(UI.guide)}</a>` : ''}
            ${g.stage < 4 ? `<a class="btn ghost" href="#testadores">${tx(UI.beTester)}</a>` : ''}
          </div>
        </div>
        <div class="gv-cover plate" id="gv-cover" aria-hidden="true"></div>
      </div></section>
      ${g.blocks.map(b => BLOCKS[b]()).join('')}
      ${wrapSec(`${sec('ᛈ', UI.gallery, UI.galleryT)}<div class="media">${video}${shots}</div>`)}
      ${wrapSec(`${sec('ᛃ', UI.journey, UI.journeyT)}
        <ol class="journey">${STAGES.map((s, i) => `<li class="${i < g.stage ? 'done' : i === g.stage ? 'now' : ''}"><span class="dot" aria-hidden="true"></span><span class="hud">${tx(s)}</span>${i === g.stage ? `<b class="hud">${tx(UI.current)}</b>` : ''}</li>`).join('')}</ol>
        <div class="next plate"><h3>${tx(g.next.length ? UI.next : UI.now)}</h3>
          ${g.next.length ? `<ul>${g.next.map(n => `<li>${tx(n)}</li>`).join('')}</ul>` : `<p style="color:var(--ash)">${tx(UI.done)}</p>`}</div>`)}
      ${wrapSec(`${sec('ᛊ', UI.specs, UI.specsT)}
        <div class="specs">
          <div class="spec plate"><div class="spec-head"><h3>${tx(UI.req)}</h3><span class="hud est">${tx(UI.est)}</span></div>
            <div class="spec-table"><table><thead><tr><th scope="col"></th><th scope="col">${tx(UI.min)}</th><th scope="col">${tx(UI.rec)}</th></tr></thead>
            <tbody>${g.reqs.min.map(([k, v], i) => `<tr><th scope="row">${tx(k)}</th><td>${tx(v)}</td><td>${tx(g.reqs.rec[i][1])}</td></tr>`).join('')}</tbody></table></div></div>
          <div class="spec plate"><div class="spec-head"><h3>${tx(UI.controls)}</h3><span class="hud est">${tx(UI.est)}</span></div>
            <ul class="keys">${g.controls.map(([a, k]) => `<li><span>${tx(a)}</span><kbd>${tx(k)}</kbd></li>`).join('')}</ul></div>
        </div>`)}
      ${wrapSec(`${sec('ᛗ', UI.others, UI.othersT)}<div class="others">${others}</div>`)}`;

    mountArt(document.getElementById('gv-cover'), g.art);
    const sel = document.getElementById('realm');
    if (sel) {
      sel.value = currentRealm; renderRealm(sel.value);
      sel.addEventListener('change', () => { currentRealm = sel.value; renderRealm(sel.value); });
    }
  }

  /* =====================================================================
     DIÁRIO DA FORJA
     Atualizações: copiadas do updates.json do site do Empire e agrupadas por mês.
     ===================================================================== */
  /* Formato: versão, data, [título pt, en], [[mudança pt, en], ...] */
  let EMPIRE_UPDATES = [
    ['0.0.1','2026-01-22',['Início do projeto','Project start'],[['Idealização do projeto','Project concept'],['Concept dos personagens','Character concepts']]],
    ['0.0.2','2026-02-27',['Sistema','System'],[['Implementação do sistema de RPG','RPG system implementation'],['Criação dos atributos','Attributes created']]],
    ['0.0.3','2026-03-06',['Progressão de nível','Level progression'],[['Sistema de progressão de nível','Level progression system'],['Habilidades base','Base skills']]],
    ['0.0.4','2026-03-14',['Inimigo','Enemy'],[['Protótipo da IA inimiga','Enemy AI prototype'],['Possíveis rotas inimigas','Possible enemy routes'],['Ataques básicos','Basic attacks']]],
    ['0.0.5','2026-03-24',['Escolha de classe','Class selection'],[['Escolhas entre classes e subclasses','Choice between classes and subclasses'],['Atributos personalizados de acordo com a classe','Custom attributes per class']]],
    ['0.0.6','2026-03-28',['Bestiário','Bestiary'],[['Criação do bestiário','Bestiary created'],['Atributos dos monstros','Monster attributes'],['Correção de atributo que não permanecia no personagem','Fixed an attribute that did not stay on the character']]],
    ['0.0.7','2026-04-02',['IA inimiga','Enemy AI'],[['Novos comportamentos dos inimigos','New enemy behaviors'],['Novas árvores de comportamento','New behavior trees']]],
    ['0.0.8','2026-04-03',['Mapa','Map'],[['Criação da blocagem do primeiro mapa','Blockout of the first map'],['Blocagem da vila inicial','Starting village blockout'],['Blocagem da floresta','Forest blockout']]],
    ['0.0.9','2026-04-10',['Correção de atributos','Attribute fixes'],[['Ajuste dos atributos das classes e subclasses','Adjusted class and subclass attributes'],['Correção do problema de subida de nível','Fixed the level-up issue']]],
    ['0.0.10','2026-04-12',['Atributos','Attributes'],[['Regeneração de vida e mana após o uso','Health and mana regeneration after use'],['Distribuição de pontos','Point distribution']]],
    ['0.0.11','2026-04-14',['Penalidade','Penalty'],[['Penalidade de atributos após a morte','Attribute penalty after death'],['Correção do renascimento','Rebirth fix'],['Debuff após a morte','Debuff after death']]],
    ['0.0.12','2026-04-22',['Menu','Menu'],[['Adição do widget de menu','Added the menu widget'],['Adição do widget de configurações','Added the settings widget']]],
    ['0.0.13','2026-04-23',['Correção de bug nos atributos','Attribute bug fix'],[['Correção do debuff de renascimento','Fixed the rebirth debuff']]],
    ['0.0.14','2026-04-27',['Inimigos','Enemies'],[['Adição do primeiro inimigo','Added the first enemy'],['Comportamento do primeiro inimigo','First enemy behavior'],['Primeiros ataques dos inimigos','First enemy attacks']]],
    ['0.0.15','2026-04-28',['Correções no bestiário','Bestiary fixes'],[['Correção da interação com o bestiário','Fixed bestiary interaction'],['Melhorias no bestiário','Bestiary improvements']]],
    ['0.0.16','2026-05-04',['Animações','Animations'],[['Animações de ataque do personagem com a espada','Character sword attack animations'],['Correção: equipar arma (espada grande)','Fix: equipping the greatsword']]],
    ['0.0.17','2026-05-11',['Atributos do primeiro inimigo','First enemy attributes'],[['Adição dos valores dos atributos dos monstros','Added monster attribute values'],['Variação de atributos e nível para o mesmo monstro','Attribute and level variation for the same monster']]],
    ['0.0.18','2026-05-24',['Correção de dano e inventário','Damage and inventory fixes'],[['Ajuste do dano do ataque básico','Adjusted basic attack damage'],['Ajuste do tamanho do inventário','Adjusted inventory size'],['Aumento de velocidade do lobo','Increased wolf speed'],['Habilidade do jogador aprimorada','Improved player skill'],['Distância de ataque do lobo melhorada','Improved wolf attack range']]],
    ['0.0.19','2026-06-14',['Atualização e melhorias','Update and improvements'],[['Adição de novas animações','Added new animations'],['Motion Warp','Motion Warping'],['Lock On','Lock On'],['Novas armas','New weapons'],['Debuffs','Debuffs']]],
    ['0.0.20','2026-06-29',['Melhorias','Improvements'],[['Aprimoramento do Lock On','Lock On improvements'],['Mapa da vila','Village map']]],
    ['0.0.21','2026-07-27',['Drop e itens','Drops and items'],[['Criação do drop de itens quando o monstro morre','Item drops when a monster dies'],['Adição das miniaturas iniciais dos itens','Added the first item thumbnails']]],
    ['0.0.22','2026-08-31',['Habilidades','Skills'],[['Criação de 3 habilidades da espada grande','Created 3 greatsword skills'],['Criação de 3 habilidades do arco','Created 3 bow skills'],['Criação de 3 habilidades da lança','Created 3 spear skills']]]
  ];

  /* Título e resumo de cada mês (tom da forja). Mês sem texto aqui ganha um título automático. */
  const MONTH_COPY = {
    '2026-01':{t:B('O primeiro golpe na bigorna','The first strike on the anvil'),s:B('Nasce Empire of Rebirth & Ruins: a ideia ganha forma e os primeiros heróis saem do papel.','Empire of Rebirth & Ruins is born: the idea takes shape and the first heroes leave the page.')},
    '2026-02':{t:B('As runas do sistema','Runes of the system'),s:B('O coração do RPG começa a bater: sistema e atributos gravados na pedra.','The heart of the RPG starts beating: system and attributes carved in stone.')},
    '2026-03':{t:B('Março na forja: inimigos e caminhos','March at the forge: foes and paths'),s:B('Progressão de nível, a primeira IA inimiga, a escolha de classe e o nascimento do bestiário.','Level progression, the first enemy AI, class selection and the birth of the bestiary.')},
    '2026-04':{t:B('Abril na forja: o mundo ganha chão','April at the forge: the world finds its ground'),s:B('Os primeiros mapas, o primeiro inimigo de verdade, novos menus e o Renascer começando a cobrar seu preço.','The first maps, the first real enemy, new menus and Rebirth starting to take its toll.')},
    '2026-05':{t:B('Maio na forja: o peso da lâmina','May at the forge: the weight of the blade'),s:B('Animações de espada, monstros com níveis variados e um lobo bem mais perigoso.','Sword animations, monsters with varied levels and a far more dangerous wolf.')},
    '2026-06':{t:B('Junho na forja: Lock On, Motion Warp e novas armas','June at the forge: Lock On, Motion Warping and new weapons'),s:B('O combate fica mais preciso, e a vila ganha seu mapa.','Combat gets sharper, and the village gets its map.')},
    '2026-07':{t:B('Julho na forja: o que os monstros deixam para trás','July at the forge: what monsters leave behind'),s:B('Monstros agora derrubam itens, e o inventário ganha suas primeiras miniaturas.','Monsters now drop items, and the inventory gets its first thumbnails.')},
    '2026-08':{t:B('Agosto na forja: nove novas habilidades','August at the forge: nine new skills'),s:B('Espada grande, arco e lança ganham três habilidades cada.','Greatsword, bow and spear gain three skills each.')}
  };

  /* Notícias. date: 'AAAA-MM-DD' ou só 'AAAA-MM' quando o dia não é conhecido. image: caminho opcional. */
  const NEWS = [
    { id:'alfa-empire', date:'2026-10-29', game:'empire-of-rebirth', image:null,
      t:B('A alfa de Empire of Rebirth & Ruins está aberta','The Empire of Rebirth & Ruins alpha is open'),
      s:B('Os portões se abriram: a primeira alfa já pode ser jogada no itch.io.','The gates are open: the first alpha is now playable on itch.io.'),
      body:B(['Guerreiro, Lanceiro e Arqueiro já empunham suas armas. Entre na arena, quebre a guarda do inimigo e conte para a gente o que achou.','Esta é uma alfa: muita coisa ainda está na bigorna, e cada opinião ajuda a forjar o jogo.'],
             ["Warrior, Lancer and Archer are ready to fight. Step into the arena, break the enemy's guard and tell us what you think.",'This is an alpha: a lot is still on the anvil, and every bit of feedback helps forge the game.']),
      cta:{href:'https://erickotico-dev.itch.io/empire-of-rebirth',label:B('Jogar a alfa no itch.io','Play the alpha on itch.io')} },
    { id:'alfa-lendas', date:'2025-11', game:'lendas-da-resistencia', image:null,
      t:B('Lendas da Resistência entra em alfa','Lendas da Resistência enters alpha'),
      s:B('A floresta pede socorro: a alfa chega ao itch.io.','The forest calls for help: the alpha arrives on itch.io.'),
      body:B(['Garimpeiros avançam sobre os rios, e os seres da mata precisam de um aliado. A alfa de Lendas da Resistência já pode ser jogada.'],
             ["Illegal miners are closing in on the rivers, and the forest's guardians need an ally. The Lendas da Resistência alpha is now playable."]),
      cta:{href:'https://erickotico-dev.itch.io/lendas-da-resistencia',label:B('Jogar a alfa no itch.io','Play the alpha on itch.io')} },
    { id:'lancamento-trivia', date:'2025-02', game:'trivia', image:null,
      t:B('Trivia chega ao itch.io, de graça','Trivia arrives on itch.io, for free'),
      s:B('Cinco temas, um relógio e nenhuma desculpa.','Five subjects, one clock and no excuses.'),
      body:B(['Português, Matemática, História, Conhecimentos Gerais e Biologia: escolha seu tema e prove o quanto você sabe. Trivia está disponível gratuitamente.'],
             ['Portuguese, Math, History, General Knowledge and Biology: pick your subject and prove what you know. Trivia is available for free.']),
      cta:{href:'https://erickotico-dev.itch.io/trivia-game',label:B('Jogar grátis no itch.io','Play free on itch.io')} }
  ];

  const MONTHS = {pt:['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],
                  en:['January','February','March','April','May','June','July','August','September','October','November','December']};
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const fmtDate = d => {
    const [y, m, day] = d.split('-').map(Number), mn = MONTHS[LANG][m - 1];
    if (!day) return LANG === 'pt' ? `${cap(mn)} de ${y}` : `${mn} ${y}`;
    return LANG === 'pt' ? `${day} de ${mn} de ${y}` : `${mn} ${day}, ${y}`;
  };
  const sortKey = d => d.length === 7 ? d + '-15' : d;

  let DIARY = [];
  function buildDiary() {
    const byMonth = {};
    EMPIRE_UPDATES.forEach(u => (byMonth[u[1].slice(0, 7)] ||= []).push(u));
    const updates = Object.entries(byMonth).map(([ym, list]) => {
      list.sort((a, b) => a[1].localeCompare(b[1]));
      const copy = MONTH_COPY[ym], m = Number(ym.split('-')[1]);
      const auto = B(`${cap(MONTHS.pt[m-1])} na forja`, `${MONTHS.en[m-1]} at the forge`);
      return { id: ym, type: 'update', game: 'empire-of-rebirth', date: list[list.length - 1][1], image: null,
        t: copy ? copy.t : auto,
        s: copy ? copy.s : B(list.flatMap(u => u[3].map(c => c[0])).slice(0, 3).join(', ') + '.', list.flatMap(u => u[3].map(c => c[1])).slice(0, 3).join(', ') + '.'),
        versions: list };
    });
    DIARY = [...updates, ...NEWS.map(n => ({ ...n, type: 'news' }))].sort((a, b) => sortKey(b.date).localeCompare(sortKey(a.date)));
  }
  buildDiary();

  const gameName = slug => (GAMES[slug] ? GAMES[slug].short : slug);
  const postCard = d => `
    <a class="post-card plate" href="#diario-${d.id}">
      <div class="post-meta hud"><span class="badge ${d.type === 'news' ? 'news' : ''}">${tx(UI[d.type])}</span><span>${fmtDate(d.date)}</span></div>
      <h3>${tx(d.t)}</h3>
      <p>${tx(d.s)}</p>
      <div class="post-foot hud"><span>${gameName(d.game)}${d.versions ? ` · ${d.versions.length} ${tx(d.versions.length > 1 ? UI.versions : UI.version)}` : ''}</span><span class="more">${tx(UI.read)}</span></div>
    </a>`;

  function renderLatest() {
    const el = document.getElementById('diary-latest');
    if (el) el.innerHTML = DIARY.slice(0, 3).map(postCard).join('');
  }

  const diaryFilter = { game: 'all', type: 'all' };
  function renderDiary() {
    const games = ['all', ...new Set(DIARY.map(d => d.game))];
    const view = document.getElementById('game-view');
    const chip = (group, val, label) => `<button class="chip" type="button" data-group="${group}" data-val="${val}" aria-pressed="${diaryFilter[group] === val}">${label}</button>`;
    view.innerHTML = wrapSec(`${sec('ᛞ', B('Diário da Forja · Atualizações e notícias','Forge Journal · Updates and news'), B('Tudo o que sai da bigorna','Everything off the anvil'))}
      <div class="diary-tools">
        <div class="chips" role="group" aria-label="${tx(UI.game)}"><span class="hud">${tx(UI.game)}</span>${games.map(g => chip('game', g, g === 'all' ? tx(UI.all) : gameName(g))).join('')}</div>
        <div class="chips" role="group" aria-label="${tx(UI.type)}"><span class="hud">${tx(UI.type)}</span>${chip('type','all',tx(UI.all))}${chip('type','update',tx(UI.updates))}${chip('type','news',tx(UI.newsP))}</div>
      </div>
      <div class="post-grid" id="diary-list"></div>`);
    const draw = () => {
      const list = DIARY.filter(d => (diaryFilter.game === 'all' || d.game === diaryFilter.game) && (diaryFilter.type === 'all' || d.type === diaryFilter.type));
      document.getElementById('diary-list').innerHTML = list.length ? list.map(postCard).join('') : `<p class="diary-empty" style="grid-column:1/-1">${tx(UI.empty)}</p>`;
      view.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', diaryFilter[c.dataset.group] === c.dataset.val));
    };
    view.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => { diaryFilter[c.dataset.group] = c.dataset.val; draw(); }));
    draw();
  }

  function renderPost(id) {
    const i = DIARY.findIndex(d => d.id === id), d = DIARY[i], view = document.getElementById('game-view');
    const link = (CONFIG.SITE_URL || location.href.split('#')[0]) + '#diario-' + d.id;
    const newer = DIARY[i - 1], older = DIARY[i + 1], li = LANG === 'pt' ? 0 : 1;
    view.innerHTML = wrapSec(`<article class="post">
      <a class="back hud" href="#diario">${tx(UI.back)}</a>
      <div class="post-meta hud"><span class="badge ${d.type === 'news' ? 'news' : ''}">${tx(UI[d.type])}</span><span>${fmtDate(d.date)}</span><span>${gameName(d.game)}</span></div>
      <h1 class="post-title">${tx(d.t)}</h1>
      <p class="post-lede">${tx(d.s)}</p>
      ${d.image ? `<figure class="post-img plate" style="margin:0"><img src="${d.image}" alt=""></figure>` : ''}
      ${d.versions ? `<div class="versions">${d.versions.slice().reverse().map(([v, date, t, ch]) => `
          <section class="version" style="padding-block:18px"><h3>v${v} · ${t[li]} <span class="hud">${fmtDate(date)}</span></h3>
          <ul>${ch.map(c => `<li>${c[li]}</li>`).join('')}</ul></section>`).join('')}</div>` : ''}
      ${d.body ? `<div class="post-body">${p(tx(d.body))}</div>` : ''}
      ${d.cta ? `<div class="cta"><a class="btn" href="${d.cta.href}" target="_blank" rel="noopener">${tx(d.cta.label)}</a></div>` : ''}
      <div class="share plate"><span class="hud">${tx(UI.share)}</span>
        <label class="hud" for="share-link" style="position:absolute;left:-9999px">Link</label>
        <input id="share-link" readonly value="${link}">
        <button class="btn sm" type="button" id="copy-link">${tx(UI.copy)}</button>
        <span class="status hud" id="copy-status" role="status" style="flex-basis:100%"></span></div>
      <nav class="post-nav" aria-label="${tx(UI.diaryTitle)}">
        ${newer ? `<a class="plate" href="#diario-${newer.id}"><span class="hud">← ${tx(UI.newer)}</span><b>${tx(newer.t)}</b></a>` : ''}
        ${older ? `<a class="plate nx" href="#diario-${older.id}"><span class="hud">${tx(UI.older)} →</span><b>${tx(older.t)}</b></a>` : ''}
      </nav>
    </article>`);
    const input = document.getElementById('share-link'), st = document.getElementById('copy-status');
    document.getElementById('copy-link').addEventListener('click', () => {
      const fail = () => { input.focus(); input.select(); st.textContent = tx(UI.copyFail); };
      try { navigator.clipboard.writeText(link).then(() => { st.textContent = tx(UI.copied); }, fail); } catch (e) { fail(); }
    });
  }

  /* =====================================================================
     COMUNIDADE: Discord e testadores
     ===================================================================== */
  /* Mesa redonda animada do bloco do Discord */
  (function hall() {
    const svg = document.getElementById('hall'); if (!svg) return;
    let o = `<defs><radialGradient id="hallglow"><stop offset="0" stop-color="#62e2ff" stop-opacity=".35"/><stop offset="1" stop-color="#62e2ff" stop-opacity="0"/></radialGradient></defs>
      <circle cx="160" cy="160" r="150" fill="url(#hallglow)"/>
      <g class="table-ring"><circle cx="160" cy="160" r="96" fill="none" stroke="#62e2ff" stroke-opacity=".5" stroke-dasharray="3 7"/></g>
      <circle cx="160" cy="160" r="80" fill="#0e111a" stroke="#62e2ff" stroke-opacity=".8"/>
      <circle cx="160" cy="160" r="62" fill="none" stroke="#232a3b"/>
      <text x="160" y="176" text-anchor="middle" font-family="Noto Sans Runic, serif" font-size="46" fill="#ff7a2f" style="filter:drop-shadow(0 0 10px #ff7a2f)">ᛗ</text>`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2, x = 160 + 112 * Math.cos(a), y = 160 + 112 * Math.sin(a), s = 7;
      o += `<polygon class="seat" points="${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}" fill="#07080d" stroke="#232a3b" stroke-width="1.5" style="animation-delay:${(i * 0.4).toFixed(1)}s"/>`;
    }
    svg.innerHTML = o;
  })();

  function updateDiscord() {
    const b = document.getElementById('discord-btn'); if (!b) return;
    if (CONFIG.DISCORD_URL) {
      b.href = CONFIG.DISCORD_URL; b.target = '_blank'; b.rel = 'noopener'; b.classList.remove('off'); b.removeAttribute('aria-disabled');
      b.textContent = tx(UI.discordJoin);
    } else {
      b.removeAttribute('href'); b.classList.add('off'); b.setAttribute('aria-disabled', 'true');
      b.textContent = tx(UI.discordSoon);
    }
  }

  /* =====================================================================
     FORMULÁRIOS
     O envio real usa o Web3Forms (gratuito) e chega no e-mail cadastrado lá.
     A chave fica em js/config.js (FORM_KEY).
     Sem chave, os formulários só validam e confirmam (modo demonstração).
     Proteções: campo-isca contra robôs, tempo mínimo de preenchimento,
     intervalo de 1 minuto entre envios e limite de tamanho dos campos.
     ===================================================================== */
  const FORM_KEY = String(CONFIG.FORM_KEY || '').trim();
  const FORM_API = 'https://api.web3forms.com/submit';
  const SEND_GAP = 60000;
  const DEMO_NOTE = B(' (Demonstração: o envio real liga quando a chave do formulário estiver no site.)', ' (Demo: real sending turns on once the form key is on the site.)');
  const okMail = v => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
  const okUrl = v => /^https?:\/\/[^\s<>"]+\.[^\s<>"]+$/i.test(v);
  const cleanLabel = el => { const c = el.cloneNode(true); c.querySelectorAll('.opt-tag, input').forEach(n => n.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };

  function collect(form) {
    const data = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.name === 'botcheck') return;
      const group = el.type === 'checkbox' && el.closest('.checks');
      if (group) {
        const k = cleanLabel(group.closest('.field').querySelector('span.hud'));
        if (el.checked) data[k] = (data[k] ? data[k] + ', ' : '') + cleanLabel(el.closest('label'));
        else if (!data[k]) data[k] = '';
        return;
      }
      const lb = el.id && form.querySelector(`label[for="${el.id}"]`);
      const k = lb ? cleanLabel(lb) : (el.name || el.id);
      if (el.type === 'checkbox') data[k] = el.checked ? 'Sim' : 'Não';
      else if (el.tagName === 'SELECT') data[k] = el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '';
      else data[k] = el.value.trim();
    });
    return data;
  }

  function sendForm(form, subject, msgOk) {
    const st = form.querySelector('.status'), btn = form.querySelector('button[type="submit"]');
    const say = (color, msg) => { st.style.color = color; st.textContent = msg; };
    // limite de tamanho em todos os campos
    form.querySelectorAll('input:not([type="checkbox"]), textarea').forEach(el => {
      if (!el.maxLength || el.maxLength < 0) el.maxLength = el.tagName === 'TEXTAREA' ? 4000 : el.type === 'email' ? 120 : el.type === 'url' ? 300 : 150;
    });
    // campo-isca: invisível para pessoas, robôs costumam preencher
    const hp = document.createElement('input');
    Object.assign(hp, { type: 'text', name: 'botcheck', tabIndex: -1, autocomplete: 'off' });
    hp.setAttribute('aria-hidden', 'true'); hp.className = 'hp';
    form.prepend(hp);
    const openedAt = Date.now();

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (btn.disabled) return;
      const need = form.querySelector('[data-need-one]');
      if (need && !need.querySelector('input:checked')) { say('var(--ember)', need.dataset.needOne); need.querySelector('input').focus(); return; }
      const bad = [...form.querySelectorAll('input, textarea')].find(el => el.name !== 'botcheck' && (
        el.type === 'checkbox' ? (el.required && !el.checked)
        : (el.required && !el.value.trim()) || (el.value.trim() && ((el.type === 'email' && !okMail(el.value.trim())) || (el.type === 'url' && !okUrl(el.value.trim()))))));
      if (bad) {
        say('var(--ember)', tx(bad.type === 'email' && bad.value.trim() ? UI.formMail
          : bad.type === 'url' && bad.value.trim() ? B('Confira o link: ele precisa começar com https://','Check the link: it needs to start with https://')
          : bad.type === 'checkbox' ? B('Marque a autorização para continuar.','Tick the consent box to continue.')
          : B('Preencha os campos obrigatórios.','Fill in the required fields.')));
        bad.focus(); return;
      }
      const done = () => { say('var(--rune)', tx(msgOk) + (FORM_KEY ? '' : tx(DEMO_NOTE))); form.reset(); };
      // robô: finge que deu certo e não envia nada
      if (hp.value || Date.now() - openedAt < 3000) { done(); return; }
      if (!FORM_KEY) { done(); return; }
      let last = 0;
      try { last = Number(localStorage.getItem('mf-last-send')) || 0; } catch (err) {}
      if (Date.now() - last < SEND_GAP) { say('var(--ember)', tx(B('Seu último corvo acabou de partir. Espere um minuto para enviar outro.','Your last raven just left. Wait a minute before sending another.'))); return; }

      const data = collect(form);
      const mailEl = form.querySelector('input[type="email"]');
      const payload = Object.assign({ access_key: FORM_KEY, subject: 'Myth Forge · ' + subject, from_name: 'Site Myth Forge Studios', botcheck: '' }, data);
      if (mailEl && mailEl.value.trim()) payload.replyto = mailEl.value.trim();
      btn.disabled = true; say('var(--ash)', tx(B('Enviando o corvo...','Sending the raven...')));
      fetch(FORM_API, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
        .then(r => r.json())
        .then(j => {
          if (!j || !j.success) throw new Error('fail');
          try { localStorage.setItem('mf-last-send', String(Date.now())); } catch (err) {}
          done();
        })
        .catch(() => say('var(--ember)', tx(B('O corvo não conseguiu voar. Tente de novo em instantes ou fale com a gente pelo Discord.',"The raven couldn't fly. Try again in a moment or reach us on Discord."))))
        .finally(() => { btn.disabled = false; });
    });
  }

  function renderTesters() {
    const view = document.getElementById('game-view');
    const testable = [
      ['empire-of-rebirth', B('Alfa aberta','Open alpha'), B('Combate, classes e o Renascer: tudo ainda na bigorna.','Combat, classes and Rebirth: all still on the anvil.'), true],
      ['lendas-da-resistencia', B('Alfa aberta','Open alpha'), B('Exploração e batalhas pela floresta.','Exploration and battles through the forest.'), true],
      ['master-tactician', B('Testes internos','Internal tests'), B('Inscreva-se para receber a primeira build.','Sign up to get the first build.'), false]
    ];
    const opt = B('(opcional)','(optional)');
    view.innerHTML = wrapSec(`${sec('ᛏ', B('Testadores · Jogue antes de todo mundo','Testers · Play before everyone else'), B('Ajude a temperar a lâmina','Help temper the blade'))}
      <p class="community-lede" style="margin-bottom:36px">${tx(B('Nossos jogos ficam melhores com quem joga. Testadores recebem as builds antes, falam direto com a equipe e veem suas sugestões virarem parte do jogo.','Our games get better with the people who play them. Testers get builds first, talk directly with the team and see their ideas become part of the game.'))}</p>
      <ol class="tester-steps">${[
        ['I', B('Inscreva-se','Sign up'), B('Preencha o formulário abaixo com os jogos que quer testar e o seu PC.','Fill in the form below with the games you want to test and your PC.')],
        ['II', B('Receba o convite','Get the invite'), B('Quando abrir uma rodada de testes, você recebe a build e as instruções.','When a test round opens, you get the build and the instructions.')],
        ['III', B('Jogue e conte tudo','Play and tell us everything'), B('Mande bugs e impressões pelo formulário de relatório ou pelo Discord.','Send bugs and impressions through the report form or on Discord.')]
      ].map(([n, h, t]) => `<li><span class="num">${n}</span><h3>${tx(h)}</h3><p>${tx(t)}</p></li>`).join('')}</ol>
      <div class="sec-head" style="margin-bottom:22px"><span class="rune" aria-hidden="true">ᛉ</span><span class="hud">${tx(B('Testes abertos','Open tests'))}</span><h2 style="font-size:clamp(1.5rem,3vw,2rem)">${tx(B('Onde você pode ajudar agora','Where you can help right now'))}</h2></div>
      <div class="open-tests">${testable.map(([k, s, t, open]) => `<article class="open-test plate ${open ? '' : 'internal'}"><span class="hud">${tx(s)}</span><b>${GAMES[k].short}</b><p>${tx(t)}</p>${open ? `<a href="${GAMES[k].itch}" target="_blank" rel="noopener">${tx(GAMES[k].itchLabel)} →</a>` : `<a href="#${k}">${tx(B('Ver página do jogo','View game page'))} →</a>`}</article>`).join('')}</div>
      <div class="tester-forms">
        <form class="plate" id="tester-form" novalidate>
          <h3>${tx(B('Inscrição de testador','Tester sign-up'))}</h3>
          <p class="form-sub">${tx(B('Leva um minuto. Avisamos quando abrir a próxima rodada.','Takes a minute. We will let you know when the next round opens.'))}</p>
          <div class="row2">
            <div class="field"><label for="t-name">${tx(B('Nome','Name'))}</label><input id="t-name" autocomplete="name" required></div>
            <div class="field"><label for="t-mail">E-mail</label><input id="t-mail" type="email" autocomplete="email" required></div>
          </div>
          <div class="field"><label for="t-discord">${tx(B('Usuário do Discord','Discord username'))} <span class="opt-tag">${tx(opt)}</span></label><input id="t-discord" placeholder="@heroi" autocomplete="off"></div>
          <div class="field"><span class="hud" style="color:var(--ash);letter-spacing:.18em;font-size:.7rem">${tx(B('Quero testar','I want to test'))}</span>
            <div class="checks">${testable.map(([k], i) => `<label for="t-g${i}"><input type="checkbox" id="t-g${i}" value="${k}">${GAMES[k].short}</label>`).join('')}</div></div>
          <div class="field"><label for="t-pc">${tx(B('Seu PC','Your PC'))} <span class="opt-tag">${tx(opt)}</span></label><input id="t-pc" placeholder="${tx(B('Ex.: Ryzen 5 3600 + GTX 1660, 16 GB','E.g. Ryzen 5 3600 + GTX 1660, 16 GB'))}"></div>
          <label class="consent" for="t-ok"><input type="checkbox" id="t-ok" required>${tx(B('Aceito receber e-mails sobre os testes da Myth Forge.','I agree to receive emails about Myth Forge playtests.'))}</label>
          <button class="btn" type="submit">${tx(B('Quero testar','Sign me up'))}</button>
          <p class="status hud" role="status"></p>
        </form>
        <form class="plate" id="bug-form" novalidate>
          <h3>${tx(B('Reportar um bug','Report a bug'))}</h3>
          <p class="form-sub">${tx(B('Encontrou algo quebrado? Conte o que aconteceu e como chegar lá.','Found something broken? Tell us what happened and how to get there.'))}</p>
          <div class="row2">
            <div class="field"><label for="b-game">${tx(UI.game)}</label><select id="b-game">${Object.keys(GAMES).map(k => `<option value="${k}">${GAMES[k].short}</option>`).join('')}</select></div>
            <div class="field"><label for="b-ver">${tx(B('Versão','Version'))} <span class="opt-tag">${tx(opt)}</span></label><input id="b-ver" placeholder="0.0.22"></div>
          </div>
          <div class="field"><label for="b-what">${tx(B('O que aconteceu?','What happened?'))}</label><textarea id="b-what" required placeholder="${tx(B('Ex.: o personagem atravessou a parede da vila.','E.g. the character walked through the village wall.'))}"></textarea></div>
          <div class="field"><label for="b-steps">${tx(B('Como repetir o problema','How to reproduce it'))} <span class="opt-tag">${tx(opt)}</span></label><textarea id="b-steps" style="min-height:90px"></textarea></div>
          <div class="field"><label for="b-mail">${tx(B('Seu e-mail','Your email'))} <span class="opt-tag">${tx(opt)}</span></label><input id="b-mail" type="email" autocomplete="email"></div>
          <button class="btn" type="submit">${tx(B('Enviar relatório','Send report'))}</button>
          <p class="status hud" role="status"></p>
        </form>
      </div>`);
    sendForm(document.getElementById('tester-form'), 'Inscrição de testador', B('Inscrição recebida. Bem-vindo à guilda dos testadores!', 'Sign-up received. Welcome to the testers guild!'));
    sendForm(document.getElementById('bug-form'), 'Relatório de bug', B('Relatório recebido. Obrigado por ajudar a afiar a lâmina!', 'Report received. Thanks for helping sharpen the blade!'));
  }

  /* =====================================================================
     GUILDA: página de vagas (#vagas)
     Para abrir ou fechar uma vaga, edite a lista JOBS abaixo.
     ===================================================================== */
  /* Vagas: uma lista só. projects = em quais jogos a vaga está aberta.
     Para abrir ou fechar uma vaga, edite a lista JOBS. */
  const P_E = 'empire-of-rebirth', P_L = 'lendas-da-resistencia', BOTH = [P_E, P_L];
  const JOBS = [
    { id:'vfx', projects:BOTH, name:'Technical VFX Artist', pt:'Programador de VFX', glyph:'ᛊ',
      what:B(['Criar os efeitos de golpes, magias, impactos e habilidades','Criar efeitos de ambiente como fogo, fumaça, partículas e água','Programar a lógica dos efeitos e ligá-los às habilidades e às animações','Otimizar os efeitos para o jogo rodar bem'],
             ['Create effects for strikes, spells, impacts and skills','Create environment effects such as fire, smoke, particles and water','Program effect logic and hook it into skills and animations','Optimize effects so the game runs well']),
      want:B(['Sistemas de partículas em motor de jogo','Shaders e materiais para efeitos','Lógica de programação para efeitos','Portfólio ou reel com efeitos em tempo real'],
             ['Particle systems in a game engine','Shaders and materials for effects','Programming logic for effects','A portfolio or reel with real-time effects']),
      bonus:B('Efeitos de magia estilizados e combate em jogos de ação.','Stylized magic effects and action game combat.') },
    { id:'creature', projects:BOTH, name:'Creature Artist', pt:'Artista de Criaturas', glyph:'ᚦ',
      what:B(['Esculpir criaturas, monstros e animais a partir dos conceitos','Criar a versão para o jogo, com topologia limpa para animação','Fazer UVs e texturas','Ajustar os modelos com o retorno da equipe e dos testes'],
             ['Sculpt creatures, monsters and animals from concepts','Build the in-game version with clean topology for animation','Create UVs and textures','Refine models with feedback from the team and playtests']),
      want:B(['Escultura orgânica e conhecimento de anatomia animal e fantástica','Topologia pensada para deformação e animação','Texturização PBR','Portfólio com criaturas ou personagens'],
             ['Organic sculpting and knowledge of animal and fantasy anatomy','Topology built for deformation and animation','PBR texturing','A portfolio with creatures or characters']),
      bonus:B('Experiência levando modelos para dentro de um motor de jogo.','Experience bringing models into a game engine.') },
    { id:'character', projects:BOTH, name:'Character Artist', pt:'Artista de Personagens', glyph:'ᛟ',
      what:B(['Modelar personagens a partir dos conceitos','Criar roupas, armaduras e acessórios','Preparar a versão para o jogo: topologia, UVs e texturas','Entregar os modelos prontos para o rig e a animação'],
             ['Model characters from concepts','Create clothing, armor and accessories','Prepare the in-game version: topology, UVs and textures','Deliver models ready for rigging and animation']),
      want:B(['Domínio de anatomia humana','Modelagem de roupas e armaduras','Topologia para animação e texturização PBR','Portfólio com personagens'],
             ['Strong human anatomy','Clothing and armor modeling','Topology for animation and PBR texturing','A portfolio with characters']),
      bonus:B('Criação de variações a partir de um personagem base.','Building variations from a base character.') },
    { id:'props', projects:BOTH, name:'Prop Artist', pt:'Artista de Props', glyph:'ᛏ',
      what:B(['Modelar armas, ferramentas e itens a partir dos conceitos','Criar mobília e objetos de cenário','Modelagem hard surface, do high poly ao low poly, com bake e texturas','Preparar variações e níveis de detalhe para o jogo'],
             ['Model weapons, tools and items from concepts','Create furniture and set dressing','Hard surface modeling, from high poly to low poly, with baking and textures','Prepare variations and levels of detail for the game']),
      want:B(['Modelagem hard surface','Bake high-to-low e texturas PBR','Noção de orçamento de polígonos','Portfólio com props ou armas'],
             ['Hard surface modeling','High-to-low baking and PBR textures','A sense of polygon budgets','A portfolio with props or weapons']),
      bonus:B('Armas e objetos de fantasia.','Fantasy weapons and objects.') },
    { id:'environment', projects:BOTH, name:'Environment Artist', pt:'Artista de Cenários', glyph:'ᛒ',
      what:B(['Construir os cenários a partir dos conceitos','Criar kits modulares de cenário','Produzir materiais e texturas de ambiente','Montar e iluminar as cenas junto com o level design'],
             ['Build environments from concepts','Create modular environment kits','Produce environment materials and textures','Assemble and light scenes alongside level design']),
      want:B(['Modelagem de cenários e kits modulares','Texturização e criação de materiais','Composição e iluminação de cenas','Portfólio com cenários'],
             ['Environment and modular kit modeling','Texturing and material creation','Scene composition and lighting','A portfolio with environments']),
      bonus:B('Natureza, ruínas e otimização de cenas.','Nature, ruins and scene optimization.') },
    { id:'texture', projects:BOTH, name:'Texture Artist', pt:'Artista de Texturas', glyph:'ᛚ',
      what:B(['Texturizar personagens, criaturas e cenários','Criar materiais como madeira, pedra, folhagem e água','Manter a coerência visual entre todos os modelos','Otimizar as texturas para o jogo'],
             ['Texture characters, creatures and environments','Create materials such as wood, stone, foliage and water','Keep visual consistency across all models','Optimize textures for the game']),
      want:B(['Texturização PBR','Criação de materiais','Noção de resolução e uso de memória','Portfólio com texturas'],
             ['PBR texturing','Material creation','A sense of resolution and memory use','A portfolio with textures']),
      bonus:B('Materiais orgânicos e naturais.','Organic and natural materials.') },
    { id:'animator', projects:[P_L], name:'3D Animator', pt:'Animador 3D', glyph:'ᚱ',
      what:B(['Animar personagens e criaturas: locomoção, ataques e reações','Criar as animações das batalhas','Animar ações de exploração e interação','Ajustar as animações dentro do jogo'],
             ['Animate characters and creatures: locomotion, attacks and reactions','Create battle animations','Animate exploration and interaction actions','Polish animations inside the game']),
      want:B(['Animação 3D de personagens e criaturas','Princípios de animação: peso, timing e antecipação','Ciclos e ações de combate','Reel com animações'],
             ['3D character and creature animation','Animation principles: weight, timing and anticipation','Cycles and combat actions','A reel with animations']),
      bonus:B('Animação de quadrúpedes e criaturas fantásticas.','Quadruped and fantasy creature animation.') },
    { id:'concept', projects:BOTH, name:'Concept Artist', pt:'Artista Conceitual', glyph:'ᛈ',
      what:B(['Criar conceitos de personagens, criaturas e cenários','Explorar a estética de cada mundo','Preparar folhas de referência para os modeladores','Pintar ilustrações de clima e ambientação'],
             ['Create concepts for characters, creatures and environments','Explore the look of each world','Prepare reference sheets for the modelers','Paint mood and atmosphere illustrations']),
      want:B(['Desenho e pintura digital','Design de personagens e de ambientes','Comunicação visual clara para a equipe 3D','Portfólio com concept art'],
             ['Drawing and digital painting','Character and environment design','Clear visual communication for the 3D team','A portfolio with concept art']),
      bonus:B('Conhecimento de mitologias e folclore.','Knowledge of mythology and folklore.') },
    { id:'illustrator', projects:BOTH, name:'2D Character Illustrator', pt:'Ilustrador 2D de Personagens', glyph:'ᛞ',
      what:B(['Ilustrar os retratos dos personagens para as conversas e diálogos','Criar as expressões de cada personagem: alegria, raiva, surpresa e outras','Manter os retratos fiéis aos modelos 3D','Entregar os arquivos prontos para a caixa de diálogo'],
             ['Illustrate character portraits for conversations and dialogue',"Create each character's expressions: joy, anger, surprise and more",'Keep portraits faithful to the 3D models','Deliver files ready for the dialogue box']),
      want:B(['Ilustração de personagens','Expressões faciais e atuação','Estilo consistente em muitas ilustrações','Portfólio com personagens 2D'],
             ['Character illustration','Facial expressions and acting','A consistent style across many illustrations','A portfolio with 2D characters']),
      bonus:B('Retratos no estilo JRPG ou visual novel.','JRPG or visual novel style portraits.') },
    { id:'ui-artist', projects:BOTH, name:'UI Artist', pt:'Artista de Interface', glyph:'ᛇ',
      what:B(['Criar ícones de habilidades, itens e efeitos','Desenhar os elementos do HUD','Criar menus, telas e caixas de diálogo','Manter um guia visual consistente em todo o jogo'],
             ['Create icons for skills, items and effects','Design HUD elements','Create menus, screens and dialogue boxes','Keep a consistent visual guide across the whole game']),
      want:B(['Design e ilustração de ícones','Composição, hierarquia visual e tipografia','Arquivos organizados e prontos para implementação','Portfólio com interfaces de jogos ou ícones'],
             ['Icon design and illustration','Composition, visual hierarchy and typography','Organized files ready for implementation','A portfolio with game UI or icons']),
      bonus:B('Animação de interface.','UI animation.') },
    { id:'ui-ux', projects:BOTH, name:'UI/UX Designer', pt:'Designer de UI/UX', glyph:'ᚹ',
      what:B(['Desenhar fluxos de telas e wireframes de menus, inventário e configurações','Criar protótipos navegáveis antes da arte final','Observar os testes com jogadores e melhorar o que confunde','Trabalhar junto com o UI Artist e a programação'],
             ['Design screen flows and wireframes for menus, inventory and settings','Build clickable prototypes before final art','Watch playtests and improve whatever confuses players','Work alongside the UI Artist and programming']),
      want:B(['Experiência com UX em jogos ou aplicativos','Wireframes e protótipos','Organização e hierarquia de informação','Portfólio com casos de UX'],
             ['UX experience in games or apps','Wireframes and prototypes','Information architecture and hierarchy','A portfolio with UX case studies']),
      bonus:B('Interfaces para teclado, mouse e controle, e testes de usabilidade.','Interfaces for keyboard, mouse and gamepad, and usability testing.') }
  ];

  /* Informações gerais sobre o serviço (valem para todas as vagas) */
  const SERVICE = [
    [B('Modalidade','Work model'), B('100% remoto','Fully remote')],
    [B('Regime','Engagement'), B('Voluntário, com possibilidade de remuneração no futuro','Volunteer, with possible pay in the future')],
    [B('Carga horária','Hours'), B('Flexível, combinada com a equipe','Flexible, agreed with the team')],
    [B('Comunicação','Communication'), B('Pelo Discord da equipe, com acompanhamento das tarefas','On the team Discord, with task follow-up')],
    [B('Entregas','Deliveries'), B('Por tarefa, com prazos combinados','Per task, with agreed deadlines')],
    [B('Idioma','Language'), B('Português','Portuguese')],
    [B('Crédito','Credit'), B('Seu nome nos créditos do jogo','Your name in the game credits')]
  ];

  function renderGuild() {
    const view = document.getElementById('game-view');
    const jobCard = j => `
        <article class="job plate" id="vaga-${j.id}">
          <div class="job-head"><span class="rune" aria-hidden="true">${j.glyph}</span><h3>${j.name}</h3>${LANG === 'pt' ? `<span class="pt-name">${j.pt}</span>` : ''}
            <div class="job-tags hud">${j.projects.map(k => `<span class="proj">${GAMES[k].short}</span>`).join('')}<span>${tx(B('Remoto','Remote'))}</span><span>${tx(B('Voluntário','Volunteer'))}</span></div></div>
          <div class="job-body">
            <div><h4>${tx(B('O que você vai fazer','What you will do'))}</h4><ul>${tx(j.what).map(x => `<li>${x}</li>`).join('')}</ul></div>
            <div><h4>${tx(B('O que esperamos','What we expect'))}</h4><ul>${tx(j.want).map(x => `<li>${x}</li>`).join('')}</ul></div>
            <p class="bonus"><b>${tx(B('Diferencial','Nice to have'))}</b>${tx(j.bonus)}</p>
          </div>
          <a class="btn sm apply" href="#vagas" data-job="${j.id}">${tx(B('Candidatar-se a esta vaga','Apply for this role'))}</a>
        </article>`;
    const group = (filter, rune, eyebrow, title) => `
      <div class="sec-head" style="margin-bottom:22px"><span class="rune" aria-hidden="true">${rune}</span><span class="hud">${tx(eyebrow)}</span><h2 style="font-size:clamp(1.5rem,3vw,2rem)">${tx(title)}</h2></div>
      <div class="jobs">${JOBS.filter(filter).map(jobCard).join('')}</div>`;

    view.innerHTML = wrapSec(`${sec('ᛞ', B('A Guilda · Vagas abertas','The Guild · Open roles'), B('Procuramos ferreiros de mundos',"We're looking for world-smiths"))}
      <p class="community-lede" style="margin-bottom:36px">${tx(B('A Myth Forge é um estúdio indie que cresce com quem acredita nos seus mundos. Se você quer ver seu trabalho vivo dentro de um jogo, há um lugar na bigorna para você.','Myth Forge is an indie studio that grows with people who believe in its worlds. If you want to see your work alive inside a game, there is a place at the anvil for you.'))}</p>
      <div class="sec-head" style="margin-bottom:22px"><span class="rune" aria-hidden="true">ᚨ</span><span class="hud">${tx(B('Sobre o serviço','About the work'))}</span><h2 style="font-size:clamp(1.5rem,3vw,2rem)">${tx(B('Como funciona trabalhar na forja','How working at the forge works'))}</h2></div>
      <dl class="service plate">${SERVICE.map(([k, v]) => `<div><dt class="hud">${tx(k)}</dt><dd>${tx(v)}</dd></div>`).join('')}</dl>
      ${group(() => true, 'ᚦ', B('Vagas abertas','Open roles'), B('Funções na forja','Roles at the forge'))}
      <div class="apply-wrap" id="candidatura">
        <div>
          <div class="sec-head" style="margin-bottom:22px"><span class="rune" aria-hidden="true">ᛖ</span><span class="hud">${tx(B('Candidatura','Application'))}</span><h2 style="font-size:clamp(1.5rem,3vw,2rem)">${tx(B('Como entrar na guilda','How to join the guild'))}</h2></div>
          <ol class="apply-steps">${[
            ['I', B('Envie seu portfólio','Send your portfolio'), B('Preencha o formulário com o link do seu trabalho.','Fill in the form with a link to your work.')],
            ['II', B('Conversa com a equipe','Talk with the team'), B('Se o seu perfil combinar, marcamos uma conversa.','If your profile is a match, we set up a chat.')],
            ['III', B('Primeira tarefa','First task'), B('Você recebe uma tarefa do projeto para começar a forjar com a gente.','You get a project task to start forging with us.')]
          ].map(([n, h, t]) => `<li><span class="num">${n}</span><h3>${tx(h)}</h3><p>${tx(t)}</p></li>`).join('')}</ol>
        </div>
        <form class="plate" id="guild-form" novalidate>
          <div class="row2">
            <div class="field"><label for="g-name">${tx(B('Nome','Name'))}</label><input id="g-name" autocomplete="name" required></div>
            <div class="field"><label for="g-mail">E-mail</label><input id="g-mail" type="email" autocomplete="email" required></div>
          </div>
          <div class="field"><label for="g-role">${tx(B('Vaga','Role'))}</label><select id="g-role">${JOBS.map(j => `<option value="${j.id}">${j.name}</option>`).join('')}</select></div>
          <div class="field"><span class="hud" style="color:var(--ash);letter-spacing:.18em;font-size:.7rem">${tx(B('Projetos','Projects'))}</span>
            <div class="checks" data-need-one="${tx(B('Escolha pelo menos um projeto.','Choose at least one project.'))}">${[P_E, P_L].map((k, i) => `<label for="g-p${i}"><input type="checkbox" id="g-p${i}" value="${k}">${GAMES[k].short}</label>`).join('')}</div></div>
          <div class="field"><label for="g-port">${tx(B('Link do portfólio','Portfolio link'))}</label><input id="g-port" type="url" placeholder="https://artstation.com/..." required></div>
          <div class="row2">
            <div class="field"><label for="g-hours">${tx(B('Horas por semana','Hours per week'))}</label><select id="g-hours"><option>${tx(B('Até 5 h','Up to 5 h'))}</option><option>5–10 h</option><option>10–20 h</option><option>${tx(B('Mais de 20 h','Over 20 h'))}</option></select></div>
            <div class="field"><label for="g-discord">Discord <span class="opt-tag">${tx(B('(opcional)','(optional)'))}</span></label><input id="g-discord" autocomplete="off"></div>
          </div>
          <div class="field"><label for="g-msg">${tx(B('Conte um pouco sobre você','Tell us a bit about yourself'))}</label><textarea id="g-msg" required></textarea></div>
          <button class="btn" type="submit">${tx(B('Enviar candidatura','Send application'))}</button>
          <p class="status hud" role="status"></p>
        </form>
      </div>`);
    view.querySelectorAll('[data-job]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('g-role').value = a.dataset.job;
      const jb = JOBS.find(x => x.id === a.dataset.job);
      [P_E, P_L].forEach((k, i) => { document.getElementById('g-p' + i).checked = jb.projects.includes(k); });
      document.getElementById('candidatura').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => document.getElementById('g-name').focus({ preventScroll: true }), 500);
    }));
    sendForm(document.getElementById('guild-form'), 'Candidatura para a Guilda', B('Candidatura recebida. Obrigado por querer forjar com a gente!','Application received. Thanks for wanting to forge with us!'));
  }

  /* =====================================================================
     EASTER EGG: a cada 10 golpes na bigorna, uma arma sorteada é forjada.
     A última arma fica salva no navegador do visitante (mf-forged).
     ===================================================================== */
  const WEAPONS = {
    sword:  { n:B('uma Espada','a Sword'), svg:`<polygon points="200,58 208,72 208,146 192,146 192,72" fill="url(#steel)"/><line x1="200" y1="70" x2="200" y2="142" stroke="#fff3d6" stroke-opacity=".6"/>
             <rect x="178" y="146" width="44" height="7" fill="url(#hot)"/><rect x="196" y="153" width="8" height="20" fill="#5a2a12"/><circle cx="200" cy="177" r="5" fill="url(#hot)"/>` },
    axe:    { n:B('um Machado','an Axe'), svg:`<rect x="196" y="66" width="8" height="112" fill="#5a2a12"/>
             <path d="M204 76 C236 66 248 96 240 126 C228 116 214 114 204 116 Z" fill="url(#steel)"/><path d="M196 82 C178 80 172 96 176 108 C184 102 190 100 196 100 Z" fill="url(#steel)"/>` },
    shield: { n:B('um Escudo','a Shield'), svg:`<path d="M200 64 L238 76 C238 118 226 150 200 172 C174 150 162 118 162 76 Z" fill="url(#steel)" stroke="url(#hot)" stroke-width="3"/>
             <path d="M200 84 L222 92 C222 118 214 138 200 152 C186 138 178 118 178 92 Z" fill="none" stroke="#7a2e0c" stroke-width="2"/><text x="200" y="128" text-anchor="middle" font-family="Noto Sans Runic, serif" font-size="30" fill="#7a2e0c">ᛗ</text>` },
    bow:    { n:B('um Arco','a Bow'), svg:`<path d="M186 60 Q246 118 186 176" fill="none" stroke="url(#hot)" stroke-width="7" stroke-linecap="round"/>
             <line x1="186" y1="62" x2="186" y2="174" stroke="#fff3d6" stroke-opacity=".8" stroke-width="1.5"/><rect x="209" y="108" width="9" height="20" rx="2" fill="#5a2a12"/>` },
    staff:  { n:B('um Cajado','a Staff'), svg:`<rect x="196" y="86" width="8" height="92" fill="#5a2a12"/><path d="M200 86 C186 80 184 64 192 56 M200 86 C214 80 216 64 208 56" fill="none" stroke="url(#hot)" stroke-width="4"/>
             <circle cx="200" cy="70" r="11" fill="#62e2ff" style="filter:drop-shadow(0 0 10px #62e2ff)"/>` },
    spear:  { n:B('uma Lança','a Spear'), svg:`<rect x="197" y="92" width="6" height="88" fill="#5a2a12"/><polygon points="200,54 210,82 200,96 190,82" fill="url(#steel)"/><rect x="192" y="96" width="16" height="5" fill="url(#hot)"/>` }
  };
  (function forgeEgg() {
    const sigilEl = document.getElementById('sigil'), svg = sigilEl && sigilEl.querySelector('svg');
    if (!svg) return;
    svg.insertAdjacentHTML('afterbegin', `<defs>
      <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d6"/><stop offset=".45" stop-color="#ffc36b"/><stop offset="1" stop-color="#ff7a2f"/></linearGradient>
      <linearGradient id="hot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7a2f"/><stop offset="1" stop-color="#ffc36b"/></linearGradient></defs>`);
    svg.insertAdjacentHTML('beforeend', `<g class="forged" id="forged"></g>`);
    const msg = document.createElement('span'); msg.className = 'forge-msg hud'; msg.setAttribute('role', 'status'); sigilEl.appendChild(msg);
    const holder = document.getElementById('forged');
    let strikes = 0, current = null, msgTimer;
    const show = (key, announce) => {
      current = key;
      holder.innerHTML = `<g style="filter:drop-shadow(0 0 10px #ff7a2f)"><g class="weapon-float"><g class="weapon">${WEAPONS[key].svg}</g></g></g>`;
      if (announce) {
        msg.textContent = tx(B('Você forjou ','You forged ')) + tx(WEAPONS[key].n) + '!';
        msg.classList.add('show'); clearTimeout(msgTimer); msgTimer = setTimeout(() => msg.classList.remove('show'), 4000);
      }
    };
    try { const saved = localStorage.getItem('mf-forged'); if (saved && Object.hasOwn(WEAPONS, saved)) show(saved, false); } catch (e) {}
    const onStrike = () => {
      strikes++;
      if (strikes % 10 !== 0) return;
      const keys = Object.keys(WEAPONS).filter(k => k !== current);
      const key = keys[Math.floor(Math.random() * keys.length)];
      show(key, true);
      const r = sigilEl.getBoundingClientRect();
      forge.burst(r.left + r.width * .5, r.top + r.height * .35, 160);
      try { localStorage.setItem('mf-forged', key); } catch (e) {}
    };
    sigilEl.addEventListener('click', onStrike);
    sigilEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') onStrike(); });
  })();

  /* EASTER EGG: as runas do anel se revelam (mouse ou dedo parado sobre o anel por ~1,5 s) */
  (function runeReveal() {
    const sigilEl = document.getElementById('sigil'), tp = sigilEl && sigilEl.querySelector('textPath');
    if (!tp) return;
    const txt = tp.parentNode, RUNES = tp.textContent, LATIN = 'MYTH FORGE · STUDIOS · ANVIL · LEGEND · CODE ·';
    const attrs = ['font-family', 'font-size', 'letter-spacing'].map(a => [a, txt.getAttribute(a)]);
    let timer = null, hideT = null, revealed = false;
    const swap = (fn) => { txt.classList.add('runes-swap'); setTimeout(() => { fn(); txt.classList.remove('runes-swap'); }, 350); };
    const reveal = () => { revealed = true; swap(() => {
      tp.textContent = LATIN; txt.setAttribute('font-family', 'Chakra Petch, sans-serif'); txt.setAttribute('font-size', '17'); txt.setAttribute('letter-spacing', '8'); txt.classList.add('runes-latin'); }); };
    const hide = () => { if (!revealed) return; revealed = false; swap(() => {
      tp.textContent = RUNES; attrs.forEach(([a, v]) => txt.setAttribute(a, v)); txt.classList.remove('runes-latin'); }); };
    const onRing = e => {
      const r = sigilEl.getBoundingClientRect();
      const d = Math.hypot((e.clientX - r.left) / r.width * 400 - 200, (e.clientY - r.top) / r.height * 400 - 200);
      return d > 128 && d < 190;
    };
    const start = () => { clearTimeout(hideT); if (timer || revealed) return; timer = setTimeout(() => { timer = null; reveal(); }, 1500); };
    const cancel = () => { clearTimeout(timer); timer = null; };
    sigilEl.addEventListener('pointermove', e => onRing(e) ? start() : cancel());
    sigilEl.addEventListener('pointerdown', e => { if (onRing(e)) start(); });
    sigilEl.addEventListener('pointerup', () => { if (!revealed) cancel(); else { clearTimeout(hideT); hideT = setTimeout(hide, 4000); } });
    sigilEl.addEventListener('pointerleave', () => { cancel(); clearTimeout(hideT); hideT = setTimeout(hide, 2500); });
  })();

  /* EASTER EGG: digitar "forja" ou "forge" (fora dos campos de texto) faz a fornalha rugir */
  (function furnaceRoar() {
    let buf = '', roaring = false;
    addEventListener('keydown', e => {
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (!e.key || e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-5);
      if (buf === 'forja' || buf === 'forge') { buf = ''; roar(); }
    });
    function roar() {
      if (roaring) return; roaring = true;
      const root = document.documentElement; root.classList.add('roar');
      for (let i = 0; i < 9; i++) setTimeout(() => forge.burst(innerWidth * (.08 + Math.random() * .84), innerHeight * (.75 + Math.random() * .25), 110), i * 180);
      const b = document.querySelector('.readouts .hot b');
      const fmt = v => v.toLocaleString(LANG === 'pt' ? 'pt-BR' : 'en-US') + ' °C';
      const t0 = performance.now(), base = 1538, peak = 3200;
      const step = now => {
        const k = (now - t0) / 4000;
        if (k >= 1) { if (b) b.textContent = fmt(base); root.classList.remove('roar'); roaring = false; return; }
        if (b) b.textContent = fmt(Math.round(base + (peak - base) * Math.sin(Math.PI * k)));
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  })();

  /* ---------- EQUIPE: avatares com as runas das iniciais (data-runes) na cor da área (--m) ---------- */
  document.querySelectorAll('.member').forEach((m, i) => {
    const runes = m.dataset.runes || 'ᛗ';
    let ticks = '';
    for (let k = 0; k < 24; k++) {
      const a = k * 15 * Math.PI / 180, r1 = 56, r2 = k % 6 === 0 ? 49 : 53;
      ticks += `<line x1="${(60 + r1 * Math.cos(a)).toFixed(1)}" y1="${(60 + r1 * Math.sin(a)).toFixed(1)}" x2="${(60 + r2 * Math.cos(a)).toFixed(1)}" y2="${(60 + r2 * Math.sin(a)).toFixed(1)}" stroke="var(--m)" stroke-opacity="${k % 6 === 0 ? .9 : .4}"/>`;
    }
    m.querySelector('.avatar').innerHTML = `<svg viewBox="0 0 120 120">
      <defs><radialGradient id="av${i}"><stop offset="0" stop-color="var(--m)" stop-opacity=".28"/><stop offset="1" stop-color="var(--m)" stop-opacity="0"/></radialGradient></defs>
      <circle cx="60" cy="60" r="58" fill="url(#av${i})"/>
      <g class="ring"><circle cx="60" cy="60" r="56" fill="none" stroke="var(--m)" stroke-opacity=".35" stroke-dasharray="2 5"/>${ticks}</g>
      <polygon points="60,16 104,60 60,104 16,60" fill="#07080d" stroke="var(--m)" stroke-width="1.4"/>
      <polygon points="60,26 94,60 60,94 26,60" fill="none" stroke="#232a3b"/>
      <text class="glyphs" x="60" y="70" text-anchor="middle" font-family="Noto Sans Runic, serif" font-size="${runes.length > 1 ? 26 : 34}" letter-spacing="2" fill="var(--m)">${runes}</text>
    </svg>`;
  });

  /* =====================================================================
     POPUP DA EQUIPE
     Preencha os dados de cada membro aqui. Campo vazio (null ou []) não aparece.
       bio:    B('texto em português', 'text in English')
       does:   B('o que faz no estúdio', 'what they do at the studio')
       games:  ['empire-of-rebirth', 'lendas-da-resistencia', 'master-tactician', 'trivia']
       skills: B(['especialidade 1', 'especialidade 2'], ['skill 1', 'skill 2'])
       quote:  B('frase ou curiosidade', 'quote or fun fact')
       city:   'Cidade, UF'
       links:  [{ label:'ArtStation', url:'https://...' }, { label:'LinkedIn', url:'https://...' }]
     ===================================================================== */
  const MEMBERS = {
    erick: {
      bio:B('Sou desenvolvedor de jogos e entusiasta da tecnologia, apaixonado por transformar ideias em projetos reais e criar mecânicas que proporcionem experiências marcantes. Curioso, proativo e sempre disposto a aprender, busco constantemente explorar novas possibilidades, aprimorar minhas habilidades e transformar desafios em oportunidades criativas.',
            "I'm a game developer and technology enthusiast, passionate about turning ideas into real projects and creating mechanics that deliver memorable experiences. Curious, proactive and always eager to learn, I constantly explore new possibilities, sharpen my skills and turn challenges into creative opportunities."),
      does:B('Desenvolvo mecânicas e sistemas para a melhor experiência do usuário.','I develop mechanics and systems for the best user experience.'),
      games:['empire-of-rebirth', 'master-tactician', 'lendas-da-resistencia', 'trivia'],
      skills:B(['Programador de gameplay', 'Design de sistemas', 'Desenvolvedor de jogos'], ['Gameplay programmer', 'Systems design', 'Game developer']),
      quote:B('Às vezes a noite pode ser mais produtiva do que o dia.','Sometimes the night can be more productive than the day.'),
      city:'São Paulo, SP',
      links:[{ label:'itch.io', url:'https://erickotico-dev.itch.io/' }, { label:'LinkedIn', url:'https://www.linkedin.com/in/erick-monteiro-244646184/' }]
    },
    jonatas: {
      bio:B('O mais lindo de toda a equipe do Empire, nerd sheipado, ama o mundo da modelagem 3D e cinemáticas.',
            'The best-looking member of the whole Empire team, a nerd in great shape who loves the world of 3D modeling and cinematics.'),
      does:B('Modelador de criaturas.','Creature modeler.'),
      games:['empire-of-rebirth'],
      skills:B(['Modelagem 3D de criaturas no ZBrush'], ['3D creature modeling in ZBrush']),
      quote:B("Jogo favorito: Dragon's Dogma. Strogonoff é a melhor comida de todas, e por acaso o Jonatas é um ótimo chef na cozinha.",
              "Favorite game: Dragon's Dogma. Stroganoff is the best food of all, and Jonatas happens to be a great chef in the kitchen."),
      city:'São Paulo, SP',
      links:[{ label:B('Portfólio','Portfolio'), url:'https://jax-made-3d.vercel.app/#top' }]
    },
    marco: {
      bio:B('Emo velho.','An old emo.'),
      does:B('Designer de personagens, modelador e animador 3D.','Character designer, 3D modeler and animator.'),
      games:[{ label:B('Jogos para a Vivax','Games for Vivax'), url:'https://vivaxbr.com/home/' }],
      skills:B(['Animação 3D'], ['3D animation']),
      quote:B('Tanto os hindus quanto os vikings acreditavam numa serpente gigante que envolve o mundo e que foi (ou será) morta por um deus usando uma arma mística com o poder do trovão, associada só a ele. E a morte dela causou (ou causará) um grande movimento das águas do mundo.',
              "Both Hindus and Vikings believed in a giant serpent that encircles the world and that was (or will be) slain by a god wielding a mystic weapon with the power of thunder, bound to him alone. And its death caused (or will cause) a great upheaval of the world's waters."),
      city:'São Paulo',
      links:[{ label:'ArtStation', url:'https://www.artstation.com/markrantunes' }]
    },
    joao: {
      bio:B('Um cara comum da vida que só quer cumprir as próprias missões.',
            'Just an ordinary guy who only wants to complete his own quests.'),
      does:B('Tatuador, designer gráfico, editor de vídeo, animador, modelador 3D e ilustrador.',
             'Tattoo artist, graphic designer, video editor, animator, 3D modeler and illustrator.'),
      games:['empire-of-rebirth'],
      skills:B(['Animação','Modelagem 3D','Ilustração'], ['Animation','3D modeling','Illustration']),
      quote:B('Se no olho do furacão eu ver um brilho dourado, é pra lá que eu vou navegar.',
              "If I see a golden glow in the eye of the storm, that's where I'll sail."),
      city:null,
      links:[{ label:'ArtStation', url:'https://www.artstation.com/jhonnydarkmon' }, { label:'LinkedIn', url:'https://www.linkedin.com/in/joaovqr/' }]
    },
    sophie:  { bio:null, does:null, games:[], skills:null, quote:null, city:null, links:[] }
  };

  const modal = document.createElement('div');
  modal.className = 'modal'; modal.id = 'member-modal'; modal.hidden = true;
  modal.innerHTML = `<div class="modal-backdrop" data-close></div>
    <article class="modal-card plate" role="dialog" aria-modal="true" aria-labelledby="mm-name" tabindex="-1">
      <button class="modal-x" type="button" data-close>×</button>
      <div id="mm-content"></div>
    </article>`;
  document.body.appendChild(modal);
  let openMember = null, lastFocus = null;

  function renderMember(id) {
    const card = document.querySelector(`.member[data-id="${id}"]`), d = MEMBERS[id] || {};
    const box = modal.querySelector('.modal-card');
    box.style.setProperty('--m', card.style.getPropertyValue('--m'));
    modal.querySelector('.modal-x').setAttribute('aria-label', tx(B('Fechar','Close')));
    const secs = [];
    if (d.bio) secs.push(`<div class="mm-sec"><h4>${tx(B('Sobre','About'))}</h4><p>${tx(d.bio)}</p></div>`);
    if (d.does) secs.push(`<div class="mm-sec"><h4>${tx(B('No estúdio','At the studio'))}</h4><p>${tx(d.does)}</p></div>`);
    if (d.games && d.games.length) secs.push(`<div class="mm-sec"><h4>${tx(B('Jogos','Games'))}</h4><div class="mm-chips">${d.games.map(g => typeof g === 'object' ? `<a href="${g.url}" target="_blank" rel="noopener">${tx(g.label)} ↗</a>` : `<span>${GAMES[g] ? GAMES[g].short : g}</span>`).join('')}</div></div>`);
    const sk = d.skills && tx(d.skills);
    if (sk && sk.length) secs.push(`<div class="mm-sec"><h4>${tx(B('Especialidades','Specialties'))}</h4><div class="mm-chips">${sk.map(x => `<span>${x}</span>`).join('')}</div></div>`);
    if (d.quote) secs.push(`<blockquote class="mm-quote">${tx(d.quote)}</blockquote>`);
    if (d.city) secs.push(`<div class="mm-sec"><h4>${tx(B('De onde','From'))}</h4><p>${d.city}</p></div>`);
    if (d.links && d.links.length) secs.push(`<div class="mm-sec"><h4>Links</h4><div class="mm-chips">${d.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${tx(l.label)} ↗</a>`).join('')}</div></div>`);
    if (!secs.length) secs.push(`<p class="mm-soon">${tx(B('Mais detalhes em breve.','More details coming soon.'))}</p>`);
    document.getElementById('mm-content').innerHTML = `
      <div class="mm-head"><div class="avatar" aria-hidden="true">${card.querySelector('.avatar').innerHTML.replace(/id="av(\d+)"/, 'id="avm$1"').replace(/url\(#av(\d+)\)/, 'url(#avm$1)')}</div>
        <div><span class="hud epithet" style="color:var(--m)">${card.querySelector('.epithet').innerHTML}</span>
          <h3 id="mm-name">${card.querySelector('h3').innerHTML}</h3>
          <p class="m-role">${card.querySelector('.m-role').innerHTML}</p></div></div>
      ${secs.join('')}`;
  }
  function openMemberModal(id) {
    lastFocus = document.activeElement; openMember = id;
    renderMember(id); modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    modal.querySelector('.modal-x').focus();
  }
  function closeMember() {
    if (modal.hidden) return;
    modal.hidden = true; openMember = null; document.documentElement.style.overflow = '';
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  function refreshMember() { if (openMember) renderMember(openMember); }
  document.querySelectorAll('.member').forEach(card => {
    card.addEventListener('click', () => openMemberModal(card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMemberModal(card.dataset.id); } });
  });
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeMember(); });
  addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeMember();
    if (e.key === 'Tab') {                                   /* mantém o foco dentro do popup */
      const f = [...modal.querySelectorAll('button, a[href]')]; if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  addEventListener('hashchange', closeMember);

  /* ---------- NAVEGAÇÃO (links próprios: #empire-of-rebirth, #diario, #diario-2026-08 etc.) ---------- */
  const homeView = document.getElementById('topo'), gameView = document.getElementById('game-view');
  function showSub(render, title, keepScroll) {
    homeView.hidden = true; gameView.hidden = false;
    render(); if (!keepScroll) scrollTo(0, 0);
    document.title = title + ' · Myth Forge Studios';
  }
  function route(e, keepScroll) {
    const h = decodeURIComponent(location.hash.slice(1));
    const post = h.startsWith('diario-') && DIARY.find(d => 'diario-' + d.id === h);
    if (GAMES[h]) {
      showSub(() => renderGame(h), GAMES[h].short.replace('&amp;', '&'), keepScroll);
    } else if (h === 'diario') {
      showSub(renderDiary, tx(UI.diaryTitle), keepScroll);
    } else if (h === 'testadores') {
      showSub(renderTesters, tx(UI.testers), keepScroll);
    } else if (h === 'vagas') {
      showSub(renderGuild, tx(B('Guilda · Vagas','Guild · Open roles')), keepScroll);
    } else if (post) {
      showSub(() => renderPost(post.id), tx(post.t), keepScroll);
    } else {
      const wasSub = homeView.hidden;
      homeView.hidden = false; gameView.hidden = true; gameView.innerHTML = '';
      document.title = 'Myth Forge Studios';
      dispatchEvent(new Event('resize'));
      if (wasSub) { const t = h && document.getElementById(h); t ? t.scrollIntoView() : scrollTo(0, 0); }
    }
  }
  addEventListener('hashchange', route);

  /* ---------- MENU DO CELULAR ---------- */
  const navBar = document.querySelector('.nav'), menuBtn = document.getElementById('menu-toggle');
  const setMenu = (open) => {
    navBar.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', tx(open ? UI.closeMenu : UI.openMenu));
  };
  menuBtn.addEventListener('click', () => setMenu(!navBar.classList.contains('open')));
  navBar.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('hashchange', () => setMenu(false));

  /* ---------- TROCA DE IDIOMA ----------
     Textos fixos da página: o português fica no HTML e o inglês no atributo data-en
     (data-en-placeholder / data-en-aria-label para atributos). */
  function applyStatic() {
    document.querySelectorAll('[data-en]').forEach(el => {
      if (el.dataset.pt === undefined) el.dataset.pt = el.innerHTML;
      el.innerHTML = LANG === 'en' ? el.dataset.en : el.dataset.pt;
    });
    ['placeholder', 'aria-label'].forEach(attr => {
      document.querySelectorAll(`[data-en-${attr}]`).forEach(el => {
        if (!el.hasAttribute(`data-pt-${attr}`)) el.setAttribute(`data-pt-${attr}`, el.getAttribute(attr) || '');
        el.setAttribute(attr, el.getAttribute(LANG === 'en' ? `data-en-${attr}` : `data-pt-${attr}`));
      });
    });
  }
  function setLang(l, initial) {
    LANG = l;
    try { localStorage.setItem('mf-lang', l); } catch (e) {}
    document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('.lang-switch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l));
    applyStatic();
    pitch(); forest(); quiz();
    renderLatest(); updateDiscord(); refreshMember();
    setMenu(navBar.classList.contains('open'));
    status.textContent = '';
    route(null, !initial);
  }
  document.querySelectorAll('.lang-switch button').forEach(b => b.addEventListener('click', () => { if (b.dataset.lang !== LANG) setLang(b.dataset.lang); }));

  /* ---------- FORMULÁRIO DE CONTATO ---------- */
  const form = document.getElementById('raven'), status = document.getElementById('f-status');
  sendForm(form, 'Contato pelo site', UI.formOk);

  /* Leitura automática do updates.json do repositório do Empire */
  if (CONFIG.AUTO_UPDATES) {
    /* Tudo o que vem de fora é conferido e escapado antes de ir para a página. */
    const esc = v => String(v == null ? '' : v).slice(0, 500).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    const pair = o => (o && typeof o === 'object') ? [esc(o.pt), esc(o.en || o.pt)] : [esc(o), esc(o)];
    fetch(CONFIG.UPDATES_URL, { referrerPolicy: 'no-referrer' }).then(r => r.json()).then(j => {
      const list = (j && Array.isArray(j.updates) ? j.updates : []).filter(u => u
        && /^[\w.-]{1,24}$/.test(u.version) && /^\d{4}-\d{2}-\d{2}$/.test(u.date) && Array.isArray(u.changes)).slice(0, 500);
      if (!list.length) return;
      EMPIRE_UPDATES = list.map(u => [u.version, u.date, pair(u.title), u.changes.slice(0, 80).map(pair)]);
      buildDiary(); renderLatest(); route(null, true);
    }).catch(() => {});
  }

  /* Início: aplica o idioma escolhido e abre a página certa */
  setLang(LANG, true);
})();
