import { useState, useEffect, useRef, useCallback } from "react";
import "./GameMode.css";

function GameMode3D({ darkMode, paraLength, wordType }) {
  const canvasRef = useRef(null);
  const [allLetters, setAllLetters] = useState([]);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [playerSpeed, setPlayerSpeed] = useState(0.025);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [correctLetters, setCorrectLetters] = useState(0);

  const [isJumping, setIsJumping] = useState(false);
  const [jumpProgress, setJumpProgress] = useState(0);

  const [fallingBlocks, setFallingBlocks] = useState({});

  const [showShare, setShowShare] = useState(false);

  const animationRef = useRef(null);
  const intervalRef = useRef(null);
  const inputRef = useRef(null);
  
  const audioContextRef = useRef(null);

  const wordsList = [
    "hello",
    "world",
    "speed",
    "type",
    "fast",
    "game",
    "run",
    "jump",
    "quick",
    "brown",
    "fox",
    "lazy",
    "dog",
    "code",
    "react",
    "build",
    "learn",
    "practice",
    "skill",
    "master",
    "focus",
    "flow",
    "zone",
    "power",
    "boost",
    "dash",
    "sprint",
    "race",
    "track",
    "path",
    "win",
    "think",
    "create",
    "design",
    "develop",
    "deploy",
    "test",
    "debug",
    "solve",
    "achieve",
    "grow",
    "improve",
    "excel",
    "succeed",
    "thrive",
    "innovate",
    "explore",
    "discover",
    "advance",
    "progress",
    "evolve",
    "optimize",
    "refactor",
    "implement",
    "execute",
    "deliver",
    "ship",
    "launch",
    "scale",
    "iterate",
    "enhance",
    "upgrade",
    "transform",
    "pioneer",
    "lead",
    "inspire",
    "motivate",
    "empower",
    "enable",
    "accelerate",
    "streamline",
    "automate",
    "integrate",
    "connect",
    "sync",
    "collaborate",
    "communicate",
    "share",
    "contribute",
    "support",
    "assist",
    "guide",
    "teach",
    "mentor",
    "coach",
    "train",
    "educate",
    "enlighten",
  ];

  const MIN_SPEED = 0.025;
  const MAX_SPEED = 0.25;
  const SPEED_INCREMENT = 0.01;

  const TILE_WIDTH = 50;
  const TILE_HEIGHT = 25;
  const BLOCK_DEPTH = 30;
  const FALL_SPEED = 3;

  const getWordCount = () => {
    switch (paraLength) {
      case "short":
        return 15;
      case "medium":
        return 25;
      case "long":
        return 40;
      default:
        return 15;
    }
  };

  const toIso = (x, y, z) => {
    return {
      x: ((x - z) * TILE_WIDTH) / 2,
      y: ((x + z) * TILE_HEIGHT) / 2 - y * BLOCK_DEPTH,
    };
  };

  const generateRandomLetters = (count) => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let result = "";

    for (let i = 0; i < count * 5; i++) {
      result += letters[Math.floor(Math.random() * letters.length)];
      if (i > 0 && Math.random() < 0.15) {
        result += " ";
      }
    }
    return result.trim().split("");
  };

  useEffect(() => {
    const count = getWordCount();

    if (wordType === "random") {
      const randomChars = generateRandomLetters(count);
      const letters = randomChars.map((char) => ({
        char: char,
        wordIndex: 0,
        isWordStart: false,
        isWordEnd: false,
        isSpace: char === " ",
      }));
      setAllLetters(letters);
    } else {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(wordsList[Math.floor(Math.random() * wordsList.length)]);
      }

      const letters = [];
      words.forEach((word, wordIdx) => {
        word.split("").forEach((char, charIdx) => {
          letters.push({
            char: char,
            wordIndex: wordIdx,
            isWordStart: charIdx === 0,
            isWordEnd: charIdx === word.length - 1,
          });
        });
        if (wordIdx < words.length - 1) {
          letters.push({
            char: " ",
            wordIndex: wordIdx,
            isSpace: true,
          });
        }
      });

      setAllLetters(letters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paraLength, wordType]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  const getSpeedDescription = useCallback((speed) => {
    if (speed < 0.06) return "Crawling";
    if (speed < 0.12) return "Walking";
    if (speed < 0.18) return "Jogging";
    if (speed < 0.23) return "Running";
    return "Sprinting!";
  }, []);

  const getJumpOffset = (progress) => {
    return Math.sin(progress * Math.PI) * 40;
  };

  const drawIsoBlock = (
    ctx,
    screenX,
    screenY,
    width,
    height,
    depth,
    color,
    darkMode
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX + width / 2, screenY + height / 2);
    ctx.lineTo(screenX, screenY + height);
    ctx.lineTo(screenX - width / 2, screenY + height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darkMode ? "#444" : "#666";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const leftColor = adjustBrightness(color, -20);
    ctx.fillStyle = leftColor;
    ctx.beginPath();
    ctx.moveTo(screenX - width / 2, screenY + height / 2);
    ctx.lineTo(screenX, screenY + height);
    ctx.lineTo(screenX, screenY + height + depth);
    ctx.lineTo(screenX - width / 2, screenY + height / 2 + depth);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const rightColor = adjustBrightness(color, -40);
    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(screenX + width / 2, screenY + height / 2);
    ctx.lineTo(screenX, screenY + height);
    ctx.lineTo(screenX, screenY + height + depth);
    ctx.lineTo(screenX + width / 2, screenY + height / 2 + depth);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const adjustBrightness = (color, amount) => {
    const hex = color.replace("#", "");
    const r = Math.max(
      0,
      Math.min(255, parseInt(hex.slice(0, 2), 16) + amount)
    );
    const g = Math.max(
      0,
      Math.min(255, parseInt(hex.slice(2, 4), 16) + amount)
    );
    const b = Math.max(
      0,
      Math.min(255, parseInt(hex.slice(4, 6), 16) + amount)
    );
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // Initialize AudioContext once
  useEffect(() => {
    audioContextRef.current = new (
      window.AudioContext || window.webkitAudioContext
    )();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Sound effects using shared Web Audio API context
  const playCorrectSound = () => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playWrongSound = () => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 200;
    oscillator.type = "sawtooth";

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.2
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || allLetters.length === 0) return;

    const ctx = canvas.getContext("2d");
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;

    const PLAYER_SCREEN_X = CANVAS_WIDTH / 2;
    const PLAYER_SCREEN_Y = CANVAS_HEIGHT / 2 + 50;

    const animate = () => {
      if (isJumping) {
        setJumpProgress((prev) => {
          const newProgress = prev + 0.08;
          if (newProgress >= 1) {
            setIsJumping(false);
            return 0;
          }
          return newProgress;
        });
      }

      setFallingBlocks((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach((key) => {
          updated[key] += FALL_SPEED;
          hasChanges = true;

          if (updated[key] > 500) {
            delete updated[key];
          }
        });

        return hasChanges ? updated : prev;
      });

      ctx.fillStyle = darkMode ? "#1a1a1a" : "#e6ecf0";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = darkMode ? "#2a2a2a" : "#d0d0d0";
      ctx.lineWidth = 1;

      const stepsToShow = 10;
      const startIdx = Math.max(0, currentLetterIndex - 2);
      const endIdx = Math.min(
        allLetters.length + 1,
        currentLetterIndex + stepsToShow
      );

      for (let i = endIdx - 1; i >= startIdx; i--) {
        if (i === allLetters.length) {
          const relativeIndex = i - currentLetterIndex;
          const worldZ = -relativeIndex * 1.5;
          const finishIso = toIso(0, 0, worldZ);
          const finishX = PLAYER_SCREEN_X + finishIso.x;
          const finishY = PLAYER_SCREEN_Y + finishIso.y;

          const glowIntensity = Math.sin(Date.now() / 300) * 10 + 20;
          ctx.shadowColor = "#9b59b6";
          ctx.shadowBlur = glowIntensity;

          drawIsoBlock(
            ctx,
            finishX,
            finishY,
            TILE_WIDTH * 1.2,
            TILE_HEIGHT * 1.2,
            BLOCK_DEPTH,
            "#9b59b6",
            darkMode
          );

          ctx.shadowBlur = 0;

          const flagX = finishX + (TILE_WIDTH * 1.1) / 2;
          const flagY = finishY + (TILE_HEIGHT * 2) / 2;

          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.fillRect(flagX - 2, flagY - 50, 4, 40);
          ctx.moveTo(flagX, flagY - 50);
          ctx.lineTo(flagX + 20, flagY - 42);
          ctx.lineTo(flagX, flagY - 34);
          ctx.closePath();
          ctx.fill();

          ctx.font = "bold 16px Roboto";
          ctx.fillStyle = "#000";
          ctx.textAlign = "center";
          ctx.fillText("FINISH", finishX + 75, finishY + TILE_HEIGHT / 2 + 18);

          continue;
        }

        const letter = allLetters[i];
        const relativeIndex = i - currentLetterIndex;

        if (i < currentLetterIndex && fallingBlocks[i] === undefined) {
          continue;
        }

        const worldX = 0;
        const worldY = 0;
        const worldZ = -relativeIndex * 1.5;

        const iso = toIso(worldX, worldY, worldZ);
        let screenX = PLAYER_SCREEN_X + iso.x;
        let screenY = PLAYER_SCREEN_Y + iso.y;

        if (i < currentLetterIndex && fallingBlocks[i] !== undefined) {
          screenY += fallingBlocks[i];
          const fadeProgress = Math.min(fallingBlocks[i] / 300, 1);
          ctx.globalAlpha = 1 - fadeProgress;
        }

        let blockColor;
        if (letter.isSpace) {
          ctx.strokeStyle = darkMode ? "#555" : "#aaa";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          const p1 = {
            x: screenX - TILE_WIDTH / 2,
            y: screenY + TILE_HEIGHT / 2,
          };
          const p2 = { x: screenX, y: screenY + TILE_HEIGHT };
          const p3 = {
            x: screenX + TILE_WIDTH / 2,
            y: screenY + TILE_HEIGHT / 2,
          };
          const p4 = { x: screenX, y: screenY };
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = "14px Roboto";
          ctx.fillStyle = darkMode ? "#666" : "#999";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("⎵", screenX, screenY + TILE_HEIGHT / 2);
        } else {
          if (i < currentLetterIndex) {
            blockColor = darkMode ? "#2d5f3f" : "#90d990";
          } else if (i === currentLetterIndex) {
            blockColor = "#ffd700";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 20;
          } else {
            blockColor = darkMode ? "#3a3a3a" : "#c0c0c0";
          }

          drawIsoBlock(
            ctx,
            screenX,
            screenY,
            TILE_WIDTH,
            TILE_HEIGHT,
            BLOCK_DEPTH,
            blockColor,
            darkMode
          );
          ctx.shadowBlur = 0;

          ctx.font =
            i === currentLetterIndex ? "bold 24px Roboto" : "bold 18px Roboto";
          ctx.fillStyle =
            i === currentLetterIndex ? "#000" : darkMode ? "#f0f0f0" : "#222";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            letter.char.toUpperCase(),
            screenX,
            screenY + TILE_HEIGHT / 2
          );
        }

        ctx.globalAlpha = 1;
      }

      if (currentLetterIndex >= allLetters.length) {
        const finishIso = toIso(0, 0, 0);
        const finishX = PLAYER_SCREEN_X + finishIso.x;
        const finishY = PLAYER_SCREEN_Y + finishIso.y;

        const glowIntensity = Math.sin(Date.now() / 300) * 10 + 20;
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = glowIntensity;

        drawIsoBlock(
          ctx,
          finishX,
          finishY,
          TILE_WIDTH * 1.2,
          TILE_HEIGHT * 1.2,
          BLOCK_DEPTH,
          "#9b59b6",
          darkMode
        );

        ctx.shadowBlur = 0;

        const flagX = finishX + (TILE_WIDTH * 1.1) / 2;
        const flagY = finishY + (TILE_HEIGHT * 2) / 2;

        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.fillRect(flagX - 2, flagY - 50, 4, 40);
        ctx.moveTo(flagX, flagY - 50);
        ctx.lineTo(flagX + 20, flagY - 42);
        ctx.lineTo(flagX, flagY - 34);
        ctx.closePath();
        ctx.fill();

        ctx.font = "bold 16px Roboto";
        ctx.fillStyle = "#000";
        ctx.fillText("FINISH", finishX + 75, finishY + TILE_HEIGHT / 2 + 18);
      }

      const jumpOffset = isJumping ? getJumpOffset(jumpProgress) : 0;
      const playerY = PLAYER_SCREEN_Y - jumpOffset;

      const shadowAlpha = isJumping ? 0.1 : 0.2;
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(
        PLAYER_SCREEN_X,
        PLAYER_SCREEN_Y + BLOCK_DEPTH + 10,
        15,
        6,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      const playerSize = 20;
      const playerColor = "#e74c3c";
      drawIsoBlock(
        ctx,
        PLAYER_SCREEN_X,
        playerY - playerSize,
        playerSize,
        playerSize / 2,
        playerSize,
        playerColor,
        darkMode
      );

      ctx.fillStyle = "#ff7979";
      ctx.beginPath();
      ctx.arc(PLAYER_SCREEN_X, playerY - playerSize * 1.5, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#c0392b";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(
        PLAYER_SCREEN_X - 4,
        playerY - playerSize * 1.5 - 2,
        3,
        0,
        Math.PI * 2
      );
      ctx.arc(
        PLAYER_SCREEN_X + 4,
        playerY - playerSize * 1.5 - 2,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(
        PLAYER_SCREEN_X - 4,
        playerY - playerSize * 1.5 - 2,
        1.5,
        0,
        Math.PI * 2
      );
      ctx.arc(
        PLAYER_SCREEN_X + 4,
        playerY - playerSize * 1.5 - 2,
        1.5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      const progress = (currentLetterIndex / allLetters.length) * 100;
      const barWidth = CANVAS_WIDTH - 60;
      const barX = 30;
      const barY = 25;

      // Draw bar background
      ctx.fillStyle = darkMode ? "#2a2a2a" : "#ddd";
      ctx.fillRect(barX, barY, barWidth, 35);

      // Draw progress fill with gradient
      const progressGradient = ctx.createLinearGradient(
        barX,
        barY,
        barX + barWidth,
        barY
      );
      progressGradient.addColorStop(0, "#ffd700"); // Gold start
      progressGradient.addColorStop(1, "#ffed4e"); // Light gold end
      ctx.fillStyle = progressGradient;
      const filledWidth = (barWidth * progress) / 100;
      ctx.fillRect(barX, barY, filledWidth, 35);

      // Draw border
      ctx.strokeStyle = darkMode ? "#444" : "#999";
      ctx.lineWidth = 3;
      ctx.strokeRect(barX, barY, barWidth, 35);

      // Prepare text
      ctx.font = "bold 18px Roboto";
      ctx.textAlign = "center";
      const text = `${Math.floor(progress)}% Complete`;
      const textX = CANVAS_WIDTH / 2;
      const textY = barY + 22;

      // Draw text in BLACK for filled area (where gold bar is)
      ctx.save();
      ctx.beginPath();
      ctx.rect(barX, barY, filledWidth, 35); // Clip to filled area only
      ctx.clip();
      ctx.fillStyle = "#000"; // Black text on gold
      ctx.fillText(text, textX, textY);
      ctx.restore();

      // Draw text in WHITE/original color for unfilled area
      ctx.save();
      ctx.beginPath();
      ctx.rect(barX + filledWidth, barY, barWidth - filledWidth, 35); // Clip to unfilled area
      ctx.clip();
      ctx.fillStyle = darkMode ? "#fff" : "#000"; // White on dark, black on light
      ctx.fillText(text, textX, textY);
      ctx.restore();

      const speedText = getSpeedDescription(playerSpeed);
      ctx.font = "bold 20px Roboto";
      ctx.fillStyle = darkMode ? "#00ff88" : "#28a745";
      ctx.textAlign = "right";
      ctx.fillText(`⚡ ${speedText}`, CANVAS_WIDTH - 25, CANVAS_HEIGHT - 45);
      ctx.font = "16px Roboto";
      ctx.fillStyle = darkMode ? "#aaa" : "#666";
      ctx.fillText(
        `${playerSpeed.toFixed(3)}x`,
        CANVAS_WIDTH - 25,
        CANVAS_HEIGHT - 25
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    allLetters,
    currentLetterIndex,
    playerSpeed,
    darkMode,
    isJumping,
    jumpProgress,
    fallingBlocks,
    getSpeedDescription,
  ]);

  const handleKeyPress = (e) => {
    if (e.key.length !== 1 && e.key !== " ") return;
    if (currentLetterIndex >= allLetters.length) return;

    const currentLetter = allLetters[currentLetterIndex];
    const typedChar = e.key.toLowerCase();

    if (!isPlaying) {
      setIsPlaying(true);
    }

    if (currentLetter.isSpace) {
      if (e.key === " ") {
        playCorrectSound();
        setIsJumping(true);
        setJumpProgress(0);
        setFallingBlocks((prev) => ({ ...prev, [currentLetterIndex]: 0 }));
        setCurrentLetterIndex((prev) => prev + 1);
        setPlayerSpeed((prev) => Math.min(prev + SPEED_INCREMENT, MAX_SPEED));
        setCorrectLetters((prev) => prev + 1);
      } else {
        playWrongSound();
        setPlayerSpeed(MIN_SPEED);
        setMistakes((prev) => prev + 1);
      }
      return;
    }

    if (typedChar === currentLetter.char.toLowerCase()) {
      playCorrectSound();
      setIsJumping(true);
      setJumpProgress(0);
      setFallingBlocks((prev) => ({ ...prev, [currentLetterIndex]: 0 }));
      setCurrentLetterIndex((prev) => prev + 1);
      setPlayerSpeed((prev) => Math.min(prev + SPEED_INCREMENT, MAX_SPEED));
      setCorrectLetters((prev) => prev + 1);

      if (currentLetterIndex + 1 >= allLetters.length) {
        endGame();
      }
    } else {
      playWrongSound();
      setPlayerSpeed(MIN_SPEED);
      setMistakes((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.addEventListener("keydown", handleKeyPress);
    return () => input.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLetterIndex, allLetters, isPlaying]);

  const endGame = () => {
    setIsPlaying(false);
    clearInterval(intervalRef.current);
  };

  const resetGame = () => {
    setCurrentLetterIndex(0);
    setPlayerSpeed(MIN_SPEED);
    setIsJumping(false);
    setJumpProgress(0);
    setFallingBlocks({});
    setIsPlaying(false);
    setMistakes(0);
    setCorrectLetters(0);
    setTimeElapsed(0);
    setShowShare(false);

    const count = getWordCount();

    if (wordType === "random") {
      const randomChars = generateRandomLetters(count);
      const letters = randomChars.map((char) => ({
        char: char,
        wordIndex: 0,
        isWordStart: false,
        isWordEnd: false,
        isSpace: char === " ",
      }));
      setAllLetters(letters);
    } else {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(wordsList[Math.floor(Math.random() * wordsList.length)]);
      }

      const letters = [];
      words.forEach((word, wordIdx) => {
        word.split("").forEach((char, charIdx) => {
          letters.push({
            char: char,
            wordIndex: wordIdx,
            isWordStart: charIdx === 0,
            isWordEnd: charIdx === word.length - 1,
          });
        });
        if (wordIdx < words.length - 1) {
          letters.push({
            char: " ",
            wordIndex: wordIdx,
            isSpace: true,
          });
        }
      });

      setAllLetters(letters);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const isGameOver =
    currentLetterIndex >= allLetters.length && allLetters.length > 0;
  const wordCount = allLetters.filter((l) => l.isWordEnd).length;
  const completedWords = allLetters
    .slice(0, currentLetterIndex)
    .filter((l) => l.isWordEnd).length;
  const wpm =
    timeElapsed > 0 ? Math.round((completedWords / timeElapsed) * 60) : 0;

  const getShareText = () => {
    const wordTypeText = wordType === "random" ? "Random Letters" : "Words";

    if (wordType === "random") {
      return `⌨️ My 3D Speed Typing Game Results!
🚀 Can you beat my score?

Letters: ${correctLetters}/${allLetters.length}
Time: ${timeElapsed}s
Mode: ${wordTypeText}
Mistakes: ${mistakes}
----------
⌨️ #speedtestyourtyping via speedtesttyping.net`;
    } else {
      return `⌨️ My 3D Speed Typing Game Results!
🚀 Can you beat my score?

Words: ${completedWords}/${wordCount}
Letters: ${correctLetters}/${allLetters.length}
Time: ${timeElapsed}s
WPM: ${wpm}
Mode: ${wordTypeText}
Mistakes: ${mistakes}
----------
⌨️ #speedtestyourtyping via speedtesttyping.net`;
    }
  };

  return (
    <div className="game-mode">
      <div className="game-instructions">
        <p>Liking it? Thank you! ❤️ 
            Please rate it, if you can: {" "}
          <a
            href="https://chromewebstore.google.com/detail/speed-test-your-typing-sp/jcaljndpimijemjaajnopmaogncojajo"
            target="_blank"
            rel="noopener noreferrer"
          >
            link
          </a>
          .
        </p>
        
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="game-canvas"
      />

      <div className="game-input-section">
        <input
          ref={inputRef}
          type="text"
          className="game-input-hidden"
          placeholder="Click here and start typing..."
          autoFocus
          disabled={isGameOver}
        />
        <div className="game-hint">
          {!isPlaying && <span>👆 Click and type to start the ascent!</span>}
          {isPlaying && currentLetterIndex < allLetters.length && (
            <span>
              Type:{" "}
              <strong>
                {allLetters[currentLetterIndex].isSpace
                  ? "[SPACE]"
                  : allLetters[currentLetterIndex].char.toUpperCase()}
              </strong>
            </span>
          )}
          {isGameOver && (
            <span className="complete">🎉 Peak Conquered! 🎉</span>
          )}
        </div>
      </div>

      <div className="game-stats">
        <p>
          Words:{" "}
          <span>
            {completedWords}/{wordCount}
          </span>
        </p>
        <p>
          Letters:{" "}
          <span>
            {correctLetters}/{allLetters.length}
          </span>
        </p>
        <p>
          Mistakes: <span>{mistakes}</span>
        </p>
        <p>
          Time: <span>{timeElapsed}s</span>
        </p>
        <p>
          WPM: <span>{wpm}</span>
        </p>
      </div>

      <div className="game-controls">
        <button onClick={resetGame}>New Game</button>
        {isGameOver && (
          <>
            <button className="share-btn" onClick={() => setShowShare(true)}>
              Share Results
            </button>
            <p className="game-over">🏆 Master Climber! 🏆</p>
          </>
        )}
      </div>

      {showShare && (
        <div className="share-panel">
          <h2>Share Your Results!</h2>
          <p>Spread the word about your typing skills! 🚀</p>
          <textarea readOnly value={getShareText()} />
          <div className="share-buttons">
            <a
              className="tweet-btn"
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(getShareText())}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share on X
            </a>
            <a
              className="threads-btn"
              href={`https://www.threads.net/intent/post?text=${encodeURIComponent(getShareText())}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share on Threads
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(getShareText());
                alert("Copied to clipboard!");
              }}
            >
              Copy Text
            </button>
            <button onClick={() => setShowShare(false)}>Close</button>
          </div>
          <p>Practice makes perfect! Keep climbing! 🎯</p>
        </div>
      )}
    </div>
  );
}

export default GameMode3D;
