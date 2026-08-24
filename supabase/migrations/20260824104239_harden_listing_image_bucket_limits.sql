-- Harden the public listing image bucket with the same constraints enforced by
-- the application upload validator. This is non-destructive and does not move
-- or remove existing objects.
update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
where id = 'listing-images';
