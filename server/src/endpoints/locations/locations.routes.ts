import Router from "../../lib/router"
import { db } from "../../lib/database"
import CodedError from "../../lib/CodedError"
import { v4 as uuid } from "uuid"

const locationsRouter = new Router()

locationsRouter.get("/", {}, async (req, res) => {
  const locationsList = await db.selectFrom("Locations").where("Locations.location_type", "=", "user").select(["location_id","name","created_at", "updated_at", "location_type", "google_place_id"]).execute()

  if (!locationsList) throw new CodedError("No locations found", 404, "LOC|00")

  res.success(locationsList, "Locations retrieved successfully")
})

locationsRouter.get("/googlesearch", {}, async (req, res) => {
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
    res.success(session, "No session found")
    return
  }

  const locationsList = await db.selectFrom("Locations").where("location_id", "=", session.location_id).selectAll().executeTakeFirst()
  if (!locationsList) throw new CodedError("Location not found", 404, "LOC|02")
  locationsList.password = ""

  const recaptchaVerified = req.cookies?.recaptchaVerified === "true"

  res.success({ ...locationsList, recaptchaVerified }, "Session found")
})

locationsRouter.get("/:location_id", {}, async (req, res) => {
  const location_id = req.params.location_id
  const locationsList = await db.selectFrom("Locations").where("location_id", "=", Number(location_id)).selectAll().executeTakeFirst()

  if (!locationsList) throw new CodedError("Location not found", 404, "LOC|03")

  res.success(locationsList, "Location found")
})

locationsRouter.post("/", {}, async (req, res) => {
  try {
    // Validate the request body using the schema
    const data = req.body

    const newLocationData = {
      ...data,
      api_key: uuid(),
    }

    const locationsExist = await db.selectFrom("Locations").where("google_place_id", "=", newLocationData.google_place_id).where("Locations.name", "=", newLocationData.name).selectAll().executeTakeFirst()

    if (locationsExist) {
      return res.status(200).success({ success: true, message: "locations already exist" })
    }

    await db.insertInto("Locations").values(newLocationData).execute()

    res.status(200).success({ success: true, message: "Locations added successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
})

export default locationsRouter
