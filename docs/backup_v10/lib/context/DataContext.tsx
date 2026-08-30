'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  FeedPost,
  JobPost,
  AdBooking,
  NexusTopic,
  CompanyReview,
  BlacklistCase,
  Auction,
  SubmittedBid,
  RateItem,
  ContainerEquipmentRow,
} from '@/lib/types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Seed Initial Data
const SEED_POSTS: FeedPost[] = [
  {
    id: 1,
    authorUid: 'u-priya',
    author: 'Priya Nair',
    authorRole: 'Trade Specialist · Mumbai',
    authorCompany: 'Nair Cargo Solutions',
    authorTimezone: 'Asia/Kolkata',
    hasGoldenTick: false,
    time: '1h ago',
    text: '*Blank sailings* have tightened capacity on Asia-Europe lanes through mid-September.\n> Booking 10-14 days ahead is strongly advised to secure space on direct services.\n\nKey carriers implementing GRI:\n- Maersk / MSC\n- CMA CGM\n- Hapag-Lloyd',
    likes: 24,
    dis: 0,
    liked: false,
    disliked: false,
    isSaved: false,
    comments: [
      {
        id: 'c1',
        authorUid: 'u-kiran',
        author: 'Kiran Mehta',
        authorRole: 'Trade Lane Manager',
        authorCompany: 'Indo Ocean Lines',
        authorTimezone: 'Asia/Kolkata',
        hasGoldenTick: false,
        text: 'Seeing the exact same trend on our North Continent contracts — thanks for flagging early.',
        time: '45m ago',
        likes: 3,
        dis: 0,
        replies: [
          {
            id: 'r1',
            authorUid: 'u-priya',
            author: 'Priya Nair',
            authorRole: 'Trade Specialist',
            authorCompany: 'Nair Cargo Solutions',
            authorTimezone: 'Asia/Kolkata',
            hasGoldenTick: false,
            text: 'Happy to share our verified forwarder carrier allocation notes directly if helpful.',
            time: '20m ago',
            likes: 1,
            dis: 0,
          },
        ],
      },
      {
        id: 'c2',
        authorUid: 'u-sarah',
        author: 'Sarah Lewis',
        authorRole: 'Ocean Freight Lead',
        authorCompany: 'Rotterdam Freight NV',
        authorTimezone: 'Europe/Amsterdam',
        hasGoldenTick: false,
        text: 'Rotterdam ECT delta terminal dwell times have improved slightly this week.',
        time: '10m ago',
        likes: 2,
        dis: 0,
        replies: [],
      },
    ],
  },
  {
    id: 2,
    authorUid: 'u-arjun',
    author: 'Arjun Rao',
    authorRole: 'Freight Manager · Mumbai',
    authorCompany: 'Atlas Logistics Pvt. Ltd.',
    authorTimezone: 'Asia/Kolkata',
    hasGoldenTick: true,
    time: '3h ago',
    text: 'Reverse auction published for *Mumbai → Rotterdam (FCL Export)*.\n12x 40HC containers cargo-ready by 05 Sep. Verified forwarders can review requirements in the Auction Dashboard.',
    likes: 18,
    dis: 0,
    liked: false,
    disliked: false,
    isSaved: true,
    comments: [],
  },
];

const SEED_JOBS: JobPost[] = [
  {
    id: 'j1',
    title: 'Senior Freight Pricing Analyst',
    company: 'BlueWave Logistics Ltd.',
    location: 'Mumbai, India · On-site',
    experience: '3–5 yrs experience',
    packageDetails: '₹8–12 LPA + Performance Bonus',
    employmentType: 'Full-time',
    requirements:
      'FCL/LCL spot rate benchmarking, carrier negotiations, UN/LOCODE lane procurement, ERP systems, and strong analytical communication.',
    postedBy: 'Arjun Rao',
    posterEmail: 'arjun@atlaslogistics.com',
    posterTimezone: 'Asia/Kolkata',
    postedDate: '26 Aug 2026',
    isOwner: true,
  },
  {
    id: 'j2',
    title: 'Trade Lane Manager (Middle East & Europe)',
    company: 'Northstar Freight Group',
    location: 'Dubai, UAE · Hybrid',
    experience: '6–9 yrs experience',
    packageDetails: 'AED 22,000 – 30,000 / month',
    employmentType: 'Full-time',
    requirements:
      'Direct carrier space allocation, P&L management, key account servicing, and multimodal supply chain execution across Jebel Ali and European hubs.',
    postedBy: 'Sarah Lewis',
    posterEmail: 'sarah.lewis@rotterdamfreight.nl',
    posterTimezone: 'Europe/Amsterdam',
    postedDate: '25 Aug 2026',
    isOwner: false,
  },
  {
    id: 'j3',
    title: 'Customer Success & Procurement Lead',
    company: 'CargoLink Global',
    location: 'Singapore · On-site',
    experience: '4–6 yrs experience',
    packageDetails: 'SGD 6,000 – 8,500 / month',
    employmentType: 'Full-time',
    requirements:
      'Customer RFP responses, rate build-ups, demurrage/detention dispute resolution, and cross-functional carrier management.',
    postedBy: 'Ravi Thomas',
    posterEmail: 'ravi@cargolink.sg',
    posterTimezone: 'Asia/Singapore',
    postedDate: '24 Aug 2026',
    isOwner: false,
  },
];

