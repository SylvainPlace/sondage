import { NextRequest, NextResponse } from "next/server";

import { getWhitelist } from "@/lib/google-auth";
import { signUserToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const GLOBAL_PASSWORD = process.env.GLOBAL_PASSWORD;
    const GCP_SERVICE_ACCOUNT_EMAIL = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
    const GCP_PRIVATE_KEY = process.env.GCP_PRIVATE_KEY;
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

    if (!GLOBAL_PASSWORD || !GCP_SERVICE_ACCOUNT_EMAIL || !GCP_PRIVATE_KEY || !SPREADSHEET_ID) {
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    if (password !== GLOBAL_PASSWORD) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const whitelist = await getWhitelist({
        GCP_SERVICE_ACCOUNT_EMAIL,
        GCP_PRIVATE_KEY,
        SPREADSHEET_ID,
    });

    if (!whitelist.includes(email.toLowerCase().trim())) {
      return NextResponse.json(
        {
          error:
            "Email non autorisé. Utilisez l'adresse de votre inscription à l'association. En cas d'oubli, contactez un administrateur.",
        },
        { status: 403 },
      );
    }

    const token = await signUserToken(email);

    return NextResponse.json({ token });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
  }
}
