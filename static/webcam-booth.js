(function () {
  // 特效框圖檔還沒畫好前先留空，之後美萱畫好上傳到 static.igem.wiki 後
  // 把對應的網址填進這裡就好，其他程式邏輯都不用動。
  var FRAME_URLS = [
    null, // 特效 1
    null, // 特效 2
    null, // 特效 3
    null, // 特效 4
    null  // 特效 5
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
      img.src = url;
      frameImages[i] = img;
    });
  }

  function resizeCanvas() {
    canvas.width = stage.clientWidth;
    canvas.height = stage.clientHeight;
  }

  function drawLoop() {
    if (!stream) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var frame = frameImages[activeFilter];
    if (frame && frame.complete && frame.naturalWidth) {
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    }

    rafId = requestAnimationFrame(drawLoop);
  }

  function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('這個瀏覽器不支援相機功能');
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
        alert('無法開啟相機：' + err.message);
      });
  }

  function stopCamera() {
    if (rafId) cancelAnimationFrame(rafId);
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
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

    var frame = frameImages[activeFilter];
    if (frame && frame.complete && frame.naturalWidth) {
      shotCtx.drawImage(frame, 0, 0, shot.width, shot.height);
    }

    flashEffect();

    var link = document.createElement('a');
    link.download = 'ncku-tainan-photobooth.png';
    link.href = shot.toDataURL('image/png');
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
