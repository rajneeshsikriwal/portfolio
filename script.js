/* ==========================================================
   Portfolio renderer — all content sourced from data.json
   ========================================================== */

async function loadData() {
  const res = await fetch('data.json');
  if (!res.ok) throw new Error('Could not load data.json');
  return res.json();
}

function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.text) node.textContent = opts.text;
  if (opts.html) node.innerHTML = opts.html;
  if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, v));
  children.forEach(c => c && node.appendChild(c));
  return node;
}

/* ---------- Hero ---------- */
function renderHero(data) {
  const { meta, stats } = data;
  document.title = `${meta.name} — ${meta.role}`;
  document.getElementById('hero-location').textContent = meta.location;
  document.getElementById('hero-name').textContent = meta.name;
  document.getElementById('hero-role').textContent = meta.role;
  document.getElementById('hero-tagline').textContent = meta.tagline;
  document.getElementById('brand-name').textContent = meta.name
    .split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  document.getElementById('footer-name').textContent = `${meta.name} · ${meta.role}`;

  const statRow = document.getElementById('stat-row');
  stats.forEach(s => {
    statRow.appendChild(el('div', {}, [
      el('dt', { text: s.value }),
      el('dd', { text: s.label })
    ]));
  });
}

/* ---------- Stack diagram (hub and spoke SVG, drawn from data) ---------- */
function renderDiagram(data) {
  const svg = document.getElementById('stackSvg');
  const { center, nodes } = data.stackDiagram;
  const cx = 240, cy = 240, hubR = 62, spokeR = 178, nodeR = 46;
  const ns = 'http://www.w3.org/2000/svg';

  function make(tag, attrs) {
    const n = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  }

  // spokes first (so nodes sit on top)
  const points = nodes.map((label, i) => {
    const angle = (Math.PI * 2 * i) / nodes.length - Math.PI / 2;
    return {
      label,
      x: cx + spokeR * Math.cos(angle),
      y: cy + spokeR * Math.sin(angle)
    };
  });

  points.forEach(p => {
    svg.appendChild(make('line', {
      x1: cx, y1: cy, x2: p.x, y2: p.y,
      stroke: '#D8D5CC', 'stroke-width': 1
    }));
  });

  // hub
  svg.appendChild(make('circle', {
    cx, cy, r: hubR, fill: '#1B4B47', stroke: '#0F332F', 'stroke-width': 2
  }));
  const hubText = wrapLines(center, 14);
  hubText.forEach((line, i) => {
    svg.appendChild(make('text', {
      x: cx, y: cy - ((hubText.length - 1) * 8) + i * 16 + 5,
      'text-anchor': 'middle',
      'font-family': 'IBM Plex Sans, sans-serif',
      'font-size': '13',
      'font-weight': '600',
      fill: '#F7F6F2'
    })).textContent = line;
  });

  // outer nodes
  points.forEach((p, i) => {
    const isAccent = i % 3 === 0;
    svg.appendChild(make('circle', {
      cx: p.x, cy: p.y, r: nodeR,
      fill: '#FFFFFF',
      stroke: isAccent ? '#C4622D' : '#B9B4A6',
      'stroke-width': isAccent ? 2 : 1.4
    }));
    const lines = wrapLines(p.label, 10);
    lines.forEach((line, li) => {
      svg.appendChild(make('text', {
        x: p.x, y: p.y - ((lines.length - 1) * 7) + li * 14 + 4,
        'text-anchor': 'middle',
        'font-family': 'IBM Plex Mono, monospace',
        'font-size': '10.5',
        fill: '#12181F'
      })).textContent = line;
    });
  });

  function wrapLines(text, maxCharsPerLine) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach(w => {
      const candidate = current ? `${current} ${w}` : w;
      if (candidate.length > maxCharsPerLine && current) {
        lines.push(current);
        current = w;
      } else {
        current = candidate;
      }
    });
    if (current) lines.push(current);
    return lines;
  }
}

/* ---------- Summary ---------- */
function renderSummary(data) {
  document.getElementById('summary-text').textContent = data.summary;
}

/* ---------- Competencies ---------- */
function renderCompetencies(data) {
  const grid = document.getElementById('competency-grid');
  data.competencies.forEach(group => {
    const chipRow = el('div', { className: 'chip-row' },
      group.items.map(item => el('span', { className: 'chip', text: item }))
    );
    grid.appendChild(el('div', { className: 'competency-group' }, [
      el('h3', { text: group.group }),
      chipRow
    ]));
  });
}

/* ---------- Experience timeline ---------- */
function renderExperience(data) {
  const list = document.getElementById('timeline');
  data.experience.forEach(job => {
    const meta = el('div', { className: 'timeline-meta' }, [
      el('span', { className: 'period', text: job.period }),
      el('span', { text: job.company }),
      el('span', { text: job.location })
    ]);
    const points = el('ul', {}, job.points.map(p => el('li', { text: p })));
    list.appendChild(el('li', { className: 'timeline-item' }, [
      el('h3', { text: job.title }),
      meta,
      points
    ]));
  });
}

