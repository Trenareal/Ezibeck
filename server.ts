import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client safely
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("GEMINI_API_KEY environment variable is not defined. Staff AI assistant will run in fallback simulation mode.");
  }

  // API Route FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiConfigured: !!apiKey });
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid request payload. 'messages' array is required." });
        return;
      }

      if (!ai) {
        res.json({
          text: "Hello! I am ready to assist you. *(Note: GEMINI_API_KEY is currently not defined in Secrets, so I am running in Offline Simulation Mode.)*\n\nHow can I help you navigate the rosters, edit scorecard reports, reset security passcodes, or customize the Workspace 15 properties today?"
        });
        return;
      }

      // Format custom messages from the frontend to the correct @google/genai structure
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text || m.content || "" }]
      }));

      const systemInstruction = 
        `You are the EZIBECK Academics AI Assistant, an elite, professional, and friendly coordinator helper. Your goal is to support the staff, educators, and administrators of Notion College / EZIBECK Academics in using their Workspace Desk.

Here is an overview of the platform functionalities and systems you can guide users on:
1. **Roster & Academic Marks Directory**:
   - Access: View 2 lists all students in the selected class (JSS1 - SS3).
   - Grade Entry: Click a student row to open the active row editor (View 1). Entering testScore (Continuous Assessment max 30) and examScore (Exam papers max 70).
   - Automatic Calculations: The system automatically sums Marks, determines standard grades (A to F), and dynamically re-orders the class ranking positions. No manual mathematical entries are needed!
   - Traits & Behavior: Teachers rate conduct (Punctuality, neatness, politeness, cooperation, leadership) on a tactile 1-5 star scale.
   - Attendance: Log days present out of total days.
   - Remarks: Form teachers and Principals can save distinct textual remarks.

2. **Properties & Workspace (15 Properties Template)**:
   - Access: View 3 (tab "Workspace") is the admin board.
   - Customize properties: Modify school name, motto, address, phone, email, next term fee, current sessions, academic term boundaries, and promotional pass thresholds.
   - Portal Lockout: Teachers or admins can globally toggle the lockout state. When locked, students/parents cannot view terminal report cards in their portal (prevents premature viewing or checks before fees clearance).

3. **Staff Management**:
   - Access: View 4 (tab "Staff") is available to Authorized Administrators.
   - Create restricted logins for tutors. For example, assign an educator specifically to SS2 so they can only manage their designated classroom roster, safeguarding other grades.

4. **Printable Passcards**:
   - Access: View 6 (tab "Passcards").
   - Admin generates printed passcard sheets. Cut along the dashed guidelines and issue unique slip IDs to students or guardians for secure login from home.

5. **Security Audit Ledger**:
   - Access: View 5 (tab "Audit Logs").
   - Tracks every security event: manual resets, rollover resets, and self-resets. Ensure accountability across student portal logins.

6. **Student Portal (Login with Passcode)**:
   - Students/parents log in using their unique 6-digit passcode.
   - Supports First, Second, and Third Term navigation.
   - Downloads high-fidelity premium terminal reports with stamp, signature, watermarks, and high-DPI scaling.

When answering, supply precise, easy-to-read, scannable markdown responses. Use lists, bold terms, and structured headers. Avoid lengthy text blocks. Keep your tone encouraging, objective, and highly professional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("[Gemini API Error]:", err);
      res.status(500).json({ error: err.message || "An error occurred with the AI assistant." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
