document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const puzzleBoard = document.getElementById('puzzle-board');
    const previewImage = document.getElementById('preview-image');
    const startButton = document.getElementById('start-button');
    const resetButton = document.getElementById('reset-button');
    const difficultySelect = document.getElementById('difficulty');
    const imageUpload = document.getElementById('image-upload');
    const defaultImageBtn = document.getElementById('default-image');
    const movesCount = document.getElementById('moves-count');
    const timerElement = document.getElementById('timer');
    const successMessage = document.getElementById('success-message');
    const finalMoves = document.getElementById('final-moves');
    const finalTime = document.getElementById('final-time');
    const playAgainBtn = document.getElementById('play-again');
    const loadingIndicator = document.getElementById('loading-indicator');
    const doneButton = document.getElementById('done-button');
    
    // Game variables
    let gridSize = 4; // Default 4x4
    let tiles = [];
    let moves = 0;
    let gameStarted = false;
    let timerInterval;
    let seconds = 0;
    let minutes = 0;
    let currentImage = null;
    let originalPositions = [];
    let currentPositions = [];
    
    // Default image sources (with fallbacks)
    const defaultImageSources = [
        'https://source.unsplash.com/random/800x800/?landscape,nature',
        'https://picsum.photos/800/800',
        'https://source.unsplash.com/random/800x800/?city',
        'https://source.unsplash.com/random/800x800/?animal'
    ];
    
    // Initialize the game
    function init() {
        loadDefaultImage();
        setupEventListeners();
    }
    
    // Show loading indicator
    function showLoading() {
        loadingIndicator.classList.remove('hidden');
    }
    
    // Hide loading indicator
    function hideLoading() {
        loadingIndicator.classList.add('hidden');
    }
    
    // Load the default image
    function loadDefaultImage() {
        showLoading();
        let currentSourceIndex = 0;
        
        const tryLoadImage = () => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            img.onload = function() {
                currentImage = img;
                previewImage.src = img.src;
                previewImage.style.display = 'block';
                hideLoading();
            };
            
            img.onerror = function() {
                currentSourceIndex++;
                if (currentSourceIndex < defaultImageSources.length) {
                    // Try the next source
                    img.src = defaultImageSources[currentSourceIndex];
                } else {
                    // All sources failed
                    hideLoading();
                    alert('Failed to load any images. Please try uploading your own image.');
                }
            };
            
            img.src = defaultImageSources[currentSourceIndex];
        };
        
        tryLoadImage();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        startButton.addEventListener('click', startGame);
        resetButton.addEventListener('click', resetGame);
        difficultySelect.addEventListener('change', changeDifficulty);
        imageUpload.addEventListener('change', handleImageUpload);
        defaultImageBtn.addEventListener('click', loadDefaultImage);
        playAgainBtn.addEventListener('click', () => {
            successMessage.classList.add('hidden');
            resetGame();
        });
        doneButton.addEventListener('click', manualCheckPuzzle);
    }
    
    // Manually check if the puzzle is solved when Done button is clicked
    function manualCheckPuzzle() {
        if (!gameStarted) return;
        
        const tiles = Array.from(puzzleBoard.children);
        let solved = true;
        
        // Check if each tile is in its correct position
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            // A tile is in the correct position if its originalIndex equals its position in the grid
            if (parseInt(tile.dataset.originalIndex) !== i) {
                solved = false;
                break;
            }
        }
        
        if (solved) {
            gameWon();
        } else {
            alert('The puzzle is not solved yet. Keep trying!');
        }
    }
    
    // Handle image upload
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            showLoading();
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const img = new Image();
                
                img.onload = function() {
                    currentImage = img;
                    previewImage.src = img.src;
                    previewImage.style.display = 'block';
                    hideLoading();
                };
                
                img.onerror = function() {
                    hideLoading();
                    alert('Failed to load the uploaded image. Please try another image.');
                };
                
                img.src = event.target.result;
            };
            
            reader.onerror = function() {
                hideLoading();
                alert('Error reading the file. Please try another image.');
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    // Change difficulty (grid size)
    function changeDifficulty() {
        gridSize = parseInt(difficultySelect.value);
        if (gameStarted) {
            resetGame();
            createPuzzle();
        }
    }
    
    // Start the game
    function startGame() {
        if (!currentImage) {
            alert('Please wait for the image to load or upload an image.');
            return;
        }
        
        gameStarted = true;
        moves = 0;
        movesCount.textContent = moves;
        seconds = 0;
        minutes = 0;
        updateTimer();
        
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
        
        createPuzzle();
        doneButton.classList.remove('hidden');
    }
    
    // Reset the game
    function resetGame() {
        gameStarted = false;
        moves = 0;
        movesCount.textContent = moves;
        clearInterval(timerInterval);
        seconds = 0;
        minutes = 0;
        updateTimer();
        puzzleBoard.innerHTML = '';
        doneButton.classList.add('hidden');
    }
    
    // Update the timer
    function updateTimer() {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
        
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerElement.textContent = formattedTime;
    }
    
    // Create the puzzle
    function createPuzzle() {
        showLoading();
        puzzleBoard.innerHTML = '';
        tiles = [];
        originalPositions = [];
        currentPositions = [];
        
        // Set the grid template
        puzzleBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        // Ensure we have a valid image
        if (!currentImage || !currentImage.complete || !currentImage.naturalWidth) {
            hideLoading();
            alert('Image not loaded properly. Please try again or choose another image.');
            resetGame();
            return;
        }
        
        // Create canvas to split the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate tile size based on the smaller dimension of the image
        // to ensure square tiles
        const tileSize = Math.min(currentImage.naturalWidth, currentImage.naturalHeight) / gridSize;
        
        canvas.width = tileSize;
        canvas.height = tileSize;
        
        // Create tiles
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const index = row * gridSize + col;
                
                try {
                    // Draw the portion of the image on the canvas
                    ctx.clearRect(0, 0, tileSize, tileSize);
                    ctx.drawImage(
                        currentImage,
                        col * tileSize, row * tileSize, tileSize, tileSize,
                        0, 0, tileSize, tileSize
                    );
                    
                    // Create tile element
                    const tile = document.createElement('div');
                    tile.className = 'puzzle-tile';
                    tile.dataset.originalIndex = index;
                    tile.dataset.currentIndex = index;
                    
                    // Set the background image from canvas
                    const tileImage = canvas.toDataURL('image/jpeg', 0.8);
                    tile.style.backgroundImage = `url(${tileImage})`;
                    tile.style.backgroundSize = '100% 100%';
                    
                    // Store original position
                    originalPositions.push({
                        row,
                        col,
                        index
                    });
                    
                    // Add to tiles array
                    tiles.push(tile);
                    
                    // Add drag events
                    tile.setAttribute('draggable', true);
                    tile.addEventListener('dragstart', dragStart);
                    tile.addEventListener('dragover', dragOver);
                    tile.addEventListener('dragenter', dragEnter);
                    tile.addEventListener('dragleave', dragLeave);
                    tile.addEventListener('drop', drop);
                    tile.addEventListener('dragend', dragEnd);
                    
                    // Add to the board
                    puzzleBoard.appendChild(tile);
                } catch (error) {
                    console.error('Error creating puzzle tile:', error);
                    // Create a fallback tile with number if image processing fails
                    const tile = document.createElement('div');
                    tile.className = 'puzzle-tile';
                    tile.dataset.originalIndex = index;
                    tile.dataset.currentIndex = index;
                    tile.style.backgroundColor = '#3498db';
                    tile.style.display = 'flex';
                    tile.style.justifyContent = 'center';
                    tile.style.alignItems = 'center';
                    tile.style.color = 'white';
                    tile.style.fontSize = '20px';
                    tile.textContent = index + 1;
                    
                    // Store original position
                    originalPositions.push({
                        row,
                        col,
                        index
                    });
                    
                    // Add to tiles array
                    tiles.push(tile);
                    
                    // Add drag events
                    tile.setAttribute('draggable', true);
                    tile.addEventListener('dragstart', dragStart);
                    tile.addEventListener('dragover', dragOver);
                    tile.addEventListener('dragenter', dragEnter);
                    tile.addEventListener('dragleave', dragLeave);
                    tile.addEventListener('drop', drop);
                    tile.addEventListener('dragend', dragEnd);
                    
                    // Add to the board
                    puzzleBoard.appendChild(tile);
                }
            }
        }
        
        // Shuffle the tiles
        shuffleTiles();
        hideLoading();
    }
    
    // Shuffle the tiles
    function shuffleTiles() {
        const tileElements = Array.from(puzzleBoard.children);
        currentPositions = [...originalPositions];
        
        // Fisher-Yates shuffle algorithm
        for (let i = tileElements.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            
            // Swap positions in the DOM
            puzzleBoard.insertBefore(tileElements[i], tileElements[j]);
            puzzleBoard.insertBefore(tileElements[j], tileElements[i]);
            
            // Swap in the currentPositions array
            [currentPositions[i], currentPositions[j]] = [currentPositions[j], currentPositions[i]];
            
            // Update dataset
            tileElements[i].dataset.currentIndex = i;
            tileElements[j].dataset.currentIndex = j;
        }
    }
    
    // Drag and Drop functions
    function dragStart(e) {
        if (!gameStarted) return;
        e.target.classList.add('dragging');
    }
    
    function dragOver(e) {
        if (!gameStarted) return;
        e.preventDefault();
    }
    
    function dragEnter(e) {
        if (!gameStarted) return;
        e.preventDefault();
        const tile = e.target.closest('.puzzle-tile');
        if (tile) {
            tile.classList.add('drag-over');
        }
    }
    
    function dragLeave(e) {
        if (!gameStarted) return;
        const tile = e.target.closest('.puzzle-tile');
        if (tile) {
            tile.classList.remove('drag-over');
        }
    }
    
    // Handle drop event
    function drop(e) {
        if (!gameStarted) return;
        e.preventDefault();
        
        const draggedTile = document.querySelector('.dragging');
        const targetTile = e.target.closest('.puzzle-tile');
        
        if (draggedTile && targetTile && draggedTile !== targetTile) {
            // Swap background images
            const tempBg = draggedTile.style.backgroundImage;
            draggedTile.style.backgroundImage = targetTile.style.backgroundImage;
            targetTile.style.backgroundImage = tempBg;
            
            // Swap originalIndex data attributes
            const tempOriginalIndex = draggedTile.dataset.originalIndex;
            draggedTile.dataset.originalIndex = targetTile.dataset.originalIndex;
            targetTile.dataset.originalIndex = tempOriginalIndex;
            
            // Swap currentIndex data attributes
            const tempCurrentIndex = draggedTile.dataset.currentIndex;
            draggedTile.dataset.currentIndex = targetTile.dataset.currentIndex;
            targetTile.dataset.currentIndex = tempCurrentIndex;
            
            // Update moves counter
            moves++;
            movesCount.textContent = moves;
        }
        
        targetTile.classList.remove('drag-over');
    }
    
    function dragEnd(e) {
        if (!gameStarted) return;
        e.target.classList.remove('dragging');
    }
    
    // Check if the puzzle is solved
    function checkPuzzleSolved() {
        const tiles = Array.from(puzzleBoard.children);
        let solved = true;
        
        // Check if each tile is in its correct position
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            // A tile is in the correct position if its originalIndex equals its position in the grid
            if (parseInt(tile.dataset.originalIndex) !== i) {
                solved = false;
                break;
            }
        }
        
        if (solved) {
            gameWon();
        }
    }
    
    // Game won
    function gameWon() {
        clearInterval(timerInterval);
        gameStarted = false;
        
        finalMoves.textContent = moves;
        finalTime.textContent = timerElement.textContent;
        successMessage.classList.remove('hidden');
        doneButton.classList.add('hidden');
        
        // Save to localStorage if needed
        saveScore();
    }
    
    // Save score to localStorage
    function saveScore() {
        const difficulty = difficultySelect.value;
        const score = {
            difficulty,
            moves,
            time: timerElement.textContent,
            date: new Date().toISOString()
        };
        
        let scores = JSON.parse(localStorage.getItem('puzzleScores')) || [];
        scores.push(score);
        localStorage.setItem('puzzleScores', JSON.stringify(scores));
    }
    
    // Initialize the game
    init();
});