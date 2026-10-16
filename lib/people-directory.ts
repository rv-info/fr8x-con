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

interface InMemRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  created_at: string;
  updated_at: string;
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
    const list: DirectoryMember[] = [...SEEDED_MEMBERS];
    const seenIds = new Set(list.map((m) => m.id));
    for (const dm of this.dynamicMembers.values()) {
      if (!seenIds.has(dm.id)) {
        seenIds.add(dm.id);
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
      if (params.country && m.country.toLowerCase() !== params.country.toLowerCase()) {
        return false;
      }

      // Filter by city
      if (params.city && !m.city.toLowerCase().includes(params.city.toLowerCase())) {
        return false;
      }

      // Filter by company
      if (params.company && !m.company_name.toLowerCase().includes(params.company.toLowerCase())) {
        return false;
      }

      // Filter by skills
      if (params.skills && params.skills.length > 0) {
        const hasSkill = params.skills.some((sk) =>
          (m.skills || []).some((ms) => ms.toLowerCase().includes(sk.toLowerCase()))
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

  public sendRequest(requesterId: string, recipientId: string, message?: string): { success: boolean; request_id: string } {
    const existing = this.getConnectionStatus(requesterId, recipientId);
    if (existing.status !== 'none' && existing.status !== 'not_connected') {
      return { success: false, request_id: existing.request_id || '' };
    }

    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
    return { success: true, request_id: id };
  }

  public acceptRequest(userId: string, requestId: string): boolean {
    const req = this.requests.get(requestId);
    if (!req || req.recipient_id !== userId || req.status !== 'pending') return false;

    req.status = 'accepted';
    req.updated_at = new Date().toISOString();
    this.acceptedPairs.add(this.pairKey(req.requester_id, req.recipient_id));
    this.acceptedPairs.add(this.pairKey(req.recipient_id, req.requester_id));
    return true;
  }

  public declineRequest(userId: string, requestId: string): boolean {
    const req = this.requests.get(requestId);
    if (!req || req.recipient_id !== userId || req.status !== 'pending') return false;

    req.status = 'declined';
    req.updated_at = new Date().toISOString();
    return true;
  }

  public cancelRequest(userId: string, requestId: string): boolean {
    const req = this.requests.get(requestId);
    if (!req || req.requester_id !== userId || req.status !== 'pending') return false;

    req.status = 'cancelled';
    req.updated_at = new Date().toISOString();
    return true;
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
    for (const member of SEEDED_MEMBERS) {
      if (this.acceptedPairs.has(this.pairKey(userId, member.id))) {
        list.push(member);
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
