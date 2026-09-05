// FR8X Enterprise Mobile v3.0 — Native Interactive Logic
// Handles: Splash → Login → App Shell, all interactions

'use strict';

// =========================================================
// DEMO USERS (offline auth — replace with real API)
// =========================================================
const DEMO_USERS = [
  { uid: 'demo', password: 'demo123', name: 'Rajat Kumar Rai', initials: 'RK' },
  { uid: 'admin', password: 'admin123', name: 'FR8X Admin', initials: 'FA' },
  { uid: 'rajat@fr8x.in', password: 'demo123', name: 'Rajat Kumar Rai', initials: 'RK' }
];

let currentUser = null;
let passwordVisible = false;

// =========================================================
// SPLASH SCREEN
// =========================================================
function runSplash() {
  const fill = document.getElementById('splash-fill');
  let width = 0;
  const speed = 25; // ms per step

  const interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval);
      setTimeout(hideSplash, 200);
    } else {
      // Slow middle, fast end — simulates loading perception
      const increment = width < 70 ? 1.8 : width < 90 ? 0.8 : 2.5;
      width = Math.min(100, width + increment);
      fill.style.width = width + '%';
    }
  }, speed);
}

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  splash.classList.add('fade-out');
  setTimeout(() => {
    splash.style.display = 'none';
    // Check saved session
    const saved = loadSavedSession();
    if (saved) {
      loginUser(saved);
    } else {
      showLoginScreen();
    }
  }, 500);
}

function showLoginScreen() {
  const ls = document.getElementById('login-screen');
  ls.style.display = 'block';
  // Pre-fill remembered user
  const rem = localStorage.getItem('fr8x_mobile_remember');
  if (rem) {
    try {
      const data = JSON.parse(rem);
      document.getElementById('login-uid').value = data.uid || '';
      document.getElementById('login-pass').value = data.pass || '';
      document.getElementById('login-remember').checked = true;
    } catch(e) {}
  }
}

function loadSavedSession() {
  try {
    const sess = sessionStorage.getItem('fr8x_mobile_session');
    if (sess) return JSON.parse(sess);
  } catch(e) {}
  return null;
}

// =========================================================
// LOGIN
// =========================================================
window.handleMobileLogin = function(e) {
  e.preventDefault();
  const uid = document.getElementById('login-uid').value.trim();
  const pass = document.getElementById('login-pass').value;
  const remember = document.getElementById('login-remember').checked;

  if (!uid || !pass) {
    showLoginError('Please enter your User ID and password.');
    return;
  }

  // Show spinner
  setLoginLoading(true);

  // Simulate network delay (replace with real fetch to /api/auth/login)
  setTimeout(() => {
    const user = DEMO_USERS.find(u =>
      (u.uid.toLowerCase() === uid.toLowerCase()) && u.password === pass
    );

    setLoginLoading(false);

    if (user) {
      if (remember) {
        localStorage.setItem('fr8x_mobile_remember', JSON.stringify({ uid, pass }));
      } else {
        localStorage.removeItem('fr8x_mobile_remember');
      }
      sessionStorage.setItem('fr8x_mobile_session', JSON.stringify(user));
      loginUser(user);
    } else {
      showLoginError('Invalid credentials. Please check your User ID and password.');
      document.getElementById('login-pass').value = '';
      vibrateError();
    }
  }, 1100);
};

function loginUser(user) {
  currentUser = user;
  const ls = document.getElementById('login-screen');
  ls.classList.add('slide-out');

  setTimeout(() => {
    ls.style.display = 'none';
    ls.classList.remove('slide-out');
    // Update user info in UI
    const avatarBtn = document.getElementById('user-avatar-btn');
    const avatarLarge = document.getElementById('profile-avatar-large');
    const displayName = document.getElementById('profile-display-name');
    if (avatarBtn) avatarBtn.textContent = user.initials || 'RK';
    if (avatarLarge) avatarLarge.textContent = user.initials || 'RK';
    if (displayName) displayName.textContent = user.name || 'Enterprise User';

    const appRoot = document.getElementById('app-root');
    appRoot.style.display = 'flex';
    initApp();
    showToast('Welcome back, ' + (user.name.split(' ')[0] || 'User') + ' 👋');
  }, 400);
}

function showLoginError(msg) {
  const banner = document.getElementById('login-error');
  const text = document.getElementById('login-error-text');
  text.textContent = msg;
  banner.style.display = 'flex';
  setTimeout(() => { banner.style.display = 'none'; }, 4000);
}

