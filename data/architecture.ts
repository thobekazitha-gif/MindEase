export const architectureMarkdown = `
# System Architecture & Data Flow

MindEase is a client-side single-page application (SPA) built with React. It communicates directly with Google Gemini APIs, leveraging a serverless architecture where the "backend" is entirely managed by Google.

---

### System Architecture Diagram (Conceptual)

\`\`\`
+-------------------------------------------------+
|                 USER'S BROWSER                  |
|                                                 |
|  +---------------------+   +------------------+ |
|  |     React UI        |   | Web Speech API   | |
|  |  (Components, State)|<->| (Mic Input)      | |
|  +---------------------+   +------------------+ |
|           ^                       ^             |
|           | User Interaction      | Voice Data  |
|           v                       v             |
|  +-------------------------------------------+  |
|  |           App Logic (App.tsx)             |  |
|  +-------------------------------------------+  |
|           |                                     |
|           | API Calls (HTTPS)                   |
|           v                                     |
+-------------------------------------------------+
             |
             |
+-------------------------------------------------+
|               GOOGLE CLOUD / GEMINI             |
|                                                 |
| +---------------------+   +-------------------+ |
| |  \`gemini-2.5-flash\` |   | \`gemini-2.5-flash- | |
| |  (Chat, Mood, Sum.) |   |    preview-tts\`     | |
| +---------------------+   +-------------------+ |
|                                                 |
+-------------------------------------------------+
\`\`\`

---

### Data Flow Explanation

The following sequence describes the journey of a user's message through the system:

1.  **Input:** The user either types a message into the \`ChatInput\` component or uses their microphone.
    *   **Voice Input:** If the microphone is used, the browser's native **Web Speech API** captures the audio and transcribes it into text in real-time. The transcript updates the input field.

2.  **Send Message:** The user clicks the "Send" button. The \`handleSendMessage\` function in \`App.tsx\` is triggered.

3.  **Mood Analysis:**
    *   An asynchronous call is made to the \`analyzeMood\` function in \`geminiService.ts\`.
    *   This function sends the user's text to the **\`gemini-2.5-flash\`** model with a specific prompt and a JSON schema to return a mood score (1-10).
    *   The mood score is attached to the user's message object in the application's state.

4.  **Chat Interaction (Streaming):**
    *   The main chat request is sent to the **\`gemini-2.5-flash\`** model's chat instance using \`sendMessageStream\`.
    *   The model begins generating a response. As chunks of text (\`chunk.text\`) are received, they are appended to the assistant's message in the UI, creating a real-time streaming effect.

5.  **Text-to-Speech (TTS) Playback:**
    *   As the response text is streamed, it's collected into sentences.
    *   Once a complete sentence is formed, it's sent to the \`getAudio\` function.
    *   \`getAudio\` calls the **\`gemini-2.5-flash-preview-tts\`** model, which returns the spoken audio as a base64 encoded string.
    *   This audio data is decoded into an \`AudioBuffer\` and placed in a playback queue to ensure smooth, sequential playback without interrupting the next sentence being generated.

6.  **State & UI Update:** The application's central state (managed with \`useState\` in \`App.tsx\`) is updated throughout this process, causing the React components (\`ChatWindow\`, etc.) to re-render and display the new messages, mood data, and loading states.

7.  **Session Summary (Periodic):** After every 5 user messages, the \`generateSummary\` function is called. It sends the recent conversation history to **\`gemini-2.5-flash\`** to create a reflective summary, which is then displayed in the chat window as a special message type.
`;