// При обновлении страница всегда начинается с самого верха
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
window.scrollTo(0, 0);

// Если браузер достал страницу из кэша (кнопка «назад»), перезагружаем её полностью
window.addEventListener('pageshow', e => {
  if (e.persisted) location.reload();
});

// Экран загрузки: держим не меньше времени анимации букв, ждём загрузку страницы и шрифтов
const preloader = document.querySelector('.preloader');

if (preloader) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loaded = new Promise(resolve => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  const minDelay = new Promise(resolve => setTimeout(resolve, reduced ? 300 : 1400));

  Promise.all([loaded, document.fonts ? document.fonts.ready : null, minDelay]).then(() => {
    window.scrollTo(0, 0);
    preloader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    setTimeout(() => preloader.remove(), 1000);
  });
}

// Мобильное меню
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');

const setMenu = open => {
  nav.classList.toggle('is-open', open);
  burger.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
  document.body.classList.toggle('menu-open', open);
};

burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// Бренды: на десктопе секция закрепляется, вертикальный скролл двигает ленту вбок.
// На телефоне и при отключённой анимации — обычная горизонтальная прокрутка.
const brands = document.querySelector('.brands');

if (brands) {
  const pin = brands.querySelector('.brands__pin');
  const viewport = brands.querySelector('[data-brands-viewport]');
  const track = brands.querySelector('[data-brands-track]');
  const bar = brands.querySelector('[data-brands-bar]');
  const current = brands.querySelector('[data-brands-current]');
  const total = brands.querySelector('[data-brands-total]');
  const count = track.children.length;
  const pinMode = window.matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');

  let distance = 0;
  let ticking = false;

  total.textContent = String(count).padStart(2, '0');

  const render = progress => {
    bar.style.transform = `scaleX(${progress})`;
    current.textContent = String(Math.round(progress * (count - 1)) + 1).padStart(2, '0');
  };

  const update = () => {
    ticking = false;

    if (!pinMode.matches) {
      const max = viewport.scrollWidth - viewport.clientWidth;
      render(max > 0 ? viewport.scrollLeft / max : 0);
      return;
    }

    // 0 — блок только прилип под шапкой, 1 — лента докручена до конца
    const stickTop = parseFloat(getComputedStyle(pin).top) || 0;
    const padTop = parseFloat(getComputedStyle(brands).paddingTop) || 0;
    const passed = stickTop - (brands.getBoundingClientRect().top + padTop);
    const progress = distance ? Math.min(Math.max(passed / distance, 0), 1) : 0;

    track.style.transform = `translate3d(${-progress * distance}px, 0, 0)`;
    render(progress);
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  const layout = () => {
    if (pinMode.matches) {
      brands.classList.add('is-pinned');
      brands.style.height = '';
      distance = Math.max(track.scrollWidth - viewport.clientWidth, 0);
      // высота секции = её обычная высота + путь, который лента проходит вбок
      brands.style.height = `${brands.offsetHeight + distance}px`;
    } else {
      brands.classList.remove('is-pinned');
      brands.style.height = '';
      track.style.transform = '';
      distance = 0;
    }
    update();
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  viewport.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', layout);
  // ширина меняется и без resize окна — например, когда после экрана загрузки появляется полоса прокрутки
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(viewport);
  pinMode.addEventListener('change', layout);
  document.fonts?.ready.then(layout);
  layout();
}
