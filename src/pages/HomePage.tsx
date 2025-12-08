import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div>
      <h1>Platito</h1>
      <nav>
        <Link to="/settings">Settings</Link>
      </nav>
      <main>
        <p>Welcome to Platito - Your finance tracker</p>
      </main>
    </div>
  );
};
