# Sahibash Posting Form - Complete Specification v2.0

## 🎯 Vision
**Minimize user work. Maximize data accuracy. Use AI + hierarchy to auto-fill technical specifications.**

---

## 📋 4-Step Posting Flow

### STEP 1: Content & Location
**Purpose**: Capture basic listing information and location

#### 1.1 Photo Upload
- Max 10 photos
- Drag-and-drop enabled
- Preview with order control
- Required: at least 1 photo

#### 1.2 Title (Auto-generated)
- User can type manually OR
- Auto-generate from: [Category] + [Brand] + [Model] + [Key Spec]
- Example: "iPhone 13 Pro Max - 256GB, Blue, Like New"
- Max 100 characters
- Real-time character counter

#### 1.3 Description
- Rich text editor
- Auto-suggest based on category:
  - For iPhone: mention storage, condition, original box, warranty
  - For cars: mention mileage, service history, accidents
  - For real estate: mention amenities, agent info
- Max 5000 characters
- Real-time character counter

#### 1.4 Location Selection
- **Manual Button**: Opens location modal (Province > District > Area)
- **Auto Button**: 
  - Uses user's location history
  - Or current geolocation (with privacy checkbox)
  - Shows: "Kabul > District 1"
- Province + District required
- Area optional (user can submit custom)
- Can edit anytime

#### 1.5 Selling Method (Required)
- Radio buttons:
  - [ ] Direct Sale (price-based)
  - [ ] Auction (bidding)
  - [ ] Trade-In (exchange)
  - [ ] Rental (time-based)
- Selected method affects later steps

**⬇️ Navigation**: "Continue to Step 2"

---

### STEP 2: Category Finding (AI + Manual)
**Purpose**: Identify the exact category and hierarchy level (go as deep as possible)

#### 2.1 AI Suggestion Button
```
[🤖 AI Analyze My Ad]
```
- Reads: photos, title, description
- Analyzes content to suggest category
- Returns top 3 suggestions with confidence %
- Example: "85% Electronics > Phone > Apple iPhone 13 Pro Max"

#### 2.2 Manual Selection
```
Category Tree (Collapsible):
├─ Electronics (expand)
│  ├─ Phones (expand)
│  │  ├─ Apple (expand)
│  │  │  ├─ iPhone 13 Pro Max ← LEAF (final level)
│  │  │  ├─ iPhone 13 Pro
│  │  │  ├─ iPhone 13
│  │  ├─ Samsung (expand)
│  │  ├─ Huawei
│  ├─ Laptops
│  ├─ Cameras
├─ Vehicles (expand)
│  ├─ Cars (expand)
│  │  ├─ Toyota (expand)
│  │  │  ├─ Corolla (expand)
│  │  │  │  ├─ 2023 Model ← LEAF
│  │  │  │  ├─ 2022 Model
│  │  │  ├─ Camry
│  ├─ Motorcycles
├─ Real Estate (expand)
│  ├─ Apartment (expand)
│  │  ├─ 1 Bedroom
│  │  ├─ 2 Bedroom ← LEAF
│  │  ├─ Studio
│  ├─ House
│  ├─ Land
```

#### 2.3 Category Selection Rules
- **Navigate** by clicking expand arrows
- **Select** leaf node (most specific level available)
- **Search** enabled: type "iPhone 13" to jump to that node
- **Show**: breadcrumb trail: Electronics > Phones > Apple > iPhone 13 Pro Max

#### 2.4 AI + Manual Combined
- AI suggests first, user can:
  - ✅ Accept suggestion → Goes to Step 3
  - 🔄 Change manually → Show manual selector pre-expanded to AI category
  - 🔍 Search → Jump to manual selection

#### 2.5 Category Selection Confirmation
```
Selected: Electronics > Phones > Apple > iPhone 13 Pro Max

[🔄 Change Category]  [Continue to Step 3 ▶]
```

**⬇️ Navigation**: "Continue to Step 3" OR "Back to Step 1"

---

