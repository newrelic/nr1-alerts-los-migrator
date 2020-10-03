import React from 'react'

import { NerdGraphQuery, NerdGraphMutation } from 'nr1'
import MenuBar from './components/MenuBar'
import ActionPanel from './components/ActionPanel'
import ConditionTable from './components/ConditionTable'
import LoadingMessage from './components/LoadingMessage'
import Modal from './components/Modal'
import { set, cloneDeep, sortBy, lowerCase } from 'lodash'

export const ALL_POLICIES = { id: 'All', name: 'All ' }
export const DURATION_BOUNDARIES = { min: 60, max: 172800 }

export default class index extends React.PureComponent {
  /*
   * There's a whole bunch of loading cycles going on to seed the data. Conditions have to be
   * loaded in two separate batches because the search criteria doesn't support an or condition
   * (i.e. we can't query for conditions that use either "=" OR "<", we have to submit
   * separate queries for each). Each condition lookup can return paged results - so we have
   * to wait for the entire set of pages to load to consider the loading routine complete.
   * These are all asynchronous, so we have to track the loading status for each query
   * type separately. Once all condition batches are done, we can move to the next step,
   * which is to load the policies. Policies have to be loaded after the conditions, since
   * we only want to load the policies for the conditions returned by our searches.
   */
  emptyConditionsState = {
    loading: true,
    loadingActivity: '',
    conditions: [],
    equalsCursor: null,
    lessThanCursor: null,
    equalsCount: 0,
    conditionCursor: null,
    conditionCount: 0,
    conditionsLoading: true,
    equalsLoading: true,
    lessThanLoading: true,
    lessThanCount: 0,
    lookupError: null,
    policy: ALL_POLICIES,
    policies: [],
    policiesCursor: null,
    policiesLoading: true,
    selected: [],
    invalid: [],
    saving: false,
    saveComplete: false,
    saveErrors: false,
    saveCursorPosition: 0,
    modalHidden: true,
    modalMounted: false,
  }

  state = {
    accountId: null,
    showAccountPicker: false,
    ...this.emptyConditionsState,
  }

  EQUALS_CRITERIA = 'EQUALS'
  LESS_THAN_CRITERIA = 'BELOW'
  SAVE_BATCH_SIZE = 75

  async componentDidMount() {
    const {
      data: {
        actor: { accounts },
      },
    } = await NerdGraphQuery.query({
      query: `{
          actor {
            accounts {
              name
              id
            }
          }
        }`,
    })

    if (!accounts) console.error('unable to load accounts')

    this.setState({
      accountId: accounts[0].id,
      showAccountPicker: accounts.length > 1,
    })
  }

  async componentDidUpdate(prevProps, prevState) {
    const {
      loading,
      accountId,
      equalsLoading,
      lessThanLoading,
      conditionsLoading,
      policiesLoading,
      conditions,
      policies,
      saving,
    } = this.state

    if (accountId && loading) {
      if (conditionsLoading) {
        if (equalsLoading) await this.loadConditions(this.EQUALS_CRITERIA)
        else if (lessThanLoading)
          await this.loadConditions(this.LESS_THAN_CRITERIA)
        else this.setState({ conditionsLoading: false })
      }

      if (!conditionsLoading && policiesLoading) {
        if (conditions.length === 0) this.setState({ policiesLoading: false })
        else await this.loadPolicies()
      }

      if (!conditionsLoading && !policiesLoading) {
        this.addPoliciesToConditions()
        const sortedConditions = sortBy(conditions, (c) =>
          lowerCase(c.policyName)
        )
        const sortedPolicies = sortBy(policies, (p) => lowerCase(p.name))
        this.setState({
          loading: false,
          conditions: sortedConditions,
          policies: sortedPolicies,
        })
      }
    }

    if (saving) {
      this.saveChanges()
    }
  }

  runNerdGraphQuery = async (query, variables, handler, category) => {
    // console.debug('runNerdGraphQuery', query, variables)
    try {
      const { data, errors } = await NerdGraphQuery.query({
        query,
        variables,
      })

      if (errors) {
        console.error('error executing NerdGraphQuery', errors)
      }

      if (data) {
        handler(data, category)
      }
    } catch (e) {
      console.error('error executing NerdGraphQuery', e)
      // this.setState({
      //   lookupError: {
      //     message: e.message,
      //     stack: e.stack,
      //     graphQLErrors: [],
      //   },
      // })
    }
  }

