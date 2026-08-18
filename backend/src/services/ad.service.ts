import mongoose, { Types } from 'mongoose';
import Listing from '../models/Listing';
import { AppError } from '../utils/AppError';
import { checkBlockedKeywords } from '../utils/keywords';
import { stripHtmlTags } from '../utils/sanitize';

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
  
  const moderationFlags = blockedKeyword
    ? {
        flagType: 'keyword',
        flagReason: `Contains prohibited term: ${blockedKeyword}`,
      }
    : undefined;

  const listing = new Listing({
    ...data,
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

export const getListings = async (filters: any) => {
  const { category, minPrice, maxPrice, search, lat, lng, radius, page = 1, limit = 20 } = filters;
  
  const parsedPage = parseInt(page as string, 10);
  const parsedLimit = Math.min(parseInt(limit as string, 10), 50);
  const skip = (parsedPage - 1) * parsedLimit;

  let query: any = { status: 'active' };

  if (category) query.category = category;
  if (minPrice !== undefined) query.price = { ...query.price, $gte: Number(minPrice) };
  if (maxPrice !== undefined) query.price = { ...query.price, $lte: Number(maxPrice) };
  
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  let listings;
  let total;

  if (lat !== undefined && lng !== undefined && radius !== undefined) {
    const geoNearStage = {
      $geoNear: {
        near: { type: 'Point' as const, coordinates: [Number(lng), Number(lat)] as [number, number] },
        distanceField: 'dist.calculated',
        maxDistance: Number(radius), // in meters
        query: query,
        spherical: true
      }
    };
    
    const countPipeline = [geoNearStage, { $count: 'total' }];
    const countResult = await Listing.aggregate(countPipeline);
    total = countResult.length > 0 ? countResult[0].total : 0;

    listings = await Listing.aggregate([
      geoNearStage,
      { $skip: skip },
      { $limit: parsedLimit }
    ]);
  } else {
    total = await Listing.countDocuments(query);
    listings = await Listing.find(query).skip(skip).limit(parsedLimit).sort({ createdAt: -1 });
  }

  return {
    listings,
    total,
    page: parsedPage,
    totalPages: Math.ceil(total / parsedLimit)
  };
};

export const getListingById = async (listingId: string, requestingUserId?: string | Types.ObjectId) => {
  const listing = await Listing.findById(listingId).populate('sellerId', 'displayName verifiedName averageRating totalReviews isVerified phoneNumber');
  
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  const listingObj = listing.toObject();

  if (listingObj.hidePhoneNumber && String(listingObj.sellerId._id) !== String(requestingUserId)) {
    if (listingObj.sellerId && (listingObj.sellerId as any).phoneNumber) {
      (listingObj.sellerId as any).phoneNumber = '***-***-****';
    }
  }

  return listingObj;
};

export const updateListing = async (listingId: string, sellerId: string | Types.ObjectId, updates: any) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  if (String(listing.sellerId) !== String(sellerId)) {
    throw new AppError('Unauthorized to update this listing', 403, 'UNAUTHORIZED');
  }

  let isPending = listing.status === 'pending';

  if (updates.title && updates.title !== listing.title) {
    isPending = true;
  }

  if (updates.price !== undefined) {
    const priceChangeRatio = Math.abs(updates.price - listing.price) / listing.price;
    if (priceChangeRatio > 0.20) {
      isPending = true;
    }
  }

  if (updates.title) updates.title = stripHtmlTags(updates.title);
  if (updates.description) updates.description = stripHtmlTags(updates.description);

  const blockedKeyword = checkBlockedKeywords(`${updates.title || listing.title} ${updates.description || listing.description}`);
  
  let moderationFlags = listing.moderationFlags || {};
  if (blockedKeyword) {
    moderationFlags = {
      ...moderationFlags,
      flagType: 'keyword',
      flagReason: `Contains prohibited term: ${blockedKeyword}`,
    };
    isPending = true;
  }

  Object.assign(listing, updates);
  
  if (isPending) {
    listing.status = 'pending';
  }
  
  // Need to cast because of nested strict typing if moderationFlags was strictly typed
  listing.moderationFlags = moderationFlags as any;

  await listing.save();
  return listing;
};

export const markAsSold = async (listingId: string, sellerId: string | Types.ObjectId, buyerId: string | Types.ObjectId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const listing = await Listing.findById(listingId).session(session);
    if (!listing) {
      throw new AppError('Listing not found', 404, 'NOT_FOUND');
    }

    if (String(listing.sellerId) !== String(sellerId)) {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    if (listing.status !== 'active') {
      throw new AppError('Listing is not active', 400, 'BAD_REQUEST');
    }

    const chatRoomsCollection = mongoose.connection.collection('chatrooms');
    const chatRoomCount = await chatRoomsCollection.countDocuments({
      listingId: new mongoose.Types.ObjectId(listingId),
      buyerId: new mongoose.Types.ObjectId(buyerId),
      sellerId: new mongoose.Types.ObjectId(sellerId),
    }, { session: session as any });

    if (chatRoomCount === 0) {
      throw new AppError('NO_CHAT_HISTORY', 400, 'NO_CHAT_HISTORY');
    }

    listing.status = 'sold';
    listing.soldToBuyerId = new mongoose.Types.ObjectId(buyerId);

    await listing.save({ session });

    await session.commitTransaction();
    session.endSession();

    return listing;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const renewListing = async (listingId: string, sellerId: string | Types.ObjectId) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  if (String(listing.sellerId) !== String(sellerId)) {
    throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
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
