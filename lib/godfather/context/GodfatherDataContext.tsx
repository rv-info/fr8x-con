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
  EmailLog,
  MailboxStatus,
  SensitiveWordRule,
  TermsAgreement,
  ComplianceRecord,
  PaymentGatewayConfig,
  PlatformBankDetails,
  PlatformUpiDetails,
  MonthlyAccountingSummary,
  MasterLocation,
  MasterCarrier,
  MasterEquipment,
  MasterCommodity,
  MasterIncoterm,
  MasterTaxSAC,
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
    subjectEmail: 'ramesh@transoceanicexpress.in',
    scopes: ['feed_post', 'auction_bid', 'chat'],
    reasonCode: 'fraud_risk',
    reasonText: 'Multiple fraudulent bid submissions with unverified GST credentials and failure to honor lowest price bids.',
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

const SEED_MAILBOXES: MailboxStatus[] = [
  {
    mailbox: 'password@fr8x.in',
    roleDescription: 'System OTP, Password Reset, Verification & Account Security (SMTP Engine)',
    status: 'healthy',
    mfaEnforced: true,
    smtpHealth: 'connected',
    lastSuccessfulSend: '2026-08-30T17:15:00Z',
    aliases: ['noreply@fr8x.in'],
    sentToday: 142,
    dailyLimit: 1000,
  },
  {
    mailbox: 'support@fr8x.in',
    roleDescription: 'General Customer & Freight Member Support Operations',
    status: 'healthy',
    mfaEnforced: true,
    smtpHealth: 'connected',
    lastSuccessfulSend: '2026-08-30T16:40:00Z',
    aliases: ['billing@fr8x.in'],
    sentToday: 89,
    dailyLimit: 1000,
  },
  {
    mailbox: 'tech@fr8x.in',
    roleDescription: 'GODFATHER Operator Identity, Security Alert & Lockout Recipient',
    status: 'healthy',
    mfaEnforced: true,
    smtpHealth: 'connected',
    lastSuccessfulSend: '2026-08-30T17:05:00Z',
    aliases: ['alerts@fr8x.in'],
    sentToday: 18,
    dailyLimit: 1000,
  },
];

const SEED_EMAIL_LOGS: EmailLog[] = [
  {
    logId: 'EML-2026-0891',
    recipient: 'arjun@atlaslogistics.com',
    sender: 'FR8X Platform Security <password@fr8x.in>',
    subject: '[FR8X GODFATHER] Login Verification Code: 884210',
    templateId: 'TMPL_OTP_CHALLENGE',
    templateName: 'Godfather Operator OTP Challenge',
    correlationId: 'GF-EML-9921-8842',
    status: 'delivered',
    provider: 'Zoho_SMTP',
    sentAt: '2026-08-30T17:15:00Z',
    deliveredAt: '2026-08-30T17:15:02Z',
    entityContext: { entityType: 'user', entityId: 'u-arjun' },
  },
  {
    logId: 'EML-2026-0890',
    recipient: 'sarah.lewis@rotterdamfreight.nl',
    sender: 'FR8X Platform <password@fr8x.in>',
    subject: 'Action Required: Tender Invitation for Reverse Freight Auction RA-2026-0842',
    templateId: 'TMPL_AUCTION_INVITE',
    templateName: 'Reverse Auction Tender Invitation',
    correlationId: 'GF-EML-8842-1092',
    status: 'delivered',
    provider: 'Zoho_SMTP',
    sentAt: '2026-08-30T16:20:00Z',
    deliveredAt: '2026-08-30T16:20:03Z',
    entityContext: { entityType: 'auction', entityId: 'RA-2026-0842' },
  },
  {
    logId: 'EML-2026-0889',
    recipient: 'kiran.mehta@indoocean.com',
    sender: 'FR8X Commerce <password@fr8x.in>',
    subject: 'Tender Concluded: Winning Award Confirmation for RA-2026-0842',
    templateId: 'TMPL_BID_RESULT',
    templateName: 'Auction Winning Award Notification',
    correlationId: 'GF-EML-7741-0091',
    status: 'delivered',
    provider: 'Zoho_SMTP',
    sentAt: '2026-08-30T15:00:00Z',
    deliveredAt: '2026-08-30T15:00:02Z',
    entityContext: { entityType: 'auction', entityId: 'RA-2026-0842' },
  },
  {
    logId: 'EML-2026-0888',
    recipient: 'vikas.dubey@apexforwarders.in',
    sender: 'FR8X Compliance <password@fr8x.in>',
    subject: 'Action Required: Additional Corporate Verification Documents Needed',
    templateId: 'TMPL_KYC_INFO_REQ',
    templateName: 'KYC Additional Information Notice',
    correlationId: 'GF-EML-6612-4412',
    status: 'delivered',
    provider: 'Zoho_SMTP',
    sentAt: '2026-08-28T16:30:00Z',
    deliveredAt: '2026-08-28T16:30:04Z',
    entityContext: { entityType: 'blacklist', entityId: 'BLK-009' },
  },
];

const SEED_SENSITIVE_WORDS: SensitiveWordRule[] = [
  {
    id: 'sw-001',
    wordOrPattern: 'western union',
    category: 'fraud',
    severity: 'quarantine',
    matchType: 'contains',
    active: true,
    hitsCount: 19,
    description: 'Off-platform wire transfer method frequently associated with cargo fraud',
    createdAt: '2026-08-01T10:00:00Z',
    updatedBy: 'tech@fr8x.in',
  },
  {
    id: 'sw-002',
    wordOrPattern: 'personal bank account',
    category: 'fraud',
    severity: 'quarantine',
    matchType: 'contains',
    active: true,
    hitsCount: 14,
    description: 'Solicitation to pay into unverified personal accounts rather than corporate escrow',
    createdAt: '2026-08-01T10:00:00Z',
    updatedBy: 'tech@fr8x.in',
  },
  {
    id: 'sw-003',
    wordOrPattern: 'fake bl',
    category: 'fraud',
    severity: 'block',
    matchType: 'contains',
    active: true,
    hitsCount: 8,
    description: 'Direct mention or discussion of forged Ocean Bills of Lading',
    createdAt: '2026-08-02T11:30:00Z',
    updatedBy: 'tech@fr8x.in',
  },
  {
    id: 'sw-004',
    wordOrPattern: 'whatsapp me',
    category: 'circumvention',
    severity: 'mask',
    matchType: 'contains',
    active: true,
    hitsCount: 86,
    description: 'Attempts to move freight tender communications and price discovery off-platform',
    createdAt: '2026-08-05T09:15:00Z',
    updatedBy: 'tech@fr8x.in',
  },
  {
    id: 'sw-005',
    wordOrPattern: 'wire money advance',
    category: 'fraud',
    severity: 'block',
    matchType: 'contains',
    active: true,
    hitsCount: 11,
    description: 'Demands for 100% advance wire without carrier verification or escrow protection',
    createdAt: '2026-08-06T14:00:00Z',
    updatedBy: 'tech@fr8x.in',
  },
  {
    id: 'sw-006',
    wordOrPattern: 'hawala',
    category: 'illegal',
    severity: 'block',
    matchType: 'contains',
    active: true,
    hitsCount: 4,
    description: 'Illegal parallel money transfer scheme strictly forbidden under FEMA/AML rules',
    createdAt: '2026-08-08T12:00:00Z',
    updatedBy: 'tech@fr8x.in',
  },
  {
    id: 'sw-007',
    wordOrPattern: 'evade gst',
    category: 'fraud',
    severity: 'quarantine',
    matchType: 'contains',
    active: true,
    hitsCount: 6,
    description: 'Soliciting cash or unauthorized off-book tax avoidance transactions',
    createdAt: '2026-08-10T16:45:00Z',
    updatedBy: 'tech@fr8x.in',
  },
  {
    id: 'sw-008',
    wordOrPattern: '(\\+?[0-9]{10,12})',
    category: 'circumvention',
    severity: 'mask',
    matchType: 'regex',
    active: true,
    hitsCount: 142,
    description: 'Automated regex masking of unverified phone numbers in public feed threads',
    createdAt: '2026-08-12T18:00:00Z',
    updatedBy: 'tech@fr8x.in',
  },
];

