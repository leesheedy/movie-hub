import { IconPatch } from "components/buttons/IconPatch";
import { Icons } from "components/Icon";
import { Navigation } from "components/layout/Navigation";
import { Paper } from "components/layout/Paper";
import { LoadingSeasons, Seasons } from "components/layout/Seasons";
import { SkeletonVideoPlayer, VideoPlayer } from "components/media/VideoPlayer";
import { ArrowLink } from "components/text/ArrowLink";
import { DotList } from "components/text/DotList";
import { Title } from "components/text/Title";
import { useLoading } from "hooks/useLoading";
import { usePortableMedia } from "hooks/usePortableMedia";
import {
  MWPortableMedia,
  getStream,
  MWMediaStream,
  MWMedia,
  convertPortableToMedia,
  getProviderFromId,
  MWMediaProvider,
  MWMediaType,
} from "providers";
import { ReactElement, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  getIfBookmarkedFromPortable,
  useBookmarkContext,
} from "state/bookmark";
import { getWatchedFromPortable, useWatchedContext } from "state/watched";
import { NotFoundChecks } from "./notfound/NotFoundChecks";

interface StyledMediaViewProps {
  media: MWMedia;
  stream: MWMediaStream;
}

function StyledMediaView(props: StyledMediaViewProps) {
  const watchedStore = useWatchedContext();
  const startAtTime: number | undefined = getWatchedFromPortable(
    watchedStore.watched.items,
    props.media
  )?.progress;

  function updateProgress(e: Event) {
    if (!props.media) return;
    const el: HTMLVideoElement = e.currentTarget as HTMLVideoElement;
    if (el.currentTime <= 30) {
      return; // Don't update stored progress if less than 30s into the video
    }
    watchedStore.updateProgress(props.media, el.currentTime, el.duration);
  }

  return (
    <VideoPlayer
      source={props.stream}
      captions={props.stream.captions}
      onProgress={(e) => updateProgress(e)}
      startAt={startAtTime}
    />
  );
}

interface StyledMediaFooterProps {
  media: MWMedia;
  provider: MWMediaProvider;
}

function StyledMediaFooter(props: StyledMediaFooterProps) {
  const { setItemBookmark, getFilteredBookmarks } = useBookmarkContext();
  const isBookmarked = getIfBookmarkedFromPortable(
    getFilteredBookmarks(),
    props.media
  );

  return (
    <Paper className="mt-5">
      <div className="flex">
        <div className="flex-1">
          <Title>{props.media.title}</Title>
          <DotList
            className="mt-3 text-sm"
            content={[
              props.provider.displayName,
              props.media.mediaType,
              props.media.year,
            ]}
          />
        </div>
        <div>
          <IconPatch
            icon={Icons.BOOKMARK}
            active={isBookmarked}
            onClick={() => setItemBookmark(props.media, !isBookmarked)}
            clickable
          />
        </div>
      </div>
      {props.media.mediaType !== MWMediaType.MOVIE ? (
        <Seasons media={props.media} />
      ) : null}
    </Paper>
  );
}

function LoadingMediaFooter(props: { error?: boolean }) {
  return (
    <Paper className="mt-5">
      <div className="flex">
        <div className="flex-1">
          <div className="bg-denim-500 mb-2 h-4 w-48 rounded-full" />
          <div>
            <span className="bg-denim-400 mr-4 inline-block h-2 w-12 rounded-full" />
            <span className="bg-denim-400 mr-4 inline-block h-2 w-12 rounded-full" />
          </div>
          {props.error ? (
            <div className="flex items-center space-x-3">
              <IconPatch icon={Icons.WARNING} className="text-red-400" />
              <p>Your url may be invalid</p>
            </div>
          ) : (
            <LoadingSeasons />
          )}
        </div>
      </div>
    </Paper>
  );
}

function MediaViewContent(props: { portable: MWPortableMedia }) {
  const mediaPortable = props.portable;
  const [streamUrl, setStreamUrl] = useState<MWMediaStream | undefined>();
  const [media, setMedia] = useState<MWMedia | undefined>();
  const [fetchMedia, loadingPortable, errorPortable] = useLoading(
    (portable: MWPortableMedia) => convertPortableToMedia(portable)
  );
  const [fetchStream, loadingStream, errorStream] = useLoading(
    (portable: MWPortableMedia) => getStream(portable)
  );

  useEffect(() => {
    (async () => {
      if (mediaPortable) {
        setMedia(await fetchMedia(mediaPortable));
      }
    })();
  }, [mediaPortable, setMedia, fetchMedia]);

  useEffect(() => {
    (async () => {
      if (mediaPortable) {
        setStreamUrl(await fetchStream(mediaPortable));
      }
    })();
  }, [mediaPortable, setStreamUrl, fetchStream]);

  let playerContent: ReactElement | null = null;
  if (loadingStream) playerContent = <SkeletonVideoPlayer />;
  else if (errorStream) playerContent = <SkeletonVideoPlayer error />;
  else if (media && streamUrl)
    playerContent = <StyledMediaView media={media} stream={streamUrl} />;

  let footerContent: ReactElement | null = null;
  if (loadingPortable) footerContent = <LoadingMediaFooter />;
  else if (errorPortable) footerContent = <LoadingMediaFooter error />;
  else if (mediaPortable && media)
    footerContent = (
      <StyledMediaFooter
        provider={
          getProviderFromId(mediaPortable.providerId) as MWMediaProvider
        }
        media={media}
      />
    );

  return (
    <>
      {playerContent}
      {footerContent}
    </>
  );
}

export function MediaView() {
  const mediaPortable: MWPortableMedia | undefined = usePortableMedia();
  const reactHistory = useHistory();

  return (
    <div className="flex min-h-screen w-full">
      <Navigation>
        <ArrowLink
          onClick={() =>
            reactHistory.action !== "POP"
              ? reactHistory.goBack()
              : reactHistory.push("/")
          }
          direction="left"
          linkText="Go back"
        />
      </Navigation>
      <NotFoundChecks portable={mediaPortable}>
        <div className="container mx-auto mt-40 mb-16 max-w-[1100px]">
          <MediaViewContent portable={mediaPortable as MWPortableMedia} />
        </div>
      </NotFoundChecks>
    </div>
  );
}
