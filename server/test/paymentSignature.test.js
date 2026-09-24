import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'
import { validPaymentSignature } from '../utils/paymentSignature.js'

test('accepts a valid Razorpay-style signature', () => {
  const signature = crypto.createHmac('sha256', 'test-secret').update('order_123|pay_123').digest('hex')
  assert.equal(validPaymentSignature('order_123', 'pay_123', signature, 'test-secret'), true)
})
test('rejects changed payment data', () => assert.equal(validPaymentSignature('order_123', 'pay_changed', 'abc', 'test-secret'), false))
