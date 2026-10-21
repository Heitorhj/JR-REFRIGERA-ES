import { Router } from "express";

import loginRequired from "../middleware/loginRequired.js";
import authController from "../controllers/authController.js";
import authValidator from "../validators/authValidator.js";

const router = Router();

router.post(
  "/login",
  authValidator.validarLogin,
  authController.login
);

router.get("/me", loginRequired, (req, res) => {
  res.json({ usuario: req.administrador });
});

export default router;