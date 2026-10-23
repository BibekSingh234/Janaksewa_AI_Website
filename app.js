/**
 * Jarvesh AI - Complete App Client Script
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const chatMessages = document.getElementById("chatMessages");
    const welcomeScreen = document.getElementById("welcomeScreen");
    const typingIndicator = document.getElementById("typingIndicator");
    const languageSelect = document.getElementById("languageSelect");
    const detectedLanguageDisplay = document.getElementById("detectedLanguage");
    
    // File & Image Input Controls
    const attachmentButton = document.getElementById("attachmentButton");
    const fileInput = document.getElementById("fileInput");

    // Header & Sidebar
    const newChatBtn = document.getElementById("newChatButton");
    const sidebarNewChatBtn = document.getElementById("sidebarNewChat");
    const clearChatBtn = document.getElementById("clearChatButton");
    const mobileMenuBtn = document.getElementById("mobileMenuButton");
    const chatSidebar = document.getElementById("chatSidebar");

    // Speech Controls
    const voiceButton = document.getElementById("voiceButton");
    const voiceModeButton = document.getElementById("voiceModeButton");
    const stopSpeakingButton = document.getElementById("stopSpeakingButton");
    const voiceModal = document.getElementById("voiceModal");
    const stopVoiceButton = document.getElementById("stopVoiceButton");
    const voiceStatus = document.getElementById("voiceStatus");

    // State
    let selectedBase64Image = null;
    let isVoiceOutputEnabled = true;
    let isSpeechToSpeechMode = false;
    let recognition = null;
    let currentLanguage = "auto";
    let chatHistory = [];

    // --- Image / Attachment Handling ---
    if (attachmentButton && fileInput) {
        attachmentButton.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    selectedBase64Image = evt.target.result;
                    attachmentButton.style.color = "#00d2ff"; // Highlight icon on attachment
                };
                reader.readAsDataURL(file);
            } else {
                alert("Please select a valid image file.");
            }
        });
    }

    // --- Event Listeners ---
    sendButton.addEventListener("click", () => handleSendMessage());

    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-grow textarea
    messageInput.addEventListener("input", () => {
        messageInput.style.height = "auto";
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
    });

    // Quick Action Cards
    document.querySelectorAll(".quick-question, .welcome-card, .ask-example").forEach(btn => {
        btn.addEventListener("click", () => {
            const question = btn.getAttribute("data-question") || btn.innerText.trim();
            if (question) {
                messageInput.value = question;
                handleSendMessage();
            }
        });
    });

    // Reset Chat Controls
    [newChatBtn, sidebarNewChatBtn, clearChatBtn].forEach(btn => {
        if (btn) btn.addEventListener("click", resetChat);
    });

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            chatSidebar.classList.toggle("active");
        });
    }

    // Language Dropdown
    languageSelect.addEventListener("change", (e) => {
        currentLanguage = e.target.value;
        detectedLanguageDisplay.textContent = `Language: ${e.target.options[e.target.selectedIndex].text}`;
    });

    // --- Main Messaging & Real-Time Streaming ---
    async function handleSendMessage(overrideText = null) {
        const text = overrideText || messageInput.value.trim();
        if (!text && !selectedBase64Image) return;

        if (welcomeScreen) welcomeScreen.style.display = "none";

        // Append user prompt and preview image if present
        appendUserMessage(text, selectedBase64Image);

        const currentImagePayload = selectedBase64Image;
        selectedBase64Image = null;
        if (attachmentButton) attachmentButton.style.color = "";
        if (fileInput) fileInput.value = "";

        if (!overrideText) messageInput.value = "";
        messageInput.style.height = "auto";

        window.speechSynthesis.cancel();
        showTyping(true);

        const aiTextElement = createStreamBubble();

        try {
            // Call Node.js backend SSE endpoint
            const response = await fetch("http://localhost:5000/api/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    image: currentImagePayload,
                    history: chatHistory,
                    language: currentLanguage
                })
            });

            if (!response.ok) throw new Error("Backend connection error");

            showTyping(false);

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullAiResponse = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.replace("data: ", "").trim();
                        if (dataStr === "[DONE]") break;

                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.content) {
                                fullAiResponse += parsed.content;
                                aiTextElement.innerHTML = formatMarkdown(fullAiResponse);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        } catch (e) {
                            // Ignore partial JSON buffers
                        }
                    }
                }
            }

            // Store history
            chatHistory.push({ role: "user", content: text });
            chatHistory.push({ role: "assistant", content: fullAiResponse });

            // Trigger Text-to-Speech / Speech-to-Speech
            if (isVoiceOutputEnabled || isSpeechToSpeechMode) {
                speakText(fullAiResponse, () => {
                    if (isSpeechToSpeechMode) {
                        startVoiceInput();
                    }
                });
            }

        } catch (error) {
            showTyping(false);
            aiTextElement.innerHTML = "Error connecting to Jarvesh backend. Please ensure server.js is running on http://localhost:5000.";
            console.error("Jarvesh AI Error:", error);
        }
    }

    // --- UI Message Creators ---
    function appendUserMessage(text, imageSrc) {
        const msgWrapper = document.createElement("div");
        msgWrapper.classList.add("message-wrapper", "user-message-wrapper");

        let contentHtml = "";
        if (imageSrc) {
            contentHtml += `<img src="${imageSrc}" style="max-width:200px; border-radius:8px; display:block; margin-bottom:8px;">`;
        }
        if (text) {
            contentHtml += formatMarkdown(text);
        }

        msgWrapper.innerHTML = `
            <div class="message-avatar user-avatar">
                <i class="bi bi-person-fill"></i>
            </div>
            <div class="message-bubble user-bubble">
                <div class="message-text">${contentHtml}</div>
            </div>
        `;

        chatMessages.appendChild(msgWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createStreamBubble() {
        const msgWrapper = document.createElement("div");
        msgWrapper.classList.add("message-wrapper", "ai-message-wrapper");

        msgWrapper.innerHTML = `
            <div class="message-avatar ai-avatar">
                <i class="bi bi-robot"></i>
            </div>
            <div class="message-bubble ai-bubble">
                <div class="message-text"></div>
            </div>
        `;

        chatMessages.appendChild(msgWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgWrapper.querySelector(".message-text");
    }

    function showTyping(show) {
        typingIndicator.style.display = show ? "flex" : "none";
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function resetChat() {
        chatMessages.innerHTML = "";
        chatHistory = [];
        if (welcomeScreen) welcomeScreen.style.display = "block";
        window.speechSynthesis.cancel();
        if (stopSpeakingButton) stopSpeakingButton.style.display = "none";
    }

    function formatMarkdown(text) {
        return text
            .replace(/\n/g, "<br>")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>");
    }

    // --- Speech Recognition ---
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        voiceButton.addEventListener("click", () => {
            isSpeechToSpeechMode = true;
            startVoiceInput();
        });

        stopVoiceButton.addEventListener("click", stopVoiceInput);

        recognition.onstart = () => {
            voiceModal.style.display = "flex";
            voiceStatus.textContent = "Listening...";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            stopVoiceInput();
            handleSendMessage(transcript);
        };

        recognition.onerror = () => {
            voiceStatus.textContent = "Voice input error. Try again.";
            setTimeout(stopVoiceInput, 1200);
        };

        recognition.onend = () => {
            voiceModal.style.display = "none";
        };
    }

    function startVoiceInput() {
        if (!recognition) return;
        const langMap = { en: "en-US", ne: "ne-NP", mai: "hi-IN", hi: "hi-IN" };
        recognition.lang = langMap[currentLanguage] || "en-US";
        try { recognition.start(); } catch (e) {}
    }

    function stopVoiceInput() {
        voiceModal.style.display = "none";
        if (recognition) recognition.stop();
    }

    // --- Text-to-Speech Output ---
    function speakText(text, onEndCallback) {
        if (!("speechSynthesis" in window)) return;

        window.speechSynthesis.cancel();

        const cleanText = text.replace(/[*_#]/g, "").replace(/<br>/g, " ");
        const utterance = new SpeechSynthesisUtterance(cleanText);

        const voices = window.speechSynthesis.getVoices();
        if (currentLanguage === "ne") {
            utterance.voice = voices.find(v => v.lang.includes("ne")) || null;
        } else if (currentLanguage === "hi" || currentLanguage === "mai") {
            utterance.voice = voices.find(v => v.lang.includes("hi")) || null;
        }

        if (stopSpeakingButton) stopSpeakingButton.style.display = "inline-block";

        utterance.onend = () => {
            if (stopSpeakingButton) stopSpeakingButton.style.display = "none";
            if (onEndCallback) onEndCallback();
        };

        window.speechSynthesis.speak(utterance);
    }

    if (stopSpeakingButton) {
        stopSpeakingButton.addEventListener("click", () => {
            window.speechSynthesis.cancel();
            isSpeechToSpeechMode = false;
            stopSpeakingButton.style.display = "none";
        });
    }

    if (voiceModeButton) {
        voiceModeButton.addEventListener("click", () => {
            isVoiceOutputEnabled = !isVoiceOutputEnabled;
            voiceModeButton.classList.toggle("active", isVoiceOutputEnabled);
        });
    }
});