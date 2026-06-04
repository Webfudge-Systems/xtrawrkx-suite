import strapiClient from '../strapiClient'

class BillingService {
  async getOverview() {
    return strapiClient.get('/billing/overview')
  }
}

const billingService = new BillingService()
export default billingService
