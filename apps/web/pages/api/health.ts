import type { NextApiRequest, NextApiResponse } from "next";

/** Deliberately avoids authentication and database access for container probes. */
export default function health(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ status: "ok" });
}
