export * from './Config'
export * from './ScheduledPayment'
export * from './TokenLock'
export * from './VestingSchedule'

import { Config } from './Config'
import { ScheduledPayment } from './ScheduledPayment'
import { TokenLock } from './TokenLock'
import { VestingSchedule } from './VestingSchedule'

export const accountProviders = {
  Config,
  ScheduledPayment,
  TokenLock,
  VestingSchedule,
}
