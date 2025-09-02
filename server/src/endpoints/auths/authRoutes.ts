import { Router } from "express"
import loginRouter from "./login/routes"
import logoutRouter from "./logout/routes"
import recaptchaRouter from "./recaptcha/recaptcha.routes"

const authRoutes = Router()

authRoutes.use("/login", loginRouter.router)
authRoutes.use("/logout", logoutRouter.router)
authRoutes.use("/recaptcha", recaptchaRouter.router)

export default authRoutes