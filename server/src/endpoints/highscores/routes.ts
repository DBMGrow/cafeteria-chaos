import Router from "../../lib/router"
import { db } from "../../lib/database"

const highscoresRouter = new Router()

highscoresRouter.get("/", {}, async (req, res) => {
  try {
    await req.getSession()
    const highscoresList = await db.selectFrom("Highscores").orderBy("Highscores.score", "desc").selectAll().limit(10).execute()
    res.json(highscoresList)
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

highscoresRouter.post("/", {}, async (req, res) => {
  try {
    const session = await req.getSession()
    const { email, score } = req.body
    const body = {
      email,
      score,
      location_id: session.location_id,
    }
    await db.insertInto("Highscores").values(body).execute()

    res.status(200).json({ success: true, message: "Highscore added successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

export default highscoresRouter
