import { Request, Response, NextFunction } from 'express';
import { generatePresignedUploadUrl } from '../services/s3.service';
import { AppError } from '../utils/AppError';

export const getPresignedUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      return next(new AppError('fileName and fileType are required', 400, 'BAD_REQUEST'));
    }

    const targetFolder = folder || 'listings';

    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl(
      fileName,
      fileType,
      targetFolder
    );

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        fileUrl,
      },
    });
  } catch (error: any) {
    if (error.message.includes('Invalid file type')) {
      return next(new AppError(error.message, 400, 'INVALID_FILE_TYPE'));
    }
    next(error);
  }
};
