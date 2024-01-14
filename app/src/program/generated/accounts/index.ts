export * from './Lock'
export * from './Locker'

import { Locker } from './Locker'
import { Lock } from './Lock'

export const accountProviders = { Locker, Lock }
