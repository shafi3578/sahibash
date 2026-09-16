type PublicLocationQuery<T> = {
  eq: (column: string, value: string | boolean) => T;
  gt: (column: string, value: number) => T;
  is: (column: string, value: null) => T;
  or: (filters: string) => T;
};

/** Apply before executing any service-role query used by public location actions.
 * The select must include category:category_id!inner(is_active,is_coming_soon).
 */
export function applyPublicLocationVisibility<T>(query: T, now: Date = new Date()): T {
  let next = query as T & PublicLocationQuery<T>;
  next = next.eq('status', 'approved') as typeof next;
  next = next.gt('price', 0) as typeof next;
  next = next.or('publication_status.is.null,publication_status.eq.published') as typeof next;
  next = next.is('removed_public_at', null) as typeof next;
  next = next.or('freshness_status.is.null,freshness_status.not.in.(expired,source_missing,sold_confirmed)') as typeof next;
  next = next.or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`) as typeof next;
  next = next.eq('category.is_active', true) as typeof next;
  next = next.eq('category.is_coming_soon', false) as typeof next;
  return next;
}