const SEED_TERMS_AGREEMENTS: TermsAgreement[] = [
  {
    id: 'tac-001',
    code: 'membership_tac',
    title: 'FR8X Master Membership & Commercial Safety Agreement',
    version: '3.2',
    effectiveDate: '2026-08-01',
    summary: 'Governs platform access, corporate entity verification, anti-fraud rules, and binding reverse freight auction participation.',
    fullText: `FR8X PLATFORM TERMS OF SERVICE & COMMERCIAL GOVERNANCE (V3.2)
1. Eligibility & Corporate Verification: Only registered freight forwarders, NVOCCs, direct cargo owners, and custom house agents with valid GSTIN/IEC/Company Registration may access live auction bid rooms.
2. Anti-Circumvention: Commercial negotiations initiated on FR8X must conclude through verified platform documentation to maintain cargo insurance eligibility.
3. Zero Tolerance for Fraud: Forged Bills of Lading, falsified tax invoices, or unauthorized cargo diversion result in immediate global blacklist and reporting to Indian Port Authorities / FIU.
4. Security & Sovereign Auditing: All transactions, rate imports, and admin interactions are cryptographically signed and permanently logged in the immutable audit ledger.`,
    enforceAtRegistration: true,
    enforceAtAuctionCreate: false,
    enforceAtBidSubmit: false,
    enforceAtJobPost: false,
    enforceAtAdPost: false,
    mandatoryClickwrap: true,
    updatedAt: '2026-08-01T00:00:00Z',
    updatedBy: 'tech@fr8x.in',
    totalAcceptances: 1420,
  },
  {
    id: 'tac-002',
    code: 'auction_bidding_rules',
    title: 'Reverse Freight Tender & Bidding Commercial Commitment',
    version: '2.1',
    effectiveDate: '2026-07-15',
    summary: 'Rules ensuring bids placed in reverse auctions are legally binding quotations with guaranteed carrier container slot validity.',
    fullText: `REVERSE FREIGHT AUCTION & BIDDING COMMITMENT POLICY (V2.1)
1. Legally Binding Bids: All rate quotations submitted during reverse auctions constitute binding offers valid for 48 hours post-award.
2. Bid Posting Fee: Standard fee of ₹300 (or ₹180 for Premium Gold members) applies to ensure serious quotations and prevent tender spam.
3. No Phantom Bidding: Collusive, shill, or non-fulfillable bids trigger immediate account suspension and forfeiture of platform credits.
4. Carrier Space Guarantee: Awarded freight forwarders must confirm vessel space allocations within 24 hours of auction conclusion.`,
    enforceAtRegistration: false,
    enforceAtAuctionCreate: true,
    enforceAtBidSubmit: true,
    enforceAtJobPost: false,
    enforceAtAdPost: false,
    mandatoryClickwrap: true,
    updatedAt: '2026-07-15T00:00:00Z',
    updatedBy: 'tech@fr8x.in',
    totalAcceptances: 840,
  },
  {
    id: 'tac-003',
    code: 'job_posting_tac',
    title: 'Logistics Recruitment & Verified Job Posting Agreement',
    version: '1.4',
    effectiveDate: '2026-06-01',
    summary: 'Ensures all job advertisements are legitimate freight and logistics hiring opportunities without misleading compensation.',
    fullText: `LOGISTICS RECRUITMENT & TALENT NETWORK POLICY (V1.4)
1. Legitimate Employment: Job posts must represent bona fide vacancies within freight forwarding, customs brokerage, or supply chain domains.
2. No Placement Fees from Candidates: Charging job seekers application or processing fees is strictly prohibited and results in immediate ban.
3. Non-Discrimination: All listings must comply with equal opportunity standards and Indian Labour Laws.`,
    enforceAtRegistration: false,
    enforceAtAuctionCreate: false,
    enforceAtBidSubmit: false,
    enforceAtJobPost: true,
    enforceAtAdPost: false,
    mandatoryClickwrap: true,
    updatedAt: '2026-06-01T00:00:00Z',
    updatedBy: 'tech@fr8x.in',
    totalAcceptances: 195,
  },
  {
    id: 'tac-004',
    code: 'ad_posting_policy',
    title: 'Commercial Advertisement, Banner Media & Sponsor Rights Policy',
    version: '2.0',
    effectiveDate: '2026-08-10',
    summary: 'Governs commercial promotional spots, sponsored feed banners, rate announcements, and advertising copyright standards.',
    fullText: `SPONSORED MEDIA & ADVERTISEMENT GOVERNANCE (V2.0)
1. Advertising Authenticity: Advertised freight rates, container services, and logistics software must be accurate and directly available.
2. Prohibited Content: No deceptive marketing, unauthorized competitor comparisons, or unverified maritime service claims.
3. Display Rights: FR8X reserves the right to modify placement or suspend non-compliant commercial media without refund.`,
    enforceAtRegistration: false,
    enforceAtAuctionCreate: false,
    enforceAtBidSubmit: false,
    enforceAtJobPost: false,
    enforceAtAdPost: true,
    mandatoryClickwrap: true,
    updatedAt: '2026-08-10T00:00:00Z',
    updatedBy: 'tech@fr8x.in',
    totalAcceptances: 72,
  },
  {
    id: 'tac-005',
    code: 'ip_copyright_policy',
    title: 'Intellectual Property, Copyright Protection & Non-Infringement Policy',
    version: '1.8',
    effectiveDate: '2026-05-20',
    summary: 'Protects proprietary rate algorithms, brand assets, trade logos, and intellectual property across the FR8X network.',
    fullText: `INTELLECTUAL PROPERTY & COPYRIGHT PROTECTION POLICY (V1.8)
1. Ownership of Platform Data: FR8X analytics, aggregation algorithms, and user interface designs are protected under Indian and International Copyright Law.
2. Third-Party Trademarks: Company logos, carrier marks, and shipping line emblems uploaded by users remain property of their respective owners.
3. DMCA / Infringement Notices: Reported copyright infringements will be audited by the Godfather Legal Compliance team within 24 hours.`,
    enforceAtRegistration: true,
    enforceAtAuctionCreate: false,
    enforceAtBidSubmit: false,
    enforceAtJobPost: true,
    enforceAtAdPost: true,
    mandatoryClickwrap: true,
    updatedAt: '2026-05-20T00:00:00Z',
    updatedBy: 'tech@fr8x.in',
    totalAcceptances: 1420,
  },
  {
    id: 'tac-006',
    code: 'commercial_fee_policy',
    title: 'Commercial Fee Schedule, GST Accounting & Dispute Disclaimer',
    version: '3.0',
    effectiveDate: '2026-08-01',
    summary: 'Details subscription pricing, reverse tender fees, GST (SAC 998431) tax breakdown, payment gateway processing, and refund terms.',
    fullText: `COMMERCIAL FEE SCHEDULE & TAX COMPLIANCE POLICY (V3.0)
1. Subscription Plans: Trial (Free 30-Day access via Godfather approval), Professional (₹1,500/mo), Premium Enterprise Gold (₹3,000/mo).
2. Reverse Tender Fees: ₹300 per standard bid / ₹180 for Premium Gold members (40% discount applied automatically).
3. Tax Breakdown: All Indian domestic payments include 18% GST under SAC Code 998431 (CGST 9% + SGST 9% or IGST 18%).
4. Refund & Credits: Gateway refunds or commercial credit adjustments require Godfather Dual-Officer approval and step-up authentication.`,
    enforceAtRegistration: true,
    enforceAtAuctionCreate: true,
    enforceAtBidSubmit: false,
    enforceAtJobPost: true,
    enforceAtAdPost: true,
    mandatoryClickwrap: true,
    updatedAt: '2026-08-01T00:00:00Z',
    updatedBy: 'tech@fr8x.in',
    totalAcceptances: 1420,
  },
];

const SEED_COMPLIANCE_RECORDS: ComplianceRecord[] = [
  {
    id: 'cmp-rec-001',
    entityId: 'CMP-00101',
    entityName: 'Atlas Logistics Pvt. Ltd.',
    entityType: 'company',
    type: 'gstin_audit',
    status: 'compliant',
    riskScore: 5,
    lastAuditedAt: '2026-08-28T10:00:00Z',
    auditedBy: 'tech@fr8x.in',
    details: 'GSTIN 27AABCA1234F1Z5 active and verified via GST portal API with 100% filing compliance.',
    validUntil: '2027-08-28',
    certificateRef: 'GST-AUDIT-2026-8812',
  },
  {
    id: 'cmp-rec-002',
    entityId: 'CMP-00102',
    entityName: 'Rotterdam Freight NV',
    entityType: 'company',
    type: 'aml_sanctions',
    status: 'compliant',
    riskScore: 8,
    lastAuditedAt: '2026-08-27T14:30:00Z',
    auditedBy: 'tech@fr8x.in',
    details: 'Screened against EU & UN maritime sanctions list. No PEP or high-risk entity matches.',
    validUntil: '2027-02-27',
    certificateRef: 'AML-EU-2026-1049',
  },
  {
    id: 'cmp-rec-003',
    entityId: 'CMP-00104',
    entityName: 'Apex Global Forwarders LLP',
    entityType: 'company',
    type: 'mto_license',
    status: 'remediation_required',
    riskScore: 45,
    lastAuditedAt: '2026-08-25T11:00:00Z',
    auditedBy: 'legal.compliance@con.fr8x.in',
    details: 'MTO registration document expired on 2026-07-31. Formal request sent for updated DGS certificate.',
    validUntil: '2026-07-31',
    certificateRef: 'MTO-EXP-2026-004',
  },
  {
    id: 'cmp-rec-004',
    entityId: 'CMP-00105',
    entityName: 'OceanStar Maritime Forwarding Ltd.',
    entityType: 'company',
    type: 'aml_sanctions',
    status: 'under_investigation',
    riskScore: 92,
    lastAuditedAt: '2026-08-20T09:00:00Z',
    auditedBy: 'tech@fr8x.in',
    details: 'Unresolved commercial fraud claim (USD $42,500) and unauthorized Bill of Lading release at Jebel Ali.',
    certificateRef: 'FRAUD-DISPUTE-2026-04',
  },
];

export const SEED_BANK_DETAILS: PlatformBankDetails = {
  bankName: 'HDFC Bank Ltd.',
  accountHolderName: 'FR8X LOGISTICS TECHNOLOGIES PVT. LTD.',
  accountNumber: '50200088921822',
  ifscCode: 'HDFC0001234',
  accountType: 'Current',
  branch: 'Bandra-Kurla Complex (BKC), Mumbai',
  swiftCode: 'HDFCINBBXXX',
  isActive: true,
  notes: 'Official platform collection account for verified enterprise subscriptions, reverse auction deposits, and carrier escrow.',
  updatedAt: '2026-09-01T10:00:00.000Z',
  updatedBy: 'godfather.finance@fr8x.in',
};

export const SEED_UPI_DETAILS: PlatformUpiDetails = {
  vpaId: 'fr8xlogistics@icici',
  payeeName: 'FR8X LOGISTICS TECHNOLOGIES PVT LTD',
  qrImageUrl: '/upi-qr-placeholder.png',
  mccCode: '4789',
  isActive: true,
  minAmount: 1,
  maxAmount: 100000,
  notes: 'Official verified UPI merchant handle for instant 0% surcharge subscription recharges and promotional activation.',
  updatedAt: '2026-09-01T10:00:00.000Z',
  updatedBy: 'godfather.finance@fr8x.in',
};

const SEED_PAYMENT_GATEWAYS: PaymentGatewayConfig[] = [
  {
    gatewayId: 'gw-rzp-01',
    provider: 'Razorpay',
    title: 'Razorpay Enterprise Payments (India)',
    logo: '💳',
    environment: 'production',
    enabled: true,
    currencies: ['INR'],
    publicIdentifier: 'rzp_live_8842Fr8xInd99',
    secretKeyVaultRef: 'kms://gcp/projects/fr8x-con/secrets/rzp_live_sec_***',
    webhookUrl: 'https://con.fr8x.in/api/v1/webhooks/razorpay',
    webhookStatus: 'healthy',
    transactionFee: '2.0% + 18% GST',
    settlementTimeline: 'T+1 Daily Auto-Settlement',
    allowedModules: {
      registration: true,
      auctions: true,
      jobPosts: true,
      adPosts: true,
      kycVerification: true,
    },
    commercialUtilityNote: 'Primary domestic settlement rail supporting Net Banking, Corporate Cards, UPI, and automated GST e-Invoicing.',
    lastTestedAt: '2026-08-30T17:40:00Z',
  },
  {
    gatewayId: 'gw-pp-02',
    provider: 'PayPal',
    title: 'PayPal Global Merchant Commerce',
    logo: '🌐',
    environment: 'production',
    enabled: true,
    currencies: ['USD', 'EUR', 'GBP', 'AED', 'SGD'],
    publicIdentifier: 'client_id_live_FR8X_GLOBAL_441',
    secretKeyVaultRef: 'kms://gcp/projects/fr8x-con/secrets/paypal_sec_***',
    webhookUrl: 'https://con.fr8x.in/api/v1/webhooks/paypal',
    webhookStatus: 'healthy',
    transactionFee: '3.9% + $0.30 USD',
    settlementTimeline: 'T+2 Cross-Border Settlement',
    allowedModules: {
      registration: true,
      auctions: true,
      jobPosts: true,
      adPosts: true,
      kycVerification: true,
    },
    commercialUtilityNote: 'Global international currency gateway enabling overseas freight forwarders in Europe, Americas & Middle East to subscribe and bid.',
    lastTestedAt: '2026-08-30T16:15:00Z',
  },
  {
    gatewayId: 'gw-str-03',
    provider: 'Stripe',
    title: 'Stripe International (SCA & 3D Secure)',
    logo: '⚡',
    environment: 'production',
    enabled: true,
    currencies: ['USD', 'EUR', 'INR'],
    publicIdentifier: 'pk_live_51M7Fr8xGlobalSovereign99',
    secretKeyVaultRef: 'kms://gcp/projects/fr8x-con/secrets/stripe_sec_***',
    webhookUrl: 'https://con.fr8x.in/api/v1/webhooks/stripe',
    webhookStatus: 'healthy',
    transactionFee: '2.9% + ₹3 / $0.30',
    settlementTimeline: 'T+2 Rolling Settlement',
    allowedModules: {
      registration: true,
      auctions: true,
      jobPosts: true,
      adPosts: true,
      kycVerification: false,
    },
    commercialUtilityNote: 'Automated recurring billing engine with built-in Strong Customer Authentication (SCA) for multi-currency corporate credit cards.',
    lastTestedAt: '2026-08-29T19:00:00Z',
  },
  {
    gatewayId: 'gw-cf-04',
    provider: 'Cashfree',
    title: 'Cashfree & UPI Instant Rail (0% Fee)',
    logo: '📱',
    environment: 'production',
    enabled: true,
    currencies: ['INR'],
    publicIdentifier: 'cf_app_id_991823_fr8x',
    secretKeyVaultRef: 'kms://gcp/projects/fr8x-con/secrets/cashfree_sec_***',
    webhookUrl: 'https://con.fr8x.in/api/v1/webhooks/cashfree',
    webhookStatus: 'healthy',
    transactionFee: '0% UPI / 1.75% Cards',
    settlementTimeline: 'Instant Real-Time Bank Settlement',
    allowedModules: {
      registration: true,
      auctions: true,
      jobPosts: true,
      adPosts: true,
      kycVerification: true,
    },
    commercialUtilityNote: 'Zero-fee instant UPI dynamic QR codes and virtual bank collections tailored for Indian freight operators.',
    lastTestedAt: '2026-08-30T14:30:00Z',
  },
  {
    gatewayId: 'gw-wire-05',
    provider: 'Bank_Wire',
    title: 'Direct Corporate NEFT / RTGS & SWIFT Wire',
    logo: '🏛️',
    environment: 'production',
    enabled: true,
    currencies: ['INR', 'USD'],
    publicIdentifier: 'HDFC-CURRENT-00991823004561 (IFSC: HDFC0000060)',
    secretKeyVaultRef: 'kms://gcp/projects/fr8x-con/secrets/bank_wire_***',
    webhookUrl: 'https://con.fr8x.in/api/v1/webhooks/bank-reconcile',
    webhookStatus: 'healthy',
    transactionFee: '₹0 (Zero Gateway Fee)',
    settlementTimeline: 'Same-Day Manual KYC Reconciliation',
    allowedModules: {
      registration: true,
      auctions: false,
      jobPosts: false,
      adPosts: true,
      kycVerification: true,
    },
    commercialUtilityNote: 'Direct corporate banking channel for large enterprise annual subscriptions and freight escrow deposits.',
    lastTestedAt: '2026-08-30T10:00:00Z',
  },
];

