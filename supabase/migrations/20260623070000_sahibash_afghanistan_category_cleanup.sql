begin;

-- Hide legacy vehicle branches introduced by older migrations without deleting them,
-- so existing listings keep their references while the live tree stays clean.
update public.category_nodes
set is_active = false,
    updated_at = now()
where path in (
  'vehicles/passenger-vehicles',
  'vehicles/old-vehicles',
  'vehicles/imported-cars',
  'vehicles/rebuilt-cars',
  'vehicles/custom-modified-cars',
  'vehicles/rickshaw-three-wheelers',
  'vehicles/commercial-vehicles',
  'vehicles/agricultural-rural-vehicles',
  'vehicles/other-custom-vehicles',
  'vehicles/pickup-trucks'
)
or path like 'vehicles/passenger-vehicles/%'
or path like 'vehicles/old-vehicles/%'
or path like 'vehicles/imported-cars/%'
or path like 'vehicles/rebuilt-cars/%'
or path like 'vehicles/custom-modified-cars/%'
or path like 'vehicles/rickshaw-three-wheelers/%'
or path like 'vehicles/commercial-vehicles/%'
or path like 'vehicles/agricultural-rural-vehicles/%'
or path like 'vehicles/other-custom-vehicles/%'
or path like 'vehicles/pickup-trucks/%';

-- Clean, Afghanistan-specific category tree.
create temporary table desired_category_nodes (
  parent_path text not null,
  path text primary key,
  name text not null,
  slug text not null,
  level int not null,
  sort_order int not null,
  is_leaf boolean not null,
  description text,
  icon text
) on commit drop;

