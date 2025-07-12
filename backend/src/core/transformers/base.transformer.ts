export abstract class BaseTransformer<T = any, R = any> {
  /**
   * Transform a single item
   */
  transform(item: T): R | null {
    if (!item) return null;
    return this.toResource(item);
  }

  /**
   * Transform a collection of items
   */
  transformCollection(items: T[]): R[] {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => this.toResource(item)).filter(Boolean);
  }

  /**
   * Transform with pagination metadata
   */
  transformWithPagination(items: T[], pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }) {
    return {
      data: this.transformCollection(items),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  /**
   * Abstract method that must be implemented by child classes
   * This defines how to transform a single item to a resource
   */
  protected abstract toResource(item: T): R;

  /**
   * Helper method to safely get nested properties
   */
  protected getNestedValue(obj: any, path: string, defaultValue: any = null): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  }

  /**
   * Helper method to format dates
   */
  protected formatDate(date: Date | string | null): string | null {
    if (!date) return null;
    return new Date(date).toISOString();
  }

  /**
   * Helper method to include related data conditionally
   */
  protected includeRelation<T>(item: T, relationKey: string, transformer?: BaseTransformer): any {
    const relation = this.getNestedValue(item, relationKey);
    if (!relation) return null;
    
    if (transformer) {
      return Array.isArray(relation) 
        ? transformer.transformCollection(relation)
        : transformer.transform(relation);
    }
    
    return relation;
  }
} 