  loadConditions = async (criteria) => {
    const { accountId, equalsCursor, lessThanCursor } = this.state
    const cursor =
      criteria === this.EQUALS_CRITERIA ? equalsCursor : lessThanCursor

    const query = `query ConditionSearchQuery($accountId:Int!,$cursor:String) {
      actor {
        account(id: $accountId) {
          alerts {
            nrqlConditionsSearch(searchCriteria: {termsOperator: ${criteria}}, cursor: $cursor) {
              nextCursor
              totalCount
              nrqlConditions {
                id
                name
                nrql {
                  query
                }
                terms {
                  threshold
                  thresholdDuration
                  thresholdOccurrences
                  operator
                  priority
                }
                signal {
                  evaluationOffset
                  fillOption
                  fillValue
                }
                expiration {
                  closeViolationsOnExpiration
                  expirationDuration
                  openViolationOnExpiration
                }                
                policyId
              }
            }
          }
        }
      }
    }`

    const variables = {
      accountId,
      criteria,
      cursor,
    }

    this.runNerdGraphQuery(query, variables, this.parseConditions, criteria)
  }

  parseConditions = (results, category) => {
    let { equalsCount, lessThanCount } = this.state

    // console.debug('parsing conditions', results)

    const data = results.actor.account.alerts.nrqlConditionsSearch
    if (data) {
      const nextCursor = data.nextCursor
      const total = data.totalCount
      let clonedConditions = [...this.state.conditions]

      if (category === this.EQUALS_CRITERIA) {
        clonedConditions = clonedConditions.concat(
          data.nrqlConditions.filter((c) => {
            const critical = c.terms.find((t) => t.priority === 'CRITICAL')
            return critical && critical.threshold === 0
          })
        )
      } else clonedConditions = clonedConditions.concat(data.nrqlConditions)

      if (category === this.EQUALS_CRITERIA && equalsCount === 0)
        equalsCount = total
      if (category === this.LESS_THAN_CRITERIA && lessThanCount === 0)
        lessThanCount = total

      const loadingType =
        category === this.EQUALS_CRITERIA ? 'equalsLoading' : 'lessThanLoading'
      const cursorType =
        category === this.EQUALS_CRITERIA ? 'equalsCursor' : 'lessThanCursor'

      this.setState({
        loadingActivity:
          category === this.EQUALS_CRITERIA ? 'equals' : 'less than',
        conditions: clonedConditions,
        [loadingType]: nextCursor !== null,
        [cursorType]: nextCursor,
        equalsCount,
        lessThanCount,
        conditionCount: equalsCount + lessThanCount,
      })
    } else {
      this.setState({
        equalsLoading: false,
        lessThanLoading: false,
        conditionsLoading: false,
      })
    }
  }

  loadPolicies = async () => {
    const { accountId, conditions, policiesCursor } = this.state
    const ids = conditions.map((c) => c.policyId)
    const query = `query PolicySearchQuery($accountId:Int!,$cursor:String,$ids:[ID!]!) {
      actor {
        account(id: $accountId) {
          alerts {
            policiesSearch(searchCriteria: {ids: $ids}, cursor: $cursor) {
              policies {
                id
                name
              }
              nextCursor
            }
          }
        }
      }
    }`

    const variables = {
      accountId,
      ids,
      cursor: policiesCursor,
    }

    this.runNerdGraphQuery(query, variables, this.parsePolicies)
  }

  parsePolicies = (results) => {
    const data = results.actor.account.alerts.policiesSearch
    if (data) {
      const nextCursor = data.nextCursor
      let clonedPolicies = [...this.state.policies]

      clonedPolicies = clonedPolicies.concat(data.policies)

      this.setState({
        policies: clonedPolicies,
        policiesCursor: nextCursor,
        policiesLoading: nextCursor !== null,
      })
    } else this.setState({ policiesLoading: false })
  }

  addPoliciesToConditions = () => {
    const clonedConditions = [...this.state.conditions]
    clonedConditions.forEach((c) => {
      const policy = this.state.policies.find((p) => p.id === c.policyId)
      if (policy) c.policyName = policy.name
    })
    this.setState({ conditions: clonedConditions })
  }

