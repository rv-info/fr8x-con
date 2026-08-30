'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  FeedPost,
  PostComment,
  CommentReply,
  NestedReply,
  JobPost,
  NexusTopic,
  CompanyReview,
  BlacklistCase,
  BlacklistDispute,
  Auction,
  SubmittedBid,
  RateItem,
  ContainerEquipmentRow,
  SelectedBidder,
  PostReport,
  AppNotification,
} from '@/lib/types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Initial Mock Datasets
const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'New Bid Received · RA-2026-0842',
    desc: 'Rotterdam Freight NV submitted an offer of USD $2,320 for Mumbai → Rotterdam (Auto Parts FCL).',
    time: '10m ago',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    read: false,
    type: 'bid_received',
    category: 'bids',
    targetUrl: '/auctions',
    relatedId: 'RA-2026-0842',
    actionLabel: 'View Auction',
  },
  {
    id: 'notif-2',
    title: 'Auction RA-2026-0842 Closing in 2 Hours',
    desc: 'Mumbai → Rotterdam auction closes at 17:00 IST. 3 bids received so far.',
    time: '45m ago',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
    type: 'auction_closed',
    category: 'auctions',
    targetUrl: '/auctions',
    relatedId: 'RA-2026-0842',
    actionLabel: 'View Auction',
  },
  {
    id: 'notif-3',
    title: 'Auction Result: GB-2026-0311 Awarded',
    desc: 'You won the Nhava Sheva → Antwerp (Industrial Machinery) auction with a bid of USD $2,990.',
    time: '1d ago',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    type: 'auction_result',
    category: 'auctions',
    targetUrl: '/auctions',
    relatedId: 'GB-2026-0311',
    actionLabel: 'View Result',
  },
  {
    id: 'notif-4',
    title: 'New Message from Sarah Lewis',
    desc: 'Sarah Lewis (Rotterdam Freight NV): "Confirming rates for the Antwerp corridor…"',
    time: '2h ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
    type: 'chat_message',
    category: 'chat',
    targetUrl: '/feeds',
    relatedId: 'u-sarah',
    actionLabel: 'Reply',
  },
  {
    id: 'notif-5',
    title: 'Rate RT-884210 Expiring Soon',
    desc: 'Hapag-Lloyd rate for Nhava Sheva → Rotterdam expires on 30 Sep 2026. Review or renew.',
    time: '3d ago',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    type: 'system',
    category: 'system',
    targetUrl: '/rates',
    relatedId: 'RT-884210',
    actionLabel: 'View Rates',
  },
  {
    id: 'notif-6',
    title: 'New Job Posted: Trade Lane Manager',
    desc: 'Northstar Freight Group posted a Trade Lane Manager position in Dubai, UAE.',
    time: '2d ago',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    type: 'job_posted',
    category: 'jobs',
    targetUrl: '/jobs',
    relatedId: 'j2',
    actionLabel: 'View Job',
  },
];

const SEED_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    authorUid: 'u-priya',
    author: 'Priya Nair',
    authorRole: 'Trade Specialist · Mumbai',
    authorCompany: 'Nair Cargo Solutions',
    authorTimezone: 'Asia/Kolkata',
    hasGoldenTick: false,
    postType: 'rate_info',
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
            replies: [
              {
                id: 'nr1',
                parentReplyId: 'r1',
                authorUid: 'u-kiran',
                author: 'Kiran Mehta',
                authorRole: 'Trade Lane Manager',
                authorCompany: 'Indo Ocean Lines',
                authorTimezone: 'Asia/Kolkata',
                hasGoldenTick: false,
                text: 'Connecting via Trade Chat to review the Antwerp allocations.',
                time: '10m ago',
                likes: 1,
                dis: 0,
              },
            ],
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
    id: 'post-2',
    authorUid: 'u-arjun',
    author: 'Arjun Rao',
    authorRole: 'Freight Manager · Mumbai',
    authorCompany: 'Atlas Logistics Pvt. Ltd.',
    authorTimezone: 'Asia/Kolkata',
    hasGoldenTick: true,
    time: '3h ago',
    text: 'Reverse auction published for *Mumbai → Rotterdam (FCL Export)*.\n12x 40HC containers cargo-ready by 05 Sep. Verified forwarders can review requirements in the Auction Dashboard.',
    postType: 'auction_ref',
    likes: 18,
    dis: 0,
    liked: false,
    disliked: false,
    isSaved: true,
    isAuctionAnnouncement: true,
    auctionRefId: 'RA-2026-0842',
    comments: [],
  },
  {
    id: 'post-3',
    authorUid: 'u-kiran',
    author: 'Kiran Mehta',
    authorRole: 'Trade Lane Manager · Mumbai',
    authorCompany: 'Indo Ocean Lines',
    authorTimezone: 'Asia/Kolkata',
    hasGoldenTick: false,
    postType: 'announcement',
    time: '5h ago',
    text: '📣 **Company Announcement**: Indo Ocean Lines has expanded its FCL services to the US West Coast via the Asia-Pacific Express (APX) service.\n\nNew direct services from Nhava Sheva and Mundra to LA and Long Beach, with transit times of 18–21 days.',
    likes: 31,
    dis: 0,
    liked: false,
    disliked: false,
    isSaved: false,
    comments: [],
  },
  {
    id: 'post-4',
    authorUid: 'u-sarah',
    author: 'Sarah Lewis',
    authorRole: 'Ocean Freight Lead · Rotterdam',
    authorCompany: 'Rotterdam Freight NV',
    authorTimezone: 'Europe/Amsterdam',
    hasGoldenTick: false,
    postType: 'logistics_discussion',
    time: '6h ago',
    text: 'Interesting discussion to have: with GRI surcharges on Asia-Europe lanes hitting USD 400-600 per TEU, what is the breakeven where airfreight becomes commercially viable for high-value cargo?\n\nI\'d argue for electronics and pharma the answer is closer than most shippers realise.',
    likes: 14,
    dis: 2,
    liked: false,
    disliked: false,
    isSaved: false,
    comments: [],
  },
];

