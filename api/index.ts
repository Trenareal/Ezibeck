import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
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
}

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
      // Return simulated responses if no API key is specified
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
To align the application configuration with Ezibeck Academy's official mandates, Administrators can manage 15 distinct properties:

1. Navigate to the **Workspace** tab inside the staff dashboard.
2. Modify branding properties such as **School Name**, **School Motto** (*"Sharpening Minds, Inspiring Greatness"*), **School Address**, **School Phone number**, and **Official Email**.
3. Manage dates and money terms: **Resumption Date** for next term, **Fee Amount**, and **Grade Pass Thresholds**.
4. Lockout settings: Lockout the student portal using the toggle switch so report sheets are not visible until fee payment or clearance is verified.`;
      } else if (lastMsg.includes("staff") || lastMsg.includes("account") || lastMsg.includes("credential") || lastMsg.includes("teacher") || lastMsg.includes("educator")) {
        reply = `### Educator & Classroom Management (Workspace 15)
As an Authorized Administrator of Ezibeck Academy:

1. Go to the **Staff** tab.
2. Create, view, or remove educator accounts.
3. Each registered tutor gets assigned a specific classroom (e.g., SS1, JSS3). This locks down their credentials so they can only view and grade their own assigned classroom rosters.
4. If they need to reset or lookup a staff passkey, they can do so securely here.`;
      } else if (lastMsg.includes("pass") || lastMsg.includes("slip") || lastMsg.includes("card") || lastMsg.includes("pin") || lastMsg.includes("code")) {
        reply = `### Generating Student Portal Passcards
To enable students and parents to log in smoothly from home:

1. Head to the **Passcards** tab of the dashboard.
2. Here, unique 6-digit access pins are generated for every registered student in the roster database.
3. Click **Print Passcards PDF** to print beautiful individual passcards.
4. Distribute these secure passcards to parents to prevent other students from snooping.`;
      } else if (lastMsg.includes("audit") || lastMsg.includes("log") || lastMsg.includes("history") || lastMsg.includes("track") || lastMsg.includes("change")) {
        reply = `### System Security Audit Ledger
The security of Ezibeck Academy's grades is strictly audited:

1. Navigate to the **Audit Logs** tab on the administrator panel.
2. Every significant action (such as resetting codes, changing session settings, or updating marks) triggers an automatic, un-deletable audit log entry.
3. The table displays exactly who performed the action, which student was affected, and the precise timestamp.
4. Use the search bar to filter logs by specific keywords or tutor names.`;
      } else {
        reply = `### EZIBECK Workspace Assistant (Offline Simulation Mode)
I am here to guide you through managing Ezibeck Academy's school systems. Since no \`GEMINI_API_KEY\` is configured in Secrets, I am running on local index rules.

Here are some specific questions you can ask me:
* **"How do I enter student exam scores?"**
* **"How do I set the next term's fees & resumption date?"**
* **"Where do I find student portal passkeys?"**
* **"How do I monitor staff updates in audit logs?"**`;
      }

      res.json({ text: reply });
      return;
    }

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // Gemini API contents array must start with a 'user' turn.
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    const systemInstruction = 
      `You are the EZIBECK Academics AI Assistant, an elite, professional, and friendly coordinator helper. Your goal is to support the staff, educators, and administrators of Ezibeck Academy / EZIBECK Academics in using their Workspace Desk.

Here is an overview of the platform functionalities and systems you can guide users on:
1. **Roster & Academic Marks Directory**:
   - Access: View 1 (tab "Roster") contains the Class grid directory.
   - Grading: Add continuous assessments (C.A. max 30) and Exams (max 70) to compile a 100-mark final average grade.
   - Competency domains: Mark 1–5 stars on Neatness, Cooperation, Leadership, and Manners.
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

export default app;