const SEED_TOPICS: NexusTopic[] = [
  {
    id: 'top-1',
    title: 'Port congestion: practical routing alternatives via Colombo and Salalah',
    author: 'Priya Nair',
    authorCompany: 'Nair Cargo Solutions',
    authorTimezone: 'Asia/Kolkata',
    hasGoldenTick: false,
    category: 'Routing Strategy',
    text: 'Blank sailings have tightened direct capacity on Asia-Europe lines. Transshipment via Colombo or Salalah has yielded 3-4 days lead time advantage over standard hubs.',
    likes: 28,
    dis: 1,
    commentsCount: 3,
    createdAt: '25 Aug 2026',
    replies: [
      {
        author: 'Kiran Mehta',
        text: 'Colombo transshipment saved us four days on our last automotive shipment.',
        time: '1d ago',
      },
      {
        author: 'Ravi Thomas',
        text: 'Confirm free time agreements separately for transshipment ports to avoid detention spikes.',
        time: '18h ago',
      },
    ],
  },
  {
    id: 'top-2',
    title: 'What is reasonable detention-free time for Antwerp and Rotterdam imports?',
    author: 'Kiran Mehta',
    authorCompany: 'Indo Ocean Lines',
    authorTimezone: 'Asia/Kolkata',
    hasGoldenTick: false,
    category: 'Commercial Terms',
    text: 'For standard FCL shipments into Rotterdam and Antwerp, what detention and demurrage combined free days are members consistently securing in 2026 carrier contracts?',
    likes: 25,
    dis: 0,
    commentsCount: 2,
    createdAt: '24 Aug 2026',
    replies: [
      {
        author: 'Sarah Lewis',
        text: 'Standard is 10 calendar days; with Tier-1 volume we negotiate 14 to 21 combined days.',
        time: '2d ago',
        hasGoldenTick: false,
      },
    ],
  },
  {
    id: 'top-3',
    title: 'Impact of new EU ETS maritime carbon surcharges on Q4 spot contracts',
    author: 'Arjun Rao',
    authorCompany: 'Atlas Logistics Pvt. Ltd.',
    authorTimezone: 'Asia/Kolkata',
    hasGoldenTick: true,
    category: 'Regulatory & Compliance',
    text: 'Reviewing quarterly index adjustments for EU ETS emissions surcharges across North Europe and Med ports. Are forwarders passing through at actual cost or fixed markup?',
    likes: 34,
    dis: 0,
    commentsCount: 1,
    createdAt: '22 Aug 2026',
    replies: [
      {
        author: 'Sarah Lewis',
        text: 'We mandate transparent passthrough based on official monthly liner circulars.',
        time: '3d ago',
      },
    ],
  },
];

const SEED_REVIEWS: CompanyReview[] = [
  {
    id: 'rev-1',
    companyName: 'Mariner Logistics Global',
    location: 'Mumbai, Maharashtra, India',
    ratingAverage: 4.6,
    totalReviews: 230,
    starDistribution: [142, 58, 21, 6, 3],
    recentReviews: [
      {
        author: 'Arjun Rao',
        rating: 5,
        text: 'Flawless space allocation on Nhava Sheva to Rotterdam contracts during blank sailing peaks.',
        date: '15 Aug 2026',
        verified: true,
      },
      {
        author: 'Sarah Lewis',
        rating: 4,
        text: 'Reliable documentation turnaround, fast Bill of Lading releases.',
        date: '02 Aug 2026',
        verified: true,
      },
    ],
  },
  {
    id: 'rev-2',
    companyName: 'BlueGate Cargo Lines',
    location: 'Chennai, Tamil Nadu, India',
    ratingAverage: 4.4,
    totalReviews: 159,
    starDistribution: [98, 44, 12, 4, 1],
    recentReviews: [
      {
        author: 'Kiran Mehta',
        rating: 5,
        text: 'Competitive feeder rates between Chennai and Singapore.',
        date: '20 Jul 2026',
        verified: true,
      },
    ],
  },
  {
    id: 'rev-3',
    companyName: 'Northstar Freight Partners',
    location: 'Delhi NCR, India',
    ratingAverage: 4.2,
    totalReviews: 118,
    starDistribution: [76, 30, 9, 2, 1],
    recentReviews: [
      {
        author: 'Ravi Thomas',
        rating: 4,
        text: 'Solid inland haulage coordination from ICD Dadri to Mundra.',
        date: '10 Jul 2026',
        verified: true,
      },
    ],
  },
];

