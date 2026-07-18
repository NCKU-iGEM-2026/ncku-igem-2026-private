(function () {
  // 特效框圖檔還沒畫好前先留空，之後美宣畫好上傳到 static.igem.wiki 後
  // 把對應的網址填進這裡就好，其他程式邏輯都不用動。
  var FRAME_URLS = [
    null, // 特效 1
    "https://static.igem.wiki/teams/6379/wiki/filter/asiagodtone.avif", // 特效 2
    "https://static.igem.wiki/teams/6379/wiki/filter/asiagodtone2.avif", // 特效 3
    null, // 特效 4
    null  // 特效 5
  ];

  // 每個特效框圖案要畫在畫面的哪個位置、多大，數字是相對畫面的比例 (0~1)。
  // 沒有特別設定的濾鏡預設是滿版；如果某個特效框圖案本身偏大/偏小或要放在
  // 角落，改這裡對應的 x / y / width / height 就好，相機畫面不受影響。
  var FRAME_RECTS = [
    { x: 0, y: 0, width: 1, height: 1 }, // 特效 1
    { x: 0, y: 0.4, width: 0.6, height: 0.6 }, // 特效 2
    { x: 0.4, y: 0.4, width: 0.6, height: 0.7}, // 特效 3
    { x: 0, y: 0, width: 1, height: 1 }, // 特效 4
    { x: 0, y: 0, width: 1, height: 1 }  // 特效 5
  ];

  var stage, video, canvas, ctx, placeholder;
  var startBtn, shutterBtn, closeBtn, filterBtns;
  var stream = null;
  var activeFilter = 0;
  var frameImages = [];
  var rafId = null;

  function loadFrameImages() {
    FRAME_URLS.forEach(function (url, i) {
      if (!url) {
        frameImages[i] = null;
        return;
      }
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      frameImages[i] = img;
    });
  }

  function resizeCanvas() {
    canvas.width = stage.clientWidth;
    canvas.height = stage.clientHeight;
  }

  function getFrameRect(index) {
    return FRAME_RECTS[index] || FRAME_RECTS[0] || { x: 0, y: 0, width: 1, height: 1 };
  }

  function drawFrame(context, index, width, height) {
    var frame = frameImages[index];
    if (!frame || !frame.complete || !frame.naturalWidth) return;

    var rect = getFrameRect(index);
    context.drawImage(
      frame,
      rect.x * width,
      rect.y * height,
      rect.width * width,
      rect.height * height
    );
  }

  function drawLoop() {
    if (!stream) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFrame(ctx, activeFilter, canvas.width, canvas.height);
    rafId = requestAnimationFrame(drawLoop);
  }

  function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('browser does not support camera');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(function (s) {
        stream = s;
        video.srcObject = stream;
        placeholder.style.display = 'none';
        video.style.display = 'block';
        shutterBtn.disabled = false;
        startBtn.textContent = 'Stop Camera';
        resizeCanvas();
        drawLoop();
      })
      .catch(function (err) {
        alert('camera error' + err.message);
      });
  }

  function stopCamera() {
    if (rafId) cancelAnimationFrame(rafId);
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    video.style.display = 'none';
    placeholder.style.display = 'flex';
    shutterBtn.disabled = true;
    startBtn.textContent = 'Start Camera';
  }

  function toggleCamera() {
    if (stream) {
      stopCamera();
    } else {
      startCamera();
    }
  }

  function selectFilter(index) {
    activeFilter = index;
    filterBtns.forEach(function (btn, i) {
      btn.classList.toggle('active', i === index);
    });
  }

  function flashEffect() {
    stage.classList.add('webcam-flash');
    setTimeout(function () {
      stage.classList.remove('webcam-flash');
    }, 200);
  }

  function capturePhoto() {
    if (!stream) return;

    var shot = document.createElement('canvas');
    shot.width = canvas.width;
    shot.height = canvas.height;
    var shotCtx = shot.getContext('2d');

    shotCtx.save();
    shotCtx.scale(-1, 1);
    shotCtx.drawImage(video, -shot.width, 0, shot.width, shot.height);
    shotCtx.restore();

    drawFrame(shotCtx, activeFilter, shot.width, shot.height);

    flashEffect();

    var dataUrl;
    try {
      dataUrl = shot.toDataURL('image/png');
    } catch (err) {
      alert('fail to download' + err.message);
      return;
    }

    var link = document.createElement('a');
    link.download = 'ncku-tainan-photobooth.png';
    link.href = dataUrl;
    link.click();
  }

  function init() {
    stage = document.querySelector('.webcam-stage');
    if (!stage) return;

    video = stage.querySelector('.webcam-video');
    canvas = stage.querySelector('.webcam-overlay-canvas');
    placeholder = stage.querySelector('.webcam-placeholder');
    startBtn = document.querySelector('.webcam-start');
    shutterBtn = document.querySelector('.webcam-shutter');
    closeBtn = document.querySelector('.webcam-booth-close');
    filterBtns = Array.prototype.slice.call(document.querySelectorAll('.webcam-filter-btn'));

    ctx = canvas.getContext('2d');
    loadFrameImages();

    startBtn.addEventListener('click', toggleCamera);
    shutterBtn.addEventListener('click', capturePhoto);
    window.addEventListener('resize', resizeCanvas);

    filterBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { selectFilter(i); });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', stopCamera);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
