import { useState, useEffect, useRef, useCallback } from 'react';
import './GameMode.css';

function GameMode({ darkMode, paraLength, wordType }) {
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
  
  const animationRef = useRef(null);
  const intervalRef = useRef(null);
  const inputRef = useRef(null);

 const wordsList = [
  "hello", "world", "speed", "type", "fast", "game", "run", "jump",
  "quick", "brown", "fox", "lazy", "dog", "code", "react", "build",
  "learn", "practice", "skill", "master", "focus", "flow", "zone",
  "power", "boost", "dash", "sprint", "race", "track", "path", "win",
  "think", "create", "design", "develop", "deploy", "test", "debug",
  "solve", "achieve", "grow", "improve", "excel", "succeed", "thrive",
  "innovate", "explore", "discover", "advance", "progress", "evolve",
  "optimize", "refactor", "implement", "execute", "deliver", "ship",
  "launch", "scale", "iterate", "enhance", "upgrade", "transform",
  "pioneer", "lead", "inspire", "motivate", "empower", "enable",
  "accelerate", "streamline", "automate", "integrate", "connect", "sync",
  "collaborate", "communicate", "share", "contribute", "support", "assist",
  "guide", "teach", "mentor", "coach", "train", "educate", "enlighten"
];

  // Constants
  const MIN_SPEED = 0.025;
  const MAX_SPEED = 0.25;
  const SPEED_INCREMENT = 0.01;
  const STEP_WIDTH = 60;
  const STEP_HEIGHT = 30;

  const getWordCount = () => {
    switch (paraLength) {
      case "short": return 15;
      case "medium": return 25;
      case "long": return 40;
      default: return 15;
    }
  };

  const generateRandomLetters = (count) => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    
    for (let i = 0; i < count * 5; i++) {
      result += letters[Math.floor(Math.random() * letters.length)];
      if (i > 0 && Math.random() < 0.15) {
        result += ' ';
      }
    }
    return result.trim().split('');
  };

  // Generate letter sequence
  useEffect(() => {
    const count = getWordCount();
    
    if (wordType === 'random') {
      const randomChars = generateRandomLetters(count);
      const letters = randomChars.map((char) => ({
        char: char,
        wordIndex: 0,
        isWordStart: false,
        isWordEnd: false,
        isSpace: char === ' '
      }));
      setAllLetters(letters);
    } else {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(wordsList[Math.floor(Math.random() * wordsList.length)]);
      }
      
      const letters = [];
      words.forEach((word, wordIdx) => {
        word.split('').forEach((char, charIdx) => {
          letters.push({
            char: char,
            wordIndex: wordIdx,
            isWordStart: charIdx === 0,
            isWordEnd: charIdx === word.length - 1
          });
        });
        if (wordIdx < words.length - 1) {
          letters.push({
            char: ' ',
            wordIndex: wordIdx,
            isSpace: true
          });
        }
      });
      
      setAllLetters(letters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paraLength, wordType]);

  // Game timer
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  const getSpeedDescription = useCallback((speed) => {
    if (speed < 0.06) return 'Crawling';
    if (speed < 0.12) return 'Walking';
    if (speed < 0.18) return 'Jogging';
    if (speed < 0.23) return 'Running';
    return 'Sprinting!';
  }, []);

  // Jump animation
  const getJumpOffset = (progress) => {
    return Math.sin(progress * Math.PI) * 35;
  };

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || allLetters.length === 0) return;

    const ctx = canvas.getContext('2d');
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;
    
    const PLAYER_FIXED_X = CANVAS_WIDTH / 2;
    const PLAYER_FIXED_Y = CANVAS_HEIGHT / 2 + 50;

    const animate = () => {
      if (isJumping) {
        setJumpProgress(prev => {
          const newProgress = prev + 0.08;
          if (newProgress >= 1) {
            setIsJumping(false);
            return 0;
          }
          return newProgress;
        });
      }

      ctx.fillStyle = darkMode ? '#2c2c2c' : '#e6ecf0';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = darkMode ? '#555' : '#999';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT - 30);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 30);
      ctx.stroke();

      const stepsToShow = 12;
      const startIdx = Math.max(0, currentLetterIndex - 3);
      const endIdx = Math.min(allLetters.length, currentLetterIndex + stepsToShow);

      for (let i = startIdx; i < endIdx; i++) {
        const letter = allLetters[i];
        const relativeIndex = i - currentLetterIndex;
        const stepX = PLAYER_FIXED_X + (relativeIndex * STEP_WIDTH) - STEP_WIDTH / 2;
        const stepY = PLAYER_FIXED_Y + (relativeIndex * STEP_HEIGHT);

        if (letter.isSpace) {
          ctx.strokeStyle = darkMode ? '#666' : '#bbb';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(stepX, stepY, STEP_WIDTH, STEP_HEIGHT);
          ctx.setLineDash([]);
          
          ctx.font = '16px Roboto';
          ctx.fillStyle = darkMode ? '#888' : '#aaa';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⎵', stepX + STEP_WIDTH / 2, stepY + STEP_HEIGHT / 2);
        } else {
          let stepColor;
          if (i < currentLetterIndex) {
            const gradient = ctx.createLinearGradient(stepX, stepY, stepX, stepY + STEP_HEIGHT);
            gradient.addColorStop(0, darkMode ? '#3a5f4a' : '#b8e6b8');
            gradient.addColorStop(1, darkMode ? '#2d4a38' : '#90d990');
            stepColor = gradient;
          } else if (i === currentLetterIndex) {
            const gradient = ctx.createLinearGradient(stepX, stepY, stepX, stepY + STEP_HEIGHT);
            gradient.addColorStop(0, '#ffe873');
            gradient.addColorStop(1, '#ffd700');
            stepColor = gradient;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 25;
          } else {
            stepColor = darkMode ? '#3a3a3a' : '#d0d0d0';
          }
          
          ctx.fillStyle = stepColor;
          ctx.fillRect(stepX, stepY, STEP_WIDTH, STEP_HEIGHT);
          ctx.shadowBlur = 0;
          
          ctx.strokeStyle = darkMode ? '#555' : '#888';
          ctx.lineWidth = 2;
          ctx.strokeRect(stepX, stepY, STEP_WIDTH, STEP_HEIGHT);
          
          ctx.font = i === currentLetterIndex ? 'bold 28px Roboto' : 'bold 20px Roboto';
          ctx.fillStyle = i === currentLetterIndex ? '#000' : (darkMode ? '#e0e0e0' : '#222');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter.char.toUpperCase(), stepX + STEP_WIDTH / 2, stepY + STEP_HEIGHT / 2);
        }
      }

      const jumpOffset = isJumping ? getJumpOffset(jumpProgress) : 0;
      const playerY = PLAYER_FIXED_Y - 25 - jumpOffset;

      const shadowAlpha = isJumping ? 0.1 : 0.25;
      const shadowSize = isJumping ? 10 : 14;
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(PLAYER_FIXED_X, PLAYER_FIXED_Y - 5, shadowSize, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const playerGradient = ctx.createRadialGradient(
        PLAYER_FIXED_X - 6,
        playerY - 6,
        4,
        PLAYER_FIXED_X,
        playerY,
        18
      );
      playerGradient.addColorStop(0, '#ff7979');
      playerGradient.addColorStop(1, '#e74c3c');
      ctx.fillStyle = playerGradient;
      ctx.beginPath();
      ctx.arc(PLAYER_FIXED_X, playerY, 18, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(PLAYER_FIXED_X + 6, playerY - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(PLAYER_FIXED_X + 6, playerY - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      const progress = (currentLetterIndex / allLetters.length) * 100;
      const barWidth = CANVAS_WIDTH - 60;
      const barX = 30;
      const barY = 25;
      
      ctx.fillStyle = darkMode ? '#3a3a3a' : '#ddd';
      ctx.fillRect(barX, barY, barWidth, 35);
      
      const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
      progressGradient.addColorStop(0, '#28a745');
      progressGradient.addColorStop(1, '#20c997');
      ctx.fillStyle = progressGradient;
      ctx.fillRect(barX, barY, (barWidth * progress) / 100, 35);
      
      ctx.strokeStyle = darkMode ? '#555' : '#999';
      ctx.lineWidth = 3;
      ctx.strokeRect(barX, barY, barWidth, 35);
      
      ctx.font = 'bold 18px Roboto';
      ctx.fillStyle = darkMode ? '#fff' : '#000';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(progress)}% Complete`, CANVAS_WIDTH / 2, barY + 22);

      const speedText = getSpeedDescription(playerSpeed);
      ctx.font = 'bold 20px Roboto';
      ctx.fillStyle = darkMode ? '#00ff88' : '#28a745';
      ctx.textAlign = 'right';
      ctx.fillText(`⚡ ${speedText}`, CANVAS_WIDTH - 25, CANVAS_HEIGHT - 45);
      ctx.font = '16px Roboto';
      ctx.fillStyle = darkMode ? '#aaa' : '#666';
      ctx.fillText(`${playerSpeed.toFixed(3)}x`, CANVAS_WIDTH - 25, CANVAS_HEIGHT - 25);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [allLetters, currentLetterIndex, playerSpeed, darkMode, isJumping, jumpProgress, getSpeedDescription]);

  // Handle typing
  const handleKeyPress = (e) => {
    if (e.key.length !== 1 && e.key !== ' ') return;
    if (currentLetterIndex >= allLetters.length) return;

    const currentLetter = allLetters[currentLetterIndex];
    const typedChar = e.key.toLowerCase();

    if (!isPlaying) {
      setIsPlaying(true);
    }

    if (currentLetter.isSpace) {
      if (e.key === ' ') {
        setIsJumping(true);
        setJumpProgress(0);
        setCurrentLetterIndex(prev => prev + 1);
        setPlayerSpeed(prev => Math.min(prev + SPEED_INCREMENT, MAX_SPEED));
        setCorrectLetters(prev => prev + 1);
      } else {
        setPlayerSpeed(MIN_SPEED);
        setMistakes(prev => prev + 1);
      }
      return;
    }

    if (typedChar === currentLetter.char.toLowerCase()) {
      setIsJumping(true);
      setJumpProgress(0);
      setCurrentLetterIndex(prev => prev + 1);
      setPlayerSpeed(prev => Math.min(prev + SPEED_INCREMENT, MAX_SPEED));
      setCorrectLetters(prev => prev + 1);

      if (currentLetterIndex + 1 >= allLetters.length) {
        endGame();
      }
    } else {
      setPlayerSpeed(MIN_SPEED);
      setMistakes(prev => prev + 1);
    }
  };

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.addEventListener('keydown', handleKeyPress);
    return () => input.removeEventListener('keydown', handleKeyPress);
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
    setIsPlaying(false);
    setMistakes(0);
    setCorrectLetters(0);
    setTimeElapsed(0);
    
    const count = getWordCount();
    
    if (wordType === 'random') {
      const randomChars = generateRandomLetters(count);
      const letters = randomChars.map((char) => ({
        char: char,
        wordIndex: 0,
        isWordStart: false,
        isWordEnd: false,
        isSpace: char === ' '
      }));
      setAllLetters(letters);
    } else {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(wordsList[Math.floor(Math.random() * wordsList.length)]);
      }
      
      const letters = [];
      words.forEach((word, wordIdx) => {
        word.split('').forEach((char, charIdx) => {
          letters.push({
            char: char,
            wordIndex: wordIdx,
            isWordStart: charIdx === 0,
            isWordEnd: charIdx === word.length - 1
          });
        });
        if (wordIdx < words.length - 1) {
          letters.push({
            char: ' ',
            wordIndex: wordIdx,
            isSpace: true
          });
        }
      });
      
      setAllLetters(letters);
    }
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const isGameOver = currentLetterIndex >= allLetters.length && allLetters.length > 0;
  const wordCount = allLetters.filter(l => l.isWordEnd).length;
  const completedWords = allLetters.slice(0, currentLetterIndex).filter(l => l.isWordEnd).length;

  return (
    <div className="game-mode">
      <div className="game-instructions">
        <p>🎮 Type to climb! Runner stays centered, stairs scroll beneath! 🏃‍♂️⬆️</p>
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
          {!isPlaying && <span>👆 Click and type to start climbing!</span>}
          {isPlaying && currentLetterIndex < allLetters.length && (
            <span>
              Type: <strong>{allLetters[currentLetterIndex].isSpace ? '[SPACE]' : allLetters[currentLetterIndex].char.toUpperCase()}</strong>
            </span>
          )}
          {isGameOver && <span className="complete">🎉 Summit Reached! 🎉</span>}
        </div>
      </div>

      <div className="game-stats">
        <p>Words: <span>{completedWords}/{wordCount}</span></p>
        <p>Letters: <span>{correctLetters}/{allLetters.length}</span></p>
        <p>Mistakes: <span>{mistakes}</span></p>
        <p>Time: <span>{timeElapsed}s</span></p>
        <p>WPM: <span>{timeElapsed > 0 ? Math.round((completedWords / timeElapsed) * 60) : 0}</span></p>
      </div>

      <div className="game-controls">
        <button onClick={resetGame}>New Climb</button>
        {isGameOver && <p className="game-over">🏆 You're a Champion! 🏆</p>}
      </div>
    </div>
  );
}

export default GameMode;
