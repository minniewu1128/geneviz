
import Immutable from 'immutable'
import React, { PropTypes, PureComponent } from 'react'
import { ContentBox, ContentBoxHeader, ContentBoxParagraph } from '../demo/ContentBox'
import { LabeledInput, InputRow } from '../demo/LabeledInput'
import AutoSizer from '../AutoSizer'
import Grid from '../Grid'
import CustomWindowScroller from '../CustomWindowScroller'
import cn from 'classnames'
import styles from './axis.css'

let intial =   [143478261,
    286956522,
    430434783,
    573913044,
    717391305,
    860869566,
    1004347827,
    1147826088,
    1291304349,
    1434782610,
    1578260871,
    1721739132,
    1865217393,
    2008695654,
    2152173915,
    2295652176,
    2439130437,
    2582608698,
    2726086959,
    2869565220,
    3013043481,
    3156521742,
    3300000003,]

export default class Application extends PureComponent {
    static contextTypes = {
        list: PropTypes.instanceOf(Immutable.List).isRequired
    };

    constructor(props, context) {
        super(props, context)

        const list = []

        for (var i = 0; i < 25; i++) {
            list.push(i)
        }

        const zoominfo = {"start":1,"end":3000000000}


        this.state = {
            columnCount: 25,
            height: 60,
            overscanColumnCount: 0,
            overscanRowCount: 1,
            rowHeight: 50,
            rowCount: 29,
            scrollToColumn: undefined,
            scrollToRow: undefined,
            useDynamicRowHeight: false,
            list:Immutable.List(intial),
            zoomindex:100,
            zoomamount:10,
            zoomStack: [zoominfo]
        }

        this._cellRenderer = this._cellRenderer.bind(this)
        this._getColumnWidth = this._getColumnWidth.bind(this)
        this._getRowClassName = this._getRowClassName.bind(this)
        this._getRowHeight = this._getRowHeight.bind(this)
        this._noContentRenderer = this._noContentRenderer.bind(this)
        this._onColumnCountChange = this._onColumnCountChange.bind(this)
        this._onRowCountChange = this._onRowCountChange.bind(this)
        this._onScrollToColumnChange = this._onScrollToColumnChange.bind(this)
        this._onScrollToRowChange = this._onScrollToRowChange.bind(this)
        this._renderBodyCell = this._renderBodyCell.bind(this)
        this._renderLeftSideCell = this._renderLeftSideCell.bind(this)
        this._getDatum = this._getDatum.bind(this)
        this._on
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
            <ContentBox>

                <InputRow>
                    <LabeledInput
                        label='Num columns'
                        name='columnCount'
                        onChange={this._onColumnCountChange}
                        value={columnCount}
                    />
                    <LabeledInput
                        label='Num rows'
                        name='rowCount'
                        onChange={this._onRowCountChange}
                        value={rowCount}
                    />
                    <LabeledInput
                        label='Scroll to column'
                        name='onScrollToColumn'
                        placeholder='Index...'
                        onChange={this._onScrollToColumnChange}
                        value={scrollToColumn || ''}
                    />
                    <LabeledInput
                        label='Scroll to row'
                        name='onScrollToRow'
                        placeholder='Index...'
                        onChange={this._onScrollToRowChange}
                        value={scrollToRow || ''}
                    />
                    <LabeledInput
                        label='List height'
                        name='height'
                        onChange={event => this.setState({height: parseInt(event.target.value, 10) || 1})}
                        value={height}
                    />
                    <LabeledInput
                        disabled={useDynamicRowHeight}
                        label='Row height'
                        name='rowHeight'
                        onChange={event => this.setState({rowHeight: parseInt(event.target.value, 10) || 1})}
                        value={rowHeight}
                    />
                    <LabeledInput
                        label='Overscan columns'
                        name='overscanColumnCount'
                        onChange={event => this.setState({overscanColumnCount: parseInt(event.target.value, 10) || 0})}
                        value={overscanColumnCount}
                    />
                    <LabeledInput
                        label='Overscan rows'
                        name='overscanRowCount'
                        onChange={event => this.setState({overscanRowCount: parseInt(event.target.value, 10) || 0})}
                        value={overscanRowCount}
                    />
                </InputRow>

                <div style={{border:"1px solid #ccc!important"}}>
                    <div style={{backgroundColor:'#bbb',height:"24px",width: Math.abs(this.state.zoomamount) + "%"}}></div>
                </div>


                <CustomWindowScroller onScroll={this._updateZoom.bind(this)}>
                    {({ height, isScrolling, scrollTop }) => (
                        <AutoSizer disableHeight>
                            {({width}) => (
                                <Grid
                                    ref={(input) => { this.axis = input}}
                                    cellRenderer={this._cellRenderer}
                                    className={styles.BodyGrid}
                                    columnWidth={this._getColumnWidth}
                                    columnCount={columnCount}
                                    height={500}
                                    noContentRenderer={this._noContentRenderer}
                                    overscanColumnCount={overscanColumnCount}
                                    overscanRowCount={overscanRowCount}
                                    rowHeight={50}
                                    rowCount={rowCount}
                                    scrollToColumn={scrollToColumn}
                                    width={width}
                                />
                            )}
                        </AutoSizer>
                    )}
                </CustomWindowScroller>
            </ContentBox>

        )
    }

    _setRef (windowScroller) {
        this._windowScroller = windowScroller
    }

    _updateZoom({event}) {

        let zoomamt  = this.state.zoomamount + (event.wheelDeltaY /10 )
        var current = event.clientX / this._getColumnWidth()


        if (zoomamt > 100) {
            zoomamt = 0
            let start = this.state.list.get(Math.floor(current))
            let end = this.state.list.get(Math.floor(current) + 1)

            let items = [];
            for (let i = start; i < (end); i = i + ((end - start) / 50)) {
                items.push(Math.floor(i));
            }

            const zstack = this.state.zoomStack
            zstack.push({"start": start, "end": end})



            this.setState({"list": Immutable.List(items), zoomStack: zstack, zoomamount: 0}, function () {

                this._onColumnCountChange((items.length))
                this.axis.recomputeGridSize({columnIndex: 0, rowIndex: 0})
                this.axis.recomputeGridSize({columnIndex: 1, rowIndex: 0})
                this.axis.recomputeGridSize({columnIndex: 2, rowIndex: 0})
                this.axis.recomputeGridSize({columnIndex: 3, rowIndex: 0})
                this.axis.recomputeGridSize({columnIndex: 4, rowIndex: 0})

            }.bind(this))
        } else if (zoomamt < - 100){
            //
            // let zstack = this.state.zoomStack
            // zstack.pop()
            //
            //
            //
            // let start = zstack
            // let end = this.state.list.get(Math.floor(current) + 1)
            //
            // let items = [];
            // for (let i = start; i < (end); i = i + ((end - start) / 50)) {
            //     items.push(Math.floor(i));
            // }
            //
            // const zstack = this.state.zoomStack
            // zstack.push({"start": start, "end": end})


        }
        else{
            this.setState({'zoomamount':zoomamt})
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


    _cellRenderer({columnIndex, key, rowIndex, style}) {

        // console.log(key)
        // console.log(style)

        // if (columnIndex === 0) {
        //     return this._renderLeftSideCell({columnIndex, key, rowIndex, style})
        // } else {
            return this._renderBodyCell({columnIndex, key, rowIndex, style})
        //}
    }

    _getColumnWidth() {


        // return this.state.zoomindex
        // return Math.floor(Math.random() * (500 - 40)) + 40
        //
        // if (this.state.zoomindex < 0) {
        //     return 80
        // }
        // if (this.state.zoomindex > 50) {
        //     return 10
        // }

        if (this.state.zoomStack.length == 1 ){
            return 60
        }
        else if (this.state.zoomStack.length == 2 ) {
            return 50
        }
        return 30
        
    }

    _getDatum(index) {
        return this.state.list.get(index % this.state.list.size)
    }

    _getRowClassName(row) {
        return row % 2 === 0 ? styles.evenRow : styles.oddRow
    }

    _getRowHeight({index}) {
        return this._getDatum(index).bind(this).size
    }

    _noContentRenderer() {
        return (
            <div className={styles.noCells}>
                No cells
            </div>
        )
    }

    _renderBodyCell({columnIndex, key, rowIndex, style}) {
        const rowClass = this._getRowClassName(rowIndex)
        const datum = this._getDatum(columnIndex)


        const classNames = cn(rowClass, styles.cell, {
            [styles.centeredCell]: columnIndex > 2
        })

        style = {
            ...style,
            fontSize: "x-small"
        }


        //Format based on length of number
        const millions =  Math.floor(datum / 1000000 % 10)
        const tensMillions =  Math.floor(datum / 10000000 % 10)
        const hundredMillions =  Math.floor(datum / 100000000 % 10)
        const billions =  Math.floor(datum / 1000000000 % 10)


        //Compute the resolution for the scale
        let zstate = this.state.zoomStack[this.state.zoomStack.length - 1]
        const sbil =  Math.floor(zstate.start / 1000000000 % 10)
        const endbil =  Math.floor(zstate.end / 1000000000 % 10)

        let label = billions + "." + hundredMillions + tensMillions + millions
        // if(sbil > 0 || endbil > 0){
        //     label = billions + "." + hundredMillions + tensMillions +  "B"
        // }
        // else{
        //     label = hundredMillions + tensMillions + millions  +"M"
        // }


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
            backgroundColor: datum.color
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

    _updateUseDynamicRowHeights(value) {
        this.setState({
            useDynamicRowHeight: value
        })
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
}