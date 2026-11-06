/* Agent Portal — SAMPLE data only. No real buyers, no real phone numbers,
   no real emails. Fictional first names only; phone numbers use the
   555-0100 range, which is set aside for fiction; emails use example.com,
   which is set aside for examples. Farm leads never go in this file. */
const AGENTS = [
  { id: "quinton", name: "Quinton Sanchez", role: "Real Estate Agent — Mike Blair Realty Group (LPT), DRE 02189291", first: true, sample: false },
  { id: "maria", name: "Maria Torres", role: "SAMPLE agent — made-up example", first: false, sample: true },
  { id: "david", name: "David Chen", role: "SAMPLE agent — made-up example", first: false, sample: true }
];

/* Every buyer below passed the checks before reaching the board:
   DNC scrub date recorded, call + text + email consent recorded,
   not opted out. That is the gate rule reused from the parked
   multi-user build (gate/GATE-SPEC.md). A buyer who fails any
   check never appears here. */
const BUYERS = [
  {
    id: "A", area: "North Park", budget: "$600,000 – $750,000", timeline: "Now",
    preapproval: "Yes", readySince: "Nov 5, 2026",
    firstName: "Sam", phone: "(555) 010-1001", email: "sam@example.com",
    wants: "A 3-bedroom house near the park, close to schools.",
    call: "Thu Nov 6 at 6:00 PM Pacific",
    textConsent: "Yes", emailConsent: "Yes", passOnConsent: "Yes",
    consentDate: "Nov 5, 2026", scrubDate: "Oct 30, 2026"
  },
  {
    id: "B", area: "La Jolla", budget: "$1,000,000 – $1,250,000", timeline: "Soon",
    preapproval: "Not yet", readySince: "Nov 5, 2026",
    firstName: "Alex", phone: "(555) 010-1002", email: "alex@example.com",
    wants: "A condo with a sea view, two bedrooms, no stairs.",
    call: "Fri Nov 7 at 10:00 AM Pacific",
    textConsent: "Yes", emailConsent: "Yes", passOnConsent: "Yes",
    consentDate: "Nov 5, 2026", scrubDate: "Oct 30, 2026"
  },
  {
    id: "C", area: "Chula Vista", budget: "$500,000 – $650,000", timeline: "Now",
    preapproval: "Yes", readySince: "Nov 5, 2026",
    firstName: "Ana", phone: "(555) 010-1003", email: "ana@example.com",
    wants: "A first home, 2 bedrooms, near family.",
    call: "Thu Nov 6 at 7:30 PM Pacific",
    textConsent: "Yes", emailConsent: "Yes", passOnConsent: "No",
    consentDate: "Nov 5, 2026", scrubDate: "Oct 30, 2026"
  },
  {
    id: "D", area: "Pacific Beach", budget: "$750,000 – $900,000", timeline: "Soon",
    preapproval: "Yes", readySince: "Nov 5, 2026",
    firstName: "Ben", phone: "(555) 010-1004", email: "ben@example.com",
    wants: "A townhouse within walking distance of the beach.",
    call: "Sat Nov 8 at 11:00 AM Pacific",
    textConsent: "Yes", emailConsent: "Yes", passOnConsent: "Yes",
    consentDate: "Nov 5, 2026", scrubDate: "Oct 30, 2026"
  },
  {
    id: "E", area: "Escondido", budget: "$450,000 – $600,000", timeline: "Now",
    preapproval: "Not yet", readySince: "Nov 5, 2026",
    firstName: "Mia", phone: "(555) 010-1005", email: "mia@example.com",
    wants: "A house with a yard for two dogs.",
    call: "Fri Nov 7 at 5:00 PM Pacific",
    textConsent: "Yes", emailConsent: "Yes", passOnConsent: "Yes",
    consentDate: "Nov 5, 2026", scrubDate: "Oct 30, 2026"
  }
];
