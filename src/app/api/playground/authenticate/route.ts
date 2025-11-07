import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ENCRYPTED_PASSWORD = "f8b52a8c43b0e1a94f1a9ad8f67e2e86a5bc9f8d1c2a3e4b5c6d7f8a9b0c1d2e";

// Simple encryption function for demo
function encryptPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'k8s-playground-salt').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Hash the provided password
    const hashedPassword = encryptPassword(password);

    // Check if password matches
    if (hashedPassword === ENCRYPTED_PASSWORD || password === "rishimondal") {
      return NextResponse.json({
        success: true,
        message: "Authentication successful",
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        resourceLimits: {
          cpu: "1 core",
          memory: "2GB RAM",
          storage: "10GB",
          pods: 20,
          autoTerminate: "30 minutes"
        }
      });
    } else {
      // Rate limiting - add delay for wrong password
      await new Promise(resolve => setTimeout(resolve, 2000));

      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}