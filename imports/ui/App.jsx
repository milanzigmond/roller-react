import React, { Component } from 'react';

import Roller from './Roller';

// App component - represents the whole app
export default class App extends Component {
  generateNumber1To6() {
    return numberOfDice = Math.floor((Math.random() * 6) + 1);
  }

  generateThrow() {
    numberOfDice = generateNumber1To6();
    const set = [];
    for (let i = numberOfDice - 1; i >= 0; i--) {
      set.push(generateNumber1To6());
    }
    console.log(set);
    return set;
  }
  //  renderTasks() {
  //    return this.getTasks().map((task) => (
  //      <Task key={task._id} task={task} />
  //    ));
  //  }

  render() {
    return (
      <Roller
        width={window.innerWidth}
        height={window.innerHeight}
        roll={[1, 2, 3, 4, 5, 6]}
      />
    );
  }
}
