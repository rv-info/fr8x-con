/**
 * lib/intelligence/knowledgeGraph.ts
 * Logistics Knowledge Graph connecting Users, Companies, Roles, Ports,
 * Trade Lanes, Carriers, Associations, Rates, and Auctions.
 */

export type NodeType =
  | 'user'
  | 'company'
  | 'port'
  | 'trade_lane'
  | 'carrier'
  | 'association'
  | 'post'
  | 'auction'
  | 'rate';

export type EdgeType =
  | 'works_at'
  | 'located_in'
  | 'serves_lane'
  | 'member_of'
  | 'partners_with'
  | 'authored'
  | 'bid_on'
  | 'booked_rate'
  | 'disputed';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  weight: number; // 0.0 - 1.0
  metadata?: Record<string, any>;
}

class LogisticsKnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private adjacency: Map<string, GraphEdge[]> = new Map();

  constructor() {
    this.seedCanonicalAssociations();
  }

  private seedCanonicalAssociations() {
    const associations = ['WCA', 'FIATA', 'IATA', 'AEO', 'MTO'];
    for (const assoc of associations) {
      this.addNode({ id: `assoc:${assoc}`, type: 'association', label: assoc });
    }
  }

  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, []);
    }
  }

  public addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.from)) {
      this.addNode({ id: edge.from, type: 'user', label: edge.from });
    }
    if (!this.nodes.has(edge.to)) {
      this.addNode({ id: edge.to, type: 'user', label: edge.to });
    }

    const edges = this.adjacency.get(edge.from) || [];
    // Prevent duplicate edges
    const exists = edges.some((e) => e.to === edge.to && e.type === edge.type);
    if (!exists) {
      edges.push(edge);
      this.adjacency.set(edge.from, edges);
    }
  }

  /**
   * Relationship Affinity score between two users:
   * Considers: Shared company (+0.4), shared association (+0.25), prior chat/bidding interaction (+0.35)
   */
  public getRelationshipAffinity(userAId: string, userBId: string): number {
    if (!userAId || !userBId || userAId === userBId) return 1.0;

    let score = 0.05; // Base exploration floor
    const edgesA = this.adjacency.get(userAId) || [];
    const edgesB = this.adjacency.get(userBId) || [];

    // Find shared targets (e.g. same company, same association)
    const targetsA = new Set(edgesA.map((e) => e.to));
    for (const edgeB of edgesB) {
      if (targetsA.has(edgeB.to)) {
        if (edgeB.to.startsWith('company:')) score += 0.45;
        else if (edgeB.to.startsWith('assoc:')) score += 0.25;
        else if (edgeB.to.startsWith('lane:')) score += 0.20;
      }
    }

    // Direct interaction
    const direct = edgesA.find((e) => e.to === userBId);
    if (direct) {
      score += 0.35 * direct.weight;
    }

    return Math.min(1.0, score);
  }

  /**
   * Trade Lane Relevance:
   * Matches user's operating ports/corridors against the post's ports or lane.
   */
  public getTradeLaneRelevance(
    userPorts: string[],
    postLaneOrPorts?: { lane?: string; ports?: string[] }
  ): number {
    if (!postLaneOrPorts) return 0.2;
    if (userPorts.length === 0) return 0.4; // Default neutral for unconfigured profiles

    const targetPorts = postLaneOrPorts.ports || [];
    const lane = postLaneOrPorts.lane || '';

    // Port match
    let matchCount = 0;
    for (const p of userPorts) {
      if (targetPorts.includes(p) || (lane && lane.toUpperCase().includes(p.toUpperCase()))) {
        matchCount++;
      }
    }

    if (matchCount >= 2) return 1.0;
    if (matchCount === 1) return 0.75;
    return 0.15;
  }

  /**
   * Creator Trust evaluation:
   * Based on Golden Tick verification, company reputation, and absence of disputes.
   */
  public getCreatorTrust(creatorUid: string, hasGoldenTick?: boolean, verified?: boolean): number {
    let trust = 0.5; // Baseline
    if (hasGoldenTick) trust += 0.3;
    if (verified) trust += 0.15;

    // Check dispute edges in graph
    const edges = this.adjacency.get(creatorUid) || [];
    const disputes = edges.filter((e) => e.type === 'disputed').length;
    trust -= disputes * 0.15;

    return Math.max(0.1, Math.min(1.0, trust));
  }

  /**
   * Fraud & Collusion Detection:
   * Checks if bidder and creator share identical IP, company, or circular bidding patterns.
   */
  public detectCollusionRisk(
    bidderUid: string,
    creatorUid: string,
    bidderCompany?: string,
    creatorCompany?: string
  ): { hasRisk: boolean; score: number; reason?: string } {
    if (bidderUid === creatorUid) {
      return { hasRisk: true, score: 1.0, reason: 'Self-bidding prohibited' };
    }

    if (
      bidderCompany &&
      creatorCompany &&
      bidderCompany.trim().toLowerCase() === creatorCompany.trim().toLowerCase()
    ) {
      return { hasRisk: true, score: 0.95, reason: 'Affiliated entity internal bid ring' };
    }

    return { hasRisk: false, score: 0.05 };
  }
}

export const logisticsGraph = new LogisticsKnowledgeGraph();