### STEP 3: Details (Auto-filled + Manual Input)
**Purpose**: Technical specs, condition, warranty, trade-in terms

#### 3.1 Data Architecture

Each category has a **specification template** in database:

```typescript
// Example: iPhone 13 Pro Max
{
  category: "Electronics > Phones > Apple > iPhone 13 Pro Max",
  
  // AUTO-FILLED FROM CATEGORY (Read-only fields)
  unchangeable: {
    brand: { value: "Apple", editable: false },
    model: { value: "iPhone 13 Pro Max", editable: false },
    screen_size: { value: "6.7 inches", editable: false },
    screen_type: { value: "Super Retina XDR", editable: false },
    rear_cameras: { value: "12MP Wide + 12MP Ultra-wide + 12MP Telephoto", editable: false },
    front_camera: { value: "12MP", editable: false },
    os: { value: "iOS 15", editable: false },
    processor: { value: "A15 Bionic", editable: false },
    ram: { value: null } // NO RAM FIELD FOR IPHONES - DON'T SHOW
  },
  
  // USER MUST SELECT/FILL (Key fields)
  changeable_required: {
    storage_capacity: { 
      type: "select",
      options: ["128GB", "256GB", "512GB", "1TB"],
      value: null 
    },
    color: { 
      type: "select",
      options: ["Midnight", "Starlight", "Deep Purple", "Gold", "Silver"],
      value: null 
    },
    condition: { 
      type: "select",
      options: ["Like New", "Excellent", "Good", "Fair", "For Parts"],
      value: null 
    },
    warranty: { 
      type: "select",
      options: ["Apple Care+", "Original Warranty", "No Warranty"],
      value: null 
    },
    purchase_place: { 
      type: "select",
      options: ["Official Apple Store", "Authorized Dealer", "Private Seller"],
      value: null 
    }
  },
  
  // USER CAN OPTIONALLY SELECT (Not required)
  changeable_optional: {
    trade_in_available: { 
      type: "checkbox",
      value: false 
    },
    trade_in_condition: { 
      type: "select",
      options: ["Perfect", "Good", "Acceptable"],
      hidden_unless: "trade_in_available === true",
      value: null 
    },
    percentage_original: { 
      type: "number",
      placeholder: "e.g., 95%",
      value: null,
      visible_for: ["iPhone", "iPad"] // Only electronics
    },
    original_box: { 
      type: "checkbox",
      label: "Comes with original box",
      value: false 
    },
    original_charger: { 
      type: "checkbox",
      label: "Comes with original charger",
      value: false 
    }
  }
}
```

#### 3.2 UI Structure

```
═══════════════════════════════════════════════════════════════
  STEP 3: DETAILS - iPhone 13 Pro Max
═══════════════════════════════════════════════════════════════

📌 Auto-filled from Apple iPhone 13 Pro Max:
┌─────────────────────────────────────────────────────────────┐
│ Brand: Apple                                                 │
│ Model: iPhone 13 Pro Max                                     │
│ Screen: 6.7" Super Retina XDR                                │
│ Cameras: 12MP Wide + 12MP Ultra-wide + 12MP Telephoto       │
│ Front Camera: 12MP                                           │
│ OS: iOS 15                                                   │
│ Processor: A15 Bionic                                        │
│                                                              │
│ (These cannot be changed - they're locked to this model)    │
└─────────────────────────────────────────────────────────────┘

✏️ You need to select/fill:

Storage Capacity: [▼ Select Storage]
  ├─ 128GB
  ├─ 256GB  ← Most popular
  ├─ 512GB
  └─ 1TB

Color: [▼ Select Color]
  ├─ Midnight
  ├─ Starlight
  ├─ Deep Purple
  ├─ Gold
  └─ Silver

Condition: [▼ Select Condition]
  ├─ Like New (Never used)
  ├─ Excellent (Minor scratches)
  ├─ Good (Used, works perfectly)
  ├─ Fair (Cosmetic damage)
  └─ For Parts (Not fully functional)

Warranty: [▼ Select Warranty]
  ├─ Apple Care+ (Extended coverage)
  ├─ Original Warranty (Apple 1-year)
  └─ No Warranty

Purchase Place: [▼ Where was it bought?]
  ├─ Official Apple Store
  ├─ Authorized Dealer
  └─ Private Seller

Percentage of Original: [____95__%] (How close to new condition?)

🔧 Optional Additions:

☐ Comes with original box
☐ Comes with original charger
☐ Trade-In Available (I accept trading other phones)
    If checked → Show: Condition of trade-in device: [▼]

═══════════════════════════════════════════════════════════════
[◀ Back to Step 2]             [Continue to Step 4 ▶]
═══════════════════════════════════════════════════════════════
```

