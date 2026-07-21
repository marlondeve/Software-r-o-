import logoClinica from "@/assets/Logo-Clinica-del-Rio.png"
import { cn } from "@/lib/utils"

interface ClinicaLogoProps {
  className?: string
}

export function ClinicaLogo({ className }: ClinicaLogoProps) {
  return (
    <img
      src={logoClinica}
      alt="Clínica del Río"
      className={cn("h-8 w-auto", className)}
    />
  )
}
