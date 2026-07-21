interface SectionPageProps {
  title: string
  description?: string
}

export function SectionPage({ title, description }: SectionPageProps) {
  return (
    <section>
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {description ??
          "Sección en preparación. El frontend BITAL fue inicializado correctamente."}
      </p>
    </section>
  )
}
