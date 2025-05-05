import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // List of common words for paragraph generation.
  const wordsList = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
    "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
    "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
    "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
    "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in",
    "reprehenderit", "voluptate", "velit", "esse", "cillum", "fugiat",
    "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "proident",
    "sunt", "culpa", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"
  ];

  // Function to generate a paragraph within a specified range.
  const generateParagraph = (minWords, maxWords) => {
    const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    const paragraphArray = [];
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = Math.floor(Math.random() * wordsList.length);
      paragraphArray.push(wordsList[randomIndex]);
    }
    return paragraphArray.join(" ");
  };

  // Retrieve saved paragraph length setting from localStorage (if available).
  const getSavedParaLength = () => localStorage.getItem("paraLength") || "long";

  // Retrieve saved dark mode setting (if available) and convert to boolean.
  const getSavedDarkMode = () => localStorage.getItem("darkMode") === "true";

  // State for the paragraph length option: "short", "medium", "long".
  const [paraLength, setParaLength] = useState(getSavedParaLength());
  // State for dark mode.
  const [darkMode, setDarkMode] = useState(getSavedDarkMode());
  // State to control the visibility of the settings panel.
  const [showSettings, setShowSettings] = useState(false);

  // Other component states.
  const [testText, setTestText] = useState("");
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);

  const intervalRef = useRef(null);

  // Function to get min/max words based on chosen paragraph length.
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

  // Generate initial paragraph on component mount.
  useEffect(() => {
    const { min, max } = getWordRange(paraLength);
    setTestText(generateParagraph(min, max));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update accuracy whenever user input changes.
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

  // Handle changes in the textarea.
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (!isStarted) {
      setIsStarted(true);
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    setUserInput(value);

    // Automatically end the test once the user has typed the complete text.
    if (value.length === testText.length) {
      endTest();
    }
  };

  // Calculate Words Per Minute (WPM).
  const calculateWPM = (input, seconds) => {
    const wordsCount = input.trim().split(/\s+/).length;
    return seconds > 0 ? Math.round((wordsCount / seconds) * 60) : 0;
  };

  // End the test.
  const endTest = () => {
    clearInterval(intervalRef.current);
    setIsFinished(true);
    setWpm(calculateWPM(userInput, timeElapsed));
  };

  // Reset the test.
  const resetTest = () => {
    clearInterval(intervalRef.current);
    setUserInput('');
    setTimeElapsed(0);
    setWpm(0);
    setAccuracy(100);
    setIsStarted(false);
    setIsFinished(false);
    const { min, max } = getWordRange(paraLength);
    setTestText(generateParagraph(min, max));
  };

  // Manual finish option.
  const handleFinishClick = () => {
    if (isStarted && !isFinished) {
      endTest();
    }
  };

  // Update WPM in real time.
  useEffect(() => {
    if (isStarted && !isFinished) {
      setWpm(calculateWPM(userInput, timeElapsed));
    }
  }, [timeElapsed, userInput, isStarted, isFinished]);

  // Render the test text with live per-character feedback.
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

  // Handle paragraph length selection change.
  const handleParaLengthChange = (e) => {
    const value = e.target.value;
    setParaLength(value);
    localStorage.setItem("paraLength", value);
    // Immediately reset the test with a new paragraph.
    clearInterval(intervalRef.current);
    setUserInput('');
    setTimeElapsed(0);
    setWpm(0);
    setAccuracy(100);
    setIsStarted(false);
    setIsFinished(false);
    const { min, max } = getWordRange(value);
    setTestText(generateParagraph(min, max));
  };

  // Toggle dark mode and persist the setting.
  const handleDarkModeToggle = () => {
    setDarkMode(prev => {
      localStorage.setItem("darkMode", (!prev).toString());
      return !prev;
    });
  };

  // Toggle showing/hiding the settings panel.
  const toggleSettingsPanel = () => {
    setShowSettings(prev => !prev);
  };

  return (
    <div className={`container ${darkMode ? "dark-mode" : ""}`}>
      <header>
        <h1>Typing Speed Test</h1>
        <p>speed test your typing with <b>speedtesttyping.net</b></p>
      </header>

      <nav className="settings">
        <label htmlFor="para-length">Paragraph Length:</label>
        <select id="para-length" value={paraLength} onChange={handleParaLengthChange}>
          <option value="short">Short (70-80 words)</option>
          <option value="medium">Medium (125-150 words)</option>
          <option value="long">Long (200-250 words)</option>
        </select>
      </nav>

      <main>
        <section className="test-box">
          <div className="prompt-text">
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
          <p>Time Elapsed: <span>{timeElapsed}</span> sec</p>
          <p>WPM: <span>{wpm}</span></p>
          <p>Accuracy: <span>{accuracy.toFixed(2)}</span>%</p>
        </section>

        <section className="buttons">
          <button onClick={handleFinishClick} disabled={isFinished || !isStarted}>
            Finish Test
          </button>
          <button onClick={resetTest}>Reset</button>
        </section>
      </main>

      <footer className="footer">
        <p>
        <img src="icons/icon32.png" alt="Site Icon" width="24" height="24" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Practice a bit, with a single click, using this {" "}
          <a href="https://example.com" target="_blank" rel="noopener noreferrer">
            link
          </a>.
        </p>
      </footer>

      {/* Settings button and panel for dark mode */}
      <div className="settings-toggle">
        <button className="gear-button" onClick={toggleSettingsPanel}>
          ⚙️
        </button>
        {showSettings && (
          <div className="settings-panel">
            <label>
              Dark Mode:
              <input type="checkbox" checked={darkMode} onChange={handleDarkModeToggle} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
