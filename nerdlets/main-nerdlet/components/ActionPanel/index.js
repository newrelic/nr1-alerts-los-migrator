import React from 'react'
import PropTypes from 'prop-types'

import { Button, Tooltip } from 'nr1'

import { ALL_POLICIES } from '../../index'

const index = ({
  total,
  visible,
  selected,
  invalid,
  policy,
  save,
  applySuggestions,
}) => {
  // console.info('ActionPanel', total, selected, invalid)
  const conditionsMsg = policy.id !== ALL_POLICIES.id
    ? `Viewing ${visible} conditions for policy ${policy.name}`
    : `${total} condition(s) loaded for all policies`
  return (
    <div className="conditions__info__panel">
      <div className="conditions__info__panel__message">
        {conditionsMsg}. There are {selected} condition(s) selected for update.
        <Tooltip text="View the Documentation tab in App Details above for help using this app." placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}><span className="help">Need help?</span></Tooltip>
        {invalid > 0 && (
          <div className="conditions__info__panel__message invalid">
            {invalid} condition(s) are missing data and can't be submitted.
          </div>
        )}
        {selected === 0 && (
          <div className="conditions__info__panel__message valid">
            Select one or more conditions to update in the table below.
          </div>
        )}
      </div>
      <div className="button__row">
        <Button
          sizeType={Button.SIZE_TYPE.LARGE}
          disabled={selected > 0 ? false : true}
          className="conditions__info__panel__button"
          onClick={applySuggestions}
        >
          Auto-fill Suggestions
        </Button>
        <Button
          sizeType={Button.SIZE_TYPE.LARGE}
          type={Button.TYPE.PRIMARY}
          disabled={selected > 0 && invalid === 0 ? false : true}
          className="conditions__info__panel__button"
          onClick={save}
        >
          Update Selected
        </Button>
      </div>
    </div>
  )
}

index.propTypes = {
  /**
   * The number of conditions loaded
   */
  total: PropTypes.number.isRequired,

  /**
   * The number of conditions viewable
   */
  visible: PropTypes.number.isRequired,

  /**
   * The number of conditions selected for update
   */
  selected: PropTypes.number.isRequired,

  /**
   * The number of conditions slated for update that are in an invalid state
   */
  invalid: PropTypes.number.isRequired,

  /**
   * The active policy filter
   */
  policy: PropTypes.object.isRequired,

  /**
   * Callabck to initiate condition mutation
   */
  save: PropTypes.func.isRequired,
}

export default index
