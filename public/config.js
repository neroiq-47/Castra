/* Castra public runtime config. Values here are public (client-side) only.
 * Fill in Paddle's client-side token and the three one-time price IDs to turn on
 * card checkout on /enlist. Until then the page offers the invoice/request form. */
window.CASTRA_CONFIG = {
  paddle: {
    environment: 'production', // or 'sandbox'
    clientToken: '',           // e.g. live_xxx or test_xxx
    prices: { '30': '', '90': '', '365': '' } // pri_xxx IDs for Contubernium, Cohort, Legion
  }
};
