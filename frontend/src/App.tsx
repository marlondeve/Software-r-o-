import { RouterProvider } from "react-router-dom"

import { router } from "@/app/router"
import { AuthProvider } from "@/features/autenticacion/context/AuthProvider"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </AuthProvider>
  )
}

export default App
