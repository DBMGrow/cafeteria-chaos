import Router from "../../lib/router"
import { db } from "../../lib/database"
import CodedError from "../../lib/CodedError"
import { v4 as uuid } from "uuid"
import { z } from "zod"
import { LocationSchema } from "./locations.schemas"
import { Locations } from "./locations.model"

const locationsRouter = new Router()

locationsRouter.get("/", {}, async (req, res) => {
  await req.getSession()
  const locations = await db
    .selectFrom("Locations")
    .innerJoin("Highscores", "Highscores.location_id", "Locations.location_id")
    .where("Locations.location_type", "=", "user")
    .select(["Locations.location_id", "Locations.name", "Locations.created_at", "Locations.updated_at", "Locations.location_type", "Locations.google_place_id"])
    .distinct()
    .execute()

  res.success(locations, "Locations retrieved successfully")
})

locationsRouter.get("/googlesearch", {}, async (req, res) => {
  await req.getSession()
  const { search } = req.query || {}

  const body = {
    input: search,
  }

  const resp = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": process.env.MAPS_API_KEY || "" },
    body: JSON.stringify(body),
  })

  if (!resp.ok) throw new CodedError("Places Search failed", 502, "LOC|01")

  const json = await resp.json()
  const results = (json.suggestions || []).map((s: any) => s.placePrediction).filter(Boolean)

  res.success(results, "Places Search successful")
})

locationsRouter.get("/session", {}, async (req, res) => {
  const session = await req.getSession()

  if (!session) {
    throw new CodedError("No session found", 401, "LOC|02")
  }

  const locationsList = await db.selectFrom("Locations").where("location_id", "=", session.location_id).selectAll().executeTakeFirst()

  if (!locationsList) throw new CodedError("Location not found", 404, "LOC|03")

  const recaptchaVerified = req.cookies?.recaptchaVerified === "true"
  const baseName = req.cookies?._baseName

  res.success({
    ...locationsList,
    name: baseName || locationsList.name, 
    password: "",
    recaptchaVerified
  }, "Session found")
})

locationsRouter.get("/:location_id", {}, async (req, res) => {
  await req.getSession()
  const location_id = req.params.location_id
  const locationsList = await db.selectFrom("Locations").where("location_id", "=", Number(location_id)).selectAll().executeTakeFirst()

  if (!locationsList) throw new CodedError("Location not found", 404, "LOC|04")
  locationsList.password = ""
  locationsList.api_key = ""

  res.success(locationsList, "Location found")
})

locationsRouter.post("/", {}, async (req, res) => {
  const session = await req.getSession()
  const locationsMethods = new Locations()

  // Check if user is admin
  if (session.location_type !== "admin") {
    throw new CodedError("Unauthorized - Admin access required", 403, "LOC|05")
  }

  const parsedBody = LocationSchema.parse(req.body)

  await locationsMethods.createLocation(parsedBody)

  res.success({ success: true, message: "Location added successfully" })
})

export default locationsRouter
