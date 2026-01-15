"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface EmbedIframeProps {
  id: string; src: string; title: string; width?: string; height?: string;
  allowFullScreen?: boolean; allow?: string; scrolling?: string; className?: string;
}

export function EmbedIframe({
  id, src, title, width = "720", height = "400", allowFullScreen = true,
  allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
  scrolling, className = "centerImage"
}: EmbedIframeProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  const useResponsive = isYouTube || (width === "720" && height === "400");
  
  const spinner = !isLoaded && <Image width={140} height={140} src="/docs-images/images/spinner.gif" className="centerImage" alt="Loading..." style={{ display: 'block', margin: 'auto' }} unoptimized />;
  
  if (useResponsive) {
    return (
      <div style={{ textAlign: 'center', margin: '1rem auto', maxWidth: '720px' }}>
        {spinner}
        <div style={{ position: 'relative', paddingBottom: isYouTube ? '56.25%' : '55.56%', height: 0, display: isLoaded ? 'block' : 'none' }}>
          <iframe ref={iframeRef} id={id} className={className} src={src} title={title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            onLoad={() => setIsLoaded(true)} allow={allow} allowFullScreen={allowFullScreen} {...(scrolling && { scrolling })} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', margin: '1rem auto', maxWidth: width }}>
      {spinner}
      <iframe ref={iframeRef} id={id} className={className} src={src} title={title} width="100%" height={height}
        style={{ display: isLoaded ? 'block' : 'none', border: 0, margin: 'auto', minHeight: height }}
        onLoad={() => setIsLoaded(true)} allow={allow} allowFullScreen={allowFullScreen} {...(scrolling && { scrolling })} />
    </div>
  );
}
