import Router from "../../lib/router"
import { db } from "../../lib/database"
import CodedError from "../../lib/CodedError"

const locationsRouter = new Router()

locationsRouter.get("/", {}, async (req, res) => {
    const locationsList = await db.selectFrom("Locations").selectAll().execute()

    res.success(locationsList, "Locations retrieved successfully")
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

export default locationsRouter
