import { Auction } from '@/lib/types';

export function formatAuctionDetailTable(auction: Auction): string {
  const containersFormatted = (auction.containers || [])
    .map(
      (c) =>
        `| ${c.equipmentType} | ${c.quantity} | ${c.containerType} | ${c.commodity} | ${c.grossWeight} ${c.weightUnit || 'KG'} | ${c.pickupLocation} | ${c.emptyReturnLocation} |`
    )
    .join('\n');

  return `
### 🏛️ OFFICIAL FR8X AUCTION INVITATION & TENDER NOTICE
**Auction ID:** \`${auction.id}\` | **RFQ Reference:** \`${auction.rfqId}\` | **Type:** ${auction.auctionType}
**Issuer:** ${auction.creatorCompany} (${auction.creatorName})

---

#### 📍 ROUTE & SCHEDULE
| Field | Value |
| :--- | :--- |
| **Port of Receipt (POR)** | ${auction.shipment.por || 'N/A'} |
| **Port of Loading (POL)** | ${auction.shipment.pol} |
| **Port of Discharge (POD)** | ${auction.shipment.pod} |
| **Final Place of Delivery (FPOD)** | ${auction.shipment.finalDestination || 'N/A'} |
| **Cargo Ready Date** | ${auction.shipment.cargoReadyDate} |
| **Tender Window** | ${auction.startDate} ${auction.startTime} → ${auction.endDateTime} (${auction.timezone}) |
| **Incoterm** | ${auction.shipment.incoterm} |
| **Rate Currency** | ${auction.shipment.rateCurrency || 'USD'} |

---

#### 📦 EQUIPMENT & CARGO MANIFEST
| Equipment | Qty | Type | Commodity | Gross Weight | Pickup Location | Empty Return Location |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${containersFormatted || '| Standard FCL | 1 | Standard | General Cargo | N/A | POL | POD |'}

---

#### ⚖️ BIDDING RULES & PROTOCOL
- **Ranking Visibility:** ${auction.rules?.rankingVisible ? '✅ Visible to Active Bidders' : '❌ Hidden'}
- **Competitor Anonymity:** ${auction.rules?.hideCompetitorNames ? '✅ Enforced (Masked Identifiers)' : '❌ Open'}
- **Auto Extension:** ${auction.rules?.autoExtension ? '✅ 2-Min Soft Extension on Last Minute Bids' : '❌ Strict Close'}
- **Ceiling / Target Budget:** ${auction.competitionCeiling ? `$${auction.competitionCeiling.toLocaleString()} USD` : 'Unrestricted'}

---

> [!IMPORTANT]
> **FR8X Platform Compliance & Legal Notice:**
> Submitting a bid constitutes an irrevocable commercial commitment valid through the agreed shipment execution window. All rates must include all mandatory origin/freight surcharges specified in scope. Non-performance or fraudulent quoting is subject to immediate dispute review, penalty debit, and public blacklist publication under Con.FR8X.IN terms.
`.trim();
}

export function interpolateTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  Object.keys(vars).forEach((key) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, vars[key] || '');
  });
  return result;
}
