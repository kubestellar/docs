import React, { useState, useRef, useEffect } from "react";
import styles from "./ProjectBot.module.css";
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

interface FAQItem {
  q: string;
  keywords: string[];
  a: string;
  category?: string;
}

const faq: FAQItem[] = [
  {
    q: "How do I install KubeStellar A2A?",
    keywords: ["install", "installation", "setup", "getting started"],
    a: "You can install KubeStellar A2A using **uv** (recommended) or pip:\n\n```bash\n# Install uv\ncurl -LsSf https://astral.sh/uv/install.sh | sh\n\n# Clone and install\ngit clone https://github.com/kubestellar/a2a.git\ncd a2a\nuv pip install -e \".[dev]\"\n```\n\nFor detailed instructions, check our [Installation Guide](/a2a/docs/getting-started/installation).",
    category: "Getting Started"
  },
  {
    q: "What is KubeStellar A2A?",
    keywords: ["what is", "about", "overview", "definition"],
    a: "**KubeStellar A2A** is an intelligent orchestrator for multi-cluster Kubernetes operations. It provides:\n\n- 🤖 **AI-powered automation** with natural language interfaces\n- 🌐 **Multi-cluster management** with advanced targeting\n- ⚙️ **KubeStellar integration** with WDS, ITS, and binding policies\n- 💬 **Interactive agent mode** for conversational management",
    category: "Overview"
  },
  {
    q: "How do I use the AI agent?",
    keywords: ["agent", "ai", "natural language", "chat", "conversation"],
    a: "Start the AI agent with:\n\n```bash\n# Set your API key first\nuv run kubestellar config set-key gemini YOUR_GEMINI_API_KEY\n\n# Start agent\nuv run kubestellar agent\n```\n\nThen you can use natural language commands like:\n- \"Deploy nginx to all production clusters\"\n- \"Show me cluster health status\"\n- \"List all pods across namespaces\"",
    category: "AI Features"
  },
  {
    q: "Where can I find the quick start guide?",
    keywords: ["quick start", "tutorial", "getting started", "guide"],
    a: "Check out our [Quick Start Guide](/a2a/docs/getting-started/quick-start) to get up and running in 5 minutes!",
    category: "Getting Started"
  },
  {
    q: "What AI providers are supported?",
    keywords: ["ai providers", "llm", "openai", "gemini", "providers"],
    a: "Currently supported AI providers:\n\n- **OpenAI** (GPT-4, GPT-4o, etc.)\n- **Google Gemini** (gemini-2.0-flash, gemini-1.5-pro, etc.)\n\nSet up with:\n```bash\nuv run kubestellar config set-key <provider> YOUR_API_KEY\n```",
    category: "AI Features"
  },
  {
    q: "How do I contribute to the project?",
    keywords: ["contribute", "development", "pull request", "github"],
    a: "We welcome contributions! Here's how to get started:\n\n1. Fork the repository\n2. Create a feature branch\n3. Make your changes\n4. Run tests: `pytest`\n5. Submit a pull request\n\nSee our [Contributing Guide](/a2a/docs/CONTRIBUTING) for detailed guidelines.",
    category: "Development"
  },
  {
    q: "What are the system requirements?",
    keywords: ["requirements", "prerequisites", "python", "system"],
    a: "**Minimum Requirements:**\n- Python 3.11+\n- 512MB RAM\n- 100MB disk space\n- Internet connection\n\n**Recommended:**\n- Python 3.12+\n- 2GB RAM\n- kubectl configured\n- Helm 3.x",
    category: "Installation"
  }
];

// Storage key for localStorage
const STORAGE_KEY = 'kubestellar-chat-history';

