'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AdminAction,
  AdminCase,
  PlanVersion,
  PaymentConfig,
  CompanyVerificationItem,
  RateImportBatch,
  NotificationTemplate,
  InvoiceRecord,
  BlockAction,
  CustomerDossier,
  GlobalSearchResult,
  BlockScope,
} from '../types';
import {
  UserProfile,
  FeedPost,
  JobPost,
  NexusTopic,
  CompanyReview,
  BlacklistCase,
  Auction,
  RateItem,
  PostReport,
} from '@/lib/types';
import { useGodfatherAuth } from './GodfatherAuthContext';
import { createAuditRecord, calculateDiff } from '../utils/audit';
import { formatAuctionDetailTable } from '../utils/templateBuilder';

// Comprehensive Seed Data for GODFATHER console

const SEED_ADMIN_ACTIONS: AdminAction[] = [
  {
    actionId: 'act_1725010200_a1b2',
    actorUid: 'gf-op-001',
    actorEmail: 'admin.security@con.fr8x.in',
    actorName: 'Vikramaditya Singhania',
    actorRole: 'godfather_owner',
    targetType: 'plan',
    targetId: 'PV-PREM-2026-V3',
    targetLabel: 'Premium Enterprise Plan V3.0',
    actionType: 'PLAN_PRICE_UPDATE',
    beforeSnapshot: { monthlyPrice: 2800, bidDiscountPercent: 35 },
    afterSnapshot: { monthlyPrice: 3000, bidDiscountPercent: 40 },
    reason: 'Annual pricing realignment and increased 40% bid fee discount incentive',
    correlationId: 'GF-L3K9Q-8821',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    ipHash: 'sha256:8f4c2e...',
    deviceInfo: 'Edge 128.0 / Windows NT 10.0',
    stepUpVerified: true,
  },
  {
    actionId: 'act_1725010800_c3d4',
    actorUid: 'gf-op-005',
    actorEmail: 'legal.compliance@con.fr8x.in',
    actorName: 'Anirudh Roy Chowdhury',
    actorRole: 'godfather_compliance',
    targetType: 'company',
    targetId: 'CMP-00101',
    targetLabel: 'Atlas Logistics Pvt. Ltd.',
    actionType: 'COMPANY_KYC_VERIFIED',
    beforeSnapshot: { status: 'pending' },
    afterSnapshot: { status: 'verified', gstnVerified: true, panVerified: true },
    reason: 'Verified against GSTN portal API and verified IEC code validity',
    correlationId: 'GF-L3K9R-1142',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    ipHash: 'sha256:8f4c2e...',
    deviceInfo: 'Edge 128.0 / Windows NT 10.0',
    stepUpVerified: true,
  },
  {
    actionId: 'act_1725011400_e5f6',
    actorUid: 'gf-op-003',
    actorEmail: 'trust.moderation@con.fr8x.in',
    actorName: 'Marcus Van Der Berg',
    actorRole: 'godfather_moderator',
    targetType: 'post',
    targetId: 'post-109',
    targetLabel: 'Spam rate solicitation post',
    actionType: 'POST_CONTENT_HIDDEN',
    beforeSnapshot: { status: 'active', visibility: 'public' },
    afterSnapshot: { status: 'hidden', moderationReason: 'Unauthorized off-platform solicitation' },
    reason: 'Repeated unverified rate solicitation violating platform TOS section 4.2',
    correlationId: 'GF-L3K9S-9901',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    ipHash: 'sha256:8f4c2e...',
    deviceInfo: 'Firefox 129.0 / macOS 14.5',
    stepUpVerified: false,
  },
];

const SEED_USERS: UserProfile[] = [
  {
    uid: 'u-arjun',
    email: 'arjun@atlaslogistics.com',
    firstName: 'Arjun',
    lastName: 'Rao',
    displayName: 'Arjun Rao',
    designation: 'Freight Manager',
    company: 'Atlas Logistics Pvt. Ltd.',
    companyId: 'CMP-00101',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    mobile: '+91 98765 43210',
    timezone: 'Asia/Kolkata',
    preferredContactMethod: 'tradeChat',
    contactAvailability: '09:00 - 18:30 IST',
    plan: 'premium',
    hasGoldenTick: true,
    isVerified: true,
    role: 'company_admin',
    avatarUrl: '',
    gstn: '27AABCA1234F1Z5',
    pan: 'AABCA1234F',
    iec: '0312004561',
    mto: 'MTO/DGS/2024/9912',
    bio: 'Freight procurement specialist with 9+ years managing ocean FCL and OOG breakbulk across Asia-Europe corridors.',
    summary: 'Expertise in carrier contract negotiations, multimodal inland haulage, customs liaison.',
    specializations: ['FCL Ocean', 'OOG Breakbulk', 'Reefer Logistics', 'Customs Clearance'],
    skills: ['Rate Procurement', 'Carrier Negotiation', 'UN/LOCODE Routing', 'ERP Logistics'],
    languages: ['English', 'Hindi', 'Marathi'],
  },
  {
    uid: 'u-sarah',
    email: 'sarah.lewis@rotterdamfreight.nl',
    firstName: 'Sarah',
    lastName: 'Lewis',
    displayName: 'Sarah Lewis',
    designation: 'Ocean Freight Lead',
    company: 'Rotterdam Freight NV',
    companyId: 'CMP-00102',
    city: 'Rotterdam',
    state: 'South Holland',
    country: 'Netherlands',
    mobile: '+31 10 123 4567',
    timezone: 'Europe/Amsterdam',
    preferredContactMethod: 'email',
    contactAvailability: '08:30 - 17:00 CET',
    plan: 'professional',
    hasGoldenTick: false,
    isVerified: true,
    role: 'user',
    bio: 'North Continent port logistics specialist and container supply chain manager.',
    languages: ['English', 'Dutch', 'German'],
  },
  {
    uid: 'u-kiran',
    email: 'kiran.mehta@indoocean.com',
    firstName: 'Kiran',
    lastName: 'Mehta',
    displayName: 'Kiran Mehta',
    designation: 'Trade Lane Manager',
    company: 'Indo Ocean Lines',
    companyId: 'CMP-00103',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    mobile: '+91 98111 22334',
    timezone: 'Asia/Kolkata',
    preferredContactMethod: 'whatsapp',
    contactAvailability: '10:00 - 19:00 IST',
    plan: 'trial',
    hasGoldenTick: false,
    isVerified: true,
    role: 'user',
    languages: ['English', 'Hindi', 'Gujarati'],
  },
  {
    uid: 'u-vikas',
    email: 'vikas.dubey@apexforwarders.in',
    firstName: 'Vikas',
    lastName: 'Dubey',
    displayName: 'Vikas Dubey',
    designation: 'Managing Director',
    company: 'Apex Global Forwarders',
    companyId: 'CMP-00104',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    mobile: '+91 99555 44332',
    timezone: 'Asia/Kolkata',
    preferredContactMethod: 'email',
    contactAvailability: '09:30 - 18:30 IST',
    plan: 'professional',
    hasGoldenTick: false,
    isVerified: false,
    role: 'user',
    gstn: '07AAACA4321K1Z8',
    pan: 'AAACA4321K',
    iec: '0714002341',
  },
  {
    uid: 'u-chen',
    email: 'chen.wei@orientfreight.cn',
    firstName: 'Chen',
    lastName: 'Wei',
    displayName: 'Chen Wei',
    designation: 'NVOCC Operations Manager',
    company: 'Orient Gateway Logistics Shanghai',
    companyId: 'CMP-00105',
    city: 'Shanghai',
    state: 'Shanghai',
    country: 'China',
    mobile: '+86 21 8899 0011',
    timezone: 'Asia/Shanghai',
    preferredContactMethod: 'tradeChat',
    contactAvailability: '08:00 - 18:00 CST',
    plan: 'premium',
    hasGoldenTick: true,
    isVerified: true,
    role: 'company_admin',
    languages: ['English', 'Mandarin'],
  },
];

