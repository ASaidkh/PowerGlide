import { useState, useEffect, useRef, useCallback } from 'react';
import Vosk from 'react-native-vosk';

export default function useVoskRecognition() {
  const [result, setResult] = useState<string | undefined>();
  const [recognizing, setRecognizing] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [previousRecognizing, setPreviousRecognizing] = useState<boolean>(false); // Track previous state
  const vosk = useRef(new Vosk()).current;

  const loadModel = useCallback(() => {
    vosk
      .loadModel('vosk-model-small-en-us-0.15')  // Just the folder name containing the model files
      .then(() => {
        setModelLoaded(true);
        console.log('Model loaded successfully');
        startRecognition(); // Start recognition after the model is loaded
      })
      .catch((e) => {
        setModelLoaded(false);
        console.error('Model load error:', e);
      });
  }, [vosk]);

  const startRecognition = () => {
    if (!modelLoaded) {
      console.error('Model is not loaded yet');
      return;
    }
    if (recognizing) {
      // Only log if the previous state was different
      if (!previousRecognizing) {
        console.log('Recognizer is already running.');
        setPreviousRecognizing(true);
      }
      return; // Avoid starting recognition if it's already in use
    }

    vosk
      .start({ grammar: ['go', 'reverse', 'speed one', 'speed two', 'speed three', 'stop', 'left', 'right'] })
      .then(() => {
        setRecognizing(true);
        setPreviousRecognizing(true); // Update previousRecognizing
        console.log('Starting recognition...');
      })
      .catch((e) => console.error('Start recognition error:', e));
  };

  const stopRecognition = () => {
    vosk.stop();
    setRecognizing(false);
    // Only log if the previous state was different
    if (previousRecognizing) {
      console.log('Recognition stopped');
      setPreviousRecognizing(false); // Update previousRecognizing
    }
  };

  // Handle the result and partial results
  useEffect(() => {
    const resultEvent = vosk.onResult((res) => {
      console.log('Recognition result:', res);
      setResult(res);
    });

    const partialResultEvent = vosk.onPartialResult((res) => {
      setResult(res);
    });

    const errorEvent = vosk.onError((e) => {
      console.error('Recognition error:', e);
    });

    const timeoutEvent = vosk.onTimeout(() => {
      console.log('Recognition timed out');
      setRecognizing(false);
    });

    return () => {
      resultEvent.remove();
      partialResultEvent.remove();
      errorEvent.remove();
      timeoutEvent.remove();
    };
  }, [vosk]);

  return { result, recognizing, modelLoaded, loadModel, startRecognition, stopRecognition };
}
