(function () {
  // 一個濾鏡一個人。name 是 static.igem.wiki 上的檔名，label 是按鈕上的字。
  // 兩者通常相同，june 是唯一的例外：檔名 june，按鈕寫 Chun。
  // 這個陣列的順序就是 team.html 裡 .webcam-filter-btn 的順序，
  // 要增減人必須兩邊一起改，否則按鈕會對到別人的圖。
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

  // 人像要畫進畫面的哪一個方框，數字是相對畫面的比例 (0~1)。
  // 圖會「等比例縮到塞得進這個方框」，再貼齊方框底部、水平置中 —— 不是拉伸填滿。
  // 這 17 張的長寬比從 0.40 (alan) 到 0.88 (leo) 都有，差了 2.2 倍，
  // 若直接拉伸填滿同一個方框，每個人被壓扁的程度都不一樣。
  var FRAME_RECT = { x: 0.02, y: 0.06, width: 0.46, height: 0.94 };

  // 三個站位：預設的左側，與它左右對稱的右側，以及置中。
  // 三者只差水平位置，高度與大小都沿用 FRAME_RECT，所以之後要把人像調大調小
  // 或上下挪動，只要改 FRAME_RECT 一處，三個站位會一起跟著動。
  function standing(x) {
    return { x: x, y: FRAME_RECT.y, width: FRAME_RECT.width, height: FRAME_RECT.height };
  }
  var RIGHT = 1 - FRAME_RECT.width - FRAME_RECT.x;
  var CENTRE = (1 - FRAME_RECT.width) / 2;

  // 個別站位。鍵用檔名，不是按鈕上的字（所以是 june 不是 chun）。
  // 沒有列在這裡的人就是預設的左側。
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

    // 等比例縮到塞得進方框（contain），再貼齊方框底部、水平置中。
    // 這些是站姿的去背人像，底部對齊才會像站在畫面裡，而不是浮在半空。
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

    // 預覽是 object-fit: cover（等比例放大填滿、裁掉多的），存檔也要照同一套裁法。
    // 以前直接把整段影像拉伸成 canvas 的大小：桌機鏡頭剛好 16:9 看不出來，
    // 但手機前鏡頭是 4:3 或直式，存下來的照片會整個被壓扁。
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

    // 網頁沒辦法直接寫進手機相簿，只能透過系統的分享選單：
    // iOS 選「儲存影像」就會進「照片」，Android 可以分享到相簿 / Google 相簿。
    // 所以只有觸控裝置、而且瀏覽器能分享檔案時，才顯示「Save to Photos」。
    // 不能分享的手機（舊版瀏覽器）就提示長按照片，iOS 與 Android 長按圖片都能存。
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
    // Firefox 只認得已經放進文件裡的連結。
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function savePhoto() {
    if (!shotFile) return;
    // 必須在點擊當下直接呼叫 share，中間不能先 await 別的東西，
    // 否則 iOS 會認定不是使用者觸發而拒絕。只放檔案、不帶文字，
    // 帶了文字 iOS 的分享選單會少掉「儲存影像」。
    navigator.share({ files: [shotFile] }).catch(function (err) {
      // 使用者自己關掉分享選單是 AbortError，不用處理。
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
