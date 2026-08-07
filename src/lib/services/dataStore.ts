// FR8X-CON Unified Reactive Data Store Engine — Persistent LocalDB & Real-Time Sync
// Fully reactive with event dispatching, persistent localStorage sync, and instant fallback for all DBMS queries.

export interface MockAuction {
  id: string;
  title: string;
  cargoType: string;
  originPort: string;
  destinationPort: string;
  containerCount: number;
  containerType: string;
  targetPrice: number;
  currentLowestBid: number;
  status: "active" | "completed" | "cancelled" | "draft";
  expiryTime: string;
  bidsCount: number;
  creatorCompany: string;
  creatorName: string;
  description?: string;
  createdAt: string;
  lowestBidderName?: string;
}

export interface MockRate {
  id: string;
  carrier: string;
  origin: string;
  destination: string;
  mode: "FCL" | "LCL" | "AIR" | "CUSTOMS";
  containerType: string;
  currency: string;
  rateAmount: number;
  validTill: string;
  transitDays: number;
  freeDaysAtPOD: number;
  verified: boolean;
  remarks: string;
  createdAt?: string;
}

export interface MockPost {
  id: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  authorRole: string;
  content: string;
  tags: string[];
  likes: number;
  likedBy: string[];
  commentsCount: number;
  createdAt: string;
  attachmentType?: "image" | "document" | "rfq";
  attachmentUrl?: string;
}

export interface MockContact {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  isOnline: boolean;
  verified: boolean;
}

export interface MockMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

