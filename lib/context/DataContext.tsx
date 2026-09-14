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
  BidEvidenceDocket,
  RateItem,
  RateVersion,
  ContainerEquipmentRow,
  PostReport,
  AppNotification,
  LocationMasterItem,
  CarrierMasterItem,
  EquipmentMasterItem,
  CommodityMasterItem,
  IncotermMasterItem,
  TaxSACMasterItem,
} from '@/lib/types';
import {
  MASTER_LOCATIONS,
  MASTER_CARRIERS,
  MASTER_EQUIPMENT,
  MASTER_COMMODITIES,
  MASTER_INCOTERMS,
  MASTER_TAX_SAC,
} from '@/lib/utils';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  getPostsFromDB,
  upsertPostInDB,
  deletePostInDB,
  getAuctionsFromDB,
  upsertAuctionInDB,
  submitBidInDB,
  getRatesFromDB,
  upsertRateInDB,
  deleteRateInDB,
  batchUpsertRatesInDB,
  batchUpdateRatesInDB,
} from '@/lib/firebase/firestore';
import { eventBus } from '@/lib/intelligence/events';
import { presenceService } from '@/lib/presence/presenceService';
import { useNetwork } from './NetworkContext';

// Clean Datasets — Production strict mode: only real, verified, user-created data is presented
const SEED_NOTIFICATIONS: AppNotification[] = [];
const SEED_POSTS: FeedPost[] = [];
const SEED_JOBS: JobPost[] = [];
const SEED_TOPICS: NexusTopic[] = [];
const SEED_REVIEWS: CompanyReview[] = [];
const SEED_BLACKLIST: BlacklistCase[] = [];
const SEED_AUCTIONS: Auction[] = [];
const SEED_RATES: RateItem[] = [];

// Identifiers of previous dummy seed data to strip from local client caches
const DUMMY_AUCTION_IDS = new Set([
  'RA-2026-0842', 'GB-2026-0311', 'RA-2026-0901', 'RA-2026-0788', 'RA-2026-0940', 'RA-2026-0955', 'RA-2026-0843'
]);

const DUMMY_AUCTION_TITLES = new Set([
  'Automotive Parts FCL - Mumbai to Rotterdam Direct',
  'Industrial Heavy Machinery - Nhava Sheva to Antwerp',
  'Chemical Specialty Resins - Chennai to Hamburg',
  'Consumer Electronics FCL - Mundra to Jebel Ali',
  'Solar PV Modules & Inverters - Pipavav to Singapore',
  'Organic Cotton Garments - Shanghai to Nhava Sheva',
  'Mumbai → Rotterdam | FCL Export Auto Parts',
  'Shanghai → Jebel Ali | Solar Modules Equipment',
  'Nhava Sheva → Antwerp | Open General Bidding'
]);

const DUMMY_RATE_IDS = new Set([
  'RT-884210', 'RT-992144', 'RT-773190', 'RT-662810', 'RT-551940', 'RT-448201', 'RT-339105', 'RT-227490',
  'RT-000001', 'RT-000002', 'RT-000003', 'RT-000004', 'RT-000005', 'RT-000006', 'RT-000007', 'RT-000008',
  'IRT-901234', 'RT-773322'
]);

const DUMMY_RATE_PROVIDERS = new Set([
  'Hapag-Lloyd Ocean', 'Maersk Line Direct', 'CMA CGM India Direct', 'Mediterranean Shipping Company',
  'Mediterranean Shipping', 'Ocean Network Express', 'COSCO Shipping Lines', 'Evergreen Marine Corp',
  'Yang Ming Marine', 'Atlas Logistics Self-Posted', 'OceanLine Logistics Global', 'Seaway Freight International',
  'Hapag Global Express'
]);

const DUMMY_TOPIC_IDS = new Set(['top-1', 'top-2', 'nt-1', 'nt-2']);
const DUMMY_TOPIC_TITLES = new Set([
  'Port congestion: practical routing alternatives via Colombo and Salalah',
  'What is reasonable detention-free time for Antwerp and Rotterdam imports?'
]);

const DUMMY_REVIEW_IDS = new Set(['cr-1', 'cr-2', 'cr-3', 'cr-4']);
const DUMMY_REVIEW_COMPANIES = new Set([
  'Apex Logistics', 'Starlight Shippers', 'Pacific Gateway Logistics',
  'Rotterdam Freight NV', 'Indo Ocean Lines', 'Blue Anchor Line', 'Trans-World Shipping'
]);

const DUMMY_CASE_IDS = new Set(['bl-1', 'bl-2', 'bl-3', 'case-1', 'case-2', 'case-3', 'BL-2026-004']);
const DUMMY_BLACKLIST_COMPANIES = new Set([
  'OceanStar Maritime Forwarding Ltd.', 'Orbit Freight Services Ltd.',
  'SwiftLine Carriers International', 'Apex Cargo Movers'
]);

const DUMMY_JOB_IDS = new Set(['j1', 'j2', 'j3', 'j4', 'job-1', 'job-2', 'job-3', 'job-4']);
const DUMMY_JOB_TITLES = new Set([
  'Senior Freight Pricing Analyst',
  'Trade Lane Manager (Middle East & Europe)',
  'Trade Lane Manager',
  'Customer Success & Procurement Lead',
  'Ocean Freight Operations Executive'
]);

const DUMMY_NOTIFICATION_IDS = new Set(['notif-1', 'notif-2', 'notif-3', 'notif-4', 'notif-5', 'notif-6']);

