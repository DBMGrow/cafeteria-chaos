import Router from "../../lib/router"
import { db } from "../../lib/database"
import { HighscoresSchema } from "./highscores.schemas"
import axios from "axios";
import { z } from "zod"

const highscoresRouter = new Router()

highscoresRouter.get("/", {}, async (req, res) => {
  try {
    const session = await req.getSession()
    const highscoresList = await db
      .selectFrom("Highscores")
      .where("Highscores.location_id", "=", session.location_id)
      .orderBy("Highscores.score", "desc")
      .selectAll()
      .limit(10)
      .execute()
    res.json(highscoresList)
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

highscoresRouter.post("/reset", {}, async (req, res) => {
  try {
    const session = await req.getSession()
    const { password } = req.body

    if (session.password !== password) {
      return res.status(401).success({ success: false, message: "Invalid password" })
    }

    const location = await db.selectFrom("Locations").where("password", "=", password).selectAll().executeTakeFirstOrThrow()

    if (!location) {
      return res.status(401).success({ success: false, message: "No lacotion found" })
    }

    await db.deleteFrom("Highscores").execute()

    res.status(200).json({ success: true, message: "Highscore reset successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

highscoresRouter.post("/", {}, async (req, res) => {
  try {
    const session = await req.getSession()
    // Validate the request body using the schema
    const parsedBody = HighscoresSchema.parse(req.body)

    const { email, first_name, last_name, score } = parsedBody

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

    // Send the new high score to Zapier
    if(session.name !== "test") {
      const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL ?? "";
      await axios.post(zapierWebhookUrl, body);
      }

    res.status(200).success({ success: true, message: "Highscore added successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
})

export default highscoresRouter
