import Router from "../../lib/router"
import { db } from "../../lib/database"
import CodedError from "../../lib/CodedError"
import { LocationSchema } from "./locations.schemas"
import { Locations } from "./locations.model"

const locationsRouter = new Router()

locationsRouter.get("/", {}, async (req, res) => {
  await req.getSession()
  const locations = await db
    .selectFrom("Locations")
    .innerJoin("Highscores", "Highscores.location_id", "Locations.location_id")
    .where("Locations.location_type", "=", "user")
    .select([
      "Locations.location_id",
      "Locations.name",
      "Locations.created_at",
      "Locations.updated_at",
      "Locations.location_type",
      "Locations.google_place_id",
    ])
    .distinct()
    .execute()

  res.success(locations, "Locations retrieved successfully")
})

locationsRouter.get("/googlesearch", {}, async (req, res) => {
  await req.getSession()
  const { search } = req.query || {}

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json")
  url.searchParams.append("input", String(search || ""))
  url.searchParams.append("key", process.env.MAPS_API_KEY || "")

  const resp = await fetch(url.toString(), {
    method: "GET",
  })

  if (!resp.ok) {
    const errorText = await resp.text()
    console.error("Places API Error:", resp.status, errorText)
    throw new CodedError("Places Search failed", 502, "LOC|01")
  }

  const json = await resp.json()

  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    console.error("Places API Response Error:", json)
    throw new CodedError(`Places API Error: ${json.error_message}`, 502, "LOC|01")
  }

  // Map the old API format (predictions) to match the new API format that your frontend expects
  const results = (json.predictions || []).map((p: any) => ({
    placeId: p.place_id,
    structuredFormat: {
      mainText: { text: p.structured_formatting.main_text },
      secondaryText: { text: p.structured_formatting.secondary_text },
    },
  }))

  // console.log("Places API results:", results)
  res.success(results, "Places Search successful")
})

locationsRouter.get("/session", {}, async (req, res) => {
  const session = await req.getSession()
  const locationsMethods = new Locations()

  if (!session) {
    throw new CodedError("No session found", 401, "LOC|02")
  }

  const location = await locationsMethods.getLocationById(Number(session.location_id))

  if (!location) throw new CodedError("Location not found", 404, "LOC|03")

  const recaptchaVerified = req.cookies?.recaptchaVerified === "true"
  const baseName = req.cookies?._baseName

  res.success(
    {
      ...location,
      name: baseName || location.name,
      password: "",
      recaptchaVerified,
    },
    "Session found"
  )
})

locationsRouter.get("/:location_id", {}, async (req, res) => {
  await req.getSession()
  const locationsMethods = new Locations()
  const location_id = req.params.location_id

  const location = await locationsMethods.getLocationById(Number(location_id))

  if (!location) throw new CodedError("Location not found", 404, "LOC|04")

  res.success({ ...location, password: "", api_key: "" }, "Location found")
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
