import CodedError from "./CodedError"
import { db } from "./database"
import Router, { ResponseMethods } from "./router"
import { NextFunction, Req, Res } from "./types"
import { normalizeQuery } from "./Utils"

// const ALLOWED_PLACE_IDS = ["production_global", "test"]

export const sessionFromUrl = async (req: Req, res: Res, next: NextFunction) => {
  try {
    // Only process GET requests to root path
    if (req.method !== "GET" || req.path !== "/") return next()

    const responseMethods = new ResponseMethods(req, res)

    const placeIdParam = normalizeQuery(req.query.lb)

    // No ?lb= parameter provided
    // Use default "base" location without Google validation
    if (!placeIdParam) {
      const baseLocation = await db
        .selectFrom("Locations")
        .selectAll()
        .where("Locations.google_place_id", "=", "base")
        .executeTakeFirst()

      if (baseLocation) {
        await responseMethods.addSession(baseLocation)
      } else {
        responseMethods.removeSession()
      }

      return next()
    }

    // ?lb=base provided - redirect to root without parameter
    if (placeIdParam === "base") {
      res.redirect("/");
      return;
    }

    //?lb=<location> parameter provided
    // First, check if location exists in database
    let location = await db
      .selectFrom("Locations")
      .selectAll()
      .where("Locations.google_place_id", "=", placeIdParam)
      .executeTakeFirst()

    // If found in DB, set session and continue
    if (location) {
      await responseMethods.addSession(location)
      return next()
    }

    // New Place ID (not in DB)
    // Validate with Google Places API before allowing it
    const isValidPlaceId = await responseMethods.validPlaceId(placeIdParam)

    if (isValidPlaceId) {
      // Valid but new Place ID - set session to "base"
      const baseLocation = await db
        .selectFrom("Locations")
        .selectAll()
        .where("Locations.google_place_id", "=", "base")
        .executeTakeFirst()

      if (baseLocation) {
        await responseMethods.addSession(baseLocation, isValidPlaceId.formattedAddress)
      } else {
        responseMethods.removeSession()
      }
    } else {
      // Invalid Place ID - remove session
      responseMethods.removeSession()
    }

    return next()
  } catch (err) {
    return next(err)
  }
}
