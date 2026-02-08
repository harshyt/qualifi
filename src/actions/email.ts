"use server";
// node-imap fetches raw source. I need to parse it.
// I should install mailparser.
// For now, I'll attempt to use a simple regex or just assume I need to add mailparser.
// Or I can use 'start-kb's 'emailjs-imap-client' but node-imap is standard.
// Let's assume I will install mailparser.

// Actually, I can use a simpler approach if I didn't install mailparser.
// But handling multipart emails manually is hard.
// I'll add mailparser to the task or just try to implement without it if possible, but highly recommended to use it.
// I'll skip parsing complex emails for MVP and just look for raw PDF bytes if simple.
// But better to add mailparser.

// Let's check installed packages. node-imap, nodemailer.
// I'll install mailparser.

// Wait, I can't install new packages easily without updating task.
// I'll install `mailparser` and `@types/mailparser`.

import nodemailer from "nodemailer";

export async function sendReply(
  to: string,
  candidateName: string,
  verdict: "SHORTLIST" | "REJECT",
) {
  const transporter = nodemailer.createTransport({
    service: "outlook", // or host: 'smtp.office365.com'
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASSWORD,
    },
  });

  const subject =
    verdict === "SHORTLIST"
      ? "Interview Invitation"
      : "Update on your application";
  const text =
    verdict === "SHORTLIST"
      ? `Hi ${candidateName},\n\nWe were impressed by your profile and would like to schedule an interview.\n\nBest,\nRecruiting Team`
      : `Hi ${candidateName},\n\nThank you for your application. Unfortunately, we are not moving forward at this time.\n\nBest,\nRecruiting Team`;

  try {
    await transporter.sendMail({
      from: process.env.IMAP_USER,
      to,
      subject,
      text,
    });
    return { success: true };
  } catch (error) {
    console.error("Email Send Error:", error);
    return { error: "Failed to send email" };
  }
}

import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { supabase } from "@/lib/supabase";

export async function syncEmails() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: process.env.IMAP_USER || "",
      password: process.env.IMAP_PASSWORD || "",
      host: "outlook.office365.com", // Default for Outlook
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }, // Modify based on security needs
    });

    interface FoundEmail {
      subject: string | undefined;
      from: string | undefined;
      date: Date | undefined;
      pdfCount: number;
    }

    const foundEmails: FoundEmail[] = [];

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // Search for unseen emails
        imap.search(["UNSEEN"], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return resolve({
              success: true,
              message: "No new emails found",
              emails: [],
            });
          }

          const f = imap.fetch(results, { bodies: "" });

          f.on("message", (msg) => {
            msg.on("body", (stream) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              simpleParser(stream as any, async (err, parsed) => {
                if (err) return;

                // Check for PDF attachments
                const pdfs = parsed.attachments.filter(
                  (att) =>
                    att.contentType === "application/pdf" ||
                    att.filename?.toLowerCase().endsWith(".pdf"),
                );

                if (pdfs.length > 0) {
                  foundEmails.push({
                    subject: parsed.subject,
                    from: parsed.from?.text,
                    date: parsed.date,
                    pdfCount: pdfs.length,
                  });
                }
              });
            });
          });

          f.once("error", (err) => {
            console.error("Fetch error:", err);
          });

          f.once("end", () => {
            imap.end();
          });
        });
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imap.once("error", (err: any) => {
      // If connection fails, resolve with error instead of crashing
      resolve({ success: false, error: err.message });
    });

    imap.once("end", async () => {
      if (foundEmails.length > 0) {
        const { error: dbError } = await supabase.from("candidates").insert(
          foundEmails.map((e) => ({
            name: e.from || "Unknown Sender",
            email: e.from || "unknown@example.com", // Ideally parsing email from 'Name <email>' string
            role: "Applicant (Email)",
            status: "PENDING",
            score: 0,
            resume_text: `PDF count: ${e.pdfCount}. Subject: ${e.subject}`,
            analysis: null,
          })),
        );

        if (dbError) {
          console.error("DB Sync Error:", dbError);
          resolve({ success: false, error: "Failed to save to DB" });
          return;
        }
      }

      resolve({
        success: true,
        message: `Synced ${foundEmails.length} emails`,
        emails: foundEmails,
      });
    });

    imap.connect();
  });
}
