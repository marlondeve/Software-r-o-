import type { ReactNode } from "react"

interface PageLoadingGateProps {
  loading: boolean
  skeleton: ReactNode
  children: ReactNode
}

export function PageLoadingGate({
  loading,
  skeleton,
  children,
}: PageLoadingGateProps) {
  if (loading) return skeleton
  return children
}