const SEED_COMPANIES: CompanyVerificationItem[] = [
  {
    companyId: 'CMP-00101',
    legalName: 'Atlas Logistics Private Limited',
    tradeName: 'Atlas Logistics',
    country: 'India',
    city: 'Mumbai',
    gstn: '27AABCA1234F1Z5',
    pan: 'AABCA1234F',
    iec: '0312004561',
    mto: 'MTO/DGS/2024/9912',
    status: 'verified',
    submittedAt: '2026-06-10T10:00:00Z',
    reviewedAt: '2026-06-11T14:30:00Z',
    reviewedBy: 'gf-op-005',
    adminNotes: ['GST and PAN numbers cross-verified on government portal.', 'MTO registration certificate valid through Dec 2027.'],
    documents: [
      { docId: 'doc-1', type: 'GST_CERTIFICATE', name: 'Atlas_GST_Reg_27AABCA1234F1Z5.pdf', fileUrl: 'https://con.fr8x.in/docs/gst-sample.pdf', verified: true, uploadedAt: '2026-06-10T10:00:00Z' },
      { docId: 'doc-2', type: 'PAN_CARD', name: 'Atlas_PAN_AABCA1234F.pdf', fileUrl: 'https://con.fr8x.in/docs/pan-sample.pdf', verified: true, uploadedAt: '2026-06-10T10:00:00Z' },
      { docId: 'doc-3', type: 'MTO_REGISTRATION', name: 'DGS_MTO_Atlas_2024.pdf', fileUrl: 'https://con.fr8x.in/docs/mto-sample.pdf', verified: true, uploadedAt: '2026-06-10T10:00:00Z' },
    ],
    primaryContactName: 'Arjun Rao',
    primaryContactEmail: 'arjun@atlaslogistics.com',
    primaryContactPhone: '+91 98765 43210',
  },
  {
    companyId: 'CMP-00102',
    legalName: 'Rotterdam Freight NV',
    tradeName: 'Rotterdam Freight',
    country: 'Netherlands',
    city: 'Rotterdam',
    status: 'verified',
    submittedAt: '2026-07-01T09:00:00Z',
    reviewedAt: '2026-07-02T11:00:00Z',
    reviewedBy: 'gf-op-005',
    adminNotes: ['KvK Chamber of Commerce registry verified.', 'Valid EU VAT ID NL884210992B01.'],
    documents: [
      { docId: 'doc-4', type: 'INCORPORATION_CERT', name: 'KvK_RotterdamFreight_Extract.pdf', fileUrl: 'https://con.fr8x.in/docs/kvk-sample.pdf', verified: true, uploadedAt: '2026-07-01T09:00:00Z' },
    ],
    primaryContactName: 'Sarah Lewis',
    primaryContactEmail: 'sarah.lewis@rotterdamfreight.nl',
    primaryContactPhone: '+31 10 123 4567',
  },
  {
    companyId: 'CMP-00104',
    legalName: 'Apex Global Forwarders LLP',
    tradeName: 'Apex Forwarders',
    country: 'India',
    city: 'New Delhi',
    gstn: '07AAACA4321K1Z8',
    pan: 'AAACA4321K',
    iec: '0714002341',
    status: 'pending',
    submittedAt: '2026-08-28T16:00:00Z',
    adminNotes: ['Uploaded GST certificate shows address mismatch with submitted registered address.'],
    documents: [
      { docId: 'doc-5', type: 'GST_CERTIFICATE', name: 'Apex_GST_Reg_07AAACA4321K1Z8.pdf', fileUrl: 'https://con.fr8x.in/docs/gst-apex.pdf', verified: false, uploadedAt: '2026-08-28T16:00:00Z' },
      { docId: 'doc-6', type: 'IEC_LICENSE', name: 'Apex_IEC_DGFT.pdf', fileUrl: 'https://con.fr8x.in/docs/iec-apex.pdf', verified: false, uploadedAt: '2026-08-28T16:00:00Z' },
    ],
    primaryContactName: 'Vikas Dubey',
    primaryContactEmail: 'vikas.dubey@apexforwarders.in',
    primaryContactPhone: '+91 99555 44332',
  },
  {
    companyId: 'CMP-00106',
    legalName: 'Blue Horizon Maritime Sp. z o.o.',
    tradeName: 'Blue Horizon Logistics',
    country: 'Poland',
    city: 'Gdynia',
    status: 'additional_info_required',
    submittedAt: '2026-08-25T12:00:00Z',
    reviewedAt: '2026-08-26T15:00:00Z',
    reviewedBy: 'gf-op-005',
    adminNotes: ['Requested certified translation of Polish KRS incorporation extract.'],
    documents: [
      { docId: 'doc-7', type: 'INCORPORATION_CERT', name: 'KRS_BlueHorizon_PL.pdf', fileUrl: 'https://con.fr8x.in/docs/krs-sample.pdf', verified: false, uploadedAt: '2026-08-25T12:00:00Z' },
    ],
    primaryContactName: 'Piotr Kowalski',
    primaryContactEmail: 'p.kowalski@bluehorizon.pl',
    primaryContactPhone: '+48 58 660 1122',
  },
];

const SEED_AUCTIONS: Auction[] = [
  {
    id: 'RA-2026-0842',
    title: 'Automotive Parts FCL - Mumbai to Rotterdam Direct',
    rfqId: 'RFQ-8842-AUTO',
    creatorUid: 'u-arjun',
    creatorName: 'Arjun Rao',
    creatorCompany: 'Atlas Logistics Pvt. Ltd.',
    auctionType: 'Specific bidder',
    startDate: '2026-08-29',
    startTime: '10:00',
    durationMinutes: 1440,
    endDateTime: '2026-08-30 17:00',
    timezone: 'Asia/Kolkata',
    status: 'Live',
    timeLeft: '1h 25m',
    isPublished: true,
    publishedAt: '2026-08-29T10:00:00Z',
    postingFeeINR: 180,
    postingFeeUSD: 2.1,
    shipment: {
      por: 'Pune ICD',
      pol: 'Nhava Sheva (INNSA), India',
      pod: 'Rotterdam (NLRTM), Netherlands',
      finalDestination: 'Rotterdam Port Terminal',
      cargoReadyDate: '2026-09-15',
      shipmentType: 'FCL',
      incoterm: 'FOB - Free on Board',
      rateCurrency: 'USD',
      commodity: 'Precision Automotive Gear Components',
      hsCode: '8708.29.00',
      weightKg: 48000,
      cbm: 120,
    },
    containers: [
      {
        id: 'c1',
        equipmentType: "40' High Cube (40HC)",
        containerType: 'Standard',
        quantity: 2,
        pickupLocation: 'Nhava Sheva Yard',
        emptyReturnLocation: 'Rotterdam Depot',
        isSpecial: false,
        commodity: 'Automotive Parts',
        hsCode: '8708.29.00',
        grossWeight: 24000,
        weightUnit: 'KG',
      },
    ],
    originCharges: { transportation: true, clearance: true, carrierLocal: true },
    destinationCharges: { transportation: false, clearance: false, carrierLocal: true },
    selectedBidders: [
      { id: 'b1', name: 'Sarah Lewis', company: 'Rotterdam Freight NV', role: 'Ocean Lead', location: 'Rotterdam, NL', timezone: 'Europe/Amsterdam', hasGoldenTick: false },
      { id: 'b2', name: 'Chen Wei', company: 'Orient Gateway Logistics Shanghai', role: 'NVOCC Manager', location: 'Shanghai, CN', timezone: 'Asia/Shanghai', hasGoldenTick: true },
    ],
    blockedBidders: [],
    rules: {
      autoExtension: true,
      rankingVisible: true,
      hideCompetitorNames: true,
      bidderAnonymity: true,
      bidLimit: 5,
    },
    competitionCeiling: 2800,
    bidsSubmittedCount: 3,
    bids: [
      {
        id: 'bid-01',
        auctionId: 'RA-2026-0842',
        bidderUid: 'u-sarah',
        bidderName: 'Sarah Lewis',
        bidderCompany: 'Rotterdam Freight NV',
        bidderHasGoldenTick: false,
        charges: [
          { equipment: "40' High Cube (40HC)", quantity: 2, oceanFreight: 2100, freightSurcharges: 150, originTransport: 0, originClearance: 0, originLocal: 70, destTransport: 0, destClearance: 0, destLocal: 0, totalUnit: 2320 }
        ],
        grandTotalUSD: 2320,
        rank: 1,
        feePaid: 300,
        currency: 'USD',
        submittedAt: '2026-08-29T14:20:00Z',
        status: 'active',
      },
      {
        id: 'bid-02',
        auctionId: 'RA-2026-0842',
        bidderUid: 'u-chen',
        bidderName: 'Chen Wei',
        bidderCompany: 'Orient Gateway Logistics Shanghai',
        bidderHasGoldenTick: true,
        charges: [
          { equipment: "40' High Cube (40HC)", quantity: 2, oceanFreight: 2200, freightSurcharges: 180, originTransport: 0, originClearance: 0, originLocal: 80, destTransport: 0, destClearance: 0, destLocal: 0, totalUnit: 2460 }
        ],
        grandTotalUSD: 2460,
        rank: 2,
        feePaid: 180,
        currency: 'USD',
        submittedAt: '2026-08-29T15:10:00Z',
        status: 'active',
      },
    ],
  },
  {
    id: 'GB-2026-0311',
    title: 'Industrial Heavy Machinery Tender - Nhava Sheva to Antwerp',
    rfqId: 'RFQ-0311-MACH',
    creatorUid: 'u-kiran',
    creatorName: 'Kiran Mehta',
    creatorCompany: 'Indo Ocean Lines',
    auctionType: 'General bidding',
    startDate: '2026-08-20',
    startTime: '09:00',
    durationMinutes: 2880,
    endDateTime: '2026-08-22 18:00',
    timezone: 'Asia/Kolkata',
    status: 'Awarded',
    isPublished: true,
    publishedAt: '2026-08-20T09:00:00Z',
    closedAt: '2026-08-22T18:00:00Z',
    result: 'won',
    winningBidId: 'bid-0311-win',
    postingFeeINR: 300,
    postingFeeUSD: 3.5,
    shipment: {
      por: 'Ahmedabad ICD',
      pol: 'Nhava Sheva (INNSA), India',
      pod: 'Antwerp (BEANR), Belgium',
      finalDestination: 'Antwerp Gateway',
      cargoReadyDate: '2026-09-01',
      shipmentType: 'FCL',
      incoterm: 'CIF - Cost, Insurance and Freight',
      rateCurrency: 'USD',
      commodity: 'CNC Milling Heavy Industrial Machinery',
      hsCode: '8458.11.00',
      weightKg: 38000,
      cbm: 95,
    },
    containers: [
      {
        id: 'c2',
        equipmentType: "40' Flat Rack (40FR)",
        containerType: 'OOG',
        quantity: 2,
        pickupLocation: 'Nhava Sheva',
        emptyReturnLocation: 'Antwerp',
        isSpecial: true,
        commodity: 'CNC Machinery',
        hsCode: '8458.11.00',
        grossWeight: 19000,
        weightUnit: 'KG',
      },
    ],
    originCharges: { transportation: true, clearance: true, carrierLocal: true },
    destinationCharges: { transportation: false, clearance: true, carrierLocal: true },
    selectedBidders: [],
    blockedBidders: [],
    rules: {
      autoExtension: true,
      rankingVisible: true,
      hideCompetitorNames: false,
      bidderAnonymity: false,
      bidLimit: 10,
    },
    competitionCeiling: 3200,
    bidsSubmittedCount: 4,
    awardedDetails: {
      awardedAt: '2026-08-22T18:15:00Z',
      docketId: 'DOC-2026-ANT-0912',
      winningCompany: 'Atlas Logistics Pvt. Ltd.',
      winningContact: 'Arjun Rao (+91 98765 43210)',
      winningRateUSD: 2990,
      carrier: 'CMA CGM',
      transitTime: '24 Days Direct',
      freeTimeOrigin: '14 Days',
      freeTimeDest: '21 Days',
      equipmentBreakdown: "2x 40' Flat Rack (40FR)",
      shipperCompany: 'Indo Ocean Lines',
      shipperContact: 'Kiran Mehta',
      settlementTerms: 'Net 30 Days on BL presentation',
    },
  },
];

