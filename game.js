// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game elements
let player;
let circles = [];
let gameActive = false; // Start as inactive until player clicks start
let gamePaused = false; // Track if game is paused
let gameInitialized = false; // Track if the game has been initialized
let level = 1;
let lives = 3;
let animationId;

// Mobile touch tracking
let touchStartX = 0;
let touchMoveX = 0;
let isTouching = false;

// Track previous angles for angle change calculation
let prevAngles = {};
let angleChangeRates = {};

// Calculate safe canvas size based on viewport
function calculateCanvasSize() {
    const isMobile = window.innerWidth < 768;
    const isKeyboardVisible = document.body.classList.contains('keyboard-visible');
    
    let widthRatio = 0.8;
    let heightRatio = 0.8;
    
    // Adjust ratios for mobile with keyboard
    if (isMobile) {
        if (isKeyboardVisible) {
            heightRatio = 0.7; // Smaller height when keyboard is visible
            widthRatio = 0.95; // Wider to use available space
        } else {
            heightRatio = 0.75; // Use more vertical space on mobile
        }
    }
    
    return {
        width: Math.floor(window.innerWidth * widthRatio),
        height: Math.floor(window.innerHeight * heightRatio)
    };
}

// Resize the game canvas and update game elements
function resizeGameCanvas() {
    if (!gameInitialized) return;
    
    const size = calculateCanvasSize();
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    // Update canvas size
    canvas.width = size.width;
    canvas.height = size.height;
    
    // Reposition player proportionally if game is active
    if (player) {
        // Scale x position
        player.x = (player.x / oldWidth) * canvas.width;
        
        // Determine if we're on mobile
        const isMobile = window.innerWidth < 768;
        
        // Calculate speed multiplier for mobile devices
        const mobileSpeedMultiplier = isMobile ? 1.5 : 1.0; // 1.5x speed on mobile
        
        // Update player speeds based on current device
        player.baseSpeed = GAME_PARAMS.PLAYER_SPEED * mobileSpeedMultiplier;
        player.currentSpeed = player.slowing ? 
            GAME_PARAMS.PLAYER_SPEED * 0.3 * mobileSpeedMultiplier : 
            GAME_PARAMS.PLAYER_SPEED * mobileSpeedMultiplier;
        player.minSpeed = GAME_PARAMS.PLAYER_SPEED * 0.3 * mobileSpeedMultiplier;
        player.horizontalSpeed = isMobile ? GAME_PARAMS.PLAYER_SPEED * 0.6 * mobileSpeedMultiplier : GAME_PARAMS.PLAYER_SPEED;
        
        // Always position player at the bottom of screen
        // Only reposition if player is near bottom
        if (player.y > oldHeight * 0.7) {
            player.y = canvas.height - GAME_PARAMS.PLAYER_SIZE;
        } else {
            // Scale position proportionally if player is moving up
            player.y = (player.y / oldHeight) * canvas.height;
        }
    }
    
    // Regenerate circles with proper positioning if game is active
    if (circles.length > 0) {
        const isMobile = window.innerWidth < 768;
        generateCircles(isMobile);
    }
    
    // If the game is not active, redraw the static state
    if (!gameActive && gameInitialized) {
        drawInitialState();
    }
}

// Make the resize function available globally
window.resizeGameCanvas = resizeGameCanvas;

