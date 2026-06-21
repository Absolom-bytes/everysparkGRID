# Firebase Security Specification (EverySpark App)

This document establishes the Attribute-Based Access Control (ABAC) invariants, the "Dirty Dozen" invalid payloads designed to compromise integrity or privacy, and outlines the test runner validating permission denials.

## 1. Data Invariants

- **Isolated Admin Ownership**: Any resource (Device, ComplianceCheck, SecurityCert, SystemLog) nested under `users/{userId}` is bound to and only editable or readable by the authenticated user matching `{userId}`.
- **Strict Format Controls**: Document IDs must be valid alphanumeric sequences less than or equal to 128 characters (`isValidId()`).
- **Required Fields Integrity**: Every document must conform exactly to its defined schema: No additional or "Ghost" fields are permitted.
- **Identity Matching**: Writing fields like `userId` must strictly match the `request.auth.uid`.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 malicious payloads designed to perform Privilege Escalation, Identity Spoofing, ID Poisoning, or Attribute Bypass:

1. **Privilege Escalation (Ghost Field injection)**: Injecting an unrequested admin flag inside student device schema.
2. **Identity Spoofing (Owner hijack)**: Creating a Device document under User A's subcollection but supplying User B's UID in the payload.
3. **Database Hijacking / Path Poisoning**: Attempting to query devices using a malformed, massive 1KB document name ID.
4. **Invalid Enumeration Option**: Updating a device's compliance status to an unsupported string like `"Compromised"`.
5. **Timestamp Forgery**: Submitting a pre-fabricated future or past timestamp string instead of enforcing server synchronization parameters.
6. **Missing Required Fields**: Attempting to upload a Device model with missing `studentId` or missing `hardwareId`.
7. **Cross-Tenant View Leakage**: Attempting a list query to read `users/{userId}/devices` as a spectator without passing the correct owner filter.
8. **Negative Rating Attack**: Creating an enrolled device with a negative complianceRating (e.g., `-999`).
9. **Resource Exhaustion Payload**: Attempting to upload a certificate common name featuring 2MB of junk text.
10. **State Shortcutting**: Skipping the "Pending" review phase of a compliance check and instantly writing terminal "Pass" directly with modified fields.
11. **Spoofed Log Levels**: Posting a system log containing a level like `"crit_auth"` that is not part of the standard `info | warn | success | error` enum.
12. **Certificate Expiration Immutability bypass**: Attempting to update a validated certificate's `expiresAt` or keys after issue.

---

## 3. Test Runner Definition

To verify security, the test suite executes these assertions against Local emulator environments, validating that all malicious attempts are safely blocked by `PERMISSION_DENIED`.

```typescript
// firestore.rules.test.ts placeholder representing compliance with Phase 0
describe('EverySpark ABAC rules verification', () => {
  it('Reject anonymous user write', async () => {
    // Expected Outcome: PERMISSION_DENIED
  });
  it('Reject foreign user subcollection write (Identity Spoofing)', async () => {
    // Expected Outcome: PERMISSION_DENIED
  });
  it('Reject write with missing required field size matches', async () => {
    // Expected Outcome: PERMISSION_DENIED
  });
});
```