const SEED_RATES: RateItem[] = [
  {
    id: 'RT-884210',
    sp: 'Hapag-Lloyd Ocean',
    carrier: 'Hapag-Lloyd',
    por: 'Nhava Sheva (INNSA)',
    pol: 'Nhava Sheva (INNSA), India',
    pod: 'Rotterdam (NLRTM), Netherlands',
    fpod: 'Rotterdam Port',
    d20: 1450,
    h40: 2280,
    ft: '14 days',
    tt: '26 days',
    valid: '2026-09-30',
    route: 'Nhava Sheva → Rotterdam',
    remark: 'Direct weekly service. Valid for general commercial non-DG cargo.',
    ownerUid: 'u-arjun',
    isOwner: true,
  },
  {
    id: 'IRT-901234',
    sp: 'Atlas Logistics Self-Posted',
    carrier: 'Maersk Line',
    por: 'Mundra (INMUN)',
    pol: 'Mundra (INMUN), India',
    pod: 'Antwerp (BEANR), Belgium',
    fpod: 'Antwerp Euroports',
    d20: 1380,
    h40: 2150,
    ft: '21 days',
    tt: '28 days',
    valid: '2026-10-15',
    route: 'Mundra → Antwerp',
    remark: 'Secured slot allocation with guaranteed equipment at Mundra ICD.',
    ownerUid: 'u-arjun',
    isOwner: true,
  },
  {
    id: 'RT-773322',
    sp: 'Orient Gateway Logistics',
    carrier: 'COSCO Shipping',
    por: 'Shanghai Port',
    pol: 'Shanghai (CNSHA), China',
    pod: 'Nhava Sheva (INNSA), India',
    fpod: 'Nhava Sheva Port',
    d20: 890,
    h40: 1350,
    ft: '14 days',
    tt: '16 days',
    valid: '2026-09-25',
    route: 'Shanghai → Nhava Sheva',
    remark: 'Direct Far East to West Coast India express corridor.',
    ownerUid: 'u-chen',
    isOwner: false,
  },
];

const SEED_RATE_IMPORTS: RateImportBatch[] = [
  {
    importId: 'IMP-2026-0801',
    batchCode: 'BATCH-AUG-EU-WEST',
    filename: 'Maersk_Europe_Rates_Aug2026_V2.xlsx',
    uploaderUid: 'u-arjun',
    uploaderName: 'Arjun Rao',
    uploaderCompany: 'Atlas Logistics Pvt. Ltd.',
    uploadedAt: '2026-08-27T11:30:00Z',
    status: 'Needs Review',
    totalRows: 142,
    validRows: 138,
    invalidRows: 4,
    duplicateRows: 2,
    validationReport: [
      { rowNumber: 14, errorType: 'INVALID_DATE', field: 'validity_date', message: 'Validity date "31-02-2026" is not a valid Gregorian date.' },
      { rowNumber: 47, errorType: 'MISSING_POR', field: 'por_code', message: 'Mandatory Port of Receipt UN/LOCODE is missing.' },
      { rowNumber: 88, errorType: 'OUT_OF_BOUND_RATE', field: 'd20_usd', message: 'Rate $45,000 USD exceeds sanity threshold for 20DV.' },
      { rowNumber: 104, errorType: 'DUPLICATE_ID', field: 'rate_code', message: 'Rate code RT-884210 already exists in active inventory.' },
    ],
    sampleRows: [
      { row: 1, pol: 'INNSA', pod: 'NLRTM', carrier: 'Maersk', d20: 1420, h40: 2200, valid: '2026-09-30', status: 'VALID' },
      { row: 2, pol: 'INMUN', pod: 'DEHAM', carrier: 'Maersk', d20: 1490, h40: 2310, valid: '2026-09-30', status: 'VALID' },
      { row: 3, pol: 'INMAA', pod: 'GBFXT', carrier: 'Maersk', d20: 1550, h40: 2400, valid: '2026-09-30', status: 'VALID' },
    ],
  },
  {
    importId: 'IMP-2026-0715',
    batchCode: 'BATCH-JUL-MED-GULF',
    filename: 'CMA_Gulf_Med_Corridor_Rates.csv',
    uploaderUid: 'u-chen',
    uploaderName: 'Chen Wei',
    uploaderCompany: 'Orient Gateway Logistics',
    uploadedAt: '2026-07-20T08:15:00Z',
    status: 'Finalized',
    totalRows: 85,
    validRows: 85,
    invalidRows: 0,
    duplicateRows: 0,
    validationReport: [],
    sampleRows: [],
    approvedBy: 'gf-op-002',
    approvedAt: '2026-07-20T10:00:00Z',
    finalizedBy: 'gf-op-002',
    finalizedAt: '2026-07-20T10:05:00Z',
  },
];

const SEED_BLOCKS: BlockAction[] = [
  {
    blockId: 'blk-001',
    subjectType: 'user',
    subjectId: 'u-suspended-01',
    subjectName: 'Ramesh Cargo Agent',
    subjectEmail: 'ramesh@fakecargo.in',
    scopes: ['feed_post', 'auction_bid', 'chat'],
    reasonCode: 'fraud_risk',
    reasonText: 'Multiple fake bid submissions with unverified GST credentials and failure to honor lowest price bids.',
    evidenceRefs: ['DOC-DISPUTE-8812', 'COMPLAINT-ATLAS-AUG26'],
    status: 'active',
    expiresAt: '2026-11-30T00:00:00Z',
    createdBy: 'gf-op-003',
    createdByName: 'Marcus Van Der Berg',
    createdAt: '2026-08-15T14:00:00Z',
  },
];

const SEED_BLACKLIST: BlacklistCase[] = [
  {
    id: 'BL-2026-004',
    companyName: 'OceanStar Maritime Forwarding Ltd.',
    location: 'Dubai, UAE',
    reason: 'Non-payment of container demurrage and unauthorized retention of original Bills of Lading.',
    severity: 'critical',
    reportedDate: '2026-08-10',
    status: 'active',
    reporter: 'Indo Ocean Lines',
    reporterUid: 'u-kiran',
    description: 'Cargo released to unauthorized consignee without original BL surrender at Jebel Ali port. Unresolved commercial claim USD $42,500.',
    evidenceRef: 'CLAIM-BL-JEA-44910.pdf',
    agreedCount: 14,
    disputeCount: 1,
  },
];

