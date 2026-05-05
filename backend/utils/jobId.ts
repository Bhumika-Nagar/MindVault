import crypto from "crypto";

export const generateJobId = (url: string) => {
  return crypto.createHash("sha256").update(url).digest("hex");
};