declare module "react-player/youtube" {
  import React from "react";

  interface ReactPlayerProps {
    url?: string;
    width?: string | number;
    height?: string | number;
    controls?: boolean;
    playing?: boolean;
    playIcon?: React.ReactNode;
    light?: boolean | string;
    loop?: boolean;
    muted?: boolean;
    volume?: number;
    progressInterval?: number;
    onReady?: () => void;
    onStart?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onEnded?: () => void;
    onError?: (error: any) => void;
    onBuffer?: () => void;
    onBufferEnd?: () => void;
    onSeek?: (seconds: number) => void;
    config?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export default class ReactPlayer extends React.Component<ReactPlayerProps> {}
}
