import mongoose, { Types } from 'mongoose';
import Listing from '../models/Listing';
import ChatRoom from '../models/ChatRoom';
import { AppError } from '../utils/AppError';
import { checkBlockedKeywords } from '../utils/keywords';
import { stripHtmlTags } from '../utils/sanitize';
import { withIds, escapeRegex } from '../utils/serialize';

interface CreateListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition?: 'new' | 'like_new' | 'used';
  images: string[];
  hidePhoneNumber?: boolean;
  location: {
    type?: 'Point';
    coordinates: number[];
    addressLine?: string;
    division?: string;
    district?: string;
    thana?: string;
  };
}

export const createListing = async (sellerId: string | Types.ObjectId, data: CreateListingData) => {
  const sanitizedTitle = stripHtmlTags(data.title);
  const sanitizedDescription = stripHtmlTags(data.description);

  const blockedKeyword = checkBlockedKeywords(`${sanitizedTitle} ${sanitizedDescription}`);
  
  const moderationFlags: any = blockedKeyword
    ? {
        flagType: 'keyword',
        flagReason: `Contains prohibited term: ${blockedKeyword}`,
      }
    : undefined;

  const listing = new Listing({
    category: data.category,
    condition: data.condition,
    price: Number(data.price),
    images: data.images,
    hidePhoneNumber: !!data.hidePhoneNumber,
    location: {
      type: 'Point',
      coordinates: data.location.coordinates,
      addressLine: data.location.addressLine,
      division: data.location.division,
      district: data.location.district,
      thana: data.location.thana,
    },
    sellerId,
    title: sanitizedTitle,
    description: sanitizedDescription,
    status: 'pending',
    moderationFlags,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // + 30 days
  });

  await listing.save();
  return listing;
};

const SELLER_PUBLIC_FIELDS = 'displayName verifiedName averageRating totalReviews isVerified createdAt';

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_low: { price: 1, createdAt: -1 },
  price_high: { price: -1, createdAt: -1 },
};

const toPositiveInt = (value: unknown, fallback: number) => {
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const asString = (value: unknown): string | undefined => {
  if (Array.isArray(value)) value = value[0];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
};

/**
 * Public listing search.
 * Query params: page, limit, search, category, condition, minPrice, maxPrice,
 * division, district, thana, sellerId, sort (newest | oldest | price_low | price_high),
 * lat + lng + radius (meters) for "near me" search.
 */
export const getListings = async (filters: any) => {
  const parsedPage = toPositiveInt(filters.page, 1);
  const parsedLimit = Math.min(toPositiveInt(filters.limit, 20), 50);
  const skip = (parsedPage - 1) * parsedLimit;

  const query: any = { status: 'active' };

  const category = asString(filters.category);
  const condition = asString(filters.condition);
  const search = asString(filters.search);
  const sellerId = asString(filters.sellerId);
  const division = asString(filters.division);
  const district = asString(filters.district);
  const thana = asString(filters.thana);
  const minPrice = asString(filters.minPrice);
  const maxPrice = asString(filters.maxPrice);

  if (category) query.category = category;
  if (condition && ['new', 'like_new', 'used'].includes(condition)) query.condition = condition;
  if (division) query['location.division'] = division;
  if (district) query['location.district'] = district;
  if (thana) query['location.thana'] = thana;

  if (sellerId) {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError('Invalid sellerId', 400, 'INVALID_ID');
    }
    query.sellerId = new mongoose.Types.ObjectId(sellerId);
  }

  if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
    query.price = { ...query.price, $gte: Number(minPrice) };
  }
  if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
    query.price = { ...query.price, $lte: Number(maxPrice) };
  }

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' };
    query.$or = [{ title: pattern }, { description: pattern }];
  }

  const lat = Number(filters.lat);
  const lng = Number(filters.lng);
  const radius = Number(filters.radius);
  const isGeoSearch =
    filters.lat !== undefined && filters.lng !== undefined && filters.radius !== undefined &&
    Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radius) && radius > 0;

  let listings: any[];
  let total: number;

  if (isGeoSearch) {
    const geoNearStage = {
      $geoNear: {
        near: { type: 'Point' as const, coordinates: [lng, lat] as [number, number] },
        distanceField: 'distance', // meters from the given point
        maxDistance: radius,
        query,
        spherical: true,
      },
    };

    const countResult = await Listing.aggregate([geoNearStage, { $count: 'total' }]);
    total = countResult.length > 0 ? countResult[0].total : 0;

    const results = await Listing.aggregate([geoNearStage, { $skip: skip }, { $limit: parsedLimit }]);
    await Listing.populate(results, { path: 'sellerId', select: SELLER_PUBLIC_FIELDS });
    listings = withIds(results);
  } else {
    const sort = SORT_OPTIONS[asString(filters.sort) || 'newest'] || SORT_OPTIONS.newest;
    total = await Listing.countDocuments(query);
    const docs = await Listing.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit)
      .populate('sellerId', SELLER_PUBLIC_FIELDS);
    listings = docs.map((doc) => doc.toJSON());
  }

  return {
    listings,
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1,
  };
};

interface RequestingUser {
  id?: string;
  isVerified?: boolean;
  role?: string;
}

