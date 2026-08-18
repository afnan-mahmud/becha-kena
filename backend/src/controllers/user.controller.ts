import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id.toString();
    const profile = await userService.getProfile(userId);
    res.status(200).json({
      status: 'success',
      data: { user: profile }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id.toString();
    const updatedUser = await userService.updateProfile(userId, req.body);
    res.status(200).json({
      status: 'success',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id.toString();
    const result = await userService.requestDeletion(userId);
    
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.getPublicProfile(req.params.id as string);
    res.status(200).json({
      status: 'success',
      data: { user: profile }
    });
  } catch (error) {
    next(error);
  }
};
