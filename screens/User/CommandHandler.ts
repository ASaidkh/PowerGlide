export const processCommand = (headDirection: string, headAngle: number, voiceCommand: string) => {
    console.log(`Processing Command: ${voiceCommand}, Head Direction: ${headDirection}, Head Angle: ${headAngle}`);
  
    // Process commands based on head direction, angle, and voice command
    if (voiceCommand === 'go') {
      // Send 'go' signal to VESC or other systems
      console.log('Go Command Sent');
    } else if (voiceCommand === 'reverse') {
      // Send reverse signal to VESC
      console.log('Reverse Command Sent');
    } else if (voiceCommand === 'stop') {
      // Stop the system
      console.log('Stop Command Sent');
    }
  
    // Optionally adjust commands based on head direction
    if (headDirection === 'Left') {
      // Handle left command
      console.log('Turning left based on head turn');
    } else if (headDirection === 'Right') {
      // Handle right command
      console.log('Turning right based on head turn');
    } else {
      // Handle neutral direction
      console.log('Neutral position detected');
    }
  };