// Initialize the game
function init() {
    // Set canvas size based on viewport
    const size = calculateCanvasSize();
    canvas.width = size.width;
    canvas.height = size.height;
    
    // Determine if we're on mobile (using screen width as a basic detection method)
    const isMobile = window.innerWidth < 768;
    
    // Always place player at bottom of game area, regardless of device
    const verticalPosition = canvas.height - GAME_PARAMS.PLAYER_SIZE;
    
    // Calculate speed multiplier for mobile devices
    const mobileSpeedMultiplier = isMobile ? 1.5 : 1.0; // 1.5x speed on mobile
    
    // Create player with device-specific speeds
    player = {
        x: canvas.width / 2,
        y: verticalPosition,
        size: GAME_PARAMS.PLAYER_SIZE,
        color: '#00FF41', // Matrix green color for Neo
        baseSpeed: GAME_PARAMS.PLAYER_SPEED * mobileSpeedMultiplier, // Apply speed multiplier for mobile
        currentSpeed: GAME_PARAMS.PLAYER_SPEED * mobileSpeedMultiplier, // Apply speed multiplier for mobile
        minSpeed: GAME_PARAMS.PLAYER_SPEED * 0.3 * mobileSpeedMultiplier, // Apply speed multiplier for mobile slow mode
        slowing: false, // Flag to track if user is slowing down
        // Horizontal movement speed also gets the mobile multiplier
        horizontalSpeed: isMobile ? GAME_PARAMS.PLAYER_SPEED * 0.6 * mobileSpeedMultiplier : GAME_PARAMS.PLAYER_SPEED,
        moving: {
            left: false,
            right: false
        }
    };
    
    // Generate circles for each row - adjusted for mobile vertical positioning
    generateCircles(isMobile);
    
    // Reset angle tracking
    prevAngles = {};
    angleChangeRates = {};
    
    // Update game info display
    updateGameInfo();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show the start screen
    document.getElementById('startScreen').style.display = 'block';
    
    // Show controls for level 1, hide for later levels
    updateControlsVisibility();
    
    // Log current parameters to console
    console.log('Game initialized with parameters:');
    logGameParams();
    console.log(`Player speed multiplier on mobile: ${mobileSpeedMultiplier}x`);
    
    // Draw the initial state
    drawInitialState();
    
    gameInitialized = true;
}

// Update controls visibility based on level
function updateControlsVisibility() {
    const controlsElement = document.getElementById('controls');
    
    if (level <= 1) {
        controlsElement.style.opacity = '1';
    } else {
        controlsElement.style.opacity = '0';
    }
}

// Draw the initial state without starting the game loop
function drawInitialState() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw circles
    circles.forEach(circle => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.size, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();
        ctx.closePath();
    });
    
    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
    
    // Draw stippled lines
    drawStippledLines();
}

// Calculate angle between player and circle
function calculateAngle(player, circle) {
    return Math.atan2(circle.y - player.y, circle.x - player.x);
}

// Calculate the change rate of angle
function updateAngleChangeRates() {
    circles.forEach(circle => {
        if (circle.y < player.y) {
            const circleId = `${circle.row}-${circles.indexOf(circle)}`;
            const currentAngle = calculateAngle(player, circle);
            
            if (prevAngles[circleId] !== undefined) {
                // Calculate the change in angle
                let deltaAngle = currentAngle - prevAngles[circleId];
                
                // Handle angle wrapping (e.g., from π to -π)
                if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
                if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
                
                // Smooth the angle change rate (weighted average)
                if (angleChangeRates[circleId] !== undefined) {
                    angleChangeRates[circleId] = 0.8 * angleChangeRates[circleId] + 0.2 * Math.abs(deltaAngle);
                } else {
                    angleChangeRates[circleId] = Math.abs(deltaAngle);
                }
            }
            
            // Store current angle for next frame
            prevAngles[circleId] = currentAngle;
        }
    });
}

// Start the game when the player clicks the start button
function startGame() {
    gameActive = true;
    gamePaused = false;
    document.getElementById('startScreen').style.display = 'none';
    
    // Show the pause button when game starts
    document.getElementById('pauseButton').style.display = 'block';
    
    // Start the game loop
    gameLoop();
    
    console.log('Game started!');
}

// Pause the game
function pauseGame() {
    if (!gameActive) return;
    
    gamePaused = true;
    cancelAnimationFrame(animationId);
    document.getElementById('pauseScreen').style.display = 'block';
    
    console.log('Game paused');
}

// Resume the game
function resumeGame() {
    if (!gameActive) return;
    
    gamePaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
    
    // Restart the game loop
    gameLoop();
    
    console.log('Game resumed');
}

// Reset the game with current parameters
function resetGame() {
    // Stop current game loop
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Reset game state
    gameActive = false;
    gamePaused = false;
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    
    // Hide the pause button when game resets
    document.getElementById('pauseButton').style.display = 'none';
    
    // Reset level and lives
    level = 1;
    lives = 3;
    
    // Reset angle tracking
    prevAngles = {};
    angleChangeRates = {};
    
    // Reinitialize the game
    init();
    
    console.log('Game reset with updated parameters:');
    logGameParams();
}