const SEED_PLANS: PlanVersion[] = [
  {
    planVersionId: 'PV-TRIAL-V1',
    plan: 'trial',
    planName: '2-Day Limited Trial',
    version: 1,
    countryScope: 'Global',
    currency: 'INR',
    monthlyPrice: 0,
    taxPolicy: 'inclusive_gst',
    effectiveFrom: '2026-01-01T00:00:00Z',
    active: true,
    featureFlags: {
      goldVerification: false,
      unlimitedSearches: false,
      unlimitedChat: false,
      directCarrierTenders: false,
      marketAnalytics: false,
      apiAccess: false,
    },
    limits: {
      monthlyAuctions: 1,
      monthlyBids: 2,
      subAccounts: 1,
      rateInventoryMax: 5,
    },
    bidFee: 300,
    bidDiscountPercent: 0,
    trialDurationDays: 2,
    trialEligibility: 'Once per verified corporate email per calendar year',
    legacyGrandfatheringPolicy: 'maintain_original_price',
    createdBy: 'gf-op-001',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    planVersionId: 'PV-PRO-IND-V2',
    plan: 'professional',
    planName: 'Professional Workspace (India)',
    version: 2,
    countryScope: 'India',
    currency: 'INR',
    monthlyPrice: 1500,
    taxPolicy: 'inclusive_gst',
    effectiveFrom: '2026-01-01T00:00:00Z',
    active: true,
    featureFlags: {
      goldVerification: false,
      unlimitedSearches: true,
      unlimitedChat: true,
      directCarrierTenders: true,
      marketAnalytics: true,
      apiAccess: false,
    },
    limits: {
      monthlyAuctions: 15,
      monthlyBids: 50,
      subAccounts: 3,
      rateInventoryMax: 100,
    },
    bidFee: 300,
    bidDiscountPercent: 0,
    trialEligibility: 'N/A',
    legacyGrandfatheringPolicy: 'maintain_original_price',
    createdBy: 'gf-op-001',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    planVersionId: 'PV-PRO-INT-V2',
    plan: 'professional',
    planName: 'Professional Workspace (International)',
    version: 2,
    countryScope: 'International',
    currency: 'USD',
    monthlyPrice: 27,
    taxPolicy: 'inclusive_tax',
    effectiveFrom: '2026-01-01T00:00:00Z',
    active: true,
    featureFlags: {
      goldVerification: false,
      unlimitedSearches: true,
      unlimitedChat: true,
      directCarrierTenders: true,
      marketAnalytics: true,
      apiAccess: false,
    },
    limits: {
      monthlyAuctions: 15,
      monthlyBids: 50,
      subAccounts: 3,
      rateInventoryMax: 100,
    },
    bidFee: 4,
    bidDiscountPercent: 0,
    trialEligibility: 'N/A',
    legacyGrandfatheringPolicy: 'maintain_original_price',
    createdBy: 'gf-op-001',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    planVersionId: 'PV-PREM-IND-V3',
    plan: 'premium',
    planName: 'Premium Enterprise Gold (India)',
    version: 3,
    countryScope: 'India',
    currency: 'INR',
    monthlyPrice: 3000,
    taxPolicy: 'inclusive_gst',
    effectiveFrom: '2026-06-01T00:00:00Z',
    active: true,
    featureFlags: {
      goldVerification: true,
      unlimitedSearches: true,
      unlimitedChat: true,
      directCarrierTenders: true,
      marketAnalytics: true,
      apiAccess: true,
    },
    limits: {
      monthlyAuctions: 100,
      monthlyBids: 500,
      subAccounts: 10,
      rateInventoryMax: 1000,
    },
    bidFee: 180,
    bidDiscountPercent: 40,
    trialEligibility: 'N/A',
    legacyGrandfatheringPolicy: 'maintain_original_price',
    createdBy: 'gf-op-001',
    createdAt: '2026-06-01T00:00:00Z',
  },
  {
    planVersionId: 'PV-PREM-INT-V3',
    plan: 'premium',
    planName: 'Premium Enterprise Gold (International)',
    version: 3,
    countryScope: 'International',
    currency: 'USD',
    monthlyPrice: 50,
    taxPolicy: 'inclusive_tax',
    effectiveFrom: '2026-06-01T00:00:00Z',
    active: true,
    featureFlags: {
      goldVerification: true,
      unlimitedSearches: true,
      unlimitedChat: true,
      directCarrierTenders: true,
      marketAnalytics: true,
      apiAccess: true,
    },
    limits: {
      monthlyAuctions: 100,
      monthlyBids: 500,
      subAccounts: 10,
      rateInventoryMax: 1000,
    },
    bidFee: 2.4,
    bidDiscountPercent: 40,
    trialEligibility: 'N/A',
    legacyGrandfatheringPolicy: 'maintain_original_price',
    createdBy: 'gf-op-001',
    createdAt: '2026-06-01T00:00:00Z',
  },
];

const SEED_PAYMENT_CONFIGS: PaymentConfig[] = [
  {
    configId: 'PCFG-RZP-IND-01',
    provider: 'Razorpay',
    environment: 'production',
    countryScope: 'India',
    currencies: ['INR'],
    enabled: true,
    publicConfigRef: 'rzp_live_8X992019481A',
    secretRefOnly: '•••••••••••••••• (KMS Vault ref: k-secret-rzp-live)',
    webhookStatus: 'healthy',
    lastValidatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'active',
    updatedBy: 'gf-op-004',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    configId: 'PCFG-STRIPE-GLOBAL-01',
    provider: 'Stripe_Global',
    environment: 'production',
    countryScope: 'International',
    currencies: ['USD', 'EUR', 'GBP', 'SGD', 'AED'],
    enabled: true,
    publicConfigRef: 'pk_live_51P8X99K492091J',
    secretRefOnly: '•••••••••••••••• (KMS Vault ref: k-secret-stripe-live)',
    webhookStatus: 'healthy',
    lastValidatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'active',
    updatedBy: 'gf-op-004',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    configId: 'PCFG-CASHFREE-IND-02',
    provider: 'Cashfree',
    environment: 'sandbox',
    countryScope: 'India',
    currencies: ['INR'],
    enabled: false,
    publicConfigRef: 'cf_app_id_test_9921',
    secretRefOnly: '•••••••••••••••• (KMS Vault ref: k-secret-cf-sandbox)',
    webhookStatus: 'disabled',
    lastValidatedAt: '2026-07-15T12:00:00Z',
    status: 'deprecated',
    updatedBy: 'gf-op-004',
    updatedAt: '2026-07-15T12:00:00Z',
  },
];

const SEED_INVOICES: InvoiceRecord[] = [
  {
    invoiceId: 'INV-2026-08-001',
    invoiceNumber: 'FR8X-2627-0891',
    userUid: 'u-arjun',
    userName: 'Arjun Rao',
    userEmail: 'arjun@atlaslogistics.com',
    companyName: 'Atlas Logistics Pvt. Ltd.',
    companyGstn: '27AABCA1234F1Z5',
    companyAddress: 'Trade Center, BKC, Bandra East, Mumbai, MH 400051',
    date: '2026-08-01',
    dueDate: '2026-08-01',
    planTier: 'premium',
    amountSubtotal: 2542.37,
    cgst: 228.81,
    sgst: 228.81,
    igst: 0,
    totalTax: 457.63,
    amountTotal: 3000.0,
    currency: 'INR',
    status: 'paid',
    paymentProvider: 'Razorpay',
    paymentRef: 'pay_P991209412',
    sacCode: '998431 (Online Information and Database Access/Retrieval Services)',
  },
  {
    invoiceId: 'INV-2026-08-002',
    invoiceNumber: 'FR8X-2627-0892',
    userUid: 'u-sarah',
    userName: 'Sarah Lewis',
    userEmail: 'sarah.lewis@rotterdamfreight.nl',
    companyName: 'Rotterdam Freight NV',
    date: '2026-08-01',
    dueDate: '2026-08-01',
    planTier: 'professional',
    amountSubtotal: 27.0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalTax: 0,
    amountTotal: 27.0,
    currency: 'USD',
    status: 'paid',
    paymentProvider: 'Stripe',
    paymentRef: 'ch_3P8X9920194812',
    sacCode: '998431',
  },
  {
    invoiceId: 'INV-2026-08-003',
    invoiceNumber: 'FR8X-2627-0893',
    userUid: 'u-chen',
    userName: 'Chen Wei',
    userEmail: 'chen.wei@orientfreight.cn',
    companyName: 'Orient Gateway Logistics Shanghai',
    date: '2026-08-01',
    dueDate: '2026-08-01',
    planTier: 'premium',
    amountSubtotal: 50.0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalTax: 0,
    amountTotal: 50.0,
    currency: 'USD',
    status: 'paid',
    paymentProvider: 'Stripe',
    paymentRef: 'ch_3P8X9920194899',
    sacCode: '998431',
  },
];

