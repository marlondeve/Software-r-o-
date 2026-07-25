import axios from "axios"

import { healthUrl } from "@/api/config"
import type { HealthResponse } from "@/api/types"

export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await axios.get<HealthResponse>(healthUrl, {
    headers: {
      Accept: "application/json",
    },
  })
  return data
}
