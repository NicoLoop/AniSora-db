export type SkipType = 'op' | 'ed' | 'mixed-op' | 'mixed-ed' | 'recap';

export interface AniSkipRawInterval {
  startTime: number;
  endTime: number;
}

export interface AniSkipRawResult {
  interval: AniSkipRawInterval;
  skipType: SkipType;
  skipId: string;
  episodeLength: number;
}

export interface AniSkipRawResponse {
  found: boolean;
  results: AniSkipRawResult[];
  message: string;
  statusCode: number;
}

export interface SkipIntervalDetail {
  startTime: number;
  endTime: number;
  duration: number;
  skipId?: string;
  skipType: SkipType;
}

export interface FormattedSkipTimes {
  op?: SkipIntervalDetail;
  ed?: SkipIntervalDetail;
  recap?: SkipIntervalDetail;
  mixedOp?: SkipIntervalDetail;
  mixedEd?: SkipIntervalDetail;
}

export interface AniSkipData {
  found: boolean;
  malId: number | null;
  anilistId: number | null;
  episodeNumber: number;
  episodeLength: number;
  skipTimes: FormattedSkipTimes;
  results: AniSkipRawResult[];
  cached?: boolean;
  source: 'aniskip';
}
