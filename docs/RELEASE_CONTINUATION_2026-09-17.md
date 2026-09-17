# Release continuation — 17 September 2026

## Decision

**CONDITIONAL. Not unconditional launch approval.** This pass continues from deployed commit `aeb3f3443b7f19318d6d38f4bf3350c5ba46a2f3`. It does not manufacture inventory, change real customer records, weaken MFA, provision billable infrastructure or perform a payment.

## Draft-recovery correction

An executable test of the actual `QuickPostForm.readDraftNumber` function reproduced `null` becoming `0`. Both local and server draft restoration used that function for latitude, longitude and accuracy, and the publish form includes numeric zero. This was a remaining client-recovery gap despite earlier server/location work; previous broad statements about absent coordinates must not be read as proof that every recovery path was correct.

The fix rejects values other than numbers or nonblank strings before numeric conversion. Finite numbers and numeric strings, including legitimate zero, retain their existing behavior. Missing, blank, boolean, object, array and nonfinite values restore as absent. No draft content, location visibility, taxonomy, styling or database schema is changed.

The new tests execute production function bodies with in-memory dependencies, plus the actual message-thread helper. They do not initialize app SDK clients, read environment files, use browser storage, make network requests or write production fixtures. They are behavior tests, **not mounted React/browser E2E, live RLS or provider delivery evidence**.

## Partial photo-upload retry correction

The same executable orchestration tests and source inspection found that a successful first image followed by a failed second upload could be duplicated on retry: the old upload action generated another random path every time. Quick Post now sends its persisted staged-image ID as an optional retry key. Legacy callers without the key keep their existing behavior.

The server derives a namespaced UUID from authenticated uploader/listing/staged ID and binds the immutable storage path to a SHA-256 of the actual uploaded bytes. Authentication, image validation and listing ownership checks precede retry reuse. Only an exact persisted image/listing/path/public-URL match counts as a completed retry. Storage remains `upsert: false`; an explicit object collision requires readback and matching size/hash. A plain database INSERT preserves rollback of primary-image trigger effects on conflict; only an exact row match can turn a duplicate-key error into success. No overwrite, deletion, service-role bypass, schema change or production media test is introduced.

Live metadata at `2026-09-17T06:49:20.107528Z` confirmed the existing image primary key, unique storage path, unique primary-per-listing index, primary-image triggers and owner/admin-AAL2 RLS. A generic uniqueness conflict is not evidence of a completed upload. The strategy follows the provider's [immutable upload and collision behavior](https://supabase.com/docs/guides/storage/uploads/standard-uploads).

This fixes retries made by the updated Quick Post flow. It does not retroactively reconcile images uploaded before the fix, create an atomic transaction across Storage and PostgreSQL, delete orphan objects, or reconcile deliberate changes to the photo set after partially publishing. Those cases remain distinct from replaying an identical upload.

## Fresh production observations

- At `2026-09-17T06:39:28.662231Z`, the read-only database check found 56 listings and zero currently public, unexpired listings. Five fixture-like markers are not evidence that the accounts or records are disposable or under test control.
- Eight Auth users and one verified MFA factor remain. No credentials, factors, roles or profiles were changed.
- There are zero payment requests and zero promotions. The one active campaign still has the seeded placeholder destination, not a ready merchant destination. The deployed guard blocks paid requests; free posting is unaffected.
- Security Advisor returned **0 security notices** again. No database mutation was performed in this continuation.
- A fresh authenticated-dashboard navigation redirected to the login page. The prior successful AAL2/read-only browser checks remain dated evidence, not proof of a currently authenticated session. No login, MFA bypass, posting form, message/offer read receipt or notification-open mutation was attempted.

## Remaining gates and safe next actions

| Gate | Status and next action |
| --- | --- |
| Current legitimate inventory | BLOCKED: seller-submitted current ads or explicit seller renewals/source-specific rights are needed. Do not republish expired or rights-held ads to make the count look ready. |
| Controlled desktop/mobile journeys | PARTIAL: deterministic coverage and earlier read-only admin checks exist; complete two-account posting/recovery/chat/notification/contact flows require controlled non-production fixtures or clearly designated disposable test accounts/data. Preserve the existing unfinished production draft. |
| Paid Featured | BLOCKED for accepting payments: owner supplies and confirms the real merchant destination, then an authorized operator verifies settlement, receipt review, activation, expiry and refund operations. Do not invent a destination, fake proof or transfer money as a test without a specified payee/purpose/budget. |
| Disaster recovery | PARTIAL: encrypted DB and 705-object Storage exports passed readback, but there is no demonstrated isolated restore or off-machine key recovery. See the recovery runbook; existing exports predate the latest merchant-readiness migration. |
| Historical migration history | PARTIAL: 11 local/remote timestamp pairs require reconciliation. Eight compare equal after CRLF/outer-whitespace normalization; three have substantive differences. No blind ledger repair, replay or rename. |
| Editorial and operational checks | PARTIAL: native-editor EN/FA/PS approval, alert delivery and full provider/customer-journey evidence are not established by builds or static checks. SMS OTP remains deliberately deferred. |

## Validation

Validation of this focused patch is in progress. Final counts and deployment proof must be recorded before treating it as deployed.