// Generate circles for all rows
function generateCircles(isMobile = false) {
    circles = [];
    
    // Calculate the space needed for all rows
    const totalGameRows = GAME_PARAMS.ROWS + 2; // +2 for start and end safe zones
    const rowHeight = canvas.height / totalGameRows;
    
    // Determine proper vertical offset to ensure the top row is always visible
    let verticalOffset;
    
    if (isMobile) {
        // On mobile, apply a stronger offset to guarantee top row visibility
        // Force the first row to be at least 10% from the top of the screen
        verticalOffset = rowHeight - (canvas.height * 0.1);
    } else {
        // On desktop, use a smaller offset
        verticalOffset = rowHeight * 0.3;
    }
    
    // Ensure offset is positive
    verticalOffset = Math.max(0, verticalOffset);
    
    // Debug log to verify
    console.log(`Generating circles with verticalOffset: ${verticalOffset}, rowHeight: ${rowHeight}, isMobile: ${isMobile}`);
    
    for (let i = 0; i < GAME_PARAMS.ROWS; i++) {
        // Calculate row position, applying the vertical offset
        const y = rowHeight * (i + 1) - verticalOffset;
        const direction = i % 2 === 0 ? 1 : -1; // Alternate direction
        const speed = GAME_PARAMS.CIRCLE_SPEED_MIN + (Math.random() * (GAME_PARAMS.CIRCLE_SPEED_MAX - GAME_PARAMS.CIRCLE_SPEED_MIN));
        const circlesInRow = Math.floor(GAME_PARAMS.CIRCLES_PER_ROW_MIN + Math.random() * (GAME_PARAMS.CIRCLES_PER_ROW_MAX - GAME_PARAMS.CIRCLES_PER_ROW_MIN + 1));
        const spacing = canvas.width / circlesInRow;
        
        // Debug log for first row position
        if (i === 0) {
            console.log(`First row Y position: ${y}, canvas.height: ${canvas.height}`);
        }
        
        for (let j = 0; j < circlesInRow; j++) {
            const circle = {
                x: j * spacing + Math.random() * (spacing / 2),
                y: y,
                size: GAME_PARAMS.CIRCLE_SIZE,
                speed: speed * direction,
                color: getRandomColor(),
                row: i
            };
            circles.push(circle);
        }
    }
}

// Get a random color for circles
function getRandomColor() {
    const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Update game information display
function updateGameInfo() {
    document.getElementById('level').textContent = level;
    document.getElementById('lives').textContent = lives;
}

// Handle game over
function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    // Hide the pause button when game ends
    document.getElementById('pauseButton').style.display = 'none';
    
    document.getElementById('finalScore').textContent = level;
    document.getElementById('gameOver').style.display = 'block';
}

// Setup event listeners for keyboard and touch controls
function setupEventListeners() {
    // Keyboard event listeners
    window.addEventListener('keydown', (e) => {
        if (!gameActive || gamePaused) return;
        
        switch (e.key) {
            case 'ArrowDown':
            case 's':
            case ' ': // Space bar
                player.slowing = true;
                break;
            case 'ArrowLeft':
            case 'a':
                player.moving.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                player.moving.right = true;
                break;
            case 'p':
            case 'P':
            case 'Escape':
                pauseGame();
                break;
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (!gameActive || gamePaused) return;
        
        switch (e.key) {
            case 'ArrowDown':
            case 's':
            case ' ': // Space bar
                player.slowing = false;
                break;
            case 'ArrowLeft':
            case 'a':
                player.moving.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                player.moving.right = false;
                break;
        }
    });
    
    // Touch event listeners for mobile - using passive: false to prevent scrolling
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Prevent default touch behavior on game container to avoid text selection
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.addEventListener('touchstart', preventDefault, { passive: false });
        gameContainer.addEventListener('touchmove', preventDefault, { passive: false });
    }
    
    // Prevent default on specific game elements
    const elementsToPrevent = [
        document.getElementById('startScreen'),
        document.getElementById('pauseScreen'),
        document.getElementById('gameOver'),
        document.getElementById('topBar')
    ];
    
    elementsToPrevent.forEach(element => {
        if (element) {
            element.addEventListener('touchstart', preventDefault, { passive: false });
            element.addEventListener('touchmove', preventDefault, { passive: false });
        }
    });
    
    // Add both click and touch event listeners for buttons
    const startButton = document.getElementById('startButton');
    addButtonEventListener(startButton, startGame);
    
    // Pause button event listener
    const pauseButton = document.getElementById('pauseButton');
    addButtonEventListener(pauseButton, pauseGame);
    
    // Resume button event listener
    const resumeButton = document.getElementById('resumeButton');
    addButtonEventListener(resumeButton, resumeGame);
    
    // Restart button event listener
    const restartButton = document.getElementById('restartButton');
    addButtonEventListener(restartButton, () => {
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('startScreen').style.display = 'block';
        
        // Ensure pause button is hidden when returning to start screen
        document.getElementById('pauseButton').style.display = 'none';
        
        level = 1;
        lives = 3;
        gameActive = false;
        gamePaused = false;
        init();
    });
    
    // Resize event
    window.addEventListener('resize', () => {
        resizeGameCanvas();
    });
}

