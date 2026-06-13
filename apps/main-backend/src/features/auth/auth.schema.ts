// Request schemas live in @lovebook/core (the single Zod source feeding both
// sides). Re-exported here so feature code imports from one local place.
export {
  registerBodySchema as RegisterBody,
  loginBodySchema as LoginBody,
  refreshBodySchema as RefreshBody,
} from '@lovebook/core';