  saveChanges = async () => {
    const { accountId, selected, conditions, saveCursorPosition } = this.state
    let { saveErrors } = this.state

    if (saveCursorPosition >= selected.length) {
      this.setState({
        saving: false,
        saveComplete: true,
        saveCursorPosition: 0,
      })
      return
    }
    const batchNumber = saveCursorPosition / this.SAVE_BATCH_SIZE + 1
    console.info('saving batch', batchNumber)

    const saveBatch =
      selected.length <= this.SAVE_BATCH_SIZE
        ? selected
        : selected.slice(
            saveCursorPosition,
            saveCursorPosition + this.SAVE_BATCH_SIZE
          )

    const mutation = `
      mutation {
        ${saveBatch
          .map((s) =>
            this.getConditionMutation(
              conditions.find((c) => c.id === s),
              accountId
            )
          )
          .join()}
      }
    `
    console.info('mutation query', mutation)
    let error = null
    try {
      const { data } = await NerdGraphMutation.mutate({ mutation })
    } catch (e) {
      error = e.message
    } finally {
      /* 
        Note: if an error occurs during save, the graphql call will trigger an error
        on the promise. It is not accessible in an errors object returned by the call, 
        so we can't get at the underlying cause was. The data result is also not accessible, 
        so it isn't possible to know which calls passed and which failed. An error doesn't 
        fail the entire batch.
      */
      if (error) {
        console.error(
          'errors occurred saving batch',
          batchNumber,
          JSON.stringify(error)
        )
        console.error(
          'If a GraphQL error occured, you can locate the source of errors by submtting the above mutation at https://api.newrelic.com/graphiql'
        )
        saveErrors = true
      }

      if (selected.length <= this.SAVE_BATCH_SIZE) {
        this.setState({
          saving: false,
          saveComplete: true,
          saveErrors,
        })
      } else {
        const nextSaveCursorPosition = saveCursorPosition + this.SAVE_BATCH_SIZE
        this.setState({
          saving: true,
          saveComplete: false,
          saveErrors,
          saveCursorPosition: nextSaveCursorPosition,
        })
      }
    }
  }

  getConditionMutation = (condition, accountId) => {
    const conditionMutationObject = `
      c${condition.id}:alertsNrqlConditionStaticUpdate(id: ${condition.id}, accountId: ${accountId}, condition: {
        expiration: {
          closeViolationsOnExpiration: ${condition.expiration.closeViolationsOnExpiration}, 
          expirationDuration: ${condition.expiration.expirationDuration}, 
          openViolationOnExpiration: ${condition.expiration.openViolationOnExpiration}
        }, 
          signal: {
          fillOption: ${condition.signal.fillOption}, 
          fillValue: ${condition.signal.fillValue}
        }
      }) {
          id
      }
    `
    return conditionMutationObject
  }

  onShowModal = () => this.setState({ modalHidden: false, modalMounted: true })

  onEndModal = () => this.setState({ modalMounted: false })

  onChangeAccount = (event, value) =>
    this.setState({ ...this.emptyConditionsState, accountId: value })

  onChangePolicy = (value) => this.setState({ policy: value })

  onSaveChanges = () => {
    const { selected } = this.state
    console.info(
      `Saving ${selected.length} changes. Changes are saved in batches of ${this.SAVE_BATCH_SIZE}`
    )
    this.setState({ saving: true })
  }

  onCancelSave = () => this.setState({ saving: false, modalHidden: true })

  onCompleteSave = () => this.setState({ ...this.emptyConditionsState })

  onToggleSelect = (conditionId, checked) => {
    let selected = [...this.state.selected]
    let invalid = [...this.state.invalid]

    if (!checked) {
      selected = selected.filter((s) => s !== conditionId)
      invalid = invalid.filter((i) => i !== conditionId)
    } else {
      if (
        !this.isConditionValid(
          this.state.conditions.find((c) => c.id === conditionId)
        )
      ) {
        invalid.push(conditionId)
      }
      selected.push(conditionId)
    }

    this.setState({ selected, invalid })
  }

