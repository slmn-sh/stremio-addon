export type SubtitleObject = {
  /** unique identifier for each subtitle, if you have more than one subtitle with the same language, the id will differentiate them */
  id: string;
  /** url to the subtitle file */
  url: string;
  /** language code for the subtitle, if a valid ISO 639-2 code is not sent, the text of this value will be used instead */
  lang: string;
};