const SEED_CASES: BlacklistCase[] = [
  {
    id: 'case-1',
    companyName: 'Orbit Freight Services Ltd.',
    location: 'Delhi NCR, India',
    reason: 'Payment default on ocean freight demurrage invoices (>90 days past due)',
    severity: 'critical',
    reportedDate: '18 Aug 2026',
    status: 'active',
    reporter: 'Verified FR8X Carrier Member',
    description:
      'Repeated non-settlement of confirmed detention invoices totaling $34,200 across 8 bills of lading. Formal demand letters unanswered.',
    evidenceRef: 'AUDIT-ORB-2026-9921',
  },
  {
    id: 'case-2',
    companyName: 'SwiftLine Carriers International',
    location: 'Dubai, UAE',
    reason: 'Unilateral rate increase post booking confirmation and container gating',
    severity: 'high',
    reportedDate: '04 Aug 2026',
    status: 'under_investigation',
    reporter: 'Verified NVOCC Member',
    description:
      'Imposed $450/TEU unauthorized surcharge after cargo was stuffed into CFS without contractual provision.',
    evidenceRef: 'AUDIT-SWF-2026-4412',
  },
  {
    id: 'case-3',
    companyName: 'Apex Cargo Movers',
    location: 'Kolkata, West Bengal, India',
    reason: 'Discrepancy in original weight declaration and unauthorized BL withholding',
    severity: 'moderate',
    reportedDate: '28 Jul 2026',
    status: 'resolved',
    reporter: 'Verified Shipper Member',
    description:
      'Withheld original seaway bills over unagreed origin ancillary charges. Settled following FR8X moderation mediation.',
    evidenceRef: 'AUDIT-APX-2026-1189',
  },
];

