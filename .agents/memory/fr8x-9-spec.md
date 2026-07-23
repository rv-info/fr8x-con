# FR8X-CON fr8x-9 Specification Summary

> **Purpose**: Condensed reference of the 13-page PDF specification so future sessions don't need to read each page file individually.

## Page 1: Login
- Fields: Email/Username, Password (with show/hide toggle)
- "Forgot password?" link
- **"Launch!"** button (primary CTA)
- Footer: "New to FR8X-CON? Create an account" + "Terms and conditions*"
- Left panel: branding, stats (500+ Active Users, 10K+ Auctions, 99.9% Uptime)

## Page 2: Register & Create Account
- Two-column form: Full Name | Work Email, Password | Confirm Password, Company Name | Country/Region
- **Role dropdown**: NVOCC / MLO / Freight Forwarder / CHA / Transporters
- **Industry & Service Tags** (multi-select): NVOCC, Freight Forwarding, FCL, LCL, Ocean Freight, Customs Clearance, Dangerous Goods, Cross-border Trade, Air Freight, Inland Haulage, Warehousing, Cold Chain, Project Cargo, Multimodal
- **Membership Plans**:
  - Trial: ₹0 / 2 days — Verified badge, RFQ posting, 0 saved searches
  - Basic: ₹1,499/mo (US$25/mo) — Verified badge, Bidding & rates posting, Unlimited search
  - Premium: Custom — Multi-seat, dedicated AM, API (Introducing Shortly)
- **Payment**: Card | UPI — Card Number, Expiry, CVV, GST/Tax ID
- Actions: Confirm & Pay | Autopay (Monthly)
- Note: GST invoice auto-sent from support@fr8x.in; GODMODE adds payment details

## Page 3: Feeds / Home (3-Column)
- **Left Sidebar**: Profile card (photo, name, company, location, tags, batch), nav links (Saved Posts, My RFQs, Followed Tags, Company Page, view/edit profile), Connections list
- **Center Feed**: Post composer (text/table with bold/italic/underline/color: red/blue/green/black), category filter tabs (All | NVOCC | Freight Forwarding | Project Cargo | FCL | LCL | Air | Rig to destination | Ocean | Road | Customs | Warehousing | Cold Chain | Multimodal), POST button. Feed posts show: author info + engagement (likes, dislike, repost, save, share counts)
- **Right Sidebar**: Suggested Connections (5), Trending Tags (Ocean/Air/LAND Freight), Advertise space, Jobs section (package LPA, 15 listings with scrollbar)
- Note: Feeds only from acquainted people or premium members + some random based on cache

## Page 4: Edit Profile (3-Column)
- Edit | Save buttons at top
- **Left**: Photo (add/edit/delete), Name, Company, Location, Tags, Batch/Badge, Work Experience (3 entries: company, location, designation, from-to), Education (3 entries: college, stream, from-to)
- **Center**: User's posts with full engagement + comments + delete/edit actions
- **Right**: Post Jobs popup link, Job posted count, Seen count

## Page 5: View Profile (2-Column)
- Same as Edit but read-only. No edit/delete buttons on posts. Full work experience and education visible.

## Page 6: Post Jobs (Popup — Two-Column Form)
- **Left**: Job Title, Industry (Logistics/Freight/NVOCC/Shipping/Customs/Warehousing/Supply Chain), Employment Type (Full-Time/Part-Time/Contract/Internship/Temporary), Experience Required, Salary Range, Country, City, Job Summary, Required Skills, Cargo Type, Apply Via (Portal/Email/External), Recruiter Name, Official Email
- **Right**: Company Name, Job Category (Operations/Sales/Pricing/Documentation/Customs/Warehouse/HR/Finance/IT), Vacancies, Education, Salary Type (Monthly/Annual), State, Work Mode (On-site/Hybrid/Remote), Key Responsibilities, Preferred Software, Languages, Application Deadline, Website, Mobile, Company Website, Validity (2 days), Renewal Fee (₹499), Urgent Hiring, Status (Draft/Published/Expired)
- Fee: ₹499 per post, ₹499 renewal for 2 more days
- Featured Job: Yes/No, Show Salary: Yes/No
- Footer: Save Draft | Preview | Pay & Publish

## Page 7: Published Job Details (Popup)
- Table: Job ID, Title, Company, Industry, Employment Type, Experience, Education, Salary, Location, Work Mode, Posted On, Valid Till, Job Description, Required Skills, Contact Email, Company Website
- Action: Send Email button

