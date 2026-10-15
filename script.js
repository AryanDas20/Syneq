(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE = {
    theme: 'syneq_theme',
    profile: 'syneq_profile',
    tourDone: 'syneq_tour_completed',
    tips: 'syneq_tip_index'
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const memoryStorage = Object.create(null);
  let storageWarningShown = false;

  const state = {
    theme: 'dark',
    profile: null,
    tourIndex: 0,
    searchIndex: 0,
    searchResults: [],
    toastCounter: 0,
    bootTimer: null,
    tourReturnFocus: null
  };

  const tourSteps = [
    { selector: '#home .hero-copy', title: 'Welcome to SYNEQ.', description: 'This is the starting point: a quick introduction to the studio, two products, and the idea behind the ecosystem. Use the main calls to action to jump into the products or start a full walkthrough.' },
    { selector: '#products .section-heading', title: 'Meet the two products.', description: 'UniTrade focuses on campus circularity - buying, selling, renting, borrowing, bartering, and donating. OrbitX focuses on fitness and wellbeing, from adaptive training to budget-aware food tracking. Each button opens its live product website.' },
    { selector: '#ecosystem .section-heading', title: 'Explore what each product can do.', description: 'Use the UniTrade and OrbitX tabs to switch the detailed capability list without leaving the page. Review use cases, benefits, and the intended product direction before opening the live platforms.' },
    { selector: '#signals .signals-head', title: 'See the design principles.', description: 'These are the principles shaping SYNEQ: understand the real context first, explain suggestions, connect the experience end to end, and adapt quietly instead of overwhelming people.' },
    { selector: '#impact .impact-copy', title: 'Understand the impact framework.', description: 'The impact dashboard groups outcomes around circular value, healthy routines, clarity, and community access. These are design goals, not verified business metrics - real results should only be published with a clear measurement method.' },
    { selector: '#about .about-top', title: 'Read the SYNEQ objective.', description: 'The About section explains why the studio exists and the principles behind its products: useful over noisy, transparency by default, real-world constraints, and continuous feedback.' },
    { selector: '#team .section-heading', title: 'Meet the contributors.', description: 'The contributor cards include bios, skills, photos, and social links. Aryan and Pranay have LinkedIn and GitHub links; Chandan has a GitHub link, while LinkedIn is intentionally disabled because no profile URL was supplied.' },
    { selector: '#toolkit .utility-panel', title: 'Open the control room.', description: 'Change the theme, replay the full tour, take a full-page PNG screenshot, export a JSON snapshot, generate a personalized PDF, or download the complete SYNEQ project guide. Name and theme are saved in localStorage on this browser only.' },
    { selector: '#next .closing-copy', title: 'Take the next step.', description: 'Use these calls to action to open UniTrade or OrbitX directly. They open in a new tab so you can keep the SYNEQ website available.' },
    { selector: '#footer .footer-main', title: 'You have reached the whole site.', description: 'The footer provides another route to products, the objective, contributor section, field notes, and project guide. Keyboard shortcuts also make navigation faster: press / for search, T for theme, G for tour, P for profile, Shift+S for screenshot, or ? for shortcuts.' }
  ];

  const searchItems = [
    { title: 'Home / SYNEQ introduction', detail: 'Hero and ecosystem overview', icon: '⌂', target: '#home' },
    { title: 'UniTrade', detail: 'Campus circular marketplace · product website', icon: '↻', target: '#products', external: 'https://unitradeneo.vercel.app/' },
    { title: 'OrbitX', detail: 'AI-driven campus fitness and health · product website', icon: '✳', target: '#products', external: 'https://xorbit-ruby.vercel.app/' },
    { title: 'Product capabilities', detail: 'Switch between UniTrade and OrbitX features', icon: '⊞', target: '#ecosystem' },
    { title: 'SYNEQ design principles', detail: 'Human-centred, transparent, adaptive technology', icon: '◎', target: '#signals' },
    { title: 'Impact framework', detail: 'Circular value, wellbeing, clarity, and community', icon: '⌁', target: '#impact' },
    { title: 'About SYNEQ', detail: 'Company objective and guiding principles', icon: 'S', target: '#about' },
    { title: 'Contributors', detail: 'Aryan Das, Pranay Kathpaul, Chandan Singh', icon: '♙', target: '#team' },
    { title: 'Field notes and tools', detail: 'Tips, screenshot, theme, export, PDF tools', icon: '⌘', target: '#toolkit' },
    { title: 'Guided website tour', detail: 'Step-by-step walkthrough of all 10 areas', icon: '▷', action: 'tour' },
    { title: 'Switch light / dark mode', detail: 'Change website appearance', icon: '☼', action: 'theme' },
    { title: 'Your local profile', detail: 'Save a display name and optional email', icon: '◉', action: 'account' },
    { title: 'Keyboard shortcuts', detail: 'Review all shortcut keys', icon: '⌨', action: 'shortcuts' },
    { title: 'Take screenshot', detail: 'Save the page as a PNG image', icon: '▣', action: 'screenshot' },
    { title: 'Export website state', detail: 'Download a JSON snapshot', icon: '⇩', action: 'export' },
    { title: 'Generate personal PDF', detail: 'Create a named browser-side product summary', icon: '▧', action: 'report' },
    { title: 'Download project guide', detail: 'Complete concept and implementation document', icon: '▤', action: 'guide', file: 'SYNEQ-Project-Guide.pdf' },
    { title: 'Back to top', detail: 'Return to the hero', icon: '↑', target: '#home' }
  ];

  function safeRead(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? (Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : fallback) : JSON.parse(value);
    } catch (_) {
      return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : fallback;
    }
  }

  function safeWrite(key, value) {
    memoryStorage[key] = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      if (!storageWarningShown) {
        storageWarningShown = true;
        showToast('Limited browser storage', 'Settings still work for this visit, but may not persist in this browser mode. Use a local server for reliable saved preferences.', 'error');
      }
      return false;
    }
  }

  function safeRemove(key) {
    delete memoryStorage[key];
    try { localStorage.removeItem(key); } catch (_) { /* storage is optional */ }
  }

  function showToast(title, message, type = 'success') {
    const region = $('#toastRegion');
    if (!region) return;
    const toast = document.createElement('div');
    toast.className = `toast${type === 'error' ? ' is-error' : ''}`;
    toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${type === 'error' ? '!' : '✓'}</span><div><strong></strong><p></p></div>`;
    $('strong', toast).textContent = title;
    $('p', toast).textContent = message;
    region.appendChild(toast);
    window.setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(12px)';
      window.setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  function openModal(modal, focusSelector) {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    window.setTimeout(() => {
      const focusTarget = focusSelector ? $(focusSelector, modal) : $('button, input, a', modal);
      focusTarget?.focus({ preventScroll: true });
    }, 50);
  }

  function closeModal(modal) {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    const anyOpen = $$('.modal-backdrop').some(item => !item.hidden) || !$('#tourScrim').hidden;
    if (!anyOpen) document.body.classList.remove('modal-open');
  }

  function closeAllModals() {
    $$('.modal-backdrop').forEach(modal => { modal.hidden = true; });
    stopTour(false);
    document.body.classList.remove('modal-open');
  }

  // Boot sequence: acts as a designed loading/re-entry moment, but is skippable.
  function runBootSequence() {
    const screen = $('#bootScreen');
    if (!screen) return;
    const bar = $('#bootBar');
    const percent = $('#bootPercent');
    const message = $('#bootMessage');
    const skip = () => {
      if (state.bootTimer) window.clearInterval(state.bootTimer);
      if (bar) bar.style.width = '100%';
      if (percent) percent.textContent = '100%';
      screen.classList.add('is-done');
      window.setTimeout(() => screen.remove(), 800);
    };
    $('#skipBoot')?.addEventListener('click', skip, { once: true });
    if (reducedMotion) {
      window.setTimeout(skip, 250);
      return;
    }
    const stages = [
      { at: 18, text: 'Warming up the idea engine' },
      { at: 42, text: 'Connecting the product ecosystem' },
      { at: 69, text: 'Restoring your local preferences' },
      { at: 89, text: 'Preparing the experience' }
    ];
    let progress = 0;
    state.bootTimer = window.setInterval(() => {
      progress = Math.min(100, progress + (progress < 45 ? 4 : 6));
      if (bar) bar.style.width = `${progress}%`;
      if (percent) percent.textContent = `${String(progress).padStart(2, '0')}%`;
      const stage = stages.filter(item => progress >= item.at).pop();
      if (stage && message) message.textContent = stage.text;
      if (progress >= 100) {
        window.clearInterval(state.bootTimer);
        window.setTimeout(skip, 180);
      }
    }, 45);
  }

  function setTheme(theme, announce = true) {
    state.theme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = state.theme;
    const metaTheme = $('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = state.theme === 'dark' ? '#0a0b10' : '#f4f5f8';
    const label = state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    $('#themeToggle')?.setAttribute('aria-label', label);
    $('.theme-glyph', $('#themeToggle') || document)?.replaceChildren(document.createTextNode(state.theme === 'dark' ? '☼' : '☾'));
    safeWrite(STORAGE.theme, state.theme);
    if (announce) showToast('Appearance updated', `${state.theme === 'dark' ? 'Dark' : 'Light'} mode is now active.`);
  }

  function initTheme() {
    const saved = safeRead(STORAGE.theme, 'dark');
    setTheme(saved === 'light' ? 'light' : 'dark', false);
    $('#themeToggle')?.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
    $('#utilityTheme')?.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  }

  function initials(name) {
    return (String(name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || '?');
  }

  function renderProfile() {
    const profile = state.profile;
    const buttonText = $('#accountButtonText');
    const avatar = $('#headerAvatar');
    const welcome = $('#welcomeNote');
    const welcomeText = $('#welcomeText');
    const logout = $('#logoutButton');
    if (profile) {
      if (buttonText) buttonText.textContent = profile.name.split(/\s+/)[0] || 'Your space';
      if (avatar) avatar.textContent = initials(profile.name);
      if (welcome) welcome.hidden = false;
      if (welcomeText) welcomeText.textContent = `Welcome, ${profile.name}. Your local space is ready.`;
      if (logout) logout.hidden = false;
    } else {
      if (buttonText) buttonText.textContent = 'Your space';
      if (avatar) avatar.textContent = '?';
      if (welcome) welcome.hidden = true;
      if (logout) logout.hidden = true;
    }
  }

  function initProfile() {
    const saved = safeRead(STORAGE.profile, null);
    state.profile = saved && typeof saved.name === 'string' ? saved : null;
    renderProfile();
    $('#accountButton')?.addEventListener('click', () => {
      const nameInput = $('#profileName');
      const emailInput = $('#profileEmail');
      if (state.profile) {
        nameInput.value = state.profile.name || '';
        emailInput.value = state.profile.email || '';
      } else {
        nameInput.value = '';
        emailInput.value = '';
      }
      openModal($('#accountModal'), '#profileName');
    });
    $('#accountForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const name = $('#profileName').value.trim();
      const email = $('#profileEmail').value.trim();
      if (!name) {
        $('#profileName').focus();
        showToast('A display name is required', 'Add a name to personalize your page.', 'error');
        return;
      }
      state.profile = { name: name.slice(0, 60), email: email.slice(0, 140), updatedAt: new Date().toISOString() };
      safeWrite(STORAGE.profile, state.profile);
      renderProfile();
      closeModal($('#accountModal'));
      showToast('Your space is saved', `Welcome, ${state.profile.name}. This profile stays in this browser.`);
    });
    $('#logoutButton')?.addEventListener('click', () => {
      state.profile = null;
      safeRemove(STORAGE.profile);
      renderProfile();
      closeModal($('#accountModal'));
      showToast('Logged out', 'The local display profile has been removed from this browser.');
    });
  }

  function initNavigation() {
    const header = $('#siteHeader');
    const progress = $('#scrollProgress');
    const nav = $('#mainNav');
    const menu = $('#menuToggle');
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (header) header.classList.toggle('scrolled', scrollTop > 12);
      if (progress) progress.style.width = `${max > 0 ? (scrollTop / max) * 100 : 0}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    menu?.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menu.classList.toggle('is-open', open);
    });
    $$('#mainNav a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menu?.classList.remove('is-open');
      menu?.setAttribute('aria-expanded', 'false');
    }));
    $('#backTop')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
    $('#dockTop')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
  }

  function initRevealAndActiveNav() {
    const reveals = $$('.reveal');
    if ('IntersectionObserver' in window && !reducedMotion) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.11, rootMargin: '0px 0px -35px 0px' });
      reveals.forEach(el => observer.observe(el));
    } else {
      reveals.forEach(el => el.classList.add('is-visible'));
    }

    if ('IntersectionObserver' in window) {
      const sections = $$('main section[id]');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          $$('#mainNav a').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
        });
      }, { threshold: 0, rootMargin: '-32% 0px -58% 0px' });
      sections.forEach(section => observer.observe(section));
    }
  }

  function initCapabilityTabs() {
    const tabs = $$('[data-cap-tab]');
    const panels = $$('[data-cap-panel]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.capTab;
        tabs.forEach(item => {
          const active = item === tab;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', String(active));
          item.tabIndex = active ? 0 : -1;
        });
        panels.forEach(panel => {
          const active = panel.dataset.capPanel === id;
          panel.hidden = !active;
          panel.classList.toggle('is-active', active);
        });
      });
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const index = tabs.indexOf(tab);
        const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        next.focus();
        next.click();
      });
    });
  }

  function initContributorImages() {
    $$('.team-photo').forEach(img => {
      const wrap = img.closest('.team-photo-wrap');
      img.addEventListener('error', () => wrap?.classList.add('photo-missing'), { once: true });
      if (img.complete && img.naturalWidth === 0) wrap?.classList.add('photo-missing');
    });
  }

  const tips = [
    { category: 'PRODUCTIVITY', text: 'Make a tool earn its place: if it adds friction without creating value, simplify the flow.' },
    { category: 'WELLBEING', text: 'Aim for the smallest healthy action you can repeat on a busy day. Consistency is easier to build than perfection.' },
    { category: 'CIRCULARITY', text: 'Before buying new, check whether a useful item already exists nearby. Access can be more valuable than ownership.' },
    { category: 'DIGITAL SAFETY', text: 'Share only the information a tool truly needs. A local prototype should never ask for passwords, OTPs, or financial credentials.' },
    { category: 'AI LITERACY', text: 'Treat an AI-generated suggestion as a starting point. Ask what it assumes, verify important claims, and keep human judgment in the loop.' }
  ];

  function renderTip(index, animate = true) {
    const tip = tips[(index + tips.length) % tips.length];
    const card = $('.tip-card');
    if (!tip) return;
    if (animate && card && !reducedMotion) {
      card.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0.2, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, easing: 'ease-out' });
    }
    $('#tipCounter').textContent = `FIELD NOTE ${String(index + 1).padStart(2, '0')} / ${String(tips.length).padStart(2, '0')}`;
    $('#tipText').textContent = tip.text;
    $('#tipCategory').textContent = tip.category;
    state.tipIndex = index;
    safeWrite(STORAGE.tips, index);
  }

  function initTips() {
    const saved = safeRead(STORAGE.tips, 0);
    renderTip(Number.isInteger(saved) ? saved : 0, false);
    $('#nextTip')?.addEventListener('click', () => renderTip((state.tipIndex + 1) % tips.length));
    $('#shareTip')?.addEventListener('click', async () => {
      const tip = tips[state.tipIndex || 0];
      const text = `SYNEQ FIELD NOTE / ${tip.category}\n${tip.text}`;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Field note copied', 'The current tip is ready to paste.');
      } catch (_) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        showToast(copied ? 'Field note copied' : 'Copy not available', copied ? 'The current tip is ready to paste.' : 'Select the note text and copy it manually.', copied ? 'success' : 'error');
      }
    });
  }

  function buildSnapshotData() {
    const currentProfile = state.profile ? { name: state.profile.name, email: state.profile.email || '' } : null;
    return {
      product: 'SYNEQ',
      generatedAt: new Date().toISOString(),
      profile: currentProfile,
      preferences: { theme: state.theme },
      products: [
        { name: 'UniTrade', category: 'Campus circular marketplace', url: 'https://unitradeneo.vercel.app/', capabilities: ['Buy', 'Sell', 'Rent', 'Borrow', 'Barter', 'Donate', 'Looking For requests', 'Lost and Found suggestions', 'Starter bundles', 'Digital notes', 'Vacation Hold'] },
        { name: 'OrbitX', category: 'AI-driven campus fitness and health ecosystem', url: 'https://xorbit-ruby.vercel.app/', capabilities: ['AI-personalized workout routines', 'Food and macronutrient tracking', 'Budget-aware nutrition ideas', 'Activity and habit tracking', 'Sleep and recovery insights', 'Gamified milestones'] }
      ],
      studioObjective: 'Build digital products that turn everyday friction into clearer choices, healthier habits, and shared value.',
      principles: ['Useful over noisy', 'Transparent by default', 'Built for real constraints', 'Better with feedback'],
      importantNotes: [
        'The website profile and theme are saved in localStorage on this browser only.',
        'This is a front-end prototype, not secure production authentication.',
        'AI, fitness, pricing, and sustainability estimates require validation and should not be treated as guaranteed outcomes.',
        'No backend, real payments, protected data storage, or production identity verification are configured by this site.'
      ]
    };
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function slugify(text) {
    return String(text || 'visitor').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || 'visitor';
  }

  function exportData() {
    const data = buildSnapshotData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const name = state.profile?.name || 'visitor';
    downloadBlob(`SYNEQ-data-${slugify(name)}.json`, blob);
    showToast('Data snapshot exported', 'A JSON file with product details, preferences, and prototype notes has been downloaded.');
  }

  async function captureScreenshot() {
    if (typeof window.html2canvas !== 'function') {
      showToast('Screenshot tool could not load', 'Check your internet connection and reload the page. The capture library is loaded from a public CDN.', 'error');
      return;
    }
    const button = $('#screenshotButton');
    if (button) {
      button.disabled = true;
      button.dataset.originalText = $('strong', button.querySelector('span:nth-child(2)'))?.textContent || '';
    }
    showToast('Preparing screenshot', 'Capturing the full page. This can take a moment on long pages.');
    try {
      const target = $('#main-content');
      const canvas = await window.html2canvas(target, {
        backgroundColor: state.theme === 'dark' ? '#080a10' : '#f4f5f8',
        scale: Math.min(1.5, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: false,
        logging: false,
        windowWidth: document.documentElement.clientWidth,
        scrollX: 0,
        scrollY: -window.scrollY,
        ignoreElements: element => element.classList?.contains('floating-dock') || element.classList?.contains('toast-region') || element.classList?.contains('boot-screen')
      });
      const dataUrl = canvas.toDataURL('image/png');
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      downloadBlob(`SYNEQ-page-snapshot-${new Date().toISOString().slice(0, 10)}.png`, blob);
      showToast('Screenshot saved', 'The page snapshot was downloaded as a PNG image.');
    } catch (error) {
      console.error('Screenshot failed:', error);
      showToast('Could not capture this page', 'A cross-origin image or browser memory limit may have blocked the screenshot. Try again after the page finishes loading.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function generatePersonalPdf() {
    const data = buildSnapshotData();
    const JsPdf = window.jspdf?.jsPDF;
    if (!JsPdf) {
      showToast('PDF generator could not load', 'Use Download project guide for the complete static PDF, or check the internet connection and reload for the personalized PDF.', 'error');
      return;
    }
    const doc = new JsPdf({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;
    const date = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    const addPageIfNeeded = (height = 8) => {
      if (y + height > pageHeight - 18) {
        doc.addPage();
        y = 20;
        doc.setTextColor(80, 88, 106);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('SYNEQ / PERSONAL PRODUCT SUMMARY', margin, 12);
        doc.setDrawColor(220, 222, 230);
        doc.line(margin, 15, pageWidth - margin, 15);
      }
    };
    const heading = (text, size = 17) => {
      addPageIfNeeded(13);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.setTextColor(25, 29, 42);
      doc.text(text, margin, y);
      y += size >= 15 ? 9 : 7;
    };
    const paragraph = (text, opts = {}) => {
      const { size = 10, color = [77, 85, 101], indent = 0 } = opts;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(String(text), maxWidth - indent);
      const lineHeight = size * 0.48;
      addPageIfNeeded(lines.length * lineHeight + 4);
      doc.text(lines, margin + indent, y);
      y += lines.length * lineHeight + 4;
    };
    const bullet = text => {
      doc.setFillColor(255, 101, 70);
      doc.circle(margin + 1.5, y - 1.2, 1, 'F');
      paragraph(text, { size: 9, indent: 6 });
    };

    doc.setFillColor(8, 10, 16);
    doc.rect(0, 0, pageWidth, 66, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('S Y N E Q', margin, 24);
    doc.setTextColor(255, 111, 76);
    doc.setFontSize(8);
    doc.text('INDEPENDENT SYSTEMS STUDIO', margin, 31);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(25);
    doc.text('Your product snapshot', margin, 47);
    doc.setTextColor(191, 199, 214);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Prepared for ${data.profile?.name || 'SYNEQ visitor'}`, margin, 57);
    doc.text(date, pageWidth - margin, 57, { align: 'right' });
    y = 79;
    heading('01 / Your local space');
    paragraph(`Display name: ${data.profile?.name || 'No profile name saved'}`);
    if (data.profile?.email) paragraph(`Email entered: ${data.profile.email}`);
    paragraph(`Current appearance preference: ${data.preferences.theme} mode. Profile and theme are stored in this browser's localStorage. This export is generated in your browser and is not uploaded to SYNEQ.`);
    heading('02 / Product suite');
    data.products.forEach(product => {
      heading(product.name, 13);
      paragraph(product.category, { size: 9, color: product.name === 'UniTrade' ? [207, 78, 54] : [28, 145, 159] });
      paragraph(product.name === 'UniTrade'
        ? 'A campus-first circular marketplace concept that helps students discover nearby items and exchange them through buying, selling, renting, borrowing, bartering, and donation.'
        : 'An AI-driven campus fitness and health ecosystem concept combining personalized workout planning, nutrition awareness, activity habits, sleep, and recovery in one experience.');
      paragraph(`Website: ${product.url}`, { size: 9 });
      paragraph('Capability map:');
      product.capabilities.forEach(item => bullet(item));
      y += 2;
    });
    heading('03 / The SYNEQ objective');
    paragraph(data.studioObjective, { size: 11, color: [35, 42, 56] });
    heading('04 / Product principles');
    data.principles.forEach(item => bullet(item));
    heading('05 / Prototype boundaries');
    data.importantNotes.forEach(item => bullet(item));
    paragraph('This snapshot is an informational overview and is not an authentication credential, a medical recommendation, a verified impact report, or a guarantee of product functionality.', { size: 8, color: [108, 115, 128] });
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(220, 222, 230);
      doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(125, 132, 145);
      doc.text('SYNEQ / BROWSER-GENERATED PERSONAL SUMMARY', margin, pageHeight - 8);
      doc.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
    doc.save(`SYNEQ-personal-report-${slugify(data.profile?.name || 'visitor')}.pdf`);
    showToast('Personal PDF generated', 'Your PDF includes your display name, product summaries, principles, and prototype boundaries.');
  }

  function initUtilityActions() {
    $('#screenshotButton')?.addEventListener('click', captureScreenshot);
    $('#exportDataButton')?.addEventListener('click', exportData);
    $('#generateReportButton')?.addEventListener('click', generatePersonalPdf);
    $('#dockSearch')?.addEventListener('click', openSearch);
    $('#dockShortcuts')?.addEventListener('click', () => openModal($('#shortcutsModal')));
    $('#dockTour')?.addEventListener('click', () => startTour(0));
  }

  function openSearch() {
    const modal = $('#searchModal');
    openModal(modal, '#siteSearch');
    $('#siteSearch').value = '';
    renderSearchResults('');
  }

  function executeSearchItem(item) {
    closeModal($('#searchModal'));
    if (!item) return;
    if (item.external) {
      window.open(item.external, '_blank', 'noopener,noreferrer');
      return;
    }
    switch (item.action) {
      case 'tour': startTour(0); return;
      case 'theme': setTheme(state.theme === 'dark' ? 'light' : 'dark'); return;
      case 'account': $('#accountButton')?.click(); return;
      case 'shortcuts': openModal($('#shortcutsModal')); return;
      case 'screenshot': captureScreenshot(); return;
      case 'export': exportData(); return;
      case 'report': generatePersonalPdf(); return;
      case 'guide': {
        const anchor = document.createElement('a');
        anchor.href = item.file;
        anchor.download = item.file;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        return;
      }
      default: break;
    }
    if (item.target) {
      $(item.target)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      if (item.target === '#ecosystem' && item.title.toLowerCase().includes('unitrade')) $('[data-cap-tab="unitrade"]')?.click();
      if (item.target === '#ecosystem' && item.title.toLowerCase().includes('orbitx')) $('[data-cap-tab="orbitx"]')?.click();
    }
  }

  function renderSearchResults(query) {
    const list = $('#searchResults');
    if (!list) return;
    const normalized = query.trim().toLowerCase();
    state.searchResults = searchItems.filter(item => !normalized || `${item.title} ${item.detail}`.toLowerCase().includes(normalized));
    state.searchIndex = Math.min(state.searchIndex, Math.max(0, state.searchResults.length - 1));
    list.replaceChildren();
    if (!state.searchResults.length) {
      const empty = document.createElement('div');
      empty.className = 'search-empty';
      empty.textContent = 'No matches yet. Try “UniTrade”, “team”, “PDF”, or “theme”.';
      list.appendChild(empty);
      return;
    }
    state.searchResults.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `search-result${index === state.searchIndex ? ' is-selected' : ''}`;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(index === state.searchIndex));
      button.innerHTML = '<span class="search-result-icon" aria-hidden="true"></span><span class="search-result-text"><strong></strong><small></small></span><span aria-hidden="true">↗</span>';
      $('.search-result-icon', button).textContent = item.icon;
      $('strong', button).textContent = item.title;
      $('small', button).textContent = item.detail;
      button.addEventListener('mouseenter', () => selectSearchResult(index));
      button.addEventListener('click', () => executeSearchItem(item));
      list.appendChild(button);
    });
  }

  function selectSearchResult(index) {
    state.searchIndex = Math.max(0, Math.min(index, state.searchResults.length - 1));
    $$('.search-result', $('#searchResults')).forEach((button, buttonIndex) => {
      const selected = buttonIndex === state.searchIndex;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-selected', String(selected));
    });
  }

  function initSearch() {
    $('#searchOpen')?.addEventListener('click', openSearch);
    $('#siteSearch')?.addEventListener('input', event => {
      state.searchIndex = 0;
      renderSearchResults(event.target.value);
    });
    $('#siteSearch')?.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectSearchResult((state.searchIndex + 1) % state.searchResults.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectSearchResult((state.searchIndex - 1 + state.searchResults.length) % state.searchResults.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        executeSearchItem(state.searchResults[state.searchIndex]);
      }
    });
  }

  function startTour(startIndex = 0) {
    if (!tourSteps.length) return;
    state.tourReturnFocus = document.activeElement;
    state.tourIndex = Math.max(0, Math.min(startIndex, tourSteps.length - 1));
    const scrim = $('#tourScrim');
    scrim.hidden = false;
    document.body.classList.add('modal-open');
    renderTourStep();
    $('#tourNext')?.focus({ preventScroll: true });
  }

  function renderTourStep() {
    const step = tourSteps[state.tourIndex];
    if (!step) return;
    const target = $(step.selector);
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
      if (!reducedMotion) target.classList.add('tour-target-flash');
      window.setTimeout(() => target.classList.remove('tour-target-flash'), 1100);
    }
    $('#tourStepCount').textContent = `STEP ${String(state.tourIndex + 1).padStart(2, '0')} / ${String(tourSteps.length).padStart(2, '0')}`;
    $('#tourTitle').textContent = step.title;
    $('#tourDescription').textContent = step.description;
    $('#tourProgress').style.width = `${((state.tourIndex + 1) / tourSteps.length) * 100}%`;
    $('#tourBack').disabled = state.tourIndex === 0;
    $('#tourNext').innerHTML = state.tourIndex === tourSteps.length - 1 ? 'Finish <span>✓</span>' : 'Next <span>→</span>';
    const dots = $('#tourDots');
    dots.replaceChildren();
    tourSteps.forEach((_, index) => {
      const dot = document.createElement('i');
      dot.classList.toggle('is-active', index === state.tourIndex);
      dots.appendChild(dot);
    });
    window.setTimeout(positionTourSpotlight, reducedMotion ? 0 : 420);
  }

  function positionTourSpotlight() {
    const spotlight = $('#tourSpotlight');
    const target = $(tourSteps[state.tourIndex]?.selector);
    const card = $('#tourCard');
    if (!spotlight || !target || !card) return;
    const rect = target.getBoundingClientRect();
    const width = Math.max(70, Math.min(rect.width + 18, window.innerWidth - 24));
    const height = Math.max(46, Math.min(rect.height + 18, Math.max(90, window.innerHeight * .48)));
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12));
    let top = rect.top + rect.height / 2 - height / 2;
    top = Math.max(12, Math.min(top, window.innerHeight - height - card.offsetHeight - 28));
    spotlight.style.display = 'block';
    spotlight.style.width = `${width}px`;
    spotlight.style.height = `${height}px`;
    spotlight.style.left = `${left}px`;
    spotlight.style.top = `${top}px`;
    spotlight.style.borderRadius = '14px';
  }

  function stopTour(announce = false) {
    const scrim = $('#tourScrim');
    if (!scrim || scrim.hidden) return;
    scrim.hidden = true;
    document.body.classList.remove('modal-open');
    safeWrite(STORAGE.tourDone, true);
    if (announce) showToast('Tour complete', 'You have explored all 10 areas of the SYNEQ website.');
    const focusTarget = state.tourReturnFocus;
    if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: true });
  }

  function initTour() {
    $$('[data-start-tour]').forEach(button => button.addEventListener('click', () => startTour(0)));
    $('#tourClose')?.addEventListener('click', () => stopTour(false));
    $('#tourBack')?.addEventListener('click', () => {
      state.tourIndex = Math.max(0, state.tourIndex - 1);
      renderTourStep();
    });
    $('#tourNext')?.addEventListener('click', () => {
      if (state.tourIndex >= tourSteps.length - 1) {
        stopTour(true);
        return;
      }
      state.tourIndex += 1;
      renderTourStep();
    });
    window.addEventListener('resize', () => {
      if (!$('#tourScrim').hidden) positionTourSpotlight();
    });
    $('#tourScrim')?.addEventListener('click', event => {
      if (event.target === $('#tourScrim')) stopTour(false);
    });
  }

  function initModals() {
    $$('[data-close-modal]').forEach(button => {
      button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop')));
    });
    $$('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => {
      if (event.target === backdrop) closeModal(backdrop);
    }));
    $('#dockShortcuts')?.addEventListener('click', () => openModal($('#shortcutsModal')));
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    return target.isContentEditable || ['input', 'textarea', 'select'].includes(tag);
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', event => {
      const typing = isTypingTarget(event.target);
      if (event.key === 'Escape') {
        if (!$('#tourScrim').hidden) stopTour(false);
        $$('.modal-backdrop').forEach(modal => closeModal(modal));
        document.body.classList.remove('modal-open');
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '/' && !event.shiftKey) {
        event.preventDefault();
        openSearch();
      } else if (event.key.toLowerCase() === 't' && !event.shiftKey) {
        setTheme(state.theme === 'dark' ? 'light' : 'dark');
      } else if (event.key.toLowerCase() === 'g') {
        startTour(0);
      } else if (event.key.toLowerCase() === 'p') {
        $('#accountButton')?.click();
      } else if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault();
        openModal($('#shortcutsModal'));
      } else if (event.key.toLowerCase() === 's' && event.shiftKey) {
        event.preventDefault();
        captureScreenshot();
      }
    });
  }

  function initProductHoverEffects() {
    if (reducedMotion || !window.matchMedia('(pointer:fine)').matches) return;
    $$('.product-card, .team-card, .signal-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--pointer-x', `${x}%`);
        card.style.setProperty('--pointer-y', `${y}%`);
      });
    });
  }

  function initProductLinks() {
    $$('a[target="_blank"]').forEach(anchor => {
      anchor.addEventListener('click', () => {
        // Let the browser open the external product/profile link; no fake success state.
      });
    });
  }

  function init() {
    runBootSequence();
    initTheme();
    initProfile();
    initNavigation();
    initRevealAndActiveNav();
    initCapabilityTabs();
    initContributorImages();
    initTips();
    initUtilityActions();
    initSearch();
    initTour();
    initModals();
    initKeyboardShortcuts();
    initProductHoverEffects();
    initProductLinks();
    $('#currentYear').textContent = String(new Date().getFullYear());
    $('#utilityTheme')?.setAttribute('aria-label', 'Toggle light and dark mode');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
