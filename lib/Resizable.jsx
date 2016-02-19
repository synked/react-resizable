// @flow
import {default as React, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import {DraggableCore} from 'react-draggable';
import cloneElement from './cloneElement';

type Position = {
  deltaX: number,
  deltaY: number
};
type State = {
  resizing: boolean,
  width: number | string, height: number | string,
  slackW: number, slackH: number
};
type DragCallbackData = {
  node: HTMLElement,
  position: Position
};

export default class Resizable extends React.Component {

  static propTypes = {
    //
    // Required Props
    //

    // Require that one and only one child be present.
    children: PropTypes.element.isRequired,

    // Initial w/h
    width: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.oneOf(['auto'])
    ]).isRequired,
    height: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.oneOf(['auto'])
    ]).isRequired,

    //
    // Optional props
    //

    // If you change this, be sure to update your css
    handleSize: PropTypes.array,

    // If true, will only allow width/height to move in lockstep
    lockAspectRatio: PropTypes.bool,

    // Min/max size
    minConstraints: PropTypes.arrayOf(PropTypes.number),
    maxConstraints: PropTypes.arrayOf(PropTypes.number),

    // Callbacks
    onResizeStop: PropTypes.func,
    onResizeStart: PropTypes.func,
    onResize: PropTypes.func,

    // These will be passed wholesale to react-draggable's DraggableCore
    draggableOpts: PropTypes.object
  };

  static defaultProps =  {
    handleSize: [20, 20],
    lockAspectRatio: false,
    minConstraints: [20, 20],
    maxConstraints: [Infinity, Infinity]
  };

  state: State = {
    resizing: false,
    width: this.props.width, height: this.props.height,
    slackW: 0, slackH: 0
  };

  componentWillReceiveProps(nextProps: Object) {
    // If parent changes height/width, set that in our state.
    if (!this.state.resizing &&
        (nextProps.width !== this.props.width || nextProps.height !== this.props.height)) {
      this.setState({
        width: nextProps.width,
        height: nextProps.height
      });
    }
  }

  getPixelSize(): Object {
    const { width, height } = this.props;
    let size = { width, height };
    const node = ReactDOM.findDOMNode(this);
    if(typeof width !== 'number') {
      size.width = node.clientWidth;
    }
    if(typeof height !== 'number') {
      size.height = node.clientHeight;
    }
    return size;
  }

  lockAspectRatio(width: number | string, height: number | string, aspectRatio: number): [number, number] {
    let size = this.getPixelSize();
    height = size.width / aspectRatio;
    width = size.height * aspectRatio;
    return [width, height];
  }

  // If you do this, be careful of constraints
  runConstraints(width: number, height: number): [number, number] {
    let [min, max] = [this.props.minConstraints, this.props.maxConstraints];

    if (this.props.lockAspectRatio) {
      const sizes = this.getPixelSize();
      const ratio = sizes.width / sizes.height;
      height = width / ratio;
      width = height * ratio;
    }

    if (!min && !max) return [width, height];

    let [oldW, oldH] = [width, height];

    // Add slack to the values used to calculate bound position. This will ensure that if
    // we start removing slack, the element won't react to it right away until it's been
    // completely removed.
    let {slackW, slackH} = this.state;
    width += slackW;
    height += slackH;

    if (min) {
      width = Math.max(min[0], width);
      height = Math.max(min[1], height);
    }
    if (max) {
      width = Math.min(max[0], width);
      height = Math.min(max[1], height);
    }

    // If the numbers changed, we must have introduced some slack. Record it for the next iteration.
    slackW += (oldW - width);
    slackH += (oldH - height);
    if (slackW !== this.state.slackW || slackH !== this.state.slackH) {
      this.setState({slackW, slackH});
    }

    return [width, height];
  }

  /**
   * Wrapper around drag events to provide more useful data.
   *
   * @param  {String} handlerName Handler name to wrap.
   * @return {Function}           Handler function.
   */
  resizeHandler(handlerName: string): Function {
    return (e, {node, position}: DragCallbackData) => {
      const {deltaX, deltaY} = position;

      const size = this.getPixelSize();
      let width = size.width + deltaX, height = size.height + deltaY;

      // Early return if no change
      let widthChanged = width !== this.state.width, heightChanged = height !== this.state.height;
      if (handlerName === 'onResize' && !widthChanged && !heightChanged) return;

      [width, height] = this.runConstraints(width, height);

      // Set the appropriate state for this handler.
      let newState = {};
      if (handlerName === 'onResizeStart') {
        newState.resizing = true;
      } else if (handlerName === 'onResizeStop') {
        newState.resizing = false;
      } else {
        // Early return if no change after constraints
        if (width === size.width && height === size.height) return;
        newState.width = width;
        newState.height = height;
      }

      this.setState(newState, () => {
        this.props[handlerName] && this.props[handlerName](e, {node, size: {width, height}});
      });

    };
  }

  render(): ReactElement {
    let p = this.props;
    let className = p.className ?
      `${p.className} react-resizable`:
      'react-resizable';

    // What we're doing here is getting the child of this element, and cloning it with this element's props.
    // We are then defining its children as:
    // Its original children (resizable's child's children), and
    // A draggable handle.
    return cloneElement(p.children, {
      ...p,
      className,
      children: [
        p.children.props.children,
        <DraggableCore
          {...p.draggableOpts}
          ref="draggable"
          onStop={this.resizeHandler('onResizeStop')}
          onStart={this.resizeHandler('onResizeStart')}
          onDrag={this.resizeHandler('onResize')}
          >
          <span className="react-resizable-handle" />
        </DraggableCore>
      ]
    });
  }
}
