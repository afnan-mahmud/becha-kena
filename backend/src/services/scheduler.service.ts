import cron from 'node-cron';
import Listing from '../models/Listing';
import User from '../models/User';
import VerificationLog from '../models/VerificationLog';

// Ad Renewal Reminder (Runs daily at 9:00 AM)
export const scheduleAdRenewalReminder = () => {
  return cron.schedule('0 9 * * *', async () => {
    try {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const fourDaysFromNow = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      
      const listings = await Listing.find({
        status: 'active',
        expiresAt: {
          $gte: threeDaysFromNow,
          $lt: fourDaysFromNow,
        }
      });

      // TODO: send push notification to seller (NT-2 reminder)
      console.log(`[Scheduler] Sent ad renewal reminders for ${listings.length} listings.`);
    } catch (error) {
      console.error('[Scheduler Error] Ad Renewal Reminder:', error);
    }
  });
};

// Ad Auto-Archive (Runs daily at midnight)
export const scheduleAdAutoArchive = () => {
  return cron.schedule('0 0 * * *', async () => {
    try {
      const result = await Listing.updateMany(
        { status: 'active', expiresAt: { $lte: new Date() } },
        { $set: { status: 'archived' } }
      );
      console.log(`[Scheduler] Auto-archived ${result.modifiedCount} expired listings.`);
    } catch (error) {
      console.error('[Scheduler Error] Ad Auto-Archive:', error);
    }
  });
};

// Inactive User Sweep (Runs daily at 2:00 AM)
export const scheduleInactiveUserSweep = () => {
  return cron.schedule('0 2 * * *', async () => {
    try {
      const halfYearAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      
      const usersToDeactivate = await User.find({
        status: 'active',
        lastLoginDate: { $lt: halfYearAgo }
      });

      const userIds = usersToDeactivate.map(u => u._id);

      if (userIds.length > 0) {
        await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { status: 'inactive' } }
        );

        await Listing.updateMany(
          { sellerId: { $in: userIds }, status: 'active' },
          { $set: { status: 'archived' } }
        );
      }

      console.log(`[Scheduler] Inactive user sweep deactivated ${userIds.length} users.`);
    } catch (error) {
      console.error('[Scheduler Error] Inactive User Sweep:', error);
    }
  });
};

// Account Deletion PII Purge (Runs daily at 3:00 AM)
export const scheduleAccountDeletionPurge = () => {
  return cron.schedule('0 3 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const usersToPurge = await User.find({
        deletionRequestedAt: { $ne: null, $lt: thirtyDaysAgo }
      });

      let purgedCount = 0;

      for (const user of usersToPurge) {
        user.displayName = '[Deleted User]';
        user.verifiedName = null;
        user.phoneNumber = `deleted_${user._id}_${Date.now()}`;
        user.fcmTokens = [];
        await user.save();

        await VerificationLog.deleteMany({ userId: user._id });
        // TODO: Delete associated S3 files
        
        purgedCount++;
      }

      console.log(`[Scheduler] Account deletion purge completed for ${purgedCount} users.`);
    } catch (error) {
      console.error('[Scheduler Error] Account Deletion Purge:', error);
    }
  });
};

// Minor-to-Adult Transition Check (Runs daily at 4:00 AM)
export const scheduleMinorTransitionCheck = () => {
  return cron.schedule('0 4 * * *', async () => {
    try {
      const result = await User.updateMany(
        {
          ageGroup: 'minor',
          minorTransitionDueDate: { $lte: new Date() },
          isVerified: true
        },
        { $set: { isVerified: false } }
      );
      // TODO: Send notification to the user
      
      console.log(`[Scheduler] Minor-to-adult transition restricted ${result.modifiedCount} accounts.`);
    } catch (error) {
      console.error('[Scheduler Error] Minor Transition Check:', error);
    }
  });
};