/* ---------- Flagship projects ---------- */
function renderFlagshipProjects(data) {
  const wrapEl = document.getElementById('flagship-projects');
  data.flagshipProjects.forEach((proj, i) => {
    const idLabel = el('span', { className: 'project-id', text: `${String(i + 1).padStart(2, '0')} / ${proj.region} / ${proj.period}` });
    const stackRow = el('div', { className: 'stack-row' }, proj.stack.map(s => el('span', { className: 'chip', text: s })));
    const points = el('ul', {}, proj.points.map(p => el('li', { text: p })));

    wrapEl.appendChild(el('article', { className: 'project-card' }, [
      idLabel,
      el('div', {}, [
        el('h3', { className: 'project-name', text: proj.name }),
        el('p', { className: 'project-subtitle', text: proj.subtitle }),
        points,
        stackRow
      ])
    ]));
  });
}

/* ---------- Additional projects ---------- */
function renderAdditionalProjects(data) {
  const grid = document.getElementById('additional-projects');
  data.additionalProjects.forEach(proj => {
    grid.appendChild(el('div', { className: 'additional-item' }, [
      el('span', { className: 'region', text: proj.region }),
      el('h3', { text: proj.name }),
      el('p', { text: proj.description })
    ]));
  });
}

/* ---------- Background: education, certs, languages ---------- */
function renderBackground(data) {
  const eduList = document.getElementById('education-list');
  data.education.forEach(ed => {
    eduList.appendChild(el('li', {}, [
      el('span', { className: 'item-title', text: ed.degree }),
      el('span', { className: 'item-meta', text: [ed.institution, ed.year].filter(Boolean).join(' · ') })
    ]));
  });

  const certList = document.getElementById('cert-list');
  data.certifications.forEach(c => {
    certList.appendChild(el('li', {}, [
      el('span', { className: 'item-title', text: c.name }),
      c.issuer ? el('span', { className: 'item-meta', text: c.issuer }) : null
    ]));
  });

  const langList = document.getElementById('lang-list');
  data.languages.forEach(l => {
    langList.appendChild(el('li', {}, [
      el('span', { className: 'item-title', text: l.name }),
      el('span', { className: 'item-meta', text: l.level })
    ]));
  });
}

/* ---------- Contact ---------- */
function renderContact(data) {
  const { meta } = data;
  const details = document.getElementById('contact-details');

  // WhatsApp message link
  const waNumber = meta.phone.replace(/\D/g, '');
  const waMsg = encodeURIComponent(`Hi Rajneesh, I came across your portfolio and would like to connect.`);
  const waHref = `https://wa.me/${waNumber}?text=${waMsg}`;

  // Set floating WhatsApp button href
  const floatBtn = document.getElementById('whatsapp-float');
  if (floatBtn) floatBtn.href = waHref;

  const waSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

  const emailSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>`;

  const rows = [
    {
      label: 'Email',
      html: `<a class="email-link" href="mailto:${meta.email}">${emailSvg}${meta.email}</a>`
    },
    {
      label: 'WhatsApp / Phone',
      html: `<a class="whatsapp-link" href="${waHref}" target="_blank" rel="noopener">${waSvg}${meta.phone}</a>`
    },
    {
      label: 'LinkedIn',
      html: `<a href="${meta.linkedin}" target="_blank" rel="noopener">linkedin.com/in/rajneesh-kumarsingh</a>`
    },
    { label: 'Location', html: `<span>${meta.location}</span>` }
  ];

  rows.forEach(r => {
    const line = el('div', { className: 'contact-line' });
    line.appendChild(el('span', { className: 'label', text: r.label }));
    const valueWrap = document.createElement('div');
    valueWrap.innerHTML = r.html;
    line.appendChild(valueWrap.firstElementChild);
    details.appendChild(line);
  });
}

/* ---------- Theme switcher ---------- */
function bindThemeSwitcher() {
  const btns = document.querySelectorAll('.theme-btn');
  const root = document.documentElement;

  applyTheme('dark');

  btns.forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeTarget));
  });

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme === 'light' ? '' : theme);
    btns.forEach(b => b.setAttribute('data-active', String(b.dataset.themeTarget === theme)));
  }
}

/* ---------- Nav toggle ---------- */
function bindNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.querySelector('.main-nav');
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

/* ---------- Footer year ---------- */
function renderFooterYear() {
  document.getElementById('footer-year').textContent = new Date().getFullYear();
}

/* ---------- Init ---------- */
(async function init() {
  bindNav();
  bindThemeSwitcher();
  renderFooterYear();
  try {
    const data = await loadData();
    renderHero(data);
    renderDiagram(data);
    renderSummary(data);
    renderCompetencies(data);
    renderExperience(data);
    renderFlagshipProjects(data);
    renderAdditionalProjects(data);
    renderBackground(data);
    renderContact(data);
  } catch (err) {
    console.error(err);
    document.getElementById('hero-name').textContent = 'Unable to load content';
    const p = document.createElement('p');
    p.textContent = 'data.json could not be loaded. If you opened this file directly in a browser, serve it from a local server instead (e.g. "npx serve" or "python -m http.server") so the fetch request is allowed.';
    document.querySelector('.hero-copy').appendChild(p);
  }
})();
