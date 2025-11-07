import { NextRequest, NextResponse } from "next/server";

// Check if environment already exists (mock implementation)
async function checkExistingEnvironments(): Promise<number> {
  // In a real implementation, this would check Oracle Cloud for running instances
  // For demo, we'll simulate checking
  return 0; // Allow creation for demo
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const encodedPassword = authHeader.split(' ')[1];
    const password = atob(encodedPassword);

    if (password !== "rishimondal") {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Check if environment already exists (prevent multiple concurrent environments)
    const existingEnvs = await checkExistingEnvironments();
    if (existingEnvs > 0) {
      return NextResponse.json(
        { error: "Environment already exists. Please wait for termination." },
        { status: 429 }
      );
    }

    // Trigger GitHub Action to create Oracle Cloud K8s environment
    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = "kubestellar";
    const repoName = "docs";

    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/ci-with-preview.yaml/dispatches`,
      {
        method: "POST",
        headers: {
          "Authorization": `token ${githubToken}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            create_playground: "true",
            auto_terminate_minutes: "30"
          }
        }),
      }
    );

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Environment creation triggered",
        workflow_url: `https://github.com/${repoOwner}/${repoName}/actions/workflows/k8s-playground-deploy.yaml`
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to trigger workflow", details: errorText },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error("Error triggering environment creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}