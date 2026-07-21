import http from "node:http"

const PORT = Number(process.env.PORT ?? 3000)

const server = http.createServer((_req, res) => {
  res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" })
  res.end(
    JSON.stringify({
      mensaje: "BITAL API — pendiente de implementación",
    }),
  )
})

server.listen(PORT, () => {
  console.log(`[BITAL Backend] http://localhost:${PORT}`)
})
