/** @flow */
import Immutable from 'immutable'
import React, { PropTypes, PureComponent } from 'react'
import { ContentBox, ContentBoxHeader, ContentBoxParagraph } from '../demo/ContentBox'
import { LabeledInput, InputRow } from '../demo/LabeledInput'
import { CellMeasurer, CellMeasurerCache } from '../CellMeasurer'
import AutoSizer from '../AutoSizer'
import CustomWindowScroller from '../CustomWindowScroller'
import createCellPositioner from '../Masonry/createCellPositioner'
import Masonry from '../Masonry'
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


export default class MasonryApp extends PureComponent {
    static contextTypes = {
        list: PropTypes.instanceOf(Immutable.List).isRequired
    };

    constructor (props, context) {
        super(props, context)

        this._columnCount = 0

        this._cache = new CellMeasurerCache({
            defaultHeight: 100,
            defaultWidth: 30,
            fixedWidth: true
        })

        this._columnHeights = {}

        this.state = {
            columnCount:23,
            columnWidth:55,
            height: 200,
            gutterSize:3,
            windowScrollerEnabled: true,
            list: Immutable.List(intial),
            zoomamount:10,
            zoomstack:[]
        }

        this._cellRenderer = this._cellRenderer.bind(this)
        this._onResize = this._onResize.bind(this)
        this._renderAutoSizer = this._renderAutoSizer.bind(this)
        this._renderMasonry = this._renderMasonry.bind(this)
        this._setMasonryRef = this._setMasonryRef.bind(this)
    }


    render () {
        const {
            columnWidth,
            height,
            gutterSize,
            windowScrollerEnabled
        } = this.state

        let child

        if (windowScrollerEnabled) {
            child = (
                <CustomWindowScroller onScroll={this._updateZoom.bind(this)}>
                    {this._renderAutoSizer}
                </CustomWindowScroller>
            )
        } else {
            child = this._renderAutoSizer({ height })
        }

        return (
            <ContentBox>
                <InputRow>
                    <LabeledInput
                        label='Height'
                        name='height'
                        onChange={(event) => {
                            this.setState({
                                height: parseInt(event.target.value, 10) || 300
                            })
                        }}
                        value={height}
                    />
                    <LabeledInput
                        label='Column Width'
                        name='columnWidth'
                        onChange={(event) => {
                            this._columnHeights = {}
                            this._cache.clearAll()
                            this.setState({
                                columnWidth: parseInt(event.target.value, 10) || 200
                            }, () => {
                                this._calculateColumnCount()
                                this._resetCellPositioner()
                                this._masonry.clearCellPositions()
                            })
                        }}
                        value={columnWidth}
                    />
                    <LabeledInput
                        label='Gutter Size'
                        name='gutterSize'
                        onChange={(event) => {
                            this._columnHeights = {}
                            this.setState({
                                gutterSize: parseInt(event.target.value, 10) || 10
                            }, () => {
                                this._calculateColumnCount()
                                this._resetCellPositioner()
                                this._masonry.recomputeCellPositions()
                            })
                        }}
                        value={gutterSize}
                    />

                </InputRow>


                <div style={{border:"1px solid #ccc!important"}}>
                    <div style={{backgroundColor:'#bbb',height:"24px",width: Math.abs(this.state.zoomamount) + "%"}}></div>
                </div>
                {child}
            </ContentBox>
        )
    }


