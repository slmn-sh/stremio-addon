import { Torrent } from "../types/libs";

const INFO_HASH_REGEX = /(?<=btih:)([A-Za-z0-9]+)/;

export function getInfoHash(magnet?: string) {
  return magnet?.match(INFO_HASH_REGEX)?.[0].toUpperCase();
}

export function sortTorrents(torrentA: Torrent, torrentB: Torrent) {
  const qualityA = +torrentA.quality.slice(0, -1) + Number(torrentA.isHDR);
  const qualityB = +torrentB.quality.slice(0, -1) + Number(torrentB.isHDR);
  if (qualityA > qualityB) {
    return -1;
  } else if (qualityA < qualityB) {
    return 1;
  }
  const seederToSizeA = torrentA.size / torrentA.seeders;
  const seederToSizeB = torrentB.size / torrentB.seeders;
  if (seederToSizeA < seederToSizeB) {
    return -1;
  }
  return 1;
}

export function filterTorrents(torrents: Torrent[]) {
  const hashSeed: Record<string, number> = {};

  for (const torrent of torrents) {
    hashSeed[torrent.infoHash] = Math.max(
      torrent.seeders,
      hashSeed[torrent.infoHash] ?? 0,
    );
  }

  return torrents.filter(
    (torrent) =>
      torrent.seeders !== 0 && hashSeed[torrent.infoHash] === torrent.seeders,
  );
}
