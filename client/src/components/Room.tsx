import { Socket } from 'socket.io-client';
import {
  useEffect,
  useState,
  Suspense,
  useRef,
  Dispatch,
  SetStateAction,
  useMemo,
} from 'react';
import { Canvas, useLoader, useFrame, ThreeElements } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh } from 'three';

interface Props {
  roomID: string;
  socket: Socket;
  handleEndGame: (result: string | null) => void;
}

function determineResult(choice: string, oppChoice: string): string {
  if (choice === oppChoice) {
    return 'Tie';
  }
  if (choice === 'rock' && oppChoice === 'scissors') {
    return 'Win';
  }
  if (choice === 'paper' && oppChoice === 'rock') {
    return 'Win';
  }
  if (choice === 'scissors' && oppChoice === 'paper') {
    return 'Win';
  }
  if (choice === 'rock' && oppChoice === 'paper') {
    return 'Lose';
  }
  if (choice === 'paper' && oppChoice === 'scissors') {
    return 'Lose';
  }
  if (choice === 'scissors' && oppChoice === 'rock') {
    return 'Lose';
  }
  return 'error';
}

function getScaleAdjustment(choice: string): number {
  if (choice === 'rock') {
    return 1.5;
  }
  if (choice === 'paper') {
    return 0.006;
  }
  if (choice === 'scissors') {
    return 1;
  }
  return 1;
}

function Room({ roomID, socket, handleEndGame }: Props) {
  const [oppChoice, setOppChoice] = useState('');
  const [choice, setChoice] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    socket.on('choice', (sentChoice) => {
      setOppChoice(sentChoice);
      console.log('choice', sentChoice);
    });

    socket.on('opponentLeft', () => {
      setMessage('Opponent left');
      handleEndGame(null);
    });

    return () => {
      socket.off('choice');
      socket.off('opponentLeft');
    };
  }, []);

  const handleClick = (selectChoice: string) => {
    if (!choice) {
      setChoice(selectChoice);
      socket.emit('choice', { choice: selectChoice, roomID });
    }
  };

  useEffect(() => {
    if (choice && oppChoice) {
      const result = determineResult(choice, oppChoice);
      setResult(result);
      console.log(result);
      handleEndGame(result);
    }
  }, [choice, oppChoice]);

  return (
    <div>
      <p>Room: {roomID}</p>
      {(!choice || choice === 'rock') && (
        <button
          onClick={() => handleClick('rock')}
          className={
            'm-2 p-2 border rounded-md flex flex-col items-center w-40 h-40 ' +
            (result === 'Win' ? 'bg-green-500' : '') +
            (result === 'Lose' ? 'bg-red-500' : '')
          }
        >
          <Canvas>
            <Model
              choice={choice}
              handleClick={handleClick}
              model={'/rock/scene.gltf'}
              name="rock"
              scaleAdjustment={1.5}
            />
          </Canvas>
          <p>Rock</p>
        </button>
      )}
      {(!choice || choice === 'paper') && (
        <button
          onClick={() => handleClick('paper')}
          className={
            'm-2 p-2 border rounded-md flex flex-col items-center w-40 h-40 ' +
            (result === 'Win' ? 'bg-green-500' : '') +
            (result === 'Lose' ? 'bg-red-500' : '')
          }
        >
          <Canvas>
            <Model
              choice={choice}
              handleClick={handleClick}
              model={'/paper/scene.gltf'}
              name="paper"
              scaleAdjustment={0.006}
            />
          </Canvas>
          <p>Paper</p>
        </button>
      )}
      {(!choice || choice === 'scissors') && (
        <button
          onClick={() => handleClick('scissors')}
          className={
            'm-2 p-2 border rounded-md flex flex-col items-center w-40 h-40 ' +
            (result === 'Win' ? 'bg-green-500' : '') +
            (result === 'Lose' ? 'bg-red-500' : '')
          }
        >
          <Canvas>
            <Model
              choice={choice}
              handleClick={handleClick}
              model={'/scissors/scene.gltf'}
              name="scissors"
              scaleAdjustment={1}
            />
          </Canvas>
          <p>Scissors</p>
        </button>
      )}
      {choice && oppChoice && (
        <button
          className={
            'm-2 p-2 border rounded-md flex flex-col items-center w-40 h-40 ' +
            (result === 'Win' ? 'bg-red-500' : '') +
            (result === 'Lose' ? 'bg-green-500' : '')
          }
        >
          <Canvas>
            <Model
              id="opponent"
              choice={oppChoice}
              handleClick={() => {}}
              model={`/${oppChoice}/scene.gltf`}
              name={oppChoice}
              scaleAdjustment={getScaleAdjustment(oppChoice)}
            />
          </Canvas>
          <p>{oppChoice}</p>
        </button>
      )}
      {choice && <p>You chose {choice}</p>}
      {oppChoice && <p>Opponent has chose {!!choice && oppChoice} </p>}
      {result && <p>{result}</p>}
      {message && <p>{message}</p>}
    </div>
  );
}

interface ModelProps {
  id?: string;
  choice: string;
  handleClick: (choice: string) => void;
  model: string;
  name: string;
  scaleAdjustment: number;
}

const Model = ({
  id,
  choice,
  handleClick,
  model,
  name,
  scaleAdjustment,
}: ModelProps) => {
  const ref = useRef<Mesh>(null!);
  const gltf = useLoader(GLTFLoader, model);

  useFrame((state, delta) => {
    ref.current.rotation.x += delta;
  });

  return (
    <mesh onClick={() => handleClick(name)}>
      <Suspense fallback={null}>
        <primitive
          ref={ref}
          object={id === 'opponent' ? gltf.scene.clone() : gltf.scene}
          scale={(choice === name ? 1.4 : 1.1) * scaleAdjustment}
        />
      </Suspense>
      <ambientLight intensity={0.5} />
      <directionalLight color="white" position={[0, 0, 10]} />
    </mesh>
  );
};

export default Room;
