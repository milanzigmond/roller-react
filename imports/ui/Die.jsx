import React from 'react';
import * as THREE from 'three';

import PropTypes from 'prop-types';

class Die extends React.Component {
  static propTypes = {
    position: PropTypes.instanceOf(THREE.Vector3).isRequired,
    quaternion: PropTypes.instanceOf(THREE.Quaternion).isRequired,
    dices: PropTypes.arrayOf(PropTypes.instanceOf(THREE.Mesh)).isRequired,
    geometry: PropTypes.instanceOf(THREE.Geometry).isRequired,
    // bodyIndex: PropTypes.number.isRequired,
    // onMouseDown: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const {
      mesh,
    } = this.refs;

    const {
      dices,
    } = this.props;

    dices.push(mesh);
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

    const {
      vertices,
      faces
    } = this.props.geometry

    return (<mesh
      position={position}
      quaternion={quaternion}

      ref="mesh"

      castShadow
      receiveShadow
    >
      <geometry
        vertices={vertices}
        faces={faces}
      />
      <materialResource
        resourceId="dieMaterial"
      />
    </mesh>);
  }
}

export default Die;
