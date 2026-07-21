import { MainLayout } from "@/components/layout/MainLayout"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { resolverModuloActivo } from "@/lib/modulos"

export function AdminLayout() {
  const { usuario } = useAuth()
  const module = resolverModuloActivo(usuario)

  return <MainLayout module={module} />
}
