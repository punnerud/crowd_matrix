# Crowd Matrix Neo - The One

A stylish browser-based game inspired by The Matrix, where you play as "The One" navigating through a crowd of agents. You automatically move forward (upward) and need to navigate to the other side of the screen while avoiding the agents (circles) moving in different directions across your path.

## Features

- Simple, responsive canvas-based gameplay
- Start game when you're ready
- Very slow movement for careful navigation
- Automatic forward movement with ability to slow down even further
- Progressive difficulty system that increases complexity with each level
- Lives system
- Stippled lines connecting Neo to agents in front
- Visual collision prediction system with colored lines (first 3 levels only)
- Colorful and dynamic moving obstacles
- Keyboard controls
- Adjustable game parameters via console

## How to Play

1. Open `index.html` in any modern web browser.
2. View the game layout and press "Start Game" when ready.
3. Your character (Neo) automatically moves forward (upward).
4. Use left/right controls to navigate and hold the slow down button to navigate carefully.
5. Try to reach the top of the screen without colliding with any of the agents (circles).
6. Each time you reach the top, you advance to the next level with increased difficulty.
7. You have 3 lives to start with. Colliding with an agent costs you one life.
8. The game ends when you run out of lives.

## Controls

- Slow Down: Down Arrow, S key, or Space bar
- Move Left: Left Arrow or A
- Move Right: Right Arrow or D

## Game Mechanics

- Your character automatically moves forward (upward) at a very slow pace
- Hold the slow down button to move even more carefully through tight spaces
- Agents move across the screen in alternating directions by row
- Stippled lines connect Neo to all agents that are ahead of you
- Each level increases the challenge with a progressive difficulty system
- Your score is the highest level you reach

## Progressive Difficulty System

The game gets progressively harder with each level in the following pattern:

- **Odd Levels (1, 3, 5, etc.)**: The number of agents per row increases by 1
- **Even Levels (2, 4, 6, etc.)**: The number of rows increases by 1

This creates a steadily increasing challenge as you progress through the game, with more obstacles to navigate around and more complex patterns to solve.

## Collision Prediction Lines

For the first 3 levels only, the game includes a visual indication system to help predict potential collisions:

- **White lines**: Normal paths with good angle change
- **Yellow lines (thicker)**: Caution - moderate risk of collision
- **Red lines (thickest)**: Danger - high risk of collision

These colored lines help you identify which paths are the most dangerous. The color is based on how quickly the angle between you and each agent is changing. A nearly constant angle (red line) indicates you're on a collision course.

After level 3, this assistance is removed to increase the challenge.

## Adjusting Game Parameters

You can adjust various game parameters directly from the browser console:

1. Open your browser's developer tools (F12 or right-click and select "Inspect")
2. Go to the Console tab
3. Use the following commands to view or change parameters:

```javascript
// View all current parameters
logGameParams();

// Change a specific parameter
setGameParam('PARAMETER_NAME', value);

// Examples:
setGameParam('CIRCLES_PER_ROW_MAX', 5);   // Increase maximum agents per row
setGameParam('CIRCLE_SPEED_MAX', 0.1);    // Increase maximum agent speed
setGameParam('ROWS', 6);                  // Increase number of rows
setGameParam('PLAYER_SPEED', 0.8);        // Adjust forward movement speed
```

### Available Parameters

- `CIRCLES_PER_ROW_MIN`: Minimum agents per row
- `CIRCLES_PER_ROW_MAX`: Maximum agents per row
- `CIRCLE_SIZE`: Size of the agents
- `CIRCLE_SPEED_MIN`: Minimum agent speed
- `CIRCLE_SPEED_MAX`: Maximum agent speed
- `ROWS`: Number of rows with moving agents
- `PLAYER_SIZE`: Size of Neo (the player)
- `PLAYER_SPEED`: Player forward movement speed
- `STIPPLED_LINE_DASH`: Pattern for stippled lines [dash, gap]

## Files

- `index.html` - Main HTML file with game parameters
- `game.js` - Game logic and rendering
- `README.md` - This file

## Requirements

- Any modern web browser with JavaScript enabled
- No additional libraries or dependencies needed

Remember: There is no spoon. Enjoy the game! 