const SEED_MONTHLY_ACCOUNTING: MonthlyAccountingSummary[] = [
  {
    monthId: '2026-08',
    monthName: 'August 2026',
    year: 2026,
    grossRevenue: 482500,
    subscriptionRevenue: 285000,
    auctionBiddingRevenue: 87000,
    jobPostRevenue: 45500,
    adPostingRevenue: 65000,
    kycVerificationRevenue: 0,
    cgst: 36750,
    sgst: 36750,
    igst: 0,
    totalTax: 73500,
    gatewayDeductions: 9650,
    netSettledRevenue: 399350,
    totalTransactions: 184,
    currency: 'INR',
    status: 'in_progress',
  },
  {
    monthId: '2026-07',
    monthName: 'July 2026',
    year: 2026,
    grossRevenue: 421000,
    subscriptionRevenue: 260000,
    auctionBiddingRevenue: 78000,
    jobPostRevenue: 38000,
    adPostingRevenue: 45000,
    kycVerificationRevenue: 0,
    cgst: 32110,
    sgst: 32110,
    igst: 0,
    totalTax: 64220,
    gatewayDeductions: 8420,
    netSettledRevenue: 348360,
    totalTransactions: 162,
    currency: 'INR',
    status: 'settled',
  },
  {
    monthId: '2026-06',
    monthName: 'June 2026',
    year: 2026,
    grossRevenue: 389000,
    subscriptionRevenue: 245000,
    auctionBiddingRevenue: 69000,
    jobPostRevenue: 32000,
    adPostingRevenue: 43000,
    kycVerificationRevenue: 0,
    cgst: 29670,
    sgst: 29670,
    igst: 0,
    totalTax: 59340,
    gatewayDeductions: 7780,
    netSettledRevenue: 321880,
    totalTransactions: 149,
    currency: 'INR',
    status: 'settled',
  },
  {
    monthId: '2026-05',
    monthName: 'May 2026',
    year: 2026,
    grossRevenue: 342000,
    subscriptionRevenue: 220000,
    auctionBiddingRevenue: 62000,
    jobPostRevenue: 28000,
    adPostingRevenue: 32000,
    kycVerificationRevenue: 0,
    cgst: 26085,
    sgst: 26085,
    igst: 0,
    totalTax: 52170,
    gatewayDeductions: 6840,
    netSettledRevenue: 282990,
    totalTransactions: 131,
    currency: 'INR',
    status: 'settled',
  },
];

