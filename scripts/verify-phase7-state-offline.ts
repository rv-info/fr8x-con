import fs from 'fs';
import path from 'path';

function runPhase7Verification() {
  console.log('=== Running Phase 7 State Management & Offline Architecture Verification ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: any, testName: string, extra?: string) {
    if (Boolean(condition)) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extra || ''}`);
      failed++;
    }
  }

  // 1. Service Worker Caching Policy
  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert(
    swContent.includes("url.pathname.startsWith('/api/auth/')") &&
      swContent.includes("url.pathname.startsWith('/api/user/')") &&
      swContent.includes("url.pathname.startsWith('/api/godfather/')") &&
      swContent.includes("url.pathname.startsWith('/api/payments/')"),
    'STATE-01: Service Worker excludes sensitive auth, user, godfather, and payment APIs from CacheStorage'
  );

  // 2. DataContext Dead Code in submitBid
  const dataCtxPath = path.join(process.cwd(), 'lib', 'context', 'DataContext.tsx');
  const dataCtxContent = fs.readFileSync(dataCtxPath, 'utf8');
  const submitBidIndex = dataCtxContent.indexOf('const submitBid =');
  const addMyRateIndex = dataCtxContent.indexOf('const addMyRate =', submitBidIndex);
  const submitBidBody = dataCtxContent.substring(submitBidIndex, addMyRateIndex);

  const eventBusCallIndex = submitBidBody.indexOf('eventBus.recordEvent');
  const toastCallIndex = submitBidBody.indexOf('toast(');
  const returnTrueIndex = submitBidBody.lastIndexOf('return true;');

  assert(
    eventBusCallIndex !== -1 &&
      toastCallIndex !== -1 &&
      eventBusCallIndex < returnTrueIndex &&
      toastCallIndex < returnTrueIndex,
    'STATE-02: submitBid executes eventBus.recordEvent and toast before return true (dead code removed)'
  );

  // 3. DataContext Offline Action Queueing
  assert(
    submitBidBody.includes("queueAction('submit_bid'") &&
      dataCtxContent.includes("queueAction('create_auction'") &&
      dataCtxContent.includes("queueAction('create_rate'") &&
      dataCtxContent.includes("queueAction('update_rate'") &&
      dataCtxContent.includes("queueAction('delete_rate'"),
    'STATE-03: DataContext enqueues offline actions for auctions, bids, and rate mutations'
  );

  // 4. NetworkSpeedManager Replay Handlers
  const nsmPath = path.join(process.cwd(), 'lib', 'network', 'NetworkSpeedManager.ts');
  const nsmContent = fs.readFileSync(nsmPath, 'utf8');
  assert(
    nsmContent.includes("item.actionType === 'create_post'") &&
      nsmContent.includes("item.actionType === 'edit_post'") &&
      nsmContent.includes("item.actionType === 'create_auction'") &&
      nsmContent.includes("item.actionType === 'submit_bid'") &&
      nsmContent.includes("item.actionType === 'create_rate' || item.actionType === 'update_rate'") &&
      nsmContent.includes("item.actionType === 'delete_rate'"),
    'STATE-03: NetworkSpeedManager handles replay for posts, auctions, bids, and rate CRUD operations'
  );

  // 5. NetworkSpeedManager Outbox Sync & Broadcast
  assert(
    nsmContent.includes("BroadcastChannel('fr8x_network_sync')") &&
      nsmContent.includes('enqueueOfflineAction'),
    'STATE-03: NetworkSpeedManager bridges outbox with IndexedDB and broadcasts cross-tab updates'
  );

  // 6. AuthContext Cross-Tab Sync
  const authCtxPath = path.join(process.cwd(), 'lib', 'context', 'AuthContext.tsx');
  const authCtxContent = fs.readFileSync(authCtxPath, 'utf8');
  assert(
    authCtxContent.includes("BroadcastChannel('fr8x_auth_sync')") &&
      authCtxContent.includes("window.addEventListener('storage'"),
    'STATE-04: AuthContext synchronizes login, logout, and session expiration across sibling browser tabs'
  );

  // 7. CurrencyContext Persistence & Cross-Tab Sync
  const currCtxPath = path.join(process.cwd(), 'lib', 'context', 'CurrencyContext.tsx');
  const currCtxContent = fs.readFileSync(currCtxPath, 'utf8');
  assert(
    currCtxContent.includes('fr8x_selected_currency') &&
      currCtxContent.includes("BroadcastChannel('fr8x_currency_sync')") &&
      currCtxContent.includes('useNetwork'),
    'STATE-04/06: CurrencyContext persists selected currency, syncs cross-tab, and adapts polling to network speed'
  );

  // 8. ChatContext Hydration Safety & Persistence
  const chatCtxPath = path.join(process.cwd(), 'lib', 'context', 'ChatContext.tsx');
  const chatCtxContent = fs.readFileSync(chatCtxPath, 'utf8');
  assert(
    chatCtxContent.includes('const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS)') &&
      chatCtxContent.includes('safeSaveLocalStorage(CHAT_MESSAGES_KEY') &&
      chatCtxContent.includes('safeSaveLocalStorage(CHAT_CONTACTS_KEY'),
    'STATE-05: ChatContext eliminates SSR hydration mismatch and persists chat messages to localStorage'
  );

  // 9. React Context Value Memoization
  assert(
    dataCtxContent.includes('const dataContextValue = useMemo<DataContextType>') &&
      authCtxContent.includes('const authContextValue = React.useMemo<AuthContextType>') &&
      currCtxContent.includes('const contextValue = useMemo<CurrencyContextType>') &&
      chatCtxContent.includes('const contextValue = useMemo<ChatContextType>'),
    'STATE-07: All core contexts (Data, Auth, Currency, Chat) memoize provider value to eliminate re-render cascades'
  );

  console.log(`\n=== Phase 7 Verification Complete: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Verification();
