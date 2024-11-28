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

export type Torrent = {
  name: string;
  isHDR: boolean;
  seeders: number;
  leechers: number;
  provider: string;
  uploader: string;
  quality: string;
  size: number;
  infoHash: string;
};
