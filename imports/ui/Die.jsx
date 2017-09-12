import React from 'react';
import * as THREE from 'three';

import PropTypes from 'prop-types';

export default class Die extends React.Component {
  static propTypes = {
    index: PropTypes.number.isRequired,
    position: PropTypes.instanceOf(THREE.Vector3).isRequired,
    quaternion: PropTypes.instanceOf(THREE.Quaternion).isRequired,
    geometry: PropTypes.instanceOf(THREE.Geometry).isRequired,
    dice: PropTypes.array.isRequired
  };

  constructor (props, context) {
    super(props, context);

    this.die = {};

    this.dieSpecular = 'brown';
    this.dieShineness = 5;
    this.dieShading = THREE.FlatShading;  

    this.plasticMaterials = [
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plasticMaterial.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        color: 0xff0000,
      }),
      // left
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic1.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      // right
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic2.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      // top
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic3.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      // bottom
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic4.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      // front
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic5.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      // back
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic6.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
    ];

    this.woodMaterials = [
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/wood.jpg'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        color: 0x00ff00,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/1.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/2.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/3.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/4.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/5.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/6.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
    ];
  }

  createDie = () => {
    console.log('createDie');
    const {
      group
    } = this.refs;

    const {
      dice,
      geometry
    } = this.props;

    this.die = new THREE.Mesh( geometry,  this.plasticMaterials );
    this.die.castShadow = true;
    this.die.receiveShadow = true;
    this.die.name = 'die';
    group.add(this.die);
    dice.push(this.die);
  }

  removeDie = () => {
    console.log('removeDie');
    const {
      dice
    } = this.props;

    const {
      group
    } = this.refs;

    group.remove(this.die);
    dice.splice(dice.indexOf(this.die), 1);
  }

  componentDidMount() {
    const {
      dice
    } = this.props;

    this.createDie();
  }

  componentWillUnmount() {
    this.removeDie();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      index,
      geometry
    } = this.props;

    if(geometry !== prevProps.geometry) {
      this.removeDie();
      this.createDie();
    }
  }

  render() {
    const {
      position,
      quaternion,
    } = this.props;

    return (
      <group 
        ref='group' 
        position={position} 
        quaternion={quaternion}
      />
    );
  }
}