import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

export class PoseDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private initialized = false;

  async initialize() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 2,
        minPoseDetectionConfidence: 0.3,
        minPosePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3
      });
      
      this.initialized = true;
      console.log("MediaPipe Pose Landmarker initialized successfully");
    } catch (error) {
      console.error("Failed to initialize MediaPipe pose detector:", error);
      this.initialized = false;
    }
  }

  async estimatePoses(videoElement: HTMLVideoElement): Promise<any[]> {
    if (!this.initialized || !this.poseLandmarker) {
      return [];
    }

    try {
      const startTimeMs = performance.now();
      const results = this.poseLandmarker.detectForVideo(videoElement, startTimeMs);
      
      if (!results || !results.landmarks || results.landmarks.length === 0) {
        return [];
      }

      // Convert MediaPipe landmarks to our format
      const poses = results.landmarks.map((landmarks, idx) => {
        const keypoints = landmarks.map((landmark, keypointIdx) => ({
          x: landmark.x * (videoElement.videoWidth || 640),
          y: landmark.y * (videoElement.videoHeight || 480),
          z: landmark.z || 0,
          score: landmark.visibility || 0.5,
          name: this.getKeypointName(keypointIdx)
        }));

        return {
          score: results.worldLandmarks?.[idx]?.[0]?.visibility || 0.7,
          keypoints,
          skeleton: this.getSkeleton()
        };
      });

      return poses;
    } catch (error) {
      console.error("Pose detection error:", error);
      return [];
    }
  }

  private getSkeleton(): Array<[number, number]> {
    // MediaPipe Pose connections for skeleton visualization
    return [
      // Face
      [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
      // Torso
      [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
      [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
      // Body
      [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [27, 31],
      [24, 26], [26, 28], [28, 30], [28, 32]
    ];
  }

  private getKeypointName(index: number): string {
    const names = [
      "nose", "leftEyeInner", "leftEye", "leftEyeOuter", "rightEyeInner",
      "rightEye", "rightEyeOuter", "leftEar", "rightEar", "mouthLeft",
      "mouthRight", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow",
      "leftWrist", "rightWrist", "leftPinky", "rightPinky", "leftIndex",
      "rightIndex", "leftThumb", "rightThumb", "leftHip", "rightHip",
      "leftKnee", "rightKnee", "leftAnkle", "rightAnkle", "leftHeel",
      "rightHeel", "leftFootIndex", "rightFootIndex"
    ];
    return names[index] || `keypoint${index}`;
  }

  analyzePosture(keypoints: any[]): Record<string, number> {
    const features: Record<string, number> = {
      bodyHeight: 0,
      bodyTension: 0,
      headAngle: 0,
      limbSpread: 0,
      stability: 0,
    };

    if (keypoints.length < 23) return features;

    const nose = keypoints[0];
    const leftShoulder = keypoints[11];
    const rightShoulder = keypoints[12];
    const leftHip = keypoints[23];
    const rightHip = keypoints[24];

    if (leftHip && nose) {
      features.bodyHeight = Math.abs(nose.y - leftHip.y);
    }

    if (leftShoulder && rightShoulder) {
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
      features.bodyTension = shoulderWidth > 100 ? 0.8 : 0.2;
    }

    if (nose && leftShoulder && rightShoulder) {
      const shoulderMidpoint = (leftShoulder.x + rightShoulder.x) / 2;
      features.headAngle = Math.abs(nose.x - shoulderMidpoint);
    }

    if (leftHip && rightHip) {
      features.limbSpread = Math.abs(rightHip.x - leftHip.x);
    }

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
