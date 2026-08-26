"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash, randomUUID } from "node:crypto";
import { requirePermission, requireSuperAdministrator, requireUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePublicMarketplaceCache } from "@/lib/cache/public-cache";
import {
  FEATURED_CAMPAIGN_KEY,
  PAYMENT_RECEIPTS_BUCKET,
  type FeaturedCampaignConfig,
} from "@/lib/data/featured-payments";
import type { AppLocale } from "@/lib/i18n/translations";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_RECEIPT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

type NotificationType =
  | "featured_payment_review"
  | "featured_approved"
  | "featured_rejected";

function text(value: FormDataEntryValue | null, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

function uuid(value: FormDataEntryValue | null) {
  const candidate = String(value ?? "").trim();
  return UUID_PATTERN.test(candidate) ? candidate : "";
}

function normalizeLocale(value: unknown): AppLocale {
  return value === "en" || value === "ps" || value === "fa" ? value : "fa";
}

function receiptExtension(file: File) {
  return SAFE_RECEIPT_TYPES[file.type] ?? "";
}

function buildRequestIdempotencyKey(userId: string, listingId: string, configId: string) {
  return createHash("sha256")
    .update(`featured:${userId}:${listingId}:${configId}`)
    .digest("hex")
    .slice(0, 64);
}

function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createSupabaseAdmin();
}

function featuredPaymentReviewCopy(locale: AppLocale, listingTitle: string) {
  if (locale === "ps") {
    return {
      title: "د ځانګړي اعلان د تادیې نوې غوښتنه",
      body: `د «${listingTitle}» لپاره د HesabPay رسید د اډمین کتنې ته تیار دی.`,
    };
  }
  if (locale === "fa") {
    return {
      title: "درخواست تازه پرداخت اعلان ویژه",
      body: `رسید HesabPay برای «${listingTitle}» آماده بررسی ادمین است.`,
    };
  }
  return {
    title: "New Featured payment request",
    body: `A HesabPay receipt for “${listingTitle}” is ready for Admin review.`,
  };
}

function featuredApprovedCopy(locale: AppLocale, listingTitle: string, featuredUntil?: string | null) {
  const until = featuredUntil ? new Date(featuredUntil).toLocaleDateString(locale === "en" ? "en-US" : "fa-AF") : "";
  if (locale === "ps") {
    return {
      title: "ستاسو اعلان ځانګړی شو",
      body: `«${listingTitle}» تایید شو او د ځانګړي اعلان په توګه فعال دی${until ? ` تر ${until}` : ""}.`,
    };
  }
  if (locale === "fa") {
    return {
      title: "اعلان شما ویژه شد",
      body: `«${listingTitle}» تأیید شد و به عنوان اعلان ویژه فعال است${until ? ` تا ${until}` : ""}.`,
    };
  }
  return {
    title: "Your listing is now Featured",
    body: `“${listingTitle}” was approved and is active as a Featured listing${until ? ` until ${until}` : ""}.`,
  };
}

function featuredRejectedCopy(locale: AppLocale, listingTitle: string, reason: string) {
  if (locale === "ps") {
    return {
      title: "د ځانګړي اعلان رسید رد شو",
      body: `د «${listingTitle}» رسید رد شو. دلیل: ${reason}`,
    };
  }
  if (locale === "fa") {
    return {
      title: "رسید اعلان ویژه رد شد",
      body: `رسید «${listingTitle}» رد شد. دلیل: ${reason}`,
    };
  }
  return {
    title: "Featured receipt rejected",
    body: `The receipt for “${listingTitle}” was rejected. Reason: ${reason}`,
  };
}

async function insertNotification(args: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
}) {
  const admin = getAdminClient();
  if (!admin) return;

  await admin.from("notifications").insert({
    user_id: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    payload: args.payload,
  });
}

