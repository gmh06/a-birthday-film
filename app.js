(() => {
  "use strict";

  const frame = document.getElementById("frame");
  const video = document.getElementById("player");
  const cover = document.getElementById("cover");
  const playToggle = document.getElementById("playToggle");
  const mute = document.getElementById("mute");
  const fullscreen = document.getElementById("fullscreen");
  const seek = document.getElementById("seek");
  const scrub = document.getElementById("scrub");
  const fill = document.getElementById("fill");
  const buffer = document.getElementById("buffer");
  const currentEl = document.getElementById("current");
  const durationEl = document.getElementById("duration");
  const errorEl = document.getElementById("videoError");

  const FALLBACK_DURATION = 447.633;
  let hideTimer = 0;
  let isScrubbing = false;
  let resumeAfterScrub = false;

  const pad = (value) => String(Math.floor(value)).padStart(2, "0");

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    return `${pad(seconds / 60)}:${pad(seconds % 60)}`;
  }

  function getDuration() {
    return Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : FALLBACK_DURATION;
  }

  function setProgress(ratio) {
    const clamped = Math.min(1, Math.max(0, ratio));
    fill.style.width = `${clamped * 100}%`;
    scrub.style.setProperty("--p", clamped);
    seek.value = String(Math.round(clamped * 1000));
    seek.setAttribute(
      "aria-valuetext",
      `${formatTime(video.currentTime)} / ${formatTime(getDuration())}`
    );
  }

  function updateTime() {
    const duration = getDuration();
    currentEl.textContent = formatTime(video.currentTime);
    durationEl.textContent = formatTime(duration);
    setProgress(video.currentTime / duration);
  }

  function updateBuffer() {
    if (!video.buffered.length) return;
    const end = video.buffered.end(video.buffered.length - 1);
    buffer.style.width = `${Math.min(100, (end / getDuration()) * 100)}%`;
  }

  function scheduleHide() {
    window.clearTimeout(hideTimer);
    if (video.paused || video.ended) return;
    hideTimer = window.setTimeout(() => {
      if (!video.paused && !isScrubbing) {
        frame.classList.add("is-idle");
      }
    }, 2600);
  }

  function showControls() {
    frame.classList.remove("is-idle");
    scheduleHide();
  }

  function startPlayback() {
    cover.classList.add("is-hidden");
    frame.classList.add("is-started");
    const promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {
        cover.classList.remove("is-hidden");
        frame.classList.remove("is-playing");
      });
    }
  }

  function togglePlayback() {
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0;
      startPlayback();
    } else {
      video.pause();
    }
  }

  function toggleFullscreen() {
    const doc = document;
    const fullscreenElement = doc.fullscreenElement || doc.webkitFullscreenElement;

    if (fullscreenElement === frame) {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
      if (exit) exit.call(doc);
      return;
    }

    if (frame.requestFullscreen) {
      frame.requestFullscreen().catch(() => {});
    } else if (frame.webkitRequestFullscreen) {
      frame.webkitRequestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  }

  /* ---------- cover / play ---------- */

  cover.addEventListener("click", startPlayback);

  video.addEventListener("play", () => {
    frame.classList.add("is-playing");
    frame.classList.remove("is-idle");
    cover.classList.add("is-hidden");
    scheduleHide();
  });

  video.addEventListener("pause", () => {
    frame.classList.remove("is-playing");
    frame.classList.remove("is-idle");
    window.clearTimeout(hideTimer);
  });

  video.addEventListener("ended", () => {
    frame.classList.remove("is-playing");
    frame.classList.remove("is-idle");
    currentEl.textContent = formatTime(getDuration());
    setProgress(1);
  });

  playToggle.addEventListener("click", togglePlayback);

  frame.addEventListener("click", (event) => {
    if (
      event.target.closest(".controls") ||
      event.target.closest(".cover") ||
      event.target.closest(".video-error")
    ) {
      return;
    }
    togglePlayback();
  });

  frame.addEventListener("mousemove", showControls);
  frame.addEventListener("pointerdown", showControls, { passive: true });
  frame.addEventListener("mouseleave", () => {
    if (!video.paused) frame.classList.add("is-idle");
  });

  /* ---------- seeking ---------- */

  seek.addEventListener("pointerdown", () => {
    isScrubbing = true;
    resumeAfterScrub = !video.paused;
    window.clearTimeout(hideTimer);
    frame.classList.remove("is-idle");
  });

  const endScrub = () => {
    if (!isScrubbing) return;
    isScrubbing = false;
    if (resumeAfterScrub && video.paused) {
      startPlayback();
    } else {
      scheduleHide();
    }
    resumeAfterScrub = false;
  };

  seek.addEventListener("pointerup", endScrub);
  seek.addEventListener("pointercancel", endScrub);
  window.addEventListener("pointerup", endScrub);

  seek.addEventListener("input", () => {
    const duration = getDuration();
    const next = (Number(seek.value) / 1000) * duration;
    if (Number.isFinite(next)) {
      video.currentTime = Math.min(duration, Math.max(0, next));
    }
    setProgress(Number(seek.value) / 1000);
  });

  /* ---------- media events ---------- */

  video.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(getDuration());
    updateTime();
    updateBuffer();
  });

  video.addEventListener("durationchange", () => {
    durationEl.textContent = formatTime(getDuration());
    updateTime();
  });

  video.addEventListener("timeupdate", () => {
    updateTime();
    updateBuffer();
  });

  video.addEventListener("progress", updateBuffer);
  video.addEventListener("canplay", updateBuffer);

  video.addEventListener("error", () => {
    errorEl.hidden = false;
    cover.classList.add("is-hidden");
    frame.classList.add("is-started");
    frame.classList.remove("is-playing");
  });

  /* ---------- sound ---------- */

  mute.addEventListener("click", () => {
    video.muted = !video.muted;
    frame.classList.toggle("is-muted", video.muted);
    mute.setAttribute("aria-label", video.muted ? "取消静音" : "静音");
  });

  /* ---------- fullscreen ---------- */

  fullscreen.addEventListener("click", toggleFullscreen);

  const syncFullscreenClass = () => {
    const active =
      document.fullscreenElement === frame ||
      document.webkitFullscreenElement === frame;
    frame.classList.toggle("is-fullscreen", active);
  };

  document.addEventListener("fullscreenchange", syncFullscreenClass);
  document.addEventListener("webkitfullscreenchange", syncFullscreenClass);
  video.addEventListener("webkitendfullscreen", () => {
    frame.classList.remove("is-fullscreen");
  });

  /* ---------- keyboard ---------- */

  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (event.code === "Space" || event.key === " ") {
      if (tag === "BUTTON" || tag === "A") return;
      event.preventDefault();
      togglePlayback();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const step = event.key === "ArrowLeft" ? -5 : 5;
      video.currentTime = Math.min(
        getDuration(),
        Math.max(0, video.currentTime + step)
      );
      showControls();
      return;
    }

    if (event.key === "m" || event.key === "M") {
      mute.click();
      return;
    }

    if (event.key === "f" || event.key === "F") {
      toggleFullscreen();
    }
  });

  /* ---------- small courtesies ---------- */

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !video.paused) video.pause();
  });

  window.addEventListener("pagehide", () => {
    window.clearTimeout(hideTimer);
  });

  updateTime();
})();