// Helper function to prevent default behavior
function preventDefault(e) {
    e.preventDefault();
}

// Helper function to add both click and touch event listeners to an element
function addButtonEventListener(element, eventHandler) {
    if (!element) return;
    
    // Regular click for desktop
    element.addEventListener('click', eventHandler);
    
    // Touch events for mobile
    element.addEventListener('touchend', function(e) {
        // Prevent ghost clicks and default behavior
        e.preventDefault();
        e.stopPropagation();
        
        // Don't trigger if the touch moved too much (likely a scroll)
        if (e.changedTouches && e.changedTouches[0]) {
            const touch = e.changedTouches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Only fire if we're still on the button
            if (element.contains(target) || element === target) {
                eventHandler(e);
            }
        } else {
            // Fallback if no changed touches
            eventHandler(e);
        }
    }, { passive: false });
}

// Handle touch start for mobile controls
function handleTouchStart(e) {
    e.preventDefault(); // Prevent default behavior like scrolling and text selection
    
    if (!gameActive || gamePaused) return;
    
    // Get the first touch position
    touchStartX = e.touches[0].clientX;
    touchMoveX = touchStartX; // Initialize touchMoveX to avoid jumps
    
    // Set slowing to true on touch
    player.slowing = true;
    isTouching = true;
}

// Handle touch move for mobile controls
function handleTouchMove(e) {
    e.preventDefault(); // Prevent default behavior like scrolling and text selection
    
    if (!gameActive || gamePaused || !isTouching) return;
    
    // Get current touch position
    touchMoveX = e.touches[0].clientX;
    
    // Calculate swipe direction
    const swipeDistance = touchMoveX - touchStartX;
    
    // Set movement based on swipe distance - using a much lower threshold for better responsiveness
    if (swipeDistance > 5) {
        player.moving.right = true;
        player.moving.left = false;
        
        // Add a small multiplier for faster movement on larger swipes, but keep it gentler
        if (swipeDistance > 40 && player.x < canvas.width - player.size) {
            // Reduce the multiplier (from 30 to 50) to make boost slower
            // Reduce the maximum cap (from 3 to 2) to limit maximum boost
            player.x += Math.min(swipeDistance / 50, 2); 
        }
    } else if (swipeDistance < -5) {
        player.moving.left = true;
        player.moving.right = false;
        
        // Add a small multiplier for faster movement on larger swipes, but keep it gentler
        if (swipeDistance < -40 && player.x > 0) {
            // Reduce the multiplier (from 30 to 50) to make boost slower
            // Reduce the maximum cap (from 3 to 2) to limit maximum boost
            player.x += Math.max(swipeDistance / 50, -2);
        }
    } else {
        player.moving.left = false;
        player.moving.right = false;
    }
}

// Handle touch end for mobile controls
function handleTouchEnd(e) {
    e.preventDefault(); // Prevent default behavior
    
    if (!gameActive || gamePaused) return;
    
    // Reset movement
    player.moving.left = false;
    player.moving.right = false;
    player.slowing = false;
    isTouching = false;
}

