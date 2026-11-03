// Outgoing email. On the live server mail goes out through the local MTA (cPanel Exim via
// /usr/sbin/sendmail) as support@mykuchupuchu.com — SPF/DKIM are set up for the domain, and no
// SMTP password lives in the app. Where no MTA exists (local dev), the message is only recorded in
// the admin Mail log.
import { spawn } from "child_process";
import { existsSync } from "fs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

const FROM_ADDRESS = process.env.MAIL_FROM || "support@mykuchupuchu.com";
const FROM_NAME = "Kuchu Puchu";
const SENDMAIL = ["/usr/sbin/sendmail", "/usr/lib/sendmail"].find(p => existsSync(p)) ?? null;

export function canSendMail() {
  return !!SENDMAIL && process.env.MAIL_DISABLED !== "1";
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/.{76}/g, "$&\r\n");
const encodeHeader = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`);

/**
 * Send one email. `logBody` is what the admin Mail log stores (defaults to `text`) — pass a redacted
 * version for anything secret, e.g. one-time codes.
 */
export async function sendMail(opts: { to: string; subject: string; text: string; html?: string; logBody?: string }): Promise<{ sent: boolean }> {
  const sending = canSendMail();
  await db.mailLog.create({
    data: { toEmail: opts.to, subject: opts.subject, body: sending ? (opts.logBody ?? opts.text) : opts.text },
  }).catch(() => {});
  if (!sending) return { sent: false };

  const boundary = `kp_${randomBytes(8).toString("hex")}`;
  const headers = [
    `From: ${FROM_NAME} <${FROM_ADDRESS}>`,
    `To: ${opts.to}`,
    `Reply-To: ${FROM_ADDRESS}`,
    `Subject: ${encodeHeader(opts.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomBytes(12).toString("hex")}@mykuchupuchu.com>`,
    "MIME-Version: 1.0",
    "Auto-Submitted: auto-generated",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const parts = [
    `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(opts.text)}`,
    ...(opts.html ? [`--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(opts.html)}`] : []),
    `--${boundary}--`,
  ];
  const message = `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}\r\n`;

  return new Promise(resolve => {
    const p = spawn(SENDMAIL!, ["-t", "-i", "-f", FROM_ADDRESS], { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", d => { err += String(d); });
    p.on("error", e => { console.error("sendmail failed:", e.message); resolve({ sent: false }); });
    p.on("close", code => {
      if (code !== 0) console.error(`sendmail exited ${code}: ${err.slice(0, 300)}`);
      resolve({ sent: code === 0 });
    });
    p.stdin.end(message);
  });
}
