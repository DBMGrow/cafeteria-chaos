import { db } from "../../../lib/database"
import CodedError from "../../../lib/CodedError"
import Router from "@/lib/router"

const loginRouter = new Router()

loginRouter.post("/", {}, async (req, res) => {
  try {
    const { name, password } = req.body ?? {}

    const location = await db.selectFrom("Locations").where("name", "=", name).selectAll().executeTakeFirst()

    if (!location) throw new CodedError("User not found", 404, "AUTH|01")
    console.log(typeof location.password, typeof password)
    if (location.password !== password) throw new CodedError("Incorrect password", 401, "AUTH|02")

    await res.addSession(location)
    res.success("Login successful...")
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

// loginRouter.post("/", async (req, res) => {
// try {
//     const body = req.body
//     console.log(body)
//     await db.insertInto("Highscores").values(body).execute()

//     res.status(200).json({ success: true, message: "Highscore added successfully" });
// } catch (error) {
//     console.error(error)
//     res.status(500).send("Internal Server Error")
// }
// })

export default loginRouter
