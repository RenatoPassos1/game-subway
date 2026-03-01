import * as cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import pino from 'pino';
import {
  getAuctionsStartingBetween,
  getRecentlyStartedAuctions,
  getPendingAuctionsForDigest,
} from './auctionsProvider.js';
import { broadcastAuctionEvent } from './notificationEngine.js';

const logger = pino({ name: 'notification-scheduler' });

let schedulerTask: ScheduledTask | null = null;
let digestTask: ScheduledTask | null = null;

function formatPrize(value: number, token: string): string {
  return `${value} ${token}`;
}

async function checkScheduledAuctions(): Promise<void> {
  const now = new Date();

  // Check auctions starting in ~60 minutes (59-61 min window)
  const in60From = new Date(now.getTime() + 59 * 60 * 1000);
  const in60To = new Date(now.getTime() + 61 * 60 * 1000);
  const starts60 = await getAuctionsStartingBetween(in60From, in60To);
  for (const auction of starts60) {
    await broadcastAuctionEvent({
      eventType: 'starts_60',
      auctionId: auction.id,
      title: 'Auction in 1 Hour',
      message: `A ${formatPrize(auction.prize_value, auction.prize_token)} auction starts in 1 hour! Get ready to click.`,
      url: `https://clickwin.fun`,
      filters: { prizeToken: auction.prize_token, prizeValueUsd: auction.prize_value },
    });
  }

  // Check auctions starting in ~30 minutes
  const in30From = new Date(now.getTime() + 29 * 60 * 1000);
  const in30To = new Date(now.getTime() + 31 * 60 * 1000);
  const starts30 = await getAuctionsStartingBetween(in30From, in30To);
  for (const auction of starts30) {
    await broadcastAuctionEvent({
      eventType: 'starts_30',
      auctionId: auction.id,
      title: 'Auction in 30 Minutes',
      message: `A ${formatPrize(auction.prize_value, auction.prize_token)} auction starts in 30 minutes!`,
      url: `https://clickwin.fun`,
      filters: { prizeToken: auction.prize_token, prizeValueUsd: auction.prize_value },
    });
  }

  // Check auctions starting in ~5 minutes
  const in5From = new Date(now.getTime() + 4 * 60 * 1000);
  const in5To = new Date(now.getTime() + 6 * 60 * 1000);
  const starts5 = await getAuctionsStartingBetween(in5From, in5To);
  for (const auction of starts5) {
    await broadcastAuctionEvent({
      eventType: 'starts_5',
      auctionId: auction.id,
      title: 'Auction Starting Soon!',
      message: `A ${formatPrize(auction.prize_value, auction.prize_token)} auction starts in 5 minutes! Don't miss it!`,
      url: `https://clickwin.fun`,
      filters: { prizeToken: auction.prize_token, prizeValueUsd: auction.prize_value },
    });
  }

  // Check auctions that just went live (last 2 minutes)
  const liveSince = new Date(now.getTime() - 2 * 60 * 1000);
  const liveNow = await getRecentlyStartedAuctions(liveSince);
  for (const auction of liveNow) {
    await broadcastAuctionEvent({
      eventType: 'live_now',
      auctionId: auction.id,
      title: 'Auction LIVE NOW!',
      message: `A ${formatPrize(auction.prize_value, auction.prize_token)} auction is LIVE! Start clicking now!`,
      url: `https://clickwin.fun`,
      filters: { prizeToken: auction.prize_token, prizeValueUsd: auction.prize_value },
    });
  }

  const total = starts60.length + starts30.length + starts5.length + liveNow.length;
  if (total > 0) {
    logger.info({ starts60: starts60.length, starts30: starts30.length, starts5: starts5.length, liveNow: liveNow.length }, 'Scheduler check complete');
  }
}

async function sendDailyDigest(): Promise<void> {
  const upcoming = await getPendingAuctionsForDigest();
  if (upcoming.length === 0) return;

  const lines = upcoming.map((a) => {
    const start = new Date(a.scheduled_start).toLocaleString('en-US', { timeZone: 'UTC' });
    return `• ${formatPrize(a.prize_value, a.prize_token)} - ${start} UTC`;
  });

  await broadcastAuctionEvent({
    eventType: 'daily_digest',
    auctionId: 'digest',
    title: 'Today\'s Upcoming Auctions',
    message: `Here are today's upcoming auctions:\n\n${lines.join('\n')}`,
    url: 'https://clickwin.fun',
  });

  logger.info({ count: upcoming.length }, 'Daily digest sent');
}

export function startScheduler(): void {
  // Run every minute to check auction schedules
  schedulerTask = cron.schedule('* * * * *', async () => {
    try {
      await checkScheduledAuctions();
    } catch (err: any) {
      logger.error({ err: err.message }, 'Scheduler check failed');
    }
  });

  // Daily digest at 09:00 UTC
  digestTask = cron.schedule('0 9 * * *', async () => {
    try {
      await sendDailyDigest();
    } catch (err: any) {
      logger.error({ err: err.message }, 'Daily digest failed');
    }
  });

  logger.info('Notification scheduler started (every minute + daily digest at 09:00 UTC)');
}

export function stopScheduler(): void {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
  }
  if (digestTask) {
    digestTask.stop();
    digestTask = null;
  }
  logger.info('Notification scheduler stopped');
}
