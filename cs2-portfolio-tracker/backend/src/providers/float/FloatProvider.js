/**
 * Contract every float provider must implement.
 *
 * Implementations must expose:
 *   name: string
 *   async getFloat(inspectLink) -> { float: number, paintSeed: number|null, paintIndex: number|null } | null
 */
export class FloatProvider {
  get name() {
    throw new Error('FloatProvider subclasses must implement `name`');
  }

  // eslint-disable-next-line no-unused-vars
  async getFloat(inspectLink) {
    throw new Error('FloatProvider subclasses must implement getFloat()');
  }
}
