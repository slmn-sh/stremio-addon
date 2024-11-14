export const quality = ["2160p", "1080p", "720p", "480p"] as const;
export const qualityRegex = new RegExp(quality.join("|"), "g");
export const hdrRegex = /HDR/i

export function formatSeasonEpisode(season: string, episode: string) {
  season = "S" + season.padStart(2, "0");
  episode = "E" + episode.padStart(2, "0");
  return [season, episode];
}
