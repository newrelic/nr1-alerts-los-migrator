import React from 'react'

import { AccountPicker, Dropdown, DropdownItem } from 'nr1'
import { ALL_POLICIES } from '../../index'

const index = ({
  loading,
  lookupError,
  showAccountPicker,
  accountId,
  changeAccount,
  policy,
  policies,
  changePolicy,
}) => {
  return (
    <div className="menu__container">
      <div className="menu__bar">
        {/* {showAccountPicker && ( */}
        <div className="menu__bar__item">
          <div className="menu__bar__label">Account</div>
          <AccountPicker value={accountId} onChange={changeAccount} />
        </div>
        {/* )} */}

        {!loading && !lookupError && (
          <div className="menu__bar__item">
            <div className="menu__bar__label">Policy</div>
            <Dropdown
              title={
                policy.id === ALL_POLICIES.id
                  ? policy.name
                  : `${policy.id}: ${policy.name}`
              }
            >
              <DropdownItem
                onClick={() => changePolicy(ALL_POLICIES)}
                selected={policy.id === ALL_POLICIES.id}
              >
                All
              </DropdownItem>
              {policies.map((p, idx) => (
                <DropdownItem
                  key={idx}
                  onClick={() => changePolicy(p)}
                  selected={policy.id === p.id}
                >
                  {p.id}: {p.name}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
        )}
      </div>
    </div>
  )
}

export default index