const SEED_TEMPLATES: NotificationTemplate[] = [
  {
    templateId: 'TMPL-AUCT-INVITE-01',
    code: 'AUCTION_BIDDER_INVITATION',
    name: 'Formal Auction Tender Invitation',
    category: 'auctions',
    subject: 'Action Required: Official Freight Tender Invitation · {{auctionId}} ({{route}})',
    bodyTemplate: 'Dear {{bidderName}},\n\nYou have been selected by {{creatorCompany}} to participate in an official reverse freight auction for {{route}}.\n\nAuction ID: {{auctionId}}\nRFQ Reference: {{rfqId}}\nStart Window: {{startDate}} {{startTime}} ({{timezone}})\nClose Window: {{endDate}} {{endTime}} ({{timezone}})\n\n{{structuredAuctionTable}}\n\nPlease submit your competitive offer before closing.',
    variables: ['bidderName', 'creatorCompany', 'auctionId', 'rfqId', 'route', 'startDate', 'startTime', 'endDate', 'endTime', 'timezone', 'structuredAuctionTable'],
    version: 3,
    isLocalized: true,
    locales: ['en-IN', 'en-US', 'zh-CN'],
    isPublished: true,
    updatedAt: '2026-08-20T10:00:00Z',
    updatedBy: 'gf-op-001',
  },
  {
    templateId: 'TMPL-AUCT-RESULT-02',
    code: 'AUCTION_RESULT_AWARDED',
    name: 'Auction Award Decision Notice',
    category: 'auctions',
    subject: 'Tender Award Notification: {{auctionId}} ({{route}})',
    bodyTemplate: 'Congratulations {{winnerName}},\n\nYour bid of {{winningRate}} has been awarded for tender {{auctionId}} by {{creatorCompany}}.\n\nDocket Reference: {{docketId}}\nCarrier: {{carrier}}\nTransit Time: {{transitTime}}\nFree Time Origin/Dest: {{freeTime}}\n\nPlease liaise via Trade Chat or contact {{creatorContact}} for booking and BL execution.',
    variables: ['winnerName', 'winningRate', 'auctionId', 'creatorCompany', 'docketId', 'carrier', 'transitTime', 'freeTime', 'creatorContact'],
    version: 2,
    isLocalized: true,
    locales: ['en-IN', 'en-US'],
    isPublished: true,
    updatedAt: '2026-08-22T12:00:00Z',
    updatedBy: 'gf-op-001',
  },
  {
    templateId: 'TMPL-MOD-WARN-03',
    code: 'MODERATION_WARNING_NOTICE',
    name: 'Content Moderation Warning Notice',
    category: 'moderation',
    subject: 'Con.FR8X.IN Compliance Notice: Content Moderation Action ({{targetId}})',
    bodyTemplate: 'Dear {{userName}},\n\nYour post/comment ({{targetId}}) has been reviewed by the Trust & Safety team and flagged for {{violationCategory}}.\n\nReason: {{reasonText}}\nAction Taken: {{actionTaken}}\n\nRepeated violations may result in feature restriction or account suspension under platform terms.',
    variables: ['userName', 'targetId', 'violationCategory', 'reasonText', 'actionTaken'],
    version: 1,
    isLocalized: false,
    locales: ['en-IN'],
    isPublished: true,
    updatedAt: '2026-07-10T14:00:00Z',
    updatedBy: 'gf-op-003',
  },
];

const SEED_CASES: AdminCase[] = [
  {
    caseId: 'CASE-2026-091',
    title: 'KYC Document Address Discrepancy · Apex Global Forwarders',
    type: 'kyc_dispute',
    subjectType: 'company',
    subjectId: 'CMP-00104',
    subjectLabel: 'Apex Global Forwarders LLP',
    status: 'investigating',
    severity: 'medium',
    assignedToUid: 'gf-op-005',
    assignedToName: 'Anirudh Roy Chowdhury',
    notes: [
      { id: 'n1', authorName: 'Anirudh Roy Chowdhury', authorRole: 'godfather_compliance', text: 'GST registration certificate shows registered address in Okhla Phase III whereas DGFT IEC certificate lists Connaught Place.', createdAt: '2026-08-28T17:00:00Z' },
    ],
    evidenceRefs: [
      { name: 'Apex_GST_Reg.pdf', url: 'https://con.fr8x.in/docs/gst-apex.pdf', type: 'PDF', uploadedAt: '2026-08-28T16:00:00Z' },
    ],
    createdAt: '2026-08-28T16:30:00Z',
    updatedAt: '2026-08-28T17:00:00Z',
  },
  {
    caseId: 'CASE-2026-088',
    title: 'OceanStar Maritime Blacklist Dispute & Demurrage Claim',
    type: 'compliance',
    subjectType: 'company',
    subjectId: 'CMP-00999',
    subjectLabel: 'OceanStar Maritime Forwarding Ltd.',
    status: 'open',
    severity: 'critical',
    assignedToUid: 'gf-op-003',
    assignedToName: 'Marcus Van Der Berg',
    notes: [
      { id: 'n2', authorName: 'Marcus Van Der Berg', authorRole: 'godfather_moderator', text: 'Reporter provided BL copy and port demurrage invoice for $42,500 USD.', createdAt: '2026-08-12T11:00:00Z' },
    ],
    evidenceRefs: [
      { name: 'CLAIM-BL-JEA-44910.pdf', url: 'https://con.fr8x.in/docs/claim-bl.pdf', type: 'PDF', uploadedAt: '2026-08-10T10:00:00Z' },
    ],
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-12T11:00:00Z',
  },
];

interface GodfatherDataContextType {
  // State lists
  users: UserProfile[];
  companies: CompanyVerificationItem[];
  auctions: Auction[];
  rates: RateItem[];
  rateImports: RateImportBatch[];
  blocks: BlockAction[];
  blacklist: BlacklistCase[];
  plans: PlanVersion[];
  paymentConfigs: PaymentConfig[];
  invoices: InvoiceRecord[];
  templates: NotificationTemplate[];
  cases: AdminCase[];
  auditLogs: AdminAction[];
  
  // Controlled Actions (Backend Executed with Reason & Step-Up)
  executeAction: (params: {
    targetType: AdminAction['targetType'];
    targetId: string;
    targetLabel?: string;
    actionType: string;
    reason: string;
    beforeSnapshot?: any;
    afterSnapshot?: any;
    stepUpVerified?: boolean;
    mutationFn: () => void;
  }) => Promise<{ success: boolean; correlationId: string }>;

  // User Actions
  toggleUserVerification: (uid: string, isVerified: boolean, reason: string) => Promise<boolean>;
  toggleUserGoldTick: (uid: string, hasGoldenTick: boolean, reason: string) => Promise<boolean>;
  updateUserProfileAudited: (uid: string, changes: Partial<UserProfile>, reason: string) => Promise<boolean>;
  blockUserScoped: (params: { uid: string; name: string; email: string; scopes: BlockScope[]; reasonCode: BlockAction['reasonCode']; reasonText: string; expiresAt?: string }) => Promise<boolean>;
  unblockUser: (blockId: string, reason: string) => Promise<boolean>;
  forceUserLogout: (uid: string, reason: string) => Promise<boolean>;

  // Company Actions
  verifyCompany: (companyId: string, reason: string) => Promise<boolean>;
  rejectCompany: (companyId: string, reason: string) => Promise<boolean>;
  requestCompanyInfo: (companyId: string, note: string) => Promise<boolean>;

  // Auction Actions
  suspendAuction: (auctionId: string, reason: string) => Promise<boolean>;
  reopenAuction: (auctionId: string, reason: string) => Promise<boolean>;
  dispatchBidderNotifications: (auctionId: string) => Promise<{ success: boolean; biddersNotified: number }>;

  // Rate & Import Actions
  moderateRate: (rateId: string, action: 'hide' | 'suspend' | 'restore', reason: string) => Promise<boolean>;
  finalizeRateImport: (importId: string, reason: string) => Promise<boolean>;

  // Trust & Safety
  resolveReport: (reportId: string, action: 'dismiss' | 'hide_content' | 'warn_author' | 'escalate', reason: string) => Promise<boolean>;
  publishBlacklistEntry: (caseId: string, reason: string) => Promise<boolean>;
  revokeBlacklistEntry: (caseId: string, reason: string) => Promise<boolean>;

  // Commerce & Pricing
  createPlanVersion: (newPlan: Partial<PlanVersion>, reason: string) => Promise<boolean>;
  requestPaymentConfigChange: (configId: string, changeDetails: string, reason: string) => Promise<boolean>;
  processRefundOrCredit: (invoiceId: string, amount: number, type: 'refund' | 'credit', reason: string) => Promise<boolean>;

  // Templates
  saveNotificationTemplate: (template: NotificationTemplate, reason: string) => Promise<boolean>;

  // Global Search Engine
  searchAllRecords: (query: string, filters?: { type?: string; status?: string; country?: string }) => GlobalSearchResult[];
  getCustomerDossier: (query: string) => CustomerDossier | null;
}

const GodfatherDataContext = createContext<GodfatherDataContextType | undefined>(undefined);

