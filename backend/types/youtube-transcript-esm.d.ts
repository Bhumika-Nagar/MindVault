declare module "youtube-transcript/dist/youtube-transcript.esm.js" {
  export interface YoutubeTranscriptLine {
    text: string;
    duration: number;
    offset: number;
    lang: string;
  }

  export class YoutubeTranscript {
    static fetchTranscript(
      videoIdOrUrl: string,
      options?: { lang?: string },
    ): Promise<YoutubeTranscriptLine[]>;
  }
}
