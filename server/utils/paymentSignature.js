import crypto from 'crypto'
export function validPaymentSignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex')
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