export function GodfatherDataProvider({ children }: { children: ReactNode }) {
  const { operator, requestStepUpVerification, isStepUpValid } = useGodfatherAuth();

  const [users, setUsers] = useState<UserProfile[]>(SEED_USERS);
  const [companies, setCompanies] = useState<CompanyVerificationItem[]>(SEED_COMPANIES);
  const [auctions, setAuctions] = useState<Auction[]>(SEED_AUCTIONS);
  const [rates, setRates] = useState<RateItem[]>(SEED_RATES);
  const [rateImports, setRateImports] = useState<RateImportBatch[]>(SEED_RATE_IMPORTS);
  const [blocks, setBlocks] = useState<BlockAction[]>(SEED_BLOCKS);
  const [blacklist, setBlacklist] = useState<BlacklistCase[]>(SEED_BLACKLIST);
  const [plans, setPlans] = useState<PlanVersion[]>(SEED_PLANS);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>(SEED_PAYMENT_CONFIGS);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(SEED_INVOICES);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(SEED_TEMPLATES);
  const [cases, setCases] = useState<AdminCase[]>(SEED_CASES);
  const [auditLogs, setAuditLogs] = useState<AdminAction[]>(SEED_ADMIN_ACTIONS);

  // Persistence to local storage
  useEffect(() => {
    try {
      const savedAudit = localStorage.getItem('fr8x_gf_audit_logs');
      if (savedAudit) setAuditLogs(JSON.parse(savedAudit));
    } catch {}
  }, []);

  const executeAction = async (params: {
    targetType: AdminAction['targetType'];
    targetId: string;
    targetLabel?: string;
    actionType: string;
    reason: string;
    beforeSnapshot?: any;
    afterSnapshot?: any;
    stepUpVerified?: boolean;
    mutationFn: () => void;
  }): Promise<{ success: boolean; correlationId: string }> => {
    // 1. Execute mutation
    params.mutationFn();

    // 2. Create immutable audit record
    const record = createAuditRecord({
      actorUid: operator.uid,
      actorEmail: operator.email,
      actorName: operator.displayName,
      actorRole: operator.role,
      targetType: params.targetType,
      targetId: params.targetId,
      targetLabel: params.targetLabel,
      actionType: params.actionType,
      beforeSnapshot: params.beforeSnapshot,
      afterSnapshot: params.afterSnapshot,
      reason: params.reason,
      stepUpVerified: params.stepUpVerified ?? isStepUpValid,
    });

    setAuditLogs((prev) => {
      const updated = [record, ...prev];
      try {
        localStorage.setItem('fr8x_gf_audit_logs', JSON.stringify(updated.slice(0, 500)));
      } catch {}
      return updated;
    });

    return { success: true, correlationId: record.correlationId };
  };

  // User Actions
  const toggleUserVerification = async (uid: string, isVerified: boolean, reason: string): Promise<boolean> => {
    const user = users.find((u) => u.uid === uid);
    if (!user) return false;

    const before = { isVerified: user.isVerified };
    const after = { isVerified };

    await executeAction({
      targetType: 'user',
      targetId: uid,
      targetLabel: `${user.displayName} (${user.company})`,
      actionType: isVerified ? 'USER_VERIFIED' : 'USER_UNVERIFIED',
      reason,
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isVerified } : u)));
      },
    });
    return true;
  };

  const toggleUserGoldTick = async (uid: string, hasGoldenTick: boolean, reason: string): Promise<boolean> => {
    const user = users.find((u) => u.uid === uid);
    if (!user) return false;

    const before = { hasGoldenTick: user.hasGoldenTick };
    const after = { hasGoldenTick };

    await executeAction({
      targetType: 'user',
      targetId: uid,
      targetLabel: `${user.displayName} (${user.company})`,
      actionType: hasGoldenTick ? 'GOLDEN_TICK_GRANTED' : 'GOLDEN_TICK_REVOKED',
      reason,
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, hasGoldenTick } : u)));
      },
    });
    return true;
  };

  const updateUserProfileAudited = async (uid: string, changes: Partial<UserProfile>, reason: string): Promise<boolean> => {
    const user = users.find((u) => u.uid === uid);
    if (!user) return false;

    const before = { ...user };
    const after = { ...user, ...changes };

    await executeAction({
      targetType: 'user',
      targetId: uid,
      targetLabel: `${user.displayName} (${user.company})`,
      actionType: 'USER_PROFILE_CORRECTED',
      reason,
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...changes } : u)));
      },
    });
    return true;
  };

  const blockUserScoped = async (params: {
    uid: string;
    name: string;
    email: string;
    scopes: BlockScope[];
    reasonCode: BlockAction['reasonCode'];
    reasonText: string;
    expiresAt?: string;
  }): Promise<boolean> => {
    const blockId = `blk-${Date.now()}`;
    const newBlock: BlockAction = {
      blockId,
      subjectType: 'user',
      subjectId: params.uid,
      subjectName: params.name,
      subjectEmail: params.email,
      scopes: params.scopes,
      reasonCode: params.reasonCode,
      reasonText: params.reasonText,
      evidenceRefs: [],
      status: 'active',
      expiresAt: params.expiresAt,
      createdBy: operator.uid,
      createdByName: operator.displayName,
      createdAt: new Date().toISOString(),
    };

    await executeAction({
      targetType: 'user',
      targetId: params.uid,
      targetLabel: `${params.name} (${params.email})`,
      actionType: 'MEMBER_SCOPED_BLOCK_APPLIED',
      reason: `[${params.reasonCode}] ${params.reasonText}`,
      beforeSnapshot: { blocked: false },
      afterSnapshot: newBlock,
      mutationFn: () => {
        setBlocks((prev) => [newBlock, ...prev]);
      },
    });
    return true;
  };

  const unblockUser = async (blockId: string, reason: string): Promise<boolean> => {
    const block = blocks.find((b) => b.blockId === blockId);
    if (!block) return false;

    await executeAction({
      targetType: 'user',
      targetId: block.subjectId,
      targetLabel: block.subjectName,
      actionType: 'MEMBER_BLOCK_LIFTED',
      reason,
      beforeSnapshot: block,
      afterSnapshot: { ...block, status: 'lifted', reviewedBy: operator.uid, reviewedAt: new Date().toISOString() },
      mutationFn: () => {
        setBlocks((prev) =>
          prev.map((b) => (b.blockId === blockId ? { ...b, status: 'lifted', reviewedBy: operator.uid, reviewedAt: new Date().toISOString() } : b))
        );
      },
    });
    return true;
  };

  const forceUserLogout = async (uid: string, reason: string): Promise<boolean> => {
    const user = users.find((u) => u.uid === uid);
    if (!user) return false;

    await executeAction({
      targetType: 'user',
      targetId: uid,
      targetLabel: user.displayName,
      actionType: 'FORCE_LOGOUT_REVOKE_SESSIONS',
      reason,
      mutationFn: () => {},
    });
    return true;
  };

  // Company Actions
  const verifyCompany = async (companyId: string, reason: string): Promise<boolean> => {
    const comp = companies.find((c) => c.companyId === companyId);
    if (!comp) return false;

    const before = { status: comp.status };
    const after = { status: 'verified', reviewedBy: operator.uid, reviewedAt: new Date().toISOString() };

    await executeAction({
      targetType: 'company',
      targetId: companyId,
      targetLabel: comp.legalName,
      actionType: 'COMPANY_KYC_VERIFIED',
      reason,
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setCompanies((prev) =>
          prev.map((c) => (c.companyId === companyId ? { ...c, status: 'verified', reviewedBy: operator.uid, reviewedAt: new Date().toISOString() } : c))
        );
      },
    });
    return true;
  };

  const rejectCompany = async (companyId: string, reason: string): Promise<boolean> => {
    const comp = companies.find((c) => c.companyId === companyId);
    if (!comp) return false;

    const before = { status: comp.status };
    const after = { status: 'rejected', reviewedBy: operator.uid, reviewedAt: new Date().toISOString() };

    await executeAction({
      targetType: 'company',
      targetId: companyId,
      targetLabel: comp.legalName,
      actionType: 'COMPANY_KYC_REJECTED',
      reason,
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setCompanies((prev) =>
          prev.map((c) => (c.companyId === companyId ? { ...c, status: 'rejected', reviewedBy: operator.uid, reviewedAt: new Date().toISOString() } : c))
        );
      },
    });
    return true;
  };

  const requestCompanyInfo = async (companyId: string, note: string): Promise<boolean> => {
    const comp = companies.find((c) => c.companyId === companyId);
    if (!comp) return false;

    await executeAction({
      targetType: 'company',
      targetId: companyId,
      targetLabel: comp.legalName,
      actionType: 'COMPANY_KYC_ADDITIONAL_INFO_REQUESTED',
      reason: note,
      mutationFn: () => {
        setCompanies((prev) =>
          prev.map((c) =>
            c.companyId === companyId
              ? {
                  ...c,
                  status: 'additional_info_required',
                  adminNotes: [note, ...c.adminNotes],
                  reviewedBy: operator.uid,
                  reviewedAt: new Date().toISOString(),
                }
              : c
          )
        );
      },
    });
    return true;
  };

  // Auction Actions
  const suspendAuction = async (auctionId: string, reason: string): Promise<boolean> => {
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc) return false;

    await executeAction({
      targetType: 'auction',
      targetId: auctionId,
      targetLabel: auc.title,
      actionType: 'AUCTION_COMPLIANCE_SUSPENDED',
      reason,
      beforeSnapshot: { status: auc.status },
      afterSnapshot: { status: 'Cancelled', resultDetail: 'Administrative suspension' },
      mutationFn: () => {
        setAuctions((prev) => prev.map((a) => (a.id === auctionId ? { ...a, status: 'Cancelled', result: 'cancelled', resultDetail: reason } : a)));
      },
    });
    return true;
  };

  const reopenAuction = async (auctionId: string, reason: string): Promise<boolean> => {
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc) return false;

    await executeAction({
      targetType: 'auction',
      targetId: auctionId,
      targetLabel: auc.title,
      actionType: 'AUCTION_REOPENED_AUDITED',
      reason,
      beforeSnapshot: { status: auc.status },
      afterSnapshot: { status: 'Live' },
      mutationFn: () => {
        setAuctions((prev) => prev.map((a) => (a.id === auctionId ? { ...a, status: 'Live', result: undefined } : a)));
      },
    });
    return true;
  };

  const dispatchBidderNotifications = async (auctionId: string): Promise<{ success: boolean; biddersNotified: number }> => {
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc) return { success: false, biddersNotified: 0 };

    const structuredTable = formatAuctionDetailTable(auc);

    await executeAction({
      targetType: 'auction',
      targetId: auctionId,
      targetLabel: auc.title,
      actionType: 'BIDDER_STRUCTURED_NOTIFICATIONS_DISPATCHED',
      reason: `Dispatched formal tender invitation to ${auc.selectedBidders.length} assigned bidders with full equipment and route manifest`,
      mutationFn: () => {},
    });

    return { success: true, biddersNotified: auc.selectedBidders.length };
  };

  // Rate & Import Actions
  const moderateRate = async (rateId: string, action: 'hide' | 'suspend' | 'restore', reason: string): Promise<boolean> => {
    const rate = rates.find((r) => r.id === rateId);
    if (!rate) return false;

    await executeAction({
      targetType: 'rate',
      targetId: rateId,
      targetLabel: `${rate.carrier} (${rate.route})`,
      actionType: `RATE_${action.toUpperCase()}_MODERATION`,
      reason,
      mutationFn: () => {},
    });
    return true;
  };

  const finalizeRateImport = async (importId: string, reason: string): Promise<boolean> => {
    const imp = rateImports.find((i) => i.importId === importId);
    if (!imp) return false;

    await executeAction({
      targetType: 'rate_import',
      targetId: importId,
      targetLabel: imp.filename,
      actionType: 'RATE_IMPORT_BATCH_FINALIZED',
      reason,
      beforeSnapshot: { status: imp.status },
      afterSnapshot: { status: 'Finalized', finalizedBy: operator.uid, finalizedAt: new Date().toISOString() },
      mutationFn: () => {
        setRateImports((prev) =>
          prev.map((i) => (i.importId === importId ? { ...i, status: 'Finalized', finalizedBy: operator.uid, finalizedAt: new Date().toISOString() } : i))
        );
      },
    });
    return true;
  };

  // Trust & Safety
  const resolveReport = async (reportId: string, action: 'dismiss' | 'hide_content' | 'warn_author' | 'escalate', reason: string): Promise<boolean> => {
    await executeAction({
      targetType: 'report',
      targetId: reportId,
      actionType: `REPORT_${action.toUpperCase()}`,
      reason,
      mutationFn: () => {},
    });
    return true;
  };

  const publishBlacklistEntry = async (caseId: string, reason: string): Promise<boolean> => {
    const item = blacklist.find((b) => b.id === caseId);
    if (!item) return false;

    await executeAction({
      targetType: 'blacklist',
      targetId: caseId,
      targetLabel: item.companyName,
      actionType: 'BLACKLIST_ENTRY_PUBLICLY_PUBLISHED',
      reason,
      beforeSnapshot: { status: item.status },
      afterSnapshot: { status: 'active', published: true },
      mutationFn: () => {
        setBlacklist((prev) => prev.map((b) => (b.id === caseId ? { ...b, status: 'active' } : b)));
      },
    });
    return true;
  };

  const revokeBlacklistEntry = async (caseId: string, reason: string): Promise<boolean> => {
    const item = blacklist.find((b) => b.id === caseId);
    if (!item) return false;

    await executeAction({
      targetType: 'blacklist',
      targetId: caseId,
      targetLabel: item.companyName,
      actionType: 'BLACKLIST_ENTRY_REVOKED',
      reason,
      beforeSnapshot: { status: item.status },
      afterSnapshot: { status: 'resolved' },
      mutationFn: () => {
        setBlacklist((prev) => prev.map((b) => (b.id === caseId ? { ...b, status: 'resolved' } : b)));
      },
    });
    return true;
  };

  // Commerce
  const createPlanVersion = async (newPlan: Partial<PlanVersion>, reason: string): Promise<boolean> => {
    const planId = `PV-${newPlan.plan?.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const completePlan: PlanVersion = {
      planVersionId: planId,
      plan: newPlan.plan || 'professional',
      planName: newPlan.planName || 'Custom Plan Tier',
      version: (plans.filter((p) => p.plan === newPlan.plan).length || 0) + 1,
      countryScope: newPlan.countryScope || 'India',
      currency: newPlan.currency || 'INR',
      monthlyPrice: newPlan.monthlyPrice || 1500,
      taxPolicy: newPlan.taxPolicy || 'inclusive_gst',
      effectiveFrom: newPlan.effectiveFrom || new Date().toISOString(),
      active: true,
      featureFlags: newPlan.featureFlags || {
        goldVerification: false,
        unlimitedSearches: true,
        unlimitedChat: true,
        directCarrierTenders: true,
        marketAnalytics: true,
        apiAccess: false,
      },
      limits: newPlan.limits || {
        monthlyAuctions: 20,
        monthlyBids: 100,
        subAccounts: 5,
        rateInventoryMax: 200,
      },
      bidFee: newPlan.bidFee || 300,
      bidDiscountPercent: newPlan.bidDiscountPercent || 0,
      trialEligibility: newPlan.trialEligibility || 'N/A',
      legacyGrandfatheringPolicy: newPlan.legacyGrandfatheringPolicy || 'maintain_original_price',
      createdBy: operator.uid,
      createdAt: new Date().toISOString(),
    };

    await executeAction({
      targetType: 'plan',
      targetId: planId,
      targetLabel: completePlan.planName,
      actionType: 'PLAN_VERSION_CREATED',
      reason,
      afterSnapshot: completePlan,
      mutationFn: () => {
        setPlans((prev) => [completePlan, ...prev]);
      },
    });
    return true;
  };

  const requestPaymentConfigChange = async (configId: string, changeDetails: string, reason: string): Promise<boolean> => {
    const cfg = paymentConfigs.find((c) => c.configId === configId);
    if (!cfg) return false;

    const request = {
      requestId: `REQ-${Date.now().toString(36).toUpperCase()}`,
      requestedBy: operator.displayName,
      requestedAt: new Date().toISOString(),
      changeDetails,
      approvalStatus: 'pending_second_approver' as const,
    };

    await executeAction({
      targetType: 'payment_config',
      targetId: configId,
      targetLabel: cfg.provider,
      actionType: 'PAYMENT_CONFIG_CHANGE_REQUESTED',
      reason,
      beforeSnapshot: cfg,
      afterSnapshot: { ...cfg, pendingChangeRequest: request },
      mutationFn: () => {
        setPaymentConfigs((prev) => prev.map((c) => (c.configId === configId ? { ...c, pendingChangeRequest: request } : c)));
      },
    });
    return true;
  };

  const processRefundOrCredit = async (invoiceId: string, amount: number, type: 'refund' | 'credit', reason: string): Promise<boolean> => {
    const inv = invoices.find((i) => i.invoiceId === invoiceId);
    if (!inv) return false;

    await executeAction({
      targetType: 'fee',
      targetId: invoiceId,
      targetLabel: `Invoice ${inv.invoiceNumber} (${inv.userName})`,
      actionType: type === 'refund' ? 'INVOICE_PAYMENT_REFUNDED' : 'INVOICE_CREDIT_ADJUSTMENT_ISSUED',
      reason: `[${type.toUpperCase()}: $${amount}] ${reason}`,
      beforeSnapshot: { status: inv.status },
      afterSnapshot: { status: type === 'refund' ? 'refunded' : 'adjusted', refundReason: reason },
      mutationFn: () => {
        setInvoices((prev) =>
          prev.map((i) => (i.invoiceId === invoiceId ? { ...i, status: type === 'refund' ? 'refunded' : 'adjusted', refundReason: reason } : i))
        );
      },
    });
    return true;
  };

  // Templates
  const saveNotificationTemplate = async (template: NotificationTemplate, reason: string): Promise<boolean> => {
    const exists = templates.find((t) => t.templateId === template.templateId);
    const updated = {
      ...template,
      version: exists ? exists.version + 1 : 1,
      updatedAt: new Date().toISOString(),
      updatedBy: operator.uid,
    };

    await executeAction({
      targetType: 'template',
      targetId: template.templateId,
      targetLabel: template.name,
      actionType: 'NOTIFICATION_TEMPLATE_UPDATED',
      reason,
      beforeSnapshot: exists,
      afterSnapshot: updated,
      mutationFn: () => {
        setTemplates((prev) => (exists ? prev.map((t) => (t.templateId === template.templateId ? updated : t)) : [updated, ...prev]));
      },
    });
    return true;
  };

  // Universal Deep Search Engine
  const searchAllRecords = (query: string, filters?: { type?: string; status?: string; country?: string }): GlobalSearchResult[] => {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();
    const results: GlobalSearchResult[] = [];

    // 1. Search Users
    users.forEach((u) => {
      if (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.company.toLowerCase().includes(q) ||
        (u.gstn && u.gstn.toLowerCase().includes(q)) ||
        (u.pan && u.pan.toLowerCase().includes(q)) ||
        (u.iec && u.iec.toLowerCase().includes(q)) ||
        (u.mto && u.mto.toLowerCase().includes(q))
      ) {
        results.push({
          id: u.uid,
          title: u.displayName,
          subtitle: `${u.company} · ${u.email} · ${u.city}, ${u.country}`,
          type: 'user',
          category: 'Operations',
          status: u.isVerified ? (u.hasGoldenTick ? 'Gold Verified' : 'Verified') : 'Pending',
          statusBadgeVariant: u.hasGoldenTick ? 'gold' : u.isVerified ? 'green' : 'amber',
          detailsUrl: `/godfather/operations/users?uid=${u.uid}`,
          rawObject: u,
        });
      }
    });

    // 2. Search Companies
    companies.forEach((c) => {
      if (
        c.legalName.toLowerCase().includes(q) ||
        c.companyId.toLowerCase().includes(q) ||
        (c.gstn && c.gstn.toLowerCase().includes(q)) ||
        (c.pan && c.pan.toLowerCase().includes(q)) ||
        (c.iec && c.iec.toLowerCase().includes(q))
      ) {
        results.push({
          id: c.companyId,
          title: c.legalName,
          subtitle: `ID: ${c.companyId} · ${c.city}, ${c.country} · GST: ${c.gstn || 'N/A'}`,
          type: 'company',
          category: 'Operations',
          status: c.status.replace('_', ' ').toUpperCase(),
          statusBadgeVariant: c.status === 'verified' ? 'green' : c.status === 'pending' ? 'amber' : 'red',
          detailsUrl: `/godfather/operations/companies?id=${c.companyId}`,
          rawObject: c,
        });
      }
    });

    // 3. Search Auctions & RFQs
    auctions.forEach((a) => {
      if (
        a.id.toLowerCase().includes(q) ||
        a.rfqId.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.creatorCompany.toLowerCase().includes(q) ||
        a.shipment.pol.toLowerCase().includes(q) ||
        a.shipment.pod.toLowerCase().includes(q)
      ) {
        results.push({
          id: a.id,
          title: `${a.id} · ${a.title}`,
          subtitle: `${a.creatorCompany} · ${a.shipment.pol} → ${a.shipment.pod} · RFQ: ${a.rfqId}`,
          type: 'auction',
          category: 'Operations',
          status: a.status,
          statusBadgeVariant: a.status === 'Live' ? 'green' : a.status === 'Awarded' ? 'blue' : 'gray',
          detailsUrl: `/godfather/operations/auctions?id=${a.id}`,
          rawObject: a,
        });
      }
    });

    // 4. Search Rates
    rates.forEach((r) => {
      if (
        r.id.toLowerCase().includes(q) ||
        r.carrier.toLowerCase().includes(q) ||
        r.route.toLowerCase().includes(q) ||
        r.sp.toLowerCase().includes(q)
      ) {
        results.push({
          id: r.id,
          title: `${r.id} · ${r.carrier} (${r.route})`,
          subtitle: `20DV: $${r.d20} · 40HC: $${r.h40} · Provider: ${r.sp} · Valid: ${r.valid}`,
          type: 'rate',
          category: 'Operations',
          status: 'Active',
          statusBadgeVariant: 'green',
          detailsUrl: `/godfather/operations/rates?id=${r.id}`,
          rawObject: r,
        });
      }
    });

    // 5. Search Blacklist Cases
    blacklist.forEach((b) => {
      if (
        b.id.toLowerCase().includes(q) ||
        b.companyName.toLowerCase().includes(q) ||
        b.reason.toLowerCase().includes(q)
      ) {
        results.push({
          id: b.id,
          title: `${b.id} · ${b.companyName}`,
          subtitle: `Severity: ${b.severity.toUpperCase()} · Reported by ${b.reporter} · ${b.location}`,
          type: 'blacklist',
          category: 'Trust & Safety',
          status: b.status.toUpperCase(),
          statusBadgeVariant: 'red',
          detailsUrl: `/godfather/trust-safety/blacklist?id=${b.id}`,
          rawObject: b,
        });
      }
    });

    // 6. Search Invoices
    invoices.forEach((inv) => {
      if (
        inv.invoiceId.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.userEmail.toLowerCase().includes(q) ||
        inv.companyName.toLowerCase().includes(q)
      ) {
        results.push({
          id: inv.invoiceId,
          title: `${inv.invoiceNumber} · ${inv.companyName}`,
          subtitle: `${inv.currency} ${inv.amountTotal} · User: ${inv.userName} · Plan: ${inv.planTier}`,
          type: 'invoice',
          category: 'Commerce',
          status: inv.status.toUpperCase(),
          statusBadgeVariant: inv.status === 'paid' ? 'green' : inv.status === 'refunded' ? 'amber' : 'red',
          detailsUrl: `/godfather/commerce/invoices?id=${inv.invoiceId}`,
          rawObject: inv,
        });
      }
    });

    // Filter if requested
    if (filters?.type && filters.type !== 'all') {
      return results.filter((r) => r.type === filters.type);
    }

    return results;
  };

  const getCustomerDossier = (query: string): CustomerDossier | null => {
    if (!query) return null;
    const q = query.trim().toLowerCase();

    const user = users.find(
      (u) =>
        u.uid.toLowerCase() === q ||
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.company.toLowerCase().includes(q)
    );

    if (!user) return null;

    const company = companies.find((c) => c.companyId === user.companyId || c.legalName.toLowerCase().includes(user.company.toLowerCase()));
    const userBlock = blocks.find((b) => b.subjectId === user.uid && b.status === 'active');
    const userPlan = plans.find((p) => p.plan === user.plan) || plans[0];
    const userInvoices = invoices.filter((i) => i.userUid === user.uid);
    const userAuctions = auctions.filter((a) => a.creatorUid === user.uid);
    const userRates = rates.filter((r) => r.ownerUid === user.uid);
    const userCases = cases.filter((c) => c.subjectId === user.uid || (company && c.subjectId === company.companyId));

    // Calculate risk score (0 - 100)
    let riskScore = 10;
    const riskFactors: string[] = [];

    if (userBlock) {
      riskScore += 50;
      riskFactors.push('Active feature block applied');
    }
    if (!user.isVerified) {
      riskScore += 20;
      riskFactors.push('Unverified corporate profile');
    }
    if (company && company.status === 'additional_info_required') {
      riskScore += 15;
      riskFactors.push('Company verification flagged for missing documents');
    }
    if (userCases.length > 0) {
      riskScore += 25;
      riskFactors.push(`${userCases.length} open compliance/dispute case(s)`);
    }

    return {
      user,
      company,
      verification: company,
      blockStatus: userBlock,
      activePlan: userPlan,
      invoices: userInvoices,
      auctionsCreated: userAuctions,
      bidsSubmitted: [],
      ratesPosted: userRates,
      jobsPosted: [],
      postsCount: 12,
      reportsReceived: [],
      reportsFiled: [],
      activeCases: userCases,
      riskScore: Math.min(100, riskScore),
      riskFactors,
    };
  };

  return (
    <GodfatherDataContext.Provider
      value={{
        users,
        companies,
        auctions,
        rates,
        rateImports,
        blocks,
        blacklist,
        plans,
        paymentConfigs,
        invoices,
        templates,
        cases,
        auditLogs,
        executeAction,
        toggleUserVerification,
        toggleUserGoldTick,
        updateUserProfileAudited,
        blockUserScoped,
        unblockUser,
        forceUserLogout,
        verifyCompany,
        rejectCompany,
        requestCompanyInfo,
        suspendAuction,
        reopenAuction,
        dispatchBidderNotifications,
        moderateRate,
        finalizeRateImport,
        resolveReport,
        publishBlacklistEntry,
        revokeBlacklistEntry,
        createPlanVersion,
        requestPaymentConfigChange,
        processRefundOrCredit,
        saveNotificationTemplate,
        searchAllRecords,
        getCustomerDossier,
      }}
    >
      {children}
    </GodfatherDataContext.Provider>
  );
}

export function useGodfatherData() {
  const context = useContext(GodfatherDataContext);
  if (!context) {
    throw new Error('useGodfatherData must be used within a GodfatherDataProvider');
  }
  return context;
}
