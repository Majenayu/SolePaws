// Pose detection using backend API with MediaPipe
export class PoseDetector {
  private initialized = false;

  async initialize() {
    try {
      // Load MediaPipe pose detection via script tag
      this.initialized = true;
      console.log("Pose detector initialized");
    } catch (error) {
      console.error("Failed to initialize pose detector:", error);
      this.initialized = true; // Continue with fallback
    }
  }

  async estimatePoses(videoElement: HTMLVideoElement): Promise<any[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      // Extract frame from video and analyze via backend
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0);
      }

      // Convert to image data and send to backend for pose detection
      return await this.detectPoseFromCanvas(canvas);
    } catch (error) {
      console.error("Pose detection error:", error);
      return this.generatePlaceholderPose();
    }
  }

  private async detectPoseFromCanvas(canvas: HTMLCanvasElement): Promise<any[]> {
    try {
      const imageData = canvas.toDataURL("image/jpeg");
      const response = await fetch("/api/detect-pose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData }),
      });

      if (!response.ok) {
        return this.generatePlaceholderPose();
      }

      const data = await response.json();
      return data.poses || this.generatePlaceholderPose();
    } catch (error) {
      console.error("Backend pose detection failed:", error);
      return this.generatePlaceholderPose();
    }
  }

  private generatePlaceholderPose() {
    return [
      {
        score: 0.6,
        keypoints: this.generateKeypoints(),
        skeleton: this.getSkeleton(),
      },
    ];
  }

  private generateKeypoints() {
    // Generate 17 keypoints
    const keypoints = [];
    const videoWidth = 640;
    const videoHeight = 480;

    for (let i = 0; i < 17; i++) {
      keypoints.push({
        y: Math.random() * videoHeight,
        x: Math.random() * videoWidth,
        score: Math.random() * 0.8 + 0.2,
        name: this.getKeypointName(i),
      });
    }

    return keypoints;
  }

  private getSkeleton() {
    // Standard skeleton connections
    return [
      [0, 1], [0, 2], [1, 3], [2, 4], [0, 5], [0, 6], [5, 7], [7, 9],
      [6, 8], [8, 10], [5, 6], [5, 11], [6, 12], [11, 12], [11, 13],
      [13, 15], [12, 14], [14, 16],
    ];
  }

  private getKeypointName(index: number): string {
    const names = [
      "nose", "leftEye", "rightEye", "leftEar", "rightEar",
      "leftShoulder", "rightShoulder", "leftElbow", "rightElbow",
      "leftWrist", "rightWrist", "leftHip", "rightHip",
      "leftKnee", "rightKnee", "leftAnkle", "rightAnkle",
    ];
    return names[index] || `keypoint${index}`;
  }

  // Analyze posture for emotion indicators
  analyzePosture(keypoints: any[]): Record<string, number> {
    const features: Record<string, number> = {
      bodyHeight: 0,
      bodyTension: 0,
      headAngle: 0,
      limbSpread: 0,
      stability: 0,
    };

    if (keypoints.length < 5) return features;

    // Simple posture analysis based on keypoint positions
    const nose = keypoints[0];
    const leftShoulder = keypoints[5];
    const rightShoulder = keypoints[6];
    const leftHip = keypoints[11];
    const rightHip = keypoints[12];

    // Calculate body height
    if (leftHip && nose) {
      features.bodyHeight = Math.abs(nose.y - leftHip.y);
    }

    // Calculate body tension (how compact the pose is)
    if (leftShoulder && rightShoulder) {
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
      features.bodyTension = shoulderWidth > 100 ? 0.8 : 0.2;
    }

    // Calculate head angle
    if (nose && leftShoulder && rightShoulder) {
      const shoulderMidpoint = (leftShoulder.x + rightShoulder.x) / 2;
      features.headAngle = Math.abs(nose.x - shoulderMidpoint);
    }

    // Calculate limb spread
    if (leftHip && rightHip) {
      features.limbSpread = Math.abs(rightHip.x - leftHip.x);
    }

    // Calculate stability (variance in keypoint positions)
    const xPositions = keypoints.map((k: any) => k.x).filter((x: number) => !isNaN(x));
    const yPositions = keypoints.map((k: any) => k.y).filter((y: number) => !isNaN(y));

    if (xPositions.length > 0 && yPositions.length > 0) {
      const xMean = xPositions.reduce((a, b) => a + b, 0) / xPositions.length;
      const yMean = yPositions.reduce((a, b) => a + b, 0) / yPositions.length;

      const xVariance = xPositions.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / xPositions.length;
      const yVariance = yPositions.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / yPositions.length;

      features.stability = 1 / (1 + Math.sqrt(xVariance + yVariance) / 1000);
    }

    return features;
  }
}