const INITIAL_AUCTIONS: MockAuction[] = [
  {
    id: "auc-101",
    title: "5x40' High Cube Dry Containers — JNPT (Mumbai) to Jebel Ali (Dubai)",
    cargoType: "General Freight (Electronics)",
    originPort: "INNSA (JNPT, India)",
    destinationPort: "AEJEA (Jebel Ali, UAE)",
    containerCount: 5,
    containerType: "40HC",
    targetPrice: 1450,
    currentLowestBid: 1280,
    lowestBidderName: "Oceanic Swift Logistics",
    status: "active",
    expiryTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    bidsCount: 14,
    creatorCompany: "Cogoport International",
    creatorName: "Rajat Kumar Rai",
    description: "Urgent shipment for consumer electronics. Free days required: min 14 days at POD.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "auc-102",
    title: "10x20' Standard Dry — Mundra Port to Port Klang (Malaysia)",
    cargoType: "Textiles & Garments",
    originPort: "INMUN (Mundra, India)",
    destinationPort: "MYPKG (Port Klang, Malaysia)",
    containerCount: 10,
    containerType: "20DV",
    targetPrice: 950,
    currentLowestBid: 820,
    lowestBidderName: "Global Blue Maritime",
    status: "active",
    expiryTime: new Date(Date.now() + 86400000 * 5).toISOString(),
    bidsCount: 22,
    creatorCompany: "AeroExpress Logistics",
    creatorName: "Priya Sharma",
    description: "Stackable textile rolls. Require direct vessel routing with fast transit.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "auc-103",
    title: "2x40' Reefer Container (-18°C) — Chennai to Hamburg (Germany)",
    cargoType: "Frozen Seafood",
    originPort: "INMAA (Chennai, India)",
    destinationPort: "DEHAM (Hamburg, Germany)",
    containerCount: 2,
    containerType: "40RF",
    targetPrice: 3800,
    currentLowestBid: 3450,
    lowestBidderName: "Hamburg Süd Cold Chain",
    status: "active",
    expiryTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    bidsCount: 8,
    creatorCompany: "Oceanic Cold Chains",
    creatorName: "Vikram Sethi",
    description: "Temperature controlled -18°C continuous monitoring required.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "auc-104",
    title: "8x40' High Cube — Nhava Sheva to Rotterdam (Netherlands)",
    cargoType: "Auto Parts & Engineering",
    originPort: "INNSA (Nhava Sheva, India)",
    destinationPort: "NLRTM (Rotterdam, Netherlands)",
    containerCount: 8,
    containerType: "40HC",
    targetPrice: 2100,
    currentLowestBid: 1890,
    lowestBidderName: "Apex Euro Forwarders",
    status: "active",
    expiryTime: new Date(Date.now() + 86400000 * 4).toISOString(),
    bidsCount: 19,
    creatorCompany: "Rai Vega Logistics",
    creatorName: "Management (Rai Vega)",
    description: "Heavy machinery components. Guaranteed space allocation needed.",
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_RATES: MockRate[] = [
  {
    id: "rate-01",
    carrier: "Maersk Line",
    origin: "INNSA (JNPT)",
    destination: "AEJEA (Jebel Ali)",
    mode: "FCL",
    containerType: "40HC",
    currency: "USD",
    rateAmount: 1250,
    validTill: "2026-08-31",
    transitDays: 5,
    freeDaysAtPOD: 14,
    verified: true,
    remarks: "Direct vessel service weekly departures",
  },
  {
    id: "rate-02",
    carrier: "MSC Shipping",
    origin: "INMUN (Mundra)",
    destination: "SGSIN (Singapore)",
    mode: "FCL",
    containerType: "20DV",
    currency: "USD",
    rateAmount: 780,
    validTill: "2026-08-28",
    transitDays: 7,
    freeDaysAtPOD: 10,
    verified: true,
    remarks: "Guaranteed container space",
  },
  {
    id: "rate-03",
    carrier: "Emirates SkyCargo",
    origin: "DEL (New Delhi Airport)",
    destination: "DXB (Dubai International)",
    mode: "AIR",
    containerType: "Per Kg",
    currency: "USD",
    rateAmount: 2.85,
    validTill: "2026-08-20",
    transitDays: 1,
    freeDaysAtPOD: 3,
    verified: true,
    remarks: "Express air cargo daily flight",
  },
  {
    id: "rate-04",
    carrier: "CMA CGM",
    origin: "INNSA (JNPT)",
    destination: "USNYC (New York, USA)",
    mode: "FCL",
    containerType: "40HC",
    currency: "USD",
    rateAmount: 3100,
    validTill: "2026-08-30",
    transitDays: 22,
    freeDaysAtPOD: 14,
    verified: true,
    remarks: "Indamex Express Service direct link",
  },
  {
    id: "rate-05",
    carrier: "Hapag-Lloyd",
    origin: "INMAA (Chennai)",
    destination: "DEHAM (Hamburg)",
    mode: "LCL",
    containerType: "Per CBM",
    currency: "USD",
    rateAmount: 48,
    validTill: "2026-08-25",
    transitDays: 26,
    freeDaysAtPOD: 7,
    verified: true,
    remarks: "Weekly direct LCL consolidation box",
  },
];

const INITIAL_POSTS: MockPost[] = [
  {
    id: "post-01",
    authorId: "usr-01",
    authorName: "Rajat Kumar Rai",
    authorCompany: "Cogoport Logistics",
    authorRole: "Senior Supply Chain Manager",
    content: "🚀 Excited to announce our expanded FCL rates for Gulf ports (JNPT/Mundra to Jebel Ali/Dammam). Contact us for special volume spot contracts!",
    tags: ["Logistics", "FreightForwarding", "JNPT", "ShippingRates"],
    likes: 42,
    likedBy: [],
    commentsCount: 9,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "post-02",
    authorId: "usr-02",
    authorName: "Ananya Deshmukh",
    authorCompany: "Apex Global Freight",
    authorRole: "Customs Broker Director",
    content: "📢 Regulatory Update: New Indian Customs Notification regarding IEC linkage with GSTIN portals effective next week. Ensure your documentation is synced.",
    tags: ["CustomsClearance", "IEC", "GSTN", "TradeCompliance"],
    likes: 88,
    likedBy: [],
    commentsCount: 15,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "post-03",
    authorId: "usr-03",
    authorName: "Vikram Sethi",
    authorCompany: "Oceanic Cold Chains",
    authorRole: "Perishable Cargo Specialist",
    content: "❄️ Cold chain capacity available for Europe shipments from Chennai & Vizag ports. Temperature logging & live GPS monitoring enabled.",
    tags: ["ReeferCargo", "ColdChain", "SeafoodExport", "Maritime"],
    likes: 31,
    likedBy: [],
    commentsCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const INITIAL_CONTACTS: MockContact[] = [
  {
    id: "cnt-01",
    name: "Rajat Kumar Rai",
    company: "Rai Vega Logistics",
    role: "Managing Director",
    email: "mgt@raivega.in",
    phone: "+91 98200 12345",
    avatar: "RR",
    isOnline: true,
    verified: true,
  },
  {
    id: "cnt-02",
    name: "Priya Sharma",
    company: "AeroExpress Logistics",
    role: "Air Freight Lead",
    email: "priya@aeroexpress.in",
    phone: "+91 98111 54321",
    avatar: "PS",
    isOnline: true,
    verified: true,
  },
  {
    id: "cnt-03",
    name: "Tariq Al-Mansoor",
    company: "Gulf Line Shipping (Dubai)",
    role: "Trade Procurement Manager",
    email: "tariq@gulflines.ae",
    phone: "+971 4 398 7654",
    avatar: "TM",
    isOnline: false,
    verified: true,
  },
];

const INITIAL_MESSAGES: MockMessage[] = [
  {
    id: "msg-01",
    senderId: "cnt-01",
    senderName: "Rajat Kumar Rai",
    receiverId: "me",
    content: "Hello! We have 5x40HC ready at JNPT for Jebel Ali. Can you provide your best spot rate?",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "msg-02",
    senderId: "me",
    senderName: "You",
    receiverId: "cnt-01",
    content: "Sure! Our current spot rate is USD 1,250 with 14 free days at POD.",
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
];

class DataStoreService {
  private auctions: MockAuction[] = INITIAL_AUCTIONS;
  private rates: MockRate[] = INITIAL_RATES;
  private posts: MockPost[] = INITIAL_POSTS;
  private contacts: MockContact[] = INITIAL_CONTACTS;
  private messages: MockMessage[] = INITIAL_MESSAGES;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const savedAuctions = localStorage.getItem("fr8x_db_auctions");
      if (savedAuctions) this.auctions = JSON.parse(savedAuctions);

      const savedRates = localStorage.getItem("fr8x_db_rates");
      if (savedRates) this.rates = JSON.parse(savedRates);

      const savedPosts = localStorage.getItem("fr8x_db_posts");
      if (savedPosts) this.posts = JSON.parse(savedPosts);

      const savedContacts = localStorage.getItem("fr8x_db_contacts");
      if (savedContacts) this.contacts = JSON.parse(savedContacts);

      const savedMessages = localStorage.getItem("fr8x_db_messages");
      if (savedMessages) this.messages = JSON.parse(savedMessages);
    } catch {
      // Use defaults on parse error
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("fr8x_db_auctions", JSON.stringify(this.auctions));
      localStorage.setItem("fr8x_db_rates", JSON.stringify(this.rates));
      localStorage.setItem("fr8x_db_posts", JSON.stringify(this.posts));
      localStorage.setItem("fr8x_db_contacts", JSON.stringify(this.contacts));
      localStorage.setItem("fr8x_db_messages", JSON.stringify(this.messages));
      window.dispatchEvent(new CustomEvent("fr8x_db_update"));
    } catch {
      // Ignore quota errors
    }
  }

  public getAuctions(): MockAuction[] {
    return this.auctions;
  }

  public getAuctionById(id: string): MockAuction | null {
    return this.auctions.find((a) => a.id === id) || this.auctions[0] || null;
  }

  public addAuction(auction: Partial<MockAuction>): MockAuction {
    const newAuction: MockAuction = {
      id: `auc-${Date.now()}`,
      title: auction.title || "Custom Freight Reverse Auction",
      cargoType: auction.cargoType || "General Cargo",
      originPort: auction.originPort || "INNSA (JNPT)",
      destinationPort: auction.destinationPort || "AEJEA (Jebel Ali)",
      containerCount: auction.containerCount || 1,
      containerType: auction.containerType || "40HC",
      targetPrice: auction.targetPrice || 1200,
      currentLowestBid: auction.currentLowestBid || auction.targetPrice || 1150,
      status: "active",
      expiryTime: new Date(Date.now() + 86400000 * 4).toISOString(),
      bidsCount: 1,
      creatorCompany: auction.creatorCompany || "FR8X Verified Network",
      creatorName: auction.creatorName || "Trade Manager",
      description: auction.description || "Standard B2B cargo contract.",
      createdAt: new Date().toISOString(),
    };
    this.auctions.unshift(newAuction);
    this.saveToStorage();
    return newAuction;
  }

  public placeBid(auctionId: string, bidAmount: number, bidderName: string = "Verified Forwarder"): boolean {
    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) return false;
    if (bidAmount < auction.currentLowestBid) {
      auction.currentLowestBid = bidAmount;
      auction.lowestBidderName = bidderName;
    }
    auction.bidsCount += 1;
    this.saveToStorage();
    return true;
  }

  public getRates(query?: string, mode?: string): MockRate[] {
    let result = [...this.rates];
    if (mode && mode !== "ALL") {
      result = result.filter((r) => r.mode.toUpperCase() === mode.toUpperCase());
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.carrier.toLowerCase().includes(q) ||
          r.origin.toLowerCase().includes(q) ||
          r.destination.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public addRate(rate: Partial<MockRate>): MockRate {
    const newRate: MockRate = {
      id: `rate-${Date.now()}`,
      carrier: rate.carrier || "Verified Carrier",
      origin: rate.origin || "INNSA (JNPT)",
      destination: rate.destination || "AEJEA (Jebel Ali)",
      mode: rate.mode || "FCL",
      containerType: rate.containerType || "40HC",
      currency: rate.currency || "USD",
      rateAmount: rate.rateAmount || 1200,
      validTill: rate.validTill || "2026-09-30",
      transitDays: rate.transitDays || 5,
      freeDaysAtPOD: rate.freeDaysAtPOD || 14,
      verified: true,
      remarks: rate.remarks || "Direct vessel service",
      createdAt: new Date().toISOString(),
    };
    this.rates.unshift(newRate);
    this.saveToStorage();
    return newRate;
  }

  public getPosts(): MockPost[] {
    return this.posts;
  }

  public addPost(content: string, tags: string[] = [], authorName = "Logistics Specialist", authorCompany = "FR8X Verified Network"): MockPost {
    const newPost: MockPost = {
      id: `post-${Date.now()}`,
      authorId: "user-me",
      authorName,
      authorCompany,
      authorRole: "Freight Forwarder Manager",
      content,
      tags: tags.length ? tags : ["Freight", "Logistics"],
      likes: 1,
      likedBy: ["user-me"],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.posts.unshift(newPost);
    this.saveToStorage();
    return newPost;
  }

  public toggleLike(postId: string, userId = "user-me"): boolean {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return false;
    const index = post.likedBy.indexOf(userId);
    if (index >= 0) {
      post.likedBy.splice(index, 1);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }
    this.saveToStorage();
    return true;
  }

  public getContacts(): MockContact[] {
    return this.contacts;
  }

  public getMessages(): MockMessage[] {
    return this.messages;
  }

  public sendMessage(content: string, receiverId = "cnt-01"): MockMessage {
    const newMsg: MockMessage = {
      id: `msg-${Date.now()}`,
      senderId: "me",
      senderName: "You",
      receiverId,
      content,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(newMsg);
    this.saveToStorage();
    return newMsg;
  }

  public resetToDefault() {
    this.auctions = INITIAL_AUCTIONS;
    this.rates = INITIAL_RATES;
    this.posts = INITIAL_POSTS;
    this.contacts = INITIAL_CONTACTS;
    this.messages = INITIAL_MESSAGES;
    this.saveToStorage();
  }
}

export const dataStore = new DataStoreService();