// Main game loop
function gameLoop() {
    if (!gameActive || gamePaused) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update angle change rates
    updateAngleChangeRates();
    
    // Update and draw circles
    updateCircles();
    
    // Update player position
    updatePlayerPosition();
    
    // Draw stippled lines to circles in front of player
    drawStippledLines();
    
    // Draw player
    drawPlayer();
    
    // Check for collisions
    checkCollisions();
    
    // Check for win condition
    checkWin();
    
    // Continue the game loop
    animationId = requestAnimationFrame(gameLoop);
}

// Update circles positions
function updateCircles() {
    circles.forEach(circle => {
        // Move circle
        circle.x += circle.speed;
        
        // Wrap around if circle goes off screen
        if (circle.speed > 0 && circle.x > canvas.width + circle.size) {
            circle.x = -circle.size;
        } else if (circle.speed < 0 && circle.x < -circle.size) {
            circle.x = canvas.width + circle.size;
        }
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.size, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();
        ctx.closePath();
    });
}

// Update player position based on movement
function updatePlayerPosition() {
    // Handle slowing down
    if (player.slowing) {
        player.currentSpeed = player.minSpeed;
    } else {
        player.currentSpeed = player.baseSpeed;
    }
    
    // Always move forward (up)
    player.y -= player.currentSpeed;
    if (player.y < 0) player.y = 0;
    
    // Left/right movement - use horizontalSpeed property instead of baseSpeed for better mobile control
    if (player.moving.left) {
        player.x -= player.horizontalSpeed;
        if (player.x < 0) player.x = 0;
    }
    if (player.moving.right) {
        player.x += player.horizontalSpeed;
        if (player.x > canvas.width - player.size) player.x = canvas.width - player.size;
    }
}

// Draw player
function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
    
    // Draw a brake indicator when slowing down
    if (player.slowing) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size / 2 * 1.3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}

// Draw stippled lines from player to circles in front
function drawStippledLines() {
    // Save current context state
    ctx.save();
    
    // Set default line style for stippled lines
    ctx.setLineDash(GAME_PARAMS.STIPPLED_LINE_DASH);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    
    // Draw lines to circles that are approaching the player
    circles.forEach(circle => {
        // Only draw lines to circles that are above the player (in front)
        if (circle.y < player.y) {
            // Calculate if this circle is moving toward the player
            const isApproaching = isCircleApproachingPlayer(circle, player);
            
            // Only draw lines for approaching circles
            if (isApproaching) {
                // Get the circle's ID for angle tracking
                const circleId = `${circle.row}-${circles.indexOf(circle)}`;
                
                // Default line properties
                let lineWidth = 1;
                let lineColor = 'rgba(255, 255, 255, 0.4)';
                
                // Only apply colored indicators for levels 1-5
                if (level <= 5 && angleChangeRates[circleId] !== undefined) {
                    // Thresholds for color changes based on angle change rate
                    // Increasing sensitivity - show warnings earlier
                    const lowThreshold = 0.0004; // Threshold for yellow warning (higher value = earlier warning)
                    const highThreshold = 0.0002; // Threshold for red danger (now at previous yellow threshold)
                    
                    // Apply color and thickness based on angle change rate
                    if (angleChangeRates[circleId] < highThreshold) {
                        // Red - Very low angle change rate means a likely collision path
                        lineColor = 'rgba(255, 50, 50, 0.8)';
                        lineWidth = 3;
                    } else if (angleChangeRates[circleId] < lowThreshold) {
                        // Yellow - Moderately low angle change rate means caution
                        lineColor = 'rgba(255, 255, 0, 0.6)';
                        lineWidth = 2;
                    }
                }
                
                // Apply the line style
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = lineColor;
                
                // Draw the line
                ctx.beginPath();
                ctx.moveTo(player.x, player.y);
                ctx.lineTo(circle.x, circle.y);
                ctx.stroke();
            }
        }
    });
    
    // Restore context state
    ctx.restore();
}

// Determine if a circle is approaching the player based on its movement
function isCircleApproachingPlayer(circle, player) {
    // Circle moving right (positive speed)
    if (circle.speed > 0) {
        // If circle is to the left of the player, it's approaching
        return circle.x < player.x;
    } 
    // Circle moving left (negative speed)
    else {
        // If circle is to the right of the player, it's approaching
        return circle.x > player.x;
    }
}

// Check for collisions between player and circles
function checkCollisions() {
    for (const circle of circles) {
        const dx = player.x - circle.x;
        const dy = player.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Collision detected
        if (distance < (player.size / 2) + circle.size) {
            handleCollision();
            break;
        }
    }
}

// Handle player collision with circle
function handleCollision() {
    lives--;
    updateGameInfo();
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Determine if we're on mobile (using screen width as a basic detection method)
        const isMobile = window.innerWidth < 768;
        
        // Calculate speed multiplier for mobile devices
        const mobileSpeedMultiplier = isMobile ? 1.5 : 1.0; // 1.5x speed on mobile
        
        // Reset player position to bottom of screen
        player.x = canvas.width / 2;
        player.y = canvas.height - GAME_PARAMS.PLAYER_SIZE;
        
        // Ensure speed properties are maintained after collision
        player.baseSpeed = GAME_PARAMS.PLAYER_SPEED * mobileSpeedMultiplier;
        player.currentSpeed = GAME_PARAMS.PLAYER_SPEED * mobileSpeedMultiplier;
        player.minSpeed = GAME_PARAMS.PLAYER_SPEED * 0.3 * mobileSpeedMultiplier;
        player.horizontalSpeed = isMobile ? GAME_PARAMS.PLAYER_SPEED * 0.6 * mobileSpeedMultiplier : GAME_PARAMS.PLAYER_SPEED;
    }
}

// Check if player reached the top (win condition)
function checkWin() {
    if (player.y <= player.size) {
        // Level completed
        level++;
        updateGameInfo();
        
        // Increase difficulty based on level
        // Even levels: Add one more row
        // Odd levels: Increase circles per row min and max by one
        if (level % 2 === 0) {
            // Even level - add one more row
            GAME_PARAMS.ROWS += 1;
            console.log(`Level ${level}: Increased rows to ${GAME_PARAMS.ROWS}`);
        } else {
            // Odd level - add one more circle per row (min and max)
            GAME_PARAMS.CIRCLES_PER_ROW_MIN += 1;
            GAME_PARAMS.CIRCLES_PER_ROW_MAX += 1;
            console.log(`Level ${level}: Increased circles per row to ${GAME_PARAMS.CIRCLES_PER_ROW_MIN}-${GAME_PARAMS.CIRCLES_PER_ROW_MAX}`);
        }
        
        // Update controls visibility - hide after level 1
        updateControlsVisibility();
        
        // Determine if we're on mobile (using screen width as a basic detection method)
        const isMobile = window.innerWidth < 768;
        
        // Calculate speed multiplier for mobile devices
        const mobileSpeedMultiplier = isMobile ? 1.5 : 1.0; // 1.5x speed on mobile
        
        // Reset player position to bottom of screen
        player.x = canvas.width / 2;
        player.y = canvas.height - GAME_PARAMS.PLAYER_SIZE;
        
        // Ensure speed properties are maintained after level change
        player.baseSpeed = GAME_PARAMS.PLAYER_SPEED * mobileSpeedMultiplier;
        player.currentSpeed = GAME_PARAMS.PLAYER_SPEED * mobileSpeedMultiplier;
        player.minSpeed = GAME_PARAMS.PLAYER_SPEED * 0.3 * mobileSpeedMultiplier;
        player.horizontalSpeed = isMobile ? GAME_PARAMS.PLAYER_SPEED * 0.6 * mobileSpeedMultiplier : GAME_PARAMS.PLAYER_SPEED;
        
        // Reset angle tracking for new level
        prevAngles = {};
        angleChangeRates = {};
        
        // Generate new circles with updated parameters
        generateCircles(isMobile);
        
        // Log that we've generated new circles with updated vertical positioning
        console.log(`Level ${level}: Generated new circles with top row positioning adjustment`);
    }
}

// Initialize the game when the page loads
window.onload = init; 