## Page 8: Reverse Auction Placing (Form)
- **General Info**: Auction Title*, Date*, Shipment Type*, Service Type*, Preferred Carrier, Auction ID, Start/End Time*, Incoterms*, Commodity, Planned Shipment/Cargo Readiness Date*, Auction Type*, Currency*, Time Zone, Origin/POL/Discharge/Destination Ports*, Additional Routing
- **Commodity & Container Table**: #, Cont. Size & Type, No. of Cont., Commodity, Haz/Non-Haz, Class, UN No., Flash Point, Packing Group, Packages, Gross Wt., Remarks, Dimensions + ADD ROWS
- **Rates (Mandatory)**: Ocean Freight (All-in), THC Origin/Dest, Documentation, Customs Origin/Dest, Other Surcharges, Inland Transport Origin/Dest, Warehousing, Cargo Insurance, Packing/Crating, BAF/CAF/THC/ISPS
- **Commercial Terms**: Quote In, Bidding Decrement Type, Visibility*, Payment Terms*, Decrement Value*, Allow Ranking View, Rate Validity*, Auto Extension, Currency Lock
- **Documents**: Upload section
- **Invite Suppliers**: Company/Email table + "Any (Besides below)"
- **Bid Contact**: Remarks, Contact Person, Email, Telephone
- Footer: Save Draft | Publish | Cancel

## Page 9: Reverse Auction — Live Bidding
- **Header**: Auction Title, ID, Currency, Shipment Type, Service Type, Containers, Commodity, Validity, POL, POD, FPOD
- **Live Ranking**: YOUR CURRENT RANK: 1, Out of 5 — 04 Bids Submitted, YOUR TOTAL (USD + INR)
- **Containerwise Charges Table**: # Containers, Container, Size (20'/40'/OT/RF/FR), Commodity, TYPE (GEN/HAZ/OOG/IG), Ocean Freight, Free Time, Transit, ETD, ETA, Service, Remarks, Action
- **Local Charges Table**: # Containers, Charges Head, Container Size, TYPE, Currency, Amount, Action
- **Additional Info**: Payment Terms, Rate Validity, Remarks, Quote In, Bidding Decrement, Decrement %
- Footer: Save as Draft | Edit Bid | Preview Bid | Submit/Update Bid

## Page 10: Rate Center
- **Tabs**: ACTIVE RATES | EXPIRED RATES | ALL RATES
- **Top buttons**: BULK UPLOAD | DOWNLOAD FOR BULK UPLOAD
- **Left Sidebar Filter**: Rate Provider, Carrier/Forwards Name, Carrier, POL, POD, FPOD, Container Size, Rate, Container Type, Route, Validity Date, TT, Routing (S/D), Transit Type, Remarks → SAVE | UPDATE | CLEAR | DUPLICATE
- **Main Table**: Checkbox, SRQ, Rate Provider, Carrier, POL, POD, FPOD, COMM, Cont Type, Cont Size, Rout, Rate, Curr, TT, Routing, Remarks, ACTION (Copy/Duplicate, Mark Expired, Delete)
- Pagination: < Prev Page 1 of _ Next >

## Page 11: GodMode Control Panel
- **Left Nav**: Dashboard, Users & Members, Companies, Moderation Queue, Blacklist Registry, Verification Requests, Billing & Plans, Audit Log, System Settings
- **Top Tabs**: Same as left nav for quick switching
- Footer: login link (back to user view)

## Page 12: Legal Documentation
- 4 sections: Terms & Conditions (18 clauses), Intellectual Property Rights (12 clauses), Privacy/Data Protection/Confidentiality (15 clauses), Disclaimer/Limitation of Liability/Acceptable Use (15 clauses)
- Entity name: "Blueprints" (platform legal name)

## Page 13: Theme Design Specification
| Token | Hex | Name |
|-------|-----|------|
| Background | `#F7F7FF` | Ghost White |
| Active text box border | `#535657` | Charcoal |
| Input accent border | `#E5D9F2` | Lavender Veil |
| Nav bar / tab background | `#A594F9` | Soft Periwinkle |
| Active button background | `#EDE6F2` | Lavender Mist |
| Active button border | `#746D75` | Dim Grey |
| Text color | `#253031` | Jet Black |
| Feeds textbox background | `#C5E7E2` | Frozen Water |
| Text box color | `#E5D9F2` | Lavender Veil |
