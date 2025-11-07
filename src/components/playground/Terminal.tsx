"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<XTerm | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  // Password authentication
  const authenticateUser = async () => {
    try {
      const response = await fetch('/api/playground/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setShowPasswordForm(false);
        setAuthError("");
      } else {
        setAuthError("Invalid password. Access denied.");
        setPassword("");
      }
    } catch (error) {
      setAuthError("Authentication failed. Please try again.");
    }
  };

  // Session timer - auto-terminate after 30 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-terminate session
          setConnected(false);
          setConnectionStatus("Session expired (30min limit)");
          if (websocket) {
            websocket.close();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, websocket]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!terminalRef.current || !isAuthenticated) return;

    const term = new XTerm({
      theme: {
        background: "#0d1117",
        foreground: "#c9d1d9",
        cursor: "#f7768e"
      },
      fontSize: 14,
      fontFamily: '"Fira Code", "Cascadia Code", "Ubuntu Mono", monospace',
      cursorBlink: true,
      rows: 30,
      cols: 120
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    setTerminal(term);

    // Connect to real Oracle Cloud WebSocket endpoint
    const connectToOracle = () => {
      // Get WebSocket URL from environment or PR preview
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
                   `wss://${window.location.hostname.replace('pr-', 'k8s-pr-')}:8080/terminal`;

      setConnectionStatus("Connecting to Oracle Cloud...");

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setConnected(true);
          setConnectionStatus("Connected to Oracle Cloud K8s");
          setWebsocket(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'output') {
              term.write(data.content);
            } else if (data.type === 'error') {
              term.write(`\x1b[31m${data.content}\x1b[0m`);
            }
          } catch (e) {
            // Handle plain text messages
            term.write(event.data);
          }
        };

        ws.onclose = (event) => {
          setConnected(false);
          if (event.code !== 1000) {
            setConnectionStatus("Connection lost. Reconnecting...");
            setTimeout(connectToOracle, 3000);
          }
        };

        ws.onerror = () => {
          setConnected(false);
          setConnectionStatus("Failed to connect to Oracle Cloud");
        };

      } catch (error) {
        setConnected(false);
        setConnectionStatus("WebSocket connection failed");
        console.error('Connection failed:', error);
      }
    };

    // Handle terminal input - send directly to Oracle Cloud
    term.onData((data) => {
      if (websocket?.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'input',
          content: data
        }));
      }
    });

    connectToOracle();

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      if (websocket?.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows
        }));
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      websocket?.close();
      term.dispose();
    };
  }, []);

  const createEnvironment = async () => {
    setConnectionStatus("Triggering environment creation...");

    try {
      const response = await fetch('/api/playground/create-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${btoa(password)}` // Send encrypted password
        }
      });

      if (response.ok) {
        setConnectionStatus("Environment created. Connecting...");
        // Reconnect after environment is ready
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        setConnectionStatus("Failed to create environment");
      }
    } catch (error) {
      setConnectionStatus("Environment creation failed");
      console.error('Failed to create environment:', error);
    }
  };

  // Password form
  if (showPasswordForm) {
    return (
      <div className="h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="bg-[#161b22] border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Kubernetes Playground</h2>
            <p className="text-gray-400 text-sm">Enter password to access the Oracle Cloud environment</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); authenticateUser(); }} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-[#0d1117] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            {authError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!password.trim()}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              🚀 Access Playground
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500">
              <p>⚡ Resource Limits: 1 CPU, 2GB RAM</p>
              <p>⏱️ Auto-terminate: 30 minutes</p>
              <p>💰 Demo version with limited access</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-lg font-semibold">
              🚀 Kubernetes Playground - Oracle Cloud
            </h1>
            <p className="text-gray-400 text-sm">Real K8s cluster in US East (Ashburn)</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Session Timer */}
            <div className={`px-3 py-1 rounded-full text-sm font-mono ${
              sessionTimeLeft <= 300 // Last 5 minutes
                ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                : 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
            }`}>
              ⏱️ {formatTime(sessionTimeLeft)}
            </div>

            {/* Connection Status */}
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
              connected
                ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                : 'bg-red-900/30 text-red-400 border border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {connectionStatus}
            </div>

            {/* Create Environment Button */}
            {!connected && sessionTimeLeft > 0 && (
              <button
                onClick={createEnvironment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🏗️ Create K8s Environment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 p-4">
        {connected ? (
          <div ref={terminalRef} className="h-full w-full" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-xl text-white mb-2">Connecting to Oracle Cloud</h2>
              <p className="text-gray-400 mb-4">
                {connectionStatus}
              </p>

              {connectionStatus.includes("Failed") && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 max-w-md">
                  <p className="text-red-400 text-sm mb-3">
                    No active Kubernetes environment found.
                  </p>
                  <button
                    onClick={createEnvironment}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    🚀 Create New Environment
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Creates a 2-node K8s cluster in Oracle Cloud (~3-5 minutes)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {connected && (
        <div className="bg-[#161b22] border-t border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex space-x-4">
              <span>👥 Master: 10.0.1.10</span>
              <span>⚙️ Worker: 10.0.1.11</span>
              <span>🌍 Region: US East</span>
            </div>
            <div className="flex space-x-4">
              <span>⚡ Limits: 1 CPU, 2GB RAM</span>
              <span>⏱️ Auto-terminate: 30min</span>
              <span>🔒 Demo Mode</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}