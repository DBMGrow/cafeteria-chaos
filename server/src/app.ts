import "dotenv/config"
import express, { json } from "express"
import path from "path"
import { fileURLToPath } from "url"
import { existsSync } from "fs"

const app = express()

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(json())
app.get("/api", (req, res) => {
  res.send("Hello World!")
})

const frontendLocation = path.join(__dirname, "..", "..", "frontend")

console.log(frontendLocation)
console.log(path.join(frontendLocation, "p5", "p5.js"))
console.log(existsSync(path.join(frontendLocation, "p5", "p5.js")))

// serve files from /frontend
app.use("/", express.static(frontendLocation))

// serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendLocation, "index.html"))
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
