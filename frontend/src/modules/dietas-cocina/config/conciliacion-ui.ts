/** Etiquetas de filtros de conciliación (sistema vs planilla FCR). */
export const CONCILIACION_FILTROS_UI = {
  rangoPlaceholder: "Seleccionar periodo",
  facturaPlaceholder: "Nº factura (opcional)",
  busquedaPlaceholder: "Buscar línea FCR o comida...",
  /** Oculto hasta definir formato de planilla y flujo de factura. */
  mostrarCargaPlanilla: false,
  mostrarAdjuntarFactura: false,
  estados: [
    { value: "todos", label: "Todos los estados" },
    { value: "coincide", label: "Coincide" },
    { value: "con-diferencia", label: "Con diferencia" },
    { value: "pendiente", label: "Planilla pendiente" },
    { value: "conciliado", label: "Conciliado" },
  ],
}
