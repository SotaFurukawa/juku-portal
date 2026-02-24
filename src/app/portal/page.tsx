// src/app/portal/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentGroups, isSignedIn } from "@/lib/authGroups";

export default function PortalRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const ok = await isSignedIn();
      if (!ok) {
        router.replace("/login");
        return;
      }

      const groups = await getCurrentGroups();
      if (groups.includes("teachers")) router.replace("/teacher/portal");
      else router.replace("/student/portal");
    })();
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center text-sm font-semibold text-gray-700">
      読み込み中...
    </div>
  );
}