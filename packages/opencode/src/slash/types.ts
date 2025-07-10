import { z } from "zod"

export const SlashFunction = z.object({
  name: z.string().describe("Function name (without slash prefix)"),
  description: z.string().describe("Brief description of what the function does"),
  prompt: z.string().describe("The prompt template to execute"),
  context: z.array(z.string()).optional().describe("Context types to inject"),
  parameters: z.record(z.string()).optional().describe("Optional parameters"),
})

export type SlashFunction = z.infer<typeof SlashFunction>

export const SlashFunctionConfig = z.object({
  functions: z.record(SlashFunction),
})

export type SlashFunctionConfig = z.infer<typeof SlashFunctionConfig>

export namespace SlashFunction {
  export const Info = SlashFunction
  export type Info = SlashFunction
}