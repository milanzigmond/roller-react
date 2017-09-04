import React, { Component } from 'react';
import Roller from './Roller';

export default class App extends Component {
  render() {
    return (
      <Roller
        width={window.innerWidth}
        height={window.innerHeight}
        roll={[4, 4, 4, 4]}
      />
    );
  }
}
