import { useState, useEffect, useRef, useCallback } from 'react';
import Vosk from 'react-native-vosk';

export default function useVoskRecognition() {
  const [result, setResult] = useState<string | undefined>();
  const [recognizing, setRecognizing] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const vosk = useRef(new Vosk()).current;

  const loadModel = useCallback(() => {
    vosk
      .loadModel('vosk-model-small-en-us-0.15')  // Just the folder name containing the model files
      .then(() => {
        setModelLoaded(true);
        console.log('Model loaded successfully');
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

    vosk
      .start({ grammar: ['go', 'reverse', 'speed one', 'speed two', 'speed three', 'stop'] })
      .then(() => {
        setRecognizing(true);
        console.log('Starting recognition...');
      })
      .catch((e) => console.error('Start recognition error:', e));
  };

  const stopRecognition = () => {
    vosk.stop();
    setRecognizing(false);
    console.log('Recognition stopped');
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

  return { result, recognizing, modelLoaded, loadModel, startRecognition, stopRecognition };  // Return modelLoaded
}
