import { SidebarProvider } from "~/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import AppSidebar from "./app-sidebar";

type Props = {
  children: React.ReactNode;
};

export default function SidebarLayout({ children }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className=" w-full m-2">
        <div className="flex items-center gap-2 rounded-md  border-sidebar-border bg-sidebar border shadow p-2 px-4 ">
          {/* <SearchBar></SearchBar> */}
          <div className="ml-auto"></div>
          <UserButton></UserButton>
        </div>
        <div className="h-4"></div>
        {/* main content */}
        <div className="h-[calc(100vh-6rem)] overflow-y-scroll rounded-md border border-sidebar-border bg-sidebar shadow p-4">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
