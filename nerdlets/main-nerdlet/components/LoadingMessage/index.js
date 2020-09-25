import React from 'react'
import PropTypes from 'prop-types'

import { Spinner } from 'nr1'

const index = ({ loaded, total, type }) => {
  const loadingMessage =
    total > 0 && loaded < total
      ? `Loading ${type} conditions ... ${loaded} loaded`
      : total > 0 && total == loaded
      ? `${loaded} of ${total} conditions loaded - finishing up ...`
      : ''

  return (
    <>
      <div className="loading__container">
        <div className="loading__message__panel">
          <div className="loading__message">{loadingMessage}</div>
          <Spinner inline />
        </div>
      </div>
    </>
  )
}

index.propTypes = {
  loaded: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
}

export default index
