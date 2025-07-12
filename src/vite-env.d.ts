/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VAPI_PRIVATE_KEY: string
  readonly VITE_VAPI_ASSISTANT_ID: string
  readonly VITE_PHONE_NUMBER_ID: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 