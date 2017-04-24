/**
 * Created by anuraagjain on 4/24/17.
 */

//https://facebook.github.io/react/docs/react-component.html

export default class CorrelationGrid extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            color: props.initialColor
        };
    }

    componentWillReceiveProps(){

    }

    shouldComponentUpdate(nextProps, nextState){

    }

    render() {
        return <h1>Hello, {this.props.name}</h1>;
    }

}