const SEED_JOBS: JobPost[] = [
  {
    id: 'j1',
    title: 'Senior Freight Pricing Analyst',
    company: 'Atlas Logistics Pvt. Ltd.',
    location: 'Mumbai, India · On-site',
    experience: '3–5 yrs experience',
    packageDetails: '₹8–12 LPA + Performance Bonus',
    employmentType: 'Full-time',
    requirements: 'FCL/LCL spot rate benchmarking, carrier negotiations, UN/LOCODE lane procurement, ERP systems, and strong analytical communication.',
    responsibilities: 'Manage rate tenders, benchmark ocean freight indexes, liaise with shipping lines for preferential volume space.',
    qualifications: "Bachelor's degree in Supply Chain/Logistics or equivalent industry experience.",
    skills: ['FCL Pricing', 'Carrier Negotiations', 'Rate Benchmarking', 'UN/LOCODE'],
    closingDate: '15 Sep 2026',
    postedBy: 'Arjun Rao',
    posterUid: 'u-arjun',
    posterEmail: 'arjun@atlaslogistics.com',
    showEmailPublicly: true,
    posterTimezone: 'Asia/Kolkata',
    postedDate: '26 Aug 2026',
    status: 'active',
  },
  {
    id: 'j2',
    title: 'Trade Lane Manager (Middle East & Europe)',
    company: 'Northstar Freight Group',
    location: 'Dubai, UAE · Hybrid',
    experience: '6–9 yrs experience',
    packageDetails: 'AED 22,000 – 30,000 / month',
    employmentType: 'Full-time',
    requirements: 'Direct carrier space allocation, P&L management, key account servicing, and multimodal supply chain execution across Jebel Ali and European hubs.',
    responsibilities: 'Lead pricing strategy for Middle East outbound corridors, oversee carrier service contracts, manage freight operations team.',
    qualifications: 'Minimum 6 years in trade lane management with tier-1 forwarders.',
    skills: ['Trade Lane Management', 'P&L', 'Carrier Contracts', 'Multimodal Logistics'],
    closingDate: '20 Sep 2026',
    postedBy: 'Sarah Lewis',
    posterUid: 'u-sarah',
    posterEmail: 'sarah.lewis@rotterdamfreight.nl',
    showEmailPublicly: false,
    posterTimezone: 'Europe/Amsterdam',
    postedDate: '25 Aug 2026',
    status: 'active',
  },
  {
    id: 'j3',
    title: 'Customer Success & Procurement Lead',
    company: 'CargoLink Global',
    location: 'Singapore · On-site',
    experience: '4–6 yrs experience',
    packageDetails: 'SGD 6,000 – 8,500 / month',
    employmentType: 'Full-time',
    requirements: 'Customer RFP responses, rate build-ups, demurrage/detention dispute resolution, and cross-functional carrier management.',
    responsibilities: 'Build procurement schedules, verify freight charges against contracts, maintain shipper SLA compliance.',
    qualifications: 'Degree in Logistics, Business Administration, or Maritime Studies.',
    skills: ['Rate Build-up', 'Demurrage Management', 'Customer Success', 'Carrier Management'],
    closingDate: '10 Sep 2026',
    postedBy: 'Ravi Thomas',
    posterUid: 'u-ravi',
    posterEmail: 'ravi@cargolink.sg',
    showEmailPublicly: true,
    posterTimezone: 'Asia/Singapore',
    postedDate: '24 Aug 2026',
    status: 'active',
  },
  {
    id: 'j4',
    title: 'Ocean Freight Operations Executive',
    company: 'Indo Ocean Lines',
    location: 'Mumbai, India · On-site',
    experience: '2–4 yrs experience',
    packageDetails: '₹5–8 LPA',
    employmentType: 'Full-time',
    requirements: 'Bill of lading management, shipping instruction processing, container tracking, and carrier coordination for FCL/LCL shipments.',
    responsibilities: 'Process export documentation, coordinate with shipping lines and CHAs, manage shipment milestones.',
    qualifications: "Bachelor's in Commerce/Logistics. Knowledge of INCOTERMS and customs regulations.",
    skills: ['B/L Management', 'Container Tracking', 'Export Documentation', 'INCOTERMS'],
    closingDate: '30 Sep 2026',
    postedBy: 'Kiran Mehta',
    posterUid: 'u-kiran',
    posterEmail: 'kiran@indoocean.com',
    showEmailPublicly: true,
    posterTimezone: 'Asia/Kolkata',
    postedDate: '22 Aug 2026',
    status: 'active',
  },
];

const SEED_TOPICS: NexusTopic[] = [
  {
    id: 'top-1',
    title: 'Port congestion: practical routing alternatives via Colombo and Salalah',
    author: 'Priya Nair',
    authorUid: 'u-priya',
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
        id: 'tr-1',
        author: 'Kiran Mehta',
        authorUid: 'u-kiran',
        text: 'Colombo transshipment saved us four days on our last automotive shipment.',
        time: '1d ago',
      },
      {
        id: 'tr-2',
        author: 'Ravi Thomas',
        authorUid: 'u-ravi',
        text: 'Confirm free time agreements separately for transshipment ports to avoid detention spikes.',
        time: '18h ago',
      },
    ],
  },
  {
    id: 'top-2',
    title: 'What is reasonable detention-free time for Antwerp and Rotterdam imports?',
    author: 'Kiran Mehta',
    authorUid: 'u-kiran',
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
        id: 'tr-3',
        author: 'Sarah Lewis',
        authorUid: 'u-sarah',
        text: 'Standard is 10 calendar days; with Tier-1 volume we negotiate 14 to 21 combined days.',
        time: '2d ago',
        hasGoldenTick: false,
      },
    ],
  },
];

const SEED_REVIEWS: CompanyReview[] = [
  {
    id: 'cr-1',
    companyName: 'Atlas Logistics Pvt. Ltd.',
    location: 'Mumbai, India',
    ratingAverage: 4.8,
    totalReviews: 24,
    starDistribution: [18, 4, 2, 0, 0],
    recentReviews: [
      {
        id: 'rv-1',
        author: 'Sarah Lewis',
        authorUid: 'u-sarah',
        rating: 5,
        text: 'Consistently clear shipping documentation and prompt payment settlement on completed reverse auctions.',
        date: '20 Aug 2026',
        verified: true,
        likes: 18,
        dis: 0,
        tags: ['Prompt Settlement', 'Clean BL Documentation'],
      },
      {
        id: 'rv-2',
        author: 'Kiran Mehta',
        authorUid: 'u-kiran',
        rating: 4.5,
        text: 'Excellent inland haulage tracking and prompt customs clearance coordination at JNPT.',
        date: '15 Aug 2026',
        verified: true,
        likes: 12,
        dis: 1,
        tags: ['On-Time Dwell', 'Customs Clearance'],
      },
    ],
  },
  {
    id: 'cr-2',
    companyName: 'Rotterdam Freight NV',
    location: 'Rotterdam, Netherlands',
    ratingAverage: 4.6,
    totalReviews: 19,
    starDistribution: [14, 3, 2, 0, 0],
    recentReviews: [
      {
        id: 'rv-3',
        author: 'Arjun Rao',
        authorUid: 'u-arjun',
        rating: 5,
        text: 'Outstanding destination handling and demurrage management at ECT Delta terminal.',
        date: '18 Aug 2026',
        verified: true,
        likes: 15,
        dis: 0,
        tags: ['Demurrage Waiver', 'Port Drayage'],
      },
    ],
  },
  {
    id: 'cr-3',
    companyName: 'Indo Ocean Lines',
    location: 'Mumbai, India',
    ratingAverage: 4.7,
    totalReviews: 16,
    starDistribution: [12, 3, 1, 0, 0],
    recentReviews: [
      {
        id: 'rv-4',
        author: 'Priya Sharma',
        authorUid: 'u-priya',
        rating: 5,
        text: 'Reliable slot allocations on Asia-Europe routes even during blank sailings.',
        date: '10 Aug 2026',
        verified: true,
        likes: 9,
        dis: 0,
        tags: ['Space Guarantee', 'Fair Surcharges'],
      },
    ],
  },
];

