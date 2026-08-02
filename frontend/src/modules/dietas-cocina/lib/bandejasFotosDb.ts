const DB_NAME = "bital-bandejas-fotos"
const STORE = "fotos"
const DB_VERSION = 1

interface FotoRegistro {
  clientId: string
  blob: Blob
  nombre: string
  tipo: string
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () =>
      reject(request.error ?? new Error("No se pudo abrir IndexedDB"))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "clientId" })
      }
    }
  })
}

export async function guardarFotoDevolucionOffline(
  clientId: string,
  archivo: File,
): Promise<void> {
  const db = await abrirDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    const registro: FotoRegistro = {
      clientId,
      blob: archivo,
      nombre: archivo.name,
      tipo: archivo.type || "image/jpeg",
    }
    const request = tx.objectStore(STORE).put(registro)
    request.onerror = () =>
      reject(request.error ?? new Error("No se pudo guardar la foto"))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("Transacción fallida"))
  })
  db.close()
}

export async function leerFotoDevolucionOffline(
  clientId: string,
): Promise<File | null> {
  const db = await abrirDb()
  const registro = await new Promise<FotoRegistro | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const request = tx.objectStore(STORE).get(clientId)
    request.onerror = () =>
      reject(request.error ?? new Error("No se pudo leer la foto"))
    request.onsuccess = () => resolve(request.result as FotoRegistro | undefined)
  })
  db.close()

  if (!registro) return null
  return new File([registro.blob], registro.nombre, { type: registro.tipo })
}

export async function eliminarFotoDevolucionOffline(
  clientId: string,
): Promise<void> {
  const db = await abrirDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    const request = tx.objectStore(STORE).delete(clientId)
    request.onerror = () =>
      reject(request.error ?? new Error("No se pudo eliminar la foto"))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("Transacción fallida"))
  })
  db.close()
}
