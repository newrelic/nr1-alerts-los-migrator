import React from 'react'
import PropTypes from 'prop-types'

import { Checkbox, Select, SelectItem } from 'nr1'
import { Table, Label, Menu, Icon } from 'semantic-ui-react'

import { ALL_POLICIES } from '../../index'

export default class index extends React.PureComponent {
  state = {
    rowsPerPage: 25,
    currentPage: 1,
  }

  tableInputStyles = {
    border: '1px solid rgba(34,36,38,.15)',
    boxShadow: '0 1px 3px 0 rgba(203, 226, 226, 0.34)',
    borderRadius: '.125rem',
    padding: '.15rem .25rem',
  }

  tableMandatoryInputStyles = {
    border: '1px solid #e0b4b4',
    backgroundColor: '#fff6f6',
    color: '#9f3a38',
    boxShadow: 'none',
    borderRadius: '.125rem',
    padding: '.15rem .25rem',
  }

  currentPageStyles = {
    backgroundColor: 'rgb(0, 140, 153)',
    color: 'rgb(255, 255, 255)',
  }

  isSelected = (item) => {
    const selected = this.props.selected.includes(item.id)
    return selected
  }

  isDurationValid = (value) => {
    const valid = value && value > 0
    return valid
  }

  isFillValid = (value) => {
    const valid = value === 0 || value === '0' || value > 0
    return valid
  }

  getPageNumbers = () => {
    const { data } = this.props
    const { rowsPerPage } = this.state

    const totalRows = data.length
    const pageNums = totalRows < rowsPerPage ? 1 : totalRows / rowsPerPage

    return Math.ceil(pageNums)
  }

  getDataForPage = () => {
    const { currentPage, rowsPerPage } = this.state
    const { data, policy } = this.props

    if (policy.id !== ALL_POLICIES.id) return data
    else {
      const endIdx = currentPage * rowsPerPage
      const startIdx = endIdx - rowsPerPage
      return data.slice(startIdx, endIdx)
    }
  }

  onPageBack = () => {
    let { currentPage } = this.state
    this.setState({ currentPage: --currentPage })
  }

  onPageForward = () => {
    let { currentPage } = this.state
    this.setState({ currentPage: ++currentPage })
  }

  onMoveToPage = (page) => {
    this.setState({ currentPage: page })
  }

  renderPageButtons = (numPages) => {
    const { currentPage } = this.state
    const pageButtons = []
    for (let page = 1; page <= numPages; page++) {
      pageButtons.push(
        <Menu.Item
          style={page === currentPage ? this.currentPageStyles : {}}
          key={'pg' + page}
          as="a"
          onClick={() => this.onMoveToPage(page)}
        >
          {page}
        </Menu.Item>
      )
    }
    return pageButtons
  }

  renderTableHeader = () => {
    return (
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>Policy</Table.HeaderCell>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Query</Table.HeaderCell>
          <Table.HeaderCell>Terms</Table.HeaderCell>
          <Table.HeaderCell>Offset</Table.HeaderCell>
          <Table.HeaderCell>Update</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
    )
  }

  renderTableFooter = () => {
    const { currentPage } = this.state
    const { policy } = this.props
    const numPages = this.getPageNumbers()

    return (
      <>
        {numPages > 1 && policy.id === ALL_POLICIES.id && (
          <Table.Footer fullWidth>
            <Table.Row>
              <Table.HeaderCell colSpan="10">
                <Menu floated="right" pagination>
                  {currentPage > 1 && (
                    <Menu.Item as="a" icon onClick={this.onPageBack}>
                      <Icon name="chevron left" />
                    </Menu.Item>
                  )}
                  {this.renderPageButtons(numPages)}
                  {currentPage < numPages && (
                    <Menu.Item as="a" icon onClick={this.onPageForward}>
                      <Icon name="chevron right" />
                    </Menu.Item>
                  )}
                </Menu>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        )}
      </>
    )
  }

