import Router from "../../lib/router"
import { db } from "../../lib/database"
import { HighscoresSchema } from "./highscores.schemas"
import axios from "axios"
import { z } from "zod"
import { v4 as uuid } from "uuid"
import { normalizeQuery } from "../../lib/Utils"
import CodedError from "../../lib/CodedError"
import { LocationSchema } from "../locations/locations.schemas"
import { Locations } from "../locations/locations.model"
import { validatePlaceId } from "../../lib/googlePlaces"

const highscoresRouter = new Router()

highscoresRouter.get("/", {}, async (req, res) => {
  const session = await req.getSession()
  const highscoresList = await db
    .selectFrom("Highscores")
    .where("Highscores.location_id", "=", session.location_id)
    .orderBy("Highscores.score", "desc")
    .selectAll()
    .limit(10)
    .execute()

  res.success(highscoresList, "Highscores retrieved successfully")
})

highscoresRouter.post("/reset", {}, async (req, res) => {
  const session = await req.getSession()
  const { password } = req.body

  if (session.password !== password) {
    throw new CodedError("Invalid password", 401, "highscores|reset|01")
  }

  const location = await db.selectFrom("Locations").where("password", "=", password).selectAll().executeTakeFirstOrThrow()

  if (!location) {
    throw new CodedError("No location found", 401, "highscores|reset|02")
  }

  await db.deleteFrom("Highscores").execute()

  res.success({ success: true, message: "Highscore reset successfully" })
})

highscoresRouter.post("/", {}, async (req, res) => {
  let session = await req.getSession()
  const locationsMethods = new Locations()
  // Validate the request body using the schema
  const parsedBody = HighscoresSchema.parse(req.body)

  const { email, first_name, last_name, score } = parsedBody
  const placeId = normalizeQuery(req.query.placeId)

  const body = {
    email,
    first_name,
    last_name,
    score,
    location_id: session.location_id,
  }

  let location_name = session.name

  // Check if user is submitting with a new/different location
  if (placeId && placeId !== session.google_place_id) {
    const placeIdValidated = await validatePlaceId(String(placeId))

    if (!placeIdValidated) {
      throw new CodedError("Invalid google place location", 400, "highscores|01")
    }

    const newLocationData = LocationSchema.parse({
      name: placeIdValidated?.formattedAddress,
      password: "12345",
      location_type: "user" as const,
      google_place_id: placeIdValidated?.id,
    })

    const insertedLocation = await locationsMethods.createLocation(newLocationData)

    if (!insertedLocation) throw new CodedError("Failed to create location", 500, "highscores|02")

    const newLocation = await locationsMethods.getLocationById(Number(insertedLocation.insertId))

    if (!newLocation) throw new CodedError("Failed to retrieve new location", 500, "highscores|03")

    res.addSession(newLocation)
    location_name = newLocation.name

    body.location_id = newLocation.location_id
  }

  // Check if email already exists for this location
  const emailExist = await db
    .selectFrom("Highscores")
    .where("email", "=", email)
    .where("location_id", "=", body.location_id)
    .selectAll()
    .executeTakeFirst()

  if (emailExist) {
    // Update existing highscore
    await db
      .updateTable("Highscores")
      .set({ score, first_name, last_name })
      .where("email", "=", email)
      .where("location_id", "=", body.location_id)
      .execute()

    if (process.env.MODE === "production") {
      const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL ?? ""
      await axios.post(zapierWebhookUrl, { ...body, location_name })
    }

    return res.status(200).success({ success: true, message: "Highscore updated successfully" })
  }

  // Insert new highscore
  await db.insertInto("Highscores").values(body).onDuplicateKeyUpdate({ score, first_name, last_name }).execute()

  // Send new high score to Zapier in production
  if (process.env.MODE === "production") {
    const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL ?? ""
    await axios.post(zapierWebhookUrl, { ...body, location_name })
  }

  res.status(200).success({ success: true, message: "Highscore added successfully" })
})

export default highscoresRouter
