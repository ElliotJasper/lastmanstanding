"use client";

import Image from "next/image";
import { supabase } from "../../utils/supabase/client";
import { useEffect } from "react";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="intro">Hello</div>
    </main>
  );
}
