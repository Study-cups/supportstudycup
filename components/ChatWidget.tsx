
import React, { useState, useRef, useEffect } from "react";


/* ================= TYPES ================= */

type Sender = "bot" | "user";

interface Message {
  sender: Sender;
  text: string;
}

type Step =
  | "intro"
  | "name"
  | "email"
  | "phone"
  | "city"
  | "course"
  | "done";

const API_URL = "https://studycupsbackend-wb8p.onrender.com/api/chat-registration";

/* ================= VALIDATORS ================= */
/* ================= REFUSAL DETECTORS ================= */

const isEmailRefusal = (text: string) =>
  /not able|can't|cannot|no email|email nahi|nahi dunga|refuse|don'?t want/i.test(
    text.toLowerCase()
  );

const isPhoneRefusal = (text: string) =>
  /not able|can't|cannot|no phone|no number|number nahi|nahi dunga|refuse|don'?t want/i.test(
    text.toLowerCase()
  );


const isEmail = (text: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

const isPhone = (text: string) =>
  /^[6-9]\d{9}$/.test(text.replace(/\s/g, ""));

const extractName = (text: string) => {
  return text
    .toLowerCase()
    .replace(/my name is|i am|this is|it's|its/gi, "")
    .replace(/[^a-z\s]/gi, "")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/* ================= COMPONENT ================= */

const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text:
        "Hi 👋Alisha\, your personalised AI career assistant 🤖✨\n\nHow can I help you today?",
    },
  ]);

  const [step, setStep] = useState<Step>("intro");
  const [input, setInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    course: "",
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);


  /* ================= HELPERS ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const addBotMessage = (text: string) => {
    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "bot", text }]);
    }, 500);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
  };


  /* ================= MAIN LOGIC ================= */

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");
    addUserMessage(userText);

    /* ===== STEP 0: USER QUESTION ===== */
    if (step === "intro") {
      addBotMessage(
        "Sure. I can help you with college admissions.\n\nBefore we proceed, what should I call you?"
      );
      setStep("name");
      return;
    }


    /* ===== STEP 1: NAME ===== */
    if (step === "name") {
      const cleanName = extractName(userText);

      if (cleanName.length < 2) {
        addBotMessage("Sorry 😅 I didn’t catch your name. What should I call you?");
        return;
      }

      setFormData((p) => ({ ...p, name: cleanName }));

      addBotMessage(
        `Nice to meet you, ${cleanName} 😊\n\nI’ll share a curated shortlist & important details.\nWhat’s the best email to reach you? 📩`
      );

      setStep("email");
      return;
    }

    /* ===== STEP 2: EMAIL ===== */
    if (step === "email") {

  // 1️⃣ User refuses email
  if (isEmailRefusal(userText)) {
    addBotMessage(
      "Understood.\n\nAn email address is mandatory to continue.\nPlease share a valid email."
    );
    return;
  }

  // 2️⃣ Invalid email format
  if (!isEmail(userText)) {
    addBotMessage(
      "That doesn’t look like a valid email address.\nPlease enter a correct email to continue."
    );
    return;
  }

  // 3️⃣ Valid email
  setFormData((p) => ({ ...p, email: userText }));

  addBotMessage(
    "Thank you.\n\nCan I have your mobile number so our expert can assist you further?"
  );

  setStep("phone");
  return;
}


    /* ===== STEP 3: PHONE ===== */
   if (step === "phone") {

  // 1️⃣ User refuses phone
  if (isPhoneRefusal(userText)) {
    addBotMessage(
      "Understood.\n\nA mobile number is required to proceed.\nPlease share your phone number."
    );
    return;
  }

  // 2️⃣ Invalid phone
  if (!isPhone(userText)) {
    addBotMessage(
      "That doesn’t look like a valid mobile number.\nPlease enter a 10-digit Indian phone number."
    );
    return;
  }

  // 3️⃣ Valid phone
  setFormData((p) => ({ ...p, phone: userText }));

  addBotMessage(
    "Thank you.\n\nWhich city should I consider for nearby colleges?"
  );

  setStep("city");
  return;
}


    /* ===== STEP 4: CITY ===== */
    if (step === "city") {
     if (userText.length < 2) {
  addBotMessage(
    "Please tell me the city you’re currently in or prefer for college."
  );
  return;
}


      setFormData((p) => ({ ...p, city: userText }));
      addBotMessage(
        "Almost done 👍\nWhich course are you planning for?\nMBA, BTech, BBA, or something else?"
      );
      setStep("course");
      return;
    }

    /* ===== STEP 5: COURSE ===== */
    if (step === "course") {
      if (userText.length < 2) {
  addBotMessage(
    "Please tell me the course you’re planning to pursue."
  );
  return;
}


      const payload = {
        ...formData,
        course: userText,
      };

      try {
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        addBotMessage(
          "✅ Thanks! I’ve shared your details with our expert.\nYou’ll receive personalised guidance shortly.\n\nWould you like to chat with an expert now?"
        );
      } catch {
        addBotMessage(
          "⚠️ Something went wrong, but don’t worry.\nOur team will still reach out to you."
        );
      }

      setStep("done");
      return;
    }
  };

  /* ================= UI ================= */

  return (
    <>
      {/* FLOATING BUTTON */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <div className="pointer-events-none absolute inset-[-18px] rounded-[34px] bg-[radial-gradient(circle_at_50%_55%,rgba(243,161,28,0.34)_0%,rgba(243,161,28,0.18)_34%,rgba(243,161,28,0)_72%)] blur-2xl" />
        <div className="pointer-events-none absolute inset-[-7px] rounded-[29px] bg-[conic-gradient(from_220deg_at_50%_50%,rgba(243,161,28,0.92),rgba(243,161,28,0.18),rgba(243,161,28,0.86),rgba(20,67,110,0.12),rgba(243,161,28,0.95))] opacity-80 blur-[2px]" />
        <div className="pointer-events-none absolute inset-[-2px] rounded-[26px] border border-[#f3a11c]/45 shadow-[0_0_18px_rgba(243,161,28,0.42)]" />

        <button
          onClick={() => setOpen(true)}
          aria-label="Open StudyCups AI chat"
          className="group relative flex h-[68px] w-[68px] items-center justify-center rounded-[24px] border border-white/40 bg-[linear-gradient(145deg,#0c2444_0%,#174a7e_58%,#f3a11c_180%)] shadow-[0_20px_42px_rgba(7,29,53,0.34)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_52px_rgba(7,29,53,0.42)]"
        >
          <span className="absolute inset-[3px] rounded-[20px] bg-[linear-gradient(160deg,rgba(7,29,53,0.96)_0%,rgba(20,67,110,0.95)_62%,rgba(243,161,28,0.18)_100%)]" />
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#f3a11c] shadow-[0_0_12px_rgba(243,161,28,0.85)]" />
          <span className="absolute bottom-2.5 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full bg-[#f3a11c]/28 blur-md" />
          <span className="absolute bottom-3.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#f3a11c] shadow-[0_0_18px_rgba(243,161,28,0.9)]" />

          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm">
            <svg
              viewBox="0 0 32 32"
              className="h-6 w-6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.5 13.25C8.5 10.3505 10.8505 8 13.75 8H21C23.8995 8 26.25 10.3505 26.25 13.25V16C26.25 18.8995 23.8995 21.25 21 21.25H18L13.5376 24.8593C12.8848 25.3874 11.9062 24.9227 11.9062 24.083V21.25H13.75C10.8505 21.25 8.5 18.8995 8.5 16V13.25Z"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12.75 14.625H12.7625M17.375 14.625H17.3875M22 14.625H22.0125"
                stroke="white"
                strokeWidth="2.50"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22.75 7.25L23.35 8.7L24.8 9.3L23.35 9.9L22.75 11.35L22.15 9.9L20.7 9.3L22.15 8.7L22.75 7.25Z"
                fill="#f3a11c"
              />
            </svg>
          </span>
        </button>
      </div>

      {false && <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xl shadow-2xl hover:scale-105 transition z-[9999]"
      >
        💬
      </button>}

      {/* CHAT WINDOW */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[520px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[9999]">
          {/* HEADER */}
          <div className="bg-[#1E4A7A] text-white px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-semibold">StudyCups AI</p>
              <p className="text-xs text-blue-100">
                Online • Career Assistant
              </p>
            </div>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[80%] whitespace-pre-line ${msg.sender === "user"
                      ? "bg-orange-500 text-white"
                      : "bg-white text-gray-800 shadow"
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          {step !== "done" && (
            <div className="border-t p-3 flex gap-2 bg-white">
              <input
                className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="bg-[#f4a71d] text-white px-4 rounded-xl text-sm font-semibold"
              >
                Send
              </button>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="p-3 border-t text-center">
              <a
                href="https://wa.me/91XXXXXXXXXX"
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                💬 Chat with Expert
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
