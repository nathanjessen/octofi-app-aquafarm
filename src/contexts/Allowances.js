import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import {} from '@web3-react/core'

import { ethers } from 'ethers'

import { useActiveWeb3React } from '../hooks'
import { isAddress } from '../utils'
import { safeAccess, getTokenAllowance } from '../utils/cross'
import { useBlockNumber } from './Application'

const UPDATE = 'UPDATE'

const AllowancesContext = createContext()

function useAllowancesContext() {
  return useContext(AllowancesContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, address, tokenAddress, spenderAddress, value, blockNumber } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [address]: {
            ...(safeAccess(state, [networkId, address]) || {}),
            [tokenAddress]: {
              ...(safeAccess(state, [networkId, address, tokenAddress]) || {}),
              [spenderAddress]: {
                value,
                blockNumber
              }
            }
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in AllowancesContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((networkId, address, tokenAddress, spenderAddress, value, blockNumber) => {
    dispatch({ type: UPDATE, payload: { networkId, address, tokenAddress, spenderAddress, value, blockNumber } })
  }, [])

  return (
    <AllowancesContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </AllowancesContext.Provider>
  )
}

export function useAddressAllowance(address, tokenAddress, spenderAddress) {
  const { library, chainId } = useActiveWeb3React()

  const globalBlockNumber = useBlockNumber()

  const [state, { update }] = useAllowancesContext()
  const { value, blockNumber } = safeAccess(state, [chainId, address, tokenAddress, spenderAddress]) || {}

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(tokenAddress) &&
      isAddress(spenderAddress) &&
      (value === undefined || blockNumber !== globalBlockNumber) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false

      getTokenAllowance(address, tokenAddress, spenderAddress, library)
        .then(value => {
          // console.log(value)
          if (!stale) {
            update(chainId, address, tokenAddress, spenderAddress, value, globalBlockNumber)
          }
        })
        .catch((err) => {
          // console.log(err.toString())
          // console.log(err.toString().indexOf('multiplication overflow') !== -1)
          if (!stale) {
            if (err && err.toString().indexOf('multiplication overflow') !== -1) {
              update(chainId, address, tokenAddress, spenderAddress, ethers.constants.MaxUint256, globalBlockNumber)
            } else {
              update(chainId, address, tokenAddress, spenderAddress, null, globalBlockNumber)
            }
          }
        })

      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, spenderAddress, value, blockNumber, globalBlockNumber, chainId, library, update])

  return value
}