async function notifyAdminsForFeaturedReview(args: {
  requestId: string;
  listingId: string;
  listingTitle: string;
  amount: number;
  currency: string;
}) {
  const admin = getAdminClient();
  if (!admin) return;

  const { data: permissionRows } = await admin
    .from("admin_permissions")
    .select("id")
    .in("key", ["payments.view", "payments.review"]);
  const permissionIds = (permissionRows ?? []).map((row) => Number(row.id)).filter(Boolean);

  const { data: rolePermissions } = permissionIds.length
    ? await admin.from("admin_role_permissions").select("role_id").in("permission_id", permissionIds)
    : { data: [] };
  const roleIds = Array.from(new Set((rolePermissions ?? []).map((row) => Number(row.role_id)).filter(Boolean)));

  const { data: assignments } = roleIds.length
    ? await admin.from("admin_user_roles").select("user_id").in("role_id", roleIds)
    : { data: [] };
  const rbacUserIds = (assignments ?? []).map((row) => String(row.user_id)).filter(Boolean);

  const { data: legacyAdmins } = await admin.from("profiles").select("id").eq("role", "admin");
  const userIds = Array.from(new Set([...rbacUserIds, ...((legacyAdmins ?? []).map((row) => String(row.id)).filter(Boolean))]));
  if (userIds.length === 0) return;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, preferred_language")
    .in("id", userIds);

  const rows = (profiles ?? []).map((profile) => {
    const locale = normalizeLocale(profile.preferred_language);
    const copy = featuredPaymentReviewCopy(locale, args.listingTitle);
    return {
      user_id: String(profile.id),
      type: "featured_payment_review",
      title: copy.title,
      body: copy.body,
      payload: {
        admin_operational: true,
        module: "featured_payments",
        request_id: args.requestId,
        listing_id: args.listingId,
        amount: args.amount,
        currency: args.currency,
      },
    };
  });

  if (rows.length > 0) {
    await admin.from("notifications").insert(rows);
  }
}

async function notifySellerFeaturedResult(args: {
  userId: string;
  type: "featured_approved" | "featured_rejected";
  listingId: string;
  listingTitle: string;
  reason?: string;
  featuredUntil?: string | null;
}) {
  const admin = getAdminClient();
  if (!admin) return;

  const [{ data: profile }, { data: preferences }] = await Promise.all([
    admin.from("profiles").select("preferred_language").eq("id", args.userId).maybeSingle(),
    admin.from("notification_preferences").select("listing_moderation, locale").eq("user_id", args.userId).maybeSingle(),
  ]);

  if (preferences?.listing_moderation === false) return;

  const locale = normalizeLocale(preferences?.locale ?? profile?.preferred_language);
  const copy =
    args.type === "featured_approved"
      ? featuredApprovedCopy(locale, args.listingTitle, args.featuredUntil)
      : featuredRejectedCopy(locale, args.listingTitle, args.reason ?? "");

  await insertNotification({
    userId: args.userId,
    type: args.type,
    title: copy.title,
    body: copy.body,
    payload: {
      listing_id: args.listingId,
      module: "featured_payments",
      featured_until: args.featuredUntil ?? null,
    },
  });
}

