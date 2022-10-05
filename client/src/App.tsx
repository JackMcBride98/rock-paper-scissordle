import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import Room from './components/Room';
import { useLocalStorage } from './hooks';

interface Stats {
  wins: number;
  draws: number;
  losses: number;
  streak: number;
  attempts: number[];
  lastWin: Date | null;
}

const initialStats = {
  wins: 0,
  draws: 0,
  losses: 0,
  streak: 0,
  lastWin: null,
  attempts: [],
};

const sameDay = (first: Date, second: Date): boolean =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

function App() {
  const [socket, setSocket] = useState<Socket | undefined>();
  const [roomID, setRoomID] = useState('');
  const [stats, setStats] = useLocalStorage<Stats>('stats', initialStats);
  const [userCount, setUserCount] = useState(0);

  const handlePlay = () => {
    if (!socket) {
      const socket = io('http://localhost:3000');
      setSocket(socket);
      socket.on('found', (roomID) => {
        setRoomID(roomID);
        socket.emit('join', roomID);
      });
      socket.on('users', (data) => setUserCount(data));
    }
  };

  const handleEndGame = (result: string | null) => {
    const newStats = { ...stats };
    if (result === 'Win') {
      newStats.wins++;
      newStats.streak++;
      newStats.lastWin = new Date();
    }
    if (result === 'Lose') {
      newStats.losses++;
    }
    if (result === 'Tie') {
      newStats.draws++;
    }
    if (result) {
      if (stats.lastWin && sameDay(stats.lastWin, new Date())) {
        newStats.attempts[stats.attempts.length - 1]++;
      } else {
        newStats.attempts.push(1);
      }
      setStats(newStats);
    }
    setTimeout(() => {
      setSocket(undefined);
      socket?.close();
      setRoomID('');
    }, 5000);
  };

  return (
    <div className="App">
      <h1 className="text-red-500 text-3xl">Rock Paper Scissordle</h1>
      <p>Users online: {userCount}</p>

      {!socket?.connected ? (
        <>
          {!(stats.lastWin && sameDay(stats.lastWin, new Date())) && (
            <button
              onClick={() => handlePlay()}
              className="m-2 rounded-md border p-2"
            >
              Play
            </button>
          )}
          <p>Last win: {stats.lastWin?.toLocaleDateString() || '-'}</p>
          <p>Wins: {stats.wins}</p>
          <p>Draws: {stats.draws}</p>
          <p>Losses: {stats.losses}</p>
          <p>
            Win percentage:{' '}
            {(
              (stats.wins / stats.attempts.reduce((a, b) => a + b, 0)) *
              100
            ).toFixed(0) || '-'}
            %
          </p>
          <p>
            Average attempts:{' '}
            {stats.attempts?.reduce((a, b) => a + b, 0) /
              stats.attempts?.length || 0}
          </p>
        </>
      ) : !roomID ? (
        <>
          <p>Searching ...</p>
        </>
      ) : (
        <Room roomID={roomID} socket={socket} handleEndGame={handleEndGame} />
      )}
    </div>
  );
}

export default App;
