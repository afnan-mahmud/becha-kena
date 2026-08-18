import { 
  scheduleAdRenewalReminder,
  scheduleAdAutoArchive,
  scheduleInactiveUserSweep,
  scheduleAccountDeletionPurge,
  scheduleMinorTransitionCheck
} from '../services/scheduler.service';

import * as cron from 'node-cron';

let tasks: cron.ScheduledTask[] = [];

export const initSchedulers = () => {
  tasks.push(scheduleAdRenewalReminder());
  tasks.push(scheduleAdAutoArchive());
  tasks.push(scheduleInactiveUserSweep());
  tasks.push(scheduleAccountDeletionPurge());
  tasks.push(scheduleMinorTransitionCheck());
  console.log('[Scheduler] All background cron jobs initialized.');
};

export const stopSchedulers = () => {
  tasks.forEach(task => task.stop());
  tasks = [];
  console.log('[Scheduler] All background cron jobs stopped.');
};
