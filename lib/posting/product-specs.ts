// Product Specifications Database - Auto-filled specs for specific product models

export interface AutoFilledSpec {
  label: string;
  value: string;
  editable: boolean;
}

export interface EditableSpecField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'checkbox';
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface ProductSpecification {
  productId: string;
  categoryPath: string;
  autoFilledSpecs: AutoFilledSpec[];
  editableSpecs: EditableSpecField[];
}

export const PRODUCT_SPECIFICATIONS: { [key: string]: ProductSpecification } = {
  'iphone-13-pro-max': {
    productId: 'iphone-13-pro-max',
    categoryPath: 'Mobile Phones > Apple > iPhone 13 Pro Max',
    autoFilledSpecs: [
      { label: 'Screen Size', value: '6.7 inch', editable: false },
      { label: 'Rear Camera', value: '12 megapixel', editable: false },
      { label: 'Front Camera', value: '12 megapixel', editable: false },
      { label: 'Operation System', value: 'Apple iOS', editable: false },
      { label: 'From', value: 'Owner', editable: false },
    ],
    editableSpecs: [
      {
        id: 'color',
        label: 'Color',
        type: 'select',
        required: true,
        options: [
          { label: 'Graphite', value: 'graphite' },
          { label: 'Gold', value: 'gold' },
          { label: 'Silver', value: 'silver' },
          { label: 'Deep Purple', value: 'deep_purple' },
        ],
      },
      {
        id: 'storage',
        label: 'Storage Capacity',
        type: 'select',
        required: true,
        options: [
          { label: '128GB', value: '128gb' },
          { label: '256GB', value: '256gb' },
          { label: '512GB', value: '512gb' },
          { label: '1TB', value: '1tb' },
        ],
      },
      {
        id: 'purchased_from',
        label: 'Purchased from',
        type: 'select',
        required: false,
        options: [
          { label: 'Apple Store', value: 'apple_store' },
          { label: 'Online', value: 'online' },
          { label: 'Authorized Retailer', value: 'authorized_retailer' },
          { label: 'Other', value: 'other' },
        ],
      },
      {
        id: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Unknown', value: 'unknown' },
        ],
      },
      {
        id: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: [
          { label: 'Brand New', value: 'brand_new' },
          { label: 'Like New', value: 'like_new' },
          { label: 'Excellent', value: 'excellent' },
          { label: 'Good', value: 'good' },
          { label: 'Fair', value: 'fair' },
        ],
      },
      {
        id: 'trade_in',
        label: 'Trade-In',
        type: 'select',
        required: false,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Maybe', value: 'maybe' },
        ],
      },
    ],
  },
  'toyota-corolla-2022': {
    productId: 'toyota-corolla-2022',
    categoryPath: 'Vehicles > Cars > Toyota > Corolla',
    autoFilledSpecs: [
      { label: 'Brand', value: 'Toyota', editable: false },
      { label: 'Model', value: 'Corolla', editable: false },
      { label: 'Body Type', value: 'Sedan', editable: false },
    ],
    editableSpecs: [
      {
        id: 'year',
        label: 'Year',
        type: 'number',
        required: true,
        placeholder: '2022',
      },
      {
        id: 'mileage',
        label: 'Mileage',
        type: 'number',
        required: true,
        placeholder: '0',
      },
      {
        id: 'transmission',
        label: 'Transmission',
        type: 'select',
        required: true,
        options: [
          { label: 'Manual', value: 'manual' },
          { label: 'Automatic', value: 'automatic' },
          { label: 'CVT', value: 'cvt' },
        ],
      },
      {
        id: 'fuel_type',
        label: 'Fuel Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Petrol', value: 'petrol' },
          { label: 'Diesel', value: 'diesel' },
          { label: 'Hybrid', value: 'hybrid' },
          { label: 'Electric', value: 'electric' },
        ],
      },
      {
        id: 'color',
        label: 'Color',
        type: 'select',
        required: true,
        options: [
          { label: 'White', value: 'white' },
          { label: 'Black', value: 'black' },
          { label: 'Silver', value: 'silver' },
          { label: 'Red', value: 'red' },
          { label: 'Blue', value: 'blue' },
        ],
      },
      {
        id: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: [
          { label: 'Excellent', value: 'excellent' },
          { label: 'Very Good', value: 'very_good' },
          { label: 'Good', value: 'good' },
          { label: 'Fair', value: 'fair' },
          { label: 'Needs Repair', value: 'needs_repair' },
        ],
      },
    ],
  },
};

export const getProductSpecs = (productId: string): ProductSpecification | null => {
  return PRODUCT_SPECIFICATIONS[productId] || null;
};