const SEED_AUCTIONS: Auction[] = [
  {
    id: 'RA-2026-0842',
    title: 'Mumbai → Rotterdam | FCL Export Auto Parts',
    rfqId: 'RFQ-4281',
    creatorUid: 'u-arjun',
    creatorName: 'Arjun Rao',
    creatorCompany: 'Atlas Logistics Pvt. Ltd.',
    auctionType: 'Specific bidder',
    startDate: '2026-08-27',
    startTime: '10:00',
    durationMinutes: 180,
    endDateTime: '27 Aug 2026, 13:00',
    timezone: 'Asia/Kolkata',
    status: 'Live',
    rank: '#1',
    timeLeft: '01h 22m',
    competitionCeiling: 2720,
    bidsSubmittedCount: 4,
    shipment: {
      por: 'Nhava Sheva (INNSA), India',
      pol: 'Nhava Sheva (INNSA), India',
      pod: 'Rotterdam (NLRTM), Netherlands',
      finalDestination: 'Rotterdam (NLRTM), Netherlands',
      cargoReadyDate: '2026-09-05',
      shipmentType: 'FCL',
      movementType: 'Port to Port',
      incoterm: 'FOB - Free on Board',
      rateCurrency: 'USD',
      commodity: 'Automotive Components',
      hsCode: '8708.29',
      weightKg: 24500,
      cbm: 68,
      isHazardous: false,
    },
    containers: [
      {
        id: 'c-1',
        equipmentType: "40' High Cube (40HC)",
        containerType: 'Standard',
        quantity: 2,
        pickupLocation: 'Nhava Sheva CFS',
        emptyReturnLocation: 'Rotterdam ECT',
        isSpecial: false,
        commodity: 'Auto Parts',
        hsCode: '8708.29',
        grossWeight: 24500,
      },
    ],
    originCharges: {
      transportation: true,
      clearance: true,
      carrierLocal: true,
      pickupAddress: 'Plot 42, MIDC Chakan, Pune',
      handoverLocation: 'Nhava Sheva Port CFS',
      factoryStuffing: true,
    },
    destinationCharges: {
      transportation: false,
      clearance: true,
      carrierLocal: true,
      destuffingAddress: 'Waalhaven Oostzijde 14, Rotterdam',
      dutyPaidBy: 'consignee',
    },
    selectedBidders: [
      {
        id: 'u-sarah',
        name: 'Sarah Lewis',
        company: 'Rotterdam Freight NV',
        role: 'Ocean Freight Lead',
        location: 'Rotterdam, Netherlands',
        timezone: 'Europe/Amsterdam',
        hasGoldenTick: false,
      },
      {
        id: 'u-kiran',
        name: 'Kiran Mehta',
        company: 'Indo Ocean Lines',
        role: 'Trade Lane Manager',
        location: 'Mumbai, India',
        timezone: 'Asia/Kolkata',
        hasGoldenTick: false,
      },
    ],
    blockedBidders: [],
    rules: {
      autoExtension: true,
      rankingVisible: true,
      hideCompetitorNames: true,
      bidderAnonymity: true,
      bidLimit: 5,
    },
  },
  {
    id: 'RA-2026-0843',
    title: 'Shanghai → Jebel Ali | Solar Modules Equipment',
    rfqId: 'RFQ-4290',
    creatorUid: 'u-kiran',
    creatorName: 'Kiran Mehta',
    creatorCompany: 'Indo Ocean Lines',
    auctionType: 'Specific bidder',
    startDate: '2026-08-27',
    startTime: '09:00',
    durationMinutes: 720,
    endDateTime: '27 Aug 2026, 21:00',
    timezone: 'Asia/Dubai',
    status: 'Live',
    rank: '#2',
    timeLeft: '18h 40m',
    competitionCeiling: 1850,
    bidsSubmittedCount: 3,
    shipment: {
      por: 'Shanghai (CNSHA), China',
      pol: 'Shanghai (CNSHA), China',
      pod: 'Jebel Ali (AEJEA), United Arab Emirates',
      finalDestination: 'Jebel Ali Free Zone, Dubai',
      cargoReadyDate: '2026-09-10',
      shipmentType: 'FCL',
      incoterm: 'CIF - Cost, Insurance and Freight',
      rateCurrency: 'USD',
      commodity: 'Photovoltaic Solar Modules',
      hsCode: '8541.43',
      weightKg: 42000,
      cbm: 140,
    },
    containers: [
      {
        id: 'c-2',
        equipmentType: "40' High Cube (40HC)",
        containerType: 'Standard',
        quantity: 4,
        pickupLocation: 'Shanghai Port Depot',
        emptyReturnLocation: 'Jebel Ali DP World',
        isSpecial: false,
        commodity: 'Solar Modules',
        hsCode: '8541.43',
        grossWeight: 42000,
      },
    ],
    originCharges: { transportation: false, clearance: false, carrierLocal: true },
    destinationCharges: { transportation: false, clearance: false, carrierLocal: true },
    selectedBidders: [],
    blockedBidders: [],
    rules: {
      autoExtension: true,
      rankingVisible: true,
      hideCompetitorNames: true,
      bidderAnonymity: true,
      bidLimit: 5,
    },
  },
  {
    id: 'GB-2026-0311',
    title: 'Nhava Sheva → Antwerp | Open General Bidding',
    rfqId: 'RFQ-4301',
    creatorUid: 'u-admin',
    creatorName: 'Global Freight Exchange',
    creatorCompany: 'FR8X Open Market',
    auctionType: 'General bidding',
    startDate: '2026-08-28',
    startTime: '10:00',
    durationMinutes: 1440,
    endDateTime: '29 Aug 2026, 10:00',
    timezone: 'Asia/Kolkata',
    status: 'Live',
    rank: 'Open',
    timeLeft: '1d 04h',
    competitionCeiling: 2400,
    bidsSubmittedCount: 8,
    shipment: {
      por: 'Nhava Sheva (INNSA), India',
      pol: 'Nhava Sheva (INNSA), India',
      pod: 'Antwerp (BEANR), Belgium',
      finalDestination: 'Antwerp Gateway 1700',
      cargoReadyDate: '2026-09-12',
      shipmentType: 'FCL',
      incoterm: 'FOB - Free on Board',
      rateCurrency: 'USD',
      commodity: 'Engineering Machinery',
      hsCode: '8431.49',
      weightKg: 18600,
      cbm: 54,
    },
    containers: [
      {
        id: 'c-3',
        equipmentType: "20' Standard (20DV)",
        containerType: 'Standard',
        quantity: 2,
        pickupLocation: 'Nhava Sheva Depot',
        emptyReturnLocation: 'Antwerp Port',
        isSpecial: false,
        commodity: 'Machinery',
        hsCode: '8431.49',
        grossWeight: 18600,
      },
    ],
    originCharges: { transportation: false, clearance: false, carrierLocal: true },
    destinationCharges: { transportation: false, clearance: false, carrierLocal: true },
    selectedBidders: [],
    blockedBidders: [],
    rules: {
      autoExtension: true,
      rankingVisible: true,
      hideCompetitorNames: true,
      bidderAnonymity: true,
      bidLimit: 10,
    },
  },
];

