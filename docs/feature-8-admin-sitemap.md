# Feature 8: Admin and disputes — draft sitemap

This is the first planning slice for Feature 8. It follows the OjaLink team plan while leaving page URLs unassigned until the Project lead and Feature 10 owner confirm them.

| Area | Page purpose | Main action | Confirmed route |
|---|---|---|---|
| Vendor approvals | Review vendors waiting for approval. | Approve or reject a pending vendor. | To confirm |
| Disputes | Find and review open disputes. | Open a dispute record. | To confirm |
| Dispute detail | Review the order, reported reason, and resolution note. | Resolve the dispute or request a full refund. | To confirm |
| Users | Find and inspect user accounts. This area is read-only. | Open a user record. | To confirm |
| Platform stats | Review platform activity using existing data. | Review the agreed summary metrics. | To confirm |

## Current data limits

- The checked-in vendor approval statuses are `pending`, `approved`, and `rejected`.
- The checked-in dispute statuses are `open`, `resolved`, and `refunded`; the record has a resolution note.
- The checked-in schema does not contain `refund_kobo` or a refunded order/payment status. Do not add fields or status values for Feature 8.
- Money is stored as integer kobo and should be shown to users as naira.
- Feature 8 will only request a full Paystack TEST refund through Feature 3's shared helper after its exact interface and duplicate-refund behavior are confirmed. Mark a dispute as refunded only after that helper confirms success.

## Required confirmations before app pages or actions

- Project lead and Feature 10 owner: confirm exact URLs and server-side session/admin guard exports.
- Feature 3 owner: provide the shared test-mode refund helper's path, signature, result shape, and duplicate/idempotency behavior.
- Feature 6 owner: define how a refunded order affects vendor payouts, including already-paid-out orders and fee handling.
- Project lead: confirm which summary metrics belong on Platform stats.

This document records the planning draft only. It does not create routes, authorize actions, or change the shared database schema.
