import { quality } from "../utils/string";
import type { SubtitleObject } from "./subtitle";

export type Quality = (typeof quality)[number];

export type StreamObject = (
  | {
      /** Direct URL to a video stream - must be an MP4 through https; others supported (other video formats over http/rtmp supported if you set notWebReady) */
      url: string;
    }
  | {
      /** Youtube video ID, plays using the built-in YouTube player */
      ytId: string;
    }
  | {
      /** Info hash of a torrent file, and fileIdx is the index of the video file within the torrent; if fileIdx is not specified, the largest file in the torrent will be selected */
      infoHash: string;
    }
  | {
      /** The index of the video file within the torrent (from infoHash); if fileIdx is not specified, the largest file in the torrent will be selected */
      fileIdx: number;
    }
  | {
      /** an external URL to the video, which should be opened in a browser (webpage), e.g. link to Netflix */
      externalUrl: string;
    }
) & {
  /** Name of the stream; usually used for stream quality */
  name?: string;
  /** Description of the stream
   * @deprecated
   * @see description
   */
  title?: string;
  /** description of the stream (previously stream.title) */
  description?: string;
  /** array of Subtitle objects representing subtitles for this stream */
  subtitle?: SubtitleObject[];
  /** represents a list of torrent tracker URLs and DHT network nodes. This attribute can be used to provide additional peer discovery options when infoHash is also specified, but it is not required. If used, each element can be a tracker URL (tracker:<protocol>://<host>:<port>) where <protocol> can be either http or udp. A DHT node (dht:<node_id/info_hash>) can also be included.
   * > **WARNING**: Use of DHT may be prohibited by some private trackers as it exposes torrent activity to a broader network, potentially finding more peers.
   */
  sources?: string[];
  behaviorHints?: {
    /** which hints it's restricted to particular countries - array of ISO 3166-1 alpha-3 country codes in lowercase in which the stream is accessible */
    countryWhitelist?: string[];
    /** applies if the protocol of the url is http(s); needs to be set to true if the URL does not support https or is not an MP4 file */
    notWebReady?: boolean;
    /** if defined, addons with the same behaviorHints.bingeGroup will be chosen automatically for binge watching; this should be something that identifies the stream's nature within your addon: for example, if your addon is called "gobsAddon", and the stream is 720p, the bingeGroup should be "gobsAddon-720p"; if the next episode has a stream with the same bingeGroup, stremio should select that stream implicitly */
    bingeGroup?: string;
    /** the calculated OpenSubtitles hash of the video, this will be used when the streaming server is not connected (so the hash cannot be calculated locally), this value is passed to subtitle addons to identify correct subtitles */
    videoHash?: string;
    /** size of the video file in bytes, this value is passed to the subtitle addons to identify correct subtitles */
    videoSize?: number;
    /** filename of the video file, although optional, it is highly recommended to set it when using stream.url (when possible) in order to identify correct subtitles (addon sdk will show a warning if it is not set in this case), this value is passed to the subtitle addons to identify correct subtitles */
    filename?: string;
  };
};
