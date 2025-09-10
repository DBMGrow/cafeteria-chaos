import { Request, Response } from "express"
import CodedError from "./CodedError"


export default class Utils {
  req: Request
  res: Response

  constructor(req: Request, res: Response) {
    this.req = req
    this.res = res
  }

  success<Res>(data: Res, message?: string) {
    this.res.status(200).json({
      ...data,
      success: true,
      message: message || "Success",
    })
  }

  error(error: Error | CodedError) {
    let status = 500
    if (error instanceof CodedError) status = error.code
    this.res.status(status ?? 500).json({ success: false, error: error.message })
  }
}

/**
 * Normalizes a query string or array value from `req.query`.
 *
 * - Handles array query params by using the first value.
 * - Converts `null`, `undefined`, empty strings, and placeholder strings like
 *   `"null"` or `"undefined"` into an empty string `""`.
 * - Trims whitespace and lowercases checks for bad values.
 *
 * @param input The raw query value (could be string, string[], null, undefined)
 * @returns A normalized string, or empty string if it's invalid.
 */
export function normalizeQuery(input: unknown): string {
  // If it's an array (e.g. ?placeId=a&placeId=b), take the first
  const value = Array.isArray(input) ? input[0] : input;

  if (value == null) return "";

  const s = String(value).trim();

  // Treat common placeholders as "empty"
  const bad = new Set(["", "null", "undefined", "nan", "false"]);
  return bad.has(s.toLowerCase()) ? "" : s;
}