function setLoginLoading(loading) {
  const btn = document.getElementById('login-btn');
  const btnText = document.getElementById('login-btn-text');
  const spinner = document.getElementById('login-spinner');
  btn.disabled = loading;
  btnText.style.display = loading ? 'none' : 'block';
  spinner.style.display = loading ? 'block' : 'none';
}

window.togglePassword = function() {
  const input = document.getElementById('login-pass');
  const icon = document.getElementById('eye-icon');
  passwordVisible = !passwordVisible;
  input.type = passwordVisible ? 'text' : 'password';
  if (passwordVisible) {
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
};

window.simulateBiometric = function() {
  showToast('🔐 Biometric scan initiated...');
  setTimeout(() => {
    const defaultUser = DEMO_USERS[0];
    sessionStorage.setItem('fr8x_mobile_session', JSON.stringify(defaultUser));
    loginUser(defaultUser);
  }, 1400);
};

// =========================================================
// FORGOT PASSWORD FLOW
// =========================================================
window.openForgotFlow = function() {
  const overlay = document.getElementById('forgot-overlay');
  overlay.style.display = 'flex';
};

window.closeForgotFlow = function() {
  const overlay = document.getElementById('forgot-overlay');
  overlay.style.display = 'none';
  document.getElementById('forgot-step-1').style.display = 'block';
  document.getElementById('forgot-step-2').style.display = 'none';
};

window.sendResetOTP = function() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address');
    return;
  }
  showToast('OTP dispatched to ' + email);
  document.getElementById('forgot-step-1').style.display = 'none';
  document.getElementById('forgot-step-2').style.display = 'block';
};

window.confirmResetPassword = function() {
  const otp = document.getElementById('forgot-otp').value.trim();
  const newpass = document.getElementById('forgot-newpass').value.trim();
  if (!otp || otp.length < 6) {
    showToast('Please enter the 6-digit OTP');
    return;
  }
  if (!newpass || newpass.length < 8) {
    showToast('Password must be at least 8 characters');
    return;
  }
  showToast('✓ Password reset successful! Please sign in.');
  closeForgotFlow();
};

// =========================================================
// LOGOUT
// =========================================================
window.confirmLogout = function() {
  openBottomSheet('logout-confirm-sheet');
};

window.doLogout = function() {
  sessionStorage.removeItem('fr8x_mobile_session');
  currentUser = null;
  closeBottomSheet('logout-confirm-sheet');
  const appRoot = document.getElementById('app-root');
  appRoot.style.display = 'none';
  showLoginScreen();
  showToast('Signed out successfully');
};

// =========================================================
// APP INITIALIZATION
// =========================================================
function initApp() {
  initNavigation();
  initFilterChips();
  startAuctionTimers();
  initCalculator();
  initPullToRefresh();
}

// =========================================================
// NAVIGATION
// =========================================================
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const pages = document.querySelectorAll('.view-page');
  const pageTitles = {
    'view-feed': 'Freight Demands',
    'view-auctions': 'Reverse Auctions',
    'view-chat': 'Trade Desk Chat',
    'view-calc': 'FX & Cost Calculator',
    'view-profile': 'Enterprise Profile'
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      pages.forEach(p => p.classList.remove('active'));
      const activePage = document.getElementById(targetId);
      if (activePage) activePage.classList.add('active');

      const fab = document.getElementById('fab-post-demand');
      if (fab) {
        fab.style.display = (targetId === 'view-chat' || targetId === 'view-profile') ? 'none' : 'flex';
      }
    });
  });
}

// =========================================================
// FILTER CHIPS
// =========================================================
function initFilterChips() {
  const filterChips = document.querySelectorAll('.filter-chip');
  const routeCards = document.querySelectorAll('.route-card');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      routeCards.forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? 'block' : 'none';
      });
      showToast('Filtered: ' + chip.textContent.trim());
    });
  });
}

// =========================================================
// AUCTION COUNTDOWN TIMERS
// =========================================================
function startAuctionTimers() {
  const timerElements = document.querySelectorAll('[data-countdown]');
  timerElements.forEach(elem => {
    let seconds = parseInt(elem.dataset.countdown, 10) || 7200;
    setInterval(() => {
      if (seconds > 0) {
        seconds--;
        const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        elem.textContent = `${hrs}:${mins}:${secs}`;
      } else {
        elem.textContent = 'CLOSED';
        elem.style.color = '#f43f5e';
      }
    }, 1000);
  });
}

// =========================================================
// BOTTOM SHEET CONTROLS
// =========================================================
window.openBottomSheet = function(sheetId) {
  const sheet = document.getElementById(sheetId);
  if (sheet) sheet.style.display = 'flex';
};

