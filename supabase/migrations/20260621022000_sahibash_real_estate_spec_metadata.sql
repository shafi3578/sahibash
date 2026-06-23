-- Sahibash V8.2: grouped dynamic specification metadata for all real-estate leaf categories

begin;

alter table public.category_fields
  add column if not exists group_key text,
  add column if not exists visibility_rules jsonb,
  add column if not exists validation_rules jsonb,
  add column if not exists is_filterable boolean not null default false;

create index if not exists idx_category_fields_node_group_order
  on public.category_fields(category_node_id, group_key, display_order);

create or replace function public.upsert_real_estate_spec_fields()
returns void
language plpgsql
as $$
declare
  node_rec record;
  field_rec record;
  category_profile text;
begin
  create temporary table tmp_re_field_defs (
    profile text not null,
    field_key text not null,
    field_label text not null,
    field_type text not null,
    is_required boolean not null default false,
    group_key text,
    display_order int not null,
    options_json jsonb,
    visibility_rules jsonb,
    validation_rules jsonb,
    is_filterable boolean not null default false,
    primary key (profile, field_key)
  ) on commit drop;

  -- Core rows visible for every real-estate listing
  insert into tmp_re_field_defs values
    ('all','rental_type','Rental Type','select',true,'property_details',1,
      '["For Sale","Monthly Rent","Yearly Rent","Gerawy / Rahn","Gerawy + Monthly Rent","Daily Rent","Weekly Rent","Monthly Furnished Rent","Land Lease","Dormitory","Shared Room"]'::jsonb,
      null,null,true),
    ('all','sale_price','Sale Price','number',false,'property_details',2,null,'{"rental_types":["For Sale"]}'::jsonb,'{"min":0}'::jsonb,true),
    ('all','monthly_rent','Monthly Rent','number',false,'property_details',3,null,'{"rental_types":["Monthly Rent","Gerawy + Monthly Rent"]}'::jsonb,'{"min":0}'::jsonb,true),
    ('all','yearly_rent','Yearly Rent','number',false,'property_details',4,null,'{"rental_types":["Yearly Rent"]}'::jsonb,'{"min":0}'::jsonb,true),
    ('all','gerawy_amount','Gerawy / Rahn Amount','number',false,'property_details',5,null,'{"rental_types":["Gerawy / Rahn","Gerawy + Monthly Rent"]}'::jsonb,'{"min":0}'::jsonb,true),
    ('all','refund_condition_note','Refund Condition Note','text',false,'property_details',6,null,'{"rental_types":["Gerawy / Rahn","Gerawy + Monthly Rent"]}'::jsonb,null,false),
    ('all','daily_rent','Daily Price','number',false,'property_details',7,null,'{"rental_types":["Daily Rent"]}'::jsonb,'{"min":0}'::jsonb,true),
    ('all','minimum_days','Minimum Days','number',false,'property_details',8,null,'{"rental_types":["Daily Rent"]}'::jsonb,'{"min":1}'::jsonb,false),
    ('all','cleaning_fee','Cleaning Fee','number',false,'property_details',9,null,'{"rental_types":["Daily Rent"]}'::jsonb,'{"min":0}'::jsonb,false),
    ('all','weekly_rent','Weekly Price','number',false,'property_details',10,null,'{"rental_types":["Weekly Rent"]}'::jsonb,'{"min":0}'::jsonb,true),
    ('all','minimum_weeks','Minimum Weeks','number',false,'property_details',11,null,'{"rental_types":["Weekly Rent"]}'::jsonb,'{"min":1}'::jsonb,false),
    ('all','monthly_furnished_rent','Monthly Furnished Rent','number',false,'property_details',12,null,'{"rental_types":["Monthly Furnished Rent"]}'::jsonb,'{"min":0}'::jsonb,true),
    ('all','land_lease_price','Lease Price','number',false,'property_details',13,null,'{"rental_types":["Land Lease"]}'::jsonb,'{"min":0}'::jsonb,true),
    ('all','lease_duration','Lease Duration','text',false,'property_details',14,null,'{"rental_types":["Land Lease"]}'::jsonb,null,false),
    ('all','dormitory_price','Price Per Month','number',false,'property_details',15,null,'{"rental_types":["Dormitory","Shared Room"]}'::jsonb,'{"min":0}'::jsonb,true),
    ('all','deposit_amount','Deposit','number',false,'property_details',16,null,'{"rental_types":["Monthly Rent","Yearly Rent","Gerawy / Rahn","Gerawy + Monthly Rent","Monthly Furnished Rent","Dormitory","Shared Room"]}'::jsonb,'{"min":0}'::jsonb,true),

    ('all','property_size_gross','Property Size (Gross)','number',false,'property_details',20,null,null,'{"min":0}'::jsonb,true),
    ('all','property_size_net','Property Size (Net)','number',false,'property_details',21,null,null,'{"min":0}'::jsonb,true),
    ('all','rooms','Rooms','text',false,'property_details',22,null,null,null,true),
    ('all','bathrooms','Bathrooms','number',false,'property_details',23,null,null,'{"min":0}'::jsonb,true),
    ('all','floor','Floor','number',false,'property_details',24,null,null,null,true),
    ('all','total_floors','Total Floors','number',false,'property_details',25,null,null,'{"min":0}'::jsonb,true),
    ('all','building_age','Building Age','text',false,'property_details',26,null,null,null,true),
    ('all','available_from','Available From','date',false,'property_details',27,null,null,null,true),
    ('all','owner_type','Owner Type','select',false,'property_details',28,'["owner","agent","manager","developer"]'::jsonb,null,null,true),
    ('all','property_deed_type','Property Deed Type','text',false,'property_details',29,null,null,null,true),
    ('all','energy_certificate','Energy Certificate','text',false,'property_details',30,null,null,null,true),
    ('all','mortgage_eligible','Mortgage Eligible','boolean',false,'property_details',31,null,null,null,true),
    ('all','exchange_accepted','Exchange Accepted','boolean',false,'property_details',32,null,null,null,true),
    ('all','occupancy_status','Occupancy Status','select',false,'property_details',33,'["vacant","occupied","rented","under_construction"]'::jsonb,null,null,true),
    ('all','property_condition','Property Condition','select',false,'property_details',34,'["new","good","needs_renovation","old"]'::jsonb,null,null,true),
    ('all','renovation_status','Renovation Status','select',false,'property_details',35,'["renovated","partially_renovated","not_renovated"]'::jsonb,null,null,true),

    ('all','heating','Heating','text',false,'interior_features',100,null,null,null,true),
    ('all','kitchen_type','Kitchen Type','text',false,'interior_features',101,null,null,null,true),
    ('all','balcony','Balcony','boolean',false,'interior_features',102,null,null,null,true),
    ('all','elevator','Elevator','boolean',false,'interior_features',103,null,null,null,true),
    ('all','parking','Parking','boolean',false,'interior_features',104,null,null,null,true),
    ('all','furnished','Furnished','boolean',false,'interior_features',105,null,null,null,true),
    ('all','air_conditioning','Air Conditioning','boolean',false,'interior_features',106,null,null,null,false),
    ('all','built_in_wardrobes','Built-in Wardrobes','boolean',false,'interior_features',107,null,null,null,false),
    ('all','walk_in_closet','Walk-in Closet','boolean',false,'interior_features',108,null,null,null,false),
    ('all','modern_kitchen','Modern Kitchen','boolean',false,'interior_features',109,null,null,null,false),
    ('all','dishwasher_connection','Dishwasher Connection','boolean',false,'interior_features',110,null,null,null,false),
    ('all','laundry_room','Laundry Room','boolean',false,'interior_features',111,null,null,null,false),
    ('all','fireplace','Fireplace','boolean',false,'interior_features',112,null,null,null,false),
    ('all','double_glazed_windows','Double Glazed Windows','boolean',false,'interior_features',113,null,null,null,false),
    ('all','wood_flooring','Wood Flooring','boolean',false,'interior_features',114,null,null,null,false),
    ('all','ceramic_flooring','Ceramic Flooring','boolean',false,'interior_features',115,null,null,null,false),
    ('all','marble_flooring','Marble Flooring','boolean',false,'interior_features',116,null,null,null,false),
    ('all','granite_flooring','Granite Flooring','boolean',false,'interior_features',117,null,null,null,false),
    ('all','fiber_internet','Fiber Internet','boolean',false,'interior_features',118,null,null,null,true),
    ('all','tv_connection','TV Connection','boolean',false,'interior_features',119,null,null,null,false),
    ('all','satellite','Satellite','boolean',false,'interior_features',120,null,null,null,false),
    ('all','intercom','Intercom','boolean',false,'interior_features',121,null,null,null,false),
    ('all','security_door','Security Door','boolean',false,'interior_features',122,null,null,null,false),
    ('all','smoke_detector','Smoke Detector','boolean',false,'interior_features',123,null,null,null,false),
    ('all','smart_home','Smart Home','boolean',false,'interior_features',124,null,null,null,false),
    ('all','storage_room','Storage Room','boolean',false,'interior_features',125,null,null,null,false),
    ('all','guest_bathroom','Guest Bathroom','boolean',false,'interior_features',126,null,null,null,false),
    ('all','prayer_room','Prayer Room','boolean',false,'interior_features',127,null,null,null,false),
    ('all','office_room','Office Room','boolean',false,'interior_features',128,null,null,null,false),

    ('all','inside_compound','Inside Compound','boolean',false,'exterior_features',200,null,null,null,true),
    ('all','compound_name','Compound Name','text',false,'exterior_features',201,null,null,null,true),
    ('all','maintenance_fee','Maintenance Fee','number',false,'exterior_features',202,null,null,'{"min":0}'::jsonb,true),
    ('all','garden','Garden','boolean',false,'exterior_features',203,null,null,null,true),
    ('all','private_garden','Private Garden','boolean',false,'exterior_features',204,null,null,null,false),
    ('all','shared_garden','Shared Garden','boolean',false,'exterior_features',205,null,null,null,false),
    ('all','children_playground','Children Playground','boolean',false,'exterior_features',206,null,null,null,false),
    ('all','swimming_pool','Swimming Pool','boolean',false,'exterior_features',207,null,null,null,false),
    ('all','private_pool','Private Pool','boolean',false,'exterior_features',208,null,null,null,false),
    ('all','gym','Gym','boolean',false,'exterior_features',209,null,null,null,false),
    ('all','security_24_7','24/7 Security','boolean',false,'exterior_features',210,null,null,null,true),
    ('all','cctv','CCTV','boolean',false,'exterior_features',211,null,null,null,false),
    ('all','caretaker','Caretaker','boolean',false,'exterior_features',212,null,null,null,false),
    ('all','reception','Reception','boolean',false,'exterior_features',213,null,null,null,false),
    ('all','backup_generator','Backup Generator','boolean',false,'exterior_features',214,null,null,null,true),
    ('all','water_tank','Water Tank','boolean',false,'exterior_features',215,null,null,null,true),
    ('all','solar_system','Solar System','boolean',false,'exterior_features',216,null,null,null,true),
    ('all','waste_collection','Waste Collection','boolean',false,'exterior_features',217,null,null,null,false),
    ('all','visitor_parking','Visitor Parking','boolean',false,'exterior_features',218,null,null,null,false),
    ('all','underground_parking','Underground Parking','boolean',false,'exterior_features',219,null,null,null,false),

    ('all','location_school','School Nearby','boolean',false,'location_nearby',300,null,null,null,false),
    ('all','location_university','University Nearby','boolean',false,'location_nearby',301,null,null,null,true),
    ('all','location_hospital','Hospital Nearby','boolean',false,'location_nearby',302,null,null,null,false),
    ('all','location_pharmacy','Pharmacy Nearby','boolean',false,'location_nearby',303,null,null,null,false),
    ('all','location_mosque','Mosque Nearby','boolean',false,'location_nearby',304,null,null,null,true),
    ('all','location_market','Market Nearby','boolean',false,'location_nearby',305,null,null,null,true),
    ('all','location_restaurant','Restaurant Nearby','boolean',false,'location_nearby',306,null,null,null,false),
    ('all','location_park','Park Nearby','boolean',false,'location_nearby',307,null,null,null,false),
    ('all','location_airport','Airport Nearby','boolean',false,'location_nearby',308,null,null,null,false),
    ('all','location_bank','Bank Nearby','boolean',false,'location_nearby',309,null,null,null,false),

    ('all','walk_to_main_road','Walking Distance to Main Road','boolean',false,'transportation',350,null,null,null,true),
    ('all','public_transport','Public Transport','boolean',false,'transportation',351,null,null,null,true),
    ('all','taxi_access','Taxi Access','boolean',false,'transportation',352,null,null,null,false),
    ('all','bus_access','Bus Access','boolean',false,'transportation',353,null,null,null,false),
    ('all','airport_distance_km','Airport Distance','number',false,'transportation',354,null,null,'{"min":0}'::jsonb,false),
    ('all','highway_access','Highway Access','boolean',false,'transportation',355,null,null,null,true),
    ('all','ring_road_access','Ring Road Access','boolean',false,'transportation',356,null,null,null,true),

    ('all','city_view','City View','boolean',false,'view',400,null,null,null,false),
    ('all','mountain_view','Mountain View','boolean',false,'view',401,null,null,null,false),
    ('all','river_view','River View','boolean',false,'view',402,null,null,null,false),
    ('all','lake_view','Lake View','boolean',false,'view',403,null,null,null,false),
    ('all','garden_view','Garden View','boolean',false,'view',404,null,null,null,false),
    ('all','park_view','Park View','boolean',false,'view',405,null,null,null,false),
    ('all','street_view','Street View','boolean',false,'view',406,null,null,null,false),
    ('all','open_view','Open View','boolean',false,'view',407,null,null,null,false),

    ('all','electricity','Electricity','boolean',false,'utilities',450,null,null,null,true),
    ('all','water','Water','boolean',false,'utilities',451,null,null,null,true),
    ('all','gas','Gas','boolean',false,'utilities',452,null,null,null,true),
    ('all','solar','Solar','boolean',false,'utilities',453,null,null,null,true),
    ('all','internet','Internet','boolean',false,'utilities',454,null,null,null,true),
    ('all','generator','Generator','boolean',false,'utilities',455,null,null,null,false),
    ('all','septic_tank','Septic Tank','boolean',false,'utilities',456,null,null,null,false),
    ('all','well_water','Well Water','boolean',false,'utilities',457,null,null,null,false);

  -- Residential-specific
  insert into tmp_re_field_defs values
    ('residential','bedrooms','Bedrooms','number',false,'category_specific',500,null,null,null,true),
    ('residential','living_rooms','Living Rooms','number',false,'category_specific',501,null,null,null,false),
    ('residential','kitchen_count','Kitchen','number',false,'category_specific',502,null,null,null,false),
    ('residential','dining_room','Dining Room','boolean',false,'category_specific',503,null,null,null,false),
    ('residential','roof','Roof','boolean',false,'category_specific',504,null,null,null,false),
    ('residential','courtyard','Courtyard','boolean',false,'category_specific',505,null,null,null,false),
    ('residential','basement','Basement','boolean',false,'category_specific',506,null,null,null,false),
    ('residential','attic','Attic','boolean',false,'category_specific',507,null,null,null,false),
    ('residential','terrace','Terrace','boolean',false,'category_specific',508,null,null,null,false);

  -- Commercial-specific
  insert into tmp_re_field_defs values
    ('commercial','commercial_license','Commercial License','boolean',false,'category_specific',550,null,null,null,true),
    ('commercial','business_ready','Business Ready','boolean',false,'category_specific',551,null,null,null,true),
    ('commercial','office_rooms','Office Rooms','number',false,'category_specific',552,null,null,null,false),
    ('commercial','meeting_rooms','Meeting Rooms','number',false,'category_specific',553,null,null,null,false),
    ('commercial','storage_capacity','Storage Capacity','number',false,'category_specific',554,null,null,'{"min":0}'::jsonb,false),
    ('commercial','warehouse_height','Warehouse Height','number',false,'category_specific',555,null,null,'{"min":0}'::jsonb,false),
    ('commercial','loading_dock','Loading Dock','boolean',false,'category_specific',556,null,null,null,false),
    ('commercial','cold_storage','Cold Storage','boolean',false,'category_specific',557,null,null,null,false),
    ('commercial','parking_capacity','Parking Capacity','number',false,'category_specific',558,null,null,'{"min":0}'::jsonb,false),
    ('commercial','restaurant_seating','Restaurant Seating','number',false,'category_specific',559,null,null,'{"min":0}'::jsonb,false),
    ('commercial','kitchen_equipment','Kitchen Equipment','boolean',false,'category_specific',560,null,null,null,false),
    ('commercial','hotel_rooms','Hotel Rooms','number',false,'category_specific',561,null,null,'{"min":0}'::jsonb,false),
    ('commercial','industrial_electricity','Industrial Electricity','boolean',false,'category_specific',562,null,null,null,true),
    ('commercial','factory_area','Factory Area','number',false,'category_specific',563,null,null,'{"min":0}'::jsonb,false),
    ('commercial','workshop_type','Workshop Type','text',false,'category_specific',564,null,null,null,false);

  -- Land-specific
  insert into tmp_re_field_defs values
    ('land','land_size','Land Area','number',true,'category_specific',600,null,null,'{"min":0}'::jsonb,true),
    ('land','boundary','Boundary','text',false,'category_specific',601,null,null,null,false),
    ('land','road_access','Road Access','boolean',false,'category_specific',602,null,null,null,true),
    ('land','corner_plot','Corner Plot','boolean',false,'category_specific',603,null,null,null,true),
    ('land','water_access','Water Access','boolean',false,'category_specific',604,null,null,null,true),
    ('land','electricity_access','Electricity Access','boolean',false,'category_specific',605,null,null,null,true),
    ('land','gas_access','Gas Access','boolean',false,'category_specific',606,null,null,null,true),
    ('land','soil_type','Soil Type','text',false,'category_specific',607,null,null,null,false),
    ('land','agricultural_license','Agricultural License','boolean',false,'category_specific',608,null,null,null,true),
    ('land','trees','Trees','number',false,'category_specific',609,null,null,'{"min":0}'::jsonb,false),
    ('land','irrigation','Irrigation','boolean',false,'category_specific',610,null,null,null,false),
    ('land','fence','Fence','boolean',false,'category_specific',611,null,null,null,false),
    ('land','topography','Topography','text',false,'category_specific',612,null,null,null,false),
    ('land','land_documents','Land Documents','text',false,'category_specific',613,null,null,null,true),
    ('land','land_type','Land Type','select',false,'category_specific',614,'["Residential Land","Commercial Land","Agricultural Land","Farm","Garden"]'::jsonb,null,null,true);

  -- Dormitory-specific
  insert into tmp_re_field_defs values
    ('dormitory','dormitory_type','Dormitory Type','select',true,'category_specific',650,
      '["Male Dormitory","Female Dormitory","Private Dormitory","University Dormitory","Shared Apartment","Shared Room","Family Room"]'::jsonb,null,null,true),
    ('dormitory','gender','Gender','select',false,'category_specific',651,'["male","female","mixed"]'::jsonb,null,null,true),
    ('dormitory','beds_available','Beds Available','number',false,'category_specific',652,null,null,'{"min":0}'::jsonb,true),
    ('dormitory','room_capacity','Room Capacity','number',false,'category_specific',653,null,null,'{"min":0}'::jsonb,true),
    ('dormitory','private_bathroom','Private Bathroom','boolean',false,'category_specific',654,null,null,null,false),
    ('dormitory','shared_bathroom','Shared Bathroom','boolean',false,'category_specific',655,null,null,null,false),
    ('dormitory','meals_included','Meals Included','boolean',false,'category_specific',656,null,null,null,true),
    ('dormitory','laundry_service','Laundry Service','boolean',false,'category_specific',657,null,null,null,false),
    ('dormitory','cleaning_service','Cleaning Service','boolean',false,'category_specific',658,null,null,null,false),
    ('dormitory','study_room','Study Room','boolean',false,'category_specific',659,null,null,null,false),
    ('dormitory','cooling','Cooling','boolean',false,'category_specific',660,null,null,null,false),
    ('dormitory','distance_from_university','University Distance','number',false,'category_specific',661,null,null,'{"min":0}'::jsonb,true),
    ('dormitory','rules','Rules','text',false,'category_specific',662,null,null,null,false),
    ('dormitory','curfew','Curfew','text',false,'category_specific',663,null,null,null,false);

  -- Project-specific
  insert into tmp_re_field_defs values
    ('project','developer','Developer','text',false,'category_specific',700,null,null,null,true),
    ('project','construction_company','Construction Company','text',false,'category_specific',701,null,null,null,false),
    ('project','project_status','Project Status','select',false,'category_specific',702,
      '["planning","under_construction","near_completion","completed"]'::jsonb,null,null,true),
    ('project','completion_date','Completion Date','date',false,'category_specific',703,null,null,null,true),
    ('project','units_available','Units Available','number',false,'category_specific',704,null,null,'{"min":0}'::jsonb,true),
    ('project','apartment_types','Apartment Types','text',false,'category_specific',705,null,null,null,false),
    ('project','payment_plans','Payment Plans','text',false,'category_specific',706,null,null,null,false),
    ('project','installments','Installments','text',false,'category_specific',707,null,null,null,false),
    ('project','down_payment','Down Payment','number',false,'category_specific',708,null,null,'{"min":0}'::jsonb,false),
    ('project','expected_delivery','Expected Delivery','date',false,'category_specific',709,null,null,null,false),
    ('project','facilities','Facilities','text',false,'category_specific',710,null,null,null,false),
    ('project','brochure_url','Brochure','text',false,'category_specific',711,null,null,null,false),
    ('project','master_plan_url','Master Plan','text',false,'category_specific',712,null,null,null,false);

  for node_rec in
    select n.id, n.path
    from public.category_nodes n
    where n.path like 'real-estate/%'
      and n.is_active = true
      and not exists (
        select 1
        from public.category_nodes c
        where c.parent_id = n.id
          and c.is_active = true
      )
  loop
    if node_rec.path like 'real-estate/residential/%' then
      category_profile := 'residential';
    elsif node_rec.path like 'real-estate/commercial/%' then
      category_profile := 'commercial';
    elsif node_rec.path like 'real-estate/land/%' then
      category_profile := 'land';
    elsif node_rec.path like 'real-estate/student-accommodation-dormitories/%' then
      category_profile := 'dormitory';
    elsif node_rec.path like 'real-estate/property-projects/%' then
      category_profile := 'project';
    else
      category_profile := 'all';
    end if;

    for field_rec in
      select * from tmp_re_field_defs where profile = 'all'
      union all
      select * from tmp_re_field_defs where profile = category_profile
      order by display_order, field_key
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
        group_key,
        visibility_rules,
        validation_rules,
        is_filterable,
        is_active
      )
      values (
        node_rec.id,
        field_rec.field_key,
        field_rec.field_label,
        field_rec.field_type,
        field_rec.is_required,
        field_rec.options_json,
        null,
        field_rec.display_order,
        field_rec.group_key,
        field_rec.visibility_rules,
        field_rec.validation_rules,
        field_rec.is_filterable,
        true
      )
      on conflict (category_node_id, field_key) do update
      set
        field_label = excluded.field_label,
        field_type = excluded.field_type,
        is_required = excluded.is_required,
        options_json = excluded.options_json,
        display_order = excluded.display_order,
        group_key = excluded.group_key,
        visibility_rules = excluded.visibility_rules,
        validation_rules = excluded.validation_rules,
        is_filterable = excluded.is_filterable,
        is_active = true,
        updated_at = now();
    end loop;
  end loop;
end;
$$;

select public.upsert_real_estate_spec_fields();

drop function if exists public.upsert_real_estate_spec_fields();

commit;
