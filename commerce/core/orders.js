// Máquina de estados de una orden. Solo se permiten estas transiciones.
export const ORDER_STATES = ['CREATED', 'PENDING', 'PAID', 'FULFILLED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'REVOKED'];
export const TRANSITIONS = {
  CREATED: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
  PENDING: ['PAID', 'FAILED', 'CANCELLED', 'REFUNDED'],
  PAID: ['FULFILLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED'],
  FULFILLED: ['REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'REVOKED'],
  PARTIALLY_REFUNDED: ['REFUNDED', 'DISPUTED', 'REVOKED', 'PARTIALLY_REFUNDED'],
  DISPUTED: ['FULFILLED', 'REVOKED', 'REFUNDED', 'PAID'],   // PAID: disputa ganada de una orden que aún no se había entregado
  FAILED: ['PAID'],          // un pago asíncrono puede confirmarse tarde
  CANCELLED: ['PAID'],       // pago que llega después de expirar (raro): se registra y se entrega
  REFUNDED: [],
  REVOKED: [],
};
export const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);
export function fromStatesFor(to) { return ORDER_STATES.filter(s => canTransition(s, to)); }
