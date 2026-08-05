// FR8X-CON Supreme Unified Data Store
// Provides instant, fully functional data fallback and live reactive store.

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

// Initial dataset for supreme smooth execution
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
    status: "active",
    expiryTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    bidsCount: 8,
    creatorCompany: "Oceanic Cold Chains",
    creatorName: "Vikram Sethi",
    description: "Temperature controlled -18°C continuous monitoring required.",
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
];

class DataStoreService {
  private auctions: MockAuction[] = INITIAL_AUCTIONS;
  private rates: MockRate[] = INITIAL_RATES;
  private posts: MockPost[] = INITIAL_POSTS;

  public getAuctions(): MockAuction[] {
    return this.auctions;
  }

  public getAuctionById(id: string): MockAuction | null {
    return this.auctions.find((a) => a.id === id) || this.auctions[0] || null;
  }

  public addAuction(auction: Partial<MockAuction>): MockAuction {
    const newAuction: MockAuction = {
      id: `auc-${Date.now()}`,
      title: auction.title || "Custom Freight Auction",
      cargoType: auction.cargoType || "General Cargo",
      originPort: auction.originPort || "INNSA (JNPT)",
      destinationPort: auction.destinationPort || "AEJEA (Jebel Ali)",
      containerCount: auction.containerCount || 1,
      containerType: auction.containerType || "40HC",
      targetPrice: auction.targetPrice || 1000,
      currentLowestBid: auction.currentLowestBid || auction.targetPrice || 950,
      status: "active",
      expiryTime: new Date(Date.now() + 86400000 * 4).toISOString(),
      bidsCount: 1,
      creatorCompany: auction.creatorCompany || "FR8X Enterprise",
      creatorName: auction.creatorName || "Trade Manager",
      description: auction.description || "",
      createdAt: new Date().toISOString(),
    };
    this.auctions.unshift(newAuction);
    return newAuction;
  }

  public placeBid(auctionId: string, bidAmount: number): boolean {
    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) return false;
    if (bidAmount < auction.currentLowestBid) {
      auction.currentLowestBid = bidAmount;
    }
    auction.bidsCount += 1;
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

  public getPosts(): MockPost[] {
    return this.posts;
  }

  public addPost(content: string, tags: string[] = []): MockPost {
    const newPost: MockPost = {
      id: `post-${Date.now()}`,
      authorId: "user-me",
      authorName: "Logistics Specialist",
      authorCompany: "FR8X Verified Network",
      authorRole: "Freight Forwarder Manager",
      content,
      tags: tags.length ? tags : ["Freight", "Logistics"],
      likes: 1,
      likedBy: ["user-me"],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.posts.unshift(newPost);
    return newPost;
  }
}

export const dataStore = new DataStoreService();
