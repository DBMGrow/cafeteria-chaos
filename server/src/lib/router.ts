import express, { NextFunction } from "express"
import CodedError from "../lib/CodedError"
import { CookieOptions, Req, Res, Session, PagesResponse, LogConfig, LogMessage } from "../lib/types"
// import { CookieOptions, Request, Response } from "express"
import { db } from "../lib/database"
import z, { ZodError } from "zod"
import { Selectable } from "kysely"
import { DB } from "./db"

type Method = "get" | "post" | "put" | "patch" | "delete"
export type Handler = (req: Req, res: Res, next: NextFunction) => Promise<void>

interface RouteConfigOptions {}

export class RequestMethods {
  req: Req
  res: Res

  constructor(req: Req, res: Res) {
    this.req = req
    this.res = res
  }

  async getSession(): Promise<Selectable<DB["Locations"]>> {
    // if (this.req.user) return this.req.user
    const _api_key = this.req.cookies._api_key || this.req.headers["_api_key"]
    if (!_api_key) throw new CodedError("Unauthorized", 401, "REQ|01")

    const location = await db.selectFrom("Locations").where("api_key", "=", _api_key).selectAll().executeTakeFirst()

    if (!location) throw new CodedError("Invalid API token", 401, "REQ|01")

    return location
  }

  /**
   * Used to set the current session to the system. Used by webhooks and other system level requests.
   */
  //   async setSystemSession() {
  //     const user = await db.selectFrom("Users").where("Users.user_id", "=", 3).selectAll().executeTakeFirst()
  //     if (!user) throw new CodedError("System user not found", 500, "REQ|02")

  //     this.req.user = user
  //   }
}

export class ResponseMethods {
  req: Req
  res: Res

  constructor(req: Req, res: Res) {
    this.req = req
    this.res = res
  }

  success = <T>(data: T, message: string = "Success", pages?: PagesResponse, flattenBody?: boolean) => {
    let responseBody: any = {
      data,
      message,
      pages,
      success: "success",
      digest_id: this.req.digest_id,
    }

    if (flattenBody) {
      responseBody = {
        message,
        success: "success",
        digest_id: this.req.digest_id,
        ...data,
      }
    }

    this.res //
      .status(200)
      .json(responseBody)
      .end()
  }

  error(error: Error) {
    console.error("an error has occurred: ", error)

    let status = 500
    if (error instanceof CodedError) status = error.code
    this.res
      .status(status ?? 500)
      .json({
        success: false,
        error: error.message,
        digest_id: this.req.digest_id,
      })
      .end()

    console.error("an error has occurred: ", error.message)
  }

  async addSession(location: Selectable<DB["Locations"]>): Promise<void> {
    const query = await db
      .selectFrom("Locations")
      .where("location_id", "=", location.location_id)
      .select(["name", "api_key", "location_id", "location_type"])
      .executeTakeFirst()

    const cookieOptions: CookieOptions = {
      domain: process.env.BASE_URL ?? "localhost",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
      httpOnly: true,
      secure: process.env.APP_ENV === "production",
      sameSite: "strict",
    }

    this.res.cookie("_api_key", query?.api_key, cookieOptions)
    this.res.cookie("_name", query?.name, cookieOptions)
    this.res.cookie("_locationType", query?.location_type, cookieOptions)
    this.res.cookie("_locationID", query?.location_id, cookieOptions)
  }

  removeSession() {
    const cookieOptions: CookieOptions = {
      domain: process.env.BASE_URL ?? "localhost",
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: process.env.APP_ENV === "production",
      sameSite: "strict",
    }

    this.res.cookie("_api_key", "", cookieOptions)
    this.res.cookie("_name", "", cookieOptions)  
    this.res.cookie("_locationType", "", cookieOptions) 
    this.res.cookie("_locationID", "", cookieOptions)  
  }
}

class Router {
  router: express.Router
  app: express.Application

  constructor() {
    this.router = express.Router()
    this.app = express()
  }

  route(method: Method, path: string, config: RouteConfigOptions, ...handlers: Handler[]) {
    const wrappedHandlers = handlers.map((handler) => async (req: Req, res: Res, next: NextFunction) => {
      const requestMethods = new RequestMethods(req, res)
      const responseMethods = new ResponseMethods(req, res)

      try {
        req.getSession = requestMethods.getSession.bind(requestMethods)

        res.success = responseMethods.success.bind(responseMethods)
        res.error = responseMethods.error.bind(responseMethods)
        res.addSession = responseMethods.addSession.bind(responseMethods)
        res.removeSession = responseMethods.removeSession.bind(responseMethods)

        await handler(req, res, next)
      } catch (error: any) {
        responseMethods.error(error)
      }
    })

    return this.router[method](path, ...(wrappedHandlers as any))
  }

  get(path: string, config: {}, ...handlers: Handler[]) {
    this.route("get", path, config, ...handlers)
  }

  post(path: string, config: {}, ...handlers: Handler[]) {
    this.route("post", path, config, ...handlers)
  }

  put(path: string, config: {}, ...handlers: Handler[]) {
    this.route("put", path, config, ...handlers)
  }

  patch(path: string, config: {}, ...handlers: Handler[]) {
    this.route("patch", path, config, ...handlers)
  }

  delete(path: string, config: {}, ...handlers: Handler[]) {
    this.route("delete", path, config, ...handlers)
  }
}

export default Router
