"use client";

import { useEffect } from "react";

type Props = {
  className?: string;
  slot: string; // AdSense の ad slot（数字）
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
};

export default function AdsenseUnit({
  className,
  slot,
  format = "auto",
  responsive = true,
}: Props) {
  useEffect(() => {
    try {
      // 2回目以降の描画でも詰まらないように push を安全に呼ぶ
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // noop
    }
  }, []);

  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  // client/slot が無いときは何も出さない（ローカルでも安全）
  if (!client || !slot) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