const DUMMY_PERSONAS = new Set([
  'Priya Nair', 'Sarah Lewis', 'Elena Rostova', 'Kiran Mehta', 'Arjun Rao',
  'Vikram Patel', 'Rajesh Sharma', 'Michael Zhang', 'Carlos Mendez', 'Carlos Mendoza',
  'Ananya Deshmukh', 'Ananya Sen', 'Ahmed Al-Mansoor', 'Hannah Schmidt', 'Kenji Tanaka',
  'Sophie Dubois', 'Fatima Zahra', 'Viktor Lindqvist', 'Amara Okafor', 'Li Wei Chen',
  'Lucas Silva', 'Dmitri Pavlov', 'Yasmin Khan', 'Zoe Christensen', 'David Chen',
  'Capt. Sunil Deshmukh', 'Alex Van Der Meer', 'Kavita Reddy', 'Hans Gruber',
  'Meera Joshi', 'Amit Singhania', 'Robert Taylor'
]);

export function isDummyAuction(a: any): boolean {
  if (!a) return false;
  const id = String(a.id || '');
  const title = String(a.title || '');
  const creator = String(a.creatorName || '');
  return DUMMY_AUCTION_IDS.has(id) || DUMMY_AUCTION_TITLES.has(title) || DUMMY_PERSONAS.has(creator);
}

export function isDummyRate(r: any): boolean {
  if (!r) return false;
  const id = String(r.id || '');
  const sp = String(r.sp || '');
  if (r.isSelfPosted && r.ownerUid && !DUMMY_RATE_IDS.has(id)) return false;
  return DUMMY_RATE_IDS.has(id) || (DUMMY_RATE_PROVIDERS.has(sp) && !r.isSelfPosted);
}

export function isDummyNexusTopic(t: any): boolean {
  if (!t) return false;
  const id = String(t.id || '');
  const title = String(t.title || '');
  const author = String(t.author || '');
  return DUMMY_TOPIC_IDS.has(id) || DUMMY_TOPIC_TITLES.has(title) || DUMMY_PERSONAS.has(author);
}

export function isDummyCompanyReview(r: any): boolean {
  if (!r) return false;
  const id = String(r.id || '');
  const company = String(r.companyName || '');
  return DUMMY_REVIEW_IDS.has(id) || DUMMY_REVIEW_COMPANIES.has(company);
}

export function isDummyBlacklistCase(c: any): boolean {
  if (!c) return false;
  const id = String(c.id || '');
  const company = String(c.companyName || '');
  return DUMMY_CASE_IDS.has(id) || DUMMY_BLACKLIST_COMPANIES.has(company);
}

export function isDummyJob(j: any): boolean {
  if (!j) return false;
  const id = String(j.id || '');
  const title = String(j.title || '');
  const poster = String(j.postedBy || '');
  return DUMMY_JOB_IDS.has(id) || DUMMY_JOB_TITLES.has(title) || DUMMY_PERSONAS.has(poster);
}

export function isDummyNotification(n: any): boolean {
  if (!n) return false;
  const id = String(n.id || '');
  const relId = String(n.relatedId || '');
  return DUMMY_NOTIFICATION_IDS.has(id) || DUMMY_AUCTION_IDS.has(relId) || DUMMY_RATE_IDS.has(relId);
}

