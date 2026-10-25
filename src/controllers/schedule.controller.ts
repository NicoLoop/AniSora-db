import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import {
  extractScheduleWidget,
  extractScheduleDay,
} from '../extractors/schedule.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { ScheduleData, ScheduleDateItem } from '../types/anime.js';

interface ScheduleApiResponse {
  html?: string;
  [key: string]: any;
}

export class ScheduleController {
  public async getSchedule(req: Request, res: Response): Promise<void> {
    const rawDate = typeof req.query.date === 'string' ? req.query.date.trim() : '';
    const rawTzOffset = req.query.tzOffset;
    const tzOffset =
      typeof rawTzOffset === 'string' ? parseInt(rawTzOffset, 10) || 0 : 0;

    try {
      console.log(`[ScheduleController] Fetching schedule (date: "${rawDate || 'auto'}", tzOffset: ${tzOffset})...`);

      let selectedDate = rawDate;
      let availableDates: ScheduleDateItem[] = [];

      // 1. If date is not specified, or to load available date tabs
      try {
        const widgetEndpoint = `/api/theme/schedule/widget?tzOffset=${tzOffset}`;
        const widgetData = await scraperService.fetchJson<ScheduleApiResponse>(widgetEndpoint);

        if (widgetData?.html) {
          const widgetInfo = extractScheduleWidget(widgetData.html);
          availableDates = widgetInfo.availableDates;

          if (!selectedDate && widgetInfo.activeDate) {
            selectedDate = widgetInfo.activeDate;
          }
        }
      } catch (widgetError) {
        console.warn('[ScheduleController] Failed to fetch schedule widget tabs:', widgetError);
      }

      // If still no selectedDate, fallback to today (YYYY-MM-DD)
      if (!selectedDate) {
        selectedDate = new Date().toISOString().split('T')[0];
      }

      // 2. Fetch the day's schedule
      const dayEndpoint = `/api/theme/schedule/day?date=${encodeURIComponent(selectedDate)}&tzOffset=${tzOffset}`;
      const dayData = await scraperService.fetchJson<ScheduleApiResponse>(dayEndpoint);

      const scheduledAnimes = dayData?.html ? extractScheduleDay(dayData.html) : [];

      // Mark the selected date as active in availableDates if present
      if (availableDates.length > 0) {
        availableDates = availableDates.map((d) => ({
          ...d,
          isActive: d.date === selectedDate,
        }));
      }

      const responseData: ScheduleData = {
        date: selectedDate,
        tzOffset,
        availableDates,
        scheduledAnimes,
      };

      sendSuccess(res, responseData);
    } catch (error) {
      console.error('[ScheduleController] Error fetching schedule:', error);
      sendError(res, 'Failed to fetch schedule data', 500, error);
    }
  }
}

export const scheduleController = new ScheduleController();
export default scheduleController;
