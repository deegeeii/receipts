import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./_components/Sidebar";
import TimezoneSync from "./_components/TimezoneSync";


// ShellLayout — wraps authenticated pages with the persistent sidebar
export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <TimezoneSync />
      <Sidebar />
      <div className="flex-1 pb-16 md:pb-0">
        {children}
      </div>

    </div>
  );

}
