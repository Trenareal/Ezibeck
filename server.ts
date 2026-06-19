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
        const lastMsg = (messages[messages.length - 1]?.text || "").toLowerCase();
        let reply = "";

        if (lastMsg.includes("score") || lastMsg.includes("exam") || lastMsg.includes("mark") || lastMsg.includes("grade")) {
          reply = `### How to Enter Student Academic Scores
To enter academic scores for any student, please follow these steps:

1. **Select Class**: Navigate to the student roster list in the **Director Roster** page.
2. **Open Row Editor**: Click on the specific student's name/row in the list.
3. **Key in Data**: In the slide-out/modal **Active Row Editor**, enter the **CA Test Score** (max 30 marks) and the **Exam Score** (max 70 marks).
4. **Behavioral Ratings**: Toggle behavioural attributes (such as Neatness, Cooperation, leadership, and hands-on Manners) on the 1–5 star scales.
5. **Save Changes**: Click **Save Row Record**. The system automatically updates the student's final stats, averages, and grades.

*(Note: In offline simulation mode, your changes are safely stored in your browser's persistent database.)*`;
        } else if (lastMsg.includes("rank") || lastMsg.includes("position") || lastMsg.includes("calculate") || lastMsg.includes("average")) {
          reply = `### Automatic Academic Calculations
Yes! The calculation of averages, positions, and grades is fully automated:

* **Automatic Aggregates**: The system automatically adds **CA Test Score (max 30)** + **Exam Score (max 70)** to calculate a total mark out of **100**.
* **Automatic GPA & Percentage**: Overall percentage averages across all registered subjects are updated instantly upon saving.
* **Auto Class Positions (Ranks)**: Student positions (e.g., 1st, 2nd, 3rd) are calculated dynamically relative to other peers in the same class. If score details change, classroom competitive positions are recalculated automatically!`;
        } else if (lastMsg.includes("motto") || lastMsg.includes("fee") || lastMsg.includes("customize") || lastMsg.includes("branding") || lastMsg.includes("setting") || lastMsg.includes("value") || lastMsg.includes("workspace")) {
          reply = `### How to Customize Motto, Fees & Branding (Workspace 15)
To align the application configuration with Notion College's official mandates, Administrators can manage 15 distinct properties:

1. Navigate to the **Workspace** tab inside the staff dashboard.
2. Modify branding properties such as **School Name**, **School Motto** (*"Sharpening Minds, Inspiring Greatness"*), **School Address**, **School Phone number**, and **Official Email**.
3. Set terminal specific fees: Set **Next Term Fees** inside the designated box.
4. Save adjustments. Your school's name, logo badge, and motto details are instantly updated on the home portal, student login card, and printable PDF report card headers.`;
        } else if (lastMsg.includes("lock") || lastMsg.includes("lockout") || lastMsg.includes("block")) {
          reply = `### How to Lock / Block Student Portal Access
You can lock student portal logins during examination periods, grading computation days, or fees clearance reviews:

1. Navigate to the **Workspace** tab in your dashboard.
2. Toggle the **Portal Locked / Gatekeeper Lockout** switch to **ON**.
3. When locked, any student attempting to login using their passcode will be blocked and see a dynamic message: *"Student Report Portal is currently locked under maintenance."*
4. Turn the switch back to **OFF** to restore global self-service access immediately.`;
        } else if (lastMsg.includes("login") || lastMsg.includes("passcode") || lastMsg.includes("password") || lastMsg.includes("pin")) {
          reply = `### Student Passcode Security & Access
Our platform prioritizes secure yet convenient passkey logins with no passwords to remember:

* **Unique 6-Digit Passcodes**: Every student is assigned a secure 6-digit numeric OTP/passcode.
* **Accessing Reports**: On the home portal, students select their class, select their name, enter their passcode, and hit **Access Report**.
* **Distributing slips**: Admins can batch-print beautiful passcode cards from the **Passcards** tab to distribute direct physical logins.
* **Emergency Reset self-service**: If a student is locked out, they can input their emergency family email to request password/passcode resets directly.`;
        } else if (lastMsg.includes("pdf") || lastMsg.includes("print") || lastMsg.includes("export") || lastMsg.includes("download") || lastMsg.includes("report")) {
          reply = `### Downloading Stamped PDF Reports
This workspace features a high-density PDF generation engine:

1. **Launches Review Frame**: Locate the target student, and click the **Eye (Print Preview)** icon. This renders a high-definition mock report card.
2. **Verified Stamps & Signatures**: The report card renders with certified school badges, official watermarks, principal stamps, and electronic signatures.
3. **Execute PDF Download**: Click the **Download Official PDF** button. Your browser downloads a crystal-clear, printer-ready PDF.`;
        } else if (lastMsg.includes("backup") || lastMsg.includes("csv") || lastMsg.includes("save") || lastMsg.includes("import")) {
          reply = `### Backups and Excel/CSV Alignment
Prevent accidental local database loss easily:

* **CSV Import**: Tutors can import class records instantly using comma-separated spreadsheets containing row data: \`name\`, \`age\`, \`sex\` to avoid manual entry.
* **ZIP Backups**: Click the **Download Classroom Backup** button to securely compress student datasets into a convenient zip file. You can restore this file at any time via the **Upload Backup** button.`;
        } else if (lastMsg.includes("staff") || lastMsg.includes("tutor") || lastMsg.includes("teacher") || lastMsg.includes("permission")) {
          reply = `### Role Assignments and Restricted Permissions
Manage staff roles and enforce access security:

* **Staff Desk Directory**: Administrators can configure dedicated profiles for individual tutors.
* **Class Locking**: Turn on restrictions such as **SS2 Only** for a tutor. This locks their workspace inside their class. They won't be able to view, modify, or leak scores belonging to JSS1 or SS3.
* **Security Audits**: The **Audit Logs** track all changes made by staff users, including passcode lookups, record edits, and term changes.`;
        } else {
          reply = `### EZIBECK Workspace Assistant (Offline Simulation Mode)
I am here to guide you through managing Notion College's school systems. Since no \`GEMINI_API_KEY\` is configured in Secrets, I am running on local index rules.

Here are some specific questions you can ask me:
* **"How do I enter student exam scores?"**
* **"How can I automatically calculate class positions and ranks?"**
* **"How to customize our School Motto, Logo, and next term Fees?"**
* **"How can I lock or unlock student portal access?"**
* **"How do students log into the portal using 6-digit passcodes?"**
* **"How to print or download reports as official stamped PDFs?"**

*Simply ask about scores, ranks, customization, lockouts, logins, or PDFs, and I will supply detailed guidelines!*`;
        }

        res.json({ text: reply });
        return;
      }

      // Format custom messages from the frontend to the correct @google/genai structure
      // Gemini API contents array must start with a 'user' turn.
      let contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text || m.content || "" }]
      }));

      // Filter out any leading model messages
      while (contents.length > 0 && contents[0].role === "model") {
        contents.shift();
      }

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
