const INFO_HASH_REGEX = /(?<=btih:)([A-Z0-9]+)/

export function getInfoHash(magnet?: string) {
  return magnet?.match(INFO_HASH_REGEX)?.[0]
}
