import Router from "../../lib/router"
import { db } from "../../lib/database"

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
    const { email, name ,score } = req.body
    const emailExist = await db.selectFrom("Highscores").where("email", "=", email).selectAll().executeTakeFirst()

    if (emailExist?.email) {
      await db.updateTable("Highscores").set({ score, name }).where("email", "=", email).execute()
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
    res.status(500).send("Internal Server Error")
  }
})

export default highscoresRouter
