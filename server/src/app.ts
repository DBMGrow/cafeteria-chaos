import "dotenv/config"
import { db } from "./lib/database"
import express, { json } from "express"
import path from "path"
import locationsRouter from "./endpoints/locations/locations.routes"
import authRoutes from "./endpoints/auths/authRoutes"
import highscoresRouter from "./endpoints/highscores/highscores.routes"
import cookieParser from "cookie-parser"
import { sessionFromUrl } from "./lib/middleware"
import { RecaptchaV2 } from "express-recaptcha/dist"
import CodedError from "./lib/CodedError"

const app = express()

// // Define __dirname for ES modules
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

app.use(json())
app.use(cookieParser())
app.use(sessionFromUrl as express.RequestHandler)

const frontendLocation = path.join(__dirname, "..", "..", "frontend")
console.log(frontendLocation)
console.log(path.join(frontendLocation, "p5", "p5.js"))


app.get("/config.js", (_req, res) => {
  res.type("application/javascript")
  if (!process.env.RECAPTCHA_SITE_KEY) {
    throw new CodedError("RECAPTCHA_SITE_KEY must be defined in the environment variables.", 400, "Env|01")
  }
  
  res.send(`window.ENV = { RECAPTCHA_SITE_KEY: ${JSON.stringify(process.env.RECAPTCHA_SITE_KEY || "")} };`)
})

// Use the imported routes
app.use("/highscores", highscoresRouter.router)
app.use("/locations", locationsRouter.router)
app.use("/auth", authRoutes)

// serve files from /frontend
app.use("/", express.static(frontendLocation))

// serve index.html
app.get("/", async (req, res) => {
  res.sendFile(path.join(frontendLocation, "index.html"))
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