interface DataContextType {
  // Feeds
  posts: FeedPost[];
  addPost: (text: string, postType?: FeedPost['postType']) => void;
  editPost: (postId: string | number, newText: string) => void;
  deletePost: (postId: string | number) => void;
  reactPost: (postId: string | number, reaction: 'like' | 'dis') => void;
  togglePostSupport: (postId: string | number) => void;
  togglePostCritique: (postId: string | number) => void;
  togglePostAmplify: (postId: string | number) => void;
  savePost: (postId: string | number) => void;
  reportTarget: (
    targetId: string,
    targetType: PostReport['targetType'],
    category: PostReport['category'],
    description: string
  ) => PostReport;
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
  updateTopic: (topicId: string, title: string, category: string, text: string) => void;
  deleteTopic: (topicId: string) => void;
  addTopicReply: (topicId: string, text: string) => void;
  deleteTopicReply: (topicId: string, replyId: string) => void;
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
  submitBid: (auctionId: string, charges: any[], grandTotalUSD: number, evidenceMetadata?: any) => boolean;
  mySubmittedBids: SubmittedBid[];
  // Rates
  rates: RateItem[];
  myRates: RateItem[];
  addMyRate: (rateData: Omit<RateItem, 'id' | 'isOwner' | 'sp'>) => string;
  updateMyRate: (rateId: string, updates: Partial<RateItem>) => void;
  deleteMyRate: (rateId: string) => void;
  clearAllMyRates: () => void;
  bulkImportRates: (importedRates: Partial<RateItem>[]) => { count: number; errors: string[] };
  bulkUpdateRates: (rateIds: string[], updates: Partial<RateItem>, adjustmentPercentage?: number) => Promise<void>;
  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  // Master Data
  masterLocations: LocationMasterItem[];
  masterCarriers: CarrierMasterItem[];
  masterEquipment: EquipmentMasterItem[];
  masterCommodities: CommodityMasterItem[];
  masterIncoterms: IncotermMasterItem[];
  masterTaxCodes: TaxSACMasterItem[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, bidPostingFee } = useAuth();
  const { toast } = useToast();
  const { isLowBandwidth, recommendedBatchSize, queueAction } = useNetwork();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [topics, setTopics] = useState<NexusTopic[]>([]);
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [cases, setCases] = useState<BlacklistCase[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [myRates, setMyRates] = useState<RateItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Master Data States with Live Synchronizer
  const [masterLocations, setMasterLocations] = useState<LocationMasterItem[]>(MASTER_LOCATIONS);
  const [masterCarriers, setMasterCarriers] = useState<CarrierMasterItem[]>(MASTER_CARRIERS);
  const [masterEquipment, setMasterEquipment] = useState<EquipmentMasterItem[]>(MASTER_EQUIPMENT);
  const [masterCommodities, setMasterCommodities] = useState<CommodityMasterItem[]>(MASTER_COMMODITIES);
  const [masterIncoterms, setMasterIncoterms] = useState<IncotermMasterItem[]>(MASTER_INCOTERMS);
  const [masterTaxCodes, setMasterTaxCodes] = useState<TaxSACMasterItem[]>(MASTER_TAX_SAC);

  // Presence heartbeat lifecycle
  useEffect(() => {
    if (user?.uid) {
      presenceService.initialize(user.uid);
    }
    return () => {
      presenceService.cleanup();
    };
  }, [user?.uid]);

  // SWR Data Synchronization: Non-sensitive local cache -> Live Firestore revalidation
  useEffect(() => {
    let isMounted = true;

    // 1. Instant paint from non-sensitive local cache (0ms paint for offline / slow connections)
    try {
      const savedTopics = localStorage.getItem('fr8x_nexus_topics');
      if (savedTopics) {
        try {
          const parsed = JSON.parse(savedTopics);
          if (Array.isArray(parsed)) {
            const cleanTopics = parsed.filter((t: any) => !isDummyNexusTopic(t));
            setTopics(cleanTopics);
            localStorage.setItem('fr8x_nexus_topics', JSON.stringify(cleanTopics));
          }
        } catch {}
      } else {
        setTopics([]);
      }

      const savedReviews = localStorage.getItem('fr8x_nexus_reviews');
      if (savedReviews) {
        try {
          const parsed = JSON.parse(savedReviews);
          if (Array.isArray(parsed)) {
            const cleanReviews = parsed.filter((r: any) => !isDummyCompanyReview(r));
            setReviews(cleanReviews);
            localStorage.setItem('fr8x_nexus_reviews', JSON.stringify(cleanReviews));
          }
        } catch {}
      } else {
        setReviews([]);
      }

      const savedCases = localStorage.getItem('fr8x_nexus_cases');
      if (savedCases) {
        try {
          const parsed = JSON.parse(savedCases);
          if (Array.isArray(parsed)) {
            const cleanCases = parsed.filter((c: any) => !isDummyBlacklistCase(c));
            setCases(cleanCases);
            localStorage.setItem('fr8x_nexus_cases', JSON.stringify(cleanCases));
          }
        } catch {}
      } else {
        setCases([]);
      }

      const savedPosts = localStorage.getItem('fr8x_feed_posts');
      if (savedPosts) {
        try {
          const parsed = JSON.parse(savedPosts);
          if (Array.isArray(parsed)) {
            const realPosts = parsed.filter((p: any) => {
              const id = String(p.id || '');
              const author = String(p.author || '');
              const isDummyId = /^post-(?:[1-9]|1[0-9]|2[0-2])$/.test(id);
              const isDummyAuthor = DUMMY_PERSONAS.has(author);
              return !isDummyId && !isDummyAuthor;
            });
            setPosts(realPosts);
            localStorage.setItem('fr8x_feed_posts', JSON.stringify(realPosts));
          }
        } catch {}
      } else {
        setPosts([]);
      }

      const savedJobs = localStorage.getItem('fr8x_jobs');
      if (savedJobs) {
        try {
          const parsed = JSON.parse(savedJobs);
          if (Array.isArray(parsed)) {
            const cleanJobs = parsed.filter((j: any) => !isDummyJob(j));
            setJobs(cleanJobs);
            localStorage.setItem('fr8x_jobs', JSON.stringify(cleanJobs));
          }
        } catch {}
      } else {
        setJobs([]);
      }

      const savedAuctions = localStorage.getItem('fr8x_auctions');
      if (savedAuctions) {
        try {
          const parsed = JSON.parse(savedAuctions);
          if (Array.isArray(parsed)) {
            const cleanAuctions = parsed.filter((a: any) => !isDummyAuction(a));
            setAuctions(cleanAuctions);
            localStorage.setItem('fr8x_auctions', JSON.stringify(cleanAuctions));
          }
        } catch {}
      } else {
        setAuctions([]);
      }

      const savedRates = localStorage.getItem('fr8x_rates');
      if (savedRates) {
        try {
          const parsed = JSON.parse(savedRates);
          if (Array.isArray(parsed)) {
            const cleanRates = parsed.filter((r: any) => !isDummyRate(r));
            setRates(cleanRates);
            localStorage.setItem('fr8x_rates', JSON.stringify(cleanRates));
          }
        } catch {}
      } else {
        setRates([]);
      }

      const savedMyRates = localStorage.getItem('fr8x_my_rates');
      if (savedMyRates) {
        try {
          const parsed = JSON.parse(savedMyRates);
          if (Array.isArray(parsed)) {
            const cleanMyRates = parsed.filter((r: any) => !isDummyRate(r));
            setMyRates(cleanMyRates);
            localStorage.setItem('fr8x_my_rates', JSON.stringify(cleanMyRates));
          }
        } catch {}
      } else {
        setMyRates([]);
      }

      const savedNotifs = localStorage.getItem('fr8x_notifications');
      if (savedNotifs) {
        try {
          const parsed = JSON.parse(savedNotifs);
          if (Array.isArray(parsed)) {
            const cleanNotifs = parsed.filter((n: any) => !isDummyNotification(n));
            setNotifications(cleanNotifs);
            localStorage.setItem('fr8x_notifications', JSON.stringify(cleanNotifs));
          }
        } catch {}
      } else {
        setNotifications([]);
      }

      const savedReports = localStorage.getItem('fr8x_reports');
      if (savedReports) {
        try {
          const parsed = JSON.parse(savedReports);
          if (Array.isArray(parsed)) {
            setReports(parsed);
          }
        } catch {}
      }

      const savedLocs = localStorage.getItem('fr8x_gf_master_locations');
      if (savedLocs) setMasterLocations(JSON.parse(savedLocs));
      const savedCars = localStorage.getItem('fr8x_gf_master_carriers');
      if (savedCars) setMasterCarriers(JSON.parse(savedCars));
    } catch {}

    // 2. Adaptive revalidation against live Firestore
    async function revalidateLiveFirestore() {
      try {
        const batchSize = isLowBandwidth ? 12 : 40;

        // Fetch feed posts first with adaptive limit to keep mobile radio usage minimal
        const postsRes = await getPostsFromDB({ limitCount: batchSize }).catch(() => null);

        if (!isMounted) return;

        if (postsRes && Array.isArray(postsRes.posts) && postsRes.posts.length > 0) {
          const validCloudPosts = postsRes.posts.filter((p) => {
            const id = String(p.id || '');
            const author = String(p.author || '');
            return !/^post-(?:[1-9]|1[0-9]|2[0-2])$/.test(id) && !DUMMY_PERSONAS.has(author);
          });
          setPosts((prev) => {
            const map = new Map<string, FeedPost>();
            validCloudPosts.forEach((p) => map.set(String(p.id), p));
            prev.filter((p) => !/^post-(?:[1-9]|1[0-9]|2[0-2])$/.test(String(p.id)) && !DUMMY_PERSONAS.has(String(p.author))).forEach((p) => {
              if (!map.has(String(p.id))) {
                map.set(String(p.id), p);
              }
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('fr8x_feed_posts', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        // Secondary data queries (auctions and rates)
        const fetchSecondary = async () => {
          if (!isMounted) return;
          const [auctionsRes, ratesRes] = await Promise.allSettled([
            getAuctionsFromDB(),
            getRatesFromDB(),
          ]);

          if (!isMounted) return;

          if (auctionsRes.status === 'fulfilled' && Array.isArray(auctionsRes.value) && auctionsRes.value.length > 0) {
            const cleanCloudAuctions = auctionsRes.value.filter((a) => !isDummyAuction(a));
            setAuctions((prev) => {
              const map = new Map<string, Auction>();
              cleanCloudAuctions.forEach((a) => map.set(a.id, a));
              prev.filter((a) => !isDummyAuction(a)).forEach((a) => {
                if (!map.has(a.id)) {
                  map.set(a.id, a);
                }
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('fr8x_auctions', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }

          if (ratesRes.status === 'fulfilled' && Array.isArray(ratesRes.value) && ratesRes.value.length > 0) {
            const cleanCloudRates = ratesRes.value.filter((r) => !isDummyRate(r));
            setRates((prev) => {
              const map = new Map<string, RateItem>();
              cleanCloudRates.forEach((r) => map.set(r.id, r));
              prev.filter((r) => !isDummyRate(r)).forEach((r) => {
                if (!map.has(r.id)) {
                  map.set(r.id, r);
                }
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('fr8x_rates', JSON.stringify(merged));
                localStorage.setItem('fr8x_my_rates', JSON.stringify(merged.filter((r) => r.ownerUid === user?.uid || r.isOwner || r.isSelfPosted)));
              } catch {}
              return merged;
            });
            setMyRates((prev) => {
              const myFromCloud = cleanCloudRates.filter((r) => r.ownerUid === user?.uid || r.isOwner || r.isSelfPosted);
              const map = new Map<string, RateItem>();
              myFromCloud.forEach((r) => map.set(r.id, r));
              prev.filter((r) => !isDummyRate(r)).forEach((r) => {
                if (!map.has(r.id)) {
                  map.set(r.id, r);
                }
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('fr8x_my_rates', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }

          // 3. Revalidate from authoritative server-side DBMS (.knox/dbms)
          fetch('/api/rates')
            .then((res) => res.json())
            .then((data) => {
              if (data?.success && Array.isArray(data.rates)) {
                const apiRates = data.rates.filter((r: RateItem) => !isDummyRate(r));
                setRates((prev) => {
                  const merged = new Map<string, RateItem>();
                  prev.filter((r) => !isDummyRate(r)).forEach((r) => merged.set(r.id, r));
                  apiRates.forEach((r: RateItem) => merged.set(r.id, r));
                  const result = Array.from(merged.values());
                  try { localStorage.setItem('fr8x_rates', JSON.stringify(result)); } catch {}
                  return result;
                });
                setMyRates((prev) => {
                  const myFromApi = apiRates.filter((r: RateItem) => r.ownerUid === user?.uid || r.isOwner || r.isSelfPosted);
                  const merged = new Map<string, RateItem>();
                  prev.filter((r) => !isDummyRate(r)).forEach((r) => merged.set(r.id, r));
                  myFromApi.forEach((r: RateItem) => merged.set(r.id, r));
                  const result = Array.from(merged.values());
                  try { localStorage.setItem('fr8x_my_rates', JSON.stringify(result)); } catch {}
                  return result;
                });
              }
            })
            .catch(() => {});

          fetch('/api/feed')
            .then((res) => res.json())
            .then((data) => {
              if (data?.success && Array.isArray(data.posts) && data.posts.length > 0) {
                const apiPosts = data.posts.filter((p: FeedPost) => {
                  const id = String(p.id || '');
                  const author = String(p.author || '');
                  return !/^post-(?:[1-9]|1[0-9]|2[0-2])$/.test(id) && !DUMMY_PERSONAS.has(author);
                });
                setPosts((prev) => {
                  const map = new Map<string, FeedPost>();
                  apiPosts.forEach((p: FeedPost) => map.set(String(p.id), p));
                  prev.filter((p) => !/^post-(?:[1-9]|1[0-9]|2[0-2])$/.test(String(p.id)) && !DUMMY_PERSONAS.has(String(p.author))).forEach((p) => {
                    if (!map.has(String(p.id))) {
                      map.set(String(p.id), p);
                    }
                  });
                  const merged = Array.from(map.values());
                  try { localStorage.setItem('fr8x_feed_posts', JSON.stringify(merged)); } catch {}
                  return merged;
                });
              }
            })
            .catch(() => {});
        };


        if (isLowBandwidth) {
          // Defer heavy secondary queries on flaky 3G to keep main thread unblocked
          setTimeout(fetchSecondary, 1000);
        } else {
          fetchSecondary();
        }
      } catch (err) {
        console.warn('[DataContext] SWR fallback active:', err);
      }
    }

    revalidateLiveFirestore();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, isLowBandwidth]);
  const [mySubmittedBids, setMySubmittedBids] = useState<SubmittedBid[]>([]);

  // Notification Actions
  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === notifId ? { ...n, read: true } : n));
      try { localStorage.setItem('fr8x_notifications', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      try { localStorage.setItem('fr8x_notifications', JSON.stringify(next)); } catch {}
      return next;
    });
    toast('All notifications marked as read.');
  };

  // Feed Actions
  const addPost = (text: string, postType: FeedPost['postType'] = 'general') => {
    if (!text.trim()) return;
    const now = new Date().toISOString();
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
      supportCount: 0,
      critiqueCount: 0,
      amplifyCount: 0,
      isSupported: false,
      isCritiqued: false,
      isAmplified: false,
      isSaved: false,
      comments: [],
      createdAt: now,
      updatedAt: now,
      status: 'active',
      schemaVersion: 2,
    };
    setPosts((prev) => {
      const next = [newPost, ...prev];
      try {
        localStorage.setItem('fr8x_feed_posts', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Offline queueing + server DBMS sync + live cloud sync
    queueAction('create_post', newPost, user.uid);
    fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost),
    }).catch(() => {});
    upsertPostInDB(newPost).catch(() => {});
    eventBus.recordEvent({
      eventType: 'post_create',
      actorId: user.uid,
      actorCompany: user.company,
      targetId: newPost.id,
      targetType: 'post',
      immediate: true,
    });
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

    setPosts((prev) => {
      const next = prev.map((p) => (String(p.id) === String(postId) ? { ...p, text: newText.trim(), updatedAt: new Date().toISOString() } : p));
      try { localStorage.setItem('fr8x_feed_posts', JSON.stringify(next)); } catch {}
      return next;
    });

    const updated = { ...target, text: newText.trim(), updatedAt: new Date().toISOString() };
    queueAction('edit_post', updated, user.uid);
    upsertPostInDB(updated).catch(() => {});
    toast('Post updated.');
  };

  const deletePost = (postId: string | number) => {
    const target = posts.find((p) => String(p.id) === String(postId));
    if (!target) return;

    if (target.authorUid !== user.uid && user.role !== 'super_admin') {
      toast('Permission denied: You can only delete your own posts.');
      return;
    }

    setPosts((prev) => {
      const next = prev.filter((p) => String(p.id) !== String(postId));
      try { localStorage.setItem('fr8x_feed_posts', JSON.stringify(next)); } catch {}
      return next;
    });
    fetch(`/api/feed?id=${encodeURIComponent(String(postId))}`, {
      method: 'DELETE',
    }).catch(() => {});
    deletePostInDB(String(postId)).catch(() => {});
    toast('Post removed from feed.');
  };

  const reactPost = (postId: string | number, reaction: 'like' | 'dis') => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        const liked = reaction === 'like' ? !p.liked : false;
        const disliked = reaction === 'dis' ? !p.disliked : false;
        const likes = p.likes + (liked ? 1 : p.liked ? -1 : 0);
        const dis = p.dis + (disliked ? 1 : p.disliked ? -1 : 0);
        const updated = { ...p, liked, disliked, likes: Math.max(0, likes), dis: Math.max(0, dis) };

        // Optimistic cache update + offline outbox queue
        queueAction('like_post', updated, user.uid);
        upsertPostInDB(updated).catch(() => {});
        eventBus.recordEvent({
          eventType: reaction === 'like' ? 'post_like' : 'post_critique',
          actorId: user.uid,
          targetId: String(postId),
        });
        return updated;
      });

      try {
        localStorage.setItem('fr8x_feed_posts', JSON.stringify(next));
      } catch {}

      return next;
    });
  };

  const togglePostSupport = (postId: string | number) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        const isSupported = !p.isSupported;
        const currentCount = typeof p.supportCount === 'number' ? p.supportCount : 0;
        const supportCount = isSupported ? currentCount + 1 : Math.max(0, currentCount - 1);
        const updated = { ...p, isSupported, supportCount };
        upsertPostInDB(updated).catch(() => {});
        return updated;
      });
      try { localStorage.setItem('fr8x_feed_posts', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const togglePostCritique = (postId: string | number) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        const isCritiqued = !p.isCritiqued;
        const currentCount = typeof p.critiqueCount === 'number' ? p.critiqueCount : 0;
        const critiqueCount = isCritiqued ? currentCount + 1 : Math.max(0, currentCount - 1);
        const updated = { ...p, isCritiqued, critiqueCount };
        upsertPostInDB(updated).catch(() => {});
        return updated;
      });
      try { localStorage.setItem('fr8x_feed_posts', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const togglePostAmplify = (postId: string | number) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        const isAmplified = !p.isAmplified;
        const currentCount = typeof p.amplifyCount === 'number' ? p.amplifyCount : 0;
        const amplifyCount = isAmplified ? currentCount + 1 : Math.max(0, currentCount - 1);
        const updated = { ...p, isAmplified, amplifyCount };
        upsertPostInDB(updated).catch(() => {});
        return updated;
      });
      try { localStorage.setItem('fr8x_feed_posts', JSON.stringify(next)); } catch {}
      return next;
    });
    toast('Post amplified to your enterprise freight network.');
  };

  const savePost = (postId: string | number) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        const nextSaved = !p.isSaved;
        queueAction('save_post', { postId: String(postId), isSaved: nextSaved }, user.uid);
        toast(nextSaved ? 'Post saved to your bookmarks.' : 'Post removed from saved bookmarks.');
        return { ...p, isSaved: nextSaved };
      });

      try {
        localStorage.setItem('fr8x_feed_posts', JSON.stringify(next));
      } catch {}

      return next;
    });
  };

