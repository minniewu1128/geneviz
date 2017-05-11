
import Immutable from 'immutable'
import React, { PropTypes, PureComponent } from 'react'
import { ContentBox, ContentBoxHeader, ContentBoxParagraph } from '../demo/ContentBox'
import { LabeledInput, InputRow } from '../demo/LabeledInput'
import AutoSizer from '../AutoSizer'
import Grid from '../Grid'
import CustomWindowScroller from '../CustomWindowScroller'
import cn from 'classnames'
import styles from './axis.css'
import axios from 'axios'
import d3 from 'd3'


let timer = null;
let global = null;

const colorRange = ["#990000", "#eeeeee", "#ffffff", "#eeeeee", "#000099"];

const calculateColorScale = (min, max, threshold) => {
    const mid = (min + max) / 2
    //find the range in which colors can be muted, as a percentage of data range
    const bound = (max - min) * threshold / 2
    return d3.scale.linear()
                  .domain([min, mid - bound, mid, mid + bound, max]) //this means that between mid +- bound, colors are muted
                  .range(colorRange)
} 


export default class Application extends PureComponent {
    static contextTypes = {
        list: PropTypes.instanceOf(Immutable.List).isRequired
    };

    constructor(props, context) {
        super(props, context)

        const zoominfo = {"start":1,"end":3088286401}
        let items = [];
        for (let i = zoominfo.start; i < (zoominfo.end); i = i + ((zoominfo.end - zoominfo.start) / 25)) {
            items.push(Math.floor(i));
        }

        this.state = {
            columnCount: 100,
            //height: 60,
            overscanColumnCount: 0,
            overscanRowCount: 0,
            rowHeight: 20,
            rowCount: 30,
            useDynamicRowHeight: false,
            list:Immutable.List(items),
            zoomindex:100,
            zoomamount: 0,
            zoomStack: [zoominfo],
            data:[],
        }

        this._cellRenderer = this._cellRenderer.bind(this)
        this._getColumnWidth = this._getColumnWidth.bind(this)
        // this._getRowClassName = this._getRowClassName.bind(this)
        // this._getRowHeight = this._getRowHeight.bind(this)
        this._noContentRenderer = this._noContentRenderer.bind(this)
        this._onColumnCountChange = this._onColumnCountChange.bind(this)
        this._onRowCountChange = this._onRowCountChange.bind(this)
        this._onScrollToColumnChange = this._onScrollToColumnChange.bind(this)
        this._onScrollToRowChange = this._onScrollToRowChange.bind(this)
        this._renderAxisCell = this._renderAxisCell.bind(this)
        this._renderDataCell = this._renderDataCell.bind(this)
        this._renderLeftSideCell = this._renderLeftSideCell.bind(this)
        this._getDatum = this._getDatum.bind(this)
        this.fetchData = this.fetchData.bind(this)
        this._on
    }

    componentDidMount(){
        this.fetchData(1,3088286401,100)
    }

    fetchData(start,end,steps){

        let url = "http://localhost:3001/data/?start=" + start + "&end=" + end + "&zoom=" + Math.floor((end-start)/steps)
        console.log(url)
        axios.get(url)
            .then((res) => {
                console.log(res)

                let items = [];
                for (let i = 0; i < res.data.length; i++) {
                    items.push(Math.floor(res.data[i]["start"]));
                }

                this.setState({ data: res.data , list:Immutable.List(items),},function(){
                    this.axis.recomputeGridSize({columnIndex: 0, rowIndex: 0})
                    this.axis.recomputeGridSize({columnIndex: 1, rowIndex: 0})
                    this.axis.recomputeGridSize({columnIndex: 2, rowIndex: 0})
                    this.axis.recomputeGridSize({columnIndex: 3, rowIndex: 0})
                    this.axis.recomputeGridSize({columnIndex: 4, rowIndex: 0})

                }.bind(this));
            });
    }

    render() {
        const {
            columnCount,
            height,
            overscanColumnCount,
            overscanRowCount,
            rowHeight,
            rowCount,
            scrollToColumn,
            scrollToRow,
            useDynamicRowHeight
        } = this.state

        return (
            <div>
                <div className={styles.zoomBar} >
                    <div className={styles.zoomBarCursorMid}></div>
                    <div className={styles.zoomBarCursorBot} style={{height: (this.state.zoomamount) + "%"}}></div>
                    <div className={styles.zoomBarCursorTop} style={{height: (-1 * this.state.zoomamount) + "%"}}></div>
                </div>


                <div className={styles.CustomWindowScrollerWrapper}>
                    <CustomWindowScroller onScroll={this._updateZoom.bind(this)}>
                        {({ height, isScrolling, scrollTop }) => (
                            <AutoSizer disableHeight>
                                {({width}) => (
                                    <Grid
                                        ref={(input) => { this.axis = input}}
                                        cellRenderer={this._cellRenderer}
                                        columnWidth={this._getColumnWidth}
                                        columnCount={columnCount}
                                        height={height}
                                        width={width}
                                        noContentRenderer={this._noContentRenderer}
                                        overscanColumnCount={overscanColumnCount}
                                        overscanRowCount={overscanRowCount}
                                        rowHeight={
                                            ((height - 10) / rowCount)
                                        }
                                        rowCount={rowCount}
                                        scrollToColumn={scrollToColumn}
                                    />
                                )}
                            </AutoSizer>
                        )}
                    </CustomWindowScroller>
                </div>
            </div>
        )
    }

