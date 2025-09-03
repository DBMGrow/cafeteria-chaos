import express from "express"
import CodedError from "@/lib/CodedError"
import Router from "../../../lib/router"
import { RecaptchaV2 } from "express-recaptcha/dist"

// const recaptchaRouter = new Router()
const recaptchaRouter = express()

const { RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY } = process.env

// Initialize reCAPTCHA (v2 checkbox)
if (!RECAPTCHA_SITE_KEY || !RECAPTCHA_SECRET_KEY) {
  throw new Error("RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY must be defined in the environment variables.")
}

const recaptcha = new RecaptchaV2(RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY)

recaptchaRouter.post("/", recaptcha.middleware.verify, async (req, res) => {
  if (req.recaptcha?.error) {
    res.status(400).json({
      success: false,
      message: "reCAPTCHA verification failed",
      error: req.recaptcha.error,
      code: "RECAPTCHA|01",
    })
    return
  }

  res.cookie("recaptchaVerified", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({ message: "Human verified.", success: "success" })
})

export default recaptchaRouter
