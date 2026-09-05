// FR8X Enterprise Mobile Interactive Logic
// 100% Standalone Offline-Capable Android Engine

document.addEventListener('DOMContentLoaded', () => {
  // Navigation State
  const tabs = document.querySelectorAll('.nav-tab');
  const pages = document.querySelectorAll('.view-page');
  const titleElem = document.getElementById('current-page-title');

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
      
      // Update Tab UI
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update View Page
      pages.forEach(p => p.classList.remove('active'));
      const activePage = document.getElementById(targetId);
      if (activePage) {
        activePage.classList.add('active');
      }

      if (titleElem && pageTitles[targetId]) {
        titleElem.textContent = pageTitles[targetId];
      }

      // Hide fab on chat screen
      const fab = document.getElementById('fab-post-demand');
      if (fab) {
        fab.style.display = (targetId === 'view-chat' || targetId === 'view-profile') ? 'none' : 'flex';
      }
    });
  });

  // Filter Chips Logic
  const filterChips = document.querySelectorAll('.filter-chip');
  const routeCards = document.querySelectorAll('.route-card');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      const filter = chip.dataset.filter;
      routeCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
      showToast(`Filtered: ${chip.textContent.trim()}`);
    });
  });

  // Live Auction Countdown Timers
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
  startAuctionTimers();

  // Bottom Sheet Controls
  window.openBottomSheet = function(sheetId) {
    const sheet = document.getElementById(sheetId);
    if (sheet) {
      sheet.classList.add('open');
    }
  };

  window.closeBottomSheet = function(sheetId) {
    const sheet = document.getElementById(sheetId);
    if (sheet) {
      sheet.classList.remove('open');
    }
  };

  // Toast Notification System
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
    }, 2400);
  };

  // Bid Placer Modal Logic
  let activeAuctionCard = null;
  let currentBidAmount = 1420;

  window.initiateBid = function(cardId, initialRate, lotName) {
    activeAuctionCard = document.getElementById(cardId);
    currentBidAmount = initialRate - 50; // propose $50 lower
    
    document.getElementById('bid-lot-name').textContent = lotName;
    document.getElementById('bid-target-display').textContent = `$${currentBidAmount}`;
    document.getElementById('bid-current-best').textContent = `$${initialRate}/FEU`;
    
    openBottomSheet('bid-sheet-modal');
  };

  window.adjustBidAmount = function(delta) {
    currentBidAmount = Math.max(200, currentBidAmount + delta);
    document.getElementById('bid-target-display').textContent = `$${currentBidAmount}`;
  };

  window.submitBid = function() {
    if (activeAuctionCard) {
      const bidElem = activeAuctionCard.querySelector('.curr-bid');
      if (bidElem) {
        bidElem.textContent = `$${currentBidAmount}`;
        bidElem.style.color = '#38bdf8';
      }
      const myRankElem = activeAuctionCard.querySelector('.bid-rank-tag');
      if (myRankElem) {
        myRankElem.textContent = '★ YOU ARE LEADING';
        myRankElem.className = 'status-badge badge-green bid-rank-tag';
      }
    }
    closeBottomSheet('bid-sheet-modal');
    showToast(`Bid Submitted: $${currentBidAmount}/FEU (Leading)`);
  };

  // Post New Freight Demand Logic
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
          <span class="status-badge badge-green">● NEWLY BROADCAST</span>
          <span class="cargo-ready-date">${readyDate}</span>
        </div>
        <div class="corridor-row">
          <div class="port-node">
            <span class="port-code">${origin}</span>
            <span class="port-city">Origin Port</span>
          </div>
          <div class="route-arrow-flow">
            <span class="transit-time">DIRECT</span>
            <div class="arrow-line"></div>
          </div>
          <div class="port-node" style="text-align: right;">
            <span class="port-code">${destination}</span>
            <span class="port-city">Destination Port</span>
          </div>
        </div>
        <div class="specs-grid">
          <div class="spec-item">
            <small>Type</small>
            <strong>${containerType}</strong>
          </div>
          <div class="spec-item">
            <small>Status</small>
            <strong>Open RFQ</strong>
          </div>
          <div class="spec-item">
            <small>Quotes</small>
            <strong>0 Received</strong>
          </div>
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

  // Trade Desk Chat Channels
  const chatMessagesData = {
    'maersk': [
      { sender: 'in', text: 'Hi Rajat, we have 5x40HC space confirmed on Maersk Kensington.', time: '10:14 AM' },
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
    document.getElementById('chat-window-screen').style.display = 'flex';
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
      bubble.innerHTML = `
        <div class="bubble-text">${m.text}</div>
        <div class="bubble-meta">${m.time} ${m.sender === 'out' ? '✓✓' : ''}</div>
      `;
      container.appendChild(bubble);
    });
    container.scrollTop = container.scrollHeight;
  }

  window.sendChatMessage = function() {
    const input = document.getElementById('chat-text-input');
    const text = input.value.trim();
    if (!text) return;

    if (!chatMessagesData[activeChatDesk]) {
      chatMessagesData[activeChatDesk] = [];
    }
    chatMessagesData[activeChatDesk].push({
      sender: 'out',
      text: text,
      time: 'Just now'
    });

    input.value = '';
    renderChatMessages();
    showToast('Message sent to carrier desk');
  };

  window.sendQuickReply = function(text) {
    document.getElementById('chat-text-input').value = text;
    window.sendChatMessage();
  };

  // FX & Cost Calculator Logic
  const fxRates = {
    'USD': 1.0,
    'INR': 86.85,
    'EUR': 0.92,
    'AED': 3.67,
    'SGD': 1.34,
    'CNY': 7.24
  };

  window.calculateLandedCost = function() {
    const oceanRate = parseFloat(document.getElementById('calc-ocean').value) || 0;
    const originThc = parseFloat(document.getElementById('calc-thc').value) || 180;
    const baf = parseFloat(document.getElementById('calc-baf').value) || 120;
    const customs = parseFloat(document.getElementById('calc-customs').value) || 85;
    const curr = document.getElementById('calc-currency').value || 'USD';

    const subtotal = oceanRate + originThc + baf + customs;
    const gst = subtotal * 0.18; // 18% GST / Statutory duty
    const totalUsd = subtotal + gst;
    const rateMultiplier = fxRates[curr] || 1.0;
    const totalConverted = (totalUsd * rateMultiplier).toLocaleString('en-US', { maximumFractionDigits: 2 });

    document.getElementById('cost-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cost-tax').textContent = `$${gst.toFixed(2)}`;
    document.getElementById('cost-total-display').textContent = `${curr} ${totalConverted}`;
  };

  // Initialize Calculator on load
  const calcInputs = ['calc-ocean', 'calc-thc', 'calc-baf', 'calc-customs', 'calc-currency'];
  calcInputs.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.addEventListener('input', calculateLandedCost);
    }
  });

  // Pull to refresh simulation
  const viewport = document.querySelector('.viewport');
  let startY = 0;
  viewport.addEventListener('touchstart', e => {
    if (viewport.scrollTop === 0) {
      startY = e.touches[0].pageY;
    }
  }, { passive: true });

  viewport.addEventListener('touchend', e => {
    const endY = e.changedTouches[0].pageY;
    if (viewport.scrollTop === 0 && (endY - startY) > 90) {
      showToast('🔄 Synchronizing live freight rates...');
      setTimeout(() => {
        showToast('✓ Freight Workspace live synced');
      }, 900);
    }
  }, { passive: true });

});