    _convertRemToPixels(rem) {    
        return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    _setRef (windowScroller) {
        this._windowScroller = windowScroller
    }

    _updateZoom({event, isScrolling}) {
        if (isScrolling == false) this.setState({'zoomamount': 0})
        else {
            let zoomamt  = this.state.zoomamount + (event.wheelDeltaY / 10 )
            var current = event.clientX / this._getColumnWidth()

            if (zoomamt > 60) {

                let start = this.state.list.get(Math.floor(current))
                let end = this.state.list.get(Math.floor(current) + 1)


                let items = [];
                for (let i = start; i < (end); i = i + ((end - start) / 100)) {
                    items.push(Math.floor(i));
                }

                const zstack = this.state.zoomStack
                zstack.push({"start": start, "end": end})

                this.setState({"list": Immutable.List(items), zoomStack: zstack, zoomamount: 0, data:[]}, function () {

                    this.fetchData(start,end,items.length)

                    this._onColumnCountChange((items.length))
                    this.axis.recomputeGridSize({columnIndex: 0, rowIndex: 0})
                    this.axis.recomputeGridSize({columnIndex: 0, rowIndex: 1})

                }.bind(this))
            } else if (zoomamt < -60){


                // let c = this.state.zoomStack[this.state.zoomStack.length - 1]
                //     zstack.splice(this.state.zoomStack.length - 1,1)
                let zstack = this.state.zoomStack
                if (zstack.length > 1){
                    zstack.pop()


                    let start = zstack[zstack.length - 1].start
                    let end = zstack[zstack.length - 1].end


                    let items = [];
                    for (let i = start; i < (end); i = i + ((end - start) / 100)) {
                        items.push(Math.floor(i));
                    }

                    this.setState({"list": Immutable.List(items), zoomStack: zstack, zoomamount: 0, data:[]}, function () {

                    this.fetchData(start,end,items.length)
                    this._computeMajorAxisLabels(start,end,items.length)

                        this._onColumnCountChange((items.length))
                        this.axis.recomputeGridSize({columnIndex: 0, rowIndex: 0})
                        this.axis.recomputeGridSize({columnIndex: 1, rowIndex: 1})
                        this.axis.recomputeGridSize({columnIndex: 2, rowIndex: 0})
                        this.axis.recomputeGridSize({columnIndex: 3, rowIndex: 0})
                        this.axis.recomputeGridSize({columnIndex: 4, rowIndex: 0})

                    }.bind(this))
                }
            }
            else {
                this.setState({'zoomamount': zoomamt})
            }


            // for (var i = 0; i < Math.floor(Math.random() * (10000 - 1000 + 1)) ; i++) {
            //     list.push(Math.floor(Math.random() * (10000 - 1 + 1)))
            // }
            //
            // console.log(list.length)
            // this.setState({"list":Immutable.List(list)},function(){
            //     this._onColumnCountChange({"target":{"value":(list.length)}});
            // }.bind(this))
            //We want to update data
            //this.axis.forceUpdate()
            }
        
    }


    _cellRenderer({columnIndex, key, rowIndex, style}) {

         if (rowIndex <= 1){
             return this._renderAxisCell({columnIndex, key, rowIndex, style})

         }
        return this._renderDataCell({columnIndex, key, rowIndex, style})

    }

    _getColumnWidth(){
        return 15
    }

    _getDatum(index) {
        return this.state.list.get(index % this.state.list.size)
    }

    _getRowClassName(row) {
        return row % 2 === 0 ? styles.evenRow : styles.oddRow
    }
    //
    // _getRowHeight({index}) {
    //     return this._getDatum(index).bind(this).size
    // }

    _noContentRenderer() {
        return (
            <div className={styles.noCells}>
                No cells
            </div>
        )
    }

    _renderDataCell({columnIndex, key, rowIndex, style}) {


        let label = ""
        if (this.state.data.length > 0){
            if (this.state.data[columnIndex]){
                label = this.state.data[columnIndex]["data"][rowIndex - 2]
            }
        }
        let cellColorScale = calculateColorScale(0, 1, parseInt(label))
        let color = cellColorScale(label)

        // const rowClass = this._getRowClassName(rowIndex)
        // const classNames = cn(rowClass, styles.cell, {
        //     [styles.centeredCell]: columnIndex > 1
        // })

        style = {
            ...style,
            backgroundColor: color
        }


        var grid = this.axis
        //
        var className = columnIndex === this.state.hoveredColumnIndex || rowIndex === this.state.hoveredRowIndex
            ? 'cell hoveredItem'
            : 'cell'
        var setState = this.setState.bind(this)


        return React.DOM.div({
            className: className,
            key: key,
            onMouseOver: function () {
                setState({
                    hoveredColumnIndex: columnIndex,
                    hoveredRowIndex: rowIndex
                })
                //grid.forceUpdate()
            },
            style: style
        })


        // {label} to add number
        // return (
        //     <div
        //         className={classNames}
        //         key={key}
        //         style={style}
        //     >
        //     </div>
        // )
    }

    _renderAxisCell({columnIndex, key, rowIndex, style}) {



        const rowClass = this._getRowClassName(rowIndex)
        const datum = this._getDatum(columnIndex)


        const classNames = cn(rowClass, styles.cell, {
            [styles.centeredCell]: columnIndex > 0
        })

        style = {
            ...style,
            fontSize: "x-small",
            backgroundColor:"#e0e0e0",
            overflow: "visible",
            cursor: "move"
        }

        //Format based on length of number
        const millions =  Math.floor(datum / 1000000 % 10)
        const tensMillions =  Math.floor(datum / 10000000 % 10)
        const hundredMillions =  Math.floor(datum / 100000000 % 10)
        const billions =  Math.floor(datum / 1000000000 % 10)


        //Compute the resolution for the scale
        let zstate = this.state.zoomStack[this.state.zoomStack.length - 1]


        let label = "" //billions + "." + hundredMillions + tensMillions + millions

        //Computer Major Axis Scale
        let scale = 1000 * 1000 * 1000 * 10 // 1 Billion
        let start = Math.floor(zstate.start / scale % 10)
        let end = Math.floor(zstate.end / scale % 10)

        while (start == end){
            scale = scale / 10
            start = Math.floor(zstate.start / scale % 10)
            end = Math.floor(zstate.end / scale % 10)
        }


        //Major Axis : Markers in Billions
        if ((columnIndex % 5) == 0 && (rowIndex == 0)) {
            label = billions + "." +  hundredMillions + "" + tensMillions  + "B"
        }


            //Minot Axis : Markers in Millions

        if (rowIndex == 1){
            label = ""
        }

        scale = scale /10

        if ((columnIndex % 5) > 0 && rowIndex == 1) {
            label = ""
        }else if (rowIndex == 1){
            label = "|"
        }

        if (label === NaN) {
            label = datum
        }

        return (
            <div
                className={classNames}
                key={key}
                style={style}
            >
                {label}
            </div>
        )
    }

    _renderLeftSideCell({key, rowIndex, style}) {
        const datum = this._getDatum(rowIndex)

        const classNames = cn(styles.cell, styles.letterCell)

        // Don't modify styles.
        // These are frozen by React now (as of 16.0.0).
        // Since Grid caches and re-uses them, they aren't safe to modify.
        style = {
            ...style,
            backgroundColor: datum.color,
            cursor: "move"
        }

        return (
            <div
                className={classNames}
                key={key}
                style={style}
            >
                {datum}
            </div>
        )
    }

    _onColumnCountChange(columnCount) {
        //const columnCount = parseInt(event.target.value, 10) || 0
        this.setState({columnCount})
    }

    _onRowCountChange(event) {
        const rowCount = parseInt(event.target.value, 10) || 0
        this.setState({rowCount})
    }

    _onScrollToColumnChange(event) {
        const {columnCount} = this.state
        let scrollToColumn = Math.min(columnCount - 1, parseInt(event.target.value, 10))

        if (isNaN(scrollToColumn)) {
            scrollToColumn = undefined
        }

        this.setState({scrollToColumn})
    }

    _onScrollToRowChange(event) {
        const {rowCount} = this.state
        let scrollToRow = Math.min(rowCount - 1, parseInt(event.target.value, 10))

        if (isNaN(scrollToRow)) {
            scrollToRow = undefined
        }

        this.setState({scrollToRow})
    }

    _computeMajorAxisLabels(start,end,numberitems){
        //If next one is changing keep gap of 4//

        let items = []
        for (let i = zoominfo.start; i < (zoominfo.end); i = i + ((zoominfo.end - zoominfo.start) / 25)) {

            items.push(Math.floor(i));
        }

    }

}
