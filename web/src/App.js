import logo from './logo.svg';
import './App.css';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { auth0Ctx, ctx } from './contexts'

const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  console.log(isAuthenticated)
  return <button onClick={() => loginWithRedirect()}>Log In</button>;
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <LoginButton />
      </header>
    </div>
  );
}

export default App;