    _updateZoom({event}){

            //Figure out the zoom level to be at



            this._columnHeights = {}
            this._cache.clearAll()

            var cb = function () {
                this._calculateColumnCount()
                this._resetCellPositioner()
                this._masonry.updateCellCount(this._columnCount)
                //this._masonry.clearCellPositions()
                //this._masonry.recomputeCellPositions()
            }


            //TODO : Chain state update , cleanup
            const {
                columnWidth,
                gutterSize
            } = this.state

            // //Compute position of column
            var current = event.clientX / columnWidth


            // Setup End


            //Compute new scale index

            //
            //
            //this._columnCount = Math.floor(this._width / (columnWidth + gutterSize))
            // if (this._columnCount > 50 ){
            //     this._columnCount = 50
            // }
            // else if (this._columnCount < 23 ) {
            //     this._columnCount = 23
            // }





            let zoomamt  = this.state.zoomamount + (event.wheelDeltaY /10 )


            if (zoomamt > 100){

                zoomamt = 0

                let start = this.state.list.get(Math.floor(current))
                let end = this.state.list.get(Math.floor(current)+1)

                console.log("Current Cell")
                console.log(Math.floor(current))


                console.log("Start End")
                console.log(start)
                console.log(end)

                let items = [];
                for (let i = start; i < (end); i = i + ((end - start)/50)){
                    items.push(Math.floor(i));
                }

                console.log(items)

                this.setState({
                    columnWidth: Math.max(this.state.columnWidth - event.wheelDeltaY, 15),
                    columnCount: this._columnCount,
                    zoomamount:zoomamt,
                    list: Immutable.List(items)
                }, cb.bind(this))

            }
            else if (zoomamt < -100){
                zoomamt = 0
                this.setState({
                    columnWidth: Math.min(this.state.columnWidth - event.wheelDeltaY, 200),
                    columnCount: this._columnCount,
                    zoomamount:zoomamt,
                    //list: Immutable.List(items)

                }, cb.bind(this))
            }else{
                this.setState({
                    zoomamount:zoomamt
                }, cb.bind(this))
            }

    }



    _calculateColumnCount () {
        const {
            columnWidth,
            gutterSize
        } = this.state

        this._columnCount = Math.floor(this._width / (columnWidth + gutterSize))
    }

    _cellRenderer ({ index, key, parent, style }) {
        const { columnWidth } = this.state

        const datum = this.state.list.get(index % this.state.list.size)

        //Cell format to simplify ... this will have to adapt to zoom
        const tensMillions =  Math.floor(datum / 10000000 % 10)
        const hundredMillions =  Math.floor(datum / 100000000 % 10)
        const billions =  Math.floor(datum / 1000000000 % 10)

        let label = billions + "." + hundredMillions + tensMillions +  "B"

        return (
            <CellMeasurer
                cache={this._cache}
                index={index}
                key={key}
                parent={parent}
            >
                <div
                    style={{
                        ...style,
                        width: columnWidth,
                        backgroundColor: "#e6e6e6",
                        fontSize:"x-small"
                    }}
                >
                    {label}
                </div>
            </CellMeasurer>
        )
    }

    _initCellPositioner () {
        if (typeof this._cellPositioner === 'undefined') {
            const {
                columnWidth,
                gutterSize
            } = this.state

            this._cellPositioner = createCellPositioner({
                cellMeasurerCache: this._cache,
                columnCount: this._columnCount,
                columnWidth,
                spacer: gutterSize
            })
        }
    }

    _onResize ({ height, width }) {
        this._width = width

        this._columnHeights = {}
        this._calculateColumnCount()
        this._resetCellPositioner()
        this._masonry.recomputeCellPositions()
    }

    _renderAutoSizer ({ height, scrollTop }) {
        this._height = height
        this._scrollTop = scrollTop

        return (
            <AutoSizer
                disableHeight
                onResize={this._onResize}
                scrollTop={this._scrollTop}
            >
                {this._renderMasonry}
            </AutoSizer>
        )
    }

    _renderMasonry ({ width }) {
        this._width = width

        this._calculateColumnCount()
        this._initCellPositioner()

        const { height } = this.state

        return (
            <Masonry
                cellCount={this.state.columnCount}
                cellMeasurerCache={this._cache}
                cellPositioner={this._cellPositioner}
                cellRenderer={this._cellRenderer}
                height={300}
                ref={this._setMasonryRef}
                scrollTop={this._scrollTop}
                width={width}
            />
        )
    }

    _resetCellPositioner () {
        const {
            columnWidth,
            gutterSize
        } = this.state

        this._cellPositioner.reset({
            columnCount: this._columnCount,
            columnWidth,
            spacer: gutterSize
        })
    }

    _setMasonryRef (ref) {
        this._masonry = ref
    }
}
