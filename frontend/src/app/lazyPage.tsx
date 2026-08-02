import { lazy, Suspense, type ComponentType } from "react"

export function lazyPage(
  factory: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
  Fallback: ComponentType,
) {
  const Lazy = lazy(factory)
  return function LazyPage(props: Record<string, unknown>) {
    return (
      <Suspense fallback={<Fallback />}>
        <Lazy {...props} />
      </Suspense>
    )
  }
}
