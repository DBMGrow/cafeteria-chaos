import { Selectable } from "kysely"
import { Request, Response, CookieOptions as CO, NextFunction as NF } from "express"
import { z } from "zod"
import { Express } from "express"
import { DB } from "../lib/db"

export interface LogConfig {
  table_id?: number
  tablename?: keyof DB
  level?: string
}

export type LogMessage = string | object | null | undefined

export interface ValidateSchemaOptions {
  safeParse?: boolean
}

export interface PagesResponse {
  page: number
  limit: number
  count: number
}

export interface Req extends Request {
  json(arg0: { success: boolean }): unknown
  user?: Session
  caps?: string[]
  digest_id: string
  getSession: () => Promise<Session>
}
export type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never

export interface Res extends Response {
  success: <T>(data: T, message?: string, pages?: PagesResponse, flattenBody?: boolean) => void
  addSession: (user: Session) => Promise<void>
  removeSession: () => void
  validPlaceId: (placeId: string) => Promise<boolean | any>
  onFinish: (name: string, callback: () => Promise<void>) => Promise<void>
  log: (...args: [...message: LogMessage[], config: LogConfig]) => void
  _finishCallbacks: {
    cb: () => Promise<void>
    name: string
  }[]
  error: (error: Error) => void
  _finished: boolean
}
export interface CookieOptions extends CO {}
export interface NextFunction extends NF {}

export interface Session extends Selectable<DB["Locations"]> {}
