/** @flow */
import { PropTypes, PureComponent } from 'react'
import ReactDOM from 'react-dom'
import { registerScrollListener, unregisterScrollListener } from './utils/onScroll'
import { getHeight, getPositionFromTop, getScrollTop } from './utils/dimensions'

export default class CustomWindowScroller extends PureComponent {
  static propTypes = {
    /**
     * Function responsible for rendering children.
     * This function should implement the following signature:
     * ({ height, isScrolling, scrollTop }) => PropTypes.element
     */
    children: PropTypes.func.isRequired,

    /** Callback to be invoked on-resize: ({ height }) */
    onResize: PropTypes.func.isRequired,

    /** Callback to be invoked on-scroll: ({ scrollTop }) */
    onScroll: PropTypes.func.isRequired,

    /** Element to attach scroll event listeners. Defaults to window. */
    scrollElement: PropTypes.any
  };

  static defaultProps = {
    onResize: () => {},
    onScroll: () => {}
  };

  constructor (props) {
    super(props)

    // Handle server-side rendering case
    const height = typeof window !== 'undefined'
      ? getHeight(props.scrollElement || window)
      : 0

    this.state = {
      height,
      isScrolling: false,
      scrollTop: 0
    }

    this._onResize = this._onResize.bind(this)
    this.__handleWindowScrollEvent = this.__handleWindowScrollEvent.bind(this)
    this.__resetIsScrolling = this.__resetIsScrolling.bind(this)
  }

  // Can’t use defaultProps for scrollElement without breaking server-side rendering
  get scrollElement () {
    return this.props.scrollElement || window
  }

  updatePosition (scrollElement) {
    const { onResize } = this.props
    const { height } = this.state

    scrollElement = scrollElement || this.props.scrollElement || window
    this._positionFromTop = getPositionFromTop(
      ReactDOM.findDOMNode(this),
      scrollElement
    )

    const newHeight = getHeight(scrollElement)
    if (height !== newHeight) {
      this.setState({
        height: newHeight
      })
      onResize({
        height: newHeight
      })
    }
  }


    componentDidMount () {
    const scrollElement = this.props.scrollElement || window

    this.updatePosition(scrollElement)

        registerScrollListener(this, scrollElement)
//        window.addEventListener('wheel', this.handleScroll);
      window.addEventListener('resize', this._onResize, false)
  }

  componentWillReceiveProps (nextProps) {
    const scrollElement = this.props.scrollElement || window
    const nextScrollElement = nextProps.scrollElement || window

    if (scrollElement !== nextScrollElement) {
      this.updatePosition(nextScrollElement)

      unregisterScrollListener(this, scrollElement)
      registerScrollListener(this, nextScrollElement)
    }
  }

  componentWillUnmount () {
    unregisterScrollListener(this, this.props.scrollElement || window)

    window.removeEventListener('resize', this._onResize, false)
  }

  render () {
    const { children } = this.props
    const { isScrolling, scrollTop, height } = this.state

    return children({
      height,
      isScrolling,
      scrollTop
    })
  }

  _onResize (event) {
    this.updatePosition()
  }

  // Referenced by utils/onScroll
  __handleWindowScrollEvent (event) {
        const { onScroll } = this.props

        const scrollElement = this.props.scrollElement || window
        const scrollTop = Math.max(0, getScrollTop(scrollElement) - this._positionFromTop)

        this.setState({
            isScrolling: true,
            scrollTop
        })

        //Prevent chrome from scrolling back to prev page
        event.preventDefault()


      onScroll({
      event: event, 
      isScrolling: true
    })

  }

  // Referenced by utils/onScroll
  __resetIsScrolling () {
    const { onScroll } = this.props
    this.setState({
      isScrolling: false
    })
    
    onScroll({
      isScrolling: this.state.isScrolling
    })
  }
}
