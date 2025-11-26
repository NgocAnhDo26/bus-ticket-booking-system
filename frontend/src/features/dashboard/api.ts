import { apiClient } from '@/lib/api-client'
import { type DashboardResponse } from './types'
import { getMockDashboard } from './mocks'

type DashboardApiResponse = {
  status: number
  message: string
  data: DashboardResponse
}

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  try {
    const response = await apiClient.get<DashboardApiResponse>('/dashboard/summary')
    return response.data.data
  } catch {
    return getMockDashboard()
  }
}

