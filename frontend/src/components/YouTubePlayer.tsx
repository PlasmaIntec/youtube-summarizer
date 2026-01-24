import { useRef, useImperativeHandle, forwardRef } from "react";

interface YouTubePlayerProps {
  videoId: string;
}

export type YouTubePlayerRef = {
  seekTo: (seconds: number) => void;
};

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ videoId }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: "command",
              func: "seekTo",
              args: [seconds, true],
            }),
            "*"
          );
        }
      },
    }));

    return (
      <div className="youtube-player">
        <iframe
          ref={iframeRef}
          width="100%"
          height="360"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
);