#### 3.3 Category Examples

**For Cars (Electronics > Vehicles > Cars > Toyota > Corolla > 2023):**
```
Unchangeable (Auto-filled):
- Brand: Toyota
- Model: Corolla
- Year: 2023
- Engine: 1.6L/1.8L
- Transmission: Manual/Automatic
- Body Type: Sedan
- Seats: 5

Changeable (Required):
- Color: [Select]
- Mileage: [Number input]
- Condition: [Select]
- Accidents: [Select] - None / Minor / Major
- Service: [Select] - Regular / Irregular / None

Optional:
- Import docs: [Checkbox]
- Full papers: [Checkbox]
- Trade-in available: [Checkbox]
```

**For Real Estate (Real Estate > Apartments > 2-Bedroom):**
```
Unchangeable:
- Property Type: Apartment
- Bedrooms: 2
- Bathrooms: (Usually 1-2)

Changeable (Required):
- Floor: [Select] 1st / 2nd / 3rd / etc
- Area (m²): [Number]
- Furnished: [Select] Unfurnished / Partially / Fully
- Amenities: [Checkboxes] Parking / Garden / Security / etc
- Condition: [Select] New / Excellent / Good / Fair

Optional:
- Rent Type: [Select] 1-year / 6-month / Flexible
```

#### 3.4 Validation Rules
```
Before allowing → Step 4:
✓ All "required" fields must be filled
✓ At least one photo from Step 1
✓ Title not empty
✓ Location selected
✓ Category selected
```

**⬇️ Navigation**: "Continue to Step 4" OR "Back to Step 2"

---

### STEP 4: Review & Publish
**Purpose**: Final review before posting live

#### 4.1 Summary View

```
═══════════════════════════════════════════════════════════════
  STEP 4: REVIEW & PUBLISH
═══════════════════════════════════════════════════════════════

📸 PHOTOS (10 uploaded)
[Carousel view - swipe through]

📝 LISTING INFO
├─ Title: "iPhone 13 Pro Max - 256GB, Blue, Like New"
├─ Description: "Barely used, comes with original box..."
├─ Category: Electronics > Phones > Apple > iPhone 13 Pro Max
├─ Location: Kabul > Shahr-e Nau
└─ Selling Method: Direct Sale

🔧 SPECIFICATIONS
├─ Storage: 256GB
├─ Color: Blue
├─ Condition: Like New
├─ Warranty: Apple Care+
├─ Purchase: Official Apple Store
├─ Percentage: 95%
├─ Original Box: ✓ Yes
└─ Original Charger: ✓ Yes

💰 PRICING (from Step if applicable)
├─ Price: 1,200 USD
└─ Minimum Offer: 1,100 USD

─────────────────────────────────────────────────────────────

[✏️ Edit Any Section]  [❌ Cancel]  [✅ Publish Now]
```

#### 4.2 Edit Options
- Click any section to edit and return to that step
- Edit photos: Back to Step 1
- Edit title/description: Back to Step 1
- Edit category: Back to Step 2
- Edit specs: Back to Step 3
- Edit pricing: Back to pricing step

#### 4.3 Publish Action
```
On "Publish Now" click:
1. Show loading animation
2. Upload all photos to CDN
3. Create listing in database
4. Trigger AI categorization confirmation
5. Show confirmation: "✅ Your ad is now live!"
6. Redirect to listing page
```

