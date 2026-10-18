/**
 * lib/people-directory.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FR8X Authoritative Member Directory & Fallback State Engine
 *
 * Provides:
 * 1. Seeded real-world freight forwarding professionals (NVOCC, Ocean, Air,
 *    Customs Brokerage, Port Operations across global shipping hubs).
 * 2. In-memory connection state fallback when Supabase service-role keys or
 *    database migration RPCs are pending on the remote database.
 * 3. Unified search, filter, and connection status resolution.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface DirectoryMember {
  id: string;
  display_name: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  designation: string;
  position?: string;
  headline?: string;
  company_name: string;
  company?: string;
  city: string;
  state?: string;
  country: string;
  location?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  avatar_url?: string;
  bio?: string;
  summary?: string;
  is_verified: boolean;
  has_golden_tick: boolean;
  skills: string[];
  specializations: string[];
  key_trade_lanes: string[];
  experiences?: Array<{ title: string; company: string; from: string; to: string; current?: boolean }>;
  privacy_settings?: Record<string, unknown>;
  connection_status?: string;
}

export const SEEDED_MEMBERS: DirectoryMember[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    display_name: 'Capt. Rajesh Sharma',
    first_name: 'Rajesh',
    last_name: 'Sharma',
    designation: 'VP Ocean Operations',
    position: 'Vice President',
    company_name: 'Adani Logistics & Ports',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    is_verified: true,
    has_golden_tick: true,
    skills: ['Ocean Freight', 'Port Operations', 'Customs Clearance', 'Project Cargo'],
    specializations: ['FCL Containerized', 'Breakbulk', 'Vessel Chartering'],
    key_trade_lanes: ['IN-UAE', 'IN-US (East Coast)', 'IN-EU (Rotterdam)'],
    bio: '25+ years commanding global container vessels and leading port terminal operations across Nhava Sheva (JNPT) and Mundra. Specialized in high-volume NVOCC negotiations, hazardous cargo clearance, and multimodal corridor optimization.',
    summary: 'Executive logistics leader driving maritime efficiency and end-to-end supply chain integration for large exporters.',
    experiences: [
      { title: 'VP Ocean Operations', company: 'Adani Logistics & Ports', from: '2020', to: 'Present', current: true },
      { title: 'Director of Maritime Operations', company: 'JNPT Terminal 4', from: '2014', to: '2020' },
      { title: 'Master Mariner / Vessel Captain', company: 'Shipping Corporation of India', from: '2001', to: '2014' },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    display_name: 'Sarah Jenkins',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    designation: 'Head of Global Procurement',
    position: 'Procurement Director',
    company_name: 'Mediterranean Shipping Co (MSC)',
    city: 'London',
    country: 'United Kingdom',
    is_verified: true,
    has_golden_tick: false,
    skills: ['Container Leasing', 'Slot Chartering', 'NVOCC Contracting', 'Ocean Freight'],
    specializations: ['Slot Capacity Trading', 'Fuel Surcharge Hedging', 'Global Carrier Relations'],
    key_trade_lanes: ['UK-US (North Atlantic)', 'EU-APAC', 'UK-IN (Suez Corridor)'],
    bio: 'Senior procurement strategist managing over 120,000 TEUs annually across North Atlantic and Far East maritime lanes. Expert in ocean carrier tier-1 contracting and digital spot booking rate integration.',
    summary: 'Carrier contracting & container slot procurement director.',
    experiences: [
      { title: 'Head of Global Procurement', company: 'Mediterranean Shipping Co', from: '2019', to: 'Present', current: true },
      { title: 'Senior Carrier Manager', company: 'Kuehne + Nagel', from: '2013', to: '2019' },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    display_name: 'Tariq Al-Mansoor',
    first_name: 'Tariq',
    last_name: 'Al-Mansoor',
    designation: 'Managing Director',
    position: 'Executive Director',
    company_name: 'Gulf Freight Forwarders',
    city: 'Dubai',
    state: 'Dubai',
    country: 'UAE',
    is_verified: true,
    has_golden_tick: true,
    skills: ['Air Freight', 'Cold Chain', 'Customs Clearance', 'Trade Finance'],
    specializations: ['Perishables Logistics', 'GCC Cross-Border Trucking', 'Jebel Ali Free Zone'],
    key_trade_lanes: ['UAE-IN', 'ME-AFRICA (East Africa)', 'UAE-EU'],
    bio: 'Pioneer of bonded warehouse and reefer corridor solutions through JAFZA. Advisory board member for Middle East multimodal cargo networks connecting India, Emirates, and European consumer hubs.',
    summary: 'Managing Director of Middle East freight network with deep customs expertise.',
    experiences: [
      { title: 'Managing Director', company: 'Gulf Freight Forwarders', from: '2016', to: 'Present', current: true },
      { title: 'Air Freight Regional VP', company: 'Emirates SkyCargo', from: '2008', to: '2016' },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    display_name: 'Chen Wei',
    first_name: 'Chen',
    last_name: 'Wei',
    designation: 'Senior NVOCC Broker',
    position: 'Chartering Broker',
    company_name: 'Sinotrans Global Logistics',
    city: 'Shanghai',
    country: 'China',
    is_verified: true,
    has_golden_tick: false,
    skills: ['FCL', 'LCL Consolidation', 'Trade Finance', 'Inland Haulage'],
    specializations: ['Trans-Pacific FCL', 'Yangtze River Feeder Logistics', 'Consolidated Cargo'],
    key_trade_lanes: ['CN-US (West Coast)', 'CN-IN', 'CN-EU (Silk Rail)'],
    bio: 'Handling high-density container traffic between Ningbo-Zhoushan, Shanghai Yangshan, and worldwide ports. Specialized in freight forwarder slot-sharing alliances.',
    summary: 'High-volume NVOCC broker based in Shanghai.',
    experiences: [
      { title: 'Senior NVOCC Broker', company: 'Sinotrans Global Logistics', from: '2018', to: 'Present', current: true },
      { title: 'Logistics Operations Lead', company: 'COSCO Shipping Lines', from: '2012', to: '2018' },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    display_name: 'Marcus Vance',
    first_name: 'Marcus',
    last_name: 'Vance',
    designation: 'Director of Multimodal Logistics',
    position: 'Director',
    company_name: 'Vance & Brothers Freight',
    city: 'Chicago',
    state: 'Illinois',
    country: 'United States',
    is_verified: true,
    has_golden_tick: false,
    skills: ['Intermodal', 'Rail Freight', 'Warehousing & Distribution', 'Drayage'],
    specializations: ['Class I Rail Intermodal', 'Inland Port Logistics', 'Cross-Docking'],
    key_trade_lanes: ['US-MX (Cross-Border)', 'US-IN', 'US-EU'],
    bio: 'Midwest intermodal freight veteran bridging rail networks (BNSF, UP) with coastal container terminals. Expert in drayage efficiency and smart cross-dock staging.',
    summary: 'North American intermodal rail & freight operations leader.',
    experiences: [
      { title: 'Director of Multimodal Logistics', company: 'Vance & Brothers Freight', from: '2017', to: 'Present', current: true },
      { title: 'Intermodal Logistics Manager', company: 'BNSF Railway', from: '2010', to: '2017' },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000006',
    display_name: 'Ananya Iyer',
    first_name: 'Ananya',
    last_name: 'Iyer',
    designation: 'Chief Freight Analyst',
    position: 'Lead Analyst',
    company_name: 'Indian Ocean Logistics',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    is_verified: true,
    has_golden_tick: true,
    skills: ['Port Operations', 'Bulk Cargo', 'Trade Finance', 'Freight Forwarding'],
    specializations: ['Dry Bulk Commodities', 'Demurrage Optimization', 'Coastal Shipping'],
    key_trade_lanes: ['IN-SG', 'IN-MY (Strait of Malacca)', 'IN-AU'],
    bio: 'Specialist in bulk vessel fixtures, bunker optimization, and digital maritime contract settlement across Bay of Bengal and Southeast Asian trade routes.',
    summary: 'Maritime economist & freight pricing intelligence consultant.',
    experiences: [
      { title: 'Chief Freight Analyst', company: 'Indian Ocean Logistics', from: '2021', to: 'Present', current: true },
      { title: 'Senior Cargo Underwriter', company: 'Chennai Port Trust', from: '2015', to: '2021' },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000007',
    display_name: 'Klaus Becker',
    first_name: 'Klaus',
    last_name: 'Becker',
    designation: 'Head of Customs & Trade Compliance',
    position: 'Compliance Director',
    company_name: 'Hapag-Lloyd AG',
    city: 'Hamburg',
    country: 'Germany',
    is_verified: true,
    has_golden_tick: false,
    skills: ['Customs Brokerage', 'Trade Compliance', 'Ocean Freight', 'Port Operations'],
    specializations: ['EU Single Window', 'AEO Status Implementation', 'Tariff Classification'],
    key_trade_lanes: ['EU-US', 'EU-IN', 'EU-TURKEY'],
    bio: 'Guiding global shippers through European Union customs modernization, CBAM decarbonization reporting, and cross-border trade harmonization.',
    summary: 'German trade compliance & international customs architecture director.',
    experiences: [
      { title: 'Head of Customs & Trade Compliance', company: 'Hapag-Lloyd AG', from: '2018', to: 'Present', current: true },
      { title: 'Customs Officer & Advisor', company: 'Hamburg Port Authority', from: '2009', to: '2018' },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000008',
    display_name: 'Liam O\'Connor',
    first_name: 'Liam',
    last_name: 'O\'Connor',
    designation: 'VP Supply Chain Solutions',
    position: 'Vice President',
    company_name: 'Kerry Logistics',
    city: 'Singapore',
    country: 'Singapore',
    is_verified: true,
    has_golden_tick: true,
    skills: ['Air Freight', 'Cross-Border Logistics', '3PL/4PL', 'Cold Chain'],
    specializations: ['Changi Air Cargo Hub', 'Regional DC Network', 'Semiconductor Logistics'],
    key_trade_lanes: ['SG-US', 'APAC-EU', 'SG-IN'],
    bio: 'Overseeing multimodal fulfillment and high-value cargo transport across Southeast Asia. Pioneer in temperature-controlled pharmaceutical supply chains.',
    summary: 'Southeast Asia VP of supply chain solutions and global air freight.',
    experiences: [
      { title: 'VP Supply Chain Solutions', company: 'Kerry Logistics', from: '2019', to: 'Present', current: true },
      { title: 'Regional Air Freight Director', company: 'DHL Global Forwarding', from: '2011', to: '2019' },
    ],
  },
];

// ── In-Memory Connection State Manager for Fallback ───────────────────────────

export interface InMemRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'withdrawn';
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface InMemNotification {
  id: string;
  user_id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  target_url?: string;
  related_id?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

class PeopleDirectoryStore {
  private requests: Map<string, InMemRequest> = new Map();
  private acceptedPairs: Set<string> = new Set();
  private blocks: Set<string> = new Set();
  private dynamicMembers: Map<string, DirectoryMember> = new Map();

  constructor() {
    // Seed an initial mutual connection for realistic experience
    const initialPair = 'a0000000-0000-0000-0000-000000000001:a0000000-0000-0000-0000-000000000002';
    this.acceptedPairs.add(initialPair);
    this.acceptedPairs.add('a0000000-0000-0000-0000-000000000002:a0000000-0000-0000-0000-000000000001');
  }

  private pairKey(a: string, b: string): string {
    return `${a}:${b}`;
  }

  public registerMember(member: DirectoryMember) {
    if (!member.id) return;
    this.dynamicMembers.set(member.id, member);
  }

  public getAllMembers(): DirectoryMember[] {
    const isProduction = process.env.NODE_ENV === 'production';
    // In production, never return dummy or fabricated seeded members
    const list: DirectoryMember[] = isProduction ? [] : [...SEEDED_MEMBERS];
    const seenIds = new Set(list.filter((m) => m && m.id).map((m) => String(m.id).toLowerCase()));
    const seenEmails = new Set(list.map((m) => (m.email || '').toString().toLowerCase()).filter(Boolean));

    for (const dm of this.dynamicMembers.values()) {
      if (!dm || !dm.id) continue;
      const dmId = String(dm.id).toLowerCase();
      const dmEmail = (dm.email || '').toString().toLowerCase();
      if (!seenIds.has(dmId) && (!dmEmail || !seenEmails.has(dmEmail))) {
        seenIds.add(dmId);
        if (dmEmail) seenEmails.add(dmEmail);
        list.push(dm);
      }
    }
    return list;
  }

  public getMemberById(id: string): DirectoryMember | null {
    if (!id) return null;
    if (this.dynamicMembers.has(id)) return this.dynamicMembers.get(id)!;
    const seeded = SEEDED_MEMBERS.find((m) => m.id === id);
    if (seeded) return seeded;
    // Check if matched by email or identifier
    for (const m of this.dynamicMembers.values()) {
      if (m.email?.toLowerCase() === id.toLowerCase()) return m;
    }
    return null;
  }

  public searchMembers(params: {
    query?: string;
    country?: string | null;
    city?: string | null;
    industry?: string | null;
    company?: string | null;
    skills?: string[] | null;
    verifiedOnly?: boolean;
    viewerId?: string;
  }): Array<DirectoryMember & { connection_status: string; mutual_count: number; rank: number }> {
    const q = (params.query || '').trim().toLowerCase();
    const viewerId = params.viewerId || '00000000-0000-0000-0000-000000000000';
    const allMembers = this.getAllMembers();

    return allMembers.filter((m) => {
      // Exclude self
      if (m.id === viewerId) return false;

      // Exclude blocked members
      if (this.isBlocked(viewerId, m.id) || this.isBlocked(m.id, viewerId)) {
        return false;
      }

      // Respect allowDiscovery setting
      const ps = (m.privacy_settings as Record<string, unknown> | null) ?? {};
      if (ps.allowDiscovery === false) return false;

      // Filter by verified
      if (params.verifiedOnly && !m.is_verified && !m.has_golden_tick) {
        return false;
      }

      // Filter by country
      if (params.country && (!m.country || m.country.toLowerCase() !== params.country.toLowerCase())) {
        return false;
      }

      // Filter by city
      if (params.city && (!m.city || !m.city.toLowerCase().includes(params.city.toLowerCase()))) {
        return false;
      }

      // Filter by company
      if (params.company && (!m.company_name || !m.company_name.toLowerCase().includes(params.company.toLowerCase()))) {
        return false;
      }

      // Filter by skills
      if (params.skills && params.skills.length > 0) {
        const hasSkill = params.skills.some((sk) =>
          (m.skills || []).some((ms) => (ms || '').toString().toLowerCase().includes((sk || '').toString().toLowerCase()))
        );
        if (!hasSkill) return false;
      }

      // Text query match across name, headline, designation, company, city, country, skills
      if (q) {
        const textToSearch = [
          m.display_name,
          m.full_name,
          m.first_name,
          m.last_name,
          m.headline,
          m.designation,
          m.company_name,
          m.company,
          m.city,
          m.country,
          ...(m.skills || []),
          ...(m.specializations || []),
          ...(m.key_trade_lanes || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!textToSearch.includes(q)) return false;
      }

      return true;
    }).map((m) => {
      const status = this.getConnectionStatus(viewerId, m.id);
      const fullName = m.full_name || m.display_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'FR8X Member';
      const headline = m.headline || m.designation || m.position || '';
      const company = m.company || m.company_name || '';
      const location = m.location || [m.city, m.country].filter(Boolean).join(', ') || '';

      return {
        ...m,
        full_name: fullName,
        headline,
        company,
        location,
        connection_status: status.status === 'none' ? 'not_connected' : status.status,
        request_id: status.request_id,
        mutual_count: m.id === 'a0000000-0000-0000-0000-000000000001' ? 4 : 1,
        rank: 1.0,
      };
    });
  }

  public getConnectionStatus(viewerId: string, targetId: string): { status: string; request_id?: string } {
    if (this.isBlocked(viewerId, targetId)) return { status: 'blocked' };
    if (this.isBlocked(targetId, viewerId)) return { status: 'none' };
    if (this.acceptedPairs.has(this.pairKey(viewerId, targetId))) return { status: 'connected' };

    // Check pending sent
    for (const req of this.requests.values()) {
      if (req.requester_id === viewerId && req.recipient_id === targetId && req.status === 'pending') {
        return { status: 'pending_sent', request_id: req.id };
      }
      if (req.requester_id === targetId && req.recipient_id === viewerId && req.status === 'pending') {
        return { status: 'pending_received', request_id: req.id };
      }
    }

    return { status: 'none' };
  }

  // In-memory notifications store for fallback and realtime sync
  private notifications: Map<string, InMemNotification[]> = new Map();

  public addNotification(notif: InMemNotification) {
    const list = this.notifications.get(notif.user_id) || [];
    // Deduplicate by related_id or id
    if (notif.related_id && list.some((n) => n.related_id === notif.related_id)) {
      return;
    }
    list.unshift(notif);
    this.notifications.set(notif.user_id, list.slice(0, 100));
  }

  public getNotifications(userId: string): InMemNotification[] {
    return this.notifications.get(userId) || [];
  }

  public getUnreadNotificationCount(userId: string): number {
    const list = this.notifications.get(userId) || [];
    return list.filter((n) => !n.read).length;
  }

  public markNotificationRead(userId: string, notifId?: string): boolean {
    const list = this.notifications.get(userId);
    if (!list) return false;
    if (notifId) {
      list.forEach((n) => { if (n.id === notifId) n.read = true; });
    } else {
      list.forEach((n) => { n.read = true; });
    }
    return true;
  }

  public clearNotifications(userId: string, notifId?: string): boolean {
    if (!notifId) {
      this.notifications.set(userId, []);
      return true;
    }
    const list = this.notifications.get(userId) || [];
    this.notifications.set(userId, list.filter((n) => n.id !== notifId));
    return true;
  }

  public upsertRequest(req: InMemRequest) {
    this.requests.set(req.id, req);
  }

  public upsertConnection(userId: string, targetId: string) {
    this.acceptedPairs.add(this.pairKey(userId, targetId));
    this.acceptedPairs.add(this.pairKey(targetId, userId));
  }

  public sendRequest(requesterId: string, recipientId: string, message?: string): { success: boolean; request_id: string } {
    const existing = this.getConnectionStatus(requesterId, recipientId);
    if (existing.status !== 'none' && existing.status !== 'not_connected') {
      return { success: false, request_id: existing.request_id || '' };
    }

    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
    const req: InMemRequest = {
      id,
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
      message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.requests.set(id, req);

    // Create notification for recipient in memory store
    const requester = this.getMemberById(requesterId);
    const requesterName = requester?.display_name || requester?.full_name || 'A freight colleague';
    this.addNotification({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
      user_id: recipientId,
      type: 'connection_request',
      category: 'network',
      title: `${requesterName} sent you a connection request`,
      description: message ? `"${message.slice(0, 150)}"` : 'Review and respond to grow your professional freight network.',
      target_url: '/connections?tab=incoming',
      related_id: id,
      read: false,
      metadata: {
        requester_id: requesterId,
        request_id: id,
        requester_name: requesterName,
        requester_company: requester?.company_name || requester?.company || '',
        requester_avatar: requester?.avatar_url || '',
      },
      created_at: new Date().toISOString(),
    });

    return { success: true, request_id: id };
  }

  public acceptRequest(userId: string, requestId: string): boolean {
    const req = this.requests.get(requestId);
    if (!req || req.recipient_id !== userId || req.status !== 'pending') return false;

    req.status = 'accepted';
    req.updated_at = new Date().toISOString();
    this.acceptedPairs.add(this.pairKey(req.requester_id, req.recipient_id));
    this.acceptedPairs.add(this.pairKey(req.recipient_id, req.requester_id));

    // Mark recipient's connection request notification as read
    const notifs = this.notifications.get(userId) || [];
    notifs.forEach((n) => {
      if (n.related_id === requestId) n.read = true;
    });

    // Send "connection_accepted" notification to original requester
    const acceptor = this.getMemberById(userId);
    const acceptorName = acceptor?.display_name || acceptor?.full_name || 'Your contact';
    this.addNotification({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
      user_id: req.requester_id,
      type: 'connection_accepted',
      category: 'network',
      title: `${acceptorName} accepted your connection request`,
      description: 'You are now connected. Direct contact credentials and instant trade chat are unlocked.',
      target_url: '/connections?tab=connections',
      related_id: `accepted_${requestId}`,
      read: false,
      metadata: {
        acceptor_id: userId,
        request_id: requestId,
        acceptor_name: acceptorName,
        acceptor_company: acceptor?.company_name || acceptor?.company || '',
        acceptor_avatar: acceptor?.avatar_url || '',
      },
      created_at: new Date().toISOString(),
    });

    return true;
  }

  public declineRequest(userId: string, requestId: string): boolean {
    const req = this.requests.get(requestId);
    if (!req || req.recipient_id !== userId || req.status !== 'pending') return false;

    req.status = 'declined';
    req.updated_at = new Date().toISOString();

    const notifs = this.notifications.get(userId) || [];
    notifs.forEach((n) => {
      if (n.related_id === requestId) n.read = true;
    });

    return true;
  }

  public cancelRequest(userId: string, requestId?: string, targetId?: string): { success: boolean; code?: string; error?: string } {
    let req: InMemRequest | undefined;
    if (requestId) {
      req = this.requests.get(requestId);
    }
    if (!req && targetId) {
      for (const r of this.requests.values()) {
        if (r.recipient_id === targetId && r.status === 'pending') {
          req = r;
          break;
        }
      }
    }
    if (req && req.requester_id !== userId) {
      return { success: false, code: 'FORBIDDEN', error: 'Not authorized to cancel this request.' };
    }
    if (!req || req.status !== 'pending') {
      return { success: true };
    }

    req.status = 'withdrawn';
    req.updated_at = new Date().toISOString();

    // Mark recipient's notification as read and note withdrawal
    const recipientNotifs = this.notifications.get(req.recipient_id) || [];
    recipientNotifs.forEach((n) => {
      if (n.related_id === req!.id) {
        n.read = true;
        n.description = 'This connection request was withdrawn by the sender.';
      }
    });

    return { success: true };
  }

  public removeConnection(userId: string, targetId: string): boolean {
    this.acceptedPairs.delete(this.pairKey(userId, targetId));
    this.acceptedPairs.delete(this.pairKey(targetId, userId));
    return true;
  }

  public blockUser(blockerId: string, blockedId: string): boolean {
    this.blocks.add(this.pairKey(blockerId, blockedId));
    this.removeConnection(blockerId, blockedId);
    return true;
  }

  public unblockUser(blockerId: string, blockedId: string): boolean {
    this.blocks.delete(this.pairKey(blockerId, blockedId));
    return true;
  }

  public isBlocked(blockerId: string, blockedId: string): boolean {
    return this.blocks.has(this.pairKey(blockerId, blockedId));
  }

  public getConnections(userId: string): DirectoryMember[] {
    const list: DirectoryMember[] = [];
    const all = this.getAllMembers();
    for (const member of all) {
      if (this.acceptedPairs.has(this.pairKey(userId, member.id))) {
        list.push(member);
      }
    }
    // Also include any accepted pairs for dynamic / test users
    for (const pair of this.acceptedPairs) {
      const parts = pair.split(':');
      if (parts.length === 2) {
        const otherId = parts[0] === userId ? parts[1] : parts[1] === userId ? parts[0] : null;
        if (otherId && !list.some((m) => m.id === otherId)) {
          const found = this.getMemberById(otherId);
          if (found) {
            list.push(found);
          } else {
            list.push({
              id: otherId,
              display_name: 'FR8X Member',
              full_name: 'FR8X Member',
              first_name: 'FR8X',
              last_name: 'Member',
              headline: 'Freight Forwarding Specialist',
              designation: 'Logistics Professional',
              company: 'FR8X Network',
              company_name: 'FR8X Network',
              city: '',
              country: '',
              location: '',
              avatar_url: '',
              is_verified: false,
              has_golden_tick: false,
              skills: ['Freight Forwarding', 'Logistics'],
              specializations: [],
              key_trade_lanes: [],
              connection_status: 'connected',
            });
          }
        }
      }
    }
    return list;
  }

  public getIncoming(userId: string): Array<InMemRequest & { requester?: DirectoryMember }> {
    const list: Array<InMemRequest & { requester?: DirectoryMember }> = [];
    for (const req of this.requests.values()) {
      if (req.recipient_id === userId && req.status === 'pending') {
        const requester = this.getMemberById(req.requester_id) || undefined;
        list.push({ ...req, requester });
      }
    }
    return list;
  }

  public getOutgoing(userId: string): Array<InMemRequest & { recipient?: DirectoryMember }> {
    const list: Array<InMemRequest & { recipient?: DirectoryMember }> = [];
    for (const req of this.requests.values()) {
      if (req.requester_id === userId && req.status === 'pending') {
        const recipient = this.getMemberById(req.recipient_id) || undefined;
        list.push({ ...req, recipient });
      }
    }
    return list;
  }

  public getWithdrawn(userId: string): Array<InMemRequest & { recipient?: DirectoryMember }> {
    const list: Array<InMemRequest & { recipient?: DirectoryMember }> = [];
    for (const req of this.requests.values()) {
      if (req.requester_id === userId && (req.status === 'cancelled' || (req as any).status === 'withdrawn')) {
        const recipient = this.getMemberById(req.recipient_id) || undefined;
        list.push({ ...req, recipient });
      }
    }
    return list;
  }

  public getBlocked(userId: string): DirectoryMember[] {
    const list: DirectoryMember[] = [];
    for (const member of SEEDED_MEMBERS) {
      if (this.isBlocked(userId, member.id)) {
        list.push(member);
      }
    }
    return list;
  }
}

export const peopleDirectoryStore = new PeopleDirectoryStore();
export const registerMember = (member: DirectoryMember) => peopleDirectoryStore.registerMember(member);
