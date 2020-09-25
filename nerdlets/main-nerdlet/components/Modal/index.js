import React from 'react'
import PropTypes from 'prop-types'

import { Modal, HeadingText, BlockText, Button, Spinner, Icon } from 'nr1'

const index = ({
  total,
  hidden,
  saving,
  complete,
  errors,
  cancel,
  save,
  finish,
  end,
}) => {
  const close = saving ? () => undefined : complete ? finish : cancel
  return (
    <Modal onClose={close} onHideEnd={end} hidden={hidden}>
      <HeadingText type={HeadingText.TYPE.HEADING_3}>
        Saving Changes
      </HeadingText>
      {errors && (
        <div className="errors__panel">
          <div className="errors__header">
          <HeadingText type={HeadingText.TYPE.HEADING_4}>
          <Icon
            spacingType={[Icon.SPACING_TYPE.OMIT, Icon.SPACING_TYPE.MEDIUM, Icon.SPACING_TYPE.OMIT, Icon.SPACING_TYPE.OMIT ]}
            color="red"
            type={Icon.TYPE.INTERFACE__OPERATIONS__CLOSE__V_ALTERNATE}
          />
            Errors during save
          </HeadingText>
          </div>
          <BlockText>{JSON.stringify(errors)}</BlockText>
        </div>
      )}

      {complete ? (
        <BlockText>Updates complete. Click Done to refresh results.</BlockText>
      ) : saving ? (
        <BlockText>
          <Spinner inline />
          Updating ...
        </BlockText>
      ) : (
        <BlockText>
          You are about to update {total} conditions. Are you sure?
        </BlockText>
      )}

      <div className="button__row">
        {complete ? (
          <Button onClick={finish}>Done</Button>
        ) : !saving ? (
          <>
            <Button onClick={save}>Save</Button>
            <Button onClick={cancel}>Cancel</Button>
          </>
        ) : (
          <div />
        )}
      </div>
    </Modal>
  )
}

index.propTypes = {
  total: PropTypes.number.isRequired,
  hidden: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
  complete: PropTypes.bool.isRequired,
  errors: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  cancel: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  finish: PropTypes.func.isRequired,
  end: PropTypes.func.isRequired,
}

export default index
