import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  // Simple static response - environment is always available in PR preview
  return NextResponse.json({
    success: true,
    message: "Environment ready",
    websocket_url: `wss://${process.env.PLAYGROUND_HOST || 'playground.preview.kubestellar.io'}:8080/terminal`
  });
}