insert into desired_category_nodes (parent_path, path, name, slug, level, sort_order, is_leaf, description, icon)
values
  ('vehicles', 'vehicles/cars', 'Cars', 'cars', 2, 1, false, 'Passenger cars, sedans, SUVs, and common Afghan family vehicles.', 'car'),
  ('vehicles', 'vehicles/motorcycles', 'Motorcycles', 'motorcycles', 2, 2, false, 'Honda 70, CG125, sport bikes, and motorcycle parts.', 'bike'),
  ('vehicles', 'vehicles/rickshaws-three-wheelers', 'Rickshaws / Three-Wheelers', 'rickshaws-three-wheelers', 2, 3, false, 'Passenger, cargo, and electric rickshaws.', 'motorbike'),
  ('vehicles', 'vehicles/bicycles', 'Bicycles', 'bicycles', 2, 4, false, 'Mountain, city, kids, and electric bicycles.', 'bicycle'),
  ('vehicles', 'vehicles/vans-minibuses', 'Vans & Minibuses', 'vans-minibuses', 2, 5, true, 'Passenger vans, school vans, and minibuses.', 'bus'),
  ('vehicles', 'vehicles/trucks-heavy-vehicles', 'Trucks & Heavy Vehicles', 'trucks-heavy-vehicles', 2, 6, true, 'Small trucks, heavy trucks, and cargo transport.', 'truck'),
  ('vehicles', 'vehicles/agricultural-vehicles', 'Agricultural Vehicles', 'agricultural-vehicles', 2, 7, true, 'Tractors and agricultural work vehicles.', 'tractor'),
  ('vehicles', 'vehicles/vehicle-parts-accessories', 'Vehicle Parts & Accessories', 'vehicle-parts-accessories', 2, 8, true, 'Spare parts, tires, batteries, oils, and accessories.', 'settings'),
  ('vehicles', 'vehicles/damaged-vehicles-for-parts', 'Damaged Vehicles / For Parts', 'damaged-vehicles-for-parts', 2, 9, true, 'Damaged vehicles and vehicles sold for dismantling.', 'alert-triangle'),
  ('vehicles', 'vehicles/other-vehicles', 'Other Vehicles', 'other-vehicles', 2, 10, true, 'Manual entry for vehicles that do not fit a fixed branch.', 'dots-horizontal'),

  ('vehicles/cars', 'vehicles/cars/toyota', 'Toyota', 'toyota', 3, 1, false, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/honda', 'Honda', 'honda', 3, 2, false, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/hyundai', 'Hyundai', 'hyundai', 3, 3, false, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/kia', 'Kia', 'kia', 3, 4, false, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/nissan', 'Nissan', 'nissan', 3, 5, false, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/suzuki', 'Suzuki', 'suzuki', 3, 6, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/mazda', 'Mazda', 'mazda', 3, 7, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/mitsubishi', 'Mitsubishi', 'mitsubishi', 3, 8, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/mercedes-benz', 'Mercedes-Benz', 'mercedes-benz', 3, 9, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/bmw', 'BMW', 'bmw', 3, 10, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/lexus', 'Lexus', 'lexus', 3, 11, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/ford', 'Ford', 'ford', 3, 12, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/chevrolet', 'Chevrolet', 'chevrolet', 3, 13, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/volkswagen', 'Volkswagen', 'volkswagen', 3, 14, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/land-rover', 'Land Rover', 'land-rover', 3, 15, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/jeep', 'Jeep', 'jeep', 3, 16, true, null, 'car'),
  ('vehicles/cars', 'vehicles/cars/other-brand', 'Other Brand', 'other-brand', 3, 17, true, 'Manual brand entry fallback.', 'dots-horizontal'),

  ('vehicles/cars/toyota', 'vehicles/cars/toyota/corolla', 'Corolla', 'corolla', 4, 1, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/land-cruiser', 'Land Cruiser', 'land-cruiser', 4, 2, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/land-cruiser-prado', 'Land Cruiser Prado', 'land-cruiser-prado', 4, 3, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/hilux', 'Hilux', 'hilux', 4, 4, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/4runner', '4Runner', '4runner', 4, 5, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/camry', 'Camry', 'camry', 4, 6, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/mark-x', 'Mark X', 'mark-x', 4, 7, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/crown', 'Crown', 'crown', 4, 8, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/vitz', 'Vitz', 'vitz', 4, 9, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/yaris', 'Yaris', 'yaris', 4, 10, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/fielder', 'Fielder', 'fielder', 4, 11, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/aqua', 'Aqua', 'aqua', 4, 12, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/prius', 'Prius', 'prius', 4, 13, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/rav4', 'RAV4', 'rav4', 4, 14, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/highlander', 'Highlander', 'highlander', 4, 15, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/hiace', 'Hiace', 'hiace', 4, 16, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/townace-saracha', 'TownAce / Saracha', 'townace-saracha', 4, 17, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/surf-hilux-surf', 'Surf / Hilux Surf', 'surf-hilux-surf', 4, 18, true, null, 'car'),
  ('vehicles/cars/toyota', 'vehicles/cars/toyota/other-toyota-model', 'Other Toyota Model', 'other-toyota-model', 4, 19, true, 'Manual Toyota model entry fallback.', 'dots-horizontal'),

  ('vehicles/cars/honda', 'vehicles/cars/honda/civic', 'Civic', 'civic', 4, 1, true, null, 'car'),
  ('vehicles/cars/honda', 'vehicles/cars/honda/accord', 'Accord', 'accord', 4, 2, true, null, 'car'),
  ('vehicles/cars/honda', 'vehicles/cars/honda/cr-v', 'CR-V', 'cr-v', 4, 3, true, null, 'car'),
  ('vehicles/cars/honda', 'vehicles/cars/honda/fit', 'Fit', 'fit', 4, 4, true, null, 'car'),
  ('vehicles/cars/honda', 'vehicles/cars/honda/other-honda-model', 'Other Honda Model', 'other-honda-model', 4, 5, true, 'Manual Honda model entry fallback.', 'dots-horizontal'),

  ('vehicles/cars/hyundai', 'vehicles/cars/hyundai/sonata', 'Sonata', 'sonata', 4, 1, true, null, 'car'),
  ('vehicles/cars/hyundai', 'vehicles/cars/hyundai/elantra', 'Elantra', 'elantra', 4, 2, true, null, 'car'),
  ('vehicles/cars/hyundai', 'vehicles/cars/hyundai/tucson', 'Tucson', 'tucson', 4, 3, true, null, 'car'),
  ('vehicles/cars/hyundai', 'vehicles/cars/hyundai/santa-fe', 'Santa Fe', 'santa-fe', 4, 4, true, null, 'car'),
  ('vehicles/cars/hyundai', 'vehicles/cars/hyundai/accent', 'Accent', 'accent', 4, 5, true, null, 'car'),
  ('vehicles/cars/hyundai', 'vehicles/cars/hyundai/other-hyundai-model', 'Other Hyundai Model', 'other-hyundai-model', 4, 6, true, 'Manual Hyundai model entry fallback.', 'dots-horizontal'),

  ('vehicles/cars/kia', 'vehicles/cars/kia/sportage', 'Sportage', 'sportage', 4, 1, true, null, 'car'),
  ('vehicles/cars/kia', 'vehicles/cars/kia/sorento', 'Sorento', 'sorento', 4, 2, true, null, 'car'),
  ('vehicles/cars/kia', 'vehicles/cars/kia/optima', 'Optima', 'optima', 4, 3, true, null, 'car'),
  ('vehicles/cars/kia', 'vehicles/cars/kia/picanto', 'Picanto', 'picanto', 4, 4, true, null, 'car'),
  ('vehicles/cars/kia', 'vehicles/cars/kia/other-kia-model', 'Other Kia Model', 'other-kia-model', 4, 5, true, 'Manual Kia model entry fallback.', 'dots-horizontal'),

  ('vehicles/cars/nissan', 'vehicles/cars/nissan/sunny', 'Sunny', 'sunny', 4, 1, true, null, 'car'),
  ('vehicles/cars/nissan', 'vehicles/cars/nissan/maxima', 'Maxima', 'maxima', 4, 2, true, null, 'car'),
  ('vehicles/cars/nissan', 'vehicles/cars/nissan/patrol', 'Patrol', 'patrol', 4, 3, true, null, 'car'),
  ('vehicles/cars/nissan', 'vehicles/cars/nissan/x-trail', 'X-Trail', 'x-trail', 4, 4, true, null, 'car'),
  ('vehicles/cars/nissan', 'vehicles/cars/nissan/other-nissan-model', 'Other Nissan Model', 'other-nissan-model', 4, 5, true, 'Manual Nissan model entry fallback.', 'dots-horizontal'),

  ('vehicles/motorcycles', 'vehicles/motorcycles/honda-cd70-honda-70', 'Honda CD70 / Honda 70', 'honda-cd70-honda-70', 3, 1, true, null, 'bike'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/honda-cg125-honda-125', 'Honda CG125 / Honda 125', 'honda-cg125-honda-125', 3, 2, true, null, 'bike'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/chinese-motorcycles', 'Chinese Motorcycles', 'chinese-motorcycles', 3, 3, true, null, 'bike'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/indian-motorcycles', 'Indian Motorcycles', 'indian-motorcycles', 3, 4, true, null, 'bike'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/150cc-250cc-motorcycles', '150cc–250cc Motorcycles', '150cc-250cc-motorcycles', 3, 5, true, null, 'bike'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/sport-motorcycles', 'Sport Motorcycles', 'sport-motorcycles', 3, 6, true, null, 'bike'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/dirt-bikes', 'Dirt Bikes', 'dirt-bikes', 3, 7, true, null, 'bike'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/electric-motorcycles', 'Electric Motorcycles', 'electric-motorcycles', 3, 8, true, null, 'bike'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/motorcycle-parts', 'Motorcycle Parts', 'motorcycle-parts', 3, 9, true, null, 'settings'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/other-motorcycle', 'Other Motorcycle', 'other-motorcycle', 3, 10, true, 'Manual entry for rare or unbranded motorcycles.', 'dots-horizontal'),

  ('vehicles/rickshaws-three-wheelers', 'vehicles/rickshaws-three-wheelers/passenger-rickshaw', 'Passenger Rickshaw', 'passenger-rickshaw', 3, 1, true, null, 'motorbike'),
  ('vehicles/rickshaws-three-wheelers', 'vehicles/rickshaws-three-wheelers/cargo-rickshaw', 'Cargo Rickshaw', 'cargo-rickshaw', 3, 2, true, null, 'motorbike'),
  ('vehicles/rickshaws-three-wheelers', 'vehicles/rickshaws-three-wheelers/electric-rickshaw', 'Electric Rickshaw', 'electric-rickshaw', 3, 3, true, null, 'motorbike'),
  ('vehicles/rickshaws-three-wheelers', 'vehicles/rickshaws-three-wheelers/rickshaw-parts', 'Rickshaw Parts', 'rickshaw-parts', 3, 4, true, null, 'settings'),
  ('vehicles/rickshaws-three-wheelers', 'vehicles/rickshaws-three-wheelers/other-rickshaw', 'Other Rickshaw', 'other-rickshaw', 3, 5, true, 'Manual entry for uncommon three-wheeler types.', 'dots-horizontal'),

  ('vehicles/bicycles', 'vehicles/bicycles/mountain-bike', 'Mountain Bike', 'mountain-bike', 3, 1, true, null, 'bicycle'),
  ('vehicles/bicycles', 'vehicles/bicycles/city-bike', 'City Bike', 'city-bike', 3, 2, true, null, 'bicycle'),
  ('vehicles/bicycles', 'vehicles/bicycles/kids-bike', 'Kids Bike', 'kids-bike', 3, 3, true, null, 'bicycle'),
  ('vehicles/bicycles', 'vehicles/bicycles/electric-bicycle', 'Electric Bicycle', 'electric-bicycle', 3, 4, true, null, 'bicycle'),
  ('vehicles/bicycles', 'vehicles/bicycles/bicycle-parts', 'Bicycle Parts', 'bicycle-parts', 3, 5, true, null, 'settings'),
  ('vehicles/bicycles', 'vehicles/bicycles/other-bicycle', 'Other Bicycle', 'other-bicycle', 3, 6, true, 'Manual entry for uncommon bicycles.', 'dots-horizontal'),

  ('real-estate', 'real-estate/houses', 'Houses', 'houses', 2, 1, false, 'Standalone homes, villas, duplexes, and family houses.', 'home'),
  ('real-estate', 'real-estate/apartments', 'Apartments', 'apartments', 2, 2, false, 'Apartments, flats, and furnished units.', 'building-2'),
  ('real-estate', 'real-estate/rooms', 'Rooms', 'rooms', 2, 3, true, 'Single rooms, shared rooms, and room rentals.', 'bed'),
  ('real-estate', 'real-estate/shops-commercial', 'Shops & Commercial', 'shops-commercial', 2, 4, true, 'Shops, bazaars, salons, and commercial units.', 'store'),
  ('real-estate', 'real-estate/offices', 'Offices', 'offices', 2, 5, true, 'Office and administrative spaces.', 'briefcase'),
  ('real-estate', 'real-estate/land', 'Land', 'land', 2, 6, true, 'Residential plots, land, and large parcels.', 'map'),
  ('real-estate', 'real-estate/warehouses', 'Warehouses', 'warehouses', 2, 7, true, 'Storage and warehouse spaces.', 'warehouse'),
  ('real-estate', 'real-estate/gardens-farms', 'Gardens / Farms', 'gardens-farms', 2, 8, true, 'Farms, orchards, and garden properties.', 'sprout'),
  ('real-estate', 'real-estate/short-term-rent', 'Short-Term Rent', 'short-term-rent', 2, 9, true, 'Daily and weekly accommodation.', 'calendar-clock'),
  ('real-estate', 'real-estate/other-property', 'Other Property', 'other-property', 2, 10, true, 'Manual entry for uncommon property types.', 'dots-horizontal'),

  ('real-estate/houses', 'real-estate/houses/normal-house', 'Normal House', 'normal-house', 3, 1, true, null, 'home'),
  ('real-estate/houses', 'real-estate/houses/luxury-house', 'Luxury House', 'luxury-house', 3, 2, true, null, 'home'),
  ('real-estate/houses', 'real-estate/houses/villa', 'Villa', 'villa', 3, 3, true, null, 'home'),
  ('real-estate/houses', 'real-estate/houses/duplex', 'Duplex', 'duplex', 3, 4, true, null, 'home'),
  ('real-estate/houses', 'real-estate/houses/multi-floor-house', 'Multi-Floor House', 'multi-floor-house', 3, 5, true, null, 'home'),
  ('real-estate/houses', 'real-estate/houses/old-house', 'Old House', 'old-house', 3, 6, true, null, 'home'),
  ('real-estate/houses', 'real-estate/houses/under-construction', 'Under Construction', 'under-construction', 3, 7, true, null, 'home'),
  ('real-estate/houses', 'real-estate/houses/other-house-type', 'Other House Type', 'other-house-type', 3, 8, true, 'Manual entry for rare house types.', 'dots-horizontal'),

  ('real-estate/apartments', 'real-estate/apartments/apartment', 'Apartment', 'apartment', 3, 1, true, null, 'building-2'),
  ('real-estate/apartments', 'real-estate/apartments/flat', 'Flat', 'flat', 3, 2, true, null, 'building-2'),
  ('real-estate/apartments', 'real-estate/apartments/modern-apartment', 'Modern Apartment', 'modern-apartment', 3, 3, true, null, 'building-2'),
  ('real-estate/apartments', 'real-estate/apartments/old-apartment', 'Old Apartment', 'old-apartment', 3, 4, true, null, 'building-2'),
  ('real-estate/apartments', 'real-estate/apartments/furnished-apartment', 'Furnished Apartment', 'furnished-apartment', 3, 5, true, null, 'building-2'),
  ('real-estate/apartments', 'real-estate/apartments/unfurnished-apartment', 'Unfurnished Apartment', 'unfurnished-apartment', 3, 6, true, null, 'building-2'),
  ('real-estate/apartments', 'real-estate/apartments/other-apartment-type', 'Other Apartment Type', 'other-apartment-type', 3, 7, true, 'Manual entry for uncommon apartment types.', 'dots-horizontal'),

  ('mobile-phones-tablets', 'mobile-phones-tablets/mobile-phones', 'Mobile Phones', 'mobile-phones', 2, 1, false, 'Smartphones and feature phones.', 'smartphone'),
  ('mobile-phones-tablets', 'mobile-phones-tablets/tablets', 'Tablets', 'tablets', 2, 2, true, 'Android tablets and iPads.', 'tablet'),
  ('mobile-phones-tablets', 'mobile-phones-tablets/smart-watches', 'Smart Watches', 'smart-watches', 2, 3, true, 'Smart watches and wearables.', 'watch'),
  ('mobile-phones-tablets', 'mobile-phones-tablets/phone-accessories', 'Phone Accessories', 'phone-accessories', 2, 4, true, 'Covers, chargers, earphones, and cases.', 'headphones'),
  ('mobile-phones-tablets', 'mobile-phones-tablets/sim-cards-numbers', 'SIM Cards & Numbers', 'sim-cards-numbers', 2, 5, true, 'SIM cards, numbers, and special mobile numbers.', 'sim-card'),
  ('mobile-phones-tablets', 'mobile-phones-tablets/phone-repair-services', 'Phone Repair Services', 'phone-repair-services', 2, 6, true, 'Repair and maintenance services.', 'wrench'),
  ('mobile-phones-tablets', 'mobile-phones-tablets/other', 'Other', 'other', 2, 7, true, 'Manual entry for mobile-related items.', 'dots-horizontal'),

  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/apple-iphone', 'Apple iPhone', 'apple-iphone', 3, 1, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/samsung', 'Samsung', 'samsung', 3, 2, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/xiaomi', 'Xiaomi', 'xiaomi', 3, 3, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/huawei', 'Huawei', 'huawei', 3, 4, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/honor', 'Honor', 'honor', 3, 5, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/oppo', 'Oppo', 'oppo', 3, 6, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/vivo', 'Vivo', 'vivo', 3, 7, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/nokia', 'Nokia', 'nokia', 3, 8, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/infinix', 'Infinix', 'infinix', 3, 9, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/tecno', 'Tecno', 'tecno', 3, 10, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/realme', 'Realme', 'realme', 3, 11, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/oneplus', 'OnePlus', 'oneplus', 3, 12, true, null, 'smartphone'),
  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/other-brand', 'Other Brand', 'other-brand', 3, 13, true, 'Manual phone brand fallback.', 'dots-horizontal'),

  ('electronics-computers', 'electronics-computers/laptops', 'Laptops', 'laptops', 2, 1, true, null, 'laptop'),
  ('electronics-computers', 'electronics-computers/desktop-computers', 'Desktop Computers', 'desktop-computers', 2, 2, true, null, 'monitor'),
  ('electronics-computers', 'electronics-computers/computer-parts-accessories', 'Computer Parts & Accessories', 'computer-parts-accessories', 2, 3, true, null, 'cpu'),
  ('electronics-computers', 'electronics-computers/monitors', 'Monitors', 'monitors', 2, 4, true, null, 'monitor'),
  ('electronics-computers', 'electronics-computers/printers-scanners', 'Printers & Scanners', 'printers-scanners', 2, 5, true, null, 'printer'),
  ('electronics-computers', 'electronics-computers/tvs', 'TVs', 'tvs', 2, 6, true, null, 'tv'),
  ('electronics-computers', 'electronics-computers/satellite-receivers', 'Satellite & Receivers', 'satellite-receivers', 2, 7, true, null, 'satellite-dish'),
  ('electronics-computers', 'electronics-computers/cameras', 'Cameras', 'cameras', 2, 8, true, null, 'camera'),
  ('electronics-computers', 'electronics-computers/game-consoles', 'Game Consoles', 'game-consoles', 2, 9, true, null, 'gamepad-2'),
  ('electronics-computers', 'electronics-computers/audio-speakers', 'Audio & Speakers', 'audio-speakers', 2, 10, true, null, 'speaker'),
  ('electronics-computers', 'electronics-computers/networking-wifi', 'Networking / Wi-Fi', 'networking-wifi', 2, 11, true, null, 'router'),
  ('electronics-computers', 'electronics-computers/chargers-power-banks', 'Chargers & Power Banks', 'chargers-power-banks', 2, 12, true, null, 'battery-charging'),
  ('electronics-computers', 'electronics-computers/other-electronics', 'Other Electronics', 'other-electronics', 2, 13, true, 'Manual entry for electronics not covered above.', 'dots-horizontal'),

  ('home-furniture-appliances', 'home-furniture-appliances/home-appliances', 'Home Appliances', 'home-appliances', 2, 1, true, null, 'refrigerator'),
  ('home-furniture-appliances', 'home-furniture-appliances/furniture', 'Furniture', 'furniture', 2, 2, true, null, 'sofa'),
  ('home-furniture-appliances', 'home-furniture-appliances/carpets-rugs', 'Carpets & Rugs', 'carpets-rugs', 2, 3, true, null, 'rug'),
  ('home-furniture-appliances', 'home-furniture-appliances/kitchen-items', 'Kitchen Items', 'kitchen-items', 2, 4, true, null, 'cooking-pot'),
  ('home-furniture-appliances', 'home-furniture-appliances/heating-cooling', 'Heating & Cooling', 'heating-cooling', 2, 5, true, null, 'fan'),
  ('home-furniture-appliances', 'home-furniture-appliances/tools', 'Tools', 'tools', 2, 6, true, null, 'hammer'),
  ('home-furniture-appliances', 'home-furniture-appliances/construction-materials', 'Construction Materials', 'construction-materials', 2, 7, true, null, 'brick-wall'),
  ('home-furniture-appliances', 'home-furniture-appliances/baby-kids-items', 'Baby & Kids Items', 'baby-kids-items', 2, 8, true, null, 'baby'),
  ('home-furniture-appliances', 'home-furniture-appliances/home-decoration', 'Home Decoration', 'home-decoration', 2, 9, true, null, 'lamp'),
  ('home-furniture-appliances', 'home-furniture-appliances/other-home-items', 'Other Home Items', 'other-home-items', 2, 10, true, 'Manual entry for household items not covered above.', 'dots-horizontal'),

  ('clothing-personal-items', 'clothing-personal-items/mens-clothing', 'Men''s Clothing', 'mens-clothing', 2, 1, true, null, 'shirt'),
  ('clothing-personal-items', 'clothing-personal-items/womens-clothing', 'Women''s Clothing', 'womens-clothing', 2, 2, true, null, 'shirt'),
  ('clothing-personal-items', 'clothing-personal-items/kids-clothing', 'Kids Clothing', 'kids-clothing', 2, 3, true, null, 'shirt'),
  ('clothing-personal-items', 'clothing-personal-items/shoes', 'Shoes', 'shoes', 2, 4, true, null, 'footprints'),
  ('clothing-personal-items', 'clothing-personal-items/bags-accessories', 'Bags & Accessories', 'bags-accessories', 2, 5, true, null, 'briefcase'),
  ('clothing-personal-items', 'clothing-personal-items/jewelry-watches', 'Jewelry & Watches', 'jewelry-watches', 2, 6, true, null, 'gem'),
  ('clothing-personal-items', 'clothing-personal-items/beauty-personal-care', 'Beauty & Personal Care', 'beauty-personal-care', 2, 7, true, null, 'sparkles'),
  ('clothing-personal-items', 'clothing-personal-items/other-clothing-personal-items', 'Other Clothing & Personal Items', 'other-clothing-personal-items', 2, 8, true, 'Manual entry for other clothing items.', 'dots-horizontal'),

  ('jobs', 'jobs/full-time-jobs', 'Full-Time Jobs', 'full-time-jobs', 2, 1, true, null, 'briefcase'),
  ('jobs', 'jobs/part-time-jobs', 'Part-Time Jobs', 'part-time-jobs', 2, 2, true, null, 'briefcase'),
  ('jobs', 'jobs/daily-labor', 'Daily Labor', 'daily-labor', 2, 3, true, null, 'hard-hat'),
  ('jobs', 'jobs/remote-work', 'Remote Work', 'remote-work', 2, 4, true, null, 'monitor'),
  ('jobs', 'jobs/teaching', 'Teaching', 'teaching', 2, 5, true, null, 'graduation-cap'),
  ('jobs', 'jobs/driver-jobs', 'Driver Jobs', 'driver-jobs', 2, 6, true, null, 'car'),
  ('jobs', 'jobs/security-jobs', 'Security Jobs', 'security-jobs', 2, 7, true, null, 'shield'),
  ('jobs', 'jobs/construction-jobs', 'Construction Jobs', 'construction-jobs', 2, 8, true, null, 'hard-hat'),
  ('jobs', 'jobs/medical-jobs', 'Medical Jobs', 'medical-jobs', 2, 9, true, null, 'stethoscope'),
  ('jobs', 'jobs/office-jobs', 'Office Jobs', 'office-jobs', 2, 10, true, null, 'briefcase'),
  ('jobs', 'jobs/internships', 'Internships', 'internships', 2, 11, true, null, 'graduation-cap'),
  ('jobs', 'jobs/other-jobs', 'Other Jobs', 'other-jobs', 2, 12, true, 'Manual entry for other job types.', 'dots-horizontal'),

  ('services', 'services/vehicle-services', 'Vehicle Services', 'vehicle-services', 2, 1, true, null, 'wrench'),
  ('services', 'services/phone-repair', 'Phone Repair', 'phone-repair', 2, 2, true, null, 'smartphone'),
  ('services', 'services/computer-repair', 'Computer Repair', 'computer-repair', 2, 3, true, null, 'laptop'),
  ('services', 'services/home-repair', 'Home Repair', 'home-repair', 2, 4, true, null, 'hammer'),
  ('services', 'services/construction', 'Construction', 'construction', 2, 5, true, null, 'brick-wall'),
  ('services', 'services/moving-transport', 'Moving & Transport', 'moving-transport', 2, 6, true, null, 'truck'),
  ('services', 'services/cleaning', 'Cleaning', 'cleaning', 2, 7, true, null, 'spray-can'),
  ('services', 'services/education-tutoring', 'Education & Tutoring', 'education-tutoring', 2, 8, true, null, 'book-open'),
  ('services', 'services/design-printing', 'Design & Printing', 'design-printing', 2, 9, true, null, 'printer'),
  ('services', 'services/legal-documents', 'Legal & Documents', 'legal-documents', 2, 10, true, null, 'file-text'),
  ('services', 'services/medical-services', 'Medical Services', 'medical-services', 2, 11, true, null, 'stethoscope'),
  ('services', 'services/other-services', 'Other Services', 'other-services', 2, 12, true, 'Manual entry for other services.', 'dots-horizontal'),

  ('business-industry', 'business-industry/shops-sale-rent', 'Shops for Sale / Rent', 'shops-sale-rent', 2, 1, true, null, 'store'),
  ('business-industry', 'business-industry/established-businesses', 'Established Businesses', 'established-businesses', 2, 2, true, null, 'store'),
  ('business-industry', 'business-industry/wholesale-goods', 'Wholesale Goods', 'wholesale-goods', 2, 3, true, null, 'boxes'),
  ('business-industry', 'business-industry/machinery', 'Machinery', 'machinery', 2, 4, true, null, 'factory'),
  ('business-industry', 'business-industry/industrial-equipment', 'Industrial Equipment', 'industrial-equipment', 2, 5, true, null, 'factory'),
  ('business-industry', 'business-industry/restaurant-equipment', 'Restaurant Equipment', 'restaurant-equipment', 2, 6, true, null, 'utensils-crossed'),
  ('business-industry', 'business-industry/office-equipment', 'Office Equipment', 'office-equipment', 2, 7, true, null, 'printer'),
  ('business-industry', 'business-industry/construction-equipment', 'Construction Equipment', 'construction-equipment', 2, 8, true, null, 'hard-hat'),
  ('business-industry', 'business-industry/other-business', 'Other Business', 'other-business', 2, 9, true, 'Manual entry for business inventory or business opportunities.', 'dots-horizontal'),

  ('farm-animals', 'farm-animals/cows', 'Cows', 'cows', 2, 1, true, null, 'beef'),
  ('farm-animals', 'farm-animals/sheep-goats', 'Sheep & Goats', 'sheep-goats', 2, 2, true, null, 'sheep'),
  ('farm-animals', 'farm-animals/chickens', 'Chickens', 'chickens', 2, 3, true, null, 'bird'),
  ('farm-animals', 'farm-animals/horses', 'Horses', 'horses', 2, 4, true, null, 'horse'),
  ('farm-animals', 'farm-animals/dogs', 'Dogs', 'dogs', 2, 5, true, null, 'dog'),
  ('farm-animals', 'farm-animals/cats', 'Cats', 'cats', 2, 6, true, null, 'cat'),
  ('farm-animals', 'farm-animals/birds', 'Birds', 'birds', 2, 7, true, null, 'bird'),
  ('farm-animals', 'farm-animals/animal-feed', 'Animal Feed', 'animal-feed', 2, 8, true, null, 'wheat'),
  ('farm-animals', 'farm-animals/farming-tools', 'Farming Tools', 'farming-tools', 2, 9, true, null, 'hammer'),
  ('farm-animals', 'farm-animals/tractors', 'Tractors', 'tractors', 2, 10, true, null, 'tractor'),
  ('farm-animals', 'farm-animals/other-animals', 'Other Animals', 'other-animals', 2, 11, true, 'Manual entry for other livestock or animals.', 'dots-horizontal'),

  ('education', 'education/books-study-materials', 'Books & Study Materials', 'books-study-materials', 2, 1, true, null, 'book-open'),
  ('education', 'education/tutoring', 'Tutoring', 'tutoring', 2, 2, true, null, 'book-open'),
  ('education', 'education/courses-training', 'Courses & Training', 'courses-training', 2, 3, true, null, 'graduation-cap'),
  ('education', 'education/language-learning', 'Language Learning', 'language-learning', 2, 4, true, null, 'languages'),
  ('education', 'education/test-prep', 'Test Prep', 'test-prep', 2, 5, true, null, 'clipboard-list'),
  ('education', 'education/other-education', 'Other Education', 'other-education', 2, 6, true, 'Manual entry for other educational items.', 'dots-horizontal'),

  ('sports-hobbies', 'sports-hobbies/sports-equipment', 'Sports Equipment', 'sports-equipment', 2, 1, true, null, 'trophy'),
  ('sports-hobbies', 'sports-hobbies/gym-fitness', 'Gym & Fitness', 'gym-fitness', 2, 2, true, null, 'dumbbell'),
  ('sports-hobbies', 'sports-hobbies/camping-outdoor', 'Camping & Outdoor', 'camping-outdoor', 2, 3, true, null, 'tent'),
  ('sports-hobbies', 'sports-hobbies/musical-instruments', 'Musical Instruments', 'musical-instruments', 2, 4, true, null, 'music'),
  ('sports-hobbies', 'sports-hobbies/arts-crafts', 'Arts & Crafts', 'arts-crafts', 2, 5, true, null, 'palette'),
  ('sports-hobbies', 'sports-hobbies/games-collectibles', 'Games & Collectibles', 'games-collectibles', 2, 6, true, null, 'gamepad-2'),
  ('sports-hobbies', 'sports-hobbies/other-sports-hobbies', 'Other Sports & Hobbies', 'other-sports-hobbies', 2, 7, true, 'Manual entry for other hobbies.', 'dots-horizontal');

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, sort_order, is_active, is_leaf, description, icon)
select parent.category_id, parent.id, node.name, node.slug, node.level, node.path, node.sort_order, node.sort_order, true, node.is_leaf, node.description, node.icon
from desired_category_nodes node
join public.category_nodes parent on parent.path = node.parent_path
where node.level = 2
on conflict (path) do update
set name = excluded.name,
    slug = excluded.slug,
    display_order = excluded.display_order,
    sort_order = excluded.sort_order,
    is_active = true,
    is_leaf = excluded.is_leaf,
    description = excluded.description,
    icon = excluded.icon,
    updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, sort_order, is_active, is_leaf, description, icon)
select parent.category_id, parent.id, node.name, node.slug, node.level, node.path, node.sort_order, node.sort_order, true, node.is_leaf, node.description, node.icon
from desired_category_nodes node
join public.category_nodes parent on parent.path = node.parent_path
where node.level = 3
on conflict (path) do update
set name = excluded.name,
    slug = excluded.slug,
    display_order = excluded.display_order,
    sort_order = excluded.sort_order,
    is_active = true,
    is_leaf = excluded.is_leaf,
    description = excluded.description,
    icon = excluded.icon,
    updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, sort_order, is_active, is_leaf, description, icon)
select parent.category_id, parent.id, node.name, node.slug, node.level, node.path, node.sort_order, node.sort_order, true, node.is_leaf, node.description, node.icon
from desired_category_nodes node
join public.category_nodes parent on parent.path = node.parent_path
where node.level = 4
on conflict (path) do update
set name = excluded.name,
    slug = excluded.slug,
    display_order = excluded.display_order,
    sort_order = excluded.sort_order,
    is_active = true,
    is_leaf = excluded.is_leaf,
    description = excluded.description,
    icon = excluded.icon,
    updated_at = now();

-- Refresh aliases so Afghan search terms point to the correct live branches.
delete from public.category_aliases
where lower(alias) in (
  'saracha', 'seraacha', 'toyota saracha', 'corolla', 'fielder', 'prado',
  'land cruiser', 'honda 70', 'cd70', 'cg125', 'rickshaw', 'tuk tuk',
  'rahn', 'gerawy', 'haweli', 'kabul plate', 'afghan plate'
);

