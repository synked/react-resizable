'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactDraggable = require('react-draggable');

var _cloneElement = require('./cloneElement');

var _cloneElement2 = _interopRequireDefault(_cloneElement);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Resizable = function (_React$Component) {
  _inherits(Resizable, _React$Component);

  function Resizable() {
    var _Object$getPrototypeO;

    var _temp, _this, _ret;

    _classCallCheck(this, Resizable);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Resizable)).call.apply(_Object$getPrototypeO, [this].concat(args))), _this), _this.state = {
      resizing: false,
      width: _this.props.width, height: _this.props.height,
      slackW: 0, slackH: 0
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(Resizable, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      // If parent changes height/width, set that in our state.
      if (!this.state.resizing && (nextProps.width !== this.props.width || nextProps.height !== this.props.height)) {
        this.setState({
          width: nextProps.width,
          height: nextProps.height
        });
      }
    }
  }, {
    key: 'getPixelSize',
    value: function getPixelSize() {
      var _props = this.props;
      var width = _props.width;
      var height = _props.height;

      var size = { width: width, height: height };
      var node = _reactDom2.default.findDOMNode(this);
      if (typeof width !== 'number') {
        size.width = node.clientWidth;
      }
      if (typeof height !== 'number') {
        size.height = node.clientHeight;
      }
      return size;
    }
  }, {
    key: 'lockAspectRatio',
    value: function lockAspectRatio(width, height, aspectRatio) {
      var size = this.getPixelSize();
      height = size.width / aspectRatio;
      width = size.height * aspectRatio;
      return [width, height];
    }

    // If you do this, be careful of constraints

  }, {
    key: 'runConstraints',
    value: function runConstraints(width, height) {
      var min = this.props.minConstraints;
      var max = this.props.maxConstraints;


      if (this.props.lockAspectRatio) {
        var sizes = this.getPixelSize();
        var ratio = sizes.width / sizes.height;
        height = width / ratio;
        width = height * ratio;
      }

      if (!min && !max) return [width, height];

      var oldW = width;
      var oldH = height;

      // Add slack to the values used to calculate bound position. This will ensure that if
      // we start removing slack, the element won't react to it right away until it's been
      // completely removed.

      var _state = this.state;
      var slackW = _state.slackW;
      var slackH = _state.slackH;

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
      slackW += oldW - width;
      slackH += oldH - height;
      if (slackW !== this.state.slackW || slackH !== this.state.slackH) {
        this.setState({ slackW: slackW, slackH: slackH });
      }

      return [width, height];
    }

    /**
     * Wrapper around drag events to provide more useful data.
     *
     * @param  {String} handlerName Handler name to wrap.
     * @return {Function}           Handler function.
     */

  }, {
    key: 'resizeHandler',
    value: function resizeHandler(handlerName) {
      var _this2 = this;

      return function (e, _ref) {
        var node = _ref.node;
        var position = _ref.position;
        var deltaX = position.deltaX;
        var deltaY = position.deltaY;


        var size = _this2.getPixelSize();
        var width = size.width + deltaX,
            height = size.height + deltaY;

        // Early return if no change
        var widthChanged = width !== _this2.state.width,
            heightChanged = height !== _this2.state.height;
        if (handlerName === 'onResize' && !widthChanged && !heightChanged) return;

        // Set the appropriate state for this handler.

        var _runConstraints = _this2.runConstraints(width, height);

        var _runConstraints2 = _slicedToArray(_runConstraints, 2);

        width = _runConstraints2[0];
        height = _runConstraints2[1];
        var newState = {};
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

        _this2.setState(newState, function () {
          _this2.props[handlerName] && _this2.props[handlerName](e, { node: node, size: { width: width, height: height } });
        });
      };
    }
  }, {
    key: 'render',
    value: function render() {
      var p = this.props;
      var className = p.className ? p.className + ' react-resizable' : 'react-resizable';

      // What we're doing here is getting the child of this element, and cloning it with this element's props.
      // We are then defining its children as:
      // Its original children (resizable's child's children), and
      // A draggable handle.
      return (0, _cloneElement2.default)(p.children, _extends({}, p, {
        className: className,
        children: [p.children.props.children, _react2.default.createElement(
          _reactDraggable.DraggableCore,
          _extends({}, p.draggableOpts, {
            ref: 'draggable',
            onStop: this.resizeHandler('onResizeStop'),
            onStart: this.resizeHandler('onResizeStart'),
            onDrag: this.resizeHandler('onResize')
          }),
          _react2.default.createElement('span', { className: 'react-resizable-handle' })
        )]
      }));
    }
  }]);

  return Resizable;
}(_react2.default.Component);

Resizable.propTypes = {
  //
  // Required Props
  //

  // Require that one and only one child be present.
  children: _react.PropTypes.element.isRequired,

  // Initial w/h
  width: _react.PropTypes.oneOfType([_react.PropTypes.number, _react.PropTypes.oneOf(['auto'])]).isRequired,
  height: _react.PropTypes.oneOfType([_react.PropTypes.number, _react.PropTypes.oneOf(['auto'])]).isRequired,

  //
  // Optional props
  //

  // If you change this, be sure to update your css
  handleSize: _react.PropTypes.array,

  // If true, will only allow width/height to move in lockstep
  lockAspectRatio: _react.PropTypes.bool,

  // Min/max size
  minConstraints: _react.PropTypes.arrayOf(_react.PropTypes.number),
  maxConstraints: _react.PropTypes.arrayOf(_react.PropTypes.number),

  // Callbacks
  onResizeStop: _react.PropTypes.func,
  onResizeStart: _react.PropTypes.func,
  onResize: _react.PropTypes.func,

  // These will be passed wholesale to react-draggable's DraggableCore
  draggableOpts: _react.PropTypes.object
};
Resizable.defaultProps = {
  handleSize: [20, 20],
  lockAspectRatio: false,
  minConstraints: [20, 20],
  maxConstraints: [Infinity, Infinity]
};
exports.default = Resizable;