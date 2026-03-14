import { SignJWT, importPKCS8 } from "jose";
import { GOOGLE_CONFIG } from "../config/googleConfig";
import { Job } from "./interfaces";

async function getAccessToken(): Promise<string> {
  const privateKey = await importPKCS8(
    GOOGLE_CONFIG.privateKey.replace(/\\n/g, "\n"),
    "RS256"
  );

  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/spreadsheets",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(GOOGLE_CONFIG.clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const { access_token } = await res.json();
  return access_token;
}

export async function addJob(job: Job): Promise<void> {
  const token = await getAccessToken();

  const row = [
    new Date().toLocaleDateString(),  // Date Applied
    job.title,
    job.company,
    job.location,
    job.link,
    job.status,
    job.employmentType,
    job.description,
    job.extraDetails,
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_CONFIG.spreadsheetId}/values/${GOOGLE_CONFIG.sheetName}!A1:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [row] }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Sheets API error: ${err.error.message}`);
  }
}