  onUseSuggestions = () => {
    console.debug('calling onUseSuggestions')

    const conditions = [...this.state.conditions]
    const selected = [...this.state.selected]
    let invalid = [...this.state.invalid]

    selected.forEach((s) => {
      const idx = conditions.findIndex((c) => c.id === s)
      if (idx || idx === 0) {
        let found = cloneDeep(conditions[idx])

        const criticalTerms = found.terms.find((t) => t.priority === 'CRITICAL')

        found.expiration.expirationDuration =
          criticalTerms.thresholdDuration + found.signal.evaluationOffset * 60
        found.expiration.openViolationOnExpiration = true
        found.expiration.closeViolationsOnExpiration = false
        found.signal.fillOption = 'NONE'
        found.signal.fillValue = 0

        conditions[idx] = found

        // a suggested condition is by its nature value - make sure it doesn't hang around in invalid
        invalid = invalid.filter((i) => i !== found.id)

        this.setState({ conditions, invalid })
      } else console.warn(`onEditCondition: cound not find condition ${s}`)
    })
  }

  onEditCondition = ({ item, attribute, value }) => {
    // console.info('onChangeCondition', item, attribute, value)
    const conditions = [...this.state.conditions]
    const selected = [...this.state.selected]
    const invalid = [...this.state.invalid]

    const idx = conditions.findIndex((c) => c.id === item.id)
    if (idx || idx === 0) {
      let found = cloneDeep(conditions[idx])
      set(found, attribute, value)
      if (attribute.includes('fillOption')) this.defaultFillValue(found)
      found.valid = this.isConditionValid(found)

      const invalidIdx = invalid.findIndex((i) => i === item.id)
      if (invalidIdx !== -1) {
        if (found.valid) invalid.splice(invalidIdx, 1)
      } else {
        if (!found.valid) invalid.push(found.id)
      }

      const selectedIdx = selected.findIndex((s) => s === item.id)
      if (selectedIdx === -1) selected.push(item.id)

      conditions[idx] = found

      this.setState({ conditions, selected, invalid })
    } else console.warn(`onEditCondition: cound not find condition ${item.id}`)
  }

  defaultFillValue = (item) => {
    if (
      item.signal.fillOption === 'STATIC' &&
      (!item.signal.fillValue || item.signal.fillValue !== 0)
    )
      item.signal.fillValue = 0
  }

  isConditionValid = (item) => {
    if (!item) return true

    const durationValid =
      item.expiration.expirationDuration >= DURATION_BOUNDARIES.min &&
      item.expiration.expirationDuration <= DURATION_BOUNDARIES.max

    const fillValueValid =
      item.signal.fillOption === 'STATIC' &&
      !(
        item.signal.fillValue === 0 ||
        item.signal.fillValue === '0' ||
        item.signal.fillValue > 0
      )
        ? false
        : true

    return durationValid && fillValueValid
  }

  filterConditionsForPolicy = () => {
    const { policy, conditions } = this.state
    if (policy.id === ALL_POLICIES.id) return conditions
    else return conditions.filter((d) => d.policyId === policy.id)
  }

  render() {
    const {
      loading,
      loadingActivity,
      lookupError,
      accountId,
      showAccountPicker,
      policy,
      policies,
      conditions,
      conditionCount,
      selected,
      invalid,
      modalHidden,
      modalMounted,
      saving,
      saveComplete,
      saveErrors,
    } = this.state

    const visibleConditions = this.filterConditionsForPolicy()

    return (
      <div className="container">
        <MenuBar
          showAccountPicker={showAccountPicker}
          loading={loading}
          lookupError={lookupError}
          policy={policy}
          policies={policies}
          accountId={accountId}
          changeAccount={this.onChangeAccount}
          changePolicy={this.onChangePolicy}
        />
        <div className="content__container">
          {loading && (
            <LoadingMessage
              loaded={conditions.length}
              total={conditionCount}
              type={loadingActivity}
            />
          )}
          {!loading && !lookupError && (
            <div className="conditions__container">
              <ActionPanel
                total={conditions.length}
                visible={visibleConditions.length}
                selected={selected.length}
                invalid={invalid.length}
                policy={policy}
                save={this.onShowModal}
                applySuggestions={this.onUseSuggestions}
              />
              <ConditionTable
                data={visibleConditions}
                selected={selected}
                policy={policy}
                edit={this.onEditCondition}
                select={this.onToggleSelect}
              />
            </div>
          )}
        </div>
        {modalMounted && (
          <Modal
            cancel={this.onCancelSave}
            end={this.onEndModal}
            save={this.onSaveChanges}
            finish={this.onCompleteSave}
            total={selected.length}
            hidden={modalHidden}
            saving={saving}
            complete={saveComplete}
            errors={saveErrors}
          />
        )}
      </div>
    )
  }
}
