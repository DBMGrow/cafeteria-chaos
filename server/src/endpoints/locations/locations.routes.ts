import Router from "../../lib/router"
import { db } from "../../lib/database"
import CodedError from "../../lib/CodedError"
import { v4 as uuid } from "uuid"
import { z } from "zod"

const locationsRouter = new Router()

locationsRouter.get("/", {}, async (req, res) => {
  await req.getSession()
  const locationsList = await db
    .selectFrom("Locations")
    .where("Locations.location_type", "=", "user")
    .select(["location_id", "name", "created_at", "updated_at", "location_type", "google_place_id"])
    .execute()

  res.success(locationsList, "Locations retrieved successfully")
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
  locationsList.password = ""

  res.success({ ...locationsList, recaptchaVerified }, "Session found")
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

  // Check if user is admin
  if (session.location_type !== "admin") {
    throw new CodedError("Unauthorized - Admin access required", 403, "LOC|05")
  }

  const data = req.body

  const newLocationData = {
    ...data,
    api_key: uuid(),
  }

  // Check if location already exists
  const locationsExist = await db
    .selectFrom("Locations")
    .where("google_place_id", "=", newLocationData.google_place_id)
    .where("Locations.name", "=", newLocationData.name)
    .selectAll()
    .executeTakeFirst()

  if (locationsExist) {
    return res.status(200).success({ success: true, message: "Location already exists" })
  }

  await db.insertInto("Locations").values(newLocationData).execute()

  res.success({ success: true, message: "Location added successfully" })
})

export default locationsRouter
