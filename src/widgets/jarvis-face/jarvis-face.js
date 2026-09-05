// JARVIS Face — Expressive Avatar Component
// Procedural face with eyes, mouth, and state-driven animations
// Returns: { createJarvisFace }

const { el, T, animationsEnabled, isNarrow } = ctx;

const animOrNone = (s) => animationsEnabled ? s : "none";

const FACE_STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  SPEAKING: "speaking",
  THINKING: "thinking",
  ERROR: "error",
  SLEEPING: "sleeping",
};

const EYE_SHAPES = {
  ROUND: "round",
  ANGULAR: "angular",
  VISOR: "visor",
  LENS: "lens",
};

const MOUTH_SHAPES = {
  NEUTRAL: "neutral",
  SMILE: "smile",
  FROWN: "frown",
  OPEN: "open",
  SPEAKING: "speaking",
  THINKING: "thinking",
};

function createJarvisFace(options = {}) {
  const {
    size = isNarrow ? 180 : 240,
    eyeShape = EYE_SHAPES.LENS,
    accentColor = T.accent,
    initialState = FACE_STATES.IDLE,
    showLabel = true,
    interactive = false,
    onStateChange = null,
  } = options;

  // ── Section wrapper ──
  const section = el("div", {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    animation: animOrNone("jarvisFaceFadeIn 0.6s ease-out"),
  });

  // ── Face container ──
  const faceContainer = el("div", {
    position: "relative",
    width: `${size}px`,
    height: `${size}px`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: interactive ? "pointer" : "default",
    userSelect: "none",
    touchAction: "none",
  });
  section.appendChild(faceContainer);

  // ── Ambient glow layers ──
  const ambientGlow = el("div", {
    position: "absolute",
    inset: "-20px",
    borderRadius: "50%",
    background: `radial-gradient(circle at center, ${accentColor}15 0%, ${accentColor}05 40%, transparent 70%)`,
    filter: "blur(40px)",
    pointerEvents: "none",
    zIndex: "0",
    opacity: "0.6",
    animation: animOrNone("jarvisAmbientPulse 4s ease-in-out infinite"),
    willChange: animationsEnabled ? "opacity, transform" : "auto",
  };
  faceContainer.appendChild(ambientGlow);

  const innerGlow = el("div", {
    position: "absolute",
    inset: "-8px",
    borderRadius: "50%",
    background: `radial-gradient(circle at center, ${accentColor}20 0%, transparent 60%)`,
    filter: "blur(20px)",
    pointerEvents: "none",
    zIndex: "1",
    opacity: "0.4",
    animation: animOrNone("jarvisInnerPulse 3s ease-in-out infinite alternate"),
    willChange: animationsEnabled ? "opacity" : "auto",
  });
  faceContainer.appendChild(innerGlow);

  // ── Face base (head shape) ──
  const faceBase = el("div", {
    position: "relative",
    width: `${size * 0.85}px`,
    height: `${size * 0.85}px`,
    borderRadius: `${size * 0.425}px / ${size * 0.38}px`,
    background: `radial-gradient(ellipse at center, ${T.panelBg} 0%, #050510 100%)`,
    border: `2px solid ${accentColor}33`,
    boxShadow: `
      0 0 30px ${accentColor}15,
      0 0 60px ${accentColor}08,
      inset 0 0 40px rgba(0,0,0,0.5),
      inset 0 -10px 30px rgba(0,0,0,0.3)
    `,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: `${size * 0.15}px`,
    zIndex: "2",
    transition: "border-color 0.4s ease, box-shadow 0.4s ease",
    animation: animOrNone("jarvisFaceBreathing 4s ease-in-out infinite"),
    willChange: animationsEnabled ? "transform, box-shadow" : "auto",
  };
  faceContainer.appendChild(faceBase);

  // ── Forehead accent line ──
  const foreheadLine = el("div", {
    position: "absolute",
    top: `${size * 0.08}px`,
    left: "20%",
    right: "20%",
    height: "1px",
    background: `linear-gradient(90deg, transparent, ${accentColor}66, transparent)`,
    pointerEvents: "none",
    zIndex: "3",
  });
  faceBase.appendChild(foreheadLine);

  // ── Eyes container ──
  const eyesContainer = el("div", {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    gap: `${size * 0.12}px`,
    zIndex: "4",
  });
  faceBase.appendChild(eyesContainer);

  // Create eyes based on shape
  const { leftEye, rightEye, eyeElements } = createEyes(eyeShape, size, accentColor);
  eyesContainer.appendChild(leftEye);
  eyesContainer.appendChild(rightEye);

  // ── Eyebrow/indicator elements ──
  const leftBrow = createBrow("left", size, accentColor);
  const rightBrow = createBrow("right", size, accentColor);
  eyesContainer.appendChild(leftBrow);
  eyesContainer.appendChild(rightBrow);

  // ── Mouth container ──
  const mouthContainer = el("div", {
    position: "relative",
    marginTop: `${size * 0.1}px`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    zIndex: "4",
  });
  faceBase.appendChild(mouthContainer);

  const { mouth, mouthElements } = createMouth(size, accentColor);
  mouthContainer.appendChild(mouth);

  // ── Chin indicator ──
  const chinIndicator = el("div", {
    position: "absolute",
    bottom: `${size * 0.05}px`,
    left: "50%",
    transform: "translateX(-50%)",
    width: "20px",
    height: "2px",
    background: `${accentColor}44`,
    borderRadius: "1px",
    opacity: "0.5",
    transition: "opacity 0.3s ease, background 0.3s ease",
  });
  faceBase.appendChild(chinIndicator);

  // ── Status label ──
  let statusLabel = null;
  if (showLabel) {
    statusLabel = el("div", {
      fontSize: isNarrow ? "11px" : "12px",
      fontWeight: "600",
      letterSpacing: "2px",
      textTransform: "uppercase",
      color: T.textMuted,
      textAlign: "center",
      transition: "color 0.3s ease, opacity 0.3s ease",
      opacity: "0.8",
    }, "JARVIS Online");
    section.appendChild(statusLabel);
  }

  // ── State management ──
  let currentState = initialState;
  let speakingInterval = null;
  let thinkingInterval = null;
  let listeningPhase = 0;
  let listeningInterval = null;

  // ── State configurations ──
  const stateConfigs = {
    [FACE_STATES.IDLE]: {
      label: "JARVIS Online",
      labelColor: T.textMuted,
      eyeColor: accentColor,
      eyeGlow: "normal",
      mouthShape: MOUTH_SHAPES.NEUTRAL,
      mouthColor: `${accentColor}66`,
      browPosition: "neutral",
      breathing: true,
      ambientIntensity: 0.6,
    },
    [FACE_STATES.LISTENING]: {
      label: "Listening...",
      labelColor: accentColor,
      eyeColor: accentColor,
      eyeGlow: "pulse",
      mouthShape: MOUTH_SHAPES.OPEN,
      mouthColor: accentColor,
      browPosition: "raised",
      breathing: false,
      ambientIntensity: 1.0,
    },
    [FACE_STATES.SPEAKING]: {
      label: "Speaking",
      labelColor: T.green,
      eyeColor: T.green,
      eyeGlow: "speak",
      mouthShape: MOUTH_SHAPES.SPEAKING,
      mouthColor: T.green,
      browPosition: "neutral",
      breathing: false,
      ambientIntensity: 0.8,
    },
    [FACE_STATES.THINKING]: {
      label: "Processing...",
      labelColor: T.purple,
      eyeColor: T.purple,
      eyeGlow: "think",
      mouthShape: MOUTH_SHAPES.THINKING,
      mouthColor: `${T.purple}88`,
      browPosition: "furrowed",
      breathing: false,
      ambientIntensity: 0.7,
    },
    [FACE_STATES.ERROR]: {
      label: "Error Detected",
      labelColor: T.red,
      eyeColor: T.red,
      eyeGlow: "error",
      mouthShape: MOUTH_SHAPES.FROWN,
      mouthColor: `${T.red}88`,
      browPosition: "furrowed",
      breathing: false,
      ambientIntensity: 0.9,
    },
    [FACE_STATES.SLEEPING]: {
      label: "Standby Mode",
      labelColor: T.textDim,
      eyeColor: `${accentColor}44`,
      eyeGlow: "sleep",
      mouthShape: MOUTH_SHAPES.NEUTRAL,
      mouthColor: `${accentColor}33`,
      browPosition: "lowered",
      breathing: true,
      ambientIntensity: 0.3,
    },
  };

  // ── Eye creation ──
  function createEyes(shape, faceSize, color) {
    const eyeSize = faceSize * 0.18;
    const eyeSpacing = faceSize * 0.12;

    const leftEye = el("div", {
      position: "relative",
      width: `${eyeSize}px`,
      height: `${eyeSize}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    const rightEye = el("div", {
      position: "relative",
      width: `${eyeSize}px`,
      height: `${eyeSize}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    let eyeElements = { left: [], right: [] };

    if (shape === EYE_SHAPES.LENS) {
      // Lens style - circular with inner pupil
      [leftEye, rightEye].forEach((eye, side) => {
        const lens = el("div", {
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          border: `2px solid ${color}`,
          background: `radial-gradient(circle at 30% 30%, ${color}22 0%, transparent 60%)`,
          boxShadow: `0 0 12px ${color}44, 0 0 24px ${color}22, inset 0 0 20px rgba(0,0,0,0.5)`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
          animation: animOrNone("jarvisEyeBreathing 3s ease-in-out infinite"),
          willChange: animationsEnabled ? "box-shadow, border-color" : "auto",
        });

        const pupil = el("div", {
          width: "35%",
          height: "35%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color}aa 100%)`,
          boxShadow: `0 0 8px ${color}, 0 0 16px ${color}88`,
          transition: "transform 0.15s ease, width 0.15s ease, height 0.15s ease, background 0.3s ease",
          animation: animOrNone("jarvisPupilPulse 2.5s ease-in-out infinite"),
          willChange: animationsEnabled ? "transform, box-shadow" : "auto",
        });
        lens.appendChild(pupil);

        // Reflection highlight
        const reflection = el("div", {
          position: "absolute",
          top: "15%",
          left: "20%",
          width: "25%",
          height: "25%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.3)",
          filter: "blur(2px)",
          pointerEvents: "none",
        });
        lens.appendChild(reflection);

        // Scan line (for thinking state)
        const scanLine = el("div", {
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          height: "3px",
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: "0",
          pointerEvents: "none",
          animation: animOrNone("jarvisEyeScan 1.5s linear infinite"),
          willChange: animationsEnabled ? "transform, opacity" : "auto",
        });
        lens.appendChild(scanLine);

        eye.appendChild(lens);
        eyeElements[side === 0 ? "left" : "right"] = { lens, pupil, scanLine, reflection };
      });
    } else if (shape === EYE_SHAPES.VISOR) {
      // Visor style - horizontal bar
      [leftEye, rightEye].forEach((eye, side) => {
        const visor = el("div", {
          width: "100%",
          height: "100%",
          borderRadius: `${eyeSize * 0.3}px`,
          background: `linear-gradient(90deg, ${color} 0%, ${color}aa 50%, ${color} 100%)`,
          boxShadow: `0 0 16px ${color}66, 0 0 32px ${color}33`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
          animation: animOrNone("jarvisVisorPulse 2s ease-in-out infinite"),
          willChange: animationsEnabled ? "box-shadow" : "auto",
        });

        // Visor segments
        for (let i = 1; i <= 3; i++) {
          visor.appendChild(el("div", {
            position: "absolute",
            top: "0",
            left: `${i * 25}%`,
            width: "1px",
            height: "100%",
            background: "rgba(0,0,0,0.2)",
          }));
        }

        // Scan line
        const scanLine = el("div", {
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          height: "4px",
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: "0",
          pointerEvents: "none",
          animation: animOrNone("jarvisVisorScan 1s linear infinite"),
          willChange: animationsEnabled ? "transform, opacity" : "auto",
        });
        visor.appendChild(scanLine);

        eye.appendChild(visor);
        eyeElements[side === 0 ? "left" : "right"] = { visor, scanLine };
      });
    } else if (shape === EYE_SHAPES.ANGULAR) {
      // Angular/hexagonal eyes
      [leftEye, rightEye].forEach((eye, side) => {
        const eyeWrap = el("div", {
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        });

        const hexagon = el("div", {
          width: "85%",
          height: "85%",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)`,
          border: `2px solid ${color}`,
          boxShadow: `0 0 12px ${color}44, inset 0 0 20px rgba(0,0,0,0.5)`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          animation: animOrNone("jarvisHexPulse 3s ease-in-out infinite"),
          willChange: animationsEnabled ? "box-shadow, border-color" : "auto",
        });

        const core = el("div", {
          width: "40%",
          height: "40%",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: `radial-gradient(circle, ${color} 0%, ${color}aa 100%)`,
          boxShadow: `0 0 10px ${color}, 0 0 20px ${color}88`,
          transition: "transform 0.15s ease, background 0.3s ease",
        });
        hexagon.appendChild(core);

        eyeWrap.appendChild(hexagon);
        eye.appendChild(eyeWrap);
        eyeElements[side === 0 ? "left" : "right"] = { hexagon, core };
      });
    } else {
      // Round eyes (default)
      [leftEye, rightEye].forEach((eye, side) => {
        const roundEye = el("div", {
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 30% 30%, ${color}15 0%, transparent 70%)`,
          border: `2px solid ${color}66`,
          boxShadow: `0 0 10px ${color}33, inset 0 0 15px rgba(0,0,0,0.5)`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
          animation: animOrNone("jarvisRoundEyePulse 3s ease-in-out infinite"),
          willChange: animationsEnabled ? "box-shadow, border-color" : "auto",
        });

        const pupil = el("div", {
          width: "40%",
          height: "40%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color}cc 100%)`,
          boxShadow: `0 0 8px ${color}, 0 0 16px ${color}88`,
          transition: "transform 0.15s ease, width 0.15s ease, height 0.15s ease, background 0.3s ease",
          animation: animOrNone("jarvisPupilPulse 2.5s ease-in-out infinite"),
          willChange: animationsEnabled ? "transform, box-shadow" : "auto",
        });
        roundEye.appendChild(pupil);

        const reflection = el("div", {
          position: "absolute",
          top: "12%",
          left: "18%",
          width: "28%",
          height: "28%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          filter: "blur(1px)",
          pointerEvents: "none",
        });
        roundEye.appendChild(reflection);

        eye.appendChild(roundEye);
        eyeElements[side === 0 ? "left" : "right"] = { roundEye, pupil, reflection };
      });
    }

    return { leftEye, rightEye, eyeElements };
  }

  // ── Brow creation ──
  function createBrow(side, faceSize, color) {
    const browWidth = faceSize * 0.15;
    const browHeight = faceSize * 0.025;
    const isLeft = side === "left";

    return el("div", {
      position: "absolute",
      top: `${faceSize * -0.02}px`,
      [isLeft ? "right" : "left"]: "50%",
      transform: isLeft ? "translateX(50%)" : "translateX(-50%)",
      width: `${browWidth}px`,
      height: `${browHeight}px`,
      background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
      borderRadius: `${browHeight}px`,
      opacity: "0.6",
      pointerEvents: "none",
      zIndex: "5",
      transition: "transform 0.3s ease, opacity 0.3s ease, background 0.3s ease",
    });
  }

  // ── Mouth creation ──
  function createMouth(faceSize, color) {
    const mouthWidth = faceSize * 0.35;
    const mouthHeight = faceSize * 0.08;

    const mouth = el("div", {
      position: "relative",
      width: `${mouthWidth}px`,
      height: `${mouthHeight}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    const mouthElements = {};

    // Neutral line
    const neutralLine = el("div", {
      width: "100%",
      height: "2px",
      background: `${color}66`,
      borderRadius: "1px",
      transition: "all 0.3s ease",
    });
    mouth.appendChild(neutralLine);
    mouthElements.neutralLine = neutralLine;

    // Smile curve (upper)
    const smileUpper = el("div", {
      position: "absolute",
      bottom: "50%",
      left: "10%",
      right: "10%",
      height: "50%",
      border: `2px solid ${color}`,
      borderBottom: "none",
      borderRadius: "50% 50% 0 0",
      opacity: "0",
      transform: "scaleX(0.8)",
      transition: "all 0.3s ease",
    });
    mouth.appendChild(smileUpper);
    mouthElements.smileUpper = smileUpper;

    // Smile curve (lower)
    const smileLower = el("div", {
      position: "absolute",
      top: "50%",
      left: "10%",
      right: "10%",
      height: "50%",
      border: `2px solid ${color}`,
      borderTop: "none",
      borderRadius: "0 0 50% 50%",
      opacity: "0",
      transform: "scaleX(0.8)",
      transition: "all 0.3s ease",
    });
    mouth.appendChild(smileLower);
    mouthElements.smileLower = smileLower;

    // Frown curve
    const frownCurve = el("div", {
      position: "absolute",
      top: "50%",
      left: "15%",
      right: "15%",
      height: "50%",
      border: `2px solid ${color}`,
      borderTop: "none",
      borderRadius: "0 0 50% 50%",
      opacity: "0",
      transform: "scaleX(0.8)",
      transition: "all 0.3s ease",
    });
    mouth.appendChild(frownCurve);
    mouthElements.frownCurve = frownCurve;

    // Speaking bars container
    const speakingBars = el("div", {
      position: "absolute",
      left: "0",
      right: "0",
      bottom: "0",
      top: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "3px",
      opacity: "0",
      pointerEvents: "none",
    });
    mouth.appendChild(speakingBars);
    mouthElements.speakingBars = speakingBars;

    // Create speaking bars
    const barCount = 5;
    const bars = [];
    for (let i = 0; i < barCount; i++) {
      const bar = el("div", {
        width: "4px",
        height: "20%",
        background: color,
        borderRadius: "2px",
        opacity: "0.3",
        animation: animOrNone(`jarvisSpeakBar ${0.4 + i * 0.1}s ease-in-out infinite ${i * 0.05}s`),
        willChange: animationsEnabled ? "height, opacity" : "auto",
      });
      speakingBars.appendChild(bar);
      bars.push(bar);
    }
    mouthElements.speakingBarsArray = bars;

    // Thinking dots
    const thinkingDots = el("div", {
      position: "absolute",
      left: "0",
      right: "0",
      top: "0",
      bottom: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      opacity: "0",
      pointerEvents: "none",
    });
    mouth.appendChild(thinkingDots);
    mouthElements.thinkingDots = thinkingDots;

    for (let i = 0; i < 3; i++) {
      const dot = el("div", {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: color,
        opacity: "0.4",
        animation: animOrNone(`jarvisThinkingDot 0.6s ease-in-out infinite ${i * 0.2}s`),
        willChange: animationsEnabled ? "transform, opacity" : "auto",
      });
      thinkingDots.appendChild(dot);
    }

    return { mouth, mouthElements };
  }

  // ── Apply state configuration ──
  function applyState(state) {
    const config = stateConfigs[state];
    if (!config) return;

    currentState = state;

    // Update label
    if (statusLabel) {
      statusLabel.textContent = config.label;
      statusLabel.style.color = config.labelColor;
    }

    // Update eyes
    updateEyes(config);

    // Update mouth
    updateMouth(config);

    // Update brows
    updateBrows(config);

    // Update face base
    updateFaceBase(config);

    // Update ambient glow
    updateAmbientGlow(config);

    // Update chin indicator
    chinIndicator.style.opacity = config.eyeGlow === "sleep" ? "0.3" : "0.5";
    chinIndicator.style.background = config.eyeColor + "44";

    // Trigger callback
    if (onStateChange) {
      onStateChange(state, config);
    }
  }

  function updateEyes(config) {
    const { left, right } = eyeElements;

    // Update eye color/glow based on state
    const applyEyeStyle = (elements) => {
      if (elements.lens) {
        // Lens style
        elements.lens.style.borderColor = config.eyeColor;
        elements.lens.style.boxShadow = getEyeGlow(config.eyeGlow, config.eyeColor);
        elements.pupil.style.background = `radial-gradient(circle at 30% 30%, ${config.eyeColor} 0%, ${config.eyeColor}aa 100%)`;
        elements.pupil.style.boxShadow = `0 0 8px ${config.eyeColor}, 0 0 16px ${config.eyeColor}88`;

        // Scan line for thinking
        if (elements.scanLine) {
          elements.scanLine.style.background = `linear-gradient(90deg, transparent, ${config.eyeColor}, transparent)`;
          elements.scanLine.style.opacity = config.eyeGlow === "think" ? "0.8" : "0";
        }
      } else if (elements.visor) {
        // Visor style
        elements.visor.style.background = `linear-gradient(90deg, ${config.eyeColor} 0%, ${config.eyeColor}aa 50%, ${config.eyeColor} 100%)`;
        elements.visor.style.boxShadow = getEyeGlow(config.eyeGlow, config.eyeColor);
        if (elements.scanLine) {
          elements.scanLine.style.background = `linear-gradient(90deg, transparent, ${config.eyeColor}, transparent)`;
          elements.scanLine.style.opacity = config.eyeGlow === "think" ? "0.8" : "0";
        }
      } else if (elements.hexagon) {
        // Angular style
        elements.hexagon.style.borderColor = config.eyeColor;
        elements.hexagon.style.boxShadow = getEyeGlow(config.eyeGlow, config.eyeColor);
        elements.core.style.background = `radial-gradient(circle, ${config.eyeColor} 0%, ${config.eyeColor}aa 100%)`;
        elements.core.style.boxShadow = `0 0 10px ${config.eyeColor}, 0 0 20px ${config.eyeColor}88`;
      } else if (elements.roundEye) {
        // Round style
        elements.roundEye.style.borderColor = config.eyeColor + "66";
        elements.roundEye.style.boxShadow = getEyeGlow(config.eyeGlow, config.eyeColor);
        elements.roundEye.style.background = `radial-gradient(circle at 30% 30%, ${config.eyeColor}15 0%, transparent 70%)`;
        elements.pupil.style.background = `radial-gradient(circle at 30% 30%, ${config.eyeColor} 0%, ${config.eyeColor}cc 100%)`;
        elements.pupil.style.boxShadow = `0 0 8px ${config.eyeColor}, 0 0 16px ${config.eyeColor}88`;
      }
    };

    applyEyeStyle(left);
    applyEyeStyle(right);

    // Pupil dilation for listening/speaking
    const pupilScale = config.eyeGlow === "pulse" ? 1.3 : config.eyeGlow === "speak" ? 1.1 : 1;
    [left, right].forEach(elements => {
      if (elements.pupil) {
        elements.pupil.style.transform = `scale(${pupilScale})`;
      }
      if (elements.core) {
        elements.core.style.transform = `scale(${pupilScale})`;
      }
    });
  }

  function getEyeGlow(glowType, color) {
    switch (glowType) {
      case "pulse":
        return `0 0 20px ${color}88, 0 0 40px ${color}44, inset 0 0 20px rgba(0,0,0,0.5)`;
      case "speak":
        return `0 0 16px ${color}66, 0 0 32px ${color}33, inset 0 0 20px rgba(0,0,0,0.5)`;
      case "think":
        return `0 0 24px ${color}88, 0 0 48px ${color}44, inset 0 0 20px rgba(0,0,0,0.5)`;
      case "error":
        return `0 0 20px ${color}88, 0 0 40px ${color}44, inset 0 0 20px rgba(0,0,0,0.5)`;
      case "sleep":
        return `0 0 8px ${color}33, inset 0 0 15px rgba(0,0,0,0.5)`;
      default:
        return `0 0 12px ${color}44, 0 0 24px ${color}22, inset 0 0 20px rgba(0,0,0,0.5)`;
    }
  }

  function updateMouth(config) {
    const { neutralLine, smileUpper, smileLower, frownCurve, speakingBars, thinkingDots } = mouthElements;

    // Reset all
    neutralLine.style.opacity = "0";
    smileUpper.style.opacity = "0";
    smileLower.style.opacity = "0";
    frownCurve.style.opacity = "0";
    speakingBars.style.opacity = "0";
    thinkingDots.style.opacity = "0";

    switch (config.mouthShape) {
      case MOUTH_SHAPES.NEUTRAL:
        neutralLine.style.opacity = "1";
        neutralLine.style.background = config.mouthColor;
        break;
      case MOUTH_SHAPES.SMILE:
        smileUpper.style.opacity = "1";
        smileLower.style.opacity = "1";
        smileUpper.style.borderColor = config.mouthColor;
        smileLower.style.borderColor = config.mouthColor;
        smileUpper.style.transform = "scaleX(1)";
        smileLower.style.transform = "scaleX(1)";
        break;
      case MOUTH_SHAPES.FROWN:
        frownCurve.style.opacity = "1";
        frownCurve.style.borderColor = config.mouthColor;
        frownCurve.style.transform = "scaleX(1)";
        break;
      case MOUTH_SHAPES.OPEN:
        neutralLine.style.opacity = "1";
        neutralLine.style.background = config.mouthColor;
        neutralLine.style.height = "4px";
        neutralLine.style.borderRadius = "2px";
        break;
      case MOUTH_SHAPES.SPEAKING:
        speakingBars.style.opacity = "1";
        // Bars will animate via CSS
        break;
      case MOUTH_SHAPES.THINKING:
        thinkingDots.style.opacity = "1";
        break;
    }
  }

  function updateBrows(config) {
    const browOffset = size * 0.02;
    const browTilt = size * 0.008;

    switch (config.browPosition) {
      case "raised":
        leftBrow.style.transform = "translateX(50%) translateY(-4px) rotate(-5deg)";
        rightBrow.style.transform = "translateX(-50%) translateY(-4px) rotate(5deg)";
        leftBrow.style.opacity = "0.8";
        rightBrow.style.opacity = "0.8";
        break;
      case "furrowed":
        leftBrow.style.transform = "translateX(50%) translateY(2px) rotate(8deg)";
        rightBrow.style.transform = "translateX(-50%) translateY(2px) rotate(-8deg)";
        leftBrow.style.opacity = "0.9";
        rightBrow.style.opacity = "0.9";
        leftBrow.style.background = `linear-gradient(90deg, transparent, ${config.eyeColor}88, transparent)`;
        rightBrow.style.background = `linear-gradient(90deg, transparent, ${config.eyeColor}88, transparent)`;
        break;
      case "lowered":
        leftBrow.style.transform = "translateX(50%) translateY(3px)";
        rightBrow.style.transform = "translateX(-50%) translateY(3px)";
        leftBrow.style.opacity = "0.4";
        rightBrow.style.opacity = "0.4";
        break;
      default: // neutral
        leftBrow.style.transform = "translateX(50%)";
        rightBrow.style.transform = "translateX(-50%)";
        leftBrow.style.opacity = "0.6";
        rightBrow.style.opacity = "0.6";
        leftBrow.style.background = `linear-gradient(90deg, transparent, ${accentColor}66, transparent)`;
        rightBrow.style.background = `linear-gradient(90deg, transparent, ${accentColor}66, transparent)`;
    }
  }

  function updateFaceBase(config) {
    const glowIntensity = config.ambientIntensity;
    faceBase.style.borderColor = config.eyeColor + "66";
    faceBase.style.boxShadow = `
      0 0 ${30 * glowIntensity}px ${config.eyeColor}${Math.round(20 * glowIntensity).toString(16).padStart(2, '0')},
      0 0 ${60 * glowIntensity}px ${config.eyeColor}${Math.round(10 * glowIntensity).toString(16).padStart(2, '0')},
      inset 0 0 40px rgba(0,0,0,0.5),
      inset 0 -10px 30px rgba(0,0,0,0.3)
    `;

    if (config.breathing) {
      faceBase.style.animation = animOrNone("jarvisFaceBreathing 4s ease-in-out infinite");
    } else {
      faceBase.style.animation = "none";
    }
  }

  function updateAmbientGlow(config) {
    ambientGlow.style.opacity = `${0.6 * config.ambientIntensity}`;
    ambientGlow.style.background = `radial-gradient(circle at center, ${config.eyeColor}${Math.round(20 * config.ambientIntensity).toString(16).padStart(2, '0')} 0%, ${config.eyeColor}${Math.round(5 * config.ambientIntensity).toString(16).padStart(2, '0')} 40%, transparent 70%)`;
    innerGlow.style.opacity = `${0.4 * config.ambientIntensity}`;
    innerGlow.style.background = `radial-gradient(circle at center, ${config.eyeColor}${Math.round(30 * config.ambientIntensity).toString(16).padStart(2, '0')} 0%, transparent 60%)`;
  }

  // ── State transition animations ──
  function transitionToState(newState, duration = 400) {
    // Quick micro-animation on state change
    faceBase.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    eyesContainer.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    mouthContainer.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

    applyState(newState);

    // Reset transition after
    setTimeout(() => {
      faceBase.style.transition = "border-color 0.4s ease, box-shadow 0.4s ease";
      eyesContainer.style.transition = "";
      mouthContainer.style.transition = "";
    }, duration);
  }

  // ── Public API ──
  const api = {
    // State control
    setState: (state) => transitionToState(state),
    getState: () => currentState,

    // Convenience methods
    idle: () => transitionToState(FACE_STATES.IDLE),
    listen: () => transitionToState(FACE_STATES.LISTENING),
    speak: () => transitionToState(FACE_STATES.SPEAKING),
    think: () => transitionToState(FACE_STATES.THINKING),
    error: () => transitionToState(FACE_STATES.ERROR),
    sleep: () => transitionToState(FACE_STATES.SLEEPING),

    // Speaking simulation (for TTS sync)
    startSpeaking: (text = "") => {
      transitionToState(FACE_STATES.SPEAKING);
      if (speakingInterval) clearInterval(speakingInterval);
      // Could sync with actual TTS here
    },
    stopSpeaking: () => {
      if (speakingInterval) clearInterval(speakingInterval);
      transitionToState(FACE_STATES.IDLE);
    },

    // Listening simulation
    startListening: () => {
      transitionToState(FACE_STATES.LISTENING);
      listeningPhase = 0;
      if (listeningInterval) clearInterval(listeningInterval);
      listeningInterval = setInterval(() => {
        listeningPhase = (listeningPhase + 1) % 3;
        // Subtle eye pulse on each phase
        const config = stateConfigs[FACE_STATES.LISTENING];
        const pulseIntensity = 0.8 + listeningPhase * 0.1;
        [leftBrow, rightBrow].forEach(brow => {
          brow.style.opacity = `${0.8 * pulseIntensity}`;
        });
      }, 800);
      if (ctx.intervals) ctx.intervals.push(listeningInterval);
    },
    stopListening: () => {
      if (listeningInterval) clearInterval(listeningInterval);
      transitionToState(FACE_STATES.IDLE);
    },

    // Thinking simulation
    startThinking: () => {
      transitionToState(FACE_STATES.THINKING);
      if (thinkingInterval) clearInterval(thinkingInterval);
      thinkingInterval = setInterval(() => {
        // Subtle eye scan effect
        const config = stateConfigs[FACE_STATES.THINKING];
        Object.values(eyeElements).forEach(elements => {
          if (elements.scanLine) {
            elements.scanLine.style.opacity = "0.8";
            setTimeout(() => { elements.scanLine.style.opacity = "0"; }, 500);
          }
        });
      }, 2000);
      if (ctx.intervals) ctx.intervals.push(thinkingInterval);
    },
    stopThinking: () => {
      if (thinkingInterval) clearInterval(thinkingInterval);
      transitionToState(FACE_STATES.IDLE);
    },

    // Error flash
    flashError: (duration = 2000) => {
      transitionToState(FACE_STATES.ERROR);
      setTimeout(() => transitionToState(FACE_STATES.IDLE), duration);
    },

    // Element access
    getElement: () => section,
    getFaceBase: () => faceBase,
    getEyes: () => ({ left: leftEye, right: rightEye }),
    getMouth: () => mouth,

    // Cleanup
    destroy: () => {
      if (speakingInterval) clearInterval(speakingInterval);
      if (thinkingInterval) clearInterval(thinkingInterval);
      if (listeningInterval) clearInterval(listeningInterval);
      if (ctx.cleanups) ctx.cleanups.push(() => section.remove());
    },
  };

  // Initialize with initial state
  applyState(initialState);

  // Interactive click handling
  if (interactive) {
    faceContainer.addEventListener("click", () => {
      const states = [FACE_STATES.IDLE, FACE_STATES.LISTENING, FACE_STATES.SPEAKING, FACE_STATES.THINKING];
      const currentIndex = states.indexOf(currentState);
      const nextState = states[(currentIndex + 1) % states.length];
      transitionToState(nextState);
    });
  }

  return api;
}

return { createJarvisFace, FACE_STATES, EYE_SHAPES, MOUTH_SHAPES };