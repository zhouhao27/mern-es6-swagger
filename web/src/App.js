import React, { Component } from 'react';
import './App.css';
import { HashRouter, Route, Link } from 'react-router-dom'
import { Button } from 'react-bootstrap'

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
        <div>
          <h1>Welcome to React with Bootstrap</h1>
          <p><Button bsStyle='success'
              bsSize='large'
              href='https://google.com'
              target='_blank'>
              Goto Google
            </Button></p>
        </div>
      </HashRouter>
    );
  }
}

export default App;
