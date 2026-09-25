import { useApiPrivate } from '../composables/useApi'

export const getServices = async () => {
  const api = useApiPrivate()
  const { data } = await api.get('/services?all=true')
  return data
}

export default {
  getServices,
}