async function getActiveConfig(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase
    .from("promotion_campaign_configs")
    .select("*")
    .eq("key", FEATURED_CAMPAIGN_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as FeaturedCampaignConfig;
}

export async function requestFeaturedPromotionAction(listingId: string) {
  const user = await requireUser();
  if (!UUID_PATTERN.test(listingId)) {
    redirect("/dashboard/my-ads?featured=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, user_id, title, status, featured, featured_until, publication_status")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing || listing.user_id !== user.id) {
    redirect("/dashboard/my-ads?featured=unauthorized");
  }

  if (!["pending", "approved"].includes(String(listing.status))) {
    redirect(`/listings/${listingId}/manage?featured=listing-status`);
  }

  const featuredUntil = typeof listing.featured_until === "string" ? new Date(listing.featured_until) : null;
  if (listing.featured && (!featuredUntil || featuredUntil > new Date())) {
    redirect(`/listings/${listingId}/manage?featured=already-active`);
  }

  const config = await getActiveConfig(supabase);
  if (!config) {
    redirect(`/listings/${listingId}/manage?featured=not-configured`);
  }

  const { data: existing } = await supabase
    .from("promotion_payment_requests")
    .select("id, status")
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .eq("promotion_type", "featured")
    .in("status", ["pending_payment", "pending_review"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing?.[0]) {
    redirect(`/listings/${listingId}/manage?featured=${existing[0].status}`);
  }

  const idempotencyKey = buildRequestIdempotencyKey(user.id, listingId, config.id);
  const { error } = await supabase.from("promotion_payment_requests").insert({
    listing_id: listingId,
    user_id: user.id,
    promotion_type: "featured",
    campaign_config_id: config.id,
    amount: config.amount,
    currency: config.currency,
    provider: config.provider,
    payment_method: config.payment_method,
    merchant_reference: config.merchant_reference,
    status: "pending_payment",
    idempotency_key: idempotencyKey,
  });

  if (error && error.code !== "23505") {
    throw new Error("Unable to create Featured payment request.");
  }

  revalidatePath("/dashboard/my-ads");
  revalidatePath(`/listings/${listingId}/manage`);
  redirect(`/listings/${listingId}/manage?featured=requested`);
}

export async function submitFeaturedPaymentProofAction(formData: FormData) {
  const user = await requireUser();
  const requestId = uuid(formData.get("request_id"));
  const transactionReference = text(formData.get("transaction_reference"), 240);
  const receipt = formData.get("receipt");

  if (!requestId) {
    redirect("/dashboard/my-ads?featured=invalid-request");
  }

  const supabase = await createSupabaseServerClient();
  const { data: request, error: requestError } = await supabase
    .from("promotion_payment_requests")
    .select("id, listing_id, user_id, status, amount, currency")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request || request.user_id !== user.id) {
    redirect("/dashboard/my-ads?featured=unauthorized");
  }

  const listingId = String(request.listing_id);
  if (!["pending_payment", "rejected"].includes(String(request.status))) {
    redirect(`/listings/${listingId}/manage?featured=not-editable`);
  }

  let receiptStoragePath: string | null = null;
  let receiptMimeType: string | null = null;
  let receiptFileSize: number | null = null;

  if (receipt instanceof File && receipt.size > 0) {
    const extension = receiptExtension(receipt);
    if (!extension || receipt.size > MAX_RECEIPT_BYTES) {
      redirect(`/listings/${listingId}/manage?featured=receipt-invalid`);
    }

    receiptMimeType = receipt.type;
    receiptFileSize = receipt.size;
    receiptStoragePath = `${user.id}/${requestId}/${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PAYMENT_RECEIPTS_BUCKET)
      .upload(receiptStoragePath, receipt, {
        contentType: receipt.type,
        cacheControl: "private, max-age=0",
        upsert: false,
      });

    if (uploadError) {
      throw new Error("Unable to upload payment receipt.");
    }
  }

  if (!receiptStoragePath && transactionReference.length < 3) {
    redirect(`/listings/${listingId}/manage?featured=proof-required`);
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("title")
    .eq("id", listingId)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from("promotion_payment_requests")
    .update({
      status: "pending_review",
      submitted_at: new Date().toISOString(),
      transaction_reference: transactionReference || null,
      receipt_storage_path: receiptStoragePath,
      receipt_mime_type: receiptMimeType,
      receipt_file_size: receiptFileSize,
    })
    .eq("id", requestId);

  if (updateError) {
    throw new Error("Unable to submit Featured payment proof.");
  }

  await notifyAdminsForFeaturedReview({
    requestId,
    listingId,
    listingTitle: String(listing?.title ?? "Listing"),
    amount: Number(request.amount ?? 0),
    currency: String(request.currency ?? "AFN"),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/featured-payments");
  revalidatePath("/dashboard/my-ads");
  revalidatePath(`/listings/${listingId}/manage`);
  redirect(`/listings/${listingId}/manage?featured=submitted`);
}

export async function adminApproveFeaturedPaymentRequestAction(formData: FormData) {
  const adminUser = await requirePermission("payments.review");
  const requestId = uuid(formData.get("request_id"));
  const adminNote = text(formData.get("admin_note"), 2000);
  if (!requestId) {
    redirect("/admin/featured-payments?review=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data: request } = await supabase
    .from("promotion_payment_requests")
    .select("id, listing_id, user_id, amount, currency")
    .eq("id", requestId)
    .maybeSingle();

  const { data: rpcResult, error } = await supabase.rpc("approve_featured_payment_request", {
    p_request_id: requestId,
    p_admin_note: adminNote || null,
  });

  if (error) {
    throw new Error("Unable to approve Featured payment request.");
  }

  const approvedRow = Array.isArray(rpcResult) ? rpcResult[0] : null;
  const featuredUntil = typeof approvedRow?.featured_until === "string" ? approvedRow.featured_until : null;
  const listingId = String(request?.listing_id ?? "");
  const sellerId = String(request?.user_id ?? "");

  let listingTitle = "Listing";
  if (listingId) {
    const { data: listing } = await supabase.from("listings").select("title").eq("id", listingId).maybeSingle();
    listingTitle = String(listing?.title ?? listingTitle);
  }

  await recordAuditEvent({
    adminUserId: adminUser.id,
    action: "FEATURED_PAYMENT_APPROVED",
    entityType: "promotion_payment_request",
    entityId: requestId,
    safeChanges: {
      listing_id: listingId,
      amount: request?.amount ?? null,
      currency: request?.currency ?? null,
      featured_until: featuredUntil,
    },
  });

  if (sellerId && listingId) {
    await notifySellerFeaturedResult({
      userId: sellerId,
      type: "featured_approved",
      listingId,
      listingTitle,
      featuredUntil,
    });
  }

  revalidatePublicMarketplaceCache(listingId || undefined);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/featured-payments");
  revalidatePath("/dashboard/my-ads");
  if (listingId) {
    revalidatePath(`/listings/${listingId}`);
    revalidatePath(`/listings/${listingId}/manage`);
  }
  redirect("/admin/featured-payments?review=approved");
}

export async function adminRejectFeaturedPaymentRequestAction(formData: FormData) {
  const adminUser = await requirePermission("payments.review");
  const requestId = uuid(formData.get("request_id"));
  const reason = text(formData.get("rejection_reason"), 2000);
  const adminNote = text(formData.get("admin_note"), 2000);
  if (!requestId || reason.length < 3) {
    redirect("/admin/featured-payments?review=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data: request } = await supabase
    .from("promotion_payment_requests")
    .select("id, listing_id, user_id, amount, currency")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await supabase.rpc("reject_featured_payment_request", {
    p_request_id: requestId,
    p_rejection_reason: reason,
    p_admin_note: adminNote || null,
  });

  if (error) {
    throw new Error("Unable to reject Featured payment request.");
  }

  const listingId = String(request?.listing_id ?? "");
  const sellerId = String(request?.user_id ?? "");
  let listingTitle = "Listing";
  if (listingId) {
    const { data: listing } = await supabase.from("listings").select("title").eq("id", listingId).maybeSingle();
    listingTitle = String(listing?.title ?? listingTitle);
  }

  await recordAuditEvent({
    adminUserId: adminUser.id,
    action: "FEATURED_PAYMENT_REJECTED",
    entityType: "promotion_payment_request",
    entityId: requestId,
    safeChanges: {
      listing_id: listingId,
      amount: request?.amount ?? null,
      currency: request?.currency ?? null,
      reason_code: "manual_payment_review_rejected",
    },
  });

  if (sellerId && listingId) {
    await notifySellerFeaturedResult({
      userId: sellerId,
      type: "featured_rejected",
      listingId,
      listingTitle,
      reason,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/featured-payments");
  revalidatePath("/dashboard/my-ads");
  if (listingId) {
    revalidatePath(`/listings/${listingId}/manage`);
  }
  redirect("/admin/featured-payments?review=rejected");
}

export async function updateFeaturedCampaignConfigAction(formData: FormData) {
  const superAdmin = await requireSuperAdministrator();
  const amount = Number(formData.get("amount"));
  const durationDays = Number(formData.get("duration_days"));
  const paymentMethod = text(formData.get("payment_method"), 120);
  const merchantReference = text(formData.get("merchant_reference"), 240);
  const instructionsEn = text(formData.get("instructions_en"), 2000);
  const instructionsFa = text(formData.get("instructions_fa"), 2000);
  const instructionsPs = text(formData.get("instructions_ps"), 2000);

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
    redirect("/administrator/promotions?config=invalid-amount");
  }
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) {
    redirect("/administrator/promotions?config=invalid-duration");
  }
  if (!instructionsEn || !instructionsFa || !instructionsPs) {
    redirect("/administrator/promotions?config=missing-instructions");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("promotion_campaign_configs")
    .update({
      amount,
      duration_days: durationDays,
      payment_method: paymentMethod || null,
      merchant_reference: merchantReference || null,
      instructions_en: instructionsEn,
      instructions_fa: instructionsFa,
      instructions_ps: instructionsPs,
      updated_by: superAdmin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", FEATURED_CAMPAIGN_KEY);

  if (error) {
    throw new Error("Unable to update Featured campaign configuration.");
  }

  await recordAuditEvent({
    adminUserId: superAdmin.id,
    action: "FEATURED_PROMOTION_CONFIG_UPDATED",
    entityType: "promotion_campaign_config",
    entityId: FEATURED_CAMPAIGN_KEY,
    safeChanges: {
      amount,
      currency: "AFN",
      duration_days: durationDays,
      provider: "HesabPay",
      payment_method_configured: Boolean(paymentMethod),
      merchant_reference_configured: Boolean(merchantReference),
    },
  });

  revalidatePath("/administrator/promotions");
  revalidatePath("/admin/featured-payments");
  redirect("/administrator/promotions?config=saved");
}
