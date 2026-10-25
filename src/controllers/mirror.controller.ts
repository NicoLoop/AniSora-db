import { Request, Response } from 'express';
import scraperService from '../services/scraper.service.js';
import config from '../config/config.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class MirrorController {
  public async getMirrors(req: Request, res: Response): Promise<void> {
    try {
      // If ?check=true is passed, ping all mirrors in real-time
      const shouldCheck = req.query.check === 'true';
      const statusList = shouldCheck ? await scraperService.checkMirrors() : undefined;

      sendSuccess(res, {
        activeBaseUrl: scraperService.getActiveBaseUrl(),
        mainBaseUrl: config.baseUrl,
        mirrors: scraperService.getMirrors(),
        allHosts: scraperService.getAllHosts(),
        mirrorStatus: statusList,
      });
    } catch (error) {
      sendError(res, 'Failed to retrieve mirror information', 500, error);
    }
  }

  public async switchMirror(req: Request, res: Response): Promise<void> {
    try {
      const targetHost = req.body?.host || req.query?.host;
      if (!targetHost || typeof targetHost !== 'string') {
        sendError(res, 'Target mirror host is required in body { host: "..." } or query ?host=...', 400);
        return;
      }

      const cleanHost = targetHost.trim().replace(/\/+$/, '');
      const validHosts = scraperService.getAllHosts();

      if (!validHosts.includes(cleanHost)) {
        sendError(
          res,
          `Invalid host: ${cleanHost}. Allowed hosts: ${validHosts.join(', ')}`,
          400
        );
        return;
      }

      scraperService.setActiveBaseUrl(cleanHost);

      sendSuccess(res, {
        message: `Successfully switched active mirror to ${cleanHost}`,
        activeBaseUrl: scraperService.getActiveBaseUrl(),
      });
    } catch (error) {
      sendError(res, 'Failed to switch mirror', 500, error);
    }
  }
}

export const mirrorController = new MirrorController();
export default mirrorController;
