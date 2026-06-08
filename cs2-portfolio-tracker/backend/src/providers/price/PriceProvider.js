/**
 * Contract every price provider must implement, so the rest of the app never
 * cares whether prices come from the Steam Community Market, a paid API, or
 * data scraped/exported from an extension like CS2Trader.
 *
 * Implementations must expose:
 *   name: string
 *   async getPrice(marketHashName) -> { price: number, currency: string, source: string } | null
 */
export class PriceProvider {
  get name() {
    throw new Error('PriceProvider subclasses must implement `name`');
  }

  // eslint-disable-next-line no-unused-vars
  async getPrice(marketHashName) {
    throw new Error('PriceProvider subclasses must implement getPrice()');
  }
}
