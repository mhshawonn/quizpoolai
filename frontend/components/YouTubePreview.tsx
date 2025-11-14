"use client";

import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player/youtube"), { ssr: false });

interface Props {
  url: string;
}

export function YouTubePreview({ url }: Props) {
  if (!url) return null;
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
      <ReactPlayer url={url} width="100%" height="320px" controls playIcon data-testid="player" />
    </div>
  );
}
