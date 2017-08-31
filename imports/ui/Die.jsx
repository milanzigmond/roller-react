
import React from 'react';
import * as THREE from 'three';

import PropTypes from 'prop-types';

export default class Die extends React.Component {
  static propTypes = {
    position: PropTypes.instanceOf(THREE.Vector3).isRequired,
    quaternion: PropTypes.instanceOf(THREE.Quaternion).isRequired,
    dices: PropTypes.arrayOf(PropTypes.instanceOf(THREE.Mesh)).isRequired,
    geometry: PropTypes.instanceOf(THREE.Geometry).isRequired,
  };

  constructor (props, context) {
    super(props, context);

    this.dieSpecular = 'brown';
    this.dieShineness = 5;
    this.dieShading = THREE.FlatShading;
  }

  componentDidMount() {
    const {
      mesh,
      group
    } = this.refs;

    const {
      dices,
      geometry
    } = this.props;

    dices.push(mesh);

    // materials

    // wood 

    // materials = [
    //   new THREE.MeshPhongMaterial({
    //     map: new THREE.TextureLoader().load('./img/wood.jpg'),
    //     specular: this.dieSpecular,
    //     shininess: this.dieShineness,
    //     shading: this.dieShading,
    //   }),
    //   new THREE.MeshPhongMaterial({
    //     color: 0x00ff00,
    //   }),
    //   new THREE.MeshPhongMaterial({
    //     map: new THREE.TextureLoader().load('./img/1.png'),
    //     specular: this.dieSpecular,
    //     shininess: this.dieShineness,
    //     shading: this.dieShading,
    //   }),
    //   new THREE.MeshPhongMaterial({
    //     map: new THREE.TextureLoader().load('./img/2.png'),
    //     specular: this.dieSpecular,
    //     shininess: this.dieShineness,
    //     shading: this.dieShading,
    //   }),
    //   new THREE.MeshPhongMaterial({
    //     map: new THREE.TextureLoader().load('./img/3.png'),
    //     specular: this.dieSpecular,
    //     shininess: this.dieShineness,
    //     shading: this.dieShading,
    //   }),
    //   new THREE.MeshPhongMaterial({
    //     map: new THREE.TextureLoader().load('./img/4.png'),
    //     specular: this.dieSpecular,
    //     shininess: this.dieShineness,
    //     shading: this.dieShading,
    //   }),
    //   new THREE.MeshPhongMaterial({
    //     map: new THREE.TextureLoader().load('./img/5.png'),
    //     specular: this.dieSpecular,
    //     shininess: this.dieShineness,
    //     shading: this.dieShading,
    //   }),
    //   new THREE.MeshPhongMaterial({
    //     map: new THREE.TextureLoader().load('./img/6.png'),
    //     specular: this.dieSpecular,
    //     shininess: this.dieShineness,
    //     shading: this.dieShading,
    //   }),
    // ];

    // plastic 

    // wood 
    
    materials = [
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plasticMaterial.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        color: 0xff0000,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic1.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic2.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic3.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic4.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic5.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
      new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('./img/plastic6.png'),
        specular: this.dieSpecular,
        shininess: this.dieShineness,
        shading: this.dieShading,
      }),
    ];

    let die = new THREE.Mesh( geometry,  materials );
    die.castShadow = true;
    die.receiveShadow = true;
    group.add( die );
  }

  componentWillUnmount() {
    const {
      mesh,
    } = this.refs;

    const {
      dices,
    } = this.props;

    dices.splice(dices.indexOf(mesh), 1);
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