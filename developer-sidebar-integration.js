(() => {
  const KEY = 'hamdan.websites';
  const projects = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const escapeHtml = (v) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function mount() {
    const nav = document.querySelector('nav');
    if (!nav || document.querySelector('[data-hamdan-developer-nav]')) return;
    const block = document.createElement('div');
    block.dataset.hamdanDeveloperNav = 'true';
    block.className = 'developer-projects';
    block.innerHTML = `<a class="developer-main-link" href="/developer.html">✦ Hamdan Developer</a><div class="developer-projects-title">MY WEBSITES</div><div class="developer-project-list"></div><a class="developer-new" href="/developer.html#create">＋ New Website</a>`;
    const anchor = [...nav.querySelectorAll('a')].find(a => /create video/i.test(a.textContent));
    (anchor || nav.firstElementChild)?.after(block);
    render();
  }
  function render() {
    const list = document.querySelector('.developer-project-list');
    if (!list) return;
    const items = projects().slice(0, 8);
    list.innerHTML = items.length ? items.map(p => `<a class="website-link" href="/developer.html?project=${encodeURIComponent(p.id)}">▸ ${escapeHtml(p.name || 'Untitled Website')}</a>`).join('') : '<span class="no-websites">No websites yet</span>';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  window.addEventListener('storage', render);
})();
