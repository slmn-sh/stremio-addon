import type { Quality } from "./stream";

export type Args = {
  title: string;
  year: number;
  quality: Quality[];
} & (
  | {
      type: "movie";
    }
  | {
      type: "tvSeries";
      season: string;
      episode: string;
    }
);
