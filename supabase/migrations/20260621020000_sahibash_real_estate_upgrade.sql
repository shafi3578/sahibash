-- Sahibash V8: Afghanistan real-estate taxonomy, posting fields, and search RPC

begin;

insert into public.categories (name, slug, description, display_order, is_active)
values (
  'Real Estate',
  'real-estate',
  'Residential, commercial, land, dormitory, and project listings for Afghanistan.',
  1,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  updated_at = now();

do $$
declare
  v_category_id bigint;
  v_root_id bigint;
  rec record;
  v_parent_path text;
  v_parent_id bigint;
  v_level int;
  v_node_id bigint;
  field_rec record;
begin
  select id into v_category_id
  from public.categories
  where slug = 'real-estate'
  limit 1;

  if v_category_id is null then
    raise exception 'Real Estate category not found';
  end if;

  create temporary table tmp_real_estate_nodes (
    path text primary key,
    name text not null,
    description text,
    icon text,
    sort_order int not null,
    is_active boolean not null default true
  ) on commit drop;

  insert into tmp_real_estate_nodes (path, name, description, icon, sort_order, is_active)
  values
    ('real-estate', 'Real Estate', 'Properties for sale, rent, lease, and project investment.', 'home', 1, true),

    ('real-estate/residential', 'Residential', 'Homes and living spaces across Afghanistan.', 'building', 1, true),
    ('real-estate/residential/for-sale', 'For Sale', 'Residential properties for direct sale.', 'tag', 1, true),
    ('real-estate/residential/for-sale/apartment', 'Apartment', 'Apartments for sale.', 'building', 1, true),
    ('real-estate/residential/for-sale/house', 'House', 'Houses for sale.', 'home', 2, true),
    ('real-estate/residential/for-sale/villa', 'Villa', 'Villas for sale.', 'home', 3, true),
    ('real-estate/residential/for-sale/duplex', 'Duplex', 'Duplex units for sale.', 'home', 4, true),
    ('real-estate/residential/for-sale/traditional-house', 'Traditional House', 'Traditional style homes for sale.', 'home', 5, true),
    ('real-estate/residential/for-sale/compound', 'Compound', 'Compounds for sale.', 'home', 6, true),

    ('real-estate/residential/for-rent', 'For Rent', 'Monthly or yearly rental homes.', 'key', 2, true),
    ('real-estate/residential/for-rent/apartment', 'Apartment', 'Apartments for rent.', 'building', 1, true),
    ('real-estate/residential/for-rent/house', 'House', 'Houses for rent.', 'home', 2, true),
    ('real-estate/residential/for-rent/villa', 'Villa', 'Villas for rent.', 'home', 3, true),
    ('real-estate/residential/for-rent/room', 'Room', 'Rooms for rent.', 'door-open', 4, true),
    ('real-estate/residential/for-rent/traditional-house', 'Traditional House', 'Traditional style homes for rent.', 'home', 5, true),
    ('real-estate/residential/for-rent/compound', 'Compound', 'Compounds for rent.', 'home', 6, true),

    ('real-estate/residential/gerawy-rahn', 'Gerawy / Rahn', 'Refundable advance based occupancy.', 'shield', 3, true),
    ('real-estate/residential/gerawy-rahn/apartment', 'Apartment', 'Apartment on gerawy / rahn.', 'building', 1, true),
    ('real-estate/residential/gerawy-rahn/house', 'House', 'House on gerawy / rahn.', 'home', 2, true),
    ('real-estate/residential/gerawy-rahn/villa', 'Villa', 'Villa on gerawy / rahn.', 'home', 3, true),
    ('real-estate/residential/gerawy-rahn/room', 'Room', 'Room on gerawy / rahn.', 'door-open', 4, true),
    ('real-estate/residential/gerawy-rahn/traditional-house', 'Traditional House', 'Traditional house on gerawy / rahn.', 'home', 5, true),
    ('real-estate/residential/gerawy-rahn/compound', 'Compound', 'Compound on gerawy / rahn.', 'home', 6, true),

    ('real-estate/residential/gerawy-monthly-rent', 'Gerawy + Monthly Rent', 'Advance plus monthly rent.', 'wallet', 4, true),
    ('real-estate/residential/gerawy-monthly-rent/apartment', 'Apartment', 'Apartment on gerawy + monthly rent.', 'building', 1, true),
    ('real-estate/residential/gerawy-monthly-rent/house', 'House', 'House on gerawy + monthly rent.', 'home', 2, true),
    ('real-estate/residential/gerawy-monthly-rent/villa', 'Villa', 'Villa on gerawy + monthly rent.', 'home', 3, true),
    ('real-estate/residential/gerawy-monthly-rent/room', 'Room', 'Room on gerawy + monthly rent.', 'door-open', 4, true),
    ('real-estate/residential/gerawy-monthly-rent/traditional-house', 'Traditional House', 'Traditional house on gerawy + monthly rent.', 'home', 5, true),
    ('real-estate/residential/gerawy-monthly-rent/compound', 'Compound', 'Compound on gerawy + monthly rent.', 'home', 6, true),

    ('real-estate/residential/short-term-rent', 'Short-Term Rent', 'Daily, weekly, and furnished monthly rentals.', 'calendar', 5, true),
    ('real-estate/residential/short-term-rent/daily-rental', 'Daily Rental', 'Short stay daily rentals.', 'calendar-day', 1, true),
    ('real-estate/residential/short-term-rent/weekly-rental', 'Weekly Rental', 'Short stay weekly rentals.', 'calendar-week', 2, true),
    ('real-estate/residential/short-term-rent/monthly-furnished-rental', 'Monthly Furnished Rental', 'Fully furnished monthly rentals.', 'sofa', 3, true),

    ('real-estate/commercial', 'Commercial', 'Business and industrial properties.', 'store', 2, true),
    ('real-estate/commercial/for-sale', 'For Sale', 'Commercial properties for sale.', 'tag', 1, true),
    ('real-estate/commercial/for-sale/shop', 'Shop', 'Shops for sale.', 'store', 1, true),
    ('real-estate/commercial/for-sale/office', 'Office', 'Offices for sale.', 'briefcase', 2, true),
    ('real-estate/commercial/for-sale/warehouse', 'Warehouse', 'Warehouses for sale.', 'warehouse', 3, true),
    ('real-estate/commercial/for-sale/restaurant', 'Restaurant', 'Restaurants for sale.', 'utensils', 4, true),
    ('real-estate/commercial/for-sale/hotel', 'Hotel', 'Hotels for sale.', 'hotel', 5, true),
    ('real-estate/commercial/for-sale/factory', 'Factory', 'Factories for sale.', 'factory', 6, true),
    ('real-estate/commercial/for-sale/workshop', 'Workshop', 'Workshops for sale.', 'wrench', 7, true),

    ('real-estate/commercial/for-rent', 'For Rent', 'Commercial properties for rent.', 'key', 2, true),
    ('real-estate/commercial/for-rent/shop', 'Shop', 'Shops for rent.', 'store', 1, true),
    ('real-estate/commercial/for-rent/office', 'Office', 'Offices for rent.', 'briefcase', 2, true),
    ('real-estate/commercial/for-rent/warehouse', 'Warehouse', 'Warehouses for rent.', 'warehouse', 3, true),
    ('real-estate/commercial/for-rent/restaurant', 'Restaurant', 'Restaurants for rent.', 'utensils', 4, true),
    ('real-estate/commercial/for-rent/hotel', 'Hotel', 'Hotels for rent.', 'hotel', 5, true),
    ('real-estate/commercial/for-rent/factory', 'Factory', 'Factories for rent.', 'factory', 6, true),
    ('real-estate/commercial/for-rent/workshop', 'Workshop', 'Workshops for rent.', 'wrench', 7, true),

    ('real-estate/commercial/gerawy-rahn', 'Gerawy / Rahn', 'Commercial refundable advance occupancy.', 'shield', 3, true),
    ('real-estate/commercial/gerawy-rahn/shop', 'Shop', 'Shop on gerawy / rahn.', 'store', 1, true),
    ('real-estate/commercial/gerawy-rahn/office', 'Office', 'Office on gerawy / rahn.', 'briefcase', 2, true),
    ('real-estate/commercial/gerawy-rahn/warehouse', 'Warehouse', 'Warehouse on gerawy / rahn.', 'warehouse', 3, true),
    ('real-estate/commercial/gerawy-rahn/restaurant', 'Restaurant', 'Restaurant on gerawy / rahn.', 'utensils', 4, true),
    ('real-estate/commercial/gerawy-rahn/hotel', 'Hotel', 'Hotel on gerawy / rahn.', 'hotel', 5, true),
    ('real-estate/commercial/gerawy-rahn/factory', 'Factory', 'Factory on gerawy / rahn.', 'factory', 6, true),
    ('real-estate/commercial/gerawy-rahn/workshop', 'Workshop', 'Workshop on gerawy / rahn.', 'wrench', 7, true),

    ('real-estate/commercial/gerawy-monthly-rent', 'Gerawy + Monthly Rent', 'Commercial advance plus monthly rent.', 'wallet', 4, true),
    ('real-estate/commercial/gerawy-monthly-rent/shop', 'Shop', 'Shop on gerawy + monthly rent.', 'store', 1, true),
    ('real-estate/commercial/gerawy-monthly-rent/office', 'Office', 'Office on gerawy + monthly rent.', 'briefcase', 2, true),
    ('real-estate/commercial/gerawy-monthly-rent/warehouse', 'Warehouse', 'Warehouse on gerawy + monthly rent.', 'warehouse', 3, true),
    ('real-estate/commercial/gerawy-monthly-rent/restaurant', 'Restaurant', 'Restaurant on gerawy + monthly rent.', 'utensils', 4, true),
    ('real-estate/commercial/gerawy-monthly-rent/hotel', 'Hotel', 'Hotel on gerawy + monthly rent.', 'hotel', 5, true),
    ('real-estate/commercial/gerawy-monthly-rent/factory', 'Factory', 'Factory on gerawy + monthly rent.', 'factory', 6, true),
    ('real-estate/commercial/gerawy-monthly-rent/workshop', 'Workshop', 'Workshop on gerawy + monthly rent.', 'wrench', 7, true),

    ('real-estate/land', 'Land', 'Land plots for sale and lease.', 'map', 3, true),
    ('real-estate/land/for-sale', 'For Sale', 'Land for sale.', 'tag', 1, true),
    ('real-estate/land/for-sale/residential-land', 'Residential Land', 'Residential land plots.', 'map', 1, true),
    ('real-estate/land/for-sale/commercial-land', 'Commercial Land', 'Commercial land plots.', 'map', 2, true),
    ('real-estate/land/for-sale/agricultural-land', 'Agricultural Land', 'Agricultural land plots.', 'leaf', 3, true),
    ('real-estate/land/for-sale/garden', 'Garden', 'Garden land plots.', 'leaf', 4, true),
    ('real-estate/land/for-sale/farm', 'Farm', 'Farm land plots.', 'leaf', 5, true),

    ('real-estate/land/for-lease', 'For Lease', 'Land for lease.', 'key', 2, true),
    ('real-estate/land/for-lease/agricultural-land', 'Agricultural Land', 'Agricultural land lease.', 'leaf', 1, true),
    ('real-estate/land/for-lease/garden', 'Garden', 'Garden lease.', 'leaf', 2, true),
    ('real-estate/land/for-lease/farm', 'Farm', 'Farm lease.', 'leaf', 3, true),

    ('real-estate/student-accommodation-dormitories', 'Student Accommodation / Dormitories', 'Student and shared living options.', 'users', 4, true),
    ('real-estate/student-accommodation-dormitories/male-dormitory', 'Male Dormitory', 'Dormitory for male students.', 'bed', 1, true),
    ('real-estate/student-accommodation-dormitories/female-dormitory', 'Female Dormitory', 'Dormitory for female students.', 'bed', 2, true),
    ('real-estate/student-accommodation-dormitories/private-dormitory', 'Private Dormitory', 'Private dormitory options.', 'bed', 3, true),
    ('real-estate/student-accommodation-dormitories/university-dormitory', 'University Dormitory', 'University-managed dormitory.', 'school', 4, true),
    ('real-estate/student-accommodation-dormitories/shared-apartment', 'Shared Apartment', 'Shared apartment for students.', 'building', 5, true),
    ('real-estate/student-accommodation-dormitories/shared-room', 'Shared Room', 'Shared room arrangement.', 'door-open', 6, true),
    ('real-estate/student-accommodation-dormitories/family-room', 'Family Room', 'Family-compatible room.', 'home', 7, true),

    ('real-estate/property-projects', 'Property Projects', 'New real-estate development projects.', 'city', 5, true),
    ('real-estate/property-projects/new-apartment-projects', 'New Apartment Projects', 'Upcoming and newly launched apartment projects.', 'building', 1, true),
    ('real-estate/property-projects/new-housing-projects', 'New Housing Projects', 'New housing and township projects.', 'home', 2, true),
    ('real-estate/property-projects/commercial-projects', 'Commercial Projects', 'New commercial development projects.', 'store', 3, true);

  for rec in
    select *
    from tmp_real_estate_nodes
    order by array_length(string_to_array(path, '/'), 1), sort_order, path
  loop
    v_level := array_length(string_to_array(rec.path, '/'), 1);

    if v_level = 1 then
      v_parent_id := null;
    else
      v_parent_path := regexp_replace(rec.path, '/[^/]+$', '');
      select id into v_parent_id
      from public.category_nodes
      where path = v_parent_path
      limit 1;
    end if;

    insert into public.category_nodes (
      category_id,
      parent_id,
      name,
      slug,
      description,
      icon,
      level,
      path,
      display_order,
      sort_order,
      is_active,
      is_leaf
    )
    values (
      v_category_id,
      v_parent_id,
      rec.name,
      split_part(rec.path, '/', v_level),
      rec.description,
      rec.icon,
      v_level,
      rec.path,
      rec.sort_order,
      rec.sort_order,
      rec.is_active,
      false
    )
    on conflict (path) do update
    set
      category_id = excluded.category_id,
      parent_id = excluded.parent_id,
      name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      icon = excluded.icon,
      level = excluded.level,
      display_order = excluded.display_order,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active,
      updated_at = now();
  end loop;

  update public.category_nodes n
  set is_active = false,
      updated_at = now()
  where n.category_id = v_category_id
    and n.path like 'real-estate/%'
    and not exists (
      select 1 from tmp_real_estate_nodes s where s.path = n.path
    );

  create temporary table tmp_field_targets (
    category_path text primary key,
    profile text not null
  ) on commit drop;

  insert into tmp_field_targets(category_path, profile)
  values
    ('real-estate/residential/for-sale/apartment', 'res_sale'),
    ('real-estate/residential/for-sale/house', 'res_sale'),
    ('real-estate/residential/for-sale/villa', 'res_sale'),
    ('real-estate/residential/for-sale/duplex', 'res_sale'),
    ('real-estate/residential/for-sale/traditional-house', 'res_sale'),
    ('real-estate/residential/for-sale/compound', 'res_sale'),

    ('real-estate/residential/for-rent/apartment', 'res_rent'),
    ('real-estate/residential/for-rent/house', 'res_rent'),
    ('real-estate/residential/for-rent/villa', 'res_rent'),
    ('real-estate/residential/for-rent/room', 'res_rent'),
    ('real-estate/residential/for-rent/traditional-house', 'res_rent'),
    ('real-estate/residential/for-rent/compound', 'res_rent'),

    ('real-estate/residential/gerawy-rahn/apartment', 'res_gerawy'),
    ('real-estate/residential/gerawy-rahn/house', 'res_gerawy'),
    ('real-estate/residential/gerawy-rahn/villa', 'res_gerawy'),
    ('real-estate/residential/gerawy-rahn/room', 'res_gerawy'),
    ('real-estate/residential/gerawy-rahn/traditional-house', 'res_gerawy'),
    ('real-estate/residential/gerawy-rahn/compound', 'res_gerawy'),

    ('real-estate/residential/gerawy-monthly-rent/apartment', 'res_gerawy_rent'),
    ('real-estate/residential/gerawy-monthly-rent/house', 'res_gerawy_rent'),
    ('real-estate/residential/gerawy-monthly-rent/villa', 'res_gerawy_rent'),
    ('real-estate/residential/gerawy-monthly-rent/room', 'res_gerawy_rent'),
    ('real-estate/residential/gerawy-monthly-rent/traditional-house', 'res_gerawy_rent'),
    ('real-estate/residential/gerawy-monthly-rent/compound', 'res_gerawy_rent'),

    ('real-estate/residential/short-term-rent/daily-rental', 'res_short_term'),
    ('real-estate/residential/short-term-rent/weekly-rental', 'res_short_term'),
    ('real-estate/residential/short-term-rent/monthly-furnished-rental', 'res_short_term'),

    ('real-estate/commercial/for-sale/shop', 'com_sale'),
    ('real-estate/commercial/for-sale/office', 'com_sale'),
    ('real-estate/commercial/for-sale/warehouse', 'com_sale'),
    ('real-estate/commercial/for-sale/restaurant', 'com_sale'),
    ('real-estate/commercial/for-sale/hotel', 'com_sale'),
    ('real-estate/commercial/for-sale/factory', 'com_sale'),
    ('real-estate/commercial/for-sale/workshop', 'com_sale'),

    ('real-estate/commercial/for-rent/shop', 'com_rent'),
    ('real-estate/commercial/for-rent/office', 'com_rent'),
    ('real-estate/commercial/for-rent/warehouse', 'com_rent'),
    ('real-estate/commercial/for-rent/restaurant', 'com_rent'),
    ('real-estate/commercial/for-rent/hotel', 'com_rent'),
    ('real-estate/commercial/for-rent/factory', 'com_rent'),
    ('real-estate/commercial/for-rent/workshop', 'com_rent'),

    ('real-estate/commercial/gerawy-rahn/shop', 'com_gerawy'),
    ('real-estate/commercial/gerawy-rahn/office', 'com_gerawy'),
    ('real-estate/commercial/gerawy-rahn/warehouse', 'com_gerawy'),
    ('real-estate/commercial/gerawy-rahn/restaurant', 'com_gerawy'),
    ('real-estate/commercial/gerawy-rahn/hotel', 'com_gerawy'),
    ('real-estate/commercial/gerawy-rahn/factory', 'com_gerawy'),
    ('real-estate/commercial/gerawy-rahn/workshop', 'com_gerawy'),

    ('real-estate/commercial/gerawy-monthly-rent/shop', 'com_gerawy_rent'),
    ('real-estate/commercial/gerawy-monthly-rent/office', 'com_gerawy_rent'),
    ('real-estate/commercial/gerawy-monthly-rent/warehouse', 'com_gerawy_rent'),
    ('real-estate/commercial/gerawy-monthly-rent/restaurant', 'com_gerawy_rent'),
    ('real-estate/commercial/gerawy-monthly-rent/hotel', 'com_gerawy_rent'),
    ('real-estate/commercial/gerawy-monthly-rent/factory', 'com_gerawy_rent'),
    ('real-estate/commercial/gerawy-monthly-rent/workshop', 'com_gerawy_rent'),

    ('real-estate/land/for-sale/residential-land', 'land_sale'),
    ('real-estate/land/for-sale/commercial-land', 'land_sale'),
    ('real-estate/land/for-sale/agricultural-land', 'land_sale'),
    ('real-estate/land/for-sale/garden', 'land_sale'),
    ('real-estate/land/for-sale/farm', 'land_sale'),

    ('real-estate/land/for-lease/agricultural-land', 'land_lease'),
    ('real-estate/land/for-lease/garden', 'land_lease'),
    ('real-estate/land/for-lease/farm', 'land_lease'),

    ('real-estate/student-accommodation-dormitories/male-dormitory', 'dorm'),
    ('real-estate/student-accommodation-dormitories/female-dormitory', 'dorm'),
    ('real-estate/student-accommodation-dormitories/private-dormitory', 'dorm'),
    ('real-estate/student-accommodation-dormitories/university-dormitory', 'dorm'),
    ('real-estate/student-accommodation-dormitories/shared-apartment', 'dorm'),
    ('real-estate/student-accommodation-dormitories/shared-room', 'dorm'),
    ('real-estate/student-accommodation-dormitories/family-room', 'dorm'),

    ('real-estate/property-projects/new-apartment-projects', 'projects'),
    ('real-estate/property-projects/new-housing-projects', 'projects'),
    ('real-estate/property-projects/commercial-projects', 'projects');

  create temporary table tmp_field_defs (
    profile text not null,
    field_key text not null,
    field_label text not null,
    field_type text not null,
    is_required boolean not null,
    options_json jsonb,
    unit text,
    display_order int not null,
    primary key (profile, field_key)
  ) on commit drop;

  insert into tmp_field_defs(profile, field_key, field_label, field_type, is_required, options_json, unit, display_order)
  values
    ('res_sale','rental_type','Listing Type','select',true,'["For Sale"]'::jsonb,null,1),
    ('res_sale','sale_price','Price','number',true,null,null,2),
    ('res_sale','property_size','Property Size','number',true,null,'m2',3),
    ('res_sale','rooms','Rooms','number',true,null,null,4),
    ('res_sale','bathrooms','Bathrooms','number',true,null,null,5),
    ('res_sale','floor','Floor','number',false,null,null,6),
    ('res_sale','total_floors','Total Floors','number',false,null,null,7),
    ('res_sale','building_age','Building Age','number',false,null,'years',8),
    ('res_sale','furnished','Furnished','boolean',false,null,null,9),
    ('res_sale','electricity','Electricity','boolean',false,null,null,10),
    ('res_sale','water','Water','boolean',false,null,null,11),
    ('res_sale','internet','Internet','boolean',false,null,null,12),
    ('res_sale','parking','Parking','boolean',false,null,null,13),
    ('res_sale','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,14),

    ('res_rent','rental_type','Rental Type','select',true,'["Monthly Rent","Yearly Rent"]'::jsonb,null,1),
    ('res_rent','monthly_rent','Monthly Rent Amount','number',true,null,null,2),
    ('res_rent','yearly_rent','Yearly Rent Amount','number',false,null,null,3),
    ('res_rent','deposit_amount','Deposit Amount','number',false,null,null,4),
    ('res_rent','contract_duration','Contract Duration','text',true,null,null,5),
    ('res_rent','property_size','Property Size','number',true,null,'m2',6),
    ('res_rent','rooms','Rooms','number',true,null,null,7),
    ('res_rent','bathrooms','Bathrooms','number',true,null,null,8),
    ('res_rent','floor','Floor','number',false,null,null,9),
    ('res_rent','total_floors','Total Floors','number',false,null,null,10),
    ('res_rent','furnished','Furnished','boolean',false,null,null,11),
    ('res_rent','electricity','Electricity','boolean',false,null,null,12),
    ('res_rent','water','Water','boolean',false,null,null,13),
    ('res_rent','internet','Internet','boolean',false,null,null,14),
    ('res_rent','parking','Parking','boolean',false,null,null,15),
    ('res_rent','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,16),
    ('res_rent','available_from','Available From','date',false,null,null,17),

    ('res_gerawy','rental_type','Rental Type','select',true,'["Gerawy / Rahn"]'::jsonb,null,1),
    ('res_gerawy','gerawy_amount','Gerawy / Rahn Amount','number',true,null,null,2),
    ('res_gerawy','monthly_rent','Monthly Rent Amount','number',false,null,null,3),
    ('res_gerawy','contract_duration','Contract Duration','text',true,null,null,4),
    ('res_gerawy','refund_condition_note','Refund Condition Note','text',true,null,null,5),
    ('res_gerawy','property_size','Property Size','number',true,null,'m2',6),
    ('res_gerawy','rooms','Rooms','number',true,null,null,7),
    ('res_gerawy','bathrooms','Bathrooms','number',true,null,null,8),
    ('res_gerawy','floor','Floor','number',false,null,null,9),
    ('res_gerawy','total_floors','Total Floors','number',false,null,null,10),
    ('res_gerawy','furnished','Furnished','boolean',false,null,null,11),
    ('res_gerawy','electricity','Electricity','boolean',false,null,null,12),
    ('res_gerawy','water','Water','boolean',false,null,null,13),
    ('res_gerawy','internet','Internet','boolean',false,null,null,14),
    ('res_gerawy','parking','Parking','boolean',false,null,null,15),
    ('res_gerawy','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,16),
    ('res_gerawy','available_from','Available From','date',false,null,null,17),

    ('res_gerawy_rent','rental_type','Rental Type','select',true,'["Gerawy + Monthly Rent"]'::jsonb,null,1),
    ('res_gerawy_rent','gerawy_amount','Gerawy / Rahn Amount','number',true,null,null,2),
    ('res_gerawy_rent','monthly_rent','Monthly Rent Amount','number',true,null,null,3),
    ('res_gerawy_rent','contract_duration','Contract Duration','text',true,null,null,4),
    ('res_gerawy_rent','refund_condition_note','Refund Condition Note','text',true,null,null,5),
    ('res_gerawy_rent','property_size','Property Size','number',true,null,'m2',6),
    ('res_gerawy_rent','rooms','Rooms','number',true,null,null,7),
    ('res_gerawy_rent','bathrooms','Bathrooms','number',true,null,null,8),
    ('res_gerawy_rent','floor','Floor','number',false,null,null,9),
    ('res_gerawy_rent','total_floors','Total Floors','number',false,null,null,10),
    ('res_gerawy_rent','furnished','Furnished','boolean',false,null,null,11),
    ('res_gerawy_rent','electricity','Electricity','boolean',false,null,null,12),
    ('res_gerawy_rent','water','Water','boolean',false,null,null,13),
    ('res_gerawy_rent','internet','Internet','boolean',false,null,null,14),
    ('res_gerawy_rent','parking','Parking','boolean',false,null,null,15),
    ('res_gerawy_rent','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,16),
    ('res_gerawy_rent','available_from','Available From','date',false,null,null,17),

    ('res_short_term','rental_type','Rental Type','select',true,'["Daily Rent","Weekly Rent","Monthly Furnished Rent"]'::jsonb,null,1),
    ('res_short_term','daily_rent','Daily Rent','number',false,null,null,2),
    ('res_short_term','weekly_rent','Weekly Rent','number',false,null,null,3),
    ('res_short_term','monthly_furnished_rent','Monthly Furnished Rent','number',false,null,null,4),
    ('res_short_term','deposit_amount','Deposit Amount','number',false,null,null,5),
    ('res_short_term','property_size','Property Size','number',false,null,'m2',6),
    ('res_short_term','rooms','Rooms','number',false,null,null,7),
    ('res_short_term','bathrooms','Bathrooms','number',false,null,null,8),
    ('res_short_term','furnished','Furnished','boolean',true,null,null,9),
    ('res_short_term','internet','Internet','boolean',false,null,null,10),
    ('res_short_term','parking','Parking','boolean',false,null,null,11),
    ('res_short_term','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,12),
    ('res_short_term','available_from','Available From','date',false,null,null,13),

    ('com_sale','rental_type','Listing Type','select',true,'["For Sale"]'::jsonb,null,1),
    ('com_sale','sale_price','Price','number',true,null,null,2),
    ('com_sale','property_size','Property Size','number',true,null,'m2',3),
    ('com_sale','rooms','Rooms','number',false,null,null,4),
    ('com_sale','bathrooms','Bathrooms','number',false,null,null,5),
    ('com_sale','floor','Floor','number',false,null,null,6),
    ('com_sale','total_floors','Total Floors','number',false,null,null,7),
    ('com_sale','furnished','Furnished','boolean',false,null,null,8),
    ('com_sale','electricity','Electricity','boolean',false,null,null,9),
    ('com_sale','water','Water','boolean',false,null,null,10),
    ('com_sale','internet','Internet','boolean',false,null,null,11),
    ('com_sale','parking','Parking','boolean',false,null,null,12),
    ('com_sale','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,13),

    ('com_rent','rental_type','Rental Type','select',true,'["Monthly Rent","Yearly Rent"]'::jsonb,null,1),
    ('com_rent','monthly_rent','Monthly Rent Amount','number',true,null,null,2),
    ('com_rent','yearly_rent','Yearly Rent Amount','number',false,null,null,3),
    ('com_rent','deposit_amount','Deposit Amount','number',false,null,null,4),
    ('com_rent','contract_duration','Contract Duration','text',true,null,null,5),
    ('com_rent','property_size','Property Size','number',true,null,'m2',6),
    ('com_rent','rooms','Rooms','number',false,null,null,7),
    ('com_rent','bathrooms','Bathrooms','number',false,null,null,8),
    ('com_rent','floor','Floor','number',false,null,null,9),
    ('com_rent','total_floors','Total Floors','number',false,null,null,10),
    ('com_rent','furnished','Furnished','boolean',false,null,null,11),
    ('com_rent','electricity','Electricity','boolean',false,null,null,12),
    ('com_rent','water','Water','boolean',false,null,null,13),
    ('com_rent','internet','Internet','boolean',false,null,null,14),
    ('com_rent','parking','Parking','boolean',false,null,null,15),
    ('com_rent','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,16),
    ('com_rent','available_from','Available From','date',false,null,null,17),

    ('com_gerawy','rental_type','Rental Type','select',true,'["Gerawy / Rahn"]'::jsonb,null,1),
    ('com_gerawy','gerawy_amount','Gerawy / Rahn Amount','number',true,null,null,2),
    ('com_gerawy','monthly_rent','Monthly Rent Amount','number',false,null,null,3),
    ('com_gerawy','contract_duration','Contract Duration','text',true,null,null,4),
    ('com_gerawy','refund_condition_note','Refund Condition Note','text',true,null,null,5),
    ('com_gerawy','property_size','Property Size','number',true,null,'m2',6),
    ('com_gerawy','rooms','Rooms','number',false,null,null,7),
    ('com_gerawy','bathrooms','Bathrooms','number',false,null,null,8),
    ('com_gerawy','floor','Floor','number',false,null,null,9),
    ('com_gerawy','total_floors','Total Floors','number',false,null,null,10),
    ('com_gerawy','furnished','Furnished','boolean',false,null,null,11),
    ('com_gerawy','electricity','Electricity','boolean',false,null,null,12),
    ('com_gerawy','water','Water','boolean',false,null,null,13),
    ('com_gerawy','internet','Internet','boolean',false,null,null,14),
    ('com_gerawy','parking','Parking','boolean',false,null,null,15),
    ('com_gerawy','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,16),
    ('com_gerawy','available_from','Available From','date',false,null,null,17),

    ('com_gerawy_rent','rental_type','Rental Type','select',true,'["Gerawy + Monthly Rent"]'::jsonb,null,1),
    ('com_gerawy_rent','gerawy_amount','Gerawy / Rahn Amount','number',true,null,null,2),
    ('com_gerawy_rent','monthly_rent','Monthly Rent Amount','number',true,null,null,3),
    ('com_gerawy_rent','contract_duration','Contract Duration','text',true,null,null,4),
    ('com_gerawy_rent','refund_condition_note','Refund Condition Note','text',true,null,null,5),
    ('com_gerawy_rent','property_size','Property Size','number',true,null,'m2',6),
    ('com_gerawy_rent','rooms','Rooms','number',false,null,null,7),
    ('com_gerawy_rent','bathrooms','Bathrooms','number',false,null,null,8),
    ('com_gerawy_rent','floor','Floor','number',false,null,null,9),
    ('com_gerawy_rent','total_floors','Total Floors','number',false,null,null,10),
    ('com_gerawy_rent','furnished','Furnished','boolean',false,null,null,11),
    ('com_gerawy_rent','electricity','Electricity','boolean',false,null,null,12),
    ('com_gerawy_rent','water','Water','boolean',false,null,null,13),
    ('com_gerawy_rent','internet','Internet','boolean',false,null,null,14),
    ('com_gerawy_rent','parking','Parking','boolean',false,null,null,15),
    ('com_gerawy_rent','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,16),
    ('com_gerawy_rent','available_from','Available From','date',false,null,null,17),

    ('land_sale','rental_type','Listing Type','select',true,'["For Sale"]'::jsonb,null,1),
    ('land_sale','sale_price','Price','number',true,null,null,2),
    ('land_sale','land_size','Land Size','number',true,null,'m2',3),
    ('land_sale','land_type','Land Type','select',true,'["Residential Land","Commercial Land","Agricultural Land","Garden","Farm"]'::jsonb,null,4),
    ('land_sale','document_type','Document Type','text',true,null,null,5),
    ('land_sale','road_access','Road Access','boolean',false,null,null,6),
    ('land_sale','water_access','Water Access','boolean',false,null,null,7),
    ('land_sale','electricity_access','Electricity Access','boolean',false,null,null,8),
    ('land_sale','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,9),

    ('land_lease','rental_type','Rental Type','select',true,'["Land Lease"]'::jsonb,null,1),
    ('land_lease','land_lease_price','Lease Price','number',true,null,null,2),
    ('land_lease','lease_duration','Lease Duration','text',true,null,null,3),
    ('land_lease','land_size','Land Size','number',true,null,'m2',4),
    ('land_lease','land_type','Land Type','select',true,'["Agricultural Land","Garden","Farm"]'::jsonb,null,5),
    ('land_lease','road_access','Road Access','boolean',false,null,null,6),
    ('land_lease','water_access','Water Access','boolean',false,null,null,7),
    ('land_lease','electricity_access','Electricity Access','boolean',false,null,null,8),
    ('land_lease','document_type','Document Type','text',true,null,null,9),
    ('land_lease','owner_type','Owner / Agent','select',true,'["owner","agent"]'::jsonb,null,10),

    ('dorm','rental_type','Rental Type','select',true,'["Dormitory","Shared Room"]'::jsonb,null,1),
    ('dorm','dormitory_type','Dormitory Type','select',true,'["Male Dormitory","Female Dormitory","Private Dormitory","University Dormitory","Shared Apartment","Shared Room","Family Room"]'::jsonb,null,2),
    ('dorm','gender','Gender','select',true,'["male","female","mixed"]'::jsonb,null,3),
    ('dorm','dormitory_price','Price Per Month','number',true,null,null,4),
    ('dorm','deposit_amount','Deposit Amount','number',false,null,null,5),
    ('dorm','beds_available','Beds Available','number',false,null,null,6),
    ('dorm','room_capacity','Room Capacity','number',false,null,null,7),
    ('dorm','meals_included','Meals Included','boolean',false,null,null,8),
    ('dorm','internet_included','Internet Included','boolean',false,null,null,9),
    ('dorm','electricity_included','Electricity Included','boolean',false,null,null,10),
    ('dorm','water_included','Water Included','boolean',false,null,null,11),
    ('dorm','heating_cooling','Heating / Cooling','text',false,null,null,12),
    ('dorm','bathroom_type','Bathroom Type','text',false,null,null,13),
    ('dorm','distance_from_university','Distance From University','number',false,null,'km',14),
    ('dorm','nearby_university','Nearby University or Area','text',false,null,null,15),
    ('dorm','rules','Rules','text',false,null,null,16),
    ('dorm','owner_type','Owner / Manager','select',true,'["owner","agent","manager"]'::jsonb,null,17),
    ('dorm','available_from','Available From','date',false,null,null,18),

    ('projects','rental_type','Listing Type','select',true,'["For Sale"]'::jsonb,null,1),
    ('projects','sale_price','Starting Price','number',false,null,null,2),
    ('projects','property_size','Unit Size','number',false,null,'m2',3),
    ('projects','rooms','Rooms','number',false,null,null,4),
    ('projects','bathrooms','Bathrooms','number',false,null,null,5),
    ('projects','building_age','Project Stage','text',false,null,null,6),
    ('projects','furnished','Furnished','boolean',false,null,null,7),
    ('projects','electricity','Electricity','boolean',false,null,null,8),
    ('projects','water','Water','boolean',false,null,null,9),
    ('projects','internet','Internet','boolean',false,null,null,10),
    ('projects','parking','Parking','boolean',false,null,null,11),
    ('projects','owner_type','Owner / Agent','select',true,'["owner","agent","developer"]'::jsonb,null,12),
    ('projects','available_from','Expected Delivery Date','date',false,null,null,13);

  for rec in
    select t.category_path, t.profile
    from tmp_field_targets t
    order by t.category_path
  loop
    select id into v_node_id
    from public.category_nodes
    where path = rec.category_path
      and is_active = true
    limit 1;

    if v_node_id is null then
      continue;
    end if;

    for field_rec in
      select *
      from tmp_field_defs f
      where f.profile = rec.profile
      order by f.display_order
    loop
      insert into public.category_fields (
        category_node_id,
        field_key,
        field_label,
        field_type,
        is_required,
        options_json,
        unit,
        display_order,
        is_active
      )
      values (
        v_node_id,
        field_rec.field_key,
        field_rec.field_label,
        field_rec.field_type,
        field_rec.is_required,
        field_rec.options_json,
        field_rec.unit,
        field_rec.display_order,
        true
      )
      on conflict (category_node_id, field_key) do update
      set
        field_label = excluded.field_label,
        field_type = excluded.field_type,
        is_required = excluded.is_required,
        options_json = excluded.options_json,
        unit = excluded.unit,
        display_order = excluded.display_order,
        is_active = true,
        updated_at = now();
    end loop;
  end loop;
end $$;

create index if not exists idx_listings_status_category_node_created_at
  on public.listings(status, category_node_id, created_at desc);

create index if not exists idx_listings_status_province_district_created_at
  on public.listings(status, province, district, created_at desc);

create index if not exists idx_listing_attributes_listing_key_number
  on public.listing_attributes(listing_id, attribute_key, attribute_value_number);

create index if not exists idx_listing_attributes_listing_key_text
  on public.listing_attributes(listing_id, attribute_key, attribute_value_text);

create index if not exists idx_listing_attributes_listing_key_boolean
  on public.listing_attributes(listing_id, attribute_key, attribute_value_boolean);

create or replace function public.search_real_estate_listing_ids(
  root_category_node_id bigint default null,
  category_scope text default 'subtree',
  province_filter text default null,
  district_filter text default null,
  property_type_filter text default null,
  rental_type_filter text default null,
  price_min_filter numeric default null,
  price_max_filter numeric default null,
  monthly_rent_min_filter numeric default null,
  monthly_rent_max_filter numeric default null,
  gerawy_min_filter numeric default null,
  gerawy_max_filter numeric default null,
  rooms_min_filter numeric default null,
  furnished_filter boolean default null,
  owner_type_filter text default null,
  dormitory_gender_filter text default null,
  dormitory_price_max_filter numeric default null,
  land_size_min_filter numeric default null,
  land_size_max_filter numeric default null
)
returns table(listing_id uuid)
language sql
stable
as $$
  with recursive root as (
    select coalesce(
      root_category_node_id,
      (select id from public.category_nodes where path = 'real-estate' and is_active = true limit 1)
    ) as node_id
  ), scoped_nodes as (
    select node_id as id from root
    union all
    select c.id
    from public.category_nodes c
    join scoped_nodes s on c.parent_id = s.id
    where category_scope <> 'exact'
      and c.is_active = true
  ), candidates as (
    select l.id, l.category_node_id
    from public.listings l
    where l.status = 'approved'
      and l.category_node_id in (select distinct id from scoped_nodes)
      and (province_filter is null or l.province = province_filter)
      and (
        district_filter is null
        or district_filter = ''
        or l.district ilike ('%' || district_filter || '%')
      )
      and (price_min_filter is null or l.price >= price_min_filter)
      and (price_max_filter is null or l.price <= price_max_filter)
  )
  select c.id
  from candidates c
  join public.category_nodes n on n.id = c.category_node_id
  where (
      property_type_filter is null
      or property_type_filter = ''
      or n.slug = property_type_filter
      or n.path like ('%/' || property_type_filter)
    )
    and (
      rental_type_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'rental_type'
          and lower(coalesce(a.attribute_value_text, '')) = lower(rental_type_filter)
      )
    )
    and (
      monthly_rent_min_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key in ('monthly_rent', 'monthly_furnished_rent', 'dormitory_price')
          and coalesce(a.attribute_value_number, 0) >= monthly_rent_min_filter
      )
    )
    and (
      monthly_rent_max_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key in ('monthly_rent', 'monthly_furnished_rent', 'dormitory_price')
          and coalesce(a.attribute_value_number, 0) <= monthly_rent_max_filter
      )
    )
    and (
      gerawy_min_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'gerawy_amount'
          and coalesce(a.attribute_value_number, 0) >= gerawy_min_filter
      )
    )
    and (
      gerawy_max_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'gerawy_amount'
          and coalesce(a.attribute_value_number, 0) <= gerawy_max_filter
      )
    )
    and (
      rooms_min_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'rooms'
          and coalesce(a.attribute_value_number, 0) >= rooms_min_filter
      )
    )
    and (
      furnished_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'furnished'
          and coalesce(a.attribute_value_boolean, false) = furnished_filter
      )
    )
    and (
      owner_type_filter is null
      or owner_type_filter = ''
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'owner_type'
          and lower(coalesce(a.attribute_value_text, '')) = lower(owner_type_filter)
      )
    )
    and (
      dormitory_gender_filter is null
      or dormitory_gender_filter = ''
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'gender'
          and lower(coalesce(a.attribute_value_text, '')) = lower(dormitory_gender_filter)
      )
    )
    and (
      dormitory_price_max_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'dormitory_price'
          and coalesce(a.attribute_value_number, 0) <= dormitory_price_max_filter
      )
    )
    and (
      land_size_min_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'land_size'
          and coalesce(a.attribute_value_number, 0) >= land_size_min_filter
      )
    )
    and (
      land_size_max_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = c.id
          and a.attribute_key = 'land_size'
          and coalesce(a.attribute_value_number, 0) <= land_size_max_filter
      )
    );
$$;

commit;
