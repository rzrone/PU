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