  renderTable = () => {
    const { edit, select } = this.props
    const data = this.getDataForPage()

    return (
      <Table compact celled>
        {this.renderTableHeader()}
        <Table.Body>
          {data.map((item, idx) => {
            const isSelected = this.isSelected(item)

            // Wanda UI forces a background-color on the td, which overrides a tr-level background-color
            return (
              <Table.Row key={idx}>
                <Table.Cell
                  active={isSelected ? true : false}
                  className="semantic__table__cell_halfWidth"
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => select(item.id, e.target.checked)}
                    className="semantic__table__checkbox"
                  />
                </Table.Cell>
                <Table.Cell active={isSelected ? true : false} width="2">
                  {item.policyName}
                </Table.Cell>
                <Table.Cell active={isSelected ? true : false} width="2">
                  {item.name}
                </Table.Cell>
                <Table.Cell active={isSelected ? true : false} width="4">
                  {item.nrql.query}
                </Table.Cell>
                <Table.Cell
                  active={isSelected ? true : false}
                  className="semantic__table__cell_twoHalfWidth"
                >
                  {item.terms.map((t, idx) => {
                    return (
                      <div key={idx}>
                        <strong>{t.priority}</strong>
                        {`: ${t.operator} ${t.threshold} for ${t.thresholdDuration}`}
                      </div>
                    )
                  })}
                </Table.Cell>
                <Table.Cell
                  active={isSelected ? true : false}
                  className="semantic__table__cell__halfWidth"
                  textAlign="center"
                >
                  {item.signal.evaluationOffset}
                </Table.Cell>

                {/* form starts */}
                <Table.Cell active={isSelected ? true : false} width="5">
                  <div className="conditions__update__panel__header first">
                    <Label basic>Loss of Signal Settings</Label>
                  </div>
                  <div className="conditions__update__panel">
                    <div className="semantic__table__cellInput">
                      <Label basic>Duration</Label>
                      <input
                        style={
                          isSelected &&
                            !this.isDurationValid(
                              item.expiration.expirationDuration
                            )
                            ? this.tableMandatoryInputStyles
                            : this.tableInputStyles
                        }
                        value={item.expiration.expirationDuration || ''}
                        placeholder="seconds"
                        onChange={(e) =>
                          edit({
                            item,
                            attribute: 'expiration.expirationDuration',
                            value: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="semantic__table__cellInput">
                      <Checkbox
                        label="Close Violations"
                        checked={item.expiration.closeViolationsOnExpiration}
                        onChange={(e) =>
                          edit({
                            item,
                            attribute: 'expiration.closeViolationsOnExpiration',
                            value: e.target.checked,
                          })
                        }
                      />
                    </div>
                    <div className="semantic__table__cellInput">
                      <Checkbox
                        label="Open Violation"
                        checked={item.expiration.openViolationOnExpiration}
                        onChange={(e) =>
                          edit({
                            item,
                            attribute: 'expiration.openViolationOnExpiration',
                            value: e.target.checked,
                          })
                        }
                      />
                    </div>
                  </div>
                  {this.isDurationValid(item.expiration.expirationDuration) && (
                    <>
                      <div className="conditions__update__panel__header">
                        <Label basic>Gap Filling Strategy</Label>
                      </div>
                      <div className="conditions__update__panel last">
                        <div className="semantic__table__cellInput">
                          <Label basic>Fill Option</Label>
                          <Select
                            onChange={(e, value) =>
                              edit({
                                item,
                                attribute: 'signal.fillOption',
                                value,
                              })
                            }
                            value={item.signal.fillOption}
                          >
                            <SelectItem value="NONE">None</SelectItem>
                            <SelectItem value="STATIC">Static</SelectItem>
                            <SelectItem value="LAST_VALUE">
                              Last Value
                            </SelectItem>
                          </Select>
                        </div>
                        {item.signal.fillOption === 'STATIC' && (
                          <div className="semantic__table__cellInput">
                            <Label basic>Fill Value</Label>
                            <input
                              style={
                                isSelected &&
                                  (item.signal.fillOption === 'STATIC' &&
                                    // eslint-disable-next-line prettier/prettier
                                    !this.isFillValid(item.signal.fillValue))
                                  ? this.tableMandatoryInputStyles
                                  : this.tableInputStyles
                              }
                              value={
                                item.signal.fillValue ||
                                  item.signal.fillValue === 0
                                  ? item.signal.fillValue
                                  : ''
                              }
                              onChange={(e) =>
                                edit({
                                  item,
                                  attribute: 'signal.fillValue',
                                  value: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
        {this.renderTableFooter()}
      </Table>
    )
  }

  render() {
    return (
      <div className="conditions__table__container">
        {this.props.data && this.renderTable()}
      </div>
    )
  }
}

index.propTypes = {
  data: PropTypes.array.isRequired,
  policy: PropTypes.object.isRequired,
  selected: PropTypes.array.isRequired,
  edit: PropTypes.func.isRequired,
  select: PropTypes.func.isRequired,
}
