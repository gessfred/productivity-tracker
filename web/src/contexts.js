import { createContext } from "react"
export const auth0Ctx = createContext({
  domain: "dev-3whrke6z.us.auth0.com", //TODO extract in environment variables
  clientId: "y6wRUaGDpKoa3Nu7THsrLPigssB68zV3",
})

export const ctx = createContext({
  url: 'https://keylogg.amiscan.xyz'//'http://localhost:5002'
})
