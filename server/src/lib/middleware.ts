
import { db } from "./database"
import Router, { ResponseMethods } from "./router"
import { NextFunction, Req, Res } from "./types"

export const sessionFromUrl = async (req: Req, res: Res, next: NextFunction)  => {
  if (req.method !== 'GET' || req.path !== '/') return next();

  const responseMethods = new ResponseMethods(req, res);

  // Safely read ?lb=... (handle array case from query parsers)
  const rawLb = Array.isArray((req as any).query?.lb) ? (req as any).query.lb[0] : (req as any).query?.lb;
  const locationsName = rawLb || 'test';

  console.log(`${locationsName} name`, rawLb || '(no lb)');

  try {
    const location = await db
      .selectFrom('Locations')
      .selectAll()
      .where('Locations.name', '=', locationsName)
      .executeTakeFirst();

    if (location) {
      await responseMethods.addSession(location);
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