**⬇️ Navigation**: "Publish Now" OR "Back to edit"

---

## 🗂️ Category Specifications Database

Each category should have a JSON specification:

```typescript
// supabase table: category_specifications
{
  id: "iPhone_13_Pro_Max",
  category_path: "Electronics/Phones/Apple/iPhone 13 Pro Max",
  
  // What's auto-filled (comes from DB)
  auto_fields: {
    brand: { value: "Apple", label: "Brand", editable: false },
    model: { value: "iPhone 13 Pro Max", label: "Model", editable: false },
    screen_size: { value: "6.7 inches", label: "Screen Size", editable: false },
    screen_type: { value: "Super Retina XDR", label: "Screen Type", editable: false },
    rear_cameras: { value: "12MP+12MP+12MP", label: "Rear Cameras", editable: false },
    front_camera: { value: "12MP", label: "Front Camera", editable: false },
    os: { value: "iOS 15", label: "Operating System", editable: false },
    processor: { value: "A15 Bionic", label: "Processor", editable: false }
  },
  
  // What user must select
  required_fields: [
    {
      name: "storage_capacity",
      type: "select",
      label: "Storage",
      options: ["128GB", "256GB", "512GB", "1TB"],
      required: true
    },
    {
      name: "color",
      type: "select",
      label: "Color",
      options: ["Midnight", "Starlight", "Deep Purple", "Gold", "Silver"],
      required: true
    },
    {
      name: "condition",
      type: "select",
      label: "Condition",
      options: ["Like New", "Excellent", "Good", "Fair", "For Parts"],
      required: true
    },
    {
      name: "warranty",
      type: "select",
      label: "Warranty",
      options: ["Apple Care+", "Original Warranty", "No Warranty"],
      required: true
    },
    {
      name: "purchase_place",
      type: "select",
      label: "Purchase Place",
      options: ["Official Apple Store", "Authorized Dealer", "Private Seller"],
      required: true
    }
  ],
  
  // Optional additions
  optional_fields: [
    {
      name: "percentage_original",
      type: "number",
      label: "Percentage of Original",
      placeholder: "95",
      required: false
    },
    {
      name: "original_box",
      type: "checkbox",
      label: "Comes with original box",
      required: false
    },
    {
      name: "original_charger",
      type: "checkbox",
      label: "Comes with original charger",
      required: false
    },
    {
      name: "trade_in_available",
      type: "checkbox",
      label: "Trade-In Available",
      required: false,
      conditional_fields: ["trade_in_condition"]
    },
    {
      name: "trade_in_condition",
      type: "select",
      label: "Device Condition for Trade-In",
      options: ["Perfect", "Good", "Acceptable"],
      visible_if: "trade_in_available === true",
      required: false
    }
  ]
}
```

---

## 🧠 AI Category Analyzer

### How It Works

**Input**: Photos, Title, Description
**Process**:
1. Analyze title for brand/model keywords
2. Analyze description for technical terms
3. Analyze photos (computer vision) for visual cues
4. Match against category database

**Output**: 
```json
{
  "suggestions": [
    {
      "category": "Electronics/Phones/Apple/iPhone 13 Pro Max",
      "confidence": 85,
      "reason": "Title mentions 'iPhone 13 Pro Max', description mentions 'iOS 15', image shows Apple design"
    },
    {
      "category": "Electronics/Phones/Apple/iPhone 13 Pro",
      "confidence": 10,
      "reason": "Could be iPhone 13 Pro instead of Pro Max"
    },
    {
      "category": "Electronics/Phones/Apple/iPhone 13",
      "confidence": 5,
      "reason": "Generic iPhone 13 category"
    }
  ]
}
```

---

## 📋 Implementation Checklist

### Phase 1: Database
- [ ] Create `category_specifications` table
- [ ] Populate all electronics categories with specs
- [ ] Populate all vehicle categories with specs
- [ ] Populate real estate categories with specs
- [ ] Create indexes for fast lookups

### Phase 2: Step 1 (Photos + Content)
- [ ] Photo upload component
- [ ] Title with auto-suggestions
- [ ] Description editor
- [ ] Location selector (refine existing)
- [ ] Selling method selector

### Phase 3: Step 2 (Category Finding)
- [ ] Build category tree from database
- [ ] Implement search/filter
- [ ] Integrate AI analyzer
- [ ] Show breadcrumb trail
- [ ] Allow manual selection

### Phase 4: Step 3 (Details)
- [ ] Build dynamic form renderer
- [ ] Load specs from category_specifications
- [ ] Show auto-filled fields (read-only styling)
- [ ] Show required selects/inputs
- [ ] Show optional checkboxes
- [ ] Implement conditional visibility (trade-in)
- [ ] Validation before moving to Step 4

### Phase 5: Step 4 (Review)
- [ ] Build summary view
- [ ] Implement edit buttons for each section
- [ ] Add publish confirmation
- [ ] Handle photo CDN upload
- [ ] Create listing in database
- [ ] Show success page

### Phase 6: Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Accessibility (ARIA labels)
- [ ] Performance optimization

---

## 🎨 Key Principles

1. **Minimize User Work**
   - Auto-fill everything that can be auto-filled
   - Use selects instead of text inputs
   - Show only relevant fields per category

2. **Maximize Data Quality**
   - Locked specs prevent user errors
   - Validated options prevent typos
   - AI suggestions guide users correctly

3. **Clear Hierarchy**
   - Step 1: Content
   - Step 2: Category (goes as deep as possible)
   - Step 3: Details (specs + condition)
   - Step 4: Review

4. **Progressive Complexity**
   - Simple at first (just photos + title)
   - More detailed as you go
   - Nothing repeated across steps

5. **Category-Aware**
   - Different categories show different fields
   - Same fields across all products of same type
   - Reduces confusion and improves UX

---

## 🔄 Data Flow Example: iPhone Listing

```
Step 1:
├─ Upload 5 photos
├─ Title: "iPhone 13 Pro Max, Blue, 256GB"
├─ Description: "Excellent condition, comes with box and charger"
├─ Location: Kabul > Shahr-e Nau
└─ Method: Direct Sale

         ▼

Step 2 (AI analyzes):
Suggests: "Electronics > Phones > Apple > iPhone 13 Pro Max" (85% confidence)
User: ✅ Accept

         ▼

Step 3 (Auto-filled):
Unchangeable:
- Brand: Apple
- Model: iPhone 13 Pro Max
- Screen: 6.7" Super Retina XDR
- Cameras: 12MP+12MP+12MP / 12MP
- OS: iOS 15
- Processor: A15 Bionic

User fills:
- Storage: 256GB
- Color: Blue
- Condition: Excellent
- Warranty: Original (1-year)
- Purchase: Authorized Dealer
- Percentage: 98%
- ☑ Original Box
- ☑ Original Charger

         ▼

Step 4:
[Review all info]
[✅ Publish]

         ▼

Result:
Listing created with all structured data ready for:
- Search filtering (by color, storage, condition)
- Recommendations (similar phones)
- Marketplace features
```

---

## 💡 Benefits of This Approach

✅ **For Users**
- Faster posting (less typing)
- Fewer mistakes (locked specs)
- Better guided experience

✅ **For Platform**
- Better data quality
- Easier search/filtering
- Better recommendations
- Structured data for analytics

✅ **For Sellers**
- More professional listings
- Better search visibility
- Easier to compare with similar items

---

## 📞 Next Steps

1. Review this specification
2. Confirm category hierarchy structure (e.g., Electronics > Phones > Apple > iPhone 13 Pro Max)
3. Create `category_specifications` table in Supabase
4. Populate with all categories + their specs
5. Start implementation from Step 1
6. Test with real listings
7. Refine based on user feedback

---

**This is your complete posting form blueprint.**
**Take your time implementing it - quality over speed.**
