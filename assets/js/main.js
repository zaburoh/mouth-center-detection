import '../css/style.css';
import { FaceDetectionCamera } from './faceDetectionCamera';

/**
 * FaceDetectionCameraクラスのインスタンス
 * @type {FaceDetectionCamera}
 */
let faceDetectionCamera = null;

const main = async () => {
  const app = document.querySelector('#app');
  // title
  const title = document.createElement('h1');
  title.textContent = 'Mouth Center Detection';
  app.append(title);

  // canvas container
  const canvasContainer = document.createElement('div');
  canvasContainer.id = 'CanvasContainer';
  canvasContainer.classList.add('canvas-container');
  app.append(canvasContainer);

  // 検出状態を表示する要素
  app.append(drawStatusElements());

  // canvasとvideoタグをcanvasContainerに追加
  faceDetectionCamera = new FaceDetectionCamera(canvasContainer);
  // detectorのロード
  await faceDetectionCamera.start();

  // カメラの使用許可
  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Cameraとvideoタグの紐づけ
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user'}, audio: false })
      .then(function(stream) {
        faceDetectionCamera.video.srcObject = stream;
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
        alert('カメラの使用を許可してください。');
      });
  } else {
    alert('ブラウザが対応していません。');
  }
  
  render();
}

/**
 * 描画処理
 */ 
const render = async () => {
  faceDetectionCamera.drawVideo();
  await faceDetectionCamera.renderPrediction();
  const [x, y, size] = await faceDetectionCamera.getMouthCenter();
  drawResult(x, y, size);
  drawMouthCenter(x, y, size);
  window.requestAnimationFrame(render);
}

/**
 * 検出結果の描画
 * @param {number} x 口の中心のx座標
 * @param {number} y 口の中心のy座標
 * @param {number} size 口の大きさ
 * @example
 * drawResult(100, 200, 300);
 * // => <dl id="status" class="status">
 * //      <dt>x:</dt>
 * //      <dd>100</dd>
 * //      <dt>y:</dt>
 * //      <dd>200</dd>
 * //      <dt>size:</dt>
 * //      <dd>300</dd>
 * //    </dl>
 */
const drawResult = (x, y, size) => {
  const result = document.querySelector('#status');
  const xValue = result.querySelector('dd:nth-child(2)');
  const yValue = result.querySelector('dd:nth-child(4)');
  const sizeValue = result.querySelector('dd:nth-child(6)');
  xValue.textContent = x;
  yValue.textContent = y;
  sizeValue.textContent = size;
}

/**
 * 口をcanvasに描画
 * @param {number} x 口の中心のx座標
 * @param {number} y 口の中心のy座標
 * @param {number} size 口の大きさ
 */ 
const drawMouthCenter = (x, y, size) => {
  faceDetectionCamera.ctx.beginPath();
  faceDetectionCamera.ctx.arc(x, y, size, 0, 2 * Math.PI);
  faceDetectionCamera.ctx.stroke();
}

/**
 * 検出状態の表示
 * @returns {HTMLDivElement} 検出状態の表示
 * @example
 * const status = drawStatusElements();
 * document.body.append(status);
 * // => <div id="status" class="status">
 * //      <dl>
 * //        <dt>x:</dt>
 * //        <dd>0</dd>
 * //        <dt>y:</dt>
 * //        <dd>0</dd>
 * //        <dt>size:</dt>
 * //        <dd>0</dd>
 * //      </dl>
 * //    </div>
 */
const drawStatusElements = () => {
  const status = document.createElement('div');
  status.id = 'status';
  status.classList.add('status');
  const dl = document.createElement('dl');
  const x = document.createElement('dt');
  x.textContent = 'x:';
  const xValue = document.createElement('dd');
  xValue.textContent = '0';
  const y = document.createElement('dt');
  y.textContent = 'y:';
  const yValue = document.createElement('dd');
  yValue.textContent = '0';
  const size = document.createElement('dt');
  size.textContent = 'size:';
  const sizeValue = document.createElement('dd');
  sizeValue.textContent = '0';
  dl.append(x);
  dl.append(xValue);
  dl.append(y);
  dl.append(yValue);
  dl.append(size);
  dl.append(sizeValue);
  status.append(dl);
  return status;
}

main();