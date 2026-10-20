(function () {
  var FILTERS = [
    { name: "alan",   label: "Alan" },
    { name: "alston", label: "Alston" },
    { name: "cindy",  label: "Cindy" },
    { name: "hank",   label: "Hank" },
    { name: "jason",  label: "Jason" },
    { name: "jenny",  label: "Jenny" },
    { name: "joy",    label: "Joy" },
    { name: "june",   label: "Chun" },
    { name: "leo",    label: "Leo" },
    { name: "luna",   label: "Luna" },
    { name: "mella",  label: "Mella" },
    { name: "miklos", label: "Miklos" },
    { name: "ryan",   label: "Ryan" },
    { name: "simon",  label: "Simon" },
    { name: "vane",   label: "Vane" },
    { name: "will",   label: "Will" },
    { name: "willy",  label: "Willy" }
  ];

  var FRAME_BASE = "https://static.igem.wiki/teams/6379/wiki/photobooth/";

  var FRAME_RECT = { x: 0.02, y: 0.06, width: 0.46, height: 0.94 };

  function standing(x) {
    return { x: x, y: FRAME_RECT.y, width: FRAME_RECT.width, height: FRAME_RECT.height };
  }
  var RIGHT = 1 - FRAME_RECT.width - FRAME_RECT.x;
  var CENTRE = (1 - FRAME_RECT.width) / 2;

  var FRAME_RECT_BY_NAME = {
    alston: standing(RIGHT),
    jason:  standing(RIGHT),
    leo:    standing(RIGHT),
    mella:  standing(RIGHT),
    miklos: standing(RIGHT),
    simon:  standing(RIGHT),
    vane:   standing(RIGHT),
    ryan:   standing(CENTRE)
  };

  var stage, video, canvas, ctx, placeholder;
  var startBtn, shutterBtn, closeBtn, filterBtns;
  var review, reviewImg, reviewHint, retakeBtn, saveBtn, downloadBtn;
  var stream = null;
  // 剛拍的那張：預覽用的 blob URL，以及分享到相簿用的 File。
  var shotUrl = null;
  var shotFile = null;
  var activeFilter = 0;
  var frameImages = [];
  var rafId = null;

  function loadFrameImages() {
    FILTERS.forEach(function (f, i) {
      var img = new Image();
      // 拍照時要把這張圖畫進 canvas 再 toBlob，跨網域的圖沒有這一行會
      // 污染 canvas，存檔那一步就會丟 SecurityError。
      img.crossOrigin = 'anonymous';
      img.src = FRAME_BASE + f.name + '.avif';
      frameImages[i] = img;
    });
  }

  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = stage.clientWidth * dpr;
    canvas.height = stage.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getFrameRect(index) {
    var f = FILTERS[index];
    return (f && FRAME_RECT_BY_NAME[f.name]) || FRAME_RECT;
  }

  function drawFrame(context, index, width, height) {
    var frame = frameImages[index];
    if (!frame || !frame.complete || !frame.naturalWidth) return;

    var rect = getFrameRect(index);
    var boxX = rect.x * width;
    var boxY = rect.y * height;
    var boxW = rect.width * width;
    var boxH = rect.height * height;

    var scale = Math.min(boxW / frame.naturalWidth, boxH / frame.naturalHeight);
    var drawW = frame.naturalWidth * scale;
    var drawH = frame.naturalHeight * scale;

    context.drawImage(
      frame,
      boxX + (boxW - drawW) / 2,
      boxY + (boxH - drawH),
      drawW,
      drawH
    );
  }

  function drawLoop() {
    if (!stream) return;
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    ctx.clearRect(0, 0, w, h);
    drawFrame(ctx, activeFilter, w, h);
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
    hideReview();
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

    var vw = video.videoWidth || shot.width;
    var vh = video.videoHeight || shot.height;
    var cover = Math.max(shot.width / vw, shot.height / vh);
    var drawW = vw * cover;
    var drawH = vh * cover;

    shotCtx.save();
    shotCtx.translate(shot.width, 0);
    shotCtx.scale(-1, 1);
    shotCtx.drawImage(video, (shot.width - drawW) / 2, (shot.height - drawH) / 2, drawW, drawH);
    shotCtx.restore();

    drawFrame(shotCtx, activeFilter, shot.width, shot.height);

    flashEffect();

    try {
      shot.toBlob(function (blob) {
        if (!blob) {
          alert('fail to save photo');
          return;
        }
        showReview(blob);
      }, 'image/png');
    } catch (err) {
      alert('fail to save photo ' + err.message);
    }
  }

  function photoName() {
    // 檔名帶拍照時間，連拍好幾張才不會互相覆蓋。
    var d = new Date();
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return 'ncku-tainan-photobooth-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
      '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.png';
  }

  function showReview(blob) {
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shotUrl = URL.createObjectURL(blob);
    shotFile = new File([blob], photoName(), { type: 'image/png' });
    reviewImg.src = shotUrl;

    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var canShare = !!(navigator.canShare && navigator.canShare({ files: [shotFile] }));
    saveBtn.hidden = !(touch && canShare);
    reviewHint.hidden = !(touch && !canShare);

    review.hidden = false;
    shutterBtn.disabled = true;
  }

  function hideReview() {
    if (!review) return;
    review.hidden = true;
    shutterBtn.disabled = !stream;
  }

  function downloadPhoto() {
    if (!shotUrl) return;
    var link = document.createElement('a');
    link.download = shotFile.name;
    link.href = shotUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function savePhoto() {
    if (!shotFile) return;
    navigator.share({ files: [shotFile] }).catch(function (err) {
      if (err.name !== 'AbortError') downloadPhoto();
    });
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
    review = stage.querySelector('.webcam-review');
    reviewImg = review.querySelector('.webcam-review-img');
    reviewHint = review.querySelector('.webcam-review-hint');
    retakeBtn = review.querySelector('.webcam-retake');
    saveBtn = review.querySelector('.webcam-save');
    downloadBtn = review.querySelector('.webcam-download');

    ctx = canvas.getContext('2d');
    loadFrameImages();

    startBtn.addEventListener('click', toggleCamera);
    shutterBtn.addEventListener('click', capturePhoto);
    retakeBtn.addEventListener('click', hideReview);
    saveBtn.addEventListener('click', savePhoto);
    downloadBtn.addEventListener('click', downloadPhoto);
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
