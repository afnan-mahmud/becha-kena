import { Router } from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  markAsSold,
  renewListing,
  deleteListing,
  getMyListings,
} from '../controllers/ad.controller';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { requireVerified } from '../middlewares/requireVerified';
import { validate } from '../middlewares/validate';
import { createListingSchema } from '../validations/listing.validation';

const router = Router();

router.get('/', getListings);
router.post('/', authenticate, requireVerified, validate(createListingSchema), createListing);
router.get('/my', authenticate, getMyListings);
router.get('/:id', optionalAuth, getListingById);
router.put('/:id', authenticate, requireVerified, updateListing);
router.patch('/:id/sell', authenticate, requireVerified, markAsSold);
router.patch('/:id/renew', authenticate, requireVerified, renewListing);
router.delete('/:id', authenticate, requireVerified, deleteListing);

export default router;