const SEED_MASTER_LOCATIONS: MasterLocation[] = [
  {
    id: 'loc-INNSA',
    unLocode: 'INNSA',
    name: 'Nhava Sheva (JNPT)',
    country: 'India',
    countryCode: 'IN',
    region: 'Maharashtra / West Coast',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['NSICT', 'NSIGT', 'BMCT', 'APMT Mumbai', 'JNPCT'],
    coordinates: { lat: 18.9499, lng: 72.9515 },
    customsZoneCode: 'INNSA1',
    status: 'active',
    remarks: 'Premier container port handling ~55% of India containerized ocean cargo.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-INMUN',
    unLocode: 'INMUN',
    name: 'Mundra',
    country: 'India',
    countryCode: 'IN',
    region: 'Gujarat / Gulf of Kutch',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['MICT (DP World)', 'AMCT (Adani)', 'CT3 (CMA CGM Terminals)', 'CT4 (MSC JV)'],
    coordinates: { lat: 22.7544, lng: 69.7047 },
    customsZoneCode: 'INMUN1',
    status: 'active',
    remarks: 'Deep draft private port with direct rail connectivity to Northern hinterlands.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-INMAA',
    unLocode: 'INMAA',
    name: 'Chennai',
    country: 'India',
    countryCode: 'IN',
    region: 'Tamil Nadu / East Coast',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['CCTL (DP World)', 'CITPL (PSA Chennai)'],
    coordinates: { lat: 13.0827, lng: 80.2707 },
    customsZoneCode: 'INMAA1',
    status: 'active',
    remarks: 'Key automotive and electronics export gateway for South India.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-INPAV',
    unLocode: 'INPAV',
    name: 'Pipavav',
    country: 'India',
    countryCode: 'IN',
    region: 'Gujarat / Saurashtra',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['APM Terminals Pipavav'],
    coordinates: { lat: 20.9167, lng: 71.5000 },
    customsZoneCode: 'INPAV1',
    status: 'active',
    remarks: 'Direct double-stack rail container corridor gateway.',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'loc-INHAZ',
    unLocode: 'INHAZ',
    name: 'Hazira',
    country: 'India',
    countryCode: 'IN',
    region: 'Gujarat / Surat',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Adani Hazira Port (AHPPL)'],
    coordinates: { lat: 21.1000, lng: 72.6333 },
    customsZoneCode: 'INHAZ1',
    status: 'active',
    remarks: 'Industrial chemicals, textiles and engineering export hub.',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'loc-INTKD',
    unLocode: 'INTKD',
    name: 'Tughlakabad ICD',
    country: 'India',
    countryCode: 'IN',
    region: 'Delhi NCR',
    type: 'Inland Container Depot (ICD)',
    capabilities: { isPOR: true, isPOL: false, isPOD: false, isFPOD: true },
    terminals: ['CONCOR ICD TKD Hub'],
    coordinates: { lat: 28.5089, lng: 77.2831 },
    customsZoneCode: 'INTKD6',
    status: 'active',
    remarks: 'Largest dry port and inland customs bonded terminal in Asia.',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'loc-INCOK',
    unLocode: 'INCOK',
    name: 'Cochin (Vallarpadam)',
    country: 'India',
    countryCode: 'IN',
    region: 'Kerala / South Coast',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['ICTT Vallarpadam (DP World)'],
    coordinates: { lat: 9.9667, lng: 76.2667 },
    customsZoneCode: 'INCOK1',
    status: 'active',
    remarks: 'International container transshipment hub close to major global trunk sea lanes.',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'loc-INCCU',
    unLocode: 'INCCU',
    name: 'Kolkata (SMP Port)',
    country: 'India',
    countryCode: 'IN',
    region: 'West Bengal / East Coast',
    type: 'River Port',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Netaji Subhash Dock (NSD)', 'Khidderpore Docks (KPD)'],
    coordinates: { lat: 22.5447, lng: 88.3194 },
    customsZoneCode: 'INCCU1',
    status: 'active',
    remarks: 'Riverine hub catering to Eastern India and landlocked neighbors Nepal and Bhutan.',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'loc-NLRTM',
    unLocode: 'NLRTM',
    name: 'Rotterdam',
    country: 'Netherlands',
    countryCode: 'NL',
    region: 'South Holland / Rhine-Meuse',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['ECT Delta', 'ECT Euromax', 'APM Terminals Maasvlakte II', 'Rotterdam World Gateway (RWG)'],
    coordinates: { lat: 51.9244, lng: 4.4777 },
    customsZoneCode: 'NL0001',
    status: 'active',
    remarks: 'Largest seaport in Europe with seamless Rhine barge, rail and feeder network.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-BEANR',
    unLocode: 'BEANR',
    name: 'Antwerp-Bruges',
    country: 'Belgium',
    countryCode: 'BE',
    region: 'Flanders / Scheldt',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Antwerp Gateway (Q1700)', 'MPET (Deurganckdock Q1742)', 'Europa Terminal (Q869)'],
    coordinates: { lat: 51.2194, lng: 4.4025 },
    customsZoneCode: 'BE0002',
    status: 'active',
    remarks: 'Premier chemical cluster and European transshipment gateway.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-DEHAM',
    unLocode: 'DEHAM',
    name: 'Hamburg',
    country: 'Germany',
    countryCode: 'DE',
    region: 'Hamburg / Elbe',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['CTA Altenwerder', 'CTB Burchardkai', 'CTT Tollerort', 'Eurogate CT Hamburg'],
    coordinates: { lat: 53.5511, lng: 9.9937 },
    customsZoneCode: 'DE0003',
    status: 'active',
    remarks: 'Major rail port connection hub for Central & Eastern Europe and the Baltic.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-GBFXT',
    unLocode: 'GBFXT',
    name: 'Felixstowe',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'Suffolk / East England',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Trinity Terminal', 'Berths 8 & 9 (Deepwater)'],
    coordinates: { lat: 51.9622, lng: 1.3511 },
    customsZoneCode: 'GB0001',
    status: 'active',
    remarks: 'Handles ~48% of Britain containerized trade with dedicated intermodal rail.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-AEJEA',
    unLocode: 'AEJEA',
    name: 'Jebel Ali',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    region: 'Dubai / Persian Gulf',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['DP World Jebel Ali T1', 'Terminal 2', 'Terminal 3', 'Terminal 4 (Automated)'],
    coordinates: { lat: 24.9857, lng: 55.0273 },
    customsZoneCode: 'AE0001',
    status: 'active',
    remarks: 'Flagship mega-hub of the Middle East connecting South Asia, Africa and Europe.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-OMSLL',
    unLocode: 'OMSLL',
    name: 'Salalah',
    country: 'Oman',
    countryCode: 'OM',
    region: 'Dhofar / Arabian Sea',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['APM Terminals Salalah Port'],
    coordinates: { lat: 16.9458, lng: 54.0044 },
    customsZoneCode: 'OM0001',
    status: 'active',
    remarks: 'Strategic Red Sea bypassing hub with zero route detour for Asia-Europe lines.',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'loc-SGSIN',
    unLocode: 'SGSIN',
    name: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    region: 'Singapore Straits',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['PSA Tanjong Pagar', 'Keppel', 'Brani', 'Pasir Panjang', 'Tuas Port (Phase 1/2)'],
    coordinates: { lat: 1.29027, lng: 103.851959 },
    customsZoneCode: 'SG0001',
    status: 'active',
    remarks: 'World top container transshipment hub connecting over 600 global ports.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-MYPKG',
    unLocode: 'MYPKG',
    name: 'Port Klang',
    country: 'Malaysia',
    countryCode: 'MY',
    region: 'Selangor / Malacca Straits',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Westports Malaysia', 'Northport (Klang)'],
    coordinates: { lat: 2.9999, lng: 101.3928 },
    customsZoneCode: 'MY0001',
    status: 'active',
    remarks: 'Major ASEAN transshipment and national trade gateway.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-CNSHA',
    unLocode: 'CNSHA',
    name: 'Shanghai (Yangshan & Waigaoqiao)',
    country: 'China',
    countryCode: 'CN',
    region: 'East China / Yangtze River Delta',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Yangshan Deepwater Phase I-IV', 'Waigaoqiao Phase 1-6', 'Pudong Container'],
    coordinates: { lat: 31.2304, lng: 121.4737 },
    customsZoneCode: 'CN0001',
    status: 'active',
    remarks: 'World busiest container port handling over 49M TEUs annually.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-CNNGB',
    unLocode: 'CNNGB',
    name: 'Ningbo-Zhoushan',
    country: 'China',
    countryCode: 'CN',
    region: 'Zhejiang Province',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Beilun Container Terminal', 'Chuanshan Port Area', 'Meishan Island Terminal'],
    coordinates: { lat: 29.8683, lng: 121.5440 },
    customsZoneCode: 'CN0002',
    status: 'active',
    remarks: 'Super-hub for heavy manufacturing and Yangtze economic belt.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-USLAX',
    unLocode: 'USLAX',
    name: 'Los Angeles',
    country: 'United States',
    countryCode: 'US',
    region: 'California / San Pedro Bay',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Pier 400 (APMT)', 'Fenix Marine Services (Pier 300)', 'Trapac (Berths 136-147)', 'WBCT'],
    coordinates: { lat: 33.7432, lng: -118.2673 },
    customsZoneCode: 'US2704',
    status: 'active',
    remarks: 'Leading seaport in North America for container volume and Transpacific commerce.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
  {
    id: 'loc-USNYC',
    unLocode: 'USNYC',
    name: 'New York / New Jersey',
    country: 'United States',
    countryCode: 'US',
    region: 'New York / East Coast',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Maher Terminals', 'Port Newark Container Terminal (PNCT)', 'APM Terminals Port Elizabeth'],
    coordinates: { lat: 40.7128, lng: -74.0060 },
    customsZoneCode: 'US1001',
    status: 'active',
    remarks: 'Largest East Coast maritime gateway serving the major US consuming centers.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
];

const SEED_MASTER_CARRIERS: MasterCarrier[] = [
  {
    id: 'car-MAEU',
    name: 'A.P. Moller - Maersk',
    scacCode: 'MAEU',
    carrierCode: 'MSK',
    type: 'MLO',
    alliance: 'Gemini Cooperation',
    country: 'Denmark',
    fleetTEU: '4,250,000 TEU',
    bookingEmail: 'bookings.apac@maersk.com',
    trackingApiEndpoint: 'https://api.maersk.com/track-and-trace/v2',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Integrated logistics integrator with extensive inland haulage and terminal ownership.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'car-MSCU',
    name: 'Mediterranean Shipping Company (MSC)',
    scacCode: 'MSCU',
    carrierCode: 'MSC',
    type: 'MLO',
    alliance: 'Independent',
    country: 'Switzerland',
    fleetTEU: '5,850,000 TEU',
    bookingEmail: 'ocean.desk@msc.com',
    trackingApiEndpoint: 'https://api.msc.com/v1/tracking',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR', 'ISO Tank'],
    status: 'active',
    remarks: 'World largest container ocean carrier with direct services across all major corridors.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'car-CMDU',
    name: 'CMA CGM Group',
    scacCode: 'CMDU',
    carrierCode: 'CMA',
    type: 'MLO',
    alliance: 'Ocean Alliance',
    country: 'France',
    fleetTEU: '3,720,000 TEU',
    bookingEmail: 'bookings@cma-cgm.com',
    trackingApiEndpoint: 'https://api.cma-cgm.com/shipment/v3',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR', 'ISO Tank'],
    status: 'active',
    remarks: 'Strong presence on Asia-Europe, Transpacific, and Latin American lanes with LNG vessel leadership.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'car-HLCU',
    name: 'Hapag-Lloyd AG',
    scacCode: 'HLCU',
    carrierCode: 'HAP',
    type: 'MLO',
    alliance: 'Gemini Cooperation',
    country: 'Germany',
    fleetTEU: '2,150,000 TEU',
    bookingEmail: 'orders.india@hapag-lloyd.com',
    trackingApiEndpoint: 'https://api.hlag.com/tracking/v1',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Known for high schedule reliability, Reefer Plus fleet, and North European services.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'car-ONEY',
    name: 'Ocean Network Express (ONE)',
    scacCode: 'ONEY',
    carrierCode: 'ONE',
    type: 'MLO',
    alliance: 'THE Alliance / Premier',
    country: 'Singapore / Japan',
    fleetTEU: '1,920,000 TEU',
    bookingEmail: 'customer.care@one-line.com',
    trackingApiEndpoint: 'https://api.one-line.com/tracking/v2',
    supportedEquipment: ['20DV', '40DV', '40HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Joint venture of NYK, MOL, and K-Line with magenta fleet and strong Far East connectivity.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'car-COSU',
    name: 'COSCO Shipping Lines',
    scacCode: 'COSU',
    carrierCode: 'COS',
    type: 'MLO',
    alliance: 'Ocean Alliance',
    country: 'China',
    fleetTEU: '3,100,000 TEU',
    bookingEmail: 'booking.service@coscon.com',
    trackingApiEndpoint: 'https://api.coscoshipping.com/track/v1',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'State-owned shipping giant with dominant market share on Asia-Indian Subcontinent routes.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'car-EGLV',
    name: 'Evergreen Marine Corp',
    scacCode: 'EGLV',
    carrierCode: 'EVG',
    type: 'MLO',
    alliance: 'Ocean Alliance',
    country: 'Taiwan',
    fleetTEU: '1,710,000 TEU',
    bookingEmail: 'cs.inbound@evergreen-marine.com',
    trackingApiEndpoint: 'https://api.evergreen-marine.com/v1/trace',
    supportedEquipment: ['20DV', '40DV', '40HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Pioneer of round-the-world services and high capacity ultra large container vessels.',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z',
  },
  {
    id: 'car-UNIF',
    name: 'Unifeeder Group (DP World)',
    scacCode: 'UNIF',
    carrierCode: 'UNF',
    type: 'Feeder Operator',
    alliance: 'Regional Feeder',
    country: 'Denmark / UAE',
    fleetTEU: '165,000 TEU',
    bookingEmail: 'feeder.charter@unifeeder.com',
    supportedEquipment: ['20DV', '40DV', '40HC', '20RF', '40HR'],
    status: 'active',
    remarks: 'Largest feeder and shortsea network across Europe, Middle East and Indian Subcontinent.',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'car-BANQ',
    name: 'Kuehne + Nagel (Blue Anchor Line)',
    scacCode: 'BANQ',
    carrierCode: 'KN',
    type: 'NVOCC',
    alliance: 'Global Forwarder',
    country: 'Switzerland',
    fleetTEU: '4,300,000 TEU (Managed)',
    bookingEmail: 'seafreight.global@kuehne-nagel.com',
    trackingApiEndpoint: 'https://api.kuehne-nagel.com/sea/track/v1',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR', 'ISO Tank'],
    status: 'active',
    remarks: 'World #1 global ocean freight forwarder operating tier-1 NVOCC services.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'car-DMLI',
    name: 'DHL Global Forwarding (Danmar Lines)',
    scacCode: 'DMLI',
    carrierCode: 'DHL',
    type: 'NVOCC',
    alliance: 'Global Forwarder',
    country: 'Germany',
    fleetTEU: '3,200,000 TEU (Managed)',
    bookingEmail: 'oceanfreight.inquiry@dhl.com',
    trackingApiEndpoint: 'https://api.dhl.com/dgf/tracking/v1',
    supportedEquipment: ['20DV', '40DV', '40HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Global NVOCC carrier backed by DHL multi-modal air and ocean network.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  },
];

const SEED_MASTER_EQUIPMENT: MasterEquipment[] = [
  {
    id: 'eq-20DV',
    isoCode: '20DV',
    isoGroup: '22G1',
    name: "20' Standard Dry (20DV)",
    category: 'Dry Standard',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 2280,
    maxPayloadKg: 28200,
    volumeCbm: 33.2,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Standard general purpose ISO dry box for dense and heavy weight cargo.',
  },
  {
    id: 'eq-40DV',
    isoCode: '40DV',
    isoGroup: '42G1',
    name: "40' Standard Dry (40DV)",
    category: 'Dry Standard',
    lengthFt: 40,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 3780,
    maxPayloadKg: 26700,
    volumeCbm: 67.7,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'General cargo ISO box for volumetric dry items.',
  },
  {
    id: 'eq-40HC',
    isoCode: '40HC',
    isoGroup: '45G1',
    name: "40' High Cube (40HC)",
    category: 'High Cube',
    lengthFt: 40,
    heightFt: 9.5,
    maxGrossKg: 32500,
    tareWeightKg: 3900,
    maxPayloadKg: 28600,
    volumeCbm: 76.4,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Most widely demanded container type with 1 foot extra vertical clearance.',
  },
  {
    id: 'eq-45HC',
    isoCode: '45HC',
    isoGroup: '45U1',
    name: "45' High Cube (45HC)",
    category: 'High Cube',
    lengthFt: 45,
    heightFt: 9.5,
    maxGrossKg: 32500,
    tareWeightKg: 4700,
    maxPayloadKg: 27800,
    volumeCbm: 86.0,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'High cube container optimized for light bulky items on intra-Europe & Transpacific.',
  },
  {
    id: 'eq-20RF',
    isoCode: '20RF',
    isoGroup: '22R1',
    name: "20' Refrigerated Container (20RF)",
    category: 'Reefer',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 3080,
    maxPayloadKg: 27400,
    volumeCbm: 28.3,
    isHazardousAllowed: false,
    isReefer: true,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Built-in refrigeration unit maintaining temperatures from -30°C to +30°C.',
  },
  {
    id: 'eq-40HR',
    isoCode: '40HR',
    isoGroup: '45R1',
    name: "40' Reefer High Cube (40HR)",
    category: 'Reefer',
    lengthFt: 40,
    heightFt: 9.5,
    maxGrossKg: 34000,
    tareWeightKg: 4500,
    maxPayloadKg: 29500,
    volumeCbm: 67.8,
    isHazardousAllowed: false,
    isReefer: true,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Primary reefer equipment for perishable agricultural and pharmaceutical exports.',
  },
  {
    id: 'eq-20OT',
    isoCode: '20OT',
    isoGroup: '22U1',
    name: "20' Open Top (20OT)",
    category: 'Open Top',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 2350,
    maxPayloadKg: 28130,
    volumeCbm: 32.5,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: true,
    status: 'active',
    remarks: 'Removable roof bow and tarpaulin for top-loading of heavy machinery.',
  },
  {
    id: 'eq-40OT',
    isoCode: '40OT',
    isoGroup: '42U1',
    name: "40' Open Top (40OT)",
    category: 'Open Top',
    lengthFt: 40,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 3850,
    maxPayloadKg: 26630,
    volumeCbm: 66.5,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: true,
    status: 'active',
    remarks: 'Open top container for tall project cargo.',
  },
  {
    id: 'eq-20FR',
    isoCode: '20FR',
    isoGroup: '22P1',
    name: "20' Flat Rack (20FR)",
    category: 'Flat Rack',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 31000,
    tareWeightKg: 2750,
    maxPayloadKg: 28250,
    volumeCbm: 27.9,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: true,
    status: 'active',
    remarks: 'End-wall flat rack container for out-of-gauge (OOG) and breakbulk cargo.',
  },
  {
    id: 'eq-40FR',
    isoCode: '40FR',
    isoGroup: '42P1',
    name: "40' Flat Rack (40FR)",
    category: 'Flat Rack',
    lengthFt: 40,
    heightFt: 8.5,
    maxGrossKg: 45000,
    tareWeightKg: 5300,
    maxPayloadKg: 39700,
    volumeCbm: 54.8,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: true,
    status: 'active',
    remarks: 'Heavy capacity flat rack for oversized industrial plant equipment.',
  },
  {
    id: 'eq-ISOTank',
    isoCode: 'ISO Tank',
    isoGroup: '22T1',
    name: "20' ISO Tank Container",
    category: 'ISO Tank',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 36000,
    tareWeightKg: 3800,
    maxPayloadKg: 32200,
    volumeCbm: 26.0,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Cylindrical pressure vessel for hazardous and non-hazardous bulk liquid cargo.',
  },
];

const SEED_MASTER_COMMODITIES: MasterCommodity[] = [
  {
    id: 'cmd-870829',
    hsCode: '8708.29',
    chapter: '87',
    heading: '8708',
    name: 'Automotive Components, Body Parts & Accessories',
    isHazardous: false,
    status: 'active',
  },
  {
    id: 'cmd-847989',
    hsCode: '8479.89',
    chapter: '84',
    heading: '8479',
    name: 'Industrial Machinery & Mechanical Processing Appliances',
    isHazardous: false,
    status: 'active',
  },
  {
    id: 'cmd-854140',
    hsCode: '8541.40',
    chapter: '85',
    heading: '8541',
    name: 'Solar PV Modules, Photovoltaic Cells & Inverters',
    isHazardous: false,
    storageReqs: 'Keep dry, do not double-stack pallets beyond 2 levels',
    status: 'active',
  },
  {
    id: 'cmd-381400',
    hsCode: '3814.00',
    chapter: '38',
    heading: '3814',
    name: 'Organic Composite Solvents & Chemical Thinners',
    isHazardous: true,
    imoClass: 'Class 3 (Flammable Liquid)',
    unNumber: 'UN1263',
    storageReqs: 'Away from heat sources, certified UN drums only',
    status: 'active',
  },
  {
    id: 'cmd-520811',
    hsCode: '5208.11',
    chapter: '52',
    heading: '5208',
    name: 'Woven Organic Cotton Fabrics & Garments',
    isHazardous: false,
    status: 'active',
  },
  {
    id: 'cmd-847130',
    hsCode: '8471.30',
    chapter: '84',
    heading: '8471',
    name: 'Portable Automatic Data Processing Machines / Laptops',
    isHazardous: true,
    imoClass: 'Class 9 (Miscellaneous Dangerous Goods - Lithium Battery)',
    unNumber: 'UN3481',
    storageReqs: 'IMO Section II packed with equipment compliance',
    status: 'active',
  },
  {
    id: 'cmd-290511',
    hsCode: '2905.11',
    chapter: '29',
    heading: '2905',
    name: 'Methanol (Methyl Alcohol) Technical Grade',
    isHazardous: true,
    imoClass: 'Class 3 + 6.1 (Flammable Toxic Liquid)',
    unNumber: 'UN1230',
    storageReqs: 'Dedicated ISO tank with vapor recovery system',
    status: 'active',
  },
  {
    id: 'cmd-090111',
    hsCode: '0901.11',
    chapter: '09',
    heading: '0901',
    name: 'Coffee Beans, Not Roasted, Not Decaffeinated',
    isHazardous: false,
    storageReqs: 'Food grade clean container, desiccants mandatory',
    status: 'active',
  },
];

const SEED_MASTER_INCOTERMS: MasterIncoterm[] = [
  {
    id: 'inc-FOB',
    code: 'FOB',
    name: 'Free on Board',
    category: 'Sea & Inland Waterway',
    riskTransferPoint: 'When goods are loaded on board the vessel at port of origin',
    costFreight: 'Buyer',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-CIF',
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    category: 'Sea & Inland Waterway',
    riskTransferPoint: 'When goods are on board vessel (cost paid by seller till destination port)',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-CFR',
    code: 'CFR',
    name: 'Cost and Freight',
    category: 'Sea & Inland Waterway',
    riskTransferPoint: 'When goods are on board vessel (seller pays ocean freight to destination port)',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-EXW',
    code: 'EXW',
    name: 'Ex Works',
    category: 'Any Transport Mode',
    riskTransferPoint: 'At seller factory / warehouse before loading',
    costFreight: 'Buyer',
    costOriginTHC: 'Buyer',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Buyer',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-FCA',
    code: 'FCA',
    name: 'Free Carrier',
    category: 'Any Transport Mode',
    riskTransferPoint: 'When delivered to named carrier at agreed origin location',
    costFreight: 'Buyer',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-CPT',
    code: 'CPT',
    name: 'Carriage Paid To',
    category: 'Any Transport Mode',
    riskTransferPoint: 'When handed to first carrier (carriage paid by seller to destination)',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-CIP',
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    category: 'Any Transport Mode',
    riskTransferPoint: 'When handed to first carrier (seller pays carriage and Institute Cargo Clause A insurance)',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-DAP',
    code: 'DAP',
    name: 'Delivered at Place',
    category: 'Any Transport Mode',
    riskTransferPoint: 'At named place of destination ready for unloading',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Seller',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-DPU',
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    category: 'Any Transport Mode',
    riskTransferPoint: 'At named place of destination unloaded from arriving conveyance',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Seller',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-DDP',
    code: 'DDP',
    name: 'Delivered Duty Paid',
    category: 'Any Transport Mode',
    riskTransferPoint: 'At destination with import customs clearance completed and duties paid by seller',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Seller',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Seller',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-FAS',
    code: 'FAS',
    name: 'Free Alongside Ship',
    category: 'Sea & Inland Waterway',
    riskTransferPoint: 'Alongside the ship at named port of loading',
    costFreight: 'Buyer',
    costOriginTHC: 'Buyer',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
];

const SEED_MASTER_TAX_CODES: MasterTaxSAC[] = [
  {
    id: 'sac-998431',
    sacCode: '998431',
    description: 'Transportation of goods by inland waterways and coastal shipping',
    standardGSTRate: 5,
    rcmApplicable: true,
    category: 'Maritime Freight Transport',
    status: 'active',
  },
  {
    id: 'sac-998439',
    sacCode: '998439',
    description: 'Other maritime and international sea freight transport services',
    standardGSTRate: 5,
    rcmApplicable: false,
    category: 'International Ocean Transport',
    status: 'active',
  },
  {
    id: 'sac-998540',
    sacCode: '998540',
    description: 'Packaging, cargo handling, container stuffing and destuffing services',
    standardGSTRate: 18,
    rcmApplicable: false,
    category: 'Terminal Handling (THC)',
    status: 'active',
  },
  {
    id: 'sac-998511',
    sacCode: '998511',
    description: 'Customs brokerage, clearance and freight forwarding agency fees',
    standardGSTRate: 18,
    rcmApplicable: false,
    category: 'Customs Brokerage',
    status: 'active',
  },
  {
    id: 'sac-998412',
    sacCode: '998412',
    description: 'Container haulage and multimodal transportation by rail',
    standardGSTRate: 5,
    rcmApplicable: true,
    category: 'Inland Rail Haulage',
    status: 'active',
  },
  {
    id: 'sac-998421',
    sacCode: '998421',
    description: 'Freight transportation by road in specialized container trailers',
    standardGSTRate: 5,
    rcmApplicable: true,
    category: 'Port Drayage & Road Haulage',
    status: 'active',
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
  emailLogs: EmailLog[];
  mailboxes: MailboxStatus[];
  sensitiveWords: SensitiveWordRule[];
  termsAgreements: TermsAgreement[];
  complianceRecords: ComplianceRecord[];
  paymentGateways: PaymentGatewayConfig[];
  monthlyAccounting: MonthlyAccountingSummary[];
  
  // Master Data State Lists
  masterLocations: MasterLocation[];
  masterCarriers: MasterCarrier[];
  masterEquipment: MasterEquipment[];
  masterCommodities: MasterCommodity[];
  masterIncoterms: MasterIncoterm[];
  masterTaxCodes: MasterTaxSAC[];
  
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

  // Email Actions
  sendTestEmail: (recipient: string, templateId: string, reason: string) => Promise<{ success: boolean; correlationId: string }>;
  checkEmailHealth: () => Promise<any>;

  // User Actions
  toggleUserVerification: (uid: string, isVerified: boolean, reason: string) => Promise<boolean>;
  toggleUserGoldTick: (uid: string, hasGoldenTick: boolean, reason: string) => Promise<boolean>;
  updateUserProfileAudited: (uid: string, changes: Partial<UserProfile>, reason: string) => Promise<boolean>;
  blockUserScoped: (params: { uid: string; name: string; email: string; scopes: BlockScope[]; reasonCode: BlockAction['reasonCode']; reasonText: string; expiresAt?: string }) => Promise<boolean>;
  unblockUser: (blockId: string, reason: string) => Promise<boolean>;
  forceUserLogout: (uid: string, reason: string) => Promise<boolean>;
  grantFreeTrial: (uid: string, days: number, reason: string) => Promise<boolean>;

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
  addSensitiveWordRule: (rule: Partial<SensitiveWordRule>, reason: string) => Promise<boolean>;
  deleteSensitiveWordRule: (id: string, reason: string) => Promise<boolean>;
  toggleSensitiveWordRule: (id: string, reason: string) => Promise<boolean>;
  updateComplianceStatus: (id: string, status: ComplianceRecord['status'], reason: string) => Promise<boolean>;

  // Commerce & Pricing
  createPlanVersion: (newPlan: Partial<PlanVersion>, reason: string) => Promise<boolean>;
  requestPaymentConfigChange: (configId: string, changeDetails: string, reason: string) => Promise<boolean>;
  processRefundOrCredit: (invoiceId: string, amount: number, type: 'refund' | 'credit', reason: string) => Promise<boolean>;
  togglePaymentGateway: (gatewayId: string, enabled: boolean, reason: string) => Promise<boolean>;
  updatePaymentGateway: (gatewayId: string, updates: Partial<PaymentGatewayConfig>, reason: string) => Promise<boolean>;
  bankDetails: PlatformBankDetails;
  upiDetails: PlatformUpiDetails;
  updateBankDetails: (updates: Partial<PlatformBankDetails>, reason: string) => Promise<boolean>;
  updateUpiDetails: (updates: Partial<PlatformUpiDetails>, reason: string) => Promise<boolean>;
  expireUserPlanNow: (uid: string, reason: string) => Promise<boolean>;
  rechargeUserPlan: (uid: string, days: number, reason: string) => Promise<boolean>;

  // Terms & Clickwrap
  updateTermsAgreement: (code: TermsAgreement['code'], updates: Partial<TermsAgreement>, reason: string) => Promise<boolean>;
  toggleTermsEnforcement: (code: TermsAgreement['code'], field: 'enforceAtRegistration' | 'enforceAtAuctionCreate' | 'enforceAtBidSubmit' | 'enforceAtJobPost' | 'enforceAtAdPost', enabled: boolean, reason: string) => Promise<boolean>;

  // Templates
  saveNotificationTemplate: (template: NotificationTemplate, reason: string) => Promise<boolean>;

  // Master Data Actions
  addMasterLocation: (loc: Omit<MasterLocation, 'id' | 'createdAt' | 'updatedAt'>, reason: string) => Promise<boolean>;
  updateMasterLocation: (id: string, updates: Partial<MasterLocation>, reason: string) => Promise<boolean>;
  deleteMasterLocation: (id: string, reason: string) => Promise<boolean>;
  toggleMasterLocationStatus: (id: string, reason: string) => Promise<boolean>;
  bulkImportMasterLocations: (imported: Partial<MasterLocation>[], reason: string) => Promise<{ count: number; errors: string[] }>;
  
  addMasterCarrier: (carrier: Omit<MasterCarrier, 'id' | 'createdAt' | 'updatedAt'>, reason: string) => Promise<boolean>;
  updateMasterCarrier: (id: string, updates: Partial<MasterCarrier>, reason: string) => Promise<boolean>;
  deleteMasterCarrier: (id: string, reason: string) => Promise<boolean>;
  toggleMasterCarrierStatus: (id: string, reason: string) => Promise<boolean>;
  bulkImportMasterCarriers: (imported: Partial<MasterCarrier>[], reason: string) => Promise<{ count: number; errors: string[] }>;

  addMasterEquipment: (eq: Omit<MasterEquipment, 'id'>, reason: string) => Promise<boolean>;
  updateMasterEquipment: (id: string, updates: Partial<MasterEquipment>, reason: string) => Promise<boolean>;
  deleteMasterEquipment: (id: string, reason: string) => Promise<boolean>;

  addMasterCommodity: (com: Omit<MasterCommodity, 'id'>, reason: string) => Promise<boolean>;
  updateMasterCommodity: (id: string, updates: Partial<MasterCommodity>, reason: string) => Promise<boolean>;
  deleteMasterCommodity: (id: string, reason: string) => Promise<boolean>;

  addMasterIncoterm: (inc: Omit<MasterIncoterm, 'id'>, reason: string) => Promise<boolean>;
  updateMasterIncoterm: (id: string, updates: Partial<MasterIncoterm>, reason: string) => Promise<boolean>;
  deleteMasterIncoterm: (id: string, reason: string) => Promise<boolean>;

  addMasterTaxCode: (tax: Omit<MasterTaxSAC, 'id'>, reason: string) => Promise<boolean>;
  updateMasterTaxCode: (id: string, updates: Partial<MasterTaxSAC>, reason: string) => Promise<boolean>;
  deleteMasterTaxCode: (id: string, reason: string) => Promise<boolean>;

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
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(SEED_EMAIL_LOGS);
  const [mailboxes, setMailboxes] = useState<MailboxStatus[]>(SEED_MAILBOXES);
  const [sensitiveWords, setSensitiveWords] = useState<SensitiveWordRule[]>(SEED_SENSITIVE_WORDS);
  const [termsAgreements, setTermsAgreements] = useState<TermsAgreement[]>(SEED_TERMS_AGREEMENTS);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>(SEED_COMPLIANCE_RECORDS);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>(SEED_PAYMENT_GATEWAYS);
  const [bankDetails, setBankDetails] = useState<PlatformBankDetails>(SEED_BANK_DETAILS);
  const [upiDetails, setUpiDetails] = useState<PlatformUpiDetails>(SEED_UPI_DETAILS);
  const [monthlyAccounting, setMonthlyAccounting] = useState<MonthlyAccountingSummary[]>(SEED_MONTHLY_ACCOUNTING);

  // Master Data States
  const [masterLocations, setMasterLocations] = useState<MasterLocation[]>(SEED_MASTER_LOCATIONS);
  const [masterCarriers, setMasterCarriers] = useState<MasterCarrier[]>(SEED_MASTER_CARRIERS);
  const [masterEquipment, setMasterEquipment] = useState<MasterEquipment[]>(SEED_MASTER_EQUIPMENT);
  const [masterCommodities, setMasterCommodities] = useState<MasterCommodity[]>(SEED_MASTER_COMMODITIES);
  const [masterIncoterms, setMasterIncoterms] = useState<MasterIncoterm[]>(SEED_MASTER_INCOTERMS);
  const [masterTaxCodes, setMasterTaxCodes] = useState<MasterTaxSAC[]>(SEED_MASTER_TAX_CODES);

  // Persistence to local storage
  useEffect(() => {
    try {
      const savedAudit = localStorage.getItem('fr8x_gf_audit_logs');
      if (savedAudit) setAuditLogs(JSON.parse(savedAudit));
      const savedLocations = localStorage.getItem('fr8x_gf_master_locations');
      if (savedLocations) setMasterLocations(JSON.parse(savedLocations));
      const savedCarriers = localStorage.getItem('fr8x_gf_master_carriers');
      if (savedCarriers) setMasterCarriers(JSON.parse(savedCarriers));
      const savedBank = localStorage.getItem('fr8x_godfather_bank_details');
      if (savedBank) setBankDetails(JSON.parse(savedBank));
      const savedUpi = localStorage.getItem('fr8x_godfather_upi_details');
      if (savedUpi) setUpiDetails(JSON.parse(savedUpi));
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

  const sendTestEmail = async (recipient: string, templateId: string, reason: string): Promise<{ success: boolean; correlationId: string }> => {
    const logId = `EML-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newLog: EmailLog = {
      logId,
      recipient,
      sender: 'FR8X Platform Security <password@fr8x.in>',
      subject: `[FR8X TEST] Zoho Mail Diagnostic Verification — ${templateId}`,
      templateId,
      templateName: 'Godfather SMTP Diagnostic Test',
      correlationId: `GF-EML-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      status: 'delivered',
      provider: 'Zoho_SMTP',
      sentAt: new Date().toISOString(),
      deliveredAt: new Date(Date.now() + 1500).toISOString(),
      actorUid: operator.uid,
    };

    const actionRes = await executeAction({
      targetType: 'email',
      targetId: logId,
      targetLabel: `${recipient} (${templateId})`,
      actionType: 'ZOHO_SMTP_TEST_EMAIL_SENT',
      reason,
      afterSnapshot: newLog,
      mutationFn: () => {
        setEmailLogs((prev) => [newLog, ...prev]);
        setMailboxes((prev) =>
          prev.map((m) =>
            m.mailbox === 'password@fr8x.in'
              ? { ...m, sentToday: m.sentToday + 1, lastSuccessfulSend: new Date().toISOString() }
              : m
          )
        );
      },
    });

    return { success: true, correlationId: actionRes.correlationId };
  };

  const checkEmailHealth = async () => {
    return {
      connected: true,
      host: 'smtp.zoho.in',
      port: 465,
      secure: true,
      user: 'password@fr8x.in',
      tlsVersion: 'TLS 1.3 / TLS 1.2 Enforced',
      lastChecked: new Date().toISOString(),
      latencyMs: 18,
    };
  };

  const grantFreeTrial = async (uid: string, days: number = 30, reason: string): Promise<boolean> => {
    const user = users.find((u) => u.uid === uid);
    if (!user) return false;
    const before = { ...user };
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const after: UserProfile = {
      ...user,
      plan: 'trial',
      isVerified: true,
      hasGoldenTick: true,
      planExpiresAt: expiryDate,
      isPlanExpired: false,
      rechargeRequired: false,
      promotionalPlanGrantedBy: 'Godfather Super Admin',
      promotionalPlanGrantedAt: new Date().toISOString(),
    };

    await executeAction({
      targetType: 'user',
      targetId: uid,
      targetLabel: `${user.displayName} (${user.company})`,
      actionType: 'MEMBER_FREE_TRIAL_GRANTED',
      reason: reason || `Granted ${days}-Day Promotional Free Access (Valid until ${expiryDate.split('T')[0]})`,
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setUsers((prev) => {
          const next = prev.map((u) => (u.uid === uid ? after : u));
          try {
            localStorage.setItem('fr8x_users_v10', JSON.stringify(next));
          } catch {}
          return next;
        });
      },
    });
    return true;
  };

  const expireUserPlanNow = async (uid: string, reason: string): Promise<boolean> => {
    const user = users.find((u) => u.uid === uid);
    if (!user) return false;
    const before = { ...user };
    const after: UserProfile = {
      ...user,
      planExpiresAt: new Date(Date.now() - 1000).toISOString(),
      isPlanExpired: true,
      rechargeRequired: true,
    };

    await executeAction({
      targetType: 'user',
      targetId: uid,
      targetLabel: `${user.displayName} (${user.company})`,
      actionType: 'MEMBER_PLAN_EXPIRED_ACCESS_BLOCKED',
      reason: reason || 'Validity expired - Access blocked pending recharge',
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setUsers((prev) => {
          const next = prev.map((u) => (u.uid === uid ? after : u));
          try {
            localStorage.setItem('fr8x_users_v10', JSON.stringify(next));
          } catch {}
          return next;
        });
      },
    });
    return true;
  };

  const rechargeUserPlan = async (uid: string, days: number = 30, reason: string): Promise<boolean> => {
    const user = users.find((u) => u.uid === uid);
    if (!user) return false;
    const before = { ...user };
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const after: UserProfile = {
      ...user,
      plan: 'professional',
      planExpiresAt: expiryDate,
      isPlanExpired: false,
      rechargeRequired: false,
    };

    await executeAction({
      targetType: 'user',
      targetId: uid,
      targetLabel: `${user.displayName} (${user.company})`,
      actionType: 'MEMBER_PLAN_RECHARGED_UNLOCKED',
      reason: reason || `Recharged account plan for ${days} days (Valid until ${expiryDate.split('T')[0]})`,
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setUsers((prev) => {
          const next = prev.map((u) => (u.uid === uid ? after : u));
          try {
            localStorage.setItem('fr8x_users_v10', JSON.stringify(next));
          } catch {}
          return next;
        });
      },
    });
    return true;
  };

  const addSensitiveWordRule = async (ruleData: Partial<SensitiveWordRule>, reason: string): Promise<boolean> => {
    const newRule: SensitiveWordRule = {
      id: `sw-${Date.now()}`,
      wordOrPattern: ruleData.wordOrPattern || '',
      category: ruleData.category || 'fraud',
      severity: ruleData.severity || 'quarantine',
      matchType: ruleData.matchType || 'contains',
      active: true,
      hitsCount: 0,
      description: ruleData.description || 'Automated moderation rule',
      createdAt: new Date().toISOString(),
      updatedBy: operator.email,
    };

    await executeAction({
      targetType: 'config',
      targetId: newRule.id,
      targetLabel: `Sensitive Keyword: "${newRule.wordOrPattern}"`,
      actionType: 'SENSITIVE_WORD_RULE_ADDED',
      reason,
      afterSnapshot: newRule,
      mutationFn: () => {
        setSensitiveWords((prev) => [newRule, ...prev]);
      },
    });
    return true;
  };

  const deleteSensitiveWordRule = async (id: string, reason: string): Promise<boolean> => {
    const target = sensitiveWords.find((s) => s.id === id);
    if (!target) return false;
    await executeAction({
      targetType: 'config',
      targetId: id,
      targetLabel: `Sensitive Keyword: "${target.wordOrPattern}"`,
      actionType: 'SENSITIVE_WORD_RULE_DELETED',
      reason,
      beforeSnapshot: target,
      mutationFn: () => {
        setSensitiveWords((prev) => prev.filter((s) => s.id !== id));
      },
    });
    return true;
  };

  const toggleSensitiveWordRule = async (id: string, reason: string): Promise<boolean> => {
    const target = sensitiveWords.find((s) => s.id === id);
    if (!target) return false;
    const after = { ...target, active: !target.active };
    await executeAction({
      targetType: 'config',
      targetId: id,
      targetLabel: `Sensitive Keyword: "${target.wordOrPattern}"`,
      actionType: target.active ? 'SENSITIVE_WORD_RULE_DEACTIVATED' : 'SENSITIVE_WORD_RULE_ACTIVATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setSensitiveWords((prev) => prev.map((s) => (s.id === id ? after : s)));
      },
    });
    return true;
  };

  const updateTermsAgreement = async (code: TermsAgreement['code'], updates: Partial<TermsAgreement>, reason: string): Promise<boolean> => {
    const target = termsAgreements.find((t) => t.code === code);
    if (!target) return false;
    const after = { ...target, ...updates, updatedAt: new Date().toISOString(), updatedBy: operator.email };
    await executeAction({
      targetType: 'config',
      targetId: target.id,
      targetLabel: target.title,
      actionType: 'TERMS_AGREEMENT_UPDATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setTermsAgreements((prev) => prev.map((t) => (t.code === code ? after : t)));
      },
    });
    return true;
  };

  const toggleTermsEnforcement = async (
    code: TermsAgreement['code'],
    field: 'enforceAtRegistration' | 'enforceAtAuctionCreate' | 'enforceAtBidSubmit' | 'enforceAtJobPost' | 'enforceAtAdPost',
    enabled: boolean,
    reason: string
  ): Promise<boolean> => {
    const target = termsAgreements.find((t) => t.code === code);
    if (!target) return false;
    const after = { ...target, [field]: enabled, updatedAt: new Date().toISOString(), updatedBy: operator.email };
    await executeAction({
      targetType: 'config',
      targetId: target.id,
      targetLabel: `${target.title} -> ${field}`,
      actionType: 'CLICKWRAP_ENFORCEMENT_TOGGLED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setTermsAgreements((prev) => prev.map((t) => (t.code === code ? after : t)));
      },
    });
    return true;
  };

  const togglePaymentGateway = async (gatewayId: string, enabled: boolean, reason: string): Promise<boolean> => {
    const target = paymentGateways.find((g) => g.gatewayId === gatewayId);
    if (!target) return false;
    const after = { ...target, enabled };
    await executeAction({
      targetType: 'payment_config',
      targetId: gatewayId,
      targetLabel: target.title,
      actionType: enabled ? 'PAYMENT_GATEWAY_ACTIVATED' : 'PAYMENT_GATEWAY_DEACTIVATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setPaymentGateways((prev) => prev.map((g) => (g.gatewayId === gatewayId ? after : g)));
      },
    });
    return true;
  };

  const updatePaymentGateway = async (gatewayId: string, updates: Partial<PaymentGatewayConfig>, reason: string): Promise<boolean> => {
    const target = paymentGateways.find((g) => g.gatewayId === gatewayId);
    if (!target) return false;
    const after = { ...target, ...updates, lastTestedAt: new Date().toISOString() };
    await executeAction({
      targetType: 'payment_config',
      targetId: gatewayId,
      targetLabel: target.title,
      actionType: 'PAYMENT_GATEWAY_SETTINGS_UPDATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setPaymentGateways((prev) => prev.map((g) => (g.gatewayId === gatewayId ? after : g)));
      },
    });
    return true;
  };

  const updateBankDetails = async (updates: Partial<PlatformBankDetails>, reason: string): Promise<boolean> => {
    const before = { ...bankDetails };
    const after: PlatformBankDetails = {
      ...bankDetails,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: operator.email,
    };

    await executeAction({
      targetType: 'config',
      targetId: 'platform_bank_details',
      targetLabel: `${after.bankName} - ${after.accountHolderName}`,
      actionType: 'BANK_ACCOUNT_DETAILS_UPDATED',
      reason: reason || 'Updated official corporate collection bank account details',
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setBankDetails(after);
        try {
          localStorage.setItem('fr8x_godfather_bank_details', JSON.stringify(after));
        } catch {}
      },
    });
    return true;
  };

  const updateUpiDetails = async (updates: Partial<PlatformUpiDetails>, reason: string): Promise<boolean> => {
    const before = { ...upiDetails };
    const after: PlatformUpiDetails = {
      ...upiDetails,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: operator.email,
    };

    await executeAction({
      targetType: 'config',
      targetId: 'platform_upi_details',
      targetLabel: `${after.vpaId} (${after.payeeName})`,
      actionType: 'UPI_QR_DETAILS_UPDATED',
      reason: reason || 'Updated official platform UPI QR code and collection handle',
      beforeSnapshot: before,
      afterSnapshot: after,
      mutationFn: () => {
        setUpiDetails(after);
        try {
          localStorage.setItem('fr8x_godfather_upi_details', JSON.stringify(after));
        } catch {}
      },
    });
    return true;
  };

  const updateComplianceStatus = async (id: string, status: ComplianceRecord['status'], reason: string): Promise<boolean> => {
    const target = complianceRecords.find((c) => c.id === id);
    if (!target) return false;
    const after = { ...target, status, lastAuditedAt: new Date().toISOString(), auditedBy: operator.email };
    await executeAction({
      targetType: 'case',
      targetId: id,
      targetLabel: `${target.entityName} (${target.type})`,
      actionType: 'COMPLIANCE_STATUS_UPDATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setComplianceRecords((prev) => prev.map((c) => (c.id === id ? after : c)));
      },
    });
    return true;
  };

  // Master Location Actions
  const addMasterLocation = async (loc: Omit<MasterLocation, 'id' | 'createdAt' | 'updatedAt'>, reason: string): Promise<boolean> => {
    const newLoc: MasterLocation = {
      ...loc,
      id: `loc-${loc.unLocode || Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await executeAction({
      targetType: 'master_location',
      targetId: newLoc.id,
      targetLabel: `${newLoc.name} (${newLoc.unLocode})`,
      actionType: 'MASTER_LOCATION_CREATED',
      reason,
      beforeSnapshot: null,
      afterSnapshot: newLoc,
      mutationFn: () => {
        setMasterLocations((prev) => {
          const updated = [newLoc, ...prev];
          try { localStorage.setItem('fr8x_gf_master_locations', JSON.stringify(updated)); } catch {}
          return updated;
        });
      },
    });
    return true;
  };

  const updateMasterLocation = async (id: string, updates: Partial<MasterLocation>, reason: string): Promise<boolean> => {
    const target = masterLocations.find((l) => l.id === id);
    if (!target) return false;
    const after = { ...target, ...updates, updatedAt: new Date().toISOString() };
    await executeAction({
      targetType: 'master_location',
      targetId: id,
      targetLabel: `${target.name} (${target.unLocode})`,
      actionType: 'MASTER_LOCATION_UPDATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setMasterLocations((prev) => {
          const updated = prev.map((l) => (l.id === id ? after : l));
          try { localStorage.setItem('fr8x_gf_master_locations', JSON.stringify(updated)); } catch {}
          return updated;
        });
      },
    });
    return true;
  };

  const deleteMasterLocation = async (id: string, reason: string): Promise<boolean> => {
    const target = masterLocations.find((l) => l.id === id);
    if (!target) return false;
    await executeAction({
      targetType: 'master_location',
      targetId: id,
      targetLabel: `${target.name} (${target.unLocode})`,
      actionType: 'MASTER_LOCATION_DELETED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: null,
      mutationFn: () => {
        setMasterLocations((prev) => {
          const updated = prev.filter((l) => l.id !== id);
          try { localStorage.setItem('fr8x_gf_master_locations', JSON.stringify(updated)); } catch {}
          return updated;
        });
      },
    });
    return true;
  };

  const toggleMasterLocationStatus = async (id: string, reason: string): Promise<boolean> => {
    const target = masterLocations.find((l) => l.id === id);
    if (!target) return false;
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    return updateMasterLocation(id, { status: nextStatus }, reason);
  };

  const bulkImportMasterLocations = async (imported: Partial<MasterLocation>[], reason: string): Promise<{ count: number; errors: string[] }> => {
    const newItems: MasterLocation[] = [];
    const errors: string[] = [];
    imported.forEach((item, idx) => {
      if (!item.name || !item.unLocode) {
        errors.push(`Row ${idx + 1}: Missing location name or UN/LOCODE.`);
        return;
      }
      newItems.push({
        id: `loc-${item.unLocode}-${Date.now()}-${idx}`,
        unLocode: item.unLocode.toUpperCase(),
        name: item.name,
        country: item.country || 'Global',
        countryCode: item.countryCode || 'GL',
        region: item.region || 'International',
        type: item.type || 'Seaport',
        capabilities: item.capabilities || { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
        terminals: item.terminals || ['Main Commercial Terminal'],
        coordinates: item.coordinates || { lat: 0, lng: 0 },
        customsZoneCode: item.customsZoneCode || '',
        status: item.status || 'active',
        remarks: item.remarks || 'Bulk ingested via Master Data Console',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    if (newItems.length > 0) {
      await executeAction({
        targetType: 'master_location',
        targetId: `bulk-loc-${Date.now()}`,
        targetLabel: `Bulk Ingested ${newItems.length} Master Locations`,
        actionType: 'MASTER_LOCATIONS_BULK_IMPORTED',
        reason,
        beforeSnapshot: { existingCount: masterLocations.length },
        afterSnapshot: { addedCount: newItems.length, newTotal: masterLocations.length + newItems.length },
        mutationFn: () => {
          setMasterLocations((prev) => {
            const updated = [...newItems, ...prev];
            try { localStorage.setItem('fr8x_gf_master_locations', JSON.stringify(updated)); } catch {}
            return updated;
          });
        },
      });
    }

    return { count: newItems.length, errors };
  };

  // Master Carrier Actions
  const addMasterCarrier = async (carrier: Omit<MasterCarrier, 'id' | 'createdAt' | 'updatedAt'>, reason: string): Promise<boolean> => {
    const newCarrier: MasterCarrier = {
      ...carrier,
      id: `car-${carrier.scacCode || Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await executeAction({
      targetType: 'master_carrier',
      targetId: newCarrier.id,
      targetLabel: `${newCarrier.name} (${newCarrier.type} · ${newCarrier.scacCode})`,
      actionType: 'MASTER_CARRIER_CREATED',
      reason,
      beforeSnapshot: null,
      afterSnapshot: newCarrier,
      mutationFn: () => {
        setMasterCarriers((prev) => {
          const updated = [newCarrier, ...prev];
          try { localStorage.setItem('fr8x_gf_master_carriers', JSON.stringify(updated)); } catch {}
          return updated;
        });
      },
    });
    return true;
  };

  const updateMasterCarrier = async (id: string, updates: Partial<MasterCarrier>, reason: string): Promise<boolean> => {
    const target = masterCarriers.find((c) => c.id === id);
    if (!target) return false;
    const after = { ...target, ...updates, updatedAt: new Date().toISOString() };
    await executeAction({
      targetType: 'master_carrier',
      targetId: id,
      targetLabel: `${target.name} (${target.scacCode})`,
      actionType: 'MASTER_CARRIER_UPDATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setMasterCarriers((prev) => {
          const updated = prev.map((c) => (c.id === id ? after : c));
          try { localStorage.setItem('fr8x_gf_master_carriers', JSON.stringify(updated)); } catch {}
          return updated;
        });
      },
    });
    return true;
  };

  const deleteMasterCarrier = async (id: string, reason: string): Promise<boolean> => {
    const target = masterCarriers.find((c) => c.id === id);
    if (!target) return false;
    await executeAction({
      targetType: 'master_carrier',
      targetId: id,
      targetLabel: `${target.name} (${target.scacCode})`,
      actionType: 'MASTER_CARRIER_DELETED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: null,
      mutationFn: () => {
        setMasterCarriers((prev) => {
          const updated = prev.filter((c) => c.id !== id);
          try { localStorage.setItem('fr8x_gf_master_carriers', JSON.stringify(updated)); } catch {}
          return updated;
        });
      },
    });
    return true;
  };

  const toggleMasterCarrierStatus = async (id: string, reason: string): Promise<boolean> => {
    const target = masterCarriers.find((c) => c.id === id);
    if (!target) return false;
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    return updateMasterCarrier(id, { status: nextStatus }, reason);
  };

  const bulkImportMasterCarriers = async (imported: Partial<MasterCarrier>[], reason: string): Promise<{ count: number; errors: string[] }> => {
    const newItems: MasterCarrier[] = [];
    const errors: string[] = [];

    imported.forEach((item, idx) => {
      if (!item.name || !item.scacCode) {
        errors.push(`Row ${idx + 1}: Name and SCAC code are required.`);
        return;
      }
      const scac = item.scacCode.toUpperCase().trim();
      const existing = masterCarriers.find((c) => c.scacCode === scac);
      if (existing) {
        errors.push(`Row ${idx + 1}: Carrier SCAC ${scac} already exists.`);
        return;
      }
      newItems.push({
        id: `car-${scac}`,
        name: item.name.trim(),
        scacCode: scac,
        carrierCode: (item.carrierCode || scac.slice(0, 3)).toUpperCase().trim(),
        type: item.type || 'MLO',
        alliance: item.alliance || 'Independent',
        country: item.country || 'Global',
        fleetTEU: item.fleetTEU || '',
        bookingEmail: item.bookingEmail || `bookings@${scac.toLowerCase()}.com`,
        trackingApiEndpoint: item.trackingApiEndpoint || '',
        supportedEquipment: item.supportedEquipment || ['20DV', '40DV', '40HC', '20RF', '40HR'],
        status: item.status || 'active',
        remarks: item.remarks || 'Bulk imported carrier profile',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    if (newItems.length > 0) {
      await executeAction({
        targetType: 'master_carrier',
        targetId: `bulk-car-${Date.now()}`,
        targetLabel: `Bulk Ingested ${newItems.length} Master Carriers`,
        actionType: 'MASTER_CARRIERS_BULK_IMPORTED',
        reason,
        beforeSnapshot: { existingCount: masterCarriers.length },
        afterSnapshot: { addedCount: newItems.length, newTotal: masterCarriers.length + newItems.length },
        mutationFn: () => {
          setMasterCarriers((prev) => {
            const updated = [...newItems, ...prev];
            try { localStorage.setItem('fr8x_gf_master_carriers', JSON.stringify(updated)); } catch {}
            return updated;
          });
        },
      });
    }

    return { count: newItems.length, errors };
  };

  // Master Equipment Actions
  const addMasterEquipment = async (eq: Omit<MasterEquipment, 'id'>, reason: string): Promise<boolean> => {
    const newEq: MasterEquipment = { ...eq, id: `eq-${eq.isoCode}` };
    await executeAction({
      targetType: 'master_equipment',
      targetId: newEq.id,
      targetLabel: `${newEq.name} (${newEq.isoCode})`,
      actionType: 'MASTER_EQUIPMENT_CREATED',
      reason,
      beforeSnapshot: null,
      afterSnapshot: newEq,
      mutationFn: () => {
        setMasterEquipment((prev) => [newEq, ...prev]);
      },
    });
    return true;
  };

  const updateMasterEquipment = async (id: string, updates: Partial<MasterEquipment>, reason: string): Promise<boolean> => {
    const target = masterEquipment.find((e) => e.id === id);
    if (!target) return false;
    const after = { ...target, ...updates };
    await executeAction({
      targetType: 'master_equipment',
      targetId: id,
      targetLabel: `${target.name} (${target.isoCode})`,
      actionType: 'MASTER_EQUIPMENT_UPDATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setMasterEquipment((prev) => prev.map((e) => (e.id === id ? after : e)));
      },
    });
    return true;
  };

  const deleteMasterEquipment = async (id: string, reason: string): Promise<boolean> => {
    const target = masterEquipment.find((e) => e.id === id);
    if (!target) return false;
    await executeAction({
      targetType: 'master_equipment',
      targetId: id,
      targetLabel: `${target.name} (${target.isoCode})`,
      actionType: 'MASTER_EQUIPMENT_DELETED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: null,
      mutationFn: () => {
        setMasterEquipment((prev) => prev.filter((e) => e.id !== id));
      },
    });
    return true;
  };

  // Master Commodity Actions
  const addMasterCommodity = async (com: Omit<MasterCommodity, 'id'>, reason: string): Promise<boolean> => {
    const newCom: MasterCommodity = { ...com, id: `cmd-${com.hsCode.replace(/\./g, '')}` };
    await executeAction({
      targetType: 'master_commodity',
      targetId: newCom.id,
      targetLabel: `${newCom.name} (HS ${newCom.hsCode})`,
      actionType: 'MASTER_COMMODITY_CREATED',
      reason,
      beforeSnapshot: null,
      afterSnapshot: newCom,
      mutationFn: () => {
        setMasterCommodities((prev) => [newCom, ...prev]);
      },
    });
    return true;
  };

  const updateMasterCommodity = async (id: string, updates: Partial<MasterCommodity>, reason: string): Promise<boolean> => {
    const target = masterCommodities.find((c) => c.id === id);
    if (!target) return false;
    const after = { ...target, ...updates };
    await executeAction({
      targetType: 'master_commodity',
      targetId: id,
      targetLabel: `${target.name} (HS ${target.hsCode})`,
      actionType: 'MASTER_COMMODITY_UPDATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setMasterCommodities((prev) => prev.map((c) => (c.id === id ? after : c)));
      },
    });
    return true;
  };

  const deleteMasterCommodity = async (id: string, reason: string): Promise<boolean> => {
    const target = masterCommodities.find((c) => c.id === id);
    if (!target) return false;
    await executeAction({
      targetType: 'master_commodity',
      targetId: id,
      targetLabel: `${target.name} (HS ${target.hsCode})`,
      actionType: 'MASTER_COMMODITY_DELETED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: null,
      mutationFn: () => {
        setMasterCommodities((prev) => prev.filter((c) => c.id !== id));
      },
    });
    return true;
  };

  // Master Incoterm Actions
  const addMasterIncoterm = async (inc: Omit<MasterIncoterm, 'id'>, reason: string): Promise<boolean> => {
    const newInc: MasterIncoterm = { ...inc, id: `inc-${inc.code}` };
    await executeAction({
      targetType: 'master_incoterm',
      targetId: newInc.id,
      targetLabel: `${newInc.code} - ${newInc.name}`,
      actionType: 'MASTER_INCOTERM_CREATED',
      reason,
      beforeSnapshot: null,
      afterSnapshot: newInc,
      mutationFn: () => {
        setMasterIncoterms((prev) => [newInc, ...prev]);
      },
    });
    return true;
  };

  const updateMasterIncoterm = async (id: string, updates: Partial<MasterIncoterm>, reason: string): Promise<boolean> => {
    const target = masterIncoterms.find((i) => i.id === id);
    if (!target) return false;
    const after = { ...target, ...updates };
    await executeAction({
      targetType: 'master_incoterm',
      targetId: id,
      targetLabel: `${target.code} - ${target.name}`,
      actionType: 'MASTER_INCOTERM_UPDATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setMasterIncoterms((prev) => prev.map((i) => (i.id === id ? after : i)));
      },
    });
    return true;
  };

  const deleteMasterIncoterm = async (id: string, reason: string): Promise<boolean> => {
    const target = masterIncoterms.find((i) => i.id === id);
    if (!target) return false;
    await executeAction({
      targetType: 'master_incoterm',
      targetId: id,
      targetLabel: `${target.code} - ${target.name}`,
      actionType: 'MASTER_INCOTERM_DELETED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: null,
      mutationFn: () => {
        setMasterIncoterms((prev) => prev.filter((i) => i.id !== id));
      },
    });
    return true;
  };

  // Master Tax Code Actions
  const addMasterTaxCode = async (tax: Omit<MasterTaxSAC, 'id'>, reason: string): Promise<boolean> => {
    const newTax: MasterTaxSAC = { ...tax, id: `sac-${tax.sacCode}` };
    await executeAction({
      targetType: 'master_tax',
      targetId: newTax.id,
      targetLabel: `SAC ${newTax.sacCode} (${newTax.description})`,
      actionType: 'MASTER_TAX_CODE_CREATED',
      reason,
      beforeSnapshot: null,
      afterSnapshot: newTax,
      mutationFn: () => {
        setMasterTaxCodes((prev) => [newTax, ...prev]);
      },
    });
    return true;
  };

  const updateMasterTaxCode = async (id: string, updates: Partial<MasterTaxSAC>, reason: string): Promise<boolean> => {
    const target = masterTaxCodes.find((t) => t.id === id);
    if (!target) return false;
    const after = { ...target, ...updates };
    await executeAction({
      targetType: 'master_tax',
      targetId: id,
      targetLabel: `SAC ${target.sacCode}`,
      actionType: 'MASTER_TAX_CODE_UPDATED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: after,
      mutationFn: () => {
        setMasterTaxCodes((prev) => prev.map((t) => (t.id === id ? after : t)));
      },
    });
    return true;
  };

  const deleteMasterTaxCode = async (id: string, reason: string): Promise<boolean> => {
    const target = masterTaxCodes.find((t) => t.id === id);
    if (!target) return false;
    await executeAction({
      targetType: 'master_tax',
      targetId: id,
      targetLabel: `SAC ${target.sacCode}`,
      actionType: 'MASTER_TAX_CODE_DELETED',
      reason,
      beforeSnapshot: target,
      afterSnapshot: null,
      mutationFn: () => {
        setMasterTaxCodes((prev) => prev.filter((t) => t.id !== id));
      },
    });
    return true;
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
        emailLogs,
        mailboxes,
        sensitiveWords,
        termsAgreements,
        complianceRecords,
        paymentGateways,
        monthlyAccounting,
        masterLocations,
        masterCarriers,
        masterEquipment,
        masterCommodities,
        masterIncoterms,
        masterTaxCodes,
        addMasterLocation,
        updateMasterLocation,
        deleteMasterLocation,
        toggleMasterLocationStatus,
        bulkImportMasterLocations,
        addMasterCarrier,
        updateMasterCarrier,
        deleteMasterCarrier,
        toggleMasterCarrierStatus,
        bulkImportMasterCarriers,
        addMasterEquipment,
        updateMasterEquipment,
        deleteMasterEquipment,
        addMasterCommodity,
        updateMasterCommodity,
        deleteMasterCommodity,
        addMasterIncoterm,
        updateMasterIncoterm,
        deleteMasterIncoterm,
        addMasterTaxCode,
        updateMasterTaxCode,
        deleteMasterTaxCode,
        executeAction,
        sendTestEmail,
        checkEmailHealth,
        toggleUserVerification,
        toggleUserGoldTick,
        updateUserProfileAudited,
        blockUserScoped,
        unblockUser,
        forceUserLogout,
        grantFreeTrial,
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
        addSensitiveWordRule,
        deleteSensitiveWordRule,
        toggleSensitiveWordRule,
        updateComplianceStatus,
        createPlanVersion,
        requestPaymentConfigChange,
        processRefundOrCredit,
        togglePaymentGateway,
        updatePaymentGateway,
        bankDetails,
        upiDetails,
        updateBankDetails,
        updateUpiDetails,
        expireUserPlanNow,
        rechargeUserPlan,
        updateTermsAgreement,
        toggleTermsEnforcement,
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
