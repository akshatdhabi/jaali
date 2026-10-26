// Sample page wiring. Everything visual comes from jaali.css; this file only supplies example content.
(function () {
  const J = window.Jaali;
  const $ = J.$, $$ = J.$$;

  /* ---------- library: fictional albums and playlists ---------- */
  const LIB = [
    { t: 'Late Trains', m: 'ring', kind: 'album', tag: 'Night platforms, one lamp lit.|Eleven tracks for the last ride home.|Slow, warm, a little static.', meta: 'Album · 2025', d: 'Eleven tracks recorded on the last train out, mostly in one take.', n: '11', l: 'tracks', s: 'sent', sl: 'finished' },
    { t: 'Salt Light', m: 'arch', kind: 'album', tag: 'Morning on a flat roof.|Guitar, one window, no drums.|Sparse and bright.', meta: 'Album · 2024', d: 'Fingerpicked guitar and a single room microphone.', n: '8', l: 'tracks', s: 'sent', sl: 'finished' },
    { t: 'Tin Roof Choir', m: 'rosette', kind: 'playlist', tag: 'Rain, then everyone sings.|A playlist for the wet season.|Loud in the middle.', meta: 'Playlist · 42 tracks', d: 'Songs that sound better with weather on the window.', n: '42', l: 'tracks', s: 'run', sl: 'updating' },
    { t: 'Slow Mapping', m: 'star', kind: 'playlist', tag: 'For long walks with no plan.|Wander first, arrive later.|Instrumental, mostly.', meta: 'Playlist · 27 tracks', d: 'Instrumental pieces that keep pace with walking.', n: '27', l: 'tracks', s: 'held', sl: 'draft' },
    { t: 'Stepwell', m: 'well', kind: 'album', tag: 'Down one stair at a time.|Echo, then quiet.|Built from field recordings.', meta: 'Album · 2023', d: 'Field recordings from stone courtyards and stairs, layered into slow pieces.', n: '14', l: 'tracks', s: 'sent', sl: 'finished' }
  ];
  const cards = $('#cards');
  function renderCards(f) {
    const list = LIB.map((w, i) => [w, i]).filter(([w]) => f === 'all' || w.kind === f);
    cards.innerHTML = list.map(([w, i], j) => `<button class="j-card j-glow ${list.length % 2 && j === 0 ? 'j-card--wide' : ''}" data-i="${i}" data-j-tilt>
      <span class="j-card__top"><span class="j-card__meta">${String(i + 1).padStart(2, '0')} · ${w.meta}</span>${J.motif(w.m)}</span>
      <span><span class="j-card__name">${w.t}<i>.</i></span><span class="j-card__tag"><span class="j-flip j-flip--line" data-words="${w.tag}">${w.tag.split('|')[0]}</span></span><span class="j-card__desc">${w.d}</span></span>
      <span class="j-card__foot"><span><span class="n">${w.n}</span><span class="j-cap">${w.l}</span></span><span class="j-status j-status--${w.s}">${w.sl}</span></span>
    </button>`).join('');
    J.indexKids(cards);
    $$('.j-card', cards).forEach((b) => {
      J.tilt(b);
      b.addEventListener('click', () => {
        const w = LIB[+b.dataset.i];
        sh.open($('.j-card__name', b), {
          org: w.meta, title: w.t,
          html: `<p class="j-sheet__text" style="--d:0">${w.d}</p><div class="j-sheet__row" style="--d:1"><div><div class="j-num">${w.n}</div><p class="j-cap">${w.l}</p></div><div><p class="j-cap">status</p><p class="j-h" style="margin-top:4px">${w.sl}</p></div></div>`
        });
      });
    });
  }

  /* sheet markup lives at the end of the body */
  document.body.insertAdjacentHTML('beforeend', `<div class="j-sheet j-wrap" id="sheet" hidden role="dialog" aria-modal="true"><div class="j-inner">
    <button class="j-cbtn j-sheet__back"><span class="ring"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></span>back</button>
    <p class="j-sheet__org"></p><h2 class="j-sheet__title"></h2><div class="j-sheet__body"></div></div></div>`);
  const sh = J.sheet($('#sheet'));
  renderCards('all');
  J.pivot($('#libPivot'), (b) => J.turnstile(cards, () => renderCards(b.dataset.f)));

  /* ---------- ops hub: a fictional job scheduler called Lattice ---------- */
  const ROWS = [
    ['Nightly build for web-app', 'sent', 94], ['Billing export, EU region', 'held', 121], ['Cache warm-up, 12 shards', 'run', 41],
    ['Image resize backlog', 'fail', 300], ['Weekly digest email', 'sent', 102], ['Search reindex, delta', 'sent', 77],
    ['Backup verification', 'held', 133], ['Log rotation, all hosts', 'sent', 88]
  ];
  const LABEL = { sent: 'done', held: 'held', run: 'running', fail: 'failed' };
  const ticks = () => {
    const s = Array(36).fill('');
    [3, 7, 9, 14, 18, 21, 25, 28, 31, 34].forEach((i) => { s[i] = 'h'; });
    [5, 12, 23, 27, 33].forEach((i) => { s[i] = 'f'; });
    return s.map((c, i) => `<i class="${c}" style="--k:${i}"></i>`).join('');
  };
  const rt = () => ROWS.map((r, i) => `<i class="${r[2] > 60 ? 'o' : ''}" style="left:${(r[2] / 300 * 100).toFixed(1)}%;height:${14 + ((i * 7) % 4) * 6}px"></i>`).join('');
  const face = (cls, body) => `<div class="j-face ${cls}">${body}</div>`;
  const tile = (cls, front, back = '') => `<div class="j-live j-glow ${cls}" ${back ? 'data-j-live' : ''}><div class="j-live__in">${front}${back}</div></div>`;
  $('#hubMount').innerHTML = `<div class="j-hub" id="hub" data-j-in>
    ${tile('is-big', face('', `<span class="j-tn1">312</span><div><div class="j-ticks">${ticks()}</div><span class="j-tl" style="display:block;margin-top:10px">jobs today, one tick each</span></div>`), face('j-face--back', `<span class="j-tw">271 done, 38 held, 3 failed</span><span class="j-tl">since midnight</span>`))}
    ${tile('is-wide', face('', `<span class="j-tn1">1.8<small>s</small></span><span class="j-tl">median run time</span>`), face('j-face--back', `<span class="j-tl">example run times on a 0 to 300s scale. The accent line is the 60s budget</span><div class="j-trt"><span class="ax"></span><span class="g"></span>${rt()}</div>`))}
    ${tile('is-accent', face('', `<span class="j-tn1">6</span><span class="j-tl">retrying</span>`))}
    ${tile('', face('', `<span class="j-tn1">3</span><span class="j-tl">failed</span>`), face('j-face--back', `<span class="j-tn1">2</span><span class="j-tl">were timeouts</span>`))}
    ${tile('is-big', face('j-face--feed', `<span class="j-tl">recent jobs</span><div class="j-feed" id="feed"></div>`))}
    ${tile('is-wide', face('', `<div class="j-lattice-fill"></div><span class="j-tw">Lattice is syncing the <span class="j-flip" data-words="nightly build|billing export|cache warm-up">nightly build</span><span class="j-typing"><i></i><i></i><i></i></span></span><span class="j-tl">scheduler live</span>`))}
    ${tile('is-wide', face('', `<span class="j-tn1">24</span><span class="j-tl">workers across 4 regions</span>`), face('j-face--back', `<span class="j-tw" id="famw">builds</span><span class="j-tl">queues</span>`))}
    ${tile('', face('', `<span class="j-tn1">271</span><span class="j-tl">done</span>`))}
    ${tile('', face('', `<span class="j-tn1">0<small>/3</small></span><span class="j-tl">open incidents</span>`), face('j-face--back', `<span class="j-tw" style="font-size:17px">none this week</span><span class="j-tl">status</span>`))}
  </div>`;
  const hub = $('#hub');
  const feed = $('#feed');
  let fi = 0;
  const push = () => {
    const r = ROWS[fi % ROWS.length]; fi++;
    const d = document.createElement('div'); d.className = 'new';
    const a = document.createElement('span'); a.textContent = r[0];
    const b = document.createElement('span'); b.className = `j-status j-status--${r[1]}`; b.textContent = LABEL[r[1]];
    d.append(a, b); feed.prepend(d);
    while (feed.children.length > 6) feed.lastChild.remove();
  };
  for (let i = 0; i < 6; i++) push();
  $$('.new', feed).forEach((x) => x.classList.remove('new'));
  if (!J.reduced()) setInterval(push, 3200);
  const Q = ['builds', 'exports', 'emails', 'indexing', 'backups'];
  let qi = 0;
  setInterval(() => { const w = $('#famw'); if (w) { qi = (qi + 1) % Q.length; w.textContent = Q[qi]; } }, 1800);

  /* ---------- layers: replay the popover ---------- */
  const pop = $('#popDemo');
  setInterval(() => { pop.style.animation = 'none'; void pop.offsetWidth; pop.style.animation = ''; }, 6000);

  /* ---------- install ---------- */
  $('#rosette').innerHTML = J.rosette();
  $('#copy').addEventListener('click', () => {
    const l = $('#copyL');
    const cmd = $('#cmd').textContent;
    const done = () => { l.textContent = 'copied'; J.toast('Copied', cmd); setTimeout(() => { l.textContent = 'copy'; }, 1600); };
    const sel = () => { getSelection().selectAllChildren($('#cmd')); l.textContent = 'selected'; };
    try { navigator.clipboard.writeText(cmd).then(done, sel); } catch (e) { sel(); }
  });

  /* ---------- chrome and page-wide behaviour ---------- */
  J.mount();
  J.jaaliField($('#field'));
  J.liveTiles(hub);
  $$('[data-count]').forEach((el) => J.countUp(el));
  J.themePicker($('#skinRow'), { toggle: $('#skinBtn'), panel: $('#skins') });
  $('#modeBtn').addEventListener('click', J.toggleMode);
  J.scrollSpy({ progress: $('#prog'), links: $$('[data-spy]'), sections: ['top', 'library', 'ops'] });
})();
