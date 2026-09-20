document.getElementById('year').textContent = new Date().getFullYear();

const toggle = document.querySelector('.nav-toggle');
const header = document.querySelector('.site-header');

toggle.addEventListener('click', () => {
  const isOpen = header.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    header.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
});

const filterChips = document.querySelectorAll('.filter-chip');
const menuItems = document.querySelectorAll('.menu-list li');
const menuAccordions = document.querySelectorAll('.menu-accordion');

filterChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    filterChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    const filter = chip.dataset.filter;

    menuItems.forEach((li) => {
      const tags = (li.dataset.tags || '').split(' ');
      const matches = filter === 'alle' || tags.includes(filter);
      li.classList.toggle('filtered-out', !matches);
    });

    menuAccordions.forEach((acc, index) => {
      if (filter === 'alle') {
        acc.classList.remove('no-match');
        acc.open = index === 0;
        return;
      }
      const hasMatch = acc.querySelectorAll('li:not(.filtered-out)').length > 0;
      acc.classList.toggle('no-match', !hasMatch);
      if (hasMatch) {
        acc.open = true;
      }
    });
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

document.querySelectorAll('.jump-bar a').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const allChip = document.querySelector('.filter-chip[data-filter="alle"]');
    if (!allChip.classList.contains('active')) allChip.click();
    target.open = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

(function () {
  const KEY = 'pizzeriaUnoMerkzettel';
  const fab = document.getElementById('noteFab');
  const overlay = document.getElementById('noteOverlay');
  const list = document.getElementById('noteList');
  const empty = document.getElementById('noteEmpty');
  const totalEl = document.getElementById('noteTotal');
  const countEl = document.getElementById('noteCount');
  const copyBtn = document.getElementById('noteCopy');
  const clearBtn = document.getElementById('noteClear');
  const closeBtn = overlay.querySelector('.note-close');

  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cart = {}; }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };
  const fmt = (n) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const parsePrice = (t) => { const m = t.match(/(\d+),(\d+)/); return m ? parseFloat(m[1] + '.' + m[2]) : 0; };

  document.querySelectorAll('.menu-accordion').forEach((acc) => {
    acc.querySelectorAll('.menu-list li').forEach((li, i) => {
      const id = acc.id + '-' + i;
      const name = li.firstElementChild.textContent.trim();
      const priceText = li.querySelector('.price').textContent.trim();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'add-btn';
      btn.textContent = '+';
      btn.setAttribute('aria-label', 'Auf den Merkzettel: ' + name);
      btn.addEventListener('click', () => {
        const item = cart[id] || (cart[id] = { name, price: parsePrice(priceText), priceText, qty: 0 });
        item.qty += 1;
        save();
        render();
        btn.classList.add('added');
        setTimeout(() => btn.classList.remove('added'), 180);
      });
      li.appendChild(btn);
    });
  });

  function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];
    save();
    render();
  }

  function render() {
    const entries = Object.entries(cart).filter(([, it]) => it.qty > 0);
    list.textContent = '';
    let total = 0;
    let count = 0;
    entries.forEach(([id, it]) => {
      total += it.price * it.qty;
      count += it.qty;
      const li = document.createElement('li');
      const nameEl = document.createElement('span');
      nameEl.textContent = it.name;
      const priceEl = document.createElement('span');
      priceEl.className = 'note-line-price';
      priceEl.textContent = fmt(it.price * it.qty);
      const qty = document.createElement('div');
      qty.className = 'note-qty';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '\u2212';
      minus.setAttribute('aria-label', 'Weniger: ' + it.name);
      minus.addEventListener('click', () => changeQty(id, -1));
      const out = document.createElement('output');
      out.textContent = it.qty;
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.setAttribute('aria-label', 'Mehr: ' + it.name);
      plus.addEventListener('click', () => changeQty(id, 1));
      qty.append(minus, out, plus);
      li.append(nameEl, priceEl, qty);
      list.appendChild(li);
    });
    empty.hidden = entries.length > 0;
    totalEl.textContent = fmt(total);
    countEl.textContent = count;
    fab.hidden = count === 0;
    copyBtn.disabled = clearBtn.disabled = count === 0;
    if (count === 0 && !overlay.hidden) { /* leave panel open so the empty hint shows */ }
  }

  function openPanel() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closePanel() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (!fab.hidden) fab.focus();
  }

  fab.addEventListener('click', openPanel);
  overlay.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closePanel));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) closePanel(); });

  clearBtn.addEventListener('click', () => { cart = {}; save(); render(); });

  copyBtn.addEventListener('click', async () => {
    const entries = Object.values(cart).filter((it) => it.qty > 0);
    const total = entries.reduce((s, it) => s + it.price * it.qty, 0);
    const text = 'Meine Bestellung bei Pizzeria UNO\n' +
      entries.map((it) => it.qty + 'x ' + it.name + ' (' + it.priceText + ')').join('\n') +
      '\nSumme ca. ' + fmt(total) + '\nTel. 06082 / 497 99 48';
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Kopiert';
    } catch (e) {
      copyBtn.textContent = 'Nicht möglich';
    }
    setTimeout(() => { copyBtn.textContent = 'Liste kopieren'; }, 1600);
  });

  render();
})();

(function () {
  const btn = document.getElementById('themeToggle');
  const root = document.documentElement;
  const KEY = 'pizzeriaUnoTheme';

  function sync() {
    const soft = root.dataset.theme === 'soft';
    btn.textContent = soft ? 'Kräftigere Farben' : 'Sanftere Farben';
    btn.setAttribute('aria-pressed', String(soft));
  }

  btn.addEventListener('click', () => {
    const soft = root.dataset.theme !== 'soft';
    if (soft) root.dataset.theme = 'soft'; else delete root.dataset.theme;
    try { localStorage.setItem(KEY, soft ? 'soft' : 'strong'); } catch (e) {}
    sync();
  });

  sync();
})();
