import Router from "../../lib/router"
import { db } from "../../lib/database"
import CodedError from "../../lib/CodedError"

const locationsRouter = new Router()

locationsRouter.get("/", {}, async (req, res) => {
    const locationsList = await db.selectFrom("Locations").selectAll().execute()

    res.success(locationsList, "Locations retrieved successfully")
})

locationsRouter.get("/googlesearch", {}, async (req, res) => {
  const { search } = req.query || {};

  const body = {
    input: search,
  };

  const resp = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type":"application/json", "X-Goog-Api-Key": process.env.MAPS_API_KEY || ""},
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new CodedError("Places Search failed", 502, "LOC|01");

  const json = await resp.json();
  const results = (json.suggestions || [])
    .map((s:any) => s.placePrediction)
    .filter(Boolean)

  res.success(results, "Places Search successful");
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

    const recaptchaVerified = req.cookies?.recaptchaVerified === "true";

    res.success({...locationsList, recaptchaVerified}, "Session found")
})

locationsRouter.get("/:location_id", {}, async (req, res) => {
    const location_id = req.params.location_id
    const locationsList = await db.selectFrom("Locations").where("location_id", "=", Number(location_id)).selectAll().executeTakeFirst()

    if (!locationsList) throw new CodedError("Location not found", 404, "LOC|03")

    res.success(locationsList, "Location found")
})

locationsRouter.post("/", {}, async (req, res) => {
  try {
    const session = await req.getSession()
    // Validate the request body using the schema
    const data = req.body

    const { email, first_name, last_name, score } = data

    if (!email || !first_name || !last_name || !score) {
      return res.status(400).success({ success: false, message: "Email, name, and score are required" })
    }

    const emailExist = await db.selectFrom("Highscores").where("email", "=", email).selectAll().executeTakeFirst()

    if (emailExist?.email) {
      await db.updateTable("Highscores").set({ score, first_name, last_name }).where("email", "=", email).execute()
      return res.status(200).success({ success: true, message: "Highscore updated successfully" })
    }

    const body = {
      ...req.body,
      location_id: session.location_id,
    }

    await db.insertInto("Highscores").values(body).execute()


    res.status(200).success({ success: true, message: "Highscore added successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
})

export default locationsRouter
