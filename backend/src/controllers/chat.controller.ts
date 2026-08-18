import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service';
import Listing from '../models/Listing';
import { AppError } from '../utils/AppError';

export const getRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await chatService.getRoomsForUser(req.user!._id);
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await chatService.getMessages(roomId as string, req.user!._id, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId, sellerId } = req.body;

    if (!listingId) {
      return next(new AppError('listingId is required', 400, 'VALIDATION_ERROR'));
    }

    let targetSellerId = sellerId;
    if (!targetSellerId) {
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return next(new AppError('Listing not found', 404, 'LISTING_NOT_FOUND'));
      }
      targetSellerId = listing.sellerId;
    }

    const room = await chatService.getOrCreateRoom(req.user!._id, targetSellerId, listingId);
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};
