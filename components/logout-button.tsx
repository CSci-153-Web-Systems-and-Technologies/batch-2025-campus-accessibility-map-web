"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear remember_me cookie on logout
    document.cookie = `remember_me=; path=/; max-age=0`;
    router.push("/login");
  };

  return <Button onClick={logout}>Logout</Button>;
}
