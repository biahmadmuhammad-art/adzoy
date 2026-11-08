/* Compatibility for moved sections and keyboard access to the review interactions. */
(() => {
  if (ENTRY_ROUTE === 'index.html#chapters') {
    const showMenu = () => {
      if (typeof Stops === 'undefined' || !Stops.tl || Stops.busy) return requestAnimationFrame(showMenu);
      Menu.show();
    };
    requestAnimationFrame(showMenu);
  }
  document.querySelectorAll('.ht').forEach(item => {
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); item.click(); }
    });
    item.addEventListener('click', () => {
      document.querySelectorAll('.ht').forEach(other => other.setAttribute('aria-pressed', String(other === item)));
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || typeof Panel === 'undefined' || !Panel.open) return;
    const dialog = document.querySelector('.panel-card');
    const items = [...dialog.querySelectorAll('button, a[href], [tabindex="0"]')].filter(el => el.getClientRects().length);
    if (!items.length) { event.preventDefault(); dialog.focus(); return; }
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
})();
