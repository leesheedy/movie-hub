import { getProviderFromId } from "./methods/helpers";
import { MWMedia, MWPortableMedia, MWMediaStream } from "./types";

export * from "./types";
export * from "./methods/helpers";
export * from "./methods/providers";
export * from "./methods/search";

/*
 ** Turn media object into a portable media object
 */
export function convertMediaToPortable(media: MWMedia): MWPortableMedia {
  return {
    mediaId: media.mediaId,
    providerId: media.providerId,
    mediaType: media.mediaType,
    episodeId: media.episodeId,
    seasonId: media.seasonId,
  };
}

/*
 ** Turn portable media into media object
 */
export async function convertPortableToMedia(
  portable: MWPortableMedia
): Promise<MWMedia | undefined> {
  const provider = getProviderFromId(portable.providerId);
  return provider?.getMediaFromPortable(portable);
}

/*
 ** find provider from portable and get stream from that provider
 */
export async function getStream(
  media: MWPortableMedia
): Promise<MWMediaStream | undefined> {
  const provider = getProviderFromId(media.providerId);
  if (!provider) return undefined;

  return provider.getStream(media);
}
