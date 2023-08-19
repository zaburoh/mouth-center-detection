// face-landmarks-detection
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/face_mesh';

const MOUTH_MIN_SIZE = 0;

export class FaceDetectionCamera {
  /**
   * viddeoタグとcanvasタグを生成
   * @param {HTMLElement} canvasContainer videoタグとcanvasタグを追加する親要素
   */
  constructor(canvasContainer) {
    // canvasタグ
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'canvas';
    this.ctx = this.canvas.getContext('2d');

    // videoタグ
    this.video = document.createElement('video');
    this.video.id = 'video';
    this.video.textContent = 'Video stream not available.';
    this.video.setAttribute('autoplay', ''); // スマホだと警告でる
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('muted', '');
    this.video.display = 'none';

    this.faces = [];
    // 検出オプション
    this.estimationConfig = { flipHorizontal: false };

    // append
    canvasContainer.append(this.canvas);
    canvasContainer.append(this.video);
  }

  async start() {
    this.detector = await this.getDetector();
  }

  /**
   * detectorのロード
   * @returns {Promise} detector
   * @example
   * const detector = await faceDetectionCamera.getDetector();
   * const faces = await detector.estimateFaces(video, estimationConfig);
   */
  async getDetector() {
    // face landmark detection
    console.log('model loading...');
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    // - tfjs
    // const detectorConfig = {
    //   runtime: 'tfjs',
    //   refineLandmarks: true,
    // };
    // - mediapipe
    const detectorConfig = {
      runtime: 'mediapipe',
      // CDN
      // solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
      // LOCAL
      solutionPath: 'node_modules/@mediapipe/face_mesh',
    }
    const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    console.log('model loading complete.');

    return detector;
  }

  /**
   * videoタグの内容をcanvasタグに描画
   */
  drawVideo() {
    // canvasサイズの更新
    this.scaleX = this.canvas.width / this.video.videoWidth;
    this.scaleY = this.canvas.height / this.video.videoHeight;
    
    this.ctx.drawImage(
      this.video, 
      0, 0, this.video.videoWidth, this.video.videoHeight,
      0, 0, this.canvas.width, this.canvas.height
    );
  }

  /**
   * 顔検出
   * @returns {Promise<Array>} 顔の情報
   * @example
   * const faces = await faceDetectionCamera.renderPrediction();
   */
  async renderPrediction() {
    // videoの準備ができているか確認
    if (this.video.readyState < 2) {
      await new Promise((resolve) => {
        video.onloadeddata = () => {
          resolve(video);
        };
      });
    }

    // 顔検出
    this.faces = await this.detector.estimateFaces(this.video, this.estimationConfig);
    return this.faces;
  }

  /**
   * detectorの存在確認
   * @returns {boolean} detectorの存在確認
   * @example
   * if (faceDetectionCamera.existDetector()) {
   *  // detectorが存在する場合の処理
   * }  
   */
  existDetector() {
    return this.detector != null;
  }

  /**
   * 口の中心のx, y座標と口の開き具合を返す
   * @param {Array} path label'lips' のpath配列
   * @returns 口の中心のx, y座標と口の開き具合
   */
  _getMouthCenter(path) {
    const innerLowerLip = path[25]
    const innerUpperLip = path[35]

    const openMouthSize = innerLowerLip[1] - innerUpperLip[1];
    const y = innerLowerLip[1] - openMouthSize / 2;

    return [innerLowerLip[0], y, openMouthSize < MOUTH_MIN_SIZE ? MOUTH_MIN_SIZE : openMouthSize];
  }
  
  /**
   * videoとcanvasのスケール差を合わせて口の中心のx, y座標と口の開き具合を返す
   * @returns {[number, number, number]} [x座標, y座標, openMouthSize]
   * @example
   * const [x, y, size] = await faceDetectionCamera.getMouthCenter();
   */
  getMouthCenter() {
    const face = this.faces[0];
    if(face == undefined) return [0, 0, 0];
    // videoとcanvasのスケール差を合わせる
    const keypoints = face.keypoints.map((keypoint) => [keypoint.x*this.scaleX, keypoint.y*this.scaleY]);
    const contours = faceLandmarksDetection.util
      .getKeypointIndexByContour(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh);

    for (const [label, contour] of Object.entries(contours)) {
      this.ctx.strokeStyle = '#E0E0E0';
      this.ctx.lineWidth = 1;

      const path = contour.map((index) => keypoints[index]);
      if (path.every(value => value != undefined)) {
        // lips以外にも取得できる要素はあるが、今回はlipsのみ使用        
        switch(label) {
          case 'lips':
            return this._getMouthCenter(path);
            break;
          default:
            break;
        }
      }
    }
    return [0, 0, 0];
  }
}