import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET deve conter pelo menos 32 caracteres."
  );
}

export default {
  jwtSecret
};