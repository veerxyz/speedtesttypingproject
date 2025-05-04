import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // Predefined text for the test (you can customize this as needed)
  const testText = "The quick brown fox jumps over the lazy dog.";

  // Local states for tracking user input, timer, and status
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // References to handle timing
  const intervalRef = useRef(null);

  // Start the timer on first key press
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (!isStarted) {
      setIsStarted(true);
      // Start the timer which updates every second
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    setUserInput(value);

    // Check if test is finished (optional: if user types full testText)
    if (value === testText) {
      endTest();
    }
  };

  // Calculate Words Per Minute (WPM)
  const calculateWPM = (input, seconds) => {
    const wordsCount = input.trim().split(/\s+/).length;
    return seconds > 0 ? Math.round((wordsCount / seconds) * 60) : 0;
  };

  // End the typing test
  const endTest = () => {
    clearInterval(intervalRef.current);
    setIsFinished(true);
    const calculatedWPM = calculateWPM(userInput, timeElapsed);
    setWpm(calculatedWPM);
  };

  // Reset test to initial state
  const resetTest = () => {
    clearInterval(intervalRef.current);
    setUserInput('');
    setTimeElapsed(0);
    setWpm(0);
    setIsStarted(false);
    setIsFinished(false);
  };

  // For manual test completion if user doesn't type the full text (optional)
  const handleFinishClick = () => {
    if (isStarted && !isFinished) {
      endTest();
    }
  };

  // Optional: Update wpm display in real-time (if desired)
  useEffect(() => {
    if (isStarted && !isFinished) {
      setWpm(calculateWPM(userInput, timeElapsed));
    }
  }, [timeElapsed, userInput, isStarted, isFinished]);

  return (
    <div className="container">
      <h1>Speed Typing Test</h1>
      <div className="test-box">
        <p className="prompt-text">{testText}</p>
        <textarea
          placeholder="Start typing here..."
          value={userInput}
          onChange={handleInputChange}
          disabled={isFinished}
          rows="5"
        />
      </div>
      <div className="stats">
        <p>Time Elapsed: {timeElapsed} seconds</p>
        <p>WPM: {wpm}</p>
      </div>
      <div className="buttons">
        <button onClick={handleFinishClick} disabled={isFinished || !isStarted}>
          Finish Test
        </button>
        <button onClick={resetTest}>Reset</button>
      </div>
    </div>
  );
}

export default App;