window.closeBottomSheet = function(sheetId) {
  const sheet = document.getElementById(sheetId);
  if (sheet) sheet.style.display = 'none';
};

// =========================================================
// TOAST NOTIFICATION
// =========================================================
window.showToast = function(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>⚡</span><span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
};

// =========================================================
// BID PLACEMENT
// =========================================================
let activeAuctionCard = null;
let currentBidAmount = 1420;

window.initiateBid = function(cardId, initialRate, lotName) {
  activeAuctionCard = document.getElementById(cardId);
  currentBidAmount = initialRate - 50;
  document.getElementById('bid-lot-name').textContent = lotName;
  document.getElementById('bid-target-display').textContent = `$${currentBidAmount.toLocaleString()}`;
  document.getElementById('bid-current-best').textContent = `$${initialRate.toLocaleString()}/FEU`;
  openBottomSheet('bid-sheet-modal');
};

window.adjustBidAmount = function(delta) {
  currentBidAmount = Math.max(100, currentBidAmount + delta);
  document.getElementById('bid-target-display').textContent = `$${currentBidAmount.toLocaleString()}`;
};

window.submitBid = function() {
  if (activeAuctionCard) {
    const bidElem = activeAuctionCard.querySelector('.curr-bid');
    if (bidElem) {
      bidElem.textContent = `$${currentBidAmount.toLocaleString()}`;
      bidElem.style.color = '#38bdf8';
    }
    const myRankElem = activeAuctionCard.querySelector('.bid-rank-tag');
    if (myRankElem) {
      myRankElem.textContent = '★ YOU ARE LEADING';
      myRankElem.className = 'status-badge badge-green bid-rank-tag';
    }
  }
  closeBottomSheet('bid-sheet-modal');
  showToast(`Bid Submitted: $${currentBidAmount.toLocaleString()}/FEU (You're Leading!)`);
};

// =========================================================
// POST FREIGHT DEMAND
// =========================================================
window.submitNewDemand = function(event) {
  event.preventDefault();
  const origin = document.getElementById('demand-origin').value || 'INNSA';
  const destination = document.getElementById('demand-dest').value || 'NLRTM';
  const containerType = document.getElementById('demand-type').value || "40' HC";
  const readyDate = document.getElementById('demand-ready').value || 'Ready Now';
  const targetRate = document.getElementById('demand-rate').value || '1950';

  const cardContainer = document.getElementById('demands-list');
  if (cardContainer) {
    const newCard = document.createElement('div');
    newCard.className = 'route-card';
    newCard.dataset.category = 'fcl';
    newCard.innerHTML = `
      <div class="card-top">
        <span class="status-badge badge-green">&#9679; NEWLY BROADCAST</span>
        <span class="cargo-ready-date">${readyDate}</span>
      </div>
      <div class="corridor-row">
        <div class="port-node"><span class="port-code">${origin}</span><span class="port-city">Origin Port</span></div>
        <div class="route-arrow-flow"><span class="transit-time">DIRECT</span><div class="arrow-line"></div></div>
        <div class="port-node" style="text-align:right;"><span class="port-code">${destination}</span><span class="port-city">Destination Port</span></div>
      </div>
      <div class="specs-grid">
        <div class="spec-item"><small>Type</small><strong>${containerType}</strong></div>
        <div class="spec-item"><small>Status</small><strong>Open RFQ</strong></div>
        <div class="spec-item"><small>Quotes</small><strong>0 Received</strong></div>
      </div>
      <div class="card-bottom">
        <div class="rate-box">
          <span class="rate-label">Target Shipper Rate</span>
          <span class="rate-amount">$${targetRate} <span style="font-size:11px;color:var(--text-muted);">/FEU</span></span>
        </div>
        <div class="card-actions">
          <button class="btn-sm btn-secondary touch-press" onclick="showToast('Tender link copied')">Share</button>
          <button class="btn-sm btn-primary touch-press" onclick="showToast('Opening responses...')">View Bids</button>
        </div>
      </div>
    `;
    cardContainer.insertBefore(newCard, cardContainer.firstChild);
  }
  closeBottomSheet('post-demand-modal');
  showToast(`Tender Broadcasted: ${origin} → ${destination}`);
};

