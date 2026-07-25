import { RouterProvider } from "react-router-dom"
import { Toaster } from "sileo"

import { router } from "@/app/router"
import { AuthProvider } from "@/features/autenticacion/context/AuthProvider"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster position="top-right" theme="system" />
        <RouterProvider router={router} />
      </TooltipProvider>
    </AuthProvider>
  )
}

export default App