  const reportTarget = (
    targetId: string,
    targetType: PostReport['targetType'],
    category: PostReport['category'],
    description: string
  ): PostReport => {
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
    setReports((prev) => {
      const next = [newReport, ...prev];
      try {
        localStorage.setItem('fr8x_reports', JSON.stringify(next));
      } catch {}
      return next;
    });
    return newReport;
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
    setJobs((prev) => {
      const next = [newJob, ...prev];
      try { localStorage.setItem('fr8x_jobs', JSON.stringify(next)); } catch {}
      return next;
    });
    toast(`Job opportunity '${newJob.title}' posted successfully.`);
  };

  const deleteJob = (jobId: string) => {
    setJobs((prev) => {
      const next = prev.filter((j) => j.id !== jobId);
      try { localStorage.setItem('fr8x_jobs', JSON.stringify(next)); } catch {}
      return next;
    });
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
    setTopics((prev) => {
      const next = [newTopic, ...prev];
      try { localStorage.setItem('fr8x_nexus_topics', JSON.stringify(next)); } catch {}
      return next;
    });
    toast('Discussion topic published to Nexus Community.');
  };

  const updateTopic = (topicId: string, title: string, category: string, text: string) => {
    if (!title.trim() || !text.trim()) return;
    setTopics((prev) => {
      const next = prev.map((t) => {
        if (t.id !== topicId) return t;
        return {
          ...t,
          title: title.trim(),
          category: category || t.category,
          text: text.trim(),
          isEdited: true,
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      });
      try { localStorage.setItem('fr8x_nexus_topics', JSON.stringify(next)); } catch {}
      return next;
    });
    toast('Topic successfully updated.');
  };

  const deleteTopic = (topicId: string) => {
    setTopics((prev) => {
      const next = prev.filter((t) => t.id !== topicId);
      try { localStorage.setItem('fr8x_nexus_topics', JSON.stringify(next)); } catch {}
      return next;
    });
    toast('Discussion topic deleted.');
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
    setTopics((prev) => {
      const next = prev.map((t) => {
        if (t.id !== topicId) return t;
        return {
          ...t,
          commentsCount: t.commentsCount + 1,
          replies: [...t.replies, newReply],
        };
      });
      try { localStorage.setItem('fr8x_nexus_topics', JSON.stringify(next)); } catch {}
      return next;
    });
    toast('Discussion response submitted.');
  };

  const deleteTopicReply = (topicId: string, replyId: string) => {
    setTopics((prev) => {
      const next = prev.map((t) => {
        if (t.id !== topicId) return t;
        return {
          ...t,
          commentsCount: Math.max(0, t.commentsCount - 1),
          replies: t.replies.filter((r) => r.id !== replyId),
        };
      });
      try { localStorage.setItem('fr8x_nexus_topics', JSON.stringify(next)); } catch {}
      return next;
    });
    toast('Reply removed.');
  };

  const reactTopic = (topicId: string, reaction: 'like' | 'dis') => {
    setTopics((prev) => {
      const next = prev.map((t) => {
        if (t.id !== topicId) return t;
        const liked = reaction === 'like' ? !t.liked : false;
        const disliked = reaction === 'dis' ? !t.disliked : false;
        const likes = (t.likes || 0) + (liked ? 1 : t.liked ? -1 : 0);
        const dis = (t.dis || 0) + (disliked ? 1 : t.disliked ? -1 : 0);
        return { ...t, liked, disliked, likes: Math.max(0, likes), dis: Math.max(0, dis) };
      });
      try { localStorage.setItem('fr8x_nexus_topics', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const reactTopicReply = (topicId: string, replyId: string, reaction: 'like' | 'dis') => {
    setTopics((prev) => {
      const next = prev.map((t) => {
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
      });
      try { localStorage.setItem('fr8x_nexus_topics', JSON.stringify(next)); } catch {}
      return next;
    });
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
      let next: CompanyReview[];
      if (existing) {
        next = prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                totalReviews: r.totalReviews + 1,
                recentReviews: [newReviewItem, ...r.recentReviews],
              }
            : r
        );
      } else {
        next = [
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
      }
      try { localStorage.setItem('fr8x_nexus_reviews', JSON.stringify(next)); } catch {}
      return next;
    });
    toast(`Verified review for ${companyName} submitted.`);
  };

  const reactReviewRemark = (companyId: string, reviewId: string, action: 'like' | 'dis') => {
    setReviews((prev) => {
      const next = prev.map((comp) => {
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
      });
      try { localStorage.setItem('fr8x_nexus_reviews', JSON.stringify(next)); } catch {}
      return next;
    });
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
    setCases((prev) => {
      const next = [newCase, ...prev];
      try { localStorage.setItem('fr8x_nexus_cases', JSON.stringify(next)); } catch {}
      return next;
    });
    toast(`Compliance report for ${newCase.companyName} submitted for verification.`);
  };

  const agreeCase = (caseId: string) => {
    setCases((prev) => {
      const next = prev.map((c) => {
        if (c.id !== caseId) return c;
        const willAgree = !c.userAgreed;
        return {
          ...c,
          userAgreed: willAgree,
          agreedCount: Math.max(0, (c.agreedCount || 0) + (willAgree ? 1 : -1)),
        };
      });
      try { localStorage.setItem('fr8x_nexus_cases', JSON.stringify(next)); } catch {}
      return next;
    });
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

    setCases((prev) => {
      const next = prev.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          userDisputed: true,
          disputeCount: (c.disputeCount || 0) + 1,
          disputes: [newDispute, ...(c.disputes || [])],
        };
      });
      try { localStorage.setItem('fr8x_nexus_cases', JSON.stringify(next)); } catch {}
      return next;
    });
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

    setAuctions((prev) => {
      const next = [newAuction, ...prev];
      try { localStorage.setItem('fr8x_auctions', JSON.stringify(next)); } catch {}
      return next;
    });
    upsertAuctionInDB(newAuction).catch(() => {});
    eventBus.recordEvent({
      eventType: 'auction_create',
      actorId: user.uid,
      actorCompany: user.company,
      targetId: id,
      immediate: true,
    });

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
      createdAt: new Date().toISOString(),
      status: 'active',
      schemaVersion: 2,
    };
    setPosts((prev) => [feedAnnouncement, ...prev]);
    upsertPostInDB(feedAnnouncement).catch(() => {});

