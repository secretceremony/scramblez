// Game state variables
let words = []; // Will be populated from external JSON
let originalWordsList = []; // To store the full list for restarting the game
let currentWordData = null; // Stores { word: "...", hint: "..." }
let currentWord = '';
let currentHint = '';
let scrambledWord = '';
let score = 0;
let timeLeft = 30; // Initial time in seconds
let gameInterval;
let gameActive = false;

// Get DOM elements
const introScreen = document.getElementById('introScreen');
const gameContainer = document.getElementById('gameContainer');
const playGameBtn = document.getElementById('playGameBtn'); // New Play button

const scrambledWordDisplay = document.getElementById('scrambledWordDisplay');
const hintDisplay = document.getElementById('hintDisplay'); // Hint display element
const guessInput = document.getElementById('guessInput');
const submitBtn = document.getElementById('submitBtn');
const startGameBtn = document.getElementById('startGameBtn'); // For "Start New Round"
const skipBtn = document.getElementById('skipBtn'); // Retained skip button
const scoreDisplay = document.getElementById('scoreDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const messageDisplay = document.getElementById('messageDisplay');
const gameModal = document.getElementById('gameModal');
const modalMessage = document.getElementById('modalMessage');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const closeButton = document.querySelector('.close-button');

// Note: The 'hintBtn' element is no longer directly referenced in JS as hint is automatic.
// You should remove the 'hintBtn' from index.html if you want to remove the button itself.


/**
 * Shuffles the letters of a word randomly.
 * @param {string} word - The word to scramble.
 * @returns {string} The scrambled word.
 */
function scrambleWord(word) {
    let a = word.split("");
    let n = a.length;

    for (let i = n - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

/**
 * Shows a message in a custom modal instead of using alert().
 * @param {string} messageText - The message to display.
 */
function showModalMessage(messageText) {
    modalMessage.textContent = messageText;
    gameModal.style.display = 'flex'; // Make it visible
}

/**
 * Closes the custom modal.
 */
function closeModal() {
    gameModal.style.display = 'none';
}

/**
 * Fetches words and their hints from an external JSON file.
 */
async function fetchWordsAndHints() {
    try {
        const response = await fetch('wordsAndHints.json'); // Path to your JSON file
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        originalWordsList = await response.json();
        // Create a shallow copy for the current game session
        words = [...originalWordsList];
    } catch (error) {
        console.error('Could not fetch words and hints:', error);
        showModalMessage('Failed to load words. Please check the word file (wordsAndHints.json).');
        // Disable game functionality if words can't be loaded
        playGameBtn.disabled = true;
        startGameBtn.disabled = true;
        submitBtn.disabled = true;
        skipBtn.disabled = true;
    }
}

/**
 * Loads a new random word, scrambles it, and updates the display.
 * Automatically shows the hint for the new word.
 */
function loadNewWord() {
    // Clear previous message and hint
    messageDisplay.textContent = '';
    hintDisplay.textContent = ''; // Clear hint display for new word
    guessInput.value = ''; // Clear input field

    // Reinitialize the word list if all words have been used
    if (words.length === 0) {
        if (originalWordsList.length === 0) {
            showModalMessage("No words loaded! Please check wordsAndHints.json.");
            endGame();
            return;
        }
        words = [...originalWordsList]; // Reset words from original full list
        showModalMessage("All words exhausted! Starting a new set of words.");
    }

    // Select a random word data object
    const randomIndex = Math.floor(Math.random() * words.length);
    currentWordData = words[randomIndex];
    currentWord = currentWordData.word.toUpperCase(); // Ensure word is uppercase
    currentHint = currentWordData.hint;

    // Remove the word from the list to avoid repetition within the same round
    words.splice(randomIndex, 1);

    // Scramble the word
    scrambledWord = scrambleWord(currentWord);

    // Ensure the scrambled word is different from the original (rare but possible)
    while (scrambledWord === currentWord) {
        scrambledWord = scrambleWord(currentWord);
    }

    scrambledWordDisplay.textContent = scrambledWord;
    hintDisplay.textContent = `Hint: ${currentHint}`; // Automatically display the hint
    guessInput.focus(); // Focus on the input field
}

/**
 * Updates the score display.
 */
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}

/**
 * Updates the timer display and handles game over.
 */
function updateTimer() {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;

    if (timeLeft <= 0) {
        endGame();
        showModalMessage(`Time's up! Your final score is: ${score}`);
    }
}

/**
 * Starts a new round of the game. This is called after the initial "Play Game" click.
 */
function startNewRound() {
    if (gameActive) {
        // If already active, it means we're restarting mid-game
        clearInterval(gameInterval); // Clear existing timer
    }

    score = 0;
    timeLeft = 30; // Reset time
    gameActive = true;
    updateScoreDisplay();
    timerDisplay.textContent = `Time: ${timeLeft}`;
    messageDisplay.textContent = 'Good luck!';
    submitBtn.disabled = false;
    skipBtn.disabled = false;
    guessInput.disabled = false;
    startGameBtn.textContent = 'Start New Round'; // Ensure button text is correct

    // Re-copy words from original list for a truly new game round
    words = [...originalWordsList];
    if (words.length === 0) {
         showModalMessage("No words available to start a new round. Please check wordsAndHints.json.");
         endGame(); // Ensure game is ended if no words
         return;
    }

    loadNewWord(); // Load the first word and its hint

    // Clear any existing interval before starting a new one
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    gameInterval = setInterval(updateTimer, 1000); // Update timer every second
}

/**
 * Ends the current game session.
 */
function endGame() {
    clearInterval(gameInterval);
    gameActive = false;
    submitBtn.disabled = true;
    skipBtn.disabled = true;
    guessInput.disabled = true;
    startGameBtn.textContent = 'Start New Round'; // Change button text back to "Start New Round"
    scrambledWordDisplay.textContent = "GAME OVER!";
    hintDisplay.textContent = ''; // Clear any displayed hint
    guessInput.value = '';
}

/**
 * Checks the user's guess against the current word.
 */
function checkGuess() {
    if (!gameActive) {
        showModalMessage("Please start a new round first!");
        return;
    }

    const userGuess = guessInput.value.toUpperCase().trim();
    if (userGuess === currentWord) {
        score += 10; // Increase score for correct guess
        updateScoreDisplay();
        messageDisplay.textContent = 'Correct! Well done!';
        loadNewWord(); // Load a new word (and its hint automatically)
    } else {
        score = Math.max(0, score - 5); // Decrease score for incorrect guess, but not below 0
        updateScoreDisplay();
        messageDisplay.textContent = 'Incorrect, try again!';
    }
}

/**
 * Skips the current word and loads a new one.
 */
function skipWord() {
    if (!gameActive) {
        showModalMessage("Please start a new round first!");
        return;
    }
    score = Math.max(0, score - 2); // Penalty for skipping
    updateScoreDisplay();
    messageDisplay.textContent = 'Word skipped.';
    loadNewWord(); // Load a new word (and its hint automatically)
}

/**
 * Handles the initial "Play Game" button click.
 * Hides the intro screen and shows the game container, then starts a new round.
 */
function handlePlayGame() {
    introScreen.classList.add('hidden'); // Hide the intro screen
    gameContainer.classList.remove('hidden'); // Show the game container
    startNewRound(); // Start the first round of the game
}


// Event Listeners
playGameBtn.addEventListener('click', handlePlayGame); // Listen for the initial Play button

startGameBtn.addEventListener('click', startNewRound); // Listen for "Start New Round" button
submitBtn.addEventListener('click', checkGuess);
skipBtn.addEventListener('click', skipWord);


// Allow pressing Enter to submit guess
guessInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        checkGuess();
    }
});

// Modal close buttons
modalCloseBtn.addEventListener('click', closeModal);
closeButton.addEventListener('click', closeModal);

// Initial setup on load: ensure intro screen is visible and game container is hidden
document.addEventListener('DOMContentLoaded', () => {
    introScreen.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    guessInput.disabled = true; // Input is disabled until game starts
    submitBtn.disabled = true;
    skipBtn.disabled = true;
    fetchWordsAndHints(); // Fetch words and hints when the DOM is loaded
});