import React, { Component } from 'react';
import './App.css';
import { HashRouter, Route, Link } from 'react-router-dom'

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
)

const About = () => (
  <div>
    <h2>About</h2>
  </div>
)

class App extends Component {
  render() {    
    return (
      <HashRouter>
        <div>
          <Link to = '/' replace>Home</Link>
          <Link to = "/About" replace>About</Link>
          <hr/>
          <Route path = '/about' component={About} />
          <Route exact path = '/' component={Home} />
        </div>
      </HashRouter>
    );
  }
}

export default App;
