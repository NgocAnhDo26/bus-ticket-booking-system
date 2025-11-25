import { apiClient } from '@/lib/api-client'
import { type DashboardResponse } from './types'
import { getMockDashboard } from './mocks'

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  try {
    const { data } = await apiClient.get<DashboardResponse>('/dashboard/summary')
    return data
  } catch {
    return getMockDashboard()
  }
}

