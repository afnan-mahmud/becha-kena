import { Request, Response, NextFunction } from 'express';
import * as adService from '../services/ad.service';

export const createListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await adService.createListing(req.user!._id, req.body);
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adService.getListings(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getListingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await adService.getListingById(req.params.id as string, req.user?._id?.toString());
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await adService.updateListing(req.params.id as string, req.user!._id, req.body);
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

export const markAsSold = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await adService.markAsSold(req.params.id as string, req.user!._id, req.body.buyerId);
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

export const renewListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await adService.renewListing(req.params.id as string, req.user!._id);
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adService.deleteListing(req.params.id as string, req.user!._id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getMyListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await adService.getMyListings(req.user!._id, status, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
