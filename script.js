(() => {
  const gate = document.getElementById("gate");
  const main = document.getElementById("main");
  const openWish = document.getElementById("openWish");
  const gift = document.getElementById("gift");
  const celebrate = document.getElementById("celebrate");
  const sendHeart = document.getElementById("sendHeart");
  const heroVideos = [...document.querySelectorAll(".hero__video")];
  const lightbox = document.getElementById("lightbox");
  const lightboxVideo = document.getElementById("lightboxVideo");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeLightbox = document.getElementById("closeLightbox");
  const canvas = document.getElementById("sparkles");
  const ctx = canvas.getContext("2d");
  const cursorGlow = document.getElementById("cursorGlow");
  const progress = document.getElementById("progress");
  const filmstrip = document.getElementById("filmstrip");
  const surprise = document.getElementById("surprise");
  const flame = document.getElementById("flame");
  const flameBtn = document.getElementById("flameBtn");
  const cake = document.getElementById("cake");
  const candleStatus = document.getElementById("candleStatus");
  const candleWish = document.getElementById("candleWish");
  const gateHearts = document.getElementById("gateHearts");
  const gateSub = document.getElementById("gateSub");

  let heroIndex = 0;
  let particles = [];
  let burstParticles = [];
  let heartsSent = 0;
  let openedReasons = 0;
  let typingStarted = false;
  let typingSkipped = false;
  let autoScrollId = null;
  let blowHold = null;
  let opened = false;

  const isTouch = matchMedia("(pointer: coarse)").matches;
  if (isTouch) document.body.classList.add("is-touch");

  /* ---------- Gate floating hearts ---------- */
  function spawnGateHeart() {
    if (!gateHearts) return;
    const heart = document.createElement("span");
    heart.textContent = Math.random() > 0.5 ? "♥" : "✦";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${0.8 + Math.random() * 1.2}rem`;
    heart.style.animationDuration = `${4 + Math.random() * 5}s`;
    gateHearts.appendChild(heart);
    setTimeout(() => heart.remove(), 9000);
  }
  const gateHeartTimer = setInterval(spawnGateHeart, 450);

  const rotatingLines = [
    "Tap the gift — a little birthday smile is waiting for you.",
    "Made with love, just for Siddhi.",
    "Cute clips, warm wishes, and lots of hearts.",
  ];
  let lineIndex = 0;
  setInterval(() => {
    if (!gateSub || gate.classList.contains("is-gone")) return;
    lineIndex = (lineIndex + 1) % rotatingLines.length;
    gateSub.style.opacity = "0";
    setTimeout(() => {
      gateSub.textContent = rotatingLines[lineIndex];
      gateSub.style.opacity = "1";
    }, 280);
  }, 3200);
  gateSub.style.transition = "opacity 0.28s ease";

  /* ---------- Open site ---------- */
  function openSite() {
    if (opened) return;
    opened = true;
    gift.classList.add("is-open");
    burst(window.innerWidth / 2, window.innerHeight * 0.42, 110);
    setTimeout(() => {
      gate.classList.add("is-gone");
      main.hidden = false;
      main.classList.add("is-visible");
      progress.hidden = false;
      document.body.style.overflow = "";
      clearInterval(gateHeartTimer);
      startHero();
      startAutoFilm();
      setupToastVideo();
      setTimeout(() => gate.remove(), 900);
    }, 420);
  }

  let heroTimer = null;

  function showHeroVideo(index) {
    heroIndex = index;
    heroVideos.forEach((video, i) => {
      const active = i === index;
      video.classList.toggle("is-active", active);
      video.loop = true;
      if (active) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    const current = heroVideos[index];
    const hold = Number(current.dataset.hold) || 7000;
    clearTimeout(heroTimer);
    heroTimer = setTimeout(() => {
      showHeroVideo((index + 1) % heroVideos.length);
    }, hold);
  }

  function startHero() {
    if (!heroVideos.length) return;
    showHeroVideo(0);
  }

  function unlockVideo(video) {
    if (!video) return Promise.resolve();
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.playsInline = true;
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.then === "function") {
      return playAttempt.catch(() => {});
    }
    return Promise.resolve();
  }

  function setupToastVideo() {
    const toastVideo = document.getElementById("toastVideo");
    const toastSection = document.getElementById("toast");
    if (!toastVideo || !toastSection) return;

    const tryPlay = () => unlockVideo(toastVideo);

    // Warm up after the first tap (opening the gift)
    toastVideo.load();
    tryPlay();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) tryPlay();
          else toastVideo.pause();
        });
      },
      { threshold: 0.25 }
    );
    io.observe(toastSection);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tryPlay();
    });

    const resumeIfNeeded = () => {
      if (toastVideo.paused) tryPlay();
    };
    document.addEventListener("touchstart", resumeIfNeeded, { passive: true });
    document.addEventListener("click", resumeIfNeeded);
  }

  /* ---------- Lightbox ---------- */
  function openClip(src, poster, caption) {
    lightbox.hidden = false;
    lightboxVideo.poster = poster || "";
    lightboxVideo.src = src;
    lightboxCaption.textContent = caption || "";
    lightboxVideo.play().catch(() => {});
    document.body.style.overflow = "hidden";
    burst(window.innerWidth / 2, window.innerHeight * 0.3, 40);
  }

  function hideLightbox() {
    lightbox.hidden = true;
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.load();
    document.body.style.overflow = "";
  }

  /* ---------- Particles ---------- */
  function resizeCanvas() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function spawnAmbient() {
    if (particles.length > 70) return;
    const heart = Math.random() > 0.82;
    particles.push({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 10,
      r: Math.random() * 2 + 0.5,
      a: Math.random() * 0.4 + 0.1,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.55 - 0.15,
      life: Math.random() * 260 + 140,
      heart,
      spin: Math.random() * Math.PI,
    });
  }

  function burst(x, y, count = 70) {
    const colors = ["#ff5a7a", "#ffc857", "#5ec8f0", "#2dd4a8", "#ff8fab", "#fffaf8", "#ff8a3d"];
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const speed = Math.random() * 5.5 + 1.8;
      burstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2.5,
        r: Math.random() * 2.8 + 1,
        a: 1,
        color: colors[i % colors.length],
        life: Math.random() * 60 + 45,
        heart: Math.random() > 0.7,
      });
    }
  }

  function drawHeart(x, y, size, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 12, size / 12);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(0, 0, -6, 0, -6, 4);
    ctx.bezierCurveTo(-6, 8, 0, 12, 0, 16);
    ctx.bezierCurveTo(0, 12, 6, 8, 6, 4);
    ctx.bezierCurveTo(6, 0, 0, 0, 0, 4);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (Math.random() > 0.45) spawnAmbient();

    particles = particles.filter((p) => p.life > 0);
    particles.forEach((p) => {
      p.x += p.vx + Math.sin(p.spin) * 0.15;
      p.y += p.vy;
      p.spin += 0.02;
      p.life -= 1;
      const alpha = p.a * (p.life / 200);
      if (p.heart) drawHeart(p.x, p.y, p.r * 8, "rgba(255,90,122,1)", alpha);
      else {
        ctx.beginPath();
      const palette = ["255,90,122", "255,200,87", "94,200,240", "45,212,168"];
      const c = palette[Math.floor(p.spin * 10) % palette.length];
      ctx.fillStyle = `rgba(${c}, ${alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      }
    });

    burstParticles = burstParticles.filter((p) => p.life > 0 && p.a > 0.02);
    burstParticles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.055;
      p.vx *= 0.99;
      p.life -= 1;
      p.a *= 0.975;
      if (p.heart) drawHeart(p.x, p.y, p.r * 7, p.color, p.a);
      else {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.a;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    requestAnimationFrame(tick);
  }

  /* ---------- Cursor glow ---------- */
  window.addEventListener("pointermove", (e) => {
    if (isTouch) return;
    cursorGlow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  });

  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("pointerenter", () => cursorGlow.classList.add("is-hot"));
    el.addEventListener("pointerleave", () => cursorGlow.classList.remove("is-hot"));
  });

  /* ---------- Typewriter wish ---------- */
  function runTypewriter() {
    if (typingStarted) return;
    typingStarted = true;
    const lines = [...document.querySelectorAll(".type-line")];
    const sign = document.querySelector(".wish__sign");
    let i = 0;

    const typeLine = () => {
      if (typingSkipped) return;
      if (i >= lines.length) {
        sign.classList.remove("is-hidden");
        document.getElementById("skipType").style.display = "none";
        return;
      }
      const el = lines[i];
      const text = el.dataset.text || "";
      el.classList.add("is-typing");
      let c = 0;
      const iv = setInterval(() => {
        if (typingSkipped) {
          clearInterval(iv);
          return;
        }
        el.textContent = text.slice(0, c + 1);
        c += 1;
        if (c >= text.length) {
          clearInterval(iv);
          el.classList.remove("is-typing");
          i += 1;
          setTimeout(typeLine, 280);
        }
      }, 18);
    };
    typeLine();
  }

  function skipTypewriter() {
    typingSkipped = true;
    document.querySelectorAll(".type-line").forEach((el) => {
      el.textContent = el.dataset.text || "";
      el.classList.remove("is-typing");
    });
    document.querySelector(".wish__sign").classList.remove("is-hidden");
    document.getElementById("skipType").style.display = "none";
  }

  document.getElementById("skipType").addEventListener("click", skipTypewriter);

  /* ---------- Reasons ---------- */
  document.querySelectorAll(".reason").forEach((btn) => {
    const front = btn.querySelector(".reason__front");
    const back = btn.querySelector(".reason__back");
    front.setAttribute("data-label", btn.dataset.front);
    back.textContent = btn.dataset.back;

    btn.addEventListener("click", () => {
      if (btn.classList.contains("is-open")) return;
      btn.classList.add("is-open");
      openedReasons += 1;
      document.getElementById("reasonsProgress").textContent = `${openedReasons} / 6 opened`;
      burst(btn.getBoundingClientRect().left + 60, btn.getBoundingClientRect().top + 40, 28);
      if (openedReasons === 6) {
        surprise.hidden = false;
        burst(window.innerWidth / 2, window.innerHeight / 2, 120);
      }
    });
  });

  document.getElementById("closeSurprise").addEventListener("click", () => {
    surprise.hidden = true;
  });

  /* ---------- Filmstrip ---------- */
  function startAutoFilm() {
    stopAutoFilm();
    autoScrollId = setInterval(() => {
      if (!filmstrip) return;
      const max = filmstrip.scrollWidth - filmstrip.clientWidth;
      if (filmstrip.scrollLeft >= max - 4) filmstrip.scrollTo({ left: 0, behavior: "smooth" });
      else filmstrip.scrollBy({ left: 240, behavior: "smooth" });
    }, 3200);
  }

  function stopAutoFilm() {
    if (autoScrollId) clearInterval(autoScrollId);
  }

  filmstrip.addEventListener("pointerenter", stopAutoFilm);
  filmstrip.addEventListener("pointerleave", startAutoFilm);

  document.getElementById("filmPrev").addEventListener("click", () => {
    filmstrip.scrollBy({ left: -260, behavior: "smooth" });
  });
  document.getElementById("filmNext").addEventListener("click", () => {
    filmstrip.scrollBy({ left: 260, behavior: "smooth" });
  });

  document.querySelectorAll(".clip").forEach((clip) => {
    const playBtn = clip.querySelector(".clip__play");
    const preview = clip.querySelector(".clip__preview");
    const caption = clip.querySelector(".clip__caption")?.textContent || "";

    playBtn.addEventListener("mouseenter", () => {
      if (isTouch) return;
      playBtn.classList.add("is-previewing");
      preview.currentTime = 0;
      preview.play().catch(() => {});
    });
    playBtn.addEventListener("mouseleave", () => {
      playBtn.classList.remove("is-previewing");
      preview.pause();
    });
    playBtn.addEventListener("click", () => {
      openClip(clip.dataset.src, clip.dataset.poster, caption);
    });
  });

  /* ---------- Candle ---------- */
  function extinguish() {
    if (flame.classList.contains("is-out")) return;
    flame.classList.add("is-out");
    cake.classList.add("is-celebrating");
    candleStatus.textContent = "Candle out… wish received.";
    candleWish.classList.remove("is-hidden");
    burst(window.innerWidth / 2, cake.getBoundingClientRect().top + 40, 100);
    setTimeout(() => cake.classList.remove("is-celebrating"), 700);
  }

  flameBtn.addEventListener("pointerdown", () => {
    candleStatus.textContent = "Keep going… blowing…";
    blowHold = setTimeout(extinguish, 650);
  });
  flameBtn.addEventListener("pointerup", () => clearTimeout(blowHold));
  flameBtn.addEventListener("pointerleave", () => clearTimeout(blowHold));
  flameBtn.addEventListener("click", () => {
    if (!flame.classList.contains("is-out")) extinguish();
  });

  /* ---------- Celebrate / hearts ---------- */
  celebrate.addEventListener("click", () => {
    for (let i = 0; i < 3; i += 1) {
      setTimeout(() => {
        burst(
          window.innerWidth * (0.25 + Math.random() * 0.5),
          window.innerHeight * (0.25 + Math.random() * 0.4),
          80
        );
      }, i * 180);
    }
  });

  sendHeart.addEventListener("click", () => {
    heartsSent += 1;
    document.getElementById("heartCounter").textContent = `Hearts sent: ${heartsSent}`;
    burst(window.innerWidth / 2, window.innerHeight * 0.55, 36);
  });

  /* ---------- Progress + reveals ---------- */
  function setupReveals() {
    const targets = document.querySelectorAll(
      ".wish__wrap, .reasons__head, .reason, .moments__head, .clip, .candle__wrap, .toast__content"
    );
    targets.forEach((el) => el.classList.add("reveal"));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          if (entry.target.classList.contains("wish__wrap")) runTypewriter();
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.18 }
    );
    targets.forEach((el) => io.observe(el));
  }

  function setupProgress() {
    const sections = ["hero", "wish", "reasons", "moments", "candle", "toast"];
    const links = [...progress.querySelectorAll("a")];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          links.forEach((a) => a.classList.toggle("is-active", a.dataset.section === id));
        });
      },
      { threshold: 0.35 }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  closeLightbox.addEventListener("click", hideLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) hideLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!lightbox.hidden) hideLightbox();
      if (!surprise.hidden) surprise.hidden = true;
    }
  });

  openWish.addEventListener("click", openSite);
  gift.addEventListener("click", openSite);

  window.addEventListener("resize", resizeCanvas);

  document.body.style.overflow = "hidden";
  resizeCanvas();
  tick();
  setupReveals();
  setupProgress();

  if (location.hash && location.hash !== "#") {
    openSite();
    setTimeout(() => {
      const target = document.querySelector(location.hash);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }, 500);
  }
})();
