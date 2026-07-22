import { useState } from "react"
import { Outlet } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  type ModuleType,
} from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface MainLayoutProps {
  module: ModuleType
}

export function MainLayout({ module }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar module={module} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="flex h-full flex-col gap-0 overflow-hidden border-r p-0"
          style={{ width: "min(100vw, var(--sidebar-width))", maxWidth: "var(--sidebar-width)" }}
        >
          <SidebarContent
            module={module}
            className="w-full"
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar module={module} onMenuClick={() => setMobileOpen(true)} />
        <ScrollAreaFlex>
          <main className="p-3 md:p-4 lg:p-5">
            <Outlet />
          </main>
        </ScrollAreaFlex>
      </div>
    </div>
  )
}
