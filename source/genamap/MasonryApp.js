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
import styles from '../Masonry/Masonry.example.css'

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
            columnWidth:30,
            height: 300,
            gutterSize: 10,
            windowScrollerEnabled: true,
            list: Immutable.List([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23])
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

                {child}
            </ContentBox>
        )
    }


    _updateZoom({event}){

        this._columnHeights = {}
        this._cache.clearAll()

        var cb = function(){
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

        this._columnCount = Math.floor(this._width / (columnWidth + gutterSize))
        if (this._columnCount > 50 ){
            this._columnCount = 50
        }
        else if (this._columnCount < 23 ) {
            this._columnCount = 23
        }


        if (event.wheelDeltaY > 0 ) {
            this.setState({columnWidth: Math.max(this.state.columnWidth - event.wheelDeltaY,0) , columnCount:this._columnCount }, cb.bind(this))
        }
        if (event.wheelDeltaY < 0 ){
            this.setState({columnWidth: Math.min(this.state.columnWidth - event.wheelDeltaY,200) , columnCount:this._columnCount}, cb.bind(this))
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

        return (
            <CellMeasurer
                cache={this._cache}
                index={index}
                key={key}
                parent={parent}
            >
                <div
                    className={styles.Cell}
                    style={{
                        ...style,
                        width: columnWidth
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'blue',
                            borderRadius: '0.5rem',
                            marginBottom: '0.5rem',
                            width: '100%'
                        }}
                    />
                    {datum}
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

        console.log("RERENDER")
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