    if (newAuction.selectedBidders.length > 0) {
      newAuction.selectedBidders.forEach((b) => {
        toast(`Structured auction notification sent to ${b.name} (${b.company}).`);
      });
    }

    toast(`Reverse Auction ${id} published successfully.`);
    return id;
  };

  const updateAuctionStatus = (auctionId: string, status: Auction['status']) => {
    setAuctions((prev) => {
      const next = prev.map((a) => (a.id === auctionId ? { ...a, status } : a));
      try { localStorage.setItem('fr8x_auctions', JSON.stringify(next)); } catch {}
      return next;
    });
    toast(`Auction ${auctionId} status changed to ${status}.`);
  };

  const submitBid = (
    auctionId: string,
    charges: any[],
    grandTotalUSD: number,
    evidenceMetadata?: any
  ): boolean => {
    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction || targetAuction.status !== 'Live') {
      toast('This auction is no longer open for bidding.');
      return false;
    }
    const configuredLimit = Number(targetAuction.rules?.bidLimit);
    const bidLimit = ([1, 3, 5] as number[]).includes(configuredLimit) ? configuredLimit : 5;
    const alreadySubmitted = (targetAuction.bids || []).filter((bid) => bid.bidderUid === user.uid).length;
    if (alreadySubmitted >= bidLimit) {
      toast(`Bid limit reached: you may submit up to ${bidLimit} offer${bidLimit === 1 ? '' : 's'} for this auction.`);
      return false;
    }
    const ceiling = targetAuction?.competitionCeiling || 2720;
    const rank = grandTotalUSD <= ceiling ? 1 : 2;

    const evidenceDocket: BidEvidenceDocket = {
      docketRef: evidenceMetadata?.docketRef || `FR8X-EVID-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      termsAccepted: Boolean(evidenceMetadata?.termsAccepted ?? true),
      termsAcceptedAt: evidenceMetadata?.termsAcceptedAt || new Date().toISOString(),
      proposedCarrier: evidenceMetadata?.proposedCarrier || 'Direct Liner Service',
      proposedRouting: evidenceMetadata?.proposedRouting || 'Direct Ocean Passage',
      proposedTransitTime: evidenceMetadata?.proposedTransitTime || '28 Days',
      proposedVesselDate: evidenceMetadata?.proposedVesselDate || new Date().toISOString().slice(0, 10),
      offeredOriginFreeDays: Number(evidenceMetadata?.offeredOriginFreeDays ?? 14),
      offeredDestFreeDays: Number(evidenceMetadata?.offeredDestFreeDays ?? 14),
      bidderUid: user.uid,
      bidderName: user.displayName,
      bidderCompany: user.company,
      bidderEmail: user.email,
      evidenceHash: evidenceMetadata?.evidenceHash || `SHA256:BID:${Date.now()}:${user.uid}:${grandTotalUSD}`,
      ipAddress: '103.21.244.18',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'FR8X-Client/1.0',
    };

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
      evidenceDocket,
    };

    setMySubmittedBids((prev) => [newBid, ...prev]);

    setAuctions((prev) => {
      const next = prev.map((a) => {
        if (a.id !== auctionId) return a;
        return {
          ...a,
          rank: `#${rank}`,
          bidsSubmittedCount: a.bidsSubmittedCount + 1,
          bids: [...(a.bids || []), newBid],
        };
      });
      try { localStorage.setItem('fr8x_auctions', JSON.stringify(next)); } catch {}
      return next;
    });

    submitBidInDB(auctionId, newBid).catch(() => {});

    // Save evidence docket directly into Firestore bid_audit_logs collection for Godfather
    try {
      import('@/lib/firebase/client').then(({ db }) => {
        if (db) {
          import('firebase/firestore').then(({ doc, setDoc }) => {
            const auditRef = doc(db, 'bid_audit_logs', evidenceDocket.docketRef);
            setDoc(auditRef, {
              ...evidenceDocket,
              auctionId,
              grandTotalUSD,
              createdAt: new Date().toISOString(),
              status: 'VERIFIED_LEGAL_EVIDENCE',
            }, { merge: true }).catch(() => {});
          });
        }
      }).catch(() => {});
    } catch {}
    return true;

    eventBus.recordEvent({
      eventType: 'auction_bid',
      actorId: user.uid,
      actorCompany: user.company,
      targetId: auctionId,
      metadata: { grandTotalUSD, rank, docketRef: evidenceDocket.docketRef, evidenceDocket },
      immediate: true,
    });

    toast(
      `Bid of USD $${grandTotalUSD.toFixed(2)} submitted with Terms Evidence (${evidenceDocket.docketRef}).`
    );
  };

  // Rates
  const addMyRate = (rateData: Omit<RateItem, 'id' | 'isOwner' | 'sp'>): string => {
    const id = `IRT-${String(Math.floor(100000 + Math.random() * 900000))}`;
    const now = new Date().toISOString();
    const newRate: RateItem = {
      ...rateData,
      id,
      sp: user.company || 'My Enterprise Logistics',
      ownerUid: user.uid,
      isOwner: true,
      isSelfPosted: true,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      schemaVersion: 2,
    };
    setMyRates((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      const next = [newRate, ...filtered];
      try { localStorage.setItem('fr8x_my_rates', JSON.stringify(next)); } catch {}
      return next;
    });
    setRates((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      const next = [newRate, ...filtered];
      try { localStorage.setItem('fr8x_rates', JSON.stringify(next)); } catch {}
      return next;
    });

    // Server DBMS persistence
    fetch('/api/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRate),
    }).catch(() => {});

    // Cloud Firestore sync
    upsertRateInDB(newRate).catch(() => {});
    eventBus.recordEvent({
      eventType: 'rate_edit',
      actorId: user.uid,
      actorCompany: user.company,
      targetId: id,
    });
    toast(`i-Rate ${id} added to your published inventory.`);
    return id;
  };

  const updateMyRate = (rateId: string, updates: Partial<RateItem>) => {
    const now = new Date().toISOString();
    setMyRates((prev) => {
      const next = prev.map((r) => (r.id === rateId ? { ...r, ...updates, updatedAt: now } : r));
      try { localStorage.setItem('fr8x_my_rates', JSON.stringify(next)); } catch {}
      return next;
    });
    setRates((prev) => {
      const next = prev.map((r) => (r.id === rateId ? { ...r, ...updates, updatedAt: now } : r));
      try { localStorage.setItem('fr8x_rates', JSON.stringify(next)); } catch {}
      return next;
    });

    // Server DBMS update
    fetch('/api/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rateId, ...updates, updatedAt: now }),
    }).catch(() => {});

    // Cloud Firestore sync
    upsertRateInDB({ id: rateId, ...updates, updatedAt: now } as RateItem).catch(() => {});
    toast(`i-Rate ${rateId} updated.`);
  };

  const deleteMyRate = (rateId: string) => {
    setMyRates((prev) => {
      const next = prev.filter((r) => r.id !== rateId);
      try { localStorage.setItem('fr8x_my_rates', JSON.stringify(next)); } catch {}
      return next;
    });
    setRates((prev) => {
      const next = prev.filter((r) => r.id !== rateId);
      try { localStorage.setItem('fr8x_rates', JSON.stringify(next)); } catch {}
      return next;
    });

    // Server DBMS deletion
    fetch(`/api/rates?id=${encodeURIComponent(rateId)}`, {
      method: 'DELETE',
    }).catch(() => {});

    // Cloud Firestore deletion
    deleteRateInDB(rateId).catch(() => {});
    toast(`Rate ${rateId} removed from inventory.`);
  };

  const clearAllMyRates = () => {
    setMyRates([]);
    setRates((prev) => {
      const next = prev.filter((r) => !r.isOwner && !r.isSelfPosted && r.ownerUid !== user.uid && !r.id.startsWith('IRT-'));
      try { localStorage.setItem('fr8x_rates', JSON.stringify(next)); } catch {}
      return next;
    });
    try { localStorage.removeItem('fr8x_my_rates'); } catch {}
    toast('All custom i-Rates cleared.');
  };

  const bulkUpdateRates = async (
    rateIds: string[],
    updates: Partial<RateItem>,
    adjustmentPercentage?: number
  ) => {
    const now = new Date().toISOString();
    const updateBatch: { id: string; updates: Partial<RateItem>; revision?: RateVersion }[] = [];

    const updatedRates = rates.map((r) => {
      if (!rateIds.includes(r.id)) return r;

      const revisedD20 = adjustmentPercentage
        ? Math.round(r.d20 * (1 + adjustmentPercentage / 100))
        : updates.d20 ?? r.d20;
      const revisedH40 = adjustmentPercentage
        ? Math.round(r.h40 * (1 + adjustmentPercentage / 100))
        : updates.h40 ?? r.h40;

      const revision: RateVersion = {
        id: `rv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        version: (r.versions?.length || 0) + 1,
        status: 'current',
        createdAt: now,
        d20: revisedD20,
        h40: revisedH40,
        valid: updates.valid || r.valid,
        remark: updates.remark || (adjustmentPercentage ? `Adjusted by ${adjustmentPercentage}%` : r.remark),
        changedBy: user.displayName,
        adjustmentPercentage,
      };

      const newRate: RateItem = {
        ...r,
        ...updates,
        d20: revisedD20,
        h40: revisedH40,
        versions: [revision, ...(r.versions || [])],
        updatedAt: now,
        updatedBy: user.uid,
      };

      updateBatch.push({ id: r.id, updates: newRate, revision });
      return newRate;
    });

    setRates(updatedRates);
    try { localStorage.setItem('fr8x_rates', JSON.stringify(updatedRates)); } catch {}
    setMyRates((prev) => {
      const next = prev.map((r) => {
        const match = updatedRates.find((ur) => ur.id === r.id);
        return match || r;
      });
      try { localStorage.setItem('fr8x_my_rates', JSON.stringify(next)); } catch {}
      return next;
    });

    // Server DBMS bulk update
    fetch('/api/rates/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rates: updatedRates }),
    }).catch(() => {});

    try {
      await batchUpdateRatesInDB(updateBatch);
    } catch {}

    toast(`Successfully updated ${rateIds.length} rates with revision history.`);
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
        isSelfPosted: true,
        createdAt: new Date().toISOString(),
        status: 'active',
        schemaVersion: 2,
      });
    });

    if (validRows.length > 0) {
      setMyRates((prev) => {
        const next = [...validRows, ...prev];
        try { localStorage.setItem('fr8x_my_rates', JSON.stringify(next)); } catch {}
        return next;
      });
      setRates((prev) => {
        const next = [...validRows, ...prev];
        try { localStorage.setItem('fr8x_rates', JSON.stringify(next)); } catch {}
        return next;
      });

      // Server DBMS persistence
      fetch('/api/rates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: validRows }),
      }).catch(() => {});

      // Cloud Firestore batch upsert
      batchUpsertRatesInDB(validRows).catch(() => {});

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
        togglePostSupport,
        togglePostCritique,
        togglePostAmplify,
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
        updateTopic,
        deleteTopic,
        addTopicReply,
        deleteTopicReply,
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
        updateMyRate,
        deleteMyRate,
        clearAllMyRates,
        bulkImportRates,
        bulkUpdateRates,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        masterLocations,
        masterCarriers,
        masterEquipment,
        masterCommodities,
        masterIncoterms,
        masterTaxCodes,
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