// Gemini API function
async function fetchGeminiAnswer(apiKey: string, question: string): Promise<string> {
  if (!apiKey) {
    return "❌ Gemini API key is not configured. Please contact the administrator.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const prompt = `You are a specialized assistant for KubeStellar A2A, an intelligent orchestrator for multi-cluster Kubernetes operations.

STRICT GUIDELINES:
- ONLY answer questions about KubeStellar A2A, Kubernetes multi-cluster management, or directly related technologies
- If asked about unrelated topics, politely redirect: "I'm specifically designed to help with KubeStellar A2A. Please ask about installation, usage, troubleshooting, or Kubernetes multi-cluster topics."
- Focus on practical, actionable advice
- Use markdown formatting for code blocks and emphasis
- Keep responses concise and helpful

CONTEXT: KubeStellar A2A provides:
- AI-powered automation with natural language interfaces
- Multi-cluster Kubernetes management with advanced targeting
- Integration with KubeStellar's WDS (Workload Description Space) and ITS (Inventory & Transport Space)
- Binding policies for workload placement
- Helm deployments across clusters
- CLI and agent-based interfaces

Question: ${question}

Please provide a helpful, accurate response with markdown formatting if needed.`;

  const body = {
    contents: [{ 
      parts: [{ text: prompt }] 
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return `❌ Unable to get AI response. Please try again or contact support.`;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return "🤖 I couldn't generate a response. Please try rephrasing your question.";
    }
    
    return text;
  } catch (error) {
    return "❌ Network error. Please check your connection and try again.";
  }
}

// Fallback FAQ function
function findAnswer(question: string): string {
  const q = question.toLowerCase();
  let bestMatch: FAQItem | null = null;
  let bestScore = 0;

  for (const item of faq) {
    let score = 0;
    
    if (q.includes(item.q.toLowerCase())) {
      score += 10;
    }
    
    for (const keyword of item.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        score += keyword.length > 3 ? 3 : 2;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && bestScore > 1) {
    return bestMatch.a;
  }

  return "🤔 I couldn't find information about that. I can help you with:\n\n- Installation and setup\n- Using the AI agent\n- Contributing to the project\n- System requirements\n- AI providers\n\nTry asking about one of these topics, or check our [documentation](/a2a/docs/intro/).";
}

const quickActions = [
  { label: "🚀 How to install?", question: "How do I install KubeStellar A2A?" },
  { label: "🤖 Using AI agent", question: "How do I use the AI agent?" },
  { label: "📚 Quick start", question: "Where can I find the quick start guide?" },
  { label: "🔧 Contributing", question: "How do I contribute to the project?" }
];

export default function ProjectBot() {
  const { siteConfig } = useDocusaurusContext();
  const geminiApiKey = siteConfig.customFields?.geminiApiKey as string;
  
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{q: string, a: string, timestamp: Date}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentlyTyping, setCurrentlyTyping] = useState<string>("");
  const [isShowingTypingEffect, setIsShowingTypingEffect] = useState(false);
  const [copiedStates, setCopiedStates] = useState<CopyState>({});
  
  const historyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = async (text: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [messageIndex]: true }));
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => {
          const newState = { ...prev };
          delete newState[messageIndex];
          return newState;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(historyWithDates);
      }
    } catch (error) {
      // Silently handle errors
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        // Silently handle errors
      }
    }
  }, [history]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const typeResponse = (text: string, callback: () => void) => {
    setCurrentlyTyping("");
    setIsShowingTypingEffect(true);
    let index = 0;
    

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    typingIntervalRef.current = setInterval(() => {
      setCurrentlyTyping(text.slice(0, index + 1));
      index++;
      
      if (index >= text.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsShowingTypingEffect(false);
        setCurrentlyTyping("");
        callback();
      }
    }, 10);
  };

  // Auto-scroll function
  const scrollToBottom = () => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  };

  // Scroll when history changes OR when typing status changes OR during typing effect
  useEffect(() => {
    scrollToBottom();
  }, [history, isTyping, currentlyTyping]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open && fullscreen) {
      document.body.classList.add('bot-fullscreen');
    } else {
      document.body.classList.remove('bot-fullscreen');
    }
    return () => {
      document.body.classList.remove('bot-fullscreen');
    };
  }, [open, fullscreen]);

  // Enhanced handleSend with typing effect
  async function handleSend(question?: string) {
    const questionText = question || input;
    if (!questionText.trim()) return;
    
    setHistory(prev => [...prev, {
      q: questionText,
      a: "",
      timestamp: new Date()
    }]);
    
    setIsTyping(true);
    setInput("");

    setTimeout(scrollToBottom, 50);
    
    let answer = "";
    
    try {
      if (geminiApiKey) {
        answer = await fetchGeminiAnswer(geminiApiKey, questionText);
      } else {
        answer = findAnswer(questionText);
      }
    } catch (error) {
      answer = "❌ An unexpected error occurred. Please try again.";
    }
    
    setIsTyping(false);
    
    typeResponse(answer, () => {
      setHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1].a = answer;
        }
        return newHistory;
      });
    });
  }

  function handleClear() {
    setHistory([]);
    // Also clear from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Silently handle errors
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setCurrentlyTyping("");
    setIsShowingTypingEffect(false);
  }

  function formatAnswer(answer: string) {
    return answer
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .split('\n')
      .map((line, i) => <div key={i} dangerouslySetInnerHTML={{__html: line || '<br>'}} />);
  }

  return (
    <div className={`${styles.botContainer} ${fullscreen ? styles.fullscreen : ""}`}>
      <button 
        className={`${styles.botButton} ${open ? styles.botButtonActive : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open project assistant"
        style={{ display: open ? 'none' : 'flex' }}
      >
        💬 Ask Assistant
      </button>
      
      {open && (
        <div className={styles.botWindow}>
          <div className={styles.botHeader}>
            <div className={styles.botTitle}>
              <div className={styles.botInfo}>
                <div className={styles.botName}>KubeStellar Assistant</div>
                <div className={styles.botStatus}>
                  {geminiApiKey ? (
                    <span className={styles.aiEnabled}>  (AI-Powered)</span>
                  ) : (
                    <span className={styles.faqMode}>📚 Knowledge Base</span>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.botControls}>
              {history.length > 0 && (
                <button 
                  onClick={handleClear} 
                  className={styles.clearButton}
                  title="Clear conversation"
                >
                  Clear
                </button>
              )}
              <button
                className={styles.fullscreenButton}
                onClick={() => setFullscreen(f => !f)}
                aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {fullscreen ? "🗗" : "⛶"}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setFullscreen(false);
                }}
                className={styles.closeButton}
                aria-label="Close assistant"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
            
          <div className={styles.botHistory} ref={historyRef}>
            {history.length === 0 ? (
              <div className={styles.welcomeMessage}>
                <div className={styles.welcomeText}>
                  <h3>👋 Welcome to KubeStellar Assistant!</h3>
                  <p>I'm here to help you with KubeStellar A2A - your intelligent multi-cluster Kubernetes orchestrator.</p>
                  {geminiApiKey ? (
                    <div className={styles.aiIndicator}>
                      ✨ Powered by advanced AI for intelligent responses
                    </div>
                  ) : (
                    <div className={styles.kbIndicator}>
                      📖 Using curated knowledge base
                    </div>
                  )}
                </div>
                <div className={styles.quickActions}>
                  <p className={styles.quickActionsTitle}>Quick actions:</p>
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      className={styles.quickAction}
                      onClick={() => handleSend(action.question)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className={styles.conversation}>
                  <div className={styles.userMessage}>
                    <div className={styles.messageHeader}>
                     <span className={styles.userIcon}>👤</span>
                      <span className={styles.userName}>You</span>
                       <span className={styles.messageTime}>
                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </span>
                      </div>
                    <div className={styles.messageText}>{item.q}</div>
                  </div>
                  {(item.a || isTyping || (isShowingTypingEffect && idx === history.length - 1)) && (
                    <div className={styles.botMessage}>
                      <div className={styles.messageHeader}>
                        <span className={styles.botIcon}>🤖</span>
                        <span className={styles.botName}>Assistant</span>
                      </div>
                      <div className={styles.messageText}>
                        {item.a ? (
                          formatAnswer(item.a)
                        ) : isShowingTypingEffect && idx === history.length - 1 ? (
                          formatAnswer(currentlyTyping)
                        ) : (
                          <div className={styles.typingIndicator}>
                            <span></span><span></span><span></span>
                          </div>
                        )}
                      </div>
                      {item.a && (
                        <div className={styles.messageActions}>
                          <button 
                            className={`${styles.actionButton} ${copiedStates[idx] ? styles.copied : ''}`}
                            onClick={() => copyToClipboard(item.a, idx)}
                            title={copiedStates[idx] ? "Copied!" : "Copy message"}
                          >
                       {copiedStates[idx] ? (
                              <>
                                <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="m5,9 0,-2a2,2 0 0,1 2,-2h2"></path>
                                </svg>
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className={styles.botInputRow}>
           <div className={styles.inputContainer}>
            <input
             ref={inputRef}
             value={input}
             onChange={e => setInput(e.target.value)}
             placeholder="Ask me anything about KubeStellar A2A..."
             className={styles.botInput}
             onKeyDown={e => e.key === "Enter" && !e.shiftKey && !isTyping && !isShowingTypingEffect && handleSend()}
             disabled={isTyping || isShowingTypingEffect}
             maxLength={500}
              />
            {input.length > 0 && (
            <span className={styles.charCounter}>
            {input.length}/500
           </span>
            )}
         </div>
         <button 
         onClick={() => handleSend()} 
          className={styles.sendButton}
          disabled={!input.trim() || isTyping || isShowingTypingEffect}
          title="Send message"
           >
         {isTyping || isShowingTypingEffect ? '⏳' : '🚀'}
         </button>
         </div>
        </div>
      )}
    </div>
  );
}