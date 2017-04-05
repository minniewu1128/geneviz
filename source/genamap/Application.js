
import Immutable from 'immutable'
import React, { PropTypes, PureComponent } from 'react'
import { ContentBox, ContentBoxHeader, ContentBoxParagraph } from '../demo/ContentBox'
import { LabeledInput, InputRow } from '../demo/LabeledInput'
import AutoSizer from '../AutoSizer'
import Grid from '../Grid'
import CustomWindowScroller from '../CustomWindowScroller'
import cn from 'classnames'
import styles from './axis.css'

export default class Application extends PureComponent {
    static contextTypes = {
        list: PropTypes.instanceOf(Immutable.List).isRequired
    };

    constructor(props, context) {
        super(props, context)

        const list = []

        for (var i = 0; i < 1000; i++) {
            list.push(i)
        }


        this.state = {
            columnCount: 1000,
            height: 100,
            overscanColumnCount: 0,
            overscanRowCount: 1,
            rowHeight: 50,
            rowCount: 1,
            scrollToColumn: undefined,
            scrollToRow: undefined,
            useDynamicRowHeight: false,
            list:Immutable.List(list),
            zoomindex:0
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
                                    height={100}
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
        if (event.deltaY > 50 ){
            console.log(event)
            this.state.zoomindex = this.state.zoomindex + 1
            this.axis.invalidateCellSizeAfterRender(this.axis._renderedColumnStartIndex,this.axis._renderedRowStartIndex)
        }else if (event.deltaY < - 50 ){
            this.state.zoomindex = this.state.zoomindex - 1
            console.log(this.axis)
            this.axis.invalidateCellSizeAfterRender(this.axis._renderedColumnStartIndex,this.axis._renderedRowStartIndex)
        }
    }


    _cellRenderer({columnIndex, key, rowIndex, style}) {

        if (columnIndex === 0) {
            return this._renderLeftSideCell({columnIndex, key, rowIndex, style})
        } else {
            return this._renderBodyCell({columnIndex, key, rowIndex, style})
        }
    }

    _getColumnWidth({index}) {

        console.log(this.state.zoomindex)

        if (this.state.zoomindex < 0) {
            return 80
        }
        if (this.state.zoomindex > 50) {
            return 10
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
        const datum = this._getDatum(rowIndex)

        let content

        switch (columnIndex) {
            case 1:
                content = datum.name
                break
            case 2:
                content = datum.random
                break
            default:
                content = `${columnIndex} Kb`
                break
        }

        const classNames = cn(rowClass, styles.cell, {
            [styles.centeredCell]: columnIndex > 2
        })

        return (
            <div
                className={classNames}
                key={key}
                style={style}
            >
                {content}
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

    _onColumnCountChange(event) {
        const columnCount = parseInt(event.target.value, 10) || 0

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