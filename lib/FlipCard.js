"use strict";

import React, { Component } from "react";
import PropTypes from "prop-types";

import { View, Animated, Platform, ViewPropTypes } from "react-native";

export default class FlipCard extends Component {
  static propTypes = {
    style: ViewPropTypes.style
  };

  constructor(props) {
    super(props);

    // set reversed boolean for detect other side size
    const isFlipped = props.flip;

    this.state = {
      isFlipped: isFlipped,
      isFlipping: false,
      rotate: new Animated.Value(Number(props.flip)),
      height: 0,
      width: 0,
      face: { width: 0, height: 0 },
      back: { width: 0, height: 0 }
    };
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.isFlipped !== nextProps.flip) {
      return { flip: nextProps.flip };
    } else return null;
  }
  componentDidUpdate(prevProps) {
    if (prevProps.flip !== this.props.flip) {
      this._toggleCard();
    }
  }
  _toggleCard() {
    this.setState({ isFlipping: true });
    this.props.onFlipStart(this.state.isFlipped);
    this._animation(!this.state.isFlipped);
  }
  _animation(isFlipped) {
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.setState({ isFlipped: !this.state.isFlipped });
        this.timer = null;
      }, 120);
    }
    Animated.spring(this.state.rotate, {
      toValue: Number(isFlipped),
      friction: this.props.friction,
      useNativeDriver: true
    }).start(param => {
      this.setState({ isFlipping: false });
      this.props.onFlipEnd(this.state.isFlipped);
    });
  }

  componentWillUnmount() {
    clearTimeout(this.measureOtherSideTimeout);
  }

  render() {
    var c = this.props.children;
    var transform = this.props.perspective ? [{ perspective: this.props.perspective }] : [];
    var render_side = false;

    if (this.props.flipHorizontal) {
      transform.push({
        rotateY: this.state.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"]
        })
      });
    }

    if (this.props.flipVertical) {
      transform.push({
        rotateX: this.state.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"]
        })
      });
    }

    if (this.state.isFlipped) {
      render_side = (
        <Back
          style={[
            this.state.height > 0 && { height: this.state.height },
            this.state.width > 0 && { width: this.state.width }
          ]}
          flipHorizontal={this.props.flipHorizontal}
          flipVertical={this.props.flipVertical}
          perspective={this.props.perspective}
          onLayout={event => {
            var { x, y, width, height } = event.nativeEvent.layout;
            var _update = Object.assign(this.state.back, { width: width, height: height });
            this.setState({ back: _update });
          }}
        >
          {c[1]}
        </Back>
      );
    } else {
      render_side = (
        <Face
          style={[
            this.state.height > 0 && { height: this.state.height },
            this.state.width > 0 && { width: this.state.width }
          ]}
          onLayout={event => {
            var { x, y, width, height } = event.nativeEvent.layout;
            var _update = Object.assign(this.state.face, { width: width, height: height });
            this.setState({ face: _update });
          }}
        >
          {c[0]}
        </Face>
      );
    }

    // FIX: ScrollView inside Flip Card not scrollable
    // TODO: Replace below fix with by using "disabled" function (RN 0.21 exclusive)
    // REF: https://github.com/facebook/react-native/pull/5931
    //      https://github.com/facebook/react-native/issues/2103
    return (
      <Animated.View {...this.props} style={[{ transform: transform }, this.props.style]}>
        {render_side}
      </Animated.View>
    );
  }
}
FlipCard.propTypes = {
  flip: PropTypes.bool,
  friction: PropTypes.number,
  perspective: PropTypes.number,
  flipHorizontal: PropTypes.bool,
  flipVertical: PropTypes.bool,
  onFlipEnd: PropTypes.func,
  onFlipStart: PropTypes.func,
  children(props, propName, componentName) {
    const prop = props[propName];
    if (React.Children.count(prop) !== 2) {
      return new Error(
        "`" +
          componentName +
          "` " +
          "should contain exactly two children. " +
          "The first child represents the front of the card. " +
          "The second child represents the back of the card."
      );
    }
  }
};

FlipCard.defaultProps = {
  flip: false,
  friction: 12,
  perspective: 1000,
  flipHorizontal: true,
  flipVertical: false,
  onFlipEnd: () => {},
  onFlipStart: () => {}
};

export class Face extends Component {
  render() {
    return (
      <View style={this.props.style} onLayout={this.props.onLayout}>
        {this.props.children}
      </View>
    );
  }
}

Face.propTypes = {
  children(props, propName, componentName) {}
};

export class Back extends Component {
  render() {
    var transform = [];
    if (this.props.flipHorizontal) {
      transform.push({ scaleX: -1 });
      if (Platform.OS === "android") {
        transform.push({ perspective: this.props.perspective });
      }
    }
    if (this.props.flipVertical) {
      transform.push({ scaleY: -1 });
      if (Platform.OS === "android") {
        transform.push({ perspective: this.props.perspective });
      }
    }

    return (
      <View style={[this.props.style, { transform: transform }]} onLayout={this.props.onLayout}>
        {this.props.children}
      </View>
    );
  }
}

Back.defaultProps = {
  flipHorizontal: false,
  flipVertical: true,
  perspective: 1000
};

Back.propTypes = {
  flipHorizontal: PropTypes.bool,
  flipVertical: PropTypes.bool,
  perspective: PropTypes.number,
  children(props, propName, componentName) {}
};
