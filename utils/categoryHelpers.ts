// import type { Category, Listing, ListingAttribute } from '../stores/types';

// /**
//  * Convert category name to URL-friendly slug
//  */
// export function categoryToSlug(category: Category): string {
//   return category.slug || category.name.toLowerCase()
//     .replace(/\s+/g, '-')
//     .replace(/[^\w\-]+/g, '')
//     .replace(/\-\-+/g, '-')
//     .replace(/^-+/, '')
//     .replace(/-+$/, '');
// }

// /**
//  * Find category by slug from categories array
//  */
// export function findCategoryBySlug(categories: Category[], slug: string): Category | undefined {
//   return categories.find(cat =>
//     categoryToSlug(cat) === slug ||
//     cat.slug === slug
//   );
// }

// /**
//  * Generate category URL
//  */
// export function getCategoryUrl(category: Category): string {
//   return `/${categoryToSlug(category)}`;
// }

// /**
//  * Extract attribute value from listing attributes
//  */
// export function getAttributeValue(
//   attributes: ListingAttribute[] | undefined,
//   attributeKey: string
// ): string | number | null {
//   if (!attributes) return null;

//   const attr = attributes.find(a => a.attribute?.key === attributeKey);
//   if (!attr) return null;

//   const value = attr.value;

//   // Handle different attribute types
//   switch (attr.attribute?.type) {
//     case 'selector':
//       // Find the option label
//       const option = attr.attribute.options?.find(opt => opt.key === value.selected);
//       return option?.valueEn || value.selected;

//     case 'range':
//       if (value.from && value.to) {
//         return `${value.from} - ${value.to}`;
//       }
//       return value.from || value.to || null;

//     case 'currency':
//       return value.amount ? `${value.amount} ${value.currency}` : null;

//     case 'text':
//       return value.text || null;

//     default:
//       return value;
//   }
// }

// /**
//  * Format listing data for ListingCard component
//  */
// export function formatListingForCard(listing: Listing) {
//   return {
//     id: listing.id,
//     title: listing.title,
//     price: listing.price.toLocaleString(),
//     currency: listing.currency,
//     firstRegistration: getAttributeValue(listing.attributes, 'first_registration')?.toString() || 'N/A',
//     mileage: getAttributeValue(listing.attributes, 'mileage')?.toString() || 'N/A',
//     fuelType: getAttributeValue(listing.attributes, 'fuel_type')?.toString() || 'N/A',
//     location: listing.province ? `${listing.location}, ${listing.province}` : listing.location,
//     sellerType: (getAttributeValue(listing.attributes, 'seller_type') as 'private' | 'dealer' | 'business') || 'private',
//     images: listing.images,
//     isLiked: false, // TODO: Get from user preferences
//   };
// }

// /**
//  * Generate breadcrumb items for category navigation
//  */
// export function generateCategoryBreadcrumbs(
//   categories: Category[],
//   currentCategory: Category
// ): { name: string; url: string }[] {
//   const breadcrumbs: { name: string; url: string }[] = [];

//   // Add home
//   breadcrumbs.push({ name: 'Home', url: '/' });

//   // Build category hierarchy
//   const buildHierarchy = (category: Category) => {
//     if (category.parentId) {
//       const parent = categories.find(c => c.id === category.parentId);
//       if (parent) {
//         buildHierarchy(parent);
//       }
//     }
//     breadcrumbs.push({
//       name: category.name,
//       url: getCategoryUrl(category)
//     });
//   };

//   buildHierarchy(currentCategory);

//   return breadcrumbs;
// }

// /**
//  * Get category display name with proper fallback
//  */
// export function getCategoryDisplayName(category: Category, locale: 'en' | 'ar' = 'en'): string {
//   return locale === 'ar' && category.nameAr ? category.nameAr : category.name;
// }

// /**
//  * Get category description with proper fallback
//  */
// export function getCategoryDescription(category: Category, locale: 'en' | 'ar' = 'en'): string {
//   const description = locale === 'ar' && category.descriptionAr ? category.descriptionAr : category.description;
//   return description || `Browse ${getCategoryDisplayName(category, locale).toLowerCase()} listings`;
// }