export const getListingById = async (listingId: string, requester: RequestingUser = {}) => {
  const listing = await Listing.findById(listingId).populate(
    'sellerId',
    `${SELLER_PUBLIC_FIELDS} phoneNumber`
  );

  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  const listingObj: any = listing.toJSON();
  const sellerId = listingObj.sellerId?.id ?? String(listing.sellerId);
  const isOwner = !!requester.id && String(sellerId) === String(requester.id);
  const isStaff = requester.role === 'admin' || requester.role === 'moderator';

  // Pending / archived ads are only visible to their owner and staff
  if (!['active', 'sold'].includes(listing.status) && !isOwner && !isStaff) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  // Contact info is only for verified users, and never when the seller hid it
  const canSeePhone = isOwner || isStaff || (!listingObj.hidePhoneNumber && requester.isVerified);
  if (listingObj.sellerId && typeof listingObj.sellerId === 'object' && !canSeePhone) {
    listingObj.sellerId.phoneNumber = null;
  }

  return listingObj;
};

const EDITABLE_FIELDS = ['title', 'description', 'price', 'category', 'condition', 'images', 'hidePhoneNumber', 'location'] as const;

export const updateListing = async (listingId: string, sellerId: string | Types.ObjectId, rawUpdates: any) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  if (String(listing.sellerId) !== String(sellerId)) {
    throw new AppError('Unauthorized to update this listing', 403, 'UNAUTHORIZED');
  }

  if (!['active', 'pending'].includes(listing.status)) {
    throw new AppError('Only active or pending listings can be edited', 400, 'BAD_REQUEST');
  }

  // Whitelist — status, sellerId, expiresAt etc. can never be changed by the seller
  const updates: any = {};
  for (const field of EDITABLE_FIELDS) {
    if (rawUpdates?.[field] !== undefined) updates[field] = rawUpdates[field];
  }

  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.images !== undefined && (!Array.isArray(updates.images) || updates.images.length === 0)) {
    throw new AppError('images array must not be empty', 400, 'VALIDATION_FAILED');
  }

  let isPending = listing.status === 'pending';

  if (updates.title) updates.title = stripHtmlTags(updates.title);
  if (updates.description) updates.description = stripHtmlTags(updates.description);

  if (updates.title && updates.title !== listing.title) {
    isPending = true;
  }

  if (updates.price !== undefined && listing.price > 0) {
    const priceChangeRatio = Math.abs(updates.price - listing.price) / listing.price;
    if (priceChangeRatio > 0.20) {
      isPending = true;
    }
  }

  const blockedKeyword = checkBlockedKeywords(`${updates.title || listing.title} ${updates.description || listing.description}`);

  let moderationFlags: any = listing.moderationFlags || {};
  if (blockedKeyword) {
    moderationFlags = {
      ...moderationFlags,
      flagType: 'keyword',
      flagReason: `Contains prohibited term: ${blockedKeyword}`,
    };
    isPending = true;
  }

  if (updates.location) {
    updates.location = { ...(listing.toObject().location || {}), ...updates.location, type: 'Point' };
  }

  Object.assign(listing, updates);

  if (isPending) {
    listing.status = 'pending';
  }

  listing.moderationFlags = moderationFlags;

  await listing.save();
  return listing;
};

/**
 * Marks a listing as sold. `buyerId` is optional:
 * - with buyerId → the buyer must have chatted about this listing; they can then leave a review
 * - without buyerId → sold outside Becha-Kena (no review possible)
 */
export const markAsSold = async (
  listingId: string,
  sellerId: string | Types.ObjectId,
  buyerId?: string | null
) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  if (String(listing.sellerId) !== String(sellerId)) {
    throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
  }

  if (listing.status !== 'active') {
    throw new AppError('Only active listings can be marked as sold', 400, 'BAD_REQUEST');
  }

  if (buyerId) {
    if (!mongoose.isValidObjectId(buyerId)) {
      throw new AppError('Invalid buyerId', 400, 'INVALID_ID');
    }

    const chatRoomExists = await ChatRoom.exists({
      listingId: listing._id,
      buyerId: new mongoose.Types.ObjectId(buyerId),
      sellerId: listing.sellerId,
    });

    if (!chatRoomExists) {
      throw new AppError('This buyer has no chat history for this listing', 400, 'NO_CHAT_HISTORY');
    }
  }

  listing.status = 'sold';
  listing.soldToBuyerId = buyerId ? new mongoose.Types.ObjectId(buyerId) : null;
  await listing.save();

  return listing;
};

export const renewListing = async (listingId: string, sellerId: string | Types.ObjectId) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  if (String(listing.sellerId) !== String(sellerId)) {
    throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
  }

  if (listing.status === 'sold') {
    throw new AppError('Sold listings cannot be renewed', 400, 'BAD_REQUEST');
  }

  // Ads rejected by a moderator are archived with a manual flag — they must be edited & re-reviewed instead
  if (listing.status === 'archived' && listing.moderationFlags?.flagType === 'manual') {
    throw new AppError('Rejected listings cannot be renewed', 400, 'LISTING_REJECTED');
  }

  listing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // + 30 days

  if (listing.status === 'archived') {
    listing.status = 'active';
  }

  await listing.save();
  return listing;
};

export const deleteListing = async (listingId: string, sellerId: string | Types.ObjectId) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  if (String(listing.sellerId) !== String(sellerId)) {
    throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
  }

  listing.status = 'archived';
  await listing.save();

  return { message: 'Listing deleted successfully' };
};

export const getMyListings = async (sellerId: string | Types.ObjectId, status?: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  const query: any = { sellerId };
  
  if (status) {
    query.status = status;
  }

  const total = await Listing.countDocuments(query);
  const listings = await Listing.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

  return {
    listings,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};
