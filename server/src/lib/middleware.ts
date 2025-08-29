
import CodedError from "./CodedError"
import { db } from "./database"
import Router, { ResponseMethods } from "./router"
import { NextFunction, Req, Res } from "./types"

export const sessionFromUrl = async (req: Req, res: Res, next: NextFunction)  => {
  const code = String(req.query.code)
  const responseMethods = new ResponseMethods(req, res)
  if (!code) return next()

  // Find location by code
  const location = await db
    .selectFrom("Locations")
    .selectAll()
    .where("Locations.name", "=", code)
    .executeTakeFirst()

  if (location) {

    await responseMethods.addSession(location)
    req.user = location
  }

  next()
}