const SEED_RATES: RateItem[] = [
  {
    id: 'RT-000001',
    sp: 'OceanLine Logistics Global',
    carrier: 'Maersk Line',
    por: 'Nhava Sheva (INNSA)',
    pol: 'Nhava Sheva (INNSA)',
    pod: 'Rotterdam (NLRTM)',
    fpod: 'Rotterdam (NLRTM)',
    d20: 1480,
    d20Type: 'Dry Standard',
    h40: 2320,
    h40Type: 'High Cube',
    ft: '14 days',
    tt: '29 days',
    valid: '30 Sep 2026',
    rateType: 'Direct',
    route: 'Direct via Suez',
    remark: 'Subject to vessel space confirmation and standard bunker surcharge.',
    ownerUid: 'u-other-1',
    isOwner: false,
  },
  {
    id: 'RT-000002',
    sp: 'Seaway Freight International',
    carrier: 'CMA CGM',
    por: 'Mundra (INMUN)',
    pol: 'Mundra (INMUN)',
    pod: 'Antwerp (BEANR)',
    fpod: 'Antwerp (BEANR)',
    d20: 1510,
    d20Type: 'Dry Standard',
    h40: 2380,
    h40Type: 'High Cube',
    ft: '14 days',
    tt: '31 days',
    valid: '30 Sep 2026',
    rateType: 'Direct',
    route: 'Direct Ocean',
    remark: 'Inclusive of BAF and CAF surcharges.',
    ownerUid: 'u-other-2',
    isOwner: false,
  },
  {
    id: 'RT-000003',
    sp: 'Hapag Global Express',
    carrier: 'Hapag-Lloyd',
    por: 'Chennai (INMAA)',
    pol: 'Chennai (INMAA)',
    pod: 'Hamburg (DEHAM)',
    fpod: 'Hamburg (DEHAM)',
    d20: 1620,
    d20Type: 'Dry Standard',
    h40: 2540,
    h40Type: 'High Cube',
    ft: '21 days',
    tt: '34 days',
    valid: '15 Oct 2026',
    rateType: 'Transshipment',
    route: 'Via Colombo',
    remark: 'Guaranteed 21 days detention-free time at Hamburg.',
    ownerUid: 'u-other-3',
    isOwner: false,
  },
  {
    id: 'RT-000004',
    sp: 'Pacific Maritime Lines',
    carrier: 'ONE Ocean Network',
    por: 'Nhava Sheva (INNSA)',
    pol: 'Nhava Sheva (INNSA)',
    pod: 'Jebel Ali (AEJEA)',
    fpod: 'Jebel Ali (AEJEA)',
    d20: 680,
    d20Type: 'Dry Standard',
    h40: 1120,
    h40Type: 'High Cube',
    ft: '14 days',
    tt: '5 days',
    valid: '31 Oct 2026',
    rateType: 'Direct',
    route: 'Direct Fast Feeder',
    remark: 'Fixed rate valid through October 2026.',
    ownerUid: 'u-other-4',
    isOwner: false,
  },
];

interface DataContextType {
  posts: FeedPost[];
  addPost: (text: string) => void;
  deletePost: (id: string | number) => void;
  reactPost: (id: string | number, type: 'likes' | 'dis') => void;
  savePost: (id: string | number) => void;
  addComment: (postId: string | number, text: string) => void;
  addReply: (postId: string | number, commentId: string, text: string) => void;
  reactComment: (postId: string | number, commentId: string, type: 'likes' | 'dis') => void;
  reactReply: (
    postId: string | number,
    commentId: string,
    replyId: string,
    type: 'likes' | 'dis'
  ) => void;

  jobs: JobPost[];
  addJob: (job: Omit<JobPost, 'id' | 'postedDate' | 'isOwner' | 'postedBy' | 'posterEmail'>) => void;
  deleteJob: (id: string) => void;

  ads: AdBooking[];
  bookAd: (ad: Omit<AdBooking, 'id' | 'createdAt' | 'status'>) => void;

  topics: NexusTopic[];
  addTopic: (title: string, category: string, text: string) => void;
  addTopicReply: (topicId: string, text: string) => void;

  reviews: CompanyReview[];
  addReview: (companyId: string, rating: number, text: string) => void;

  cases: BlacklistCase[];
  addCase: (company: string, location: string, reason: string, description: string) => void;

  auctions: Auction[];
  addAuction: (auctionData: Partial<Auction>) => string;
  submitBid: (auctionId: string, charges: any[], grandTotalUSD: number) => void;
  mySubmittedBids: SubmittedBid[];

