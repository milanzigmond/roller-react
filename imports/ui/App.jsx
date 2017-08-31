import React, { Component } from 'react';
import Roller from './Roller';


export default class App extends Component {
  static rnd1to6() {
    return Math.floor((Math.random() * 6) + 1);
  }

  static randomRoll() {
    // get random number of dice 1 - 6
    const numberOfDice = App.rnd1to6();
    const roll = [];
    for (let i = numberOfDice - 1; i >= 0; i--) {
      roll.push(App.rnd1to6());
    }
    console.log(roll);
    return roll;
  }

  render() {
    return (
      <Roller
        width={window.innerWidth}
        height={window.innerHeight}
        roll={App.randomRoll()}
      />
    );
  }
}
