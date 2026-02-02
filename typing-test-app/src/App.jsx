import { useState, useEffect, useRef } from 'react';
import './App.css';
import GameMode from './GameMode';
import GameMode3D from './GameMode3D';

function App() {
  // List of common words for paragraph generation.
  // const wordsList = [
  //   "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
  //   "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
  //   "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
  //   "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
  //   "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in",
  //   "reprehenderit", "voluptate", "velit", "esse", "cillum", "fugiat",
  //   "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "proident",
  //   "sunt", "culpa", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"
  // ];
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

  const generateParagraph = (minWords, maxWords, useWords = true) => {
    if (!useWords) {
      // Generate random scrambled letters
      const totalChars = Math.floor(Math.random() * (maxWords * 6 - minWords * 4 + 1)) + minWords * 4;
      let scrambled = '';
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      
      for (let i = 0; i < totalChars; i++) {
        scrambled += letters[Math.floor(Math.random() * letters.length)];
        if (i > 0 && Math.random() < 0.15) {
          scrambled += ' ';
        }
      }
      return scrambled.trim();
    }
    
    // Original word-based generation
    const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    const paragraphArray = [];
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = Math.floor(Math.random() * wordsList.length);
      paragraphArray.push(wordsList[randomIndex]);
    }
    return paragraphArray.join(" ");
  };

  const getSavedParaLength = () => localStorage.getItem("paraLength") || "short";
  // const getSavedDarkMode = () => localStorage.getItem("darkMode") === "true";
  const getSavedDarkMode = () => {
  const saved = localStorage.getItem("darkMode");
  // If no preference saved yet, default to dark mode (true)
  // Otherwise use the saved preference
  return saved === null ? true : saved === "true";
};

  const getSavedWordType = () => localStorage.getItem("wordType") || "words";

  const [paraLength, setParaLength] = useState(getSavedParaLength());
  const [darkMode, setDarkMode] = useState(getSavedDarkMode());
  const [wordType, setWordType] = useState(getSavedWordType());
  const [showSettings, setShowSettings] = useState(false);

  const [testText, setTestText] = useState("");
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const [mode, setMode] = useState('game3d');

  const intervalRef = useRef(null);
  const promptRef = useRef(null);

  const getWordRange = (lengthSetting) => {
    switch (lengthSetting) {
      case "short":
        return { min: 70, max: 80 };
      case "medium":
        return { min: 125, max: 150 };
      case "long":
      default:
        return { min: 200, max: 250 };
    }
  };

  useEffect(() => {
    const { min, max } = getWordRange(paraLength);
    setTestText(generateParagraph(min, max, wordType === 'words'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userInput.length === 0) {
      setAccuracy(100);
    } else {
      let correctCount = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === testText[i]) {
          correctCount++;
        }
      }
      setAccuracy((correctCount / userInput.length) * 100);
    }
  }, [userInput, testText]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (!isStarted) {
      setIsStarted(true);
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    setUserInput(value);

    if (value.length === testText.length) {
      endTest();
    }
  };

  const calculateWPM = (input, seconds) => {
    const wordsCount = input.trim().split(/\s+/).length;
    return seconds > 0 ? Math.round((wordsCount / seconds) * 60) : 0;
  };

  const endTest = () => {
    clearInterval(intervalRef.current);
    setIsFinished(true);
    setWpm(calculateWPM(userInput, timeElapsed));
  };

  const resetTest = () => {
    clearInterval(intervalRef.current);
    setUserInput('');
    setTimeElapsed(0);
    setWpm(0);
    setAccuracy(100);
    setIsStarted(false);
    setIsFinished(false);
    const { min, max } = getWordRange(paraLength);
    setTestText(generateParagraph(min, max, wordType === 'words'));
    if (promptRef.current) promptRef.current.scrollTop = 0;
  };

  const handleFinishClick = () => {
    if (isStarted && !isFinished) {
      endTest();
    }
  };

  useEffect(() => {
    if (isStarted && !isFinished) {
      setWpm(calculateWPM(userInput, timeElapsed));
    }
  }, [timeElapsed, userInput, isStarted, isFinished]);

  const renderTestText = () => {
    return testText.split("").map((char, index) => {
      let colorClass = "";
      if (index < userInput.length) {
        if (char === " " && userInput[index] === " ") {
          colorClass = "";
        } else if (userInput[index] === char) {
          colorClass = "correct";
        } else {
          colorClass = "incorrect";
        }
      }
      if (index === userInput.length && !isFinished) {
        colorClass += " current";
      }
      return (
        <span key={index} className={colorClass.trim()}>
          {char}
        </span>
      );
    });
  };

  const handleParaLengthChange = (e) => {
    const value = e.target.value;
    setParaLength(value);
    localStorage.setItem("paraLength", value);
    clearInterval(intervalRef.current);
    setUserInput('');
    setTimeElapsed(0);
    setWpm(0);
    setAccuracy(100);
    setIsStarted(false);
    setIsFinished(false);
    const { min, max } = getWordRange(value);
    setTestText(generateParagraph(min, max, wordType === 'words'));

    if (promptRef.current) promptRef.current.scrollTop = 0;
  };

  const handleWordTypeChange = (e) => {
    const value = e.target.value;
    setWordType(value);
    localStorage.setItem("wordType", value);
    
    clearInterval(intervalRef.current);
    setUserInput('');
    setTimeElapsed(0);
    setWpm(0);
    setAccuracy(100);
    setIsStarted(false);
    setIsFinished(false);
    const { min, max } = getWordRange(paraLength);
    setTestText(generateParagraph(min, max, value === 'words'));
    
    if (promptRef.current) promptRef.current.scrollTop = 0;
  };

  const handleDarkModeToggle = () => {
    setDarkMode(prev => {
      localStorage.setItem("darkMode", (!prev).toString());
      return !prev;
    });
  };

  const toggleSettingsPanel = () => {
    setShowSettings(prev => !prev);
  };

  useEffect(() => {
    const container = promptRef.current;
    if (!container) return;
  
    const style = window.getComputedStyle(container);
    const lineHeight = parseFloat(style.lineHeight);
  
    const currentSpan = container.querySelector('span.current');
    if (!currentSpan) return;
  
    const offsetTop   = currentSpan.offsetTop;
    const scrollTop   = container.scrollTop;
    const scrollHeight= container.scrollHeight;
    const clientHeight= container.clientHeight;
  
    const totalLines  = Math.ceil(scrollHeight / lineHeight);
    const currentLine = Math.floor((offsetTop - scrollTop) / lineHeight);
  
    if (currentLine >= totalLines - 2) {
      const maxScrollTop = scrollHeight - clientHeight;
      const newScrollTop = Math.min(scrollTop + lineHeight, maxScrollTop);
      if (newScrollTop > scrollTop) {
        container.scrollTop = newScrollTop;
      }
    }
  }, [userInput.length]);

  const [showShare, setShowShare] = useState(false);
  const handleShowShare = () => setShowShare(true);
  const handleCloseShare = () => setShowShare(false);

  return (
    <div className={`container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <header>
        <h1>Typing Speed Test</h1>
        <p>
          speed test your typing with <b>speedtesttyping.net</b>
        </p>
        <p>
          We may be the world's fastest "launch to practice" typing test,{" "}
          <b>in our opinion.</b>
        </p>
      </header>

      <nav className="settings">
        <label htmlFor="mode-select">Mode:</label>
        <select
          id="mode-select"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="classic">Classic Test</option>
          <option value="game">2D Stairs</option>
          <option value="game3d">3D Isometric</option>
        </select>

        <label htmlFor="word-type">Word Type:</label>
        <select
          id="word-type"
          value={wordType}
          onChange={handleWordTypeChange}
        >
          <option value="words">Words</option>
          <option value="random">Random Letters</option>
        </select>

        <label htmlFor="para-length">Paragraph Length:</label>
        <select
          id="para-length"
          value={paraLength}
          onChange={handleParaLengthChange}
        >
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
      </nav>

      <main>
        {mode === "classic" ? (
          <>
            <section className="test-box">
              <div ref={promptRef} className="prompt-text">
                {renderTestText()}
              </div>
              <textarea
                placeholder="Start typing here..."
                value={userInput}
                onChange={handleInputChange}
                disabled={isFinished}
                rows="8"
              />
            </section>

            <section className="stats">
              <p>
                Time Elapsed: <span>{timeElapsed}</span> sec
              </p>
              <p>
                WPM: <span>{wpm}</span>
              </p>
              <p>
                Accuracy: <span>{accuracy.toFixed(2)}</span>%
              </p>
            </section>

            <section className="buttons">
              <button
                onClick={handleFinishClick}
                disabled={isFinished || !isStarted}
              >
                Finish Test
              </button>
              <button onClick={resetTest}>Reset</button>
              {isFinished && (
                <button className="share-btn" onClick={handleShowShare}>
                  Share
                </button>
              )}
            </section>
          </>
        ) : mode === "game" ? (
          <GameMode darkMode={darkMode} paraLength={paraLength} wordType={wordType} />
        ) : (
          <GameMode3D darkMode={darkMode} paraLength={paraLength} wordType={wordType} />
        )}
      </main>

      <footer className="footer">
        <p>
          <img
            src="icons/icon32.png"
            alt="Site Icon"
            width="24"
            height="24"
            style={{ verticalAlign: "middle", marginRight: "8px" }}
          />
          Practice a bit, with a single click, using this{" "}
          <a
            href="https://chromewebstore.google.com/detail/speed-test-your-typing-sp/jcaljndpimijemjaajnopmaogncojajo"
            target="_blank"
            rel="noopener noreferrer"
          >
            link
          </a>
          .
        </p>
        <p className="text-sm text-gray-400 mt-1">
          If it helps you, please consider supporting this project with{" "}
          <a
            href="https://www.patreon.com/theindiecompny"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-400 hover:text-blue-500"
          >
            $1
          </a>
          .
        </p>
      </footer>

      {showShare && (
        <div className="share-panel">
          <h2>Share with your friends</h2>
          <p>and start a public log! </p>
          <textarea
            readOnly
            value={`☝️Today, My WPM is ${wpm} with ${accuracy.toFixed(
              2
            )}% accuracy in ${timeElapsed} ${
              timeElapsed === 1 ? "second" : "seconds"
            }!⌚\nIt'll be better tomorrow.📈 \nWhat's yours? 🤔\n----------\n⌨️#speedtestyourtyping via speedtesttyping.net`}
          />
          <div className="share-buttons">
            <a
              className="tweet-btn"
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                `☝️Today, My WPM is ${wpm} with ${accuracy.toFixed(
                  2
                )}% accuracy in ${timeElapsed} ${
                  timeElapsed === 1 ? "second" : "seconds"
                }!⌚\nIt'll be better tomorrow.📈 \nWhat's yours? 🤔\n----------\n⌨️#speedtestyourtyping via speedtesttyping.net`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tweet
            </a>
            <a
              className="threads-btn"
              href={`https://www.threads.net/intent/post?text=${encodeURIComponent(
                `Today, My WPM is ${wpm} with ${accuracy.toFixed(
                  2
                )}% accuracy in ${timeElapsed} ${
                  timeElapsed === 1 ? "second" : "seconds"
                }!\nIt'll be better tomorrow. \nWhat's yours?\n----------\n#speedtestyourtyping via speedtesttyping.net`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Threads
            </a>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  `☝️Today, My WPM is ${wpm} with ${accuracy.toFixed(
                    2
                  )}% accuracy in ${timeElapsed} ${
                    timeElapsed === 1 ? "second" : "seconds"
                  }!⌚\nIt'll be better tomorrow.📈 \nWhat's yours? 🤔\n----------\n⌨️#speedtestyourtyping via speedtesttyping.net`
                )
              }
            >
              Copy
            </button>
            <button onClick={handleCloseShare}>Close</button>
          </div>
          <p>
            Research shows Practice & Public Accountability increases one's
            chances of success, no matter the goal.🚀
          </p>
          <p>I hope this tool helps you, good luck, friend. 😊</p>
        </div>
      )}
      <div className="settings-toggle">
        <button className="gear-button" onClick={toggleSettingsPanel}>
          ⚙️
        </button>
        {showSettings && (
          <div className="settings-panel">
            <label>
              Dark Mode:
              <input
                type="checkbox"
                checked={darkMode}
                onChange={handleDarkModeToggle}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
