import { useState, useEffect, useRef, useCallback } from 'react';
import './GameMode.css';

function GameMode3D({ darkMode, paraLength }) {
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
  
  // Track falling blocks with their fall progress
  const [fallingBlocks, setFallingBlocks] = useState({});
  
  const animationRef = useRef(null);
  const intervalRef = useRef(null);
  const inputRef = useRef(null);

  const wordsList = [
    "hello", "world", "speed", "type", "fast", "game", "run", "jump",
    "quick", "brown", "fox", "lazy", "dog", "code", "react", "build",
    "learn", "practice", "skill", "master", "focus", "flow", "zone",
    "power", "boost", "dash", "sprint", "race", "track", "path", "win"
  ];

  // Constants
  const MIN_SPEED = 0.025;
  const MAX_SPEED = 0.25;
  const SPEED_INCREMENT = 0.01;
  
  // Isometric tile dimensions
  const TILE_WIDTH = 50;
  const TILE_HEIGHT = 25;
  const BLOCK_DEPTH = 30;
  const FALL_SPEED = 3; // Pixels per frame

  const getWordCount = () => {
    switch (paraLength) {
      case "short": return 15;
      case "medium": return 25;
      case "long": return 40;
      default: return 15;
    }
  };

  // Isometric projection: convert 3D world coords to 2D screen coords
  const toIso = (x, y, z) => {
    return {
      x: (x - z) * TILE_WIDTH / 2,
      y: (x + z) * TILE_HEIGHT / 2 - y * BLOCK_DEPTH
    };
  };

  // Generate letter sequence
  useEffect(() => {
    const count = getWordCount();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paraLength]);

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
    return Math.sin(progress * Math.PI) * 40;
  };

  // Draw isometric block (3D cube)
  const drawIsoBlock = (ctx, screenX, screenY, width, height, depth, color, darkMode) => {
    // Top face
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX + width / 2, screenY + height / 2);
    ctx.lineTo(screenX, screenY + height);
    ctx.lineTo(screenX - width / 2, screenY + height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darkMode ? '#444' : '#666';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Left face (darker)
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

    // Right face (darkest)
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

  // Adjust color brightness
  const adjustBrightness = (color, amount) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || allLetters.length === 0) return;

    const ctx = canvas.getContext('2d');
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;
    
    // FIXED player position on screen - NEVER CHANGES
    const PLAYER_SCREEN_X = CANVAS_WIDTH / 2;
    const PLAYER_SCREEN_Y = CANVAS_HEIGHT / 2 + 50;

    const animate = () => {
      // Update jump animation
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

      // Update falling blocks animation
      setFallingBlocks(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.keys(updated).forEach(key => {
        //   const blockIndex = parseInt(key);
          updated[key] += FALL_SPEED;
          hasChanges = true;
          
          // Remove blocks that have fallen off screen
          if (updated[key] > 500) {
            delete updated[key];
          }
        });
        
        return hasChanges ? updated : prev;
      });

      // Clear canvas
      ctx.fillStyle = darkMode ? '#1a1a1a' : '#e6ecf0';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid floor (isometric) - moves with camera
      ctx.strokeStyle = darkMode ? '#2a2a2a' : '#d0d0d0';
      ctx.lineWidth = 1;
      
     
      
       // Draw stairs (3D isometric blocks) + FINISH BLOCK
      const stepsToShow = 10;
      const startIdx = Math.max(0, currentLetterIndex - 2);
      // Include finish block in range by adding 1 to allLetters.length
      const endIdx = Math.min(allLetters.length + 1, currentLetterIndex + stepsToShow);

      // Draw from back to front for proper layering
      for (let i = endIdx - 1; i >= startIdx; i--) {
        
        // **FINISH BLOCK** - Treat as block at position allLetters.length
        if (i === allLetters.length) {
          const relativeIndex = i - currentLetterIndex;
          const worldZ = -relativeIndex * 1.5; // Same spacing as regular blocks
          const finishIso = toIso(0, 0, worldZ);
          const finishX = PLAYER_SCREEN_X + finishIso.x;
          const finishY = PLAYER_SCREEN_Y + finishIso.y;
          
          // Pulsing glow effect
          const glowIntensity = Math.sin(Date.now() / 300) * 10 + 20;
          ctx.shadowColor = '#9b59b6';
          ctx.shadowBlur = glowIntensity;
          
          drawIsoBlock(ctx, finishX, finishY, TILE_WIDTH * 1.2, TILE_HEIGHT * 1.2, BLOCK_DEPTH, '#9b59b6', darkMode);
          
          ctx.shadowBlur = 0;
          
          // Victory flag on RIGHT CORNER
          const flagX = finishX + (TILE_WIDTH * 1.1) / 2;
          const flagY = finishY + (TILE_HEIGHT * 2) / 2;
          
          ctx.fillStyle = '#e74c3c';
          ctx.beginPath();
          ctx.fillRect(flagX - 2, flagY - 50, 4, 40);
          ctx.moveTo(flagX, flagY - 50);
          ctx.lineTo(flagX + 20, flagY - 42);
          ctx.lineTo(flagX, flagY - 34);
          ctx.closePath();
          ctx.fill();
          
          // "FINISH" text
          ctx.font = 'bold 16px Roboto';
          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.fillText('FINISH', finishX + 75, finishY + TILE_HEIGHT / 2 + 18);
          
          continue; // Skip to next block
        }
        
        // **REGULAR LETTER BLOCKS** - existing code
        const letter = allLetters[i];
        const relativeIndex = i - currentLetterIndex;
        
        // Skip completed blocks that have finished falling
        if (i < currentLetterIndex && fallingBlocks[i] === undefined) {
          continue;
        }
        // 3D world position - stairs come TOWARD you as you progress
        const worldX = 0; // Always on center line
        const worldY = 0; // FIXED - player height never changes
        const worldZ = -relativeIndex * 1.5; // Steps come from distance
        
        // Convert to isometric screen position
        const iso = toIso(worldX, worldY, worldZ);
        let screenX = PLAYER_SCREEN_X + iso.x;
        let screenY = PLAYER_SCREEN_Y + iso.y;

        // Apply falling animation if block is completed
        if (i < currentLetterIndex && fallingBlocks[i] !== undefined) {
          screenY += fallingBlocks[i]; // Fall down
          
          // Fade out as it falls
          const fadeProgress = Math.min(fallingBlocks[i] / 300, 1);
          ctx.globalAlpha = 1 - fadeProgress;
        }

        // Block color based on state
        let blockColor;
        if (letter.isSpace) {
          // Space - draw outline only
          ctx.strokeStyle = darkMode ? '#555' : '#aaa';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          const p1 = { x: screenX - TILE_WIDTH / 2, y: screenY + TILE_HEIGHT / 2 };
          const p2 = { x: screenX, y: screenY + TILE_HEIGHT };
          const p3 = { x: screenX + TILE_WIDTH / 2, y: screenY + TILE_HEIGHT / 2 };
          const p4 = { x: screenX, y: screenY };
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Space symbol
          ctx.font = '14px Roboto';
          ctx.fillStyle = darkMode ? '#666' : '#999';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⎵', screenX, screenY + TILE_HEIGHT / 2);
        } else {
          if (i < currentLetterIndex) {
            blockColor = darkMode ? '#2d5f3f' : '#90d990';
          } else if (i === currentLetterIndex) {
            blockColor = '#ffd700';
            // Glow effect
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
          } else {
            blockColor = darkMode ? '#3a3a3a' : '#c0c0c0';
          }
          
          drawIsoBlock(ctx, screenX, screenY, TILE_WIDTH, TILE_HEIGHT, BLOCK_DEPTH, blockColor, darkMode);
          ctx.shadowBlur = 0;
          
          // Draw letter on top face
          ctx.font = i === currentLetterIndex ? 'bold 24px Roboto' : 'bold 18px Roboto';
          ctx.fillStyle = i === currentLetterIndex ? '#000' : (darkMode ? '#f0f0f0' : '#222');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter.char.toUpperCase(), screenX, screenY + TILE_HEIGHT / 2);
        }

        // Reset alpha
        ctx.globalAlpha = 1;
      }


        // Draw finish/victory block when game is complete
      if (currentLetterIndex >= allLetters.length) {
        const finishIso = toIso(0, 0, 0);
        const finishX = PLAYER_SCREEN_X + finishIso.x;
        const finishY = PLAYER_SCREEN_Y + finishIso.y;
        
        // Victory platform - golden with special effects
        const victoryGradient = ctx.createLinearGradient(
          finishX - TILE_WIDTH / 2,
          finishY,
          finishX + TILE_WIDTH / 2,
          finishY + BLOCK_DEPTH
        );
        victoryGradient.addColorStop(0, '#FFD700');    // ← TOP gradient color (gold)
        victoryGradient.addColorStop(0.5, '#FFA500');  // ← MIDDLE gradient color (orange)
        victoryGradient.addColorStop(1, '#FFD700');    // ← BOTTOM gradient color (gold)
        
        // Pulsing glow effect
        const glowIntensity = Math.sin(Date.now() / 300) * 10 + 20;
        ctx.shadowColor = '#FFD700';  // ← GLOW color (matches block)
        ctx.shadowBlur = glowIntensity;
        
        drawIsoBlock(ctx, finishX, finishY, TILE_WIDTH * 1.2, TILE_HEIGHT * 1.2, BLOCK_DEPTH, '#9b59b6', darkMode);
        
        ctx.shadowBlur = 0;
        
        // Victory flag on RIGHT CORNER (top vertex of isometric block)
        const flagX = finishX + (TILE_WIDTH * 1.1) / 2;
        const flagY = finishY + (TILE_HEIGHT * 2) / 2;

        
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        // Flag pole
        ctx.fillRect(flagX - 2, flagY - 50, 4, 40);
        // Flag
        ctx.moveTo(flagX, flagY - 50);
        ctx.lineTo(flagX + 20, flagY - 42);
        ctx.lineTo(flagX, flagY - 34);
        ctx.closePath();
        ctx.fill();
        
        // // Victory star on center of block
        // ctx.fillStyle = '#fff';
        // ctx.font = 'bold 28px Arial';
        // ctx.textAlign = 'center';
        // ctx.textBaseline = 'middle';
        // ctx.fillText('★', finishX, finishY + TILE_HEIGHT / 2 + 8);
        
        // "FINISH" text
        ctx.font = 'bold 16px Roboto';
        ctx.fillStyle = '#000';
        ctx.fillText('FINISH', finishX + 75 , finishY + TILE_HEIGHT / 2 + 18);
      }



      // Draw player - COMPLETELY FIXED POSITION, only jumps
      const jumpOffset = isJumping ? getJumpOffset(jumpProgress) : 0;
      const playerY = PLAYER_SCREEN_Y - jumpOffset;

      // Shadow on current block
      const shadowAlpha = isJumping ? 0.1 : 0.2;
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(PLAYER_SCREEN_X, PLAYER_SCREEN_Y + BLOCK_DEPTH +10, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Player body (isometric cube)
      const playerSize = 20;
      const playerColor = '#e74c3c';
      drawIsoBlock(ctx, PLAYER_SCREEN_X, playerY - playerSize, playerSize, playerSize / 2, playerSize, playerColor, darkMode);

      // Player head (circle on top)
      ctx.fillStyle = '#ff7979';
      ctx.beginPath();
      ctx.arc(PLAYER_SCREEN_X, playerY - playerSize * 1.5, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(PLAYER_SCREEN_X - 4, playerY - playerSize * 1.5 - 2, 3, 0, Math.PI * 2);
      ctx.arc(PLAYER_SCREEN_X + 4, playerY - playerSize * 1.5 - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(PLAYER_SCREEN_X - 4, playerY - playerSize * 1.5 - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(PLAYER_SCREEN_X + 4, playerY - playerSize * 1.5 - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Progress bar
      const progress = (currentLetterIndex / allLetters.length) * 100;
      const barWidth = CANVAS_WIDTH - 60;
      const barX = 30;
      const barY = 25;
      
      ctx.fillStyle = darkMode ? '#2a2a2a' : '#ddd';
      ctx.fillRect(barX, barY, barWidth, 35);
      
      const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
      progressGradient.addColorStop(0, '#28a745');
      progressGradient.addColorStop(1, '#20c997');
      ctx.fillStyle = progressGradient;
      ctx.fillRect(barX, barY, (barWidth * progress) / 100, 35);
      
      ctx.strokeStyle = darkMode ? '#444' : '#999';
      ctx.lineWidth = 3;
      ctx.strokeRect(barX, barY, barWidth, 35);
      
      ctx.font = 'bold 18px Roboto';
      ctx.fillStyle = darkMode ? '#fff' : '#000';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(progress)}% Complete`, CANVAS_WIDTH / 2, barY + 22);

      // Speed indicator
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
  }, [allLetters, currentLetterIndex, playerSpeed, darkMode, isJumping, jumpProgress, fallingBlocks, getSpeedDescription]);

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
        // Mark current block as falling
        setFallingBlocks(prev => ({ ...prev, [currentLetterIndex]: 0 }));
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
      // Mark current block as falling
      setFallingBlocks(prev => ({ ...prev, [currentLetterIndex]: 0 }));
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
    setFallingBlocks({});
    setIsPlaying(false);
    setMistakes(0);
    setCorrectLetters(0);
    setTimeElapsed(0);
    
    const count = getWordCount();
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
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const isGameOver = currentLetterIndex >= allLetters.length && allLetters.length > 0;
  const wordCount = allLetters.filter(l => l.isWordEnd).length;
  const completedWords = allLetters.slice(0, currentLetterIndex).filter(l => l.isWordEnd).length;

  return (
    <div className="game-mode">
      <div className="game-instructions">
        <p>🎮 Climb in 3D! Type letters to make blocks fall and ascend the tower! 🏗️⬇️</p>
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
              Type: <strong>{allLetters[currentLetterIndex].isSpace ? '[SPACE]' : allLetters[currentLetterIndex].char.toUpperCase()}</strong>
            </span>
          )}
          {isGameOver && <span className="complete">🎉 Peak Conquered! 🎉</span>}
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
        <button onClick={resetGame}>New Tower</button>
        {isGameOver && <p className="game-over">🏆 Master Climber! 🏆</p>}
      </div>
    </div>
  );
}

export default GameMode3D;