const SEED_BLACKLIST: BlacklistCase[] = [
  {
    id: 'bl-1',
    companyName: 'Pacific Rim Trans Inc.',
    location: 'Hong Kong',
    reason: 'Repeated non-payment of inland container haulage invoices',
    severity: 'critical',
    reportedDate: '12 Aug 2026',
    status: 'under_investigation',
    reporter: 'Apex Multimodal Co.',
    reporterUid: 'u-apex',
    description: 'Outstanding invoices for 8x 40HC container movements across Ningbo-Nhava Sheva corridor unpaid past 90 days.',
    evidenceRef: 'BL-INV-2026-9912 / Bill of Lading BL#8821034',
    agreedCount: 28,
    disputeCount: 2,
    userAgreed: false,
    userDisputed: false,
    disputes: [
      {
        id: 'dsp-1',
        author: 'David Chen',
        authorCompany: 'Pacific Rim Trans Legal',
        date: '15 Aug 2026',
        text: 'Dispute filed: Partial payment of $18,400 remitted via HSBC HK on 14 Aug. Pending demurrage adjustment calculation.',
        evidenceDoc: 'SWIFT-MT103-HK99281.pdf',
        status: 'under_review',
      },
    ],
  },
  {
    id: 'bl-2',
    companyName: 'Horizon Express Line LLC',
    location: 'Dubai, UAE',
    reason: 'Issuance of unauthorized House Bills of Lading without carrier asset backup',
    severity: 'high',
    reportedDate: '04 Aug 2026',
    status: 'active',
    reporter: 'Global Sealink Forwarders',
    reporterUid: 'u-globalsea',
    description: 'Issued fictitious forwarder cargo receipts without confirming ocean carrier booking confirmation.',
    evidenceRef: 'FCR-AE-04192 / Port Authority Audit Log',
    agreedCount: 35,
    disputeCount: 0,
    userAgreed: true,
    userDisputed: false,
    disputes: [],
  },
  {
    id: 'bl-3',
    companyName: 'Apex Maritime Trans NV',
    location: 'Antwerp, Belgium',
    reason: 'Unpaid Ocean Demurrage Default ($34,200 USD on 18 containers)',
    severity: 'critical',
    reportedDate: '01 Aug 2026',
    status: 'active',
    reporter: 'Rotterdam Freight NV',
    reporterUid: 'u-sarah',
    description: 'Overdue demurrage exposure for over 180 days on ECT Delta transshipments without settlement or counter-proof.',
    evidenceRef: 'INV-2026-9081 / OBL-8812 / Notice-902',
    agreedCount: 42,
    disputeCount: 1,
    userAgreed: false,
    userDisputed: false,
    disputes: [
      {
        id: 'dsp-2',
        author: 'Marc Dubois',
        authorCompany: 'Apex Maritime Trans NV',
        date: '08 Aug 2026',
        text: 'Terminal crane breakdown caused 12-day dwell delay beyond consignee control. Formal waiver request pending with ECT.',
        evidenceDoc: 'ECT-INCIDENT-REPORT-4402.pdf',
        status: 'under_review',
      },
    ],
  },
];

const SEED_AUCTIONS: Auction[] = [
  {
    id: 'RA-2026-0842',
    title: 'Mumbai → Rotterdam (Auto Parts FCL)',
    rfqId: 'RFQ-88410',
    creatorUid: 'u-arjun',
    creatorName: 'Arjun Rao',
    creatorCompany: 'Atlas Logistics Pvt. Ltd.',
    auctionType: 'Specific bidder',
    startDate: '2026-08-28',
    startTime: '14:00',
    durationMinutes: 180,
    endDateTime: '2026-08-28 17:00 IST',
    timezone: 'Asia/Kolkata',
    status: 'Live',
    rank: '#1',
    timeLeft: '1h 45m',
    isPublished: true,
    publishedAt: '2026-08-28T14:00:00Z',
    competitionCeiling: 2450,
    bidsSubmittedCount: 3,
    shipment: {
      por: 'Nhava Sheva (INNSA), India',
      pol: 'Nhava Sheva (INNSA), India',
      pod: 'Rotterdam (NLRTM), Netherlands',
      finalDestination: 'Rotterdam (NLRTM), Netherlands',
      cargoReadyDate: '2026-09-05',
      shipmentType: 'FCL',
      movementType: 'Port to Port',
      incoterm: 'FOB - Free on Board',
      blType: 'Seaway Bill',
      rateCurrency: 'USD',
      commodity: 'Automotive Components',
      hsCode: '8708.29',
      weightKg: 24000,
      cbm: 68,
      isHazardous: false,
      specialRequirements: '14 days combined demurrage/detention required at destination.',
    },
    containers: [
      {
        id: 'c-row-1',
        equipmentType: '40HC',
        containerType: 'Standard',
        quantity: 2,
        pickupLocation: 'Nhava Sheva CFS',
        emptyReturnLocation: 'ECT Delta Rotterdam',
        isSpecial: false,
        commodity: 'Automotive Components',
        hsCode: '8708.29',
        grossWeight: 24000,
        weightUnit: 'KG',
        dimensions: '40ft x 8ft x 9.5ft',
      },
    ],
    originCharges: {
      transportation: false,
      clearance: true,
      carrierLocal: true,
      pickupAddress: 'Sector 3 CFS, JNPT, Navi Mumbai',
    },
    destinationCharges: {
      transportation: false,
      clearance: false,
      carrierLocal: true,
      destuffingAddress: 'ECT Delta Terminal, Port of Rotterdam',
    },
    selectedBidders: [
      {
        id: 'sarah',
        name: 'Sarah Lewis',
        company: 'Rotterdam Freight NV',
        role: 'Ocean Freight Lead',
        location: 'Rotterdam, Netherlands',
        timezone: 'Europe/Amsterdam',
        hasGoldenTick: false,
      },
      {
        id: 'kiran',
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
      bidLimit: 10,
    },
    bids: [
      {
        id: 'bid-1',
        auctionId: 'RA-2026-0842',
        bidderUid: 'u-sarah',
        bidderName: 'Sarah Lewis',
        bidderCompany: 'Rotterdam Freight NV',
        bidderHasGoldenTick: false,
        charges: [
          {
            equipment: '40HC',
            quantity: 2,
            oceanFreight: 2150,
            freightSurcharges: 100,
            originTransport: 0,
            originClearance: 40,
            originLocal: 30,
            destTransport: 0,
            destClearance: 0,
            destLocal: 0,
            totalUnit: 2320,
          },
        ],
        grandTotalUSD: 2320,
        rank: 1,
        feePaid: 0,
        currency: 'USD',
        submittedAt: '14:25 IST',
        status: 'winning',
      },
    ],
    historicalSnapshot: {
      publishedAt: '2026-08-28T14:00:00Z',
      creatorSnapshot: {
        name: 'Arjun Rao',
        company: 'Atlas Logistics Pvt. Ltd.',
        email: 'arjun@atlaslogistics.com',
        location: 'Mumbai, India',
      },
    },
  },
  {
    id: 'GB-2026-0311',
    title: 'Nhava Sheva → Antwerp (Industrial Machinery)',
    rfqId: 'RFQ-99211',
    creatorUid: 'u-sarah',
    creatorName: 'Sarah Lewis',
    creatorCompany: 'Rotterdam Freight NV',
    auctionType: 'General bidding',
    startDate: '2026-08-27',
    startTime: '09:00',
    durationMinutes: 240,
    endDateTime: '2026-08-27 13:00 CET',
    timezone: 'Europe/Amsterdam',
    status: 'Awarded',
    rank: '#1 (Won)',
    timeLeft: 'Closed',
    isPublished: true,
    publishedAt: '2026-08-27T09:00:00Z',
    competitionCeiling: 3100,
    bidsSubmittedCount: 5,
    shipment: {
      por: 'Nhava Sheva (INNSA), India',
      pol: 'Nhava Sheva (INNSA), India',
      pod: 'Antwerp (BEANR), Belgium',
      finalDestination: 'Antwerp (BEANR), Belgium',
      cargoReadyDate: '2026-09-02',
      shipmentType: 'FCL',
      movementType: 'Port to Port',
      incoterm: 'CIF - Cost, Insurance and Freight',
      rateCurrency: 'USD',
      commodity: 'Industrial Machinery',
      hsCode: '8479.89',
      weightKg: 28000,
      cbm: 75,
    },
    containers: [
      {
        id: 'c-row-2',
        equipmentType: '40HC',
        containerType: 'Standard',
        quantity: 1,
        pickupLocation: 'Nhava Sheva CFS',
        emptyReturnLocation: 'Antwerp Gateway',
        isSpecial: false,
        commodity: 'Machinery',
        hsCode: '8479.89',
        grossWeight: 28000,
        weightUnit: 'KG',
      },
    ],
    originCharges: {
      transportation: false,
      clearance: true,
      carrierLocal: true,
    },
    destinationCharges: {
      transportation: false,
      clearance: true,
      carrierLocal: true,
    },
    selectedBidders: [],
    blockedBidders: [],
    rules: {
      autoExtension: false,
      rankingVisible: true,
      hideCompetitorNames: true,
      bidderAnonymity: true,
      bidLimit: 5,
    },
    bids: [
      {
        id: 'bid-2',
        auctionId: 'GB-2026-0311',
        bidderUid: 'u-arjun',
        bidderName: 'Arjun Rao',
        bidderCompany: 'Atlas Logistics Pvt. Ltd.',
        bidderHasGoldenTick: true,
        charges: [
          {
            equipment: '40HC',
            quantity: 1,
            oceanFreight: 2750,
            freightSurcharges: 150,
            originTransport: 0,
            originClearance: 50,
            originLocal: 40,
            destTransport: 0,
            destClearance: 0,
            destLocal: 0,
            totalUnit: 2990,
          },
        ],
        grandTotalUSD: 2990,
        rank: 1,
        feePaid: 0,
        currency: 'USD',
        submittedAt: '27 Aug 11:30 IST',
        status: 'winning',
      },
      {
        id: 'bid-3',
        auctionId: 'GB-2026-0311',
        bidderUid: 'u-kiran',
        bidderName: 'Kiran Mehta',
        bidderCompany: 'Indo Ocean Lines',
        bidderHasGoldenTick: false,
        charges: [
          {
            equipment: '40HC',
            quantity: 1,
            oceanFreight: 2820,
            freightSurcharges: 140,
            originTransport: 0,
            originClearance: 45,
            originLocal: 35,
            destTransport: 0,
            destClearance: 0,
            destLocal: 0,
            totalUnit: 3040,
          },
        ],
        grandTotalUSD: 3040,
        rank: 2,
        feePaid: 0,
        currency: 'USD',
        submittedAt: '27 Aug 11:45 IST',
        status: 'outbid',
      },
      {
        id: 'bid-4',
        auctionId: 'GB-2026-0311',
        bidderUid: 'u-hapag',
        bidderName: 'Trade Line Desk',
        bidderCompany: 'Atlantic Ocean Forwarders',
        bidderHasGoldenTick: false,
        charges: [
          {
            equipment: '40HC',
            quantity: 1,
            oceanFreight: 2860,
            freightSurcharges: 140,
            originTransport: 0,
            originClearance: 45,
            originLocal: 35,
            destTransport: 0,
            destClearance: 0,
            destLocal: 0,
            totalUnit: 3080,
          },
        ],
        grandTotalUSD: 3080,
        rank: 3,
        feePaid: 0,
        currency: 'USD',
        submittedAt: '27 Aug 12:10 IST',
        status: 'outbid',
      },
    ],
    winningBidId: 'bid-2',
    result: 'won' as const,
    resultDetail: 'Awarded to Atlas Logistics Pvt. Ltd. at USD $2,990 (L1 Lowest Qualified Bid).',
    closedAt: '2026-08-27T13:00:00Z',
    postingFeeINR: 300,
    postingFeeUSD: 7,
    awardedDetails: {
      awardedAt: '2026-08-27 13:05 CET',
      docketId: 'DOCKET-AWARD-GB-2026-0311-SEALED',
      winningCompany: 'Atlas Logistics Pvt. Ltd.',
      winningContact: 'Arjun Rao (Director of Procurement)',
      winningRateUSD: 2990,
      carrier: 'CMA CGM (Direct Service)',
      transitTime: '26 Days (Nhava Sheva to Antwerp Gateway)',
      freeTimeOrigin: '14 Days Combined Detention & Demurrage',
      freeTimeDest: '21 Days Combined Demurrage & Detention',
      equipmentBreakdown: '1x 40HC @ $2,990 USD All-In (Ocean: $2,750 + Surcharges: $150 + Locals: $90)',
      shipperCompany: 'Rotterdam Freight NV',
      shipperContact: 'Sarah Lewis (Ocean Procurement Lead)',
      settlementTerms: 'Net 45 Days against Clean OBL & Verified VGM',
    },
    timeline: [
      { event: 'Created', timestamp: '2026-08-27T08:30:00Z' },
      { event: 'Published', timestamp: '2026-08-27T09:00:00Z', detail: 'Opened for general bidding' },
      { event: 'Bid Received', timestamp: '2026-08-27T09:45:00Z', detail: '5 bids submitted' },
      { event: 'Closed', timestamp: '2026-08-27T13:00:00Z' },
      { event: 'Result Generated', timestamp: '2026-08-27T13:05:00Z', detail: 'Awarded to Atlas Logistics Pvt. Ltd.' },
    ],
  },
  {
    id: 'RA-2026-0901',
    title: 'Chennai → Hamburg (Chemical Drums)',
    rfqId: 'RFQ-77320',
    creatorUid: 'u-arjun',
    creatorName: 'Arjun Rao',
    creatorCompany: 'Atlas Logistics Pvt. Ltd.',
    auctionType: 'General bidding',
    startDate: '2026-09-05',
    startTime: '10:00',
    durationMinutes: 120,
    endDateTime: '2026-09-05 12:00 IST',
    timezone: 'Asia/Kolkata',
    status: 'Draft',
    isPublished: false,
    draftedAt: '2026-08-28T09:00:00Z',
    postingFeeINR: 300,
    postingFeeUSD: 7,
    competitionCeiling: 3200,
    bidsSubmittedCount: 0,
    shipment: {
      por: 'Chennai (INMAA), India',
      pol: 'Chennai (INMAA), India',
      pod: 'Hamburg (DEHAM), Germany',
      finalDestination: 'Hamburg (DEHAM), Germany',
      cargoReadyDate: '2026-09-08',
      shipmentType: 'FCL',
      movementType: 'Port to Port',
      incoterm: 'CFR - Cost and Freight',
      rateCurrency: 'USD',
      commodity: 'Chemical Drums (UN1263)',
      hsCode: '3814.00',
      weightKg: 18000,
      cbm: 45,
      isHazardous: true,
      unNumber: 'UN1263',
      imoClass: 'Class 3',
    },
    containers: [
      {
        id: 'c-draft-1',
        equipmentType: '20DV',
        containerType: 'Standard',
        quantity: 3,
        pickupLocation: 'Chennai CFS',
        emptyReturnLocation: 'Hamburg CTA',
        isSpecial: true,
        commodity: 'Chemical Drums',
        hsCode: '3814.00',
        grossWeight: 18000,
        weightUnit: 'KG',
        specialInstructions: 'Hazmat compliant packaging required. IMO class 3.',
      },
    ],
    originCharges: { transportation: true, clearance: true, carrierLocal: true, pickupAddress: 'Chemical Logistics Park, Chennai' },
    destinationCharges: { transportation: false, clearance: false, carrierLocal: true },
    selectedBidders: [],
    blockedBidders: [],
    rules: { autoExtension: false, rankingVisible: true, hideCompetitorNames: true, bidderAnonymity: false, bidLimit: 5 },
    bids: [],
  },
  {
    id: 'RA-2026-0788',
    title: 'Mundra → Jebel Ali (Consumer Electronics)',
    rfqId: 'RFQ-61290',
    creatorUid: 'u-arjun',
    creatorName: 'Arjun Rao',
    creatorCompany: 'Atlas Logistics Pvt. Ltd.',
    auctionType: 'Specific bidder',
    startDate: '2026-08-20',
    startTime: '11:00',
    durationMinutes: 90,
    endDateTime: '2026-08-20 12:30 IST',
    timezone: 'Asia/Kolkata',
    status: 'Expired',
    isPublished: true,
    publishedAt: '2026-08-20T11:00:00Z',
    closedAt: '2026-08-20T12:30:00Z',
    result: 'expired' as const,
    resultDetail: 'No qualifying bids received within the bidding window.',
    postingFeeINR: 300,
    postingFeeUSD: 7,
    competitionCeiling: 1200,
    bidsSubmittedCount: 0,
    shipment: {
      por: 'Mundra (INMUN), India',
      pol: 'Mundra (INMUN), India',
      pod: 'Jebel Ali (AEJEA), UAE',
      finalDestination: 'Jebel Ali (AEJEA), UAE',
      cargoReadyDate: '2026-08-25',
      shipmentType: 'FCL',
      movementType: 'Port to Port',
      incoterm: 'FOB - Free on Board',
      rateCurrency: 'USD',
      commodity: 'Consumer Electronics',
      hsCode: '8471.30',
      weightKg: 12000,
      cbm: 35,
      isHazardous: false,
    },
    containers: [
      {
        id: 'c-exp-1',
        equipmentType: '40HC',
        containerType: 'Standard',
        quantity: 1,
        pickupLocation: 'Mundra CFS',
        emptyReturnLocation: 'Jebel Ali',
        isSpecial: false,
        commodity: 'Consumer Electronics',
        hsCode: '8471.30',
        grossWeight: 12000,
        weightUnit: 'KG',
      },
    ],
    originCharges: { transportation: false, clearance: true, carrierLocal: true },
    destinationCharges: { transportation: false, clearance: false, carrierLocal: false },
    selectedBidders: [
      { id: 'kiran', name: 'Kiran Mehta', company: 'Indo Ocean Lines', role: 'Trade Lane Manager', location: 'Mumbai, India', timezone: 'Asia/Kolkata' },
    ],
    blockedBidders: [],
    rules: { autoExtension: false, rankingVisible: false, hideCompetitorNames: true, bidderAnonymity: true, bidLimit: 3 },
    bids: [],
    timeline: [
      { event: 'Created', timestamp: '2026-08-19T14:00:00Z' },
      { event: 'Published', timestamp: '2026-08-20T11:00:00Z' },
      { event: 'Expired', timestamp: '2026-08-20T12:30:00Z', detail: 'No qualifying bids received' },
    ],
  },
];

const SEED_RATES: RateItem[] = [
  {
    id: 'RT-884210',
    sp: 'Hapag-Lloyd Ocean',
    carrier: 'Hapag-Lloyd',
    por: 'Nhava Sheva (INNSA), India',
    pol: 'Nhava Sheva (INNSA), India',
    pod: 'Rotterdam (NLRTM), Netherlands',
    fpod: 'Rotterdam (NLRTM), Netherlands',
    d20: 1850,
    h40: 2320,
    ft: '14 days combined',
    tt: '28 days',
    valid: '2026-09-30',
    rateType: 'Spot Contract',
    route: 'Direct EP-X Service',
    remark: 'Subject to low sulphur fuel bunker surcharge at destination.',
  },
  {
    id: 'RT-992144',
    sp: 'Maersk Line Direct',
    carrier: 'Maersk',
    por: 'Mundra (INMUN), India',
    pol: 'Mundra (INMUN), India',
    pod: 'Jebel Ali (AEJEA), UAE',
    fpod: 'Jebel Ali (AEJEA), UAE',
    d20: 680,
    h40: 950,
    ft: '21 days',
    tt: '5 days',
    valid: '2026-09-15',
    rateType: 'Direct Feeder',
    route: 'Arabian Express',
    remark: 'Direct weekly shuttle service with guaranteed equipment release.',
  },
];

interface DataContextType {
  // Feeds
  posts: FeedPost[];
  addPost: (text: string, postType?: FeedPost['postType']) => void;
  editPost: (postId: string | number, newText: string) => void;
  deletePost: (postId: string | number) => void;
  reactPost: (postId: string | number, reaction: 'like' | 'dis') => void;
  savePost: (postId: string | number) => void;
  reportTarget: (
    targetId: string,
    targetType: PostReport['targetType'],
    category: PostReport['category'],
    description: string
  ) => void;
  reports: PostReport[];
  // Threaded Comments
  addComment: (postId: string | number, text: string) => void;
  addReply: (postId: string | number, commentId: string, text: string) => void;
  addNestedReply: (postId: string | number, commentId: string, parentReplyId: string, text: string) => void;
  reactComment: (postId: string | number, commentId: string, reaction: 'like' | 'dis') => void;
  reactReply: (postId: string | number, commentId: string, replyId: string, reaction: 'like' | 'dis') => void;
  // Jobs
  jobs: JobPost[];
  addJob: (jobData: Omit<JobPost, 'id' | 'postedDate' | 'postedBy' | 'isOwner' | 'status'>) => void;
  deleteJob: (jobId: string) => void;
  // Nexus
  topics: NexusTopic[];
  addTopic: (title: string, category: string, text: string) => void;
  addTopicReply: (topicId: string, text: string) => void;
  reactTopic: (topicId: string, reaction: 'like' | 'dis') => void;
  reactTopicReply: (topicId: string, replyId: string, reaction: 'like' | 'dis') => void;
  reviews: CompanyReview[];
  addReview: (companyName: string, location: string, rating: number, text: string) => void;
  reactReviewRemark: (companyId: string, reviewId: string, action: 'like' | 'dis') => void;
  cases: BlacklistCase[];
  addCase: (caseData: Omit<BlacklistCase, 'id' | 'reportedDate' | 'status' | 'reporter' | 'reporterUid'>) => void;
  agreeCase: (caseId: string) => void;
  disputeCase: (caseId: string, text: string, evidenceDoc?: string) => void;
  // Auctions
  auctions: Auction[];
  addAuction: (auctionData: Partial<Auction>) => string;
  updateAuctionStatus: (auctionId: string, status: Auction['status']) => void;
  submitBid: (auctionId: string, charges: any[], grandTotalUSD: number) => void;
  mySubmittedBids: SubmittedBid[];
  // Rates
  rates: RateItem[];
  myRates: RateItem[];
  addMyRate: (rateData: Omit<RateItem, 'id' | 'isOwner' | 'sp'>) => string;
  deleteMyRate: (rateId: string) => void;
  bulkImportRates: (importedRates: Partial<RateItem>[]) => { count: number; errors: string[] };
  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, bidPostingFee } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<FeedPost[]>(SEED_POSTS);
  const [jobs, setJobs] = useState<JobPost[]>(SEED_JOBS);
  const [topics, setTopics] = useState<NexusTopic[]>(SEED_TOPICS);
  const [reviews, setReviews] = useState<CompanyReview[]>(SEED_REVIEWS);
  const [cases, setCases] = useState<BlacklistCase[]>(SEED_BLACKLIST);
  const [auctions, setAuctions] = useState<Auction[]>(SEED_AUCTIONS);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [rates] = useState<RateItem[]>(SEED_RATES);
  const [myRates, setMyRates] = useState<RateItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [mySubmittedBids, setMySubmittedBids] = useState<SubmittedBid[]>([
    {
      id: 'bid-2',
      auctionId: 'GB-2026-0311',
      bidderUid: 'u-arjun',
      bidderName: 'Arjun Rao',
      bidderCompany: 'Atlas Logistics Pvt. Ltd.',
      bidderHasGoldenTick: true,
      charges: [
        {
          equipment: '40HC',
          quantity: 1,
          oceanFreight: 2750,
          freightSurcharges: 150,
          originTransport: 0,
          originClearance: 50,
          originLocal: 40,
          destTransport: 0,
          destClearance: 0,
          destLocal: 0,
          totalUnit: 2990,
        },
      ],
      grandTotalUSD: 2990,
      rank: 1,
      feePaid: 180,
      currency: 'USD',
      submittedAt: '27 Aug 11:30 IST',
      status: 'winning',
    },
  ]);

  // Notification Actions
  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast('All notifications marked as read.');
  };

  // Feed Actions
  const addPost = (text: string, postType: FeedPost['postType'] = 'general') => {
    if (!text.trim()) return;
    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      authorUid: user.uid,
      author: user.displayName,
      authorRole: `${user.designation} · ${user.city}`,
      authorCompany: user.company,
      authorTimezone: user.timezone,
      hasGoldenTick: user.hasGoldenTick,
      time: 'Just now',
      text: text.trim(),
      postType,
      likes: 0,
      dis: 0,
      liked: false,
      disliked: false,
      isSaved: false,
      comments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    toast('Post published to Global Freight Feed.');
  };

  const editPost = (postId: string | number, newText: string) => {
    const target = posts.find((p) => String(p.id) === String(postId));
    if (!target) return;

    // Check ownership
    if (target.authorUid !== user.uid) {
      toast('Permission denied: You can only edit your own posts.');
      return;
    }

    if (target.isAuctionAnnouncement) {
      toast('Cannot edit reverse auction postings directly through feed. Use Auction workflow.');
      return;
    }

    setPosts((prev) =>
      prev.map((p) => (String(p.id) === String(postId) ? { ...p, text: newText.trim() } : p))
    );
    toast('Post updated successfully.');
  };

  const deletePost = (postId: string | number) => {
    const target = posts.find((p) => String(p.id) === String(postId));
    if (!target) return;

    if (target.authorUid !== user.uid && user.role !== 'super_admin') {
      toast('Permission denied: You can only delete your own posts.');
      return;
    }

    setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));
    toast('Post removed from feed.');
  };

  const reactPost = (postId: string | number, reaction: 'like' | 'dis') => {
    setPosts((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        const liked = reaction === 'like' ? !p.liked : false;
        const disliked = reaction === 'dis' ? !p.disliked : false;
        const likes = p.likes + (liked ? 1 : p.liked ? -1 : 0);
        const dis = p.dis + (disliked ? 1 : p.disliked ? -1 : 0);
        return { ...p, liked, disliked, likes: Math.max(0, likes), dis: Math.max(0, dis) };
      })
    );
  };

  const savePost = (postId: string | number) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        const nextSaved = !p.isSaved;
        toast(nextSaved ? 'Post saved to your bookmarks.' : 'Post removed from saved bookmarks.');
        return { ...p, isSaved: nextSaved };
      })
    );
  };

  const reportTarget = (
    targetId: string,
    targetType: PostReport['targetType'],
    category: PostReport['category'],
    description: string
  ) => {
    const newReport: PostReport = {
      id: `rep-${Date.now()}`,
      targetId,
      targetType,
      reporterUid: user.uid,
      reporterName: user.displayName,
      category,
      description: description.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setReports((prev) => [newReport, ...prev]);
    toast('Report submitted to moderation queue. Thank you for keeping FR8X verified.');
  };

  // Threaded Comment Actions (Post -> Comment -> Reply -> Reply-to-Reply)
  const addComment = (postId: string | number, text: string) => {
    if (!text.trim()) return;
    const newComment: PostComment = {
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
    setPosts((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        return { ...p, comments: [...p.comments, newComment] };
      })
    );
    toast('Comment added.');
  };

  const addReply = (postId: string | number, commentId: string, text: string) => {
    if (!text.trim()) return;
    const newReply: CommentReply = {
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
      replies: [],
    };
    setPosts((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            return { ...c, replies: [...(c.replies || []), newReply] };
          }),
        };
      })
    );
    toast('Reply posted.');
  };

  const addNestedReply = (
    postId: string | number,
    commentId: string,
    parentReplyId: string,
    text: string
  ) => {
    if (!text.trim()) return;
    const nested: NestedReply = {
      id: `nr-${Date.now()}`,
      parentReplyId,
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

    setPosts((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              replies: (c.replies || []).map((r) => {
                if (r.id !== parentReplyId) return r;
                return { ...r, replies: [...(r.replies || []), nested] };
              }),
            };
          }),
        };
      })
    );
    toast('Nested reply posted.');
  };

  const reactComment = (postId: string | number, commentId: string, reaction: 'like' | 'dis') => {
    setPosts((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            const liked = reaction === 'like' ? !c.liked : false;
            const disliked = reaction === 'dis' ? !c.disliked : false;
            const likes = c.likes + (liked ? 1 : c.liked ? -1 : 0);
            const dis = c.dis + (disliked ? 1 : c.disliked ? -1 : 0);
            return { ...c, liked, disliked, likes: Math.max(0, likes), dis: Math.max(0, dis) };
          }),
        };
      })
    );
  };

  const reactReply = (
    postId: string | number,
    commentId: string,
    replyId: string,
    reaction: 'like' | 'dis'
  ) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              replies: (c.replies || []).map((r) => {
                if (r.id !== replyId) return r;
                const liked = reaction === 'like' ? !r.liked : false;
                const disliked = reaction === 'dis' ? !r.disliked : false;
                const likes = r.likes + (liked ? 1 : r.liked ? -1 : 0);
                const dis = r.dis + (disliked ? 1 : r.disliked ? -1 : 0);
                return { ...r, liked, disliked, likes: Math.max(0, likes), dis: Math.max(0, dis) };
              }),
            };
          }),
        };
      })
    );
  };

  // Job Actions
  const addJob = (jobData: Omit<JobPost, 'id' | 'postedDate' | 'postedBy' | 'isOwner' | 'status'>) => {
    const newJob: JobPost = {
      ...jobData,
      id: `j-${Date.now()}`,
      postedBy: user.displayName,
      posterUid: user.uid,
      posterEmail: jobData.posterEmail || user.email,
      posterTimezone: user.timezone,
      postedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'active',
    };
    setJobs((prev) => [newJob, ...prev]);
    toast(`Job opportunity '${newJob.title}' posted successfully.`);
  };

  const deleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    toast('Job listing removed.');
  };

  // Nexus Actions
  const addTopic = (title: string, category: string, text: string) => {
    if (!title.trim() || !text.trim()) return;
    const newTopic: NexusTopic = {
      id: `top-${Date.now()}`,
      title: title.trim(),
      category: category || 'General Trade',
      text: text.trim(),
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
    toast('Discussion topic published to Nexus Community.');
  };

  const addTopicReply = (topicId: string, text: string) => {
    if (!text.trim()) return;
    const newReply = {
      id: `tr-${Date.now()}`,
      author: user.displayName,
      authorUid: user.uid,
      text: text.trim(),
      time: 'Just now',
      hasGoldenTick: user.hasGoldenTick,
    };
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        return {
          ...t,
          commentsCount: t.commentsCount + 1,
          replies: [...t.replies, newReply],
        };
      })
    );
    toast('Discussion response submitted.');
  };

  const reactTopic = (topicId: string, reaction: 'like' | 'dis') => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const liked = reaction === 'like' ? !t.liked : false;
        const disliked = reaction === 'dis' ? !t.disliked : false;
        const likes = (t.likes || 0) + (liked ? 1 : t.liked ? -1 : 0);
        const dis = (t.dis || 0) + (disliked ? 1 : t.disliked ? -1 : 0);
        return { ...t, liked, disliked, likes: Math.max(0, likes), dis: Math.max(0, dis) };
      })
    );
  };

  const reactTopicReply = (topicId: string, replyId: string, reaction: 'like' | 'dis') => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        return {
          ...t,
          replies: (t.replies || []).map((r) => {
            if (r.id !== replyId) return r;
            const liked = reaction === 'like' ? !r.liked : false;
            const disliked = reaction === 'dis' ? !r.disliked : false;
            const likes = (r.likes || 0) + (liked ? 1 : r.liked ? -1 : 0);
            const dis = (r.dis || 0) + (disliked ? 1 : r.disliked ? -1 : 0);
            return { ...r, liked, disliked, likes: Math.max(0, likes), dis: Math.max(0, dis) };
          }),
        };
      })
    );
  };

  const addReview = (companyName: string, location: string, rating: number, text: string) => {
    if (!companyName.trim() || !text.trim()) return;
    const newReviewItem = {
      id: `rv-${Date.now()}`,
      author: user.displayName,
      authorUid: user.uid,
      rating,
      text: text.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      verified: true,
    };

    setReviews((prev) => {
      const existing = prev.find((r) => r.companyName.toLowerCase() === companyName.toLowerCase());
      if (existing) {
        return prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                totalReviews: r.totalReviews + 1,
                recentReviews: [newReviewItem, ...r.recentReviews],
              }
            : r
        );
      }
      return [
        {
          id: `cr-${Date.now()}`,
          companyName: companyName.trim(),
          location: location.trim() || 'Global',
          ratingAverage: rating,
          totalReviews: 1,
          starDistribution: [1, 0, 0, 0, 0],
          recentReviews: [newReviewItem],
        },
        ...prev,
      ];
    });
    toast(`Verified review for ${companyName} submitted.`);
  };

  const reactReviewRemark = (companyId: string, reviewId: string, action: 'like' | 'dis') => {
    setReviews((prev) =>
      prev.map((comp) => {
        if (comp.id !== companyId) return comp;
        return {
          ...comp,
          recentReviews: comp.recentReviews.map((r) => {
            if (r.id !== reviewId) return r;
            const liked = action === 'like' ? !r.liked : false;
            const disliked = action === 'dis' ? !r.disliked : false;
            const likes = (r.likes || 0) + (liked ? 1 : r.liked ? -1 : 0);
            const dis = (r.dis || 0) + (disliked ? 1 : r.disliked ? -1 : 0);
            return { ...r, liked, disliked, likes: Math.max(0, likes), dis: Math.max(0, dis) };
          }),
        };
      })
    );
  };

  const addCase = (
    caseData: Omit<BlacklistCase, 'id' | 'reportedDate' | 'status' | 'reporter' | 'reporterUid'>
  ) => {
    const newCase: BlacklistCase = {
      ...caseData,
      id: `bl-${Date.now()}`,
      reportedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'under_investigation',
      reporter: user.company,
      reporterUid: user.uid,
      agreedCount: 1,
      disputeCount: 0,
      userAgreed: true,
      userDisputed: false,
      disputes: [],
    };
    setCases((prev) => [newCase, ...prev]);
    toast(`Compliance report for ${newCase.companyName} submitted for verification.`);
  };

  const agreeCase = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const willAgree = !c.userAgreed;
        return {
          ...c,
          userAgreed: willAgree,
          agreedCount: Math.max(0, (c.agreedCount || 0) + (willAgree ? 1 : -1)),
        };
      })
    );
    toast('Recorded your agreement with this blacklist default record.');
  };

  const disputeCase = (caseId: string, text: string, evidenceDoc: string = 'Counter Evidence Dossier') => {
    if (!text.trim()) return;
    const newDispute: BlacklistDispute = {
      id: `dsp-${Date.now()}`,
      author: user.displayName,
      authorCompany: user.company,
      authorUid: user.uid,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      text: text.trim(),
      evidenceDoc,
      status: 'under_review',
    };

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          userDisputed: true,
          disputeCount: (c.disputeCount || 0) + 1,
          disputes: [newDispute, ...(c.disputes || [])],
        };
      })
    );
    toast('Counter-dispute statement and evidence docket submitted for arbitration.');
  };

  // Reverse Auctions Workflow
  const addAuction = (auctionData: Partial<Auction>): string => {
    const id = `RA-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const rfqId = `RFQ-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const newAuction: Auction = {
      id,
      title: auctionData.title || `Shipment ${id}`,
      rfqId,
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
      isPublished: true,
      publishedAt: new Date().toISOString(),
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
      containers: auctionData.containers || [
        {
          id: 'c-1',
          equipmentType: '40HC',
          containerType: 'Standard',
          quantity: 1,
          pickupLocation: 'Nhava Sheva CFS',
          emptyReturnLocation: 'Rotterdam ECT',
          isSpecial: false,
          commodity: 'General Cargo',
          hsCode: '8400.00',
          grossWeight: 20000,
          weightUnit: 'KG',
        },
      ],
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
      historicalSnapshot: {
        publishedAt: new Date().toISOString(),
        creatorSnapshot: {
          name: user.displayName,
          company: user.company,
          email: user.email,
          location: `${user.city}, ${user.country}`,
        },
      },
      bids: [],
    };

    setAuctions((prev) => [newAuction, ...prev]);

    // Also post an immutable announcement in the feed
    const feedAnnouncement: FeedPost = {
      id: `post-auc-${Date.now()}`,
      authorUid: user.uid,
      author: user.displayName,
      authorRole: `${user.designation} · ${user.city}`,
      authorCompany: user.company,
      authorTimezone: user.timezone,
      hasGoldenTick: user.hasGoldenTick,
      time: 'Just now',
      text: `📢 **Reverse Auction Published: ${newAuction.title}**\n- **Route**: ${newAuction.shipment.pol} → ${newAuction.shipment.pod}\n- **Incoterm**: ${newAuction.shipment.incoterm}\n- **Containers**: ${newAuction.containers.map((c) => `${c.quantity}x ${c.equipmentType}`).join(', ')}\n- **Status**: Live\n\n*This is an immutable auction record.*`,
      likes: 0,
      dis: 0,
      liked: false,
      disliked: false,
      isSaved: false,
      isAuctionAnnouncement: true,
      auctionRefId: id,
      comments: [],
    };
    setPosts((prev) => [feedAnnouncement, ...prev]);

    if (newAuction.selectedBidders.length > 0) {
      newAuction.selectedBidders.forEach((b) => {
        toast(`Structured auction notification sent to ${b.name} (${b.company}).`);
      });
    }

    toast(`Reverse Auction ${id} published successfully.`);
    return id;
  };

  const updateAuctionStatus = (auctionId: string, status: Auction['status']) => {
    setAuctions((prev) =>
      prev.map((a) => (a.id === auctionId ? { ...a, status } : a))
    );
    toast(`Auction ${auctionId} status changed to ${status}.`);
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
      feePaid: 0,
      currency: 'USD',
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'winning',
    };

    setMySubmittedBids((prev) => [newBid, ...prev]);

    setAuctions((prev) =>
      prev.map((a) => {
        if (a.id !== auctionId) return a;
        return {
          ...a,
          rank: `#${rank}`,
          bidsSubmittedCount: a.bidsSubmittedCount + 1,
          bids: [...(a.bids || []), newBid],
        };
      })
    );

    toast(
      `Bid of USD $${grandTotalUSD.toFixed(2)} submitted successfully for ${auctionId}.`
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
        editPost,
        deletePost,
        reactPost,
        savePost,
        reportTarget,
        reports,
        addComment,
        addReply,
        addNestedReply,
        reactComment,
        reactReply,
        jobs,
        addJob,
        deleteJob,
        topics,
        addTopic,
        addTopicReply,
        reactTopic,
        reactTopicReply,
        reviews,
        addReview,
        reactReviewRemark,
        cases,
        addCase,
        agreeCase,
        disputeCase,
        auctions,
        addAuction,
        updateAuctionStatus,
        submitBid,
        mySubmittedBids,
        rates,
        myRates,
        addMyRate,
        deleteMyRate,
        bulkImportRates,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
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
