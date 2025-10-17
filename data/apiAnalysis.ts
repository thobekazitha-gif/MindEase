export const apiAnalysisMarkdown = `
# API Trade-Off Analysis: MindEase AI

This document outlines the trade-offs considered in selecting and using the Google Gemini APIs for the MindEase application.

---

### 1. Core Conversational AI: \`gemini-2.5-flash\` vs. \`gemini-2.5-pro\`

MindEase uses \`gemini-2.5-flash\` for its main chat functionality. This was a deliberate choice based on the following trade-offs:

| Metric        | \`gemini-2.5-flash\` (Selected)                                  | \`gemini-2.5-pro\` (Alternative)                                | Rationale                                                                                             |
|---------------|-----------------------------------------------------------------|----------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **Latency**   | **Low.** Optimized for speed and responsiveness.                | **Higher.** More computation time required for responses.      | For a real-time conversational app, low latency is critical for a natural, engaging user experience.  |
| **Accuracy**  | **High.** More than sufficient for empathetic conversation.     | **Very High.** Excels at complex reasoning, coding, and logic. | The nuanced, complex reasoning of \`pro\` is overkill for MindEase's supportive dialogue needs.         |
| **Cost**      | **Lower.** More cost-effective for high-volume chat interactions. | **Higher.** More expensive per token.                          | Lower operational costs allow the service to be more accessible and sustainable.                      |

---

### 2. Text-to-Speech (TTS): \`gemini-2.5-flash-preview-tts\`

The application uses Gemini's native TTS model for generating spoken responses.

| Metric        | \`gemini-2.5-flash-preview-tts\`                                    | Alternative (e.g., Third-Party TTS)                             | Rationale                                                                                             |
|---------------|-------------------------------------------------------------------|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **Latency**   | **Moderate.** Optimized for streaming and quick audio generation. | Varies, but can introduce another network hop and vendor.        | An integrated solution within the Gemini ecosystem simplifies the architecture and reduces potential points of failure. |
| **Quality**   | **High.** Produces natural-sounding, high-quality voices.         | Quality can vary significantly between providers.                | A high-quality, soothing voice is essential for a mental health application.                          |
| **Cost**      | **Integrated.** Priced within the Gemini ecosystem.               | Separate billing and contract management.                        | Simplifies billing and vendor management by staying within a single API provider.                     |

---

### 3. Security and Privacy Considerations

*   **Data Handling:** All API calls are made directly from the client to Google's servers. No intermediary server stores conversation data, minimizing risk. User data is processed under Google's enterprise-grade security and privacy policies.
*   **PII (Personally Identifiable Information):** The system instruction for the model discourages handling sensitive medical or personal information and encourages users to seek professional help for severe issues. The app itself does not store or request PII.
*   **API Key Management:** The API key is managed as an environment variable (\`process.env.API_KEY\`), ensuring it is not hardcoded into the client-side source code and is injected securely at runtime.

---

### 4. Scaling Challenges and Solutions

*   **Challenge:** As the user base grows, the number of API calls will increase, leading to higher costs and potential rate limiting.
*   **Solution (Infrastructure):** The Gemini API is a serverless, managed service that scales automatically with demand. This eliminates the need for manual server provisioning or maintenance.
*   **Solution (Application):**
    *   **Rate Limiting:** The app should implement graceful error handling for rate limit errors (HTTP 429), potentially with exponential backoff for retries.
    *   **Cost Management:** Google Cloud allows for setting budgets and alerts on API usage to proactively manage costs.
    *   **Optimization:** Features like session summaries are triggered periodically (e.g., every 5 messages) rather than on every interaction to conserve token usage.
`;