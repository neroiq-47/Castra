# Castra

Marketing site for Castra, cloud command for B2B teams, sold as fixed one-time terms
(Contubernium 30 days £490, Cohort 90 days £1,190, Legion 365 days £3,490).

## Layout

```
public/            static site, deployed as-is (no build step)
  index.html       landing page
  enlist.html      choose a term; card checkout (Stripe Payment Links) or invoice/PO request
  contact.html     sales, demo and security-pack enquiries
  legal.html       terms, privacy, DPA, cookies summary
  thanks.html      form success page
  404.html
  styles.css       design tokens and components from the Landing design reference
  main.js          menu, hero panel animation, muster calculator, form helpers
  config.js        public Stripe Payment Link URLs (empty = card checkout hidden)
design/landing-mockup/   original design reference (not deployed)
netlify.toml       publish dir and security headers
```

## Run locally

```
python3 -m http.server -d public 8000
```

Netlify serves extensionless URLs (`/enlist`); locally use `/enlist.html`.

## Deploy

Hosted on Netlify (`publish = "public"`). Forms (`enlist`, `contact`) use Netlify Forms;
set up a submission notification in the Netlify UI (Forms > Notifications) so enquiries
reach an inbox.

## Turning on card checkout

Create three Stripe Payment Links (one-time GBP prices: £490, £1,190, £3,490), each
redirecting after payment to `https://<site>/thanks?paid=1`, and paste their
`https://buy.stripe.com/...` URLs into `public/config.js`. Until all three are set,
`/enlist` hides the card button and sends the request form instead.

Card buyers fill in the enlist form first; it is saved to Netlify Forms with a
`[stripe ref castra-...]` note, and the same ref is passed to Stripe as
`client_reference_id`, so each payment can be matched to the company that made it.
