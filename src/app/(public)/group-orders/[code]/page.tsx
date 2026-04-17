"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyGroupOrdersRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  useEffect(() => {
    if (code) {
      router.replace(`/group-order/${code}`);
    }
  }, [code, router]);

  return null;
}
