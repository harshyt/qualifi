"use server";
import { extractTextFromPDF } from "@/lib/pdf";
import { analyzeResume } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

export async function analyzeCandidateResume(formData: FormData) {
  const file = formData.get("resume") as File;
  const jobId = formData.get("jobId") as string;

  if (!file || !jobId) {
    return { error: "Missing file or jobId" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await extractTextFromPDF(buffer);

    const jd =
      "EXP. range - 4.5 to 8 years Proficient in React Native, JavaScript (ES6+), and TypeScript. Expertise in state management libraries (Redux, Zustand, etc.). Experience with React Query. Hands-on experience with react-navigation and deep linking. Solid understanding of Expo (both managed and bare workflows). Knowledge of native development (Swift/Objective-C for iOS, Java/Kotlin for Android). Experience with custom native module bridging and native UI integration. Strong debugging skills using tools like Flipper and Chrome DevTools. Familiarity with Jest, React Native Testing Library and E2E testing. Experience with REST APIs, GraphQL, and real-time data (WebSockets). Ability to manage OTA updates with EAS Update and configure EAS Build. Experience in app publishing and release lifecycle on both Play Store and App Store. Knowledge of secure storage, token handling, and app-level security practices."; // Mock JD

    const analysis = await analyzeResume(text, jd);
    if (!analysis) {
      return { error: "Analysis failed" };
    }

    const { data: candidate, error: dbError } = await supabase
      .from("candidates")
      .insert({
        name: analysis.name,
        email: analysis.email,
        phone: analysis.phone,
        role: analysis.role,
        status: "PENDING",
        score: analysis.score,
        resume_text: text,
        analysis: analysis,
      })
      .select()
      .single();

    if (dbError) {
      return { error: "Failed to save candidate to database" };
    }

    return { success: true, analysis, candidate };
  } catch (error) {
    return { error };
  }
}
