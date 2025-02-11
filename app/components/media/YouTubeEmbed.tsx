import YouTube from "react-youtube";

interface YouTubeEmbedProps {
  videoId: string;
}

export default function YouTubeEmbed({ videoId }: YouTubeEmbedProps) {
  const opts = {
    height: "390",
    width: "100%",
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div className="aspect-video w-full">
      <YouTube videoId={videoId} opts={opts} />
    </div>
  );
}
