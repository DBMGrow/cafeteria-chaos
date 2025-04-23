import Router from "../../lib/router"
import { db } from "../../lib/database"
import CodedError from "../../lib/CodedError"

const locationsRouter = new Router()

locationsRouter.get("/", {}, async (req, res) => {
  try {
    const locationsList = await db.selectFrom("Locations").selectAll().execute()
    res.json(locationsList)
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

locationsRouter.get("/session", {}, async (req, res) => {
  try {
    const session = await req.getSession()

    if (!session) {
      res.success({ success: false, message: "No session found" })
      return
    }

    const locationsList = await db.selectFrom("Locations").where("location_id", "=", session.location_id).selectAll().executeTakeFirst()

    if (!locationsList) throw new CodedError("Location not found", 404, "LOC|02")

    res.success({ success: true, message: "Session found" })
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})
locationsRouter.get("/:location_id", {}, async (req, res) => {
  try {
    const location_id = req.params.location_id
    const locationsList = await db.selectFrom("Locations").where("location_id", "=", Number(location_id)).selectAll().executeTakeFirst()

    if (!locationsList) throw new CodedError("Location not found", 404, "LOC|03")

    res.json(locationsList)
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

export default locationsRouter
