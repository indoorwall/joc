// Stripe FALSO (modo test, sin red) con la forma de la API real. Para tests y para el backend simulado del juego.
// Genera eventos de webhook firmados exactamente como Stripe (v1 HMAC-SHA256), así que el verificador real se ejercita.
import { signPayload } from './stripeSignature.js';

export function createFakeStripe({ webhookSecret = 'whsec_test_fake', clock = () => new Date(), mock = true } = {}) {
  let n = 0;
  const id = p => `${p}_test_${(++n).toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const customers = {}, sessions = {}, intents = {}, idem = {};
  const calls = [];
  const ts = () => Math.floor(clock().getTime() / 1000);
  const api = {
    mock, livemode: false, calls,
    async createCustomer(p, key) {
      calls.push(['createCustomer', p, key]);
      if (key && idem[key]) return idem[key];
      const c = { id: id('cus'), object: 'customer', metadata: p.metadata || {} }; customers[c.id] = c; if (key) idem[key] = c; return c;
    },
    async createCheckoutSession(p, key) {
      calls.push(['createCheckoutSession', p, key]);
      if (key && idem[key]) return idem[key];
      const li = p.line_items[0];
      const amount = li.price_data ? li.price_data.unit_amount : (api.prices[li.price] || {}).unit_amount;
      const currency = li.price_data ? li.price_data.currency : (api.prices[li.price] || {}).currency;
      if (!Number.isInteger(amount)) throw Object.assign(new Error('No such price'), { status: 400 });
      const s = { id: id('cs'), object: 'checkout.session', mode: p.mode, customer: p.customer, client_reference_id: p.client_reference_id, metadata: p.metadata, payment_status: 'unpaid', status: 'open',
        amount_subtotal: amount, amount_total: amount, currency, total_details: { amount_tax: 0 }, payment_intent: null, url: `mock-checkout://${p.client_reference_id}`, livemode: false, expires_at: p.expires_at, customer_details: null };
      sessions[s.id] = s; if (key) idem[key] = s; return s;
    },
    async retrieveCheckoutSession(sid) { const s = sessions[sid]; if (!s) throw Object.assign(new Error('No such session'), { status: 404 }); return JSON.parse(JSON.stringify(s)); },
    async retrievePaymentIntent(pid) { const p = intents[pid]; if (!p) throw Object.assign(new Error('No such payment_intent'), { status: 404 }); return JSON.parse(JSON.stringify(p)); },
    prices: {},   // price_id → { unit_amount, currency } (para probar el mapeo de ids)

    // ---- simulación de lo que hace Stripe al pagar / reembolsar ----
    pay(sessionId, { async = false, country = 'ES', tax = 0 } = {}) {
      const s = sessions[sessionId];
      const pi = { id: id('pi'), object: 'payment_intent', amount: s.amount_total + tax, currency: s.currency, metadata: s.metadata, status: async ? 'processing' : 'succeeded',
        latest_charge: { id: id('ch'), balance_transaction: { fee: Math.round((s.amount_total + tax) * 0.015) + 25, net: s.amount_total + tax - (Math.round((s.amount_total + tax) * 0.015) + 25) } } };
      intents[pi.id] = pi;
      Object.assign(s, { payment_intent: pi.id, status: 'complete', payment_status: async ? 'unpaid' : 'paid', amount_total: s.amount_subtotal + tax, total_details: { amount_tax: tax }, customer_details: { address: { country } } });
      return this.event('checkout.session.completed', s);
    },
    asyncResult(sessionId, ok) {
      const s = sessions[sessionId]; s.payment_status = ok ? 'paid' : 'unpaid';
      return this.event(ok ? 'checkout.session.async_payment_succeeded' : 'checkout.session.async_payment_failed', s);
    },
    expire(sessionId) { const s = sessions[sessionId]; s.status = 'expired'; return this.event('checkout.session.expired', s); },
    refund(sessionId, amount) {
      const s = sessions[sessionId], pi = intents[s.payment_intent];
      const ch = { id: pi.latest_charge.id, object: 'charge', payment_intent: pi.id, amount: pi.amount, amount_refunded: Math.min(pi.amount, (pi.refunded || 0) + (amount == null ? pi.amount : amount)), currency: pi.currency, metadata: pi.metadata };
      pi.refunded = ch.amount_refunded;
      ch.refunds = { data: [{ id: id('re'), amount: ch.amount_refunded, reason: 'requested_by_customer' }] };
      return this.event('charge.refunded', ch);
    },
    dispute(sessionId, status = 'needs_response', disputeId = null) {
      const s = sessions[sessionId];
      const d = { id: disputeId || id('dp'), object: 'dispute', payment_intent: s.payment_intent, amount: s.amount_total, reason: 'fraudulent', status };
      return this.event(status === 'needs_response' ? 'charge.dispute.created' : 'charge.dispute.closed', d);
    },
    event(type, object, extra = {}) {
      return Object.assign({ id: id('evt'), object: 'event', type, created: ts(), livemode: false, api_version: 'test', data: { object: JSON.parse(JSON.stringify(object)) } }, extra);
    },
    // Serializa y firma como Stripe (lo que llega al endpoint)
    async signed(event, { secret = webhookSecret, timestamp = ts() } = {}) {
      const raw = JSON.stringify(event);
      return { raw, header: await signPayload(raw, secret, timestamp) };
    },
    sessions,
  };
  return api;
}
