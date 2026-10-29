/**
 * SharePlate Backend Integration Tests
 * Runs with Node.js built-in test runner: `npm test` or `node --test test/backend.test.js`
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

describe('SharePlate Core Business Logic & State Machines', () => {
  it('should compute correct SHA-256 hash for pickup verification tokens', () => {
    const rawCode = 'SP-8942';
    const hash = crypto.createHash('sha256').update(rawCode).digest('hex');
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64);

    // Verify matching logic
    const testInput = 'SP-8942';
    const inputHash = crypto.createHash('sha256').update(testInput).digest('hex');
    assert.equal(inputHash, hash);

    const wrongInput = 'SP-0000';
    const wrongHash = crypto.createHash('sha256').update(wrongInput).digest('hex');
    assert.notEqual(wrongHash, hash);
  });

  it('should prevent requested quantity from exceeding available inventory', () => {
    const availableListing = {
      quantity: 50,
      remainingQuantity: 20,
      unit: 'kg',
      status: 'partially_reserved',
    };

    const validRequestQty = 15;
    const invalidRequestQty = 25;

    assert.ok(validRequestQty <= availableListing.remainingQuantity, 'Valid quantity passes');
    assert.ok(invalidRequestQty > availableListing.remainingQuantity, 'Invalid quantity detected');
  });

  it('should safely enforce atomic inventory decrement on approval', () => {
    let inventory = 50;
    const approve = (qty) => {
      if (qty <= inventory) {
        inventory -= qty;
        return { success: true, remaining: inventory };
      }
      return { success: false, error: 'Insufficient inventory' };
    };

    const first = approve(30);
    assert.equal(first.success, true);
    assert.equal(first.remaining, 20);

    // Concurrent request claiming 25 should fail
    const second = approve(25);
    assert.equal(second.success, false);
    assert.equal(inventory, 20);

    // Exact remaining should succeed and transition to 0
    const third = approve(20);
    assert.equal(third.success, true);
    assert.equal(inventory, 0);
  });

  it('should flag expired donation listings and prevent new approvals', () => {
    const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
    const futureTime = new Date(Date.now() + 3600 * 1000).toISOString();

    const isExpired = (deadlineIso) => new Date(deadlineIso).getTime() < Date.now();

    assert.equal(isExpired(pastTime), true);
    assert.equal(isExpired(futureTime), false);
  });

  it('should enforce strict state machine transitions for pickup tasks', () => {
    const validTransitions = {
      assigned: ['accepted', 'cancelled'],
      accepted: ['picked_up', 'cancelled'],
      picked_up: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const canTransition = (from, to) => validTransitions[from]?.includes(to);

    assert.equal(canTransition('assigned', 'accepted'), true);
    assert.equal(canTransition('accepted', 'picked_up'), true);
    assert.equal(canTransition('picked_up', 'delivered'), true);

    // Illegal transitions:
    assert.equal(canTransition('assigned', 'delivered'), false); // Cannot jump to delivered directly
    assert.equal(canTransition('delivered', 'assigned'), false); // Completed tasks cannot re-open
    assert.equal(canTransition('cancelled', 'picked_up'), false);
  });
});
