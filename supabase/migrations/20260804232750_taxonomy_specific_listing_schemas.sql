begin;

-- Replace overly generic detail schemas with taxonomy-specific versions.
-- Previous published versions are archived for rollback; listing data is untouched.
create temporary table taxonomy_schema_seed on commit drop as
with super_admin as (
  select ur.user_id
  from public.admin_user_roles ur
  join public.admin_roles r on r.id = ur.role_id
  where r.name = 'super_administrator'
  order by ur.user_id
  limit 1
),
classified as (
  select n.id, n.path,
    case
      when n.path ~ '^vehicles/(cars|passenger-vehicles|imported-cars|custom-modified-cars|old-vehicles|rebuilt-cars|damaged-vehicles-for-parts)' then 'car'
      when n.path ~ '^vehicles/(motorcycles|rickshaw|rickshaws)' then 'motorcycle'
      when n.path like 'vehicles/bicycles%' then 'bicycle'
      when n.path ~ '^vehicles/(commercial-vehicles|trucks|trucks-heavy-vehicles|vans|vans-minibuses|pickup-trucks)' then 'commercial_vehicle'
      when n.path ~ '^vehicles/(agricultural|agricultural-rural)' then 'farm_vehicle'
      when n.path ~ '^vehicles/(auto-parts|spare-parts|tires-wheels|vehicle-parts-accessories)' then 'vehicle_part'
      when n.path = 'vehicles' or n.path like 'vehicles/other-%' then 'vehicle'

      when n.path ~ '^real-estate/(land|gardens-farms)' then 'land'
      when n.path ~ '^real-estate/(commercial|shop-office|shops-commercial|offices|warehouses)' then 'commercial_property'
      when n.path ~ '^real-estate/(short-term-rent|student-accommodation|room-house-for-students|dormitory)' or n.path like '%/short-term-rent%' then 'short_term_property'
      when n.path like 'real-estate/property-projects%' then 'property_project'
      when n.path like 'real-estate/%' or n.path = 'real-estate' then 'residential_property'

      when n.path ~ '(^|/)(mobile-phones|tablets)(/|$)' then 'phone'
      when n.path ~ '(^|/)(laptops|desktop-computers|computer-parts|monitors|storage-devices|printers-scanners|networking)' then 'computer'
      when n.path ~ '(^|/)(cameras|projectors)(/|$)' then 'camera'
      when n.path ~ '(^|/)(tvs)(/|$)' then 'television'
      when n.path ~ '(^|/)(audio|speakers|gaming-consoles|game-consoles)(/|$)' then 'media_device'
      when n.path ~ '(^|/)(solar|batteries|generators|inverters|ups)(/|$)' then 'power_equipment'
      when n.path ~ '(^|/)(accessories|phone-accessories|chargers-power-banks|sim-cards-numbers|smart-watches)(/|$)' then 'electronic_accessory'
      when n.path ~ 'phone-repair-services' then 'device_repair'
      when n.path like 'mobile-phones-tablets/%' or n.path like 'phones-electronics/%' or n.path in ('mobile-phones-tablets','phones-electronics') then 'electronic'

      when n.path like 'second-hand-items/home-appliances%' or n.path ~ '/home-appliances(/|$)' then 'appliance'
      when n.path like 'second-hand-items/furniture%' or n.path ~ '/furniture(/|$)' then 'furniture'
      when n.path ~ '^second-hand-items/(clothing|clothing-personal-items)' then 'clothing'
      when n.path ~ '^second-hand-items/(books)' then 'book'
      when n.path ~ '(^|/)(tools|construction-materials)(/|$)' then 'tool'
      when n.path ~ '(^|/)(baby-kids-items)(/|$)' then 'baby_item'
      when n.path like 'second-hand-items/%' or n.path = 'second-hand-items' then 'household_item'

      when n.path ~ '^farm-animals/(cows|sheep-goats|horses|cats|dogs|birds|chickens|other-animals)' then 'animal'
      when n.path = 'farm-animals/animal-feed' then 'animal_feed'
      when n.path ~ '^farm-animals/(tractors|agricultural-equipment|farming-tools)' then 'farm_equipment'

      when n.path = 'education/books-study-materials' then 'education_material'
      when n.path like 'education/%' or n.path = 'education' then 'course'
      when n.path ~ '^business-industry/(established-businesses|shops-sale-rent)' then 'business_sale'
      when n.path like 'business-industry/%' or n.path = 'business-industry' then 'business_equipment'
      else null
    end as family
  from public.category_nodes n
),
field_defs(scope, field_key, field_type, label_en, label_fa, label_ps, options, section_key, sort_order, required, filterable, card) as (
  values
  ('item_base','condition','select','Condition','وضعیت','حالت','[{"value":"new","labels":{"en":"New","fa":"نو","ps":"نوی"}},{"value":"like_new","labels":{"en":"Like new","fa":"مانند نو","ps":"د نوي په شان"}},{"value":"used","labels":{"en":"Used","fa":"استفاده شده","ps":"کارول شوی"}},{"value":"needs_repair","labels":{"en":"Needs repair","fa":"نیاز به ترمیم","ps":"ترمیم ته اړتیا لري"}}]'::jsonb,'overview',10,true,true,true),
  ('item_base','seller_type','select','Seller type','نوع فروشنده','د پلورونکي ډول','[{"value":"owner","labels":{"en":"Owner","fa":"مالک","ps":"مالک"}},{"value":"dealer","labels":{"en":"Dealer / shop","fa":"دکاندار","ps":"پلورنځی"}}]'::jsonb,'trade',900,false,true,true),
  ('item_base','delivery_available','boolean','Delivery available','ارسال موجود است','رسونه شته','[]'::jsonb,'trade',910,false,true,false),
  ('item_base','exchange_possible','boolean','Exchange possible','تبادله ممکن است','تبادله ممکنه ده','[]'::jsonb,'trade',920,false,true,false),

  ('vehicle_base','brand','text','Make / brand','برند / شرکت سازنده','جوړوونکی / برانډ','[]'::jsonb,'vehicle',20,true,true,true),
  ('vehicle_base','model','text','Model','مدل','ماډل','[]'::jsonb,'vehicle',30,true,true,true),
  ('vehicle_base','year','number','Model year','سال مدل','د ماډل کال','[]'::jsonb,'vehicle',40,true,true,true),
  ('vehicle_base','mileage','number','Mileage (km)','کارکرد (کیلومتر)','مایلیج (کیلومتر)','[]'::jsonb,'vehicle',50,false,true,true),
  ('vehicle_base','fuel_type','select','Fuel type','نوع سوخت','د سون ډول','[{"value":"petrol","labels":{"en":"Petrol","fa":"پترول","ps":"پټرول"}},{"value":"diesel","labels":{"en":"Diesel","fa":"دیزل","ps":"ډیزل"}},{"value":"hybrid","labels":{"en":"Hybrid","fa":"هایبرید","ps":"هایبریډ"}},{"value":"electric","labels":{"en":"Electric","fa":"برقی","ps":"برېښنايي"}},{"value":"lpg","labels":{"en":"Gas / LPG","fa":"گاز","ps":"ګاز"}}]'::jsonb,'vehicle',60,true,true,true),
  ('vehicle_base','transmission','select','Transmission','گیربکس','ګیربکس','[{"value":"automatic","labels":{"en":"Automatic","fa":"اتومات","ps":"اتومات"}},{"value":"manual","labels":{"en":"Manual","fa":"دستی","ps":"لاسي"}}]'::jsonb,'vehicle',70,false,true,true),
  ('vehicle_base','color','text','Color','رنگ','رنګ','[]'::jsonb,'vehicle',80,false,true,false),
  ('vehicle_base','engine_size','text','Engine size','حجم موتور','د انجن اندازه','[]'::jsonb,'vehicle',90,false,true,false),
  ('vehicle_base','customs_status','select','Customs status','وضعیت گمرک','د ګمرک حالت','[{"value":"cleared","labels":{"en":"Customs cleared","fa":"تصفیه شده","ps":"تصفیه شوی"}},{"value":"uncleared","labels":{"en":"Not cleared","fa":"تصفیه نشده","ps":"نه دی تصفیه شوی"}}]'::jsonb,'documents',200,false,true,false),
  ('vehicle_base','documents_available','boolean','Documents available','اسناد موجود است','اسناد شته','[]'::jsonb,'documents',210,true,true,false),
  ('car','body_type','select','Body type','نوع بدنه','د بدنې ډول','[{"value":"sedan","labels":{"en":"Sedan","fa":"سدان","ps":"سېډان"}},{"value":"suv","labels":{"en":"SUV","fa":"شاسی‌بلند","ps":"SUV"}},{"value":"hatchback","labels":{"en":"Hatchback","fa":"هاچ‌بک","ps":"هچبک"}},{"value":"pickup","labels":{"en":"Pickup","fa":"پیکاپ","ps":"پیک اپ"}},{"value":"van","labels":{"en":"Van","fa":"ون","ps":"وېن"}}]'::jsonb,'vehicle',100,false,true,false),
  ('car','drive_type','select','Drive type','نوع حرکت','د حرکت ډول','[{"value":"2wd","labels":{"en":"2WD","fa":"دو چرخ","ps":"دوه څرخ"}},{"value":"4wd","labels":{"en":"4WD","fa":"چهار چرخ","ps":"څلور څرخ"}}]'::jsonb,'vehicle',110,false,true,false),
  ('car','steering_side','select','Steering side','سمت فرمان','د سټیرنګ اړخ','[{"value":"left","labels":{"en":"Left","fa":"چپ","ps":"چپ"}},{"value":"right","labels":{"en":"Right","fa":"راست","ps":"ښی"}}]'::jsonb,'vehicle',120,false,true,false),
  ('motorcycle','engine_cc','number','Engine capacity (cc)','حجم موتور (سی‌سی)','د انجن حجم (سي سي)','[]'::jsonb,'vehicle',100,true,true,true),
  ('motorcycle','start_type','select','Start type','نوع استارت','د سټارټ ډول','[{"value":"electric","labels":{"en":"Electric start","fa":"استارت برقی","ps":"برېښنايي سټارټ"}},{"value":"kick","labels":{"en":"Kick start","fa":"کیک","ps":"کېک سټارټ"}}]'::jsonb,'vehicle',110,false,true,false),
  ('bicycle','bicycle_type','select','Bicycle type','نوع بایسکل','د بایسکل ډول','[{"value":"mountain","labels":{"en":"Mountain","fa":"کوهستانی","ps":"غرنی"}},{"value":"city","labels":{"en":"City","fa":"شهری","ps":"ښاري"}},{"value":"electric","labels":{"en":"Electric","fa":"برقی","ps":"برېښنايي"}},{"value":"kids","labels":{"en":"Kids","fa":"اطفال","ps":"ماشومانو"}}]'::jsonb,'vehicle',30,true,true,true),
  ('bicycle','frame_size','text','Frame / wheel size','اندازه فریم / تایر','د چوکاټ / ټایر اندازه','[]'::jsonb,'vehicle',40,false,true,false),
  ('commercial_vehicle','load_capacity','number','Load capacity (kg)','ظرفیت بار (کیلوگرام)','د بار ظرفیت (کیلوګرام)','[]'::jsonb,'vehicle',120,false,true,false),
  ('commercial_vehicle','axle_count','number','Number of axles','تعداد اکسل','د اکسل شمېر','[]'::jsonb,'vehicle',130,false,true,false),
  ('farm_vehicle','working_hours','number','Working hours','ساعات کار','کاري ساعتونه','[]'::jsonb,'vehicle',120,false,true,false),
  ('farm_vehicle','horsepower','number','Horsepower','قدرت موتور','هارس پاور','[]'::jsonb,'vehicle',130,false,true,false),
  ('vehicle_part','part_name','text','Part name','نام پرزه','د پرزې نوم','[]'::jsonb,'part',20,true,true,true),
  ('vehicle_part','compatible_make_model','text','Compatible make / model','برند و مدل سازگار','مناسب برانډ / ماډل','[]'::jsonb,'part',30,true,true,true),
  ('vehicle_part','part_number','text','Part number','شماره پرزه','د پرزې شمېره','[]'::jsonb,'part',40,false,false,false),
  ('vehicle_part','original_part','boolean','Original part','پرزه اصلی','اصلي پرزه','[]'::jsonb,'part',50,false,true,false),

  ('property_base','area_sqm','number','Area (m²)','مساحت (متر مربع)','مساحت (متر مربع)','[]'::jsonb,'property',20,true,true,true),
  ('property_base','document_type','select','Document type','نوع سند','د سند ډول','[{"value":"official","labels":{"en":"Official deed","fa":"سند رسمی","ps":"رسمي سند"}},{"value":"customary","labels":{"en":"Customary deed","fa":"قباله عرفی","ps":"عرفي قباله"}},{"value":"none","labels":{"en":"No document","fa":"بدون سند","ps":"بې اسناده"}}]'::jsonb,'documents',200,true,true,false),
  ('property_base','electricity','boolean','Electricity available','برق موجود است','برېښنا شته','[]'::jsonb,'utilities',300,false,true,false),
  ('property_base','water','boolean','Water available','آب موجود است','اوبه شته','[]'::jsonb,'utilities',310,false,true,false),
  ('property_base','road_access','boolean','Road access','راه موتررو','د موټر لار','[]'::jsonb,'utilities',320,false,true,false),
  ('residential_property','property_type','select','Property type','نوع ملکیت','د ملکیت ډول','[{"value":"house","labels":{"en":"House","fa":"خانه","ps":"کور"}},{"value":"apartment","labels":{"en":"Apartment","fa":"آپارتمان","ps":"اپارتمان"}},{"value":"villa","labels":{"en":"Villa","fa":"ویلا","ps":"ویلا"}},{"value":"room","labels":{"en":"Room","fa":"اتاق","ps":"خونه"}}]'::jsonb,'property',30,true,true,true),
  ('residential_property','bedrooms','number','Bedrooms','اتاق خواب','د خوب خونې','[]'::jsonb,'property',40,true,true,true),
  ('residential_property','bathrooms','number','Bathrooms','حمام‌ها','تشنابونه','[]'::jsonb,'property',50,false,true,false),
  ('residential_property','floor','number','Floor','منزل','پوړ','[]'::jsonb,'property',60,false,true,false),
  ('residential_property','furnished','boolean','Furnished','مبله','فرنیچر لري','[]'::jsonb,'amenities',100,false,true,false),
  ('residential_property','parking','boolean','Parking','پارکینگ','پارکینګ','[]'::jsonb,'amenities',110,false,true,false),
  ('commercial_property','commercial_type','select','Commercial property type','نوع ملکیت تجارتی','د سوداګریز ملکیت ډول','[{"value":"shop","labels":{"en":"Shop","fa":"دکان","ps":"دوکان"}},{"value":"office","labels":{"en":"Office","fa":"دفتر","ps":"دفتر"}},{"value":"warehouse","labels":{"en":"Warehouse","fa":"گدام","ps":"ګودام"}},{"value":"factory","labels":{"en":"Factory","fa":"فابریکه","ps":"فابریکه"}},{"value":"restaurant","labels":{"en":"Restaurant","fa":"رستورانت","ps":"رستورانت"}}]'::jsonb,'property',30,true,true,true),
  ('commercial_property','frontage_m','number','Frontage (m)','عرض دهنه (متر)','مخامخ پلنوالی (متر)','[]'::jsonb,'property',40,false,true,false),
  ('commercial_property','business_ready','boolean','Ready for business','آماده فعالیت','سوداګرۍ ته چمتو','[]'::jsonb,'amenities',100,false,true,false),
  ('land','land_use','select','Land use','کاربری زمین','د ځمکې کارونه','[{"value":"residential","labels":{"en":"Residential","fa":"رهایشی","ps":"استوګنیز"}},{"value":"commercial","labels":{"en":"Commercial","fa":"تجارتی","ps":"سوداګریز"}},{"value":"agricultural","labels":{"en":"Agricultural","fa":"زراعتی","ps":"کرنیز"}},{"value":"garden","labels":{"en":"Garden","fa":"باغ","ps":"باغ"}}]'::jsonb,'property',30,true,true,true),
  ('land','irrigation','boolean','Irrigation available','آبیاری موجود است','اوبه لګونه شته','[]'::jsonb,'utilities',330,false,true,false),
  ('short_term_property','guest_capacity','number','Guest capacity','ظرفیت مهمان','د مېلمنو ظرفیت','[]'::jsonb,'property',40,true,true,true),
  ('short_term_property','rental_period','select','Rental period','دوره کرایه','د کرایې موده','[{"value":"daily","labels":{"en":"Daily","fa":"روزانه","ps":"ورځنی"}},{"value":"weekly","labels":{"en":"Weekly","fa":"هفتگی","ps":"اونیز"}},{"value":"monthly","labels":{"en":"Monthly","fa":"ماهانه","ps":"میاشتنی"}}]'::jsonb,'property',50,true,true,true),
  ('property_project','completion_status','select','Completion status','وضعیت تکمیل','د بشپړېدو حالت','[{"value":"planned","labels":{"en":"Planned","fa":"طرح شده","ps":"پلان شوی"}},{"value":"construction","labels":{"en":"Under construction","fa":"در حال ساخت","ps":"تر کار لاندې"}},{"value":"complete","labels":{"en":"Completed","fa":"تکمیل شده","ps":"بشپړ شوی"}}]'::jsonb,'project',30,true,true,true),
  ('property_project','units_available','number','Units available','واحدهای موجود','شته واحدونه','[]'::jsonb,'project',40,false,true,false),

  ('electronic_base','brand','text','Brand','برند','برانډ','[]'::jsonb,'device',20,true,true,true),
  ('electronic_base','model','text','Model','مدل','ماډل','[]'::jsonb,'device',30,true,true,true),
  ('electronic_base','warranty','boolean','Warranty available','تضمین موجود است','تضمین شته','[]'::jsonb,'device',100,false,true,false),
  ('phone','storage_gb','number','Storage (GB)','حافظه (GB)','حافظه (GB)','[]'::jsonb,'specifications',40,true,true,true),
  ('phone','ram_gb','number','RAM (GB)','رم (GB)','رام (GB)','[]'::jsonb,'specifications',50,false,true,false),
  ('phone','battery_health','number','Battery health (%)','سلامت باتری (%)','د بیټرۍ روغتیا (%)','[]'::jsonb,'condition',60,false,true,false),
  ('phone','sim_type','select','SIM support','پشتیبانی سیم‌کارت','د سیم کارت ملاتړ','[{"value":"single","labels":{"en":"Single SIM","fa":"یک سیم","ps":"یو سیم"}},{"value":"dual","labels":{"en":"Dual SIM","fa":"دو سیم","ps":"دوه سیم"}},{"value":"esim","labels":{"en":"eSIM","fa":"ای‌سیم","ps":"eSIM"}}]'::jsonb,'specifications',70,false,true,false),
  ('computer','processor','text','Processor','پردازنده','پروسیسر','[]'::jsonb,'specifications',40,true,true,true),
  ('computer','ram_gb','number','RAM (GB)','رم (GB)','رام (GB)','[]'::jsonb,'specifications',50,true,true,true),
  ('computer','storage','text','Storage','حافظه','حافظه','[]'::jsonb,'specifications',60,true,true,true),
  ('computer','graphics','text','Graphics','کارت گرافیک','ګرافیکس','[]'::jsonb,'specifications',70,false,true,false),
  ('computer','screen_size','text','Screen size','اندازه صفحه','د سکرین اندازه','[]'::jsonb,'specifications',80,false,true,false),
  ('camera','camera_type','select','Camera type','نوع کمره','د کمرې ډول','[{"value":"dslr","labels":{"en":"DSLR","fa":"DSLR","ps":"DSLR"}},{"value":"mirrorless","labels":{"en":"Mirrorless","fa":"بدون آینه","ps":"بې هندارې"}},{"value":"security","labels":{"en":"Security camera","fa":"کمره امنیتی","ps":"امنیتي کمره"}},{"value":"projector","labels":{"en":"Projector","fa":"پروژکتور","ps":"پروجکټور"}}]'::jsonb,'specifications',40,true,true,true),
  ('camera','resolution','text','Resolution','وضوح تصویر','ریزولوشن','[]'::jsonb,'specifications',50,false,true,false),
  ('television','screen_size','text','Screen size','اندازه صفحه','د سکرین اندازه','[]'::jsonb,'specifications',40,true,true,true),
  ('television','display_type','select','Display type','نوع نمایشگر','د سکرین ډول','[{"value":"led","labels":{"en":"LED","fa":"LED","ps":"LED"}},{"value":"oled","labels":{"en":"OLED","fa":"OLED","ps":"OLED"}},{"value":"lcd","labels":{"en":"LCD","fa":"LCD","ps":"LCD"}}]'::jsonb,'specifications',50,false,true,false),
  ('media_device','device_type','text','Device type','نوع دستگاه','د وسیلې ډول','[]'::jsonb,'device',40,true,true,true),
  ('media_device','power_output','text','Power / output','توان / خروجی','ځواک / وتۍ','[]'::jsonb,'specifications',50,false,true,false),
  ('power_equipment','power_rating','text','Power rating','توان دستگاه','د ځواک کچه','[]'::jsonb,'specifications',40,true,true,true),
  ('power_equipment','capacity','text','Capacity','ظرفیت','ظرفیت','[]'::jsonb,'specifications',50,false,true,false),
  ('electronic_accessory','accessory_type','text','Accessory type','نوع لوازم','د لوازمو ډول','[]'::jsonb,'device',40,true,true,true),
  ('electronic_accessory','compatibility','text','Compatible devices','دستگاه‌های سازگار','مناسبې وسیلې','[]'::jsonb,'device',50,false,true,false),
  ('device_repair','devices_serviced','text','Devices serviced','دستگاه‌های تحت خدمات','خدمت کېدونکې وسیلې','[]'::jsonb,'service',20,true,true,true),
  ('device_repair','repair_warranty','boolean','Repair warranty','تضمین ترمیم','د ترمیم تضمین','[]'::jsonb,'service',30,false,true,false),

  ('appliance','appliance_type','text','Appliance type','نوع وسیله خانگی','د کور وسیلې ډول','[]'::jsonb,'item',20,true,true,true),
  ('appliance','brand','text','Brand','برند','برانډ','[]'::jsonb,'item',30,false,true,true),
  ('appliance','capacity','text','Capacity / size','ظرفیت / اندازه','ظرفیت / اندازه','[]'::jsonb,'specifications',40,false,true,false),
  ('appliance','energy_source','select','Energy source','منبع انرژی','د انرژۍ سرچینه','[{"value":"electric","labels":{"en":"Electric","fa":"برقی","ps":"برېښنايي"}},{"value":"gas","labels":{"en":"Gas","fa":"گازی","ps":"ګازي"}},{"value":"solar","labels":{"en":"Solar","fa":"آفتابی","ps":"لمریز"}}]'::jsonb,'specifications',50,false,true,false),
  ('furniture','furniture_type','text','Furniture type','نوع فرنیچر','د فرنیچر ډول','[]'::jsonb,'item',20,true,true,true),
  ('furniture','material','text','Material','جنس','مواد','[]'::jsonb,'item',30,false,true,false),
  ('furniture','dimensions','text','Dimensions','ابعاد','ابعاد','[]'::jsonb,'item',40,false,false,false),
  ('clothing','clothing_type','text','Item type','نوع جنس','د توکي ډول','[]'::jsonb,'item',20,true,true,true),
  ('clothing','size','text','Size','اندازه','اندازه','[]'::jsonb,'item',30,false,true,true),
  ('clothing','gender','select','For','برای','د چا لپاره','[{"value":"men","labels":{"en":"Men","fa":"مردانه","ps":"نارینه"}},{"value":"women","labels":{"en":"Women","fa":"زنانه","ps":"ښځینه"}},{"value":"kids","labels":{"en":"Children","fa":"اطفال","ps":"ماشومان"}},{"value":"unisex","labels":{"en":"Unisex","fa":"عمومی","ps":"ټولو لپاره"}}]'::jsonb,'item',40,false,true,false),
  ('book','book_type','text','Book type / subject','نوع / موضوع کتاب','د کتاب ډول / موضوع','[]'::jsonb,'item',20,true,true,true),
  ('book','language','text','Language','زبان','ژبه','[]'::jsonb,'item',30,false,true,false),
  ('book','author','text','Author','نویسنده','لیکوال','[]'::jsonb,'item',40,false,true,false),
  ('tool','tool_type','text','Tool / material type','نوع ابزار / مواد','د وسیلې / موادو ډول','[]'::jsonb,'item',20,true,true,true),
  ('tool','brand','text','Brand','برند','برانډ','[]'::jsonb,'item',30,false,true,true),
  ('baby_item','age_range','text','Age range','محدوده سنی','د عمر کچه','[]'::jsonb,'item',20,true,true,true),
  ('household_item','item_type','text','Item type','نوع جنس','د توکي ډول','[]'::jsonb,'item',20,true,true,true),

  ('animal','animal_type','text','Animal type','نوع حیوان','د حیوان ډول','[]'::jsonb,'animal',20,true,true,true),
  ('animal','breed','text','Breed','نسل','نسل','[]'::jsonb,'animal',30,false,true,true),
  ('animal','age','text','Age','سن','عمر','[]'::jsonb,'animal',40,false,true,false),
  ('animal','sex','select','Sex','جنسیت','جنس','[{"value":"male","labels":{"en":"Male","fa":"نر","ps":"نر"}},{"value":"female","labels":{"en":"Female","fa":"ماده","ps":"ښځینه"}}]'::jsonb,'animal',50,false,true,false),
  ('animal','quantity','number','Quantity','تعداد','شمېر','[]'::jsonb,'animal',60,true,true,true),
  ('animal','vaccinated','boolean','Vaccinated / health checked','واکسین / معاینه شده','واکسین / روغتیا کتل شوې','[]'::jsonb,'health',100,false,true,false),
  ('animal_feed','feed_type','text','Feed type','نوع خوراک','د خوراک ډول','[]'::jsonb,'product',20,true,true,true),
  ('animal_feed','weight_kg','number','Weight (kg)','وزن (کیلوگرام)','وزن (کیلوګرام)','[]'::jsonb,'product',30,true,true,true),
  ('farm_equipment','equipment_type','text','Equipment type','نوع تجهیزات','د تجهیزاتو ډول','[]'::jsonb,'equipment',20,true,true,true),
  ('farm_equipment','brand','text','Brand','برند','برانډ','[]'::jsonb,'equipment',30,false,true,true),
  ('farm_equipment','power_source','text','Power source','منبع انرژی','د ځواک سرچینه','[]'::jsonb,'equipment',40,false,true,false),

  ('course','subject','text','Subject / skill','موضوع / مهارت','موضوع / مهارت','[]'::jsonb,'course',20,true,true,true),
  ('course','delivery_mode','select','Learning mode','شیوه آموزش','د زده کړې طریقه','[{"value":"in_person","labels":{"en":"In person","fa":"حضوری","ps":"حضوري"}},{"value":"online","labels":{"en":"Online","fa":"آنلاین","ps":"آنلاین"}},{"value":"hybrid","labels":{"en":"Hybrid","fa":"ترکیبی","ps":"ګډ"}}]'::jsonb,'course',30,true,true,true),
  ('course','level','text','Level','سطح','کچه','[]'::jsonb,'course',40,false,true,false),
  ('course','duration','text','Duration','مدت','موده','[]'::jsonb,'course',50,false,true,false),
  ('education_material','subject','text','Subject','موضوع','موضوع','[]'::jsonb,'material',20,true,true,true),
  ('education_material','education_level','text','Education level','سطح تحصیلی','د زده کړې کچه','[]'::jsonb,'material',30,false,true,false),
  ('business_equipment','equipment_type','text','Equipment type','نوع تجهیزات','د تجهیزاتو ډول','[]'::jsonb,'equipment',20,true,true,true),
  ('business_equipment','brand','text','Brand / manufacturer','برند / سازنده','برانډ / جوړوونکی','[]'::jsonb,'equipment',30,false,true,true),
  ('business_equipment','capacity','text','Capacity / specification','ظرفیت / مشخصات','ظرفیت / ځانګړنې','[]'::jsonb,'equipment',40,false,true,false),
  ('business_sale','business_type','text','Business type','نوع تجارت','د سوداګرۍ ډول','[]'::jsonb,'business',20,true,true,true),
  ('business_sale','years_operating','number','Years operating','سال‌های فعالیت','د فعالیت کلونه','[]'::jsonb,'business',30,false,true,false),
  ('business_sale','employees','number','Number of employees','تعداد کارمندان','د کارکوونکو شمېر','[]'::jsonb,'business',40,false,true,false),
  ('business_sale','license_status','text','License status','وضعیت جواز','د جواز حالت','[]'::jsonb,'business',50,false,true,false)
),
scope_map(family, scope) as (
  values
  ('car','item_base'),('car','vehicle_base'),('car','car'),
  ('motorcycle','item_base'),('motorcycle','vehicle_base'),('motorcycle','motorcycle'),
  ('bicycle','item_base'),('bicycle','bicycle'),
  ('commercial_vehicle','item_base'),('commercial_vehicle','vehicle_base'),('commercial_vehicle','commercial_vehicle'),
  ('farm_vehicle','item_base'),('farm_vehicle','vehicle_base'),('farm_vehicle','farm_vehicle'),
  ('vehicle_part','item_base'),('vehicle_part','vehicle_part'),
  ('vehicle','item_base'),('vehicle','vehicle_base'),
  ('residential_property','property_base'),('residential_property','residential_property'),
  ('commercial_property','property_base'),('commercial_property','commercial_property'),
  ('land','property_base'),('land','land'),
  ('short_term_property','property_base'),('short_term_property','residential_property'),('short_term_property','short_term_property'),
  ('property_project','property_base'),('property_project','property_project'),
  ('phone','item_base'),('phone','electronic_base'),('phone','phone'),
  ('computer','item_base'),('computer','electronic_base'),('computer','computer'),
  ('camera','item_base'),('camera','electronic_base'),('camera','camera'),
  ('television','item_base'),('television','electronic_base'),('television','television'),
  ('media_device','item_base'),('media_device','electronic_base'),('media_device','media_device'),
  ('power_equipment','item_base'),('power_equipment','electronic_base'),('power_equipment','power_equipment'),
  ('electronic_accessory','item_base'),('electronic_accessory','electronic_accessory'),
  ('device_repair','device_repair'),
  ('electronic','item_base'),('electronic','electronic_base'),
  ('appliance','item_base'),('appliance','appliance'),
  ('furniture','item_base'),('furniture','furniture'),
  ('clothing','item_base'),('clothing','clothing'),
  ('book','item_base'),('book','book'),
  ('tool','item_base'),('tool','tool'),
  ('baby_item','item_base'),('baby_item','baby_item'),
  ('household_item','item_base'),('household_item','household_item'),
  ('animal','animal'),('animal_feed','item_base'),('animal_feed','animal_feed'),
  ('farm_equipment','item_base'),('farm_equipment','farm_equipment'),
  ('course','course'),('education_material','item_base'),('education_material','education_material'),
  ('business_equipment','item_base'),('business_equipment','business_equipment'),
  ('business_sale','business_sale')
),
resolved_fields as (
  select c.id as category_node_id, c.family, d.*
  from classified c
  join scope_map m on m.family = c.family
  join field_defs d on d.scope = m.scope
  where c.family is not null
),
field_configs as (
  select category_node_id, family,
    jsonb_agg(jsonb_build_object(
      'key', field_key, 'type', field_type,
      'labels', jsonb_build_object('en', label_en, 'fa', label_fa, 'ps', label_ps),
      'options', options, 'sectionKey', section_key, 'order', sort_order,
      'required', required, 'posting', true, 'filter', filterable,
      'card', card, 'detail', true, 'active', true
    ) order by sort_order, field_key) as fields
  from resolved_fields
  group by category_node_id, family
),
section_keys as (
  select category_node_id, family, section_key, min(sort_order) sort_order
  from resolved_fields group by category_node_id, family, section_key
),
ordered_sections as (
  select category_node_id, family, section_key, sort_order,
    row_number() over (partition by category_node_id order by sort_order, section_key) - 1 as section_order
  from section_keys
),
section_configs as (
  select category_node_id, family,
    jsonb_agg(jsonb_build_object(
      'key', section_key,
      'titles', jsonb_build_object(
        'en', initcap(replace(section_key,'_',' ')),
        'fa', case section_key when 'overview' then 'مرور کلی' when 'trade' then 'معامله و تحویل' when 'vehicle' then 'مشخصات وسیله' when 'documents' then 'اسناد' when 'property' then 'مشخصات ملکیت' when 'utilities' then 'خدمات و امکانات' when 'amenities' then 'امکانات' when 'specifications' then 'مشخصات تخنیکی' when 'condition' then 'وضعیت' when 'animal' then 'مشخصات حیوان' when 'health' then 'صحت' when 'course' then 'جزئیات آموزش' when 'business' then 'جزئیات تجارت' else 'جزئیات' end,
        'ps', case section_key when 'overview' then 'لنډیز' when 'trade' then 'معامله او سپارل' when 'vehicle' then 'د وسیلې ځانګړنې' when 'documents' then 'اسناد' when 'property' then 'د ملکیت ځانګړنې' when 'utilities' then 'خدمتونه او اسانتیاوې' when 'amenities' then 'اسانتیاوې' when 'specifications' then 'تخنیکي ځانګړنې' when 'condition' then 'حالت' when 'animal' then 'د حیوان ځانګړنې' when 'health' then 'روغتیا' when 'course' then 'د زده کړې جزیات' when 'business' then 'د سوداګرۍ جزیات' else 'جزیات' end
      ),
      'order', section_order,
      'visible', true
    ) order by sort_order, section_key) as sections
  from ordered_sections
  group by category_node_id, family
),
new_configs as (
  select f.category_node_id, f.family,
    jsonb_build_object(
      'schemaVersion', 2,
      'taxonomyFamily', f.family,
      'fields', f.fields,
      'sections', s.sections
    ) config
  from field_configs f
  join section_configs s using (category_node_id, family)
),
next_versions as (
  select c.category_node_id, c.family, c.config,
    coalesce(max(v.version), 0) + 1 next_version
  from new_configs c
  left join public.listing_schema_versions v on v.category_node_id = c.category_node_id
  group by c.category_node_id, c.family, c.config
)
select next.category_node_id, next.next_version, next.config, admin.user_id as created_by
from next_versions next
cross join super_admin admin;

update public.listing_schema_versions current
set status = 'archived'
from taxonomy_schema_seed next
where current.category_node_id = next.category_node_id
  and current.status = 'published';

insert into public.listing_schema_versions(category_node_id, version, status, config, created_by)
select category_node_id, next_version, 'published', config, created_by
from taxonomy_schema_seed;

commit;
