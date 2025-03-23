export const processCommand = (headDirection: string, headAngle: number, voiceCommand: string) => {
  console.log(`Processing Command: ${voiceCommand}, Head Direction: ${headDirection}, Head Angle: ${headAngle}`);

  // Stop takes priority over everything
  if (voiceCommand === 'stop') {
    console.log('Stop Command Sent');
    return;
  }

  let commandOutput = '';

  // Handling movement commands
  if (voiceCommand === 'go' || voiceCommand === 'reverse') {
    commandOutput += voiceCommand === 'go' ? 'Moving Forward' : 'Moving Backward';

    // Combine with head movement if applicable
    if (headDirection === 'Left' || headDirection === 'Right') {
      commandOutput += `, Turning ${headDirection.toLowerCase()} at ${headAngle} degrees`;
    }
  } 
  // Head-only movement (when no overriding voice command exists)
  else if (!voiceCommand && (headDirection === 'Left' || headDirection === 'Right')) {
    commandOutput = `Adjusting direction: Turning ${headDirection.toLowerCase()} at ${headAngle} degrees`;
  } 
  // Default case (e.g., no significant input)
  else {
    commandOutput = 'Neutral position detected, no movement command issued';
  }

  console.log(commandOutput);
};
