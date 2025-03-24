// new command handler

export const processCommand = (
  headDirection: string, 
  headAngle: number, 
  voiceCommand: string, 
  addCommand: (command: { type: string; value: string; angle?: number }) => void
) => {
  console.log(`Processing Command: Voice=${voiceCommand}, Head=${headDirection}, Angle=${headAngle}`);

  let direction = 0; // Default to neutral
  let turn = 'N'; // Default to neutral
  let angle = 0; // Default to no turn angle

  // Determine movement direction
  if (voiceCommand === 'go') {
    direction = 1; // Forward
  } else if (voiceCommand === 'reverse') {
    direction = -1; // Backward
  }

  // Determine turning direction and angle
  if (headDirection === 'Left') {
    turn = 'L';
    angle = -headAngle; // Negative for left turn
  } else if (headDirection === 'Right') {
    turn = 'R';
    angle = headAngle; // Positive for right turn
  }

  // Log formatted command
  console.log(`[${direction}, ${turn}, ${angle}]`);

  // Store the command in commandBuffer
  addCommand({ type: 'movement', value: `[${direction}, ${turn}, ${angle}]`, angle });
};
