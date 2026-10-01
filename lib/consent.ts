// UK/EU immediate-supply consent, shown under the buy button. Tapping buy
// is the consent; the server stamps this exact wording into Stripe
// metadata so there's a record of what the buyer saw. Keep it in step
// with the "Right to cancel" clause in content/terms-of-service.md.
export const CONSENT_TEXT =
  'By buying, you agree to immediate download and waive your 14-day right to cancel once it begins.'
