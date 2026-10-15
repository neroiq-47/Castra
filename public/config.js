/* Castra public runtime config. Everything here is public (client-side).
 * Paste the three Stripe Payment Link URLs (https://buy.stripe.com/...) to turn on
 * card checkout on /enlist. Until all three are set, the page offers the
 * invoice/request form only. */
window.CASTRA_CONFIG = {
  stripe: {
    paymentLinks: {
      '30': '',  // Contubernium · £490
      '90': '',  // Cohort · £1,190
      '365': ''  // Legion · £3,490
    }
  }
};