insert into public.category_aliases (category_id, alias, language)
select node.id, alias_map.alias, alias_map.language
from public.category_nodes node
join (
  values
    ('vehicles/cars/toyota/townace-saracha', 'Saracha', 'en'),
    ('vehicles/cars/toyota/townace-saracha', 'Seraacha', 'en'),
    ('vehicles/cars/toyota/townace-saracha', 'Toyota Saracha', 'en'),
    ('vehicles/cars/toyota/corolla', 'Corolla', 'en'),
    ('vehicles/cars/toyota/fielder', 'Fielder', 'en'),
    ('vehicles/cars/toyota/land-cruiser-prado', 'Prado', 'en'),
    ('vehicles/cars/toyota/land-cruiser', 'Land Cruiser', 'en'),
    ('vehicles/motorcycles/honda-cd70-honda-70', 'Honda 70', 'en'),
    ('vehicles/motorcycles/honda-cd70-honda-70', 'CD70', 'en'),
    ('vehicles/motorcycles/honda-cg125-honda-125', 'CG125', 'en'),
    ('vehicles/rickshaws-three-wheelers', 'Rickshaw', 'en'),
    ('vehicles/rickshaws-three-wheelers', 'Tuk Tuk', 'en'),
    ('real-estate', 'Rahn', 'en'),
    ('real-estate', 'Gerawy', 'en'),
    ('real-estate/houses', 'Haweli', 'en'),
    ('vehicles/cars', 'Kabul Plate', 'en'),
    ('vehicles/cars', 'Afghan Plate', 'en')
) as alias_map(path, alias, language) on alias_map.path = node.path
on conflict do nothing;

-- Refresh dynamic filters for the corrected paths and Afghan-specific marketplace fields.
with affected as (
  select id, path
  from public.category_nodes
  where path in (
    'vehicles',
    'vehicles/cars',
    'vehicles/motorcycles',
    'vehicles/rickshaws-three-wheelers',
    'vehicles/bicycles',
    'real-estate',
    'mobile-phones-tablets/mobile-phones'
  )
)
update public.filter_definitions
set is_active = false,
    updated_at = now()
where category_node_id in (select id from affected)
  and filter_key in (
    'vehicle_type', 'vehicle_brand', 'vehicle_model', 'year_min', 'year_max', 'km_min', 'km_max',
    'fuel_type', 'transmission', 'body_type', 'engine_capacity', 'color', 'condition', 'plate_status',
    'customs_status', 'imported_from', 'exchange', 'seller_type', 'honda_70', 'engine_cc',
    'rickshaw_type', 'passenger_capacity', 'cargo_capacity', 'property_type', 'rental_type',
    'rooms_min', 'bathrooms_min', 'property_size_min', 'land_size_min', 'furnished', 'parking',
    'owner_agent', 'phone_model', 'storage', 'ram', 'battery_health_min', 'original_refurbished', 'warranty'
  );

insert into public.filter_definitions (
  category_node_id, filter_key, filter_label, filter_type, options, source_table, source_column, sort_order, is_active
)
select node.id, def.filter_key, def.filter_label, def.filter_type, def.options::jsonb, def.source_table, def.source_column, def.sort_order, true
from public.category_nodes node
join (
  values
    ('vehicles/cars', 'vehicle_brand', 'Brand', 'text', null, 'listings', 'vehicle_brand', 20),
    ('vehicles/cars', 'vehicle_model', 'Model', 'text', null, 'listings', 'vehicle_model', 21),
    ('vehicles/cars', 'year_min', 'Year Min', 'range', null, 'listings', 'vehicle_year', 22),
    ('vehicles/cars', 'year_max', 'Year Max', 'range', null, 'listings', 'vehicle_year', 23),
    ('vehicles/cars', 'km_min', 'KM Min', 'range', null, 'listing_attributes', 'mileage', 24),
    ('vehicles/cars', 'km_max', 'KM Max', 'range', null, 'listing_attributes', 'mileage', 25),
    ('vehicles/cars', 'fuel_type', 'Fuel Type', 'select', '["Petrol","Diesel","Hybrid","Electric","CNG"]', 'listing_attributes', 'locked__fuel_type', 26),
    ('vehicles/cars', 'transmission', 'Transmission', 'select', '["Automatic","Manual"]', 'listing_attributes', 'locked__gear', 27),
    ('vehicles/cars', 'body_type', 'Body Type', 'select', '["Sedan","Hatchback","SUV","Crossover","Wagon","Pickup","Van","Coupe","Other"]', 'listing_attributes', 'body_type', 28),
    ('vehicles/cars', 'engine_capacity', 'Engine Capacity', 'text', null, 'listing_attributes', 'engine_capacity', 29),
    ('vehicles/cars', 'color', 'Color', 'text', null, 'listing_attributes', 'color', 30),
    ('vehicles/cars', 'condition', 'Condition', 'select', '["New","Like New","Used","Damaged"]', 'listing_attributes', 'condition', 31),
    ('vehicles/cars', 'plate_status', 'Plate Status', 'select', '["Afghanistan Plate","Foreign Plate","Temporary Plate","No Plate","Unknown"]', 'listing_attributes', 'plate_status', 32),
    ('vehicles/cars', 'customs_status', 'Customs / Clearance Status', 'select', '["Cleared","Not Cleared","In Process","Unknown"]', 'listing_attributes', 'customs_status', 33),
    ('vehicles/cars', 'imported_from', 'Imported From', 'select', '["Afghanistan Local","Japan","Dubai / UAE","Pakistan","Iran","Europe","USA","Other","Unknown"]', 'listing_attributes', 'imported_from', 34),
    ('vehicles/cars', 'exchange', 'Exchange', 'boolean', null, 'listing_attributes', 'exchange_available', 35),
    ('vehicles/cars', 'seller_type', 'Seller Type', 'select', '["owner","dealer"]', 'listing_attributes', 'seller_type', 36),

    ('vehicles/motorcycles', 'vehicle_brand', 'Brand', 'text', null, 'listings', 'vehicle_brand', 40),
    ('vehicles/motorcycles', 'vehicle_model', 'Model', 'text', null, 'listings', 'vehicle_model', 41),
    ('vehicles/motorcycles', 'engine_cc', 'Engine CC', 'text', null, 'listings', 'vehicle_manual_specs.engine_cc', 42),
    ('vehicles/motorcycles', 'year_min', 'Year Min', 'range', null, 'listings', 'vehicle_year', 43),
    ('vehicles/motorcycles', 'year_max', 'Year Max', 'range', null, 'listings', 'vehicle_year', 44),
    ('vehicles/motorcycles', 'condition', 'Condition', 'select', '["New","Like New","Used","Damaged"]', 'listing_attributes', 'condition', 45),
    ('vehicles/motorcycles', 'color', 'Color', 'text', null, 'listing_attributes', 'color', 46),
    ('vehicles/motorcycles', 'plate_status', 'Plate Status', 'select', '["Afghanistan Plate","Foreign Plate","Temporary Plate","No Plate","Unknown"]', 'listing_attributes', 'plate_status', 47),

    ('vehicles/rickshaws-three-wheelers', 'fuel_type', 'Fuel Type', 'select', '["Petrol","Diesel","Electric","CNG"]', 'listing_attributes', 'locked__fuel_type', 50),
    ('vehicles/rickshaws-three-wheelers', 'passenger_capacity', 'Passenger Capacity', 'text', null, 'listings', 'vehicle_manual_specs.passenger_capacity', 51),
    ('vehicles/rickshaws-three-wheelers', 'cargo_capacity', 'Cargo Capacity', 'text', null, 'listings', 'vehicle_manual_specs.cargo_capacity', 52),
    ('vehicles/rickshaws-three-wheelers', 'condition', 'Condition', 'select', '["New","Like New","Used","Damaged"]', 'listing_attributes', 'condition', 53),
    ('vehicles/rickshaws-three-wheelers', 'rickshaw_type', 'Rickshaw Type', 'select', '["Passenger Rickshaw","Cargo Rickshaw","Electric Rickshaw","Other Rickshaw"]', 'listings', 'vehicle_subtype', 54),

    ('vehicles/bicycles', 'condition', 'Condition', 'select', '["New","Like New","Used","Damaged"]', 'listing_attributes', 'condition', 60),

    ('real-estate', 'property_type', 'Property Type', 'text', null, 'listing_attributes', 'property_type', 70),
    ('real-estate', 'rental_type', 'Purpose', 'select', '["For Sale","For Rent","Gerawy / Rahn","Exchange","Wanted"]', 'listing_attributes', 'rental_type', 71),
    ('real-estate', 'rooms_min', 'Rooms Min', 'range', null, 'listing_attributes', 'rooms', 72),
    ('real-estate', 'bathrooms_min', 'Bathrooms Min', 'range', null, 'listing_attributes', 'bathrooms', 73),
    ('real-estate', 'property_size_min', 'Property Size Min', 'range', null, 'listing_attributes', 'property_size', 74),
    ('real-estate', 'land_size_min', 'Land Size Min', 'range', null, 'listing_attributes', 'land_size', 75),
    ('real-estate', 'furnished', 'Furnished', 'boolean', null, 'listing_attributes', 'furnished', 76),
    ('real-estate', 'parking', 'Parking', 'boolean', null, 'listing_attributes', 'parking', 77),
    ('real-estate', 'owner_agent', 'Owner / Agent', 'select', '["owner","agent"]', 'listing_attributes', 'owner_type', 78),

    ('mobile-phones-tablets/mobile-phones', 'phone_model', 'Model', 'text', null, 'listing_attributes', 'model', 80),
    ('mobile-phones-tablets/mobile-phones', 'storage', 'Storage', 'select', '["32GB","64GB","128GB","256GB","512GB","1TB"]', 'listing_attributes', 'storage', 81),
    ('mobile-phones-tablets/mobile-phones', 'ram', 'RAM', 'select', '["2GB","3GB","4GB","6GB","8GB","12GB","16GB"]', 'listing_attributes', 'ram', 82),
    ('mobile-phones-tablets/mobile-phones', 'battery_health_min', 'Battery Health Min', 'range', null, 'listing_attributes', 'battery_health', 83),
    ('mobile-phones-tablets/mobile-phones', 'original_refurbished', 'Original / Refurbished', 'select', '["Original","Refurbished","Unknown"]', 'listing_attributes', 'original_refurbished', 84),
    ('mobile-phones-tablets/mobile-phones', 'warranty', 'Warranty', 'select', '["Yes","No"]', 'listing_attributes', 'warranty', 85),
    ('mobile-phones-tablets/mobile-phones', 'condition', 'Condition', 'select', '["New","Like New","Used","Damaged"]', 'listing_attributes', 'condition', 86)
) as def(path, filter_key, filter_label, filter_type, options, source_table, source_column, sort_order)
  on def.path = node.path
on conflict (category_node_id, filter_key) do update
set filter_label = excluded.filter_label,
    filter_type = excluded.filter_type,
    options = excluded.options,
    source_table = excluded.source_table,
    source_column = excluded.source_column,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();

commit;