
import CodedError from "./CodedError";
import { db } from "./database"
import Router, { ResponseMethods } from "./router"
import { NextFunction, Req, Res } from "./types"
import { normalizeQuery } from "./Utils";

export const sessionFromUrl = async (req: Req, res: Res, next: NextFunction)  => {
  try {
  if (req.method !== 'GET' || req.path !== '/') return next();

  const responseMethods = new ResponseMethods(req, res);

  // Safely read ?lb=... (handle array case from query parsers)
  let locationsName = normalizeQuery(req.query.lb);


  if (!locationsName) {
    if (process.env.MODE === 'production') {
      locationsName = 'production_global';
    }else{
      locationsName = 'test';
    }
  }

  const isValidPlaceId = await responseMethods.validPlaceId(locationsName);

  if (!isValidPlaceId && locationsName !== 'production_global' && locationsName !== 'test') {
    responseMethods.removeSession();
    return next();
  }

    let location = await db
      .selectFrom('Locations')
      .selectAll()
      .where('Locations.google_place_id', '=', locationsName)
      .executeTakeFirst();

    //if location is not found, fallback to 'base' location
    if (!location && locationsName !== 'production_global' && locationsName !== 'test') {
      location = await db
        .selectFrom('Locations')
        .selectAll()
        .where('Locations.google_place_id', '=', 'base')
        .executeTakeFirst();
    }

    if (location) {
      await responseMethods.addSession(location);
    }
    
    return next();
  } catch (err) {
    return next(err);
  }
}