  rates: RateItem[];
  myRates: RateItem[];
  addMyRate: (rateData: Omit<RateItem, 'id' | 'isOwner' | 'sp'>) => string;
  deleteMyRate: (rateId: string) => void;
  bulkImportRates: (importedRates: Partial<RateItem>[]) => { count: number; errors: string[] };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, bidPostingFee } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<FeedPost[]>(SEED_POSTS);
  const [jobs, setJobs] = useState<JobPost[]>(SEED_JOBS);
  const [ads, setAds] = useState<AdBooking[]>([]);
  const [topics, setTopics] = useState<NexusTopic[]>(SEED_TOPICS);
  const [reviews, setReviews] = useState<CompanyReview[]>(SEED_REVIEWS);
  const [cases, setCases] = useState<BlacklistCase[]>(SEED_CASES);
  const [auctions, setAuctions] = useState<Auction[]>(SEED_AUCTIONS);
  const [mySubmittedBids, setMySubmittedBids] = useState<SubmittedBid[]>([]);
  const [rates, setRates] = useState<RateItem[]>(SEED_RATES);
  const [myRates, setMyRates] = useState<RateItem[]>([
    {
      id: 'IRT-000001',
      sp: 'Atlas Logistics Pvt. Ltd.',
      carrier: 'Maersk',
      por: 'Nhava Sheva (INNSA)',
      pol: 'Nhava Sheva (INNSA)',
      pod: 'Rotterdam (NLRTM)',
      fpod: 'Rotterdam (NLRTM)',
      d20: 1475,
      h40: 2310,
      ft: '14 days',
      tt: '29 days',
      valid: '30 Sep 2026',
      rateType: 'Direct',
      route: 'Direct Ocean',
      remark: 'Atlas proprietary contract rates.',
      ownerUid: 'u-arjun',
      isOwner: true,
    },
  ]);

  // Posts Handlers
  const addPost = (text: string) => {
    if (!text.trim()) return;
    const newPost: FeedPost = {
      id: Date.now(),
      authorUid: user.uid,
      author: user.displayName,
      authorRole: `${user.designation} · ${user.city}`,
      authorCompany: user.company,
      authorTimezone: user.timezone,
      hasGoldenTick: user.hasGoldenTick,
      time: 'Just now',
      text: text.trim(),
      likes: 0,
      dis: 0,
      liked: false,
      disliked: false,
      isSaved: false,
      comments: [],
      isOwner: true,
    };
    setPosts((prev) => [newPost, ...prev]);
    toast('Update published to your freight network.');
  };

  const deletePost = (id: string | number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast('Post removed.');
  };

  const reactPost = (id: string | number, type: 'likes' | 'dis') => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (type === 'likes') {
          const isLiked = p.liked;
          return {
            ...p,
            likes: isLiked ? p.likes - 1 : p.likes + 1,
            liked: !isLiked,
            dis: p.disliked ? p.dis - 1 : p.dis,
            disliked: false,
          };
        } else {
          const isDisliked = p.disliked;
          return {
            ...p,
            dis: isDisliked ? p.dis - 1 : p.dis + 1,
            disliked: !isDisliked,
            likes: p.liked ? p.likes - 1 : p.likes,
            liked: false,
          };
        }
      })
    );
  };

  const savePost = (id: string | number) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextState = !p.isSaved;
        toast(nextState ? 'Post saved to your private collection.' : 'Post unsaved.');
        return { ...p, isSaved: nextState };
      })
    );
  };

  const addComment = (postId: string | number, text: string) => {
    if (!text.trim()) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const newComment = {
          id: `c-${Date.now()}`,
          authorUid: user.uid,
          author: user.displayName,
          authorRole: user.designation,
          authorCompany: user.company,
          authorTimezone: user.timezone,
          hasGoldenTick: user.hasGoldenTick,
          text: text.trim(),
          time: 'Just now',
          likes: 0,
          dis: 0,
          replies: [],
        };
        return { ...p, comments: [...p.comments, newComment] };
      })
    );
    toast('Comment posted.');
  };

  const addReply = (postId: string | number, commentId: string, text: string) => {
    if (!text.trim()) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            const newReply = {
              id: `r-${Date.now()}`,
              authorUid: user.uid,
              author: user.displayName,
              authorRole: user.designation,
              authorCompany: user.company,
              authorTimezone: user.timezone,
              hasGoldenTick: user.hasGoldenTick,
              text: text.trim(),
              time: 'Just now',
              likes: 0,
              dis: 0,
            };
            return { ...c, replies: [...c.replies, newReply] };
          }),
        };
      })
    );
    toast('Reply posted.');
  };

  const reactComment = (postId: string | number, commentId: string, type: 'likes' | 'dis') => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            return { ...c, [type]: c[type] + 1 };
          }),
        };
      })
    );
  };

  const reactReply = (
    postId: string | number,
    commentId: string,
    replyId: string,
    type: 'likes' | 'dis'
  ) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              replies: c.replies.map((r) => (r.id === replyId ? { ...r, [type]: r[type] + 1 } : r)),
            };
          }),
        };
      })
    );
  };

  // Jobs
  const addJob = (
    jobData: Omit<JobPost, 'id' | 'postedDate' | 'isOwner' | 'postedBy' | 'posterEmail'>
  ) => {
    const newJob: JobPost = {
      id: `j-${Date.now()}`,
      ...jobData,
      postedBy: user.displayName,
      posterEmail: user.email,
      posterTimezone: user.timezone,
      postedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      isOwner: true,
    };
    setJobs((prev) => [newJob, ...prev]);
    toast('Job post published successfully.');
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    toast('Job post closed and removed.');
  };

  // Ads
  const bookAd = (adData: Omit<AdBooking, 'id' | 'createdAt' | 'status'>) => {
    const newAd: AdBooking = {
      id: `ad-${Date.now()}`,
      ...adData,
      status: 'pending_moderation',
      createdAt: new Date().toISOString(),
    };
    setAds((prev) => [newAd, ...prev]);
    toast('Ad booking submitted for moderation and payment processing.');
  };

  // Nexus Topics
  const addTopic = (title: string, category: string, text: string) => {
    const newTopic: NexusTopic = {
      id: `top-${Date.now()}`,
      title,
      category,
      text,
      author: user.displayName,
      authorUid: user.uid,
      authorCompany: user.company,
      authorTimezone: user.timezone,
      hasGoldenTick: user.hasGoldenTick,
      likes: 0,
      dis: 0,
      commentsCount: 0,
      createdAt: 'Just now',
      replies: [],
    };
    setTopics((prev) => [newTopic, ...prev]);
    toast('Nexus topic published.');
  };

  const addTopicReply = (topicId: string, text: string) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const newReply = {
          author: user.displayName,
          text,
          time: 'Just now',
          hasGoldenTick: user.hasGoldenTick,
        };
        return {
          ...t,
          commentsCount: t.commentsCount + 1,
          replies: [...t.replies, newReply],
        };
      })
    );
    toast('Discussion response submitted.');
  };

  // Reviews
  const addReview = (companyId: string, rating: number, text: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== companyId) return r;
        const starIdx = 5 - Math.min(Math.max(rating, 1), 5);
        const newDist = [...r.starDistribution] as [number, number, number, number, number];
        newDist[starIdx]++;
        const newTotal = r.totalReviews + 1;
        const newReview = {
          author: user.displayName,
          rating,
          text,
          date: 'Just now',
          verified: true,
        };
        return {
          ...r,
          totalReviews: newTotal,
          starDistribution: newDist,
          recentReviews: [newReview, ...r.recentReviews],
        };
      })
    );
    toast('Verified company rating submitted.');
  };

  // Cases
  const addCase = (company: string, location: string, reason: string, description: string) => {
    const newCase: BlacklistCase = {
      id: `case-${Date.now()}`,
      companyName: company,
      location,
      reason,
      description,
      severity: 'high',
      reportedDate: 'Just now',
      status: 'under_investigation',
      reporter: user.displayName,
      evidenceRef: `AUDIT-REP-${Date.now()}`,
    };
    setCases((prev) => [newCase, ...prev]);
    toast('Risk case submitted for compliance moderation review.');
  };

  // Auctions
  const addAuction = (auctionData: Partial<Auction>): string => {
    const id = `RA-2026-${String(Date.now()).slice(-4)}`;
    const newAuction: Auction = {
      id,
      title: auctionData.title || 'Untitled Reverse Auction',
      rfqId: auctionData.rfqId || `RFQ-${Math.floor(1000 + Math.random() * 9000)}`,
      creatorUid: user.uid,
      creatorName: user.displayName,
      creatorCompany: user.company,
      auctionType: auctionData.auctionType || 'Specific bidder',
      startDate: auctionData.startDate || new Date().toISOString().slice(0, 10),
      startTime: auctionData.startTime || '10:00',
      durationMinutes: auctionData.durationMinutes || 120,
      endDateTime: auctionData.endDateTime || 'Auto calculated',
      timezone: auctionData.timezone || user.timezone,
      status: 'Live',
      rank: 'Pending',
      timeLeft: `${auctionData.durationMinutes || 120}m`,
      competitionCeiling: auctionData.competitionCeiling || 2800,
      bidsSubmittedCount: 0,
      shipment: auctionData.shipment || {
        por: 'Nhava Sheva (INNSA), India',
        pol: 'Nhava Sheva (INNSA), India',
        pod: 'Rotterdam (NLRTM), Netherlands',
        finalDestination: 'Rotterdam (NLRTM), Netherlands',
        cargoReadyDate: new Date().toISOString().slice(0, 10),
        shipmentType: 'FCL',
        incoterm: 'FOB - Free on Board',
        rateCurrency: 'USD',
        commodity: 'General Cargo',
        hsCode: '8400.00',
        weightKg: 20000,
        cbm: 60,
      },
      containers: auctionData.containers || [],
      originCharges: auctionData.originCharges || {
        transportation: false,
        clearance: false,
        carrierLocal: true,
      },
      destinationCharges: auctionData.destinationCharges || {
        transportation: false,
        clearance: false,
        carrierLocal: true,
      },
      selectedBidders: auctionData.selectedBidders || [],
      blockedBidders: auctionData.blockedBidders || [],
      rules: auctionData.rules || {
        autoExtension: true,
        rankingVisible: true,
        hideCompetitorNames: true,
        bidderAnonymity: true,
        bidLimit: 5,
      },
    };

    setAuctions((prev) => [newAuction, ...prev]);

    // Structured notification simulation for invited bidders
    if (newAuction.selectedBidders.length > 0) {
      newAuction.selectedBidders.forEach((b) => {
        toast(`Structured auction notification sent to ${b.name} (${b.company}).`);
      });
    }

    toast(`Reverse Auction ${id} published successfully.`);
    return id;
  };

  const submitBid = (auctionId: string, charges: any[], grandTotalUSD: number) => {
    const targetAuction = auctions.find((a) => a.id === auctionId);
    const ceiling = targetAuction?.competitionCeiling || 2720;
    const rank = grandTotalUSD <= ceiling ? 1 : 2;

    const newBid: SubmittedBid = {
      id: `bid-${Date.now()}`,
      auctionId,
      bidderUid: user.uid,
      bidderName: user.displayName,
      bidderCompany: user.company,
      bidderHasGoldenTick: user.hasGoldenTick,
      charges,
      grandTotalUSD,
      rank,
      feePaid: bidPostingFee,
      currency: 'USD',
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMySubmittedBids((prev) => [newBid, ...prev]);

    setAuctions((prev) =>
      prev.map((a) => {
        if (a.id !== auctionId) return a;
        return {
          ...a,
          rank: `#${rank}`,
          bidsSubmittedCount: a.bidsSubmittedCount + 1,
        };
      })
    );

    toast(
      `Bid of USD $${grandTotalUSD.toFixed(2)} submitted for ${auctionId}. ₹${bidPostingFee} fee charged.`
    );
  };

  // Rates
  const addMyRate = (rateData: Omit<RateItem, 'id' | 'isOwner' | 'sp'>): string => {
    const id = `IRT-${String(Math.floor(100000 + Math.random() * 900000))}`;
    const newRate: RateItem = {
      ...rateData,
      id,
      sp: user.company,
      ownerUid: user.uid,
      isOwner: true,
    };
    setMyRates((prev) => [newRate, ...prev]);
    toast(`i-Rate ${id} added to your published inventory.`);
    return id;
  };

  const deleteMyRate = (rateId: string) => {
    setMyRates((prev) => prev.filter((r) => r.id !== rateId));
    toast(`Rate ${rateId} removed from inventory.`);
  };

  const bulkImportRates = (importedRates: Partial<RateItem>[]) => {
    const validRows: RateItem[] = [];
    const errors: string[] = [];

    importedRates.forEach((row, index) => {
      const lineNum = index + 2;
      if (!row.pol || !row.pod) {
        errors.push(`Row ${lineNum}: Missing POL or POD.`);
        return;
      }
      if (!row.d20 || isNaN(Number(row.d20))) {
        errors.push(`Row ${lineNum}: Invalid 20DV rate.`);
        return;
      }
      if (!row.h40 || isNaN(Number(row.h40))) {
        errors.push(`Row ${lineNum}: Invalid 40HC rate.`);
        return;
      }

      const id = `IRT-${String(Math.floor(100000 + Math.random() * 900000))}`;
      validRows.push({
        id,
        sp: user.company,
        carrier: row.carrier || 'Maersk',
        por: row.por || row.pol,
        pol: row.pol,
        pod: row.pod,
        fpod: row.fpod || row.pod,
        d20: Number(row.d20),
        h40: Number(row.h40),
        ft: row.ft || '14 days',
        tt: row.tt || '28 days',
        valid: row.valid || '2026-09-30',
        rateType: row.rateType || 'Direct',
        route: row.route || 'Direct',
        remark: row.remark || 'Bulk imported',
        ownerUid: user.uid,
        isOwner: true,
      });
    });

    if (validRows.length > 0) {
      setMyRates((prev) => [...validRows, ...prev]);
      toast(`Successfully imported ${validRows.length} valid rates into i-Rates inventory.`);
    }

    return { count: validRows.length, errors };
  };

  return (
    <DataContext.Provider
      value={{
        posts,
        addPost,
        deletePost,
        reactPost,
        savePost,
        addComment,
        addReply,
        reactComment,
        reactReply,
        jobs,
        addJob,
        deleteJob,
        ads,
        bookAd,
        topics,
        addTopic,
        addTopicReply,
        reviews,
        addReview,
        cases,
        addCase,
        auctions,
        addAuction,
        submitBid,
        mySubmittedBids,
        rates,
        myRates,
        addMyRate,
        deleteMyRate,
        bulkImportRates,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
