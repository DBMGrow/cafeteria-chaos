import { db } from "../../../lib/database"
import CodedError from "../../../lib/CodedError"
import LoginModel from "../login/model"
import Router from "../../../lib/router"

const logoutRouter = new Router()

logoutRouter.get("/", {}, async (req, res) => {
  try {
    res.removeSession()
    res.success({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

export default logoutRouter
