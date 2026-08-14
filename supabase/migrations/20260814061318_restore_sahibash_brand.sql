-- Restore the canonical product brand without overwriting a future custom name.
update public.site_settings
set site_name = 'Sahibash', updated_at = now()
where id = 1 and btrim(site_name) = 'Afghan';