// =========================================================
// TRADE DESK CHAT
// =========================================================
const chatMessagesData = {
  'maersk': [
    { sender: 'in', text: 'Hi, we have 5x40HC space confirmed on Maersk Kensington.', time: '10:14 AM' },
    { sender: 'out', text: 'Great. Can you match the target rate of $1,920/FEU from Nhava Sheva to Rotterdam?', time: '10:15 AM' },
    { sender: 'in', text: 'Approved by pricing desk! Booking note draft has been issued.', time: '10:18 AM' }
  ],
  'hapag': [
    { sender: 'in', text: 'Greetings from Hapag-Lloyd. Regarding your Mundra to New York inquiry...', time: '09:40 AM' },
    { sender: 'out', text: 'Yes, looking for 3x20GP ready for loading by Tuesday.', time: '09:45 AM' }
  ],
  'port': [
    { sender: 'in', text: 'Port CFS Gate Alert: Container BMOU482910 has passed gate customs clearance.', time: '08:30 AM' }
  ],
  'customs': [
    { sender: 'in', text: 'Shipping bill #892014 filing validated with ICEGATE successfully.', time: 'Yesterday' }
  ]
};

let activeChatDesk = 'maersk';

window.openChatRoom = function(deskKey, deskName) {
  activeChatDesk = deskKey;
  document.getElementById('chat-active-name').textContent = deskName;
  document.getElementById('chat-rooms-screen').style.display = 'none';
  const chatWin = document.getElementById('chat-window-screen');
  chatWin.style.display = 'flex';
  renderChatMessages();
};

window.closeChatWindow = function() {
  document.getElementById('chat-window-screen').style.display = 'none';
  document.getElementById('chat-rooms-screen').style.display = 'flex';
};

function renderChatMessages() {
  const container = document.getElementById('chat-messages-body');
  if (!container) return;
  container.innerHTML = '';
  const msgs = chatMessagesData[activeChatDesk] || [];
  msgs.forEach(m => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${m.sender}`;
    bubble.innerHTML = `<div class="bubble-text">${m.text}</div><div class="bubble-meta">${m.time} ${m.sender === 'out' ? '&#10003;&#10003;' : ''}</div>`;
    container.appendChild(bubble);
  });
  container.scrollTop = container.scrollHeight;
}

window.sendChatMessage = function() {
  const input = document.getElementById('chat-text-input');
  const text = input.value.trim();
  if (!text) return;
  if (!chatMessagesData[activeChatDesk]) chatMessagesData[activeChatDesk] = [];
  chatMessagesData[activeChatDesk].push({ sender: 'out', text: text, time: 'Just now' });
  input.value = '';
  renderChatMessages();
  showToast('Message sent to carrier desk');
};

window.sendQuickReply = function(text) {
  document.getElementById('chat-text-input').value = text;
  window.sendChatMessage();
};

// =========================================================
// FX & LANDED COST CALCULATOR
// =========================================================
const fxRates = { USD: 1.0, INR: 86.85, EUR: 0.9218, AED: 3.6725, SGD: 1.3450, CNY: 7.2400 };

function initCalculator() {
  calculateLandedCost();
}

window.calculateLandedCost = function() {
  const oceanRate = parseFloat(document.getElementById('calc-ocean')?.value) || 0;
  const originThc = parseFloat(document.getElementById('calc-thc')?.value) || 180;
  const baf = parseFloat(document.getElementById('calc-baf')?.value) || 120;
  const customs = parseFloat(document.getElementById('calc-customs')?.value) || 85;
  const curr = document.getElementById('calc-currency')?.value || 'USD';

  const subtotal = oceanRate + originThc + baf + customs;
  const gst = subtotal * 0.18;
  const totalUsd = subtotal + gst;
  const rateMultiplier = fxRates[curr] || 1.0;
  const totalConverted = (totalUsd * rateMultiplier).toLocaleString('en-US', { maximumFractionDigits: 2 });

  const subtotalEl = document.getElementById('cost-subtotal');
  const taxEl = document.getElementById('cost-tax');
  const totalEl = document.getElementById('cost-total-display');

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${gst.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `${curr} ${totalConverted}`;
};

// =========================================================
// PULL TO REFRESH
// =========================================================
function initPullToRefresh() {
  const viewport = document.querySelector('.viewport');
  if (!viewport) return;
  let startY = 0;
  viewport.addEventListener('touchstart', e => {
    if (viewport.scrollTop === 0) startY = e.touches[0].pageY;
  }, { passive: true });
  viewport.addEventListener('touchend', e => {
    const endY = e.changedTouches[0].pageY;
    if (viewport.scrollTop === 0 && (endY - startY) > 90) {
      showToast('🔄 Synchronizing live freight rates...');
      setTimeout(() => showToast('✓ Freight Workspace live synced'), 900);
    }
  }, { passive: true });
}

// =========================================================
// HAPTIC / VIBRATION HELPER
// =========================================================
function vibrateError() {
  if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
}

// =========================================================
// STARTUP
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  runSplash();
});
