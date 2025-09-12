import CodedError from "./CodedError"
import { db } from "./database"
import Router, { ResponseMethods } from "./router"
import { NextFunction, Req, Res } from "./types"
import { normalizeQuery } from "./Utils"

const ALLOWED_PLACE_IDS = ["production_global", "test"]

export const sessionFromUrl = async (req: Req, res: Res, next: NextFunction) => {
  try {
    if (req.method !== "GET" || req.path !== "/") return next()

    const responseMethods = new ResponseMethods(req, res)

    // Safely read ?lb=... (handle array case from query parsers)
    let locationsName = normalizeQuery(req.query.lb)

    if (!locationsName) {
      if (process.env.MODE === "production") {
        locationsName = "production_global"
      } else {
        locationsName = "test"
      }
    }

    let location = await db.selectFrom("Locations").selectAll().where("Locations.google_place_id", "=", locationsName).executeTakeFirst()

    if (!location && !ALLOWED_PLACE_IDS.includes(locationsName)) {
      const googlePlace = await responseMethods.validPlaceId(locationsName)

      if (!googlePlace) {
        // Invalid Place ID and not in DB
        responseMethods.removeSession()
        return next()
      }
    }


    //if location is not found, fallback to 'base' location
    if (!location && locationsName !== "production_global" && locationsName !== "test") {
      location = await db.selectFrom("Locations").selectAll().where("Locations.google_place_id", "=", "base").executeTakeFirst()
    }

    if (location) {
      await responseMethods.addSession(location)
    } else {
      responseMethods.removeSession();
    }

    return next()
  } catch (err) {
    return next(err